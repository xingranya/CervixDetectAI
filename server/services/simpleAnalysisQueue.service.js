/* eslint-disable @typescript-eslint/no-require-imports */
const analysisService = require('./analysisService');
const { markAnalysisTaskFailed } = analysisService;
const { prepareStudyImageForAnalysis } = require('./studyImageStorage.service');

/**
 * 简单的并发控制队列（无需 Redis）
 * 适用于小型部署或开发环境
 */

class SimpleTaskQueue {
  constructor(concurrency = 3) {
    this.concurrency = concurrency; // 最大并发数
    this.running = 0; // 当前运行任务数
    this.queue = []; // 等待队列
  }

  /**
   * 添加任务到队列
   * @param {Function} taskFn - 异步任务函数
   * @param {string} taskId - 任务 ID（用于日志）
   */
  async add(taskFn, taskId) {
    if (this.running < this.concurrency) {
      // 有空闲槽位，立即执行
      this._execute(taskFn, taskId);
    } else {
      // 无空闲槽位，加入队列
      console.log(
        `⏳ [SimpleQueue] 任务排队中 - TaskID=${taskId}, 当前运行=${this.running}, 队列长度=${this.queue.length}`,
      );
      await new Promise((resolve, reject) => {
        this.queue.push({ taskFn, resolve, reject, taskId });
      });
    }
  }

  /**
   * 执行任务
   * @private
   */
  async _execute(taskFn, taskId) {
    this.running += 1;
    try {
      console.log(
        ` [SimpleQueue] 开始执行 - TaskID=${taskId}, 当前并发=${this.running}/${this.concurrency}`,
      );
      await taskFn();
      console.log(`✅ [SimpleQueue] 任务完成 - TaskID=${taskId}`);
    } catch (error) {
      console.error(`❌ [SimpleQueue] 任务失败 - TaskID=${taskId}`, error.message);
      throw error;
    } finally {
      this.running -= 1;
      this._processQueue();
    }
  }

  /**
   * 处理队列中的下一个任务
   * @private
   */
  _processQueue() {
    if (this.queue.length > 0 && this.running < this.concurrency) {
      const next = this.queue.shift();
      console.log(
        `📝 [SimpleQueue] 从队列取出 - TaskID=${next.taskId}, 剩余队列=${this.queue.length}`,
      );
      this._execute(next.taskFn, next.taskId).then(next.resolve).catch(next.reject);
    }
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      running: this.running,
      waiting: this.queue.length,
      concurrency: this.concurrency,
    };
  }
}

// 创建全局分析任务队列实例
const MAX_CONCURRENT_ANALYSIS = parseInt(process.env.MAX_CONCURRENT_ANALYSIS || '') || 3;
const analysisTaskQueue = new SimpleTaskQueue(MAX_CONCURRENT_ANALYSIS);

/**
 * 将分析任务加入队列
 * @param {number} analysisTaskId - 数据库任务 ID
 * @param {number} studyId - 病例 ID
 * @param {Object} studyImage - 图像对象
 */
async function queueAnalysisTask(analysisTaskId, studyId, studyImage) {
  const preparedImage = await prepareStudyImageForAnalysis(studyImage);
  if (!preparedImage.imagePath) {
    await markAnalysisTaskFailed({
      analysisTaskId,
      studyId,
      error: '图像路径解析失败，无法开始分析',
    });
    return;
  }

  // 添加到队列
  await analysisTaskQueue.add(async () => {
    try {
      await analysisService.processTask(analysisTaskId, preparedImage.imagePath, studyId);
    } finally {
      if (preparedImage.cleanup) {
        await preparedImage.cleanup();
      }
    }
  }, `Task_${analysisTaskId}`);
}

module.exports = {
  SimpleTaskQueue,
  analysisTaskQueue,
  queueAnalysisTask,
};
