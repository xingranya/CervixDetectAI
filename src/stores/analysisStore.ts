import { defineStore } from 'pinia';
import { pollTaskStatus, getStudyAnalysis, getTaskStatus } from 'src/services/apiService';
import type { TaskStatusResponse } from 'src/services/apiService';

export interface SuspiciousArea {
  box_2d?: number[];
  description?: string;
}

export interface AnalysisResult {
  diagnosis: string;
  confidence: number;
  recommendations: string[];
  suspiciousAreas?: SuspiciousArea[];
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

/**
 * 后端API返回的任务数据结构
 */
interface ApiTaskResponse {
  task_id: string;
  study_id: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  progress: number;
  created_at: string;
  completed_at?: string;
  error?: string;
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
    /**
     * 获取指定 studyId 的最新任务（按创建时间倒序）
     */
    getTaskByStudyId: (state) => (studyId: string) => {
      const matchingTasks = state.tasks.filter((task) => task.studyId === studyId);
      if (matchingTasks.length === 0) return null;
      // 按创建时间倒序排序，返回最新的任务
      return matchingTasks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0] || null;
    },
    /**
     * 获取指定 studyId 的最新进行中的任务
     */
    getActiveTaskByStudyId: (state) => (studyId: string) => {
      const matchingTasks = state.tasks.filter(
        (task) => task.studyId === studyId && 
          (task.status === 'PENDING' || task.status === 'PROCESSING')
      );
      if (matchingTasks.length === 0) return null;
      return matchingTasks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0] || null;
    },
    getActiveTasks: (state) =>
      state.tasks.filter((task) => task.status === 'PENDING' || task.status === 'PROCESSING'),
    getCompletedTasks: (state) =>
      state.tasks.filter((task) => task.status === 'SUCCESS' || task.status === 'FAILED'),
  },

  actions: {
    /**
     * 从后端获取分析任务列表
     */
    async fetchTasks(params?: { study_id?: number; status?: string }) {
      try {
        this.loading = true;
        const { analysisTaskAPI } = await import('src/services/api');
        const response = await analysisTaskAPI.getTasks(params);

        if (response.success && response.data.tasks) {
          // 更新任务列表
          const tasks: AnalysisTask[] = response.data.tasks.map((task: ApiTaskResponse) => ({
            id: task.task_id,
            studyId: task.study_id.toString(),
            status:
              task.status === 'pending'
                ? 'PENDING'
                : task.status === 'processing'
                  ? 'PROCESSING'
                  : task.status === 'success'
                    ? 'SUCCESS'
                    : 'FAILED',
            progress: task.progress || 0,
            createdAt: task.created_at,
            ...(task.completed_at && { completedAt: task.completed_at }),
            ...(task.error && { error: task.error }),
          }));

          // 合并到现有任务列表
          tasks.forEach((newTask) => {
            const existingIndex = this.tasks.findIndex((t) => t.id === newTask.id);
            if (existingIndex >= 0) {
              this.tasks[existingIndex] = newTask;
            } else {
              this.tasks.push(newTask);
            }
          });

          console.log('✅ 获取到分析任务列表:', tasks);
          return tasks;
        }
        return [];
      } catch (error) {
        console.error('获取任务列表失败:', error);
        this.error = '获取任务列表失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 将 API 响应的 result 转换为本地 AnalysisResult 类型
     */
    convertApiResult(apiResult: TaskStatusResponse['result']): AnalysisResult | undefined {
      if (!apiResult) return undefined;

      // 将 string[] 转换为 SuspiciousArea[]
      const suspiciousAreas: SuspiciousArea[] | undefined = apiResult.suspiciousAreas
        ? apiResult.suspiciousAreas.map((desc: string) => ({
            description: desc,
            // API 返回的是描述文本，没有坐标信息
            // box_2d 将在后端返回实际坐标时添加
          }))
        : undefined;

      // 使用展开运算符，只有当值存在时才添加可选属性
      return {
        diagnosis: apiResult.diagnosis,
        confidence: apiResult.confidence,
        recommendations: apiResult.recommendations,
        ...(suspiciousAreas && { suspiciousAreas }),
        ...(apiResult.biomarkers && { biomarkers: apiResult.biomarkers }),
        ...(apiResult.detailedReport && { detailedReport: apiResult.detailedReport }),
      };
    },

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
        const convertedResult = this.convertApiResult(response.result);
        const task: AnalysisTask = {
          id: response.taskId,
          studyId: response.studyId,
          status: response.status,
          progress: response.progress,
          ...(convertedResult && { result: convertedResult }),
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
            const convertedResult = this.convertApiResult(status.result);
            const task: AnalysisTask = {
              id: status.taskId,
              studyId: status.studyId,
              status: status.status,
              progress: status.progress,
              ...(convertedResult && { result: convertedResult }),
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
          150,
        )
          .then((finalStatus) => {
            console.log(`✅ 轮询完成! 最终状态: ${finalStatus.status}`);

            const convertedResult = this.convertApiResult(finalStatus.result);
            const task: AnalysisTask = {
              id: finalStatus.taskId,
              studyId: finalStatus.studyId,
              status: finalStatus.status,
              progress: finalStatus.progress,
              ...(convertedResult && { result: convertedResult }),
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
