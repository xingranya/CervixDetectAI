import { defineStore } from 'pinia';

export interface AnalysisResult {
  diagnosis: string;
  confidence: number;
  recommendations: string[];
  suspiciousAreas?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    type: string;
    confidence?: number;
  }>;
  biomarkers?: {
    HPV: string;
    p16: string;
    Ki67: string;
  };
  detailedReport?: string;
  heatmapData?: unknown;
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
    createAnalysisTask(studyId: string) {
      this.loading = true;
      this.error = null;

      return new Promise<AnalysisTask>((resolve) => {
        // Check if a task already exists for this study
        const existingTask = this.getTaskByStudyId(studyId);

        if (existingTask) {
          // If the task is already completed or failed, we'll create a new one
          if (existingTask.status === 'SUCCESS' || existingTask.status === 'FAILED') {
            this.tasks = this.tasks.filter((task) => task.studyId !== studyId);
          } else {
            // If it's still processing, return the existing task
            this.currentTask = existingTask;
            this.loading = false;
            resolve(existingTask);
            return;
          }
        }

        // Create new analysis task
        const newTask: AnalysisTask = {
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          studyId,
          status: 'PENDING',
          progress: 0,
          createdAt: new Date().toISOString(),
        };

        this.tasks.push(newTask);
        this.currentTask = newTask;

        // Simulate the analysis process
        this.simulateAnalysisProcess(newTask.id);

        this.loading = false;
        resolve(newTask);
      });
    },

    getAnalysisResult(studyId: string): Promise<AnalysisTask> {
      const task = this.getTaskByStudyId(studyId);
      if (task) {
        this.currentTask = task;
        return Promise.resolve(task);
      }

      // If no task exists, create one
      return this.createAnalysisTask(studyId);
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
    },

    simulateAnalysisProcess(taskId: string) {
      const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
      if (taskIndex === -1) return;

      const task = this.tasks[taskIndex];
      if (!task) return;

      // Update to processing
      const updatedTask: AnalysisTask = { ...task, status: 'PROCESSING' };
      this.tasks.splice(taskIndex, 1, updatedTask);
      if (this.currentTask && this.currentTask.id === taskId) {
        this.currentTask = updatedTask;
      }

      // Simulate progress
      const interval = setInterval(() => {
        const currentTask = this.tasks[taskIndex];
        if (!currentTask) {
          clearInterval(interval);
          return;
        }

        const currentProgress = currentTask.progress;
        if (currentProgress < 90) {
          const newProgress = Math.min(currentProgress + 10, 90);
          const updatedTaskProgress: AnalysisTask = {
            ...currentTask,
            progress: newProgress,
          };
          this.tasks.splice(taskIndex, 1, updatedTaskProgress);
          if (this.currentTask && this.currentTask.id === taskId) {
            this.currentTask = updatedTaskProgress;
          }
        }
      }, 500);

      // Simulate completion after random time (3-6 seconds)
      setTimeout(
        () => {
          clearInterval(interval);

          // Randomly determine success or failure for demo purposes
          const isSuccess = Math.random() > 0.1; // 90% success rate

          if (isSuccess) {
            const currentTask = this.tasks[taskIndex];
            if (!currentTask) {
              return;
            }
            const successTask: AnalysisTask = {
              ...currentTask,
              status: 'SUCCESS',
              progress: 100,
              completedAt: new Date().toISOString(),
              result: this.generateSimulatedResult(),
            };
            this.tasks.splice(taskIndex, 1, successTask);
          } else {
            const currentTask = this.tasks[taskIndex];
            if (!currentTask) {
              return;
            }
            const failedTask: AnalysisTask = {
              ...currentTask,
              status: 'FAILED',
              error: '因图像质量问题分析失败',
            };
            this.tasks.splice(taskIndex, 1, failedTask);
          }

          const updatedTask = this.tasks[taskIndex];
          if (updatedTask && this.currentTask && this.currentTask.id === taskId) {
            this.currentTask = updatedTask;
          }
        },
        3000 + Math.random() * 3000,
      );
    },

    generateSimulatedResult(): AnalysisResult {
      const diagnoses = ['正常', 'ASC-US', 'LSIL', 'HSIL', '浸润性癌'];
      const selectedDiagnosis = diagnoses[Math.floor(Math.random() * diagnoses.length)] ?? '正常';

      return {
        diagnosis: selectedDiagnosis,
        confidence: 0.7 + Math.random() * 0.25, // Between 0.7 and 0.95
        recommendations: this.generateRecommendations(selectedDiagnosis),
        suspiciousAreas:
          Math.random() > 0.5
            ? [
                {
                  x: Math.random(),
                  y: Math.random(),
                  width: 0.1 + Math.random() * 0.1,
                  height: 0.1 + Math.random() * 0.1,
                  type: 'abnormal',
                  confidence: 0.7 + Math.random() * 0.25,
                },
              ]
            : [],
        biomarkers: {
          HPV: Math.random() > 0.5 ? '阳性' : '阴性',
          p16: Math.random() > 0.7 ? '阳性' : '阴性',
          Ki67: Math.random() > 0.5 ? '高' : '低',
        },
        detailedReport: this.generateDetailedReport(selectedDiagnosis),
      };
    },

    generateRecommendations(diagnosis: string): string[] {
      switch (diagnosis) {
        case '正常':
          return ['一年后常规随访', '保持定期筛查'];
        case 'ASC-US':
          return ['建议HPV检测', '6个月后随访阴道镜检查'];
        case 'LSIL':
          return ['12个月后重复细胞学检查', '考虑HPV检测'];
        case 'HSIL':
          return ['建议立即阴道镜检查', '可能需要治疗'];
        case '浸润性癌':
          return ['紧急转诊至肿瘤科', '建议活检'];
        default:
          return ['咨询专科医生', '可能需要进一步检测'];
      }
    },

    generateDetailedReport(diagnosis: string): string {
      return `${diagnosis}诊断的宫颈细胞学分析报告。
      AI模型已在宫颈组织中识别出潜在异常。
      建议进一步临床评估。
      分析置信度：${((this.currentTask?.result?.confidence || 0) * 100).toFixed(1)}%。

      主要发现：
      - 细胞形态：${diagnosis === '正常' ? '正常' : '异常'}
      - 核质比：${diagnosis === '正常' ? '正常' : '增加'}
      - 核异型性：${diagnosis === '正常' ? '无' : '有'}

      建议：
      ${this.generateRecommendations(diagnosis)
        .map((r: string) => `- ${r}`)
        .join('\n')}`;
    },
  },
});
