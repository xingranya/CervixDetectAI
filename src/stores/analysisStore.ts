import { defineStore } from 'pinia';
import { pollTaskStatus, getStudyAnalysis, getTaskStatus } from 'src/services/apiService';
import type { TaskStatusResponse } from 'src/services/apiService';

export interface AnalysisResult {
  diagnosis: string;
  confidence: number;
  recommendations: string[];
  suspiciousAreas?: string[];
  biomarkers?: {
    HPV: string;
    p16: string;
    Ki67: string;
  };
  detailedReport?: string;
}

export interface AnalysisTask {
  id: string;
  studyId: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  progress: number; // 0-100
  result?: AnalysisResult;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export const useAnalysisStore = defineStore('analysis', {
  state: () => ({
    tasks: [] as AnalysisTask[],
    currentTask: null as AnalysisTask | null,
    loading: false,
    error: null as string | null,
    pollingIntervals: new Map<string, NodeJS.Timeout>(),
  }),

  getters: {
    getTaskByStudyId: (state) => (studyId: string) => {
      return state.tasks.find((task) => task.studyId === studyId) || null;
    },
    getActiveTasks: (state) =>
      state.tasks.filter((task) => task.status === 'PENDING' || task.status === 'PROCESSING'),
    getCompletedTasks: (state) =>
      state.tasks.filter((task) => task.status === 'SUCCESS' || task.status === 'FAILED'),
  },

  actions: {
    /**
     * 获取任务状态（单次查询）
     */
    async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
      try {
        const response = await getTaskStatus(taskId);
        return response;
      } catch (error) {
        console.error('获取任务状态失败:', error);
        throw error;
      }
    },

    /**
     * 根据studyId获取分析结果（从后端查询）
     */
    async getAnalysisResult(studyId: string): Promise<AnalysisTask> {
      // 先查找本地缓存
      const existingTask = this.getTaskByStudyId(studyId);
      if (existingTask && existingTask.status === 'SUCCESS') {
        this.currentTask = existingTask;
        return existingTask;
      }

      // 从后端查询
      try {
        this.loading = true;
        const response = await getStudyAnalysis(studyId);
        
        // 转换为本地数据结构
        const task: AnalysisTask = {
          id: response.taskId,
          studyId: response.studyId,
          status: response.status,
          progress: response.progress,
          ...(response.result && { result: response.result }),
          ...(response.error && { error: response.error }),
          createdAt: response.createdAt,
          ...(response.completedAt && { completedAt: response.completedAt }),
        };

        // 更新或添加任务
        const taskIndex = this.tasks.findIndex((t) => t.id === task.id);
        if (taskIndex >= 0) {
          this.tasks.splice(taskIndex, 1, task);
        } else {
          this.tasks.push(task);
        }

        this.currentTask = task;
        return task;
      } catch (error) {
        console.error('获取分析结果失败:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 轮询任务状态
     */
    async pollTaskStatus(taskId: string): Promise<AnalysisTask> {
      console.log(`🔄 开始轮询任务: ${taskId}`);
      return new Promise((resolve, reject) => {
        pollTaskStatus(
          taskId,
          (status: TaskStatusResponse) => {
            console.log(`📊 任务状态更新: ${status.status}, 进度: ${status.progress}%`);
            
            // 更新任务状态
            const task: AnalysisTask = {
              id: status.taskId,
              studyId: status.studyId,
              status: status.status,
              progress: status.progress,
              ...(status.result && { result: status.result }),
              ...(status.error && { error: status.error }),
              createdAt: new Date().toISOString(),
              ...(status.status === 'SUCCESS' || status.status === 'FAILED' 
                ? { completedAt: new Date().toISOString() } 
                : {}),
            };

            const taskIndex = this.tasks.findIndex((t) => t.id === taskId);
            if (taskIndex >= 0) {
              this.tasks.splice(taskIndex, 1, task);
            } else {
              this.tasks.push(task);
            }

            this.currentTask = task;
          },
          2000,
          150
        )
          .then((finalStatus) => {
            console.log(`✅ 轮询完成! 最终状态: ${finalStatus.status}`);
            
            const task: AnalysisTask = {
              id: finalStatus.taskId,
              studyId: finalStatus.studyId,
              status: finalStatus.status,
              progress: finalStatus.progress,
              ...(finalStatus.result && { result: finalStatus.result }),
              ...(finalStatus.error && { error: finalStatus.error }),
              createdAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
            };

            resolve(task);
          })
          .catch((error: unknown) => {
            console.error('❌ 轮询失败:', error);
            reject(error instanceof Error ? error : new Error(String(error)));
          });
      });
    },

    /**
     * 取消任务轮询
     */
    cancelPolling(taskId: string) {
      const interval = this.pollingIntervals.get(taskId);
      if (interval) {
        clearInterval(interval);
        this.pollingIntervals.delete(taskId);
      }
    },

    cancelAnalysisTask(taskId: string) {
      const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
      if (taskIndex === -1) {
        return;
      }

      const task = this.tasks[taskIndex];
      if (!task) {
        return;
      }

      const updatedTask: AnalysisTask = {
        ...task,
        status: 'FAILED',
        error: '用户取消',
      };

      this.tasks.splice(taskIndex, 1, updatedTask);

      if (this.currentTask && this.currentTask.id === taskId) {
        this.currentTask = updatedTask;
      }

      // 取消轮询
      this.cancelPolling(taskId);
    },
  },
});
