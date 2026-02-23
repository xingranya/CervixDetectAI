import { defineStore } from 'pinia';
import type { AnalysisResult } from './analysisStore';
import { studyAPI, analysisTaskAPI } from 'src/services/api';
import type { StudyRaw } from 'src/services/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * 计算静态资源的服务端基础地址
 */
const getServerBaseUrl = (apiBaseUrl: string): string => {
  if (!apiBaseUrl) return '';
  const apiIndex = apiBaseUrl.indexOf('/api');
  if (apiIndex === -1) {
    return apiBaseUrl.replace(/\/$/, '');
  }
  return apiBaseUrl.slice(0, apiIndex);
};

const SERVER_BASE_URL = getServerBaseUrl(API_BASE_URL);

type LatestTaskStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

/**
 * 将相对路径转换为完整URL
 */
function getImageUrl(filePath: string | undefined): string | undefined {
  if (!filePath) return undefined;
  // 如果已经是完整URL，直接返回
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  // 否则拼接服务器地址
  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${SERVER_BASE_URL}${normalizedPath}`;
}

/**
 * 标准化任务状态（兼容大小写与历史值）
 */
function normalizeLatestTaskStatus(status: string | undefined): LatestTaskStatus | undefined {
  if (!status) return undefined;

  const normalized = status.toUpperCase();
  if (normalized === 'PENDING') return 'PENDING';
  if (normalized === 'PROCESSING' || normalized === 'RUNNING') return 'PROCESSING';
  if (normalized === 'SUCCESS' || normalized === 'COMPLETED') return 'SUCCESS';
  if (normalized === 'FAILED' || normalized === 'CANCELLED' || normalized === 'CANCELED') {
    return 'FAILED';
  }
  return undefined;
}

/**
 * 获取病例最新任务状态
 */
function resolveLatestTaskStatus(
  tasks: Array<{ status: string; created_at: string }> | undefined,
): LatestTaskStatus | undefined {
  if (!tasks || tasks.length === 0) return undefined;
  const latest = [...tasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  return normalizeLatestTaskStatus(latest?.status);
}

export interface Study {
  id: number;
  study_id: string;
  patient_id: number;
  patientName: string;
  patientId: string;
  studyDate: string; // ISO date string
  status: 'pending' | 'completed' | 'processing' | 'failed' | 'uploaded';
  study_type: string;
  modality: string;
  bodyPart: string;
  description?: string | undefined;
  imageUrl?: string; // URL to the medical image
  images?: Array<{ id: number; file_path: string; original_filename: string }> | undefined;
  analysisResult?: AnalysisResult; // Result from AI analysis
  uploadedAt: string; // ISO date string
  created_at: string;
  taskId?: string; // Backend task ID for tracking
  // 报告中心所需字段
  downloaded?: boolean;
  downloaded_at?: string | undefined;
  diagnosis?: string | undefined;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical' | undefined;
  confidence?: number | undefined;
  latestTaskStatus?: LatestTaskStatus | undefined;
}

export const useStudyStore = defineStore('study', {
  state: () => ({
    studies: [] as Study[],
    currentStudy: null as Study | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    allStudies: (state) => state.studies,
    getStudyById: (state) => (id: string) => {
      const numId = parseInt(id);
      return state.studies.find((study) => study.id === numId) || null;
    },
    completedStudies: (state) => state.studies.filter((study) => study.status === 'completed'),
    processingStudies: (state) => state.studies.filter((study) => study.status === 'processing'),
    recentStudies: (state) =>
      [...state.studies]
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .slice(0, 5),
  },

  actions: {
    async fetchStudies(params?: {
      page?: number;
      limit?: number;
      patient_id?: number;
      status?: string;
    }) {
      console.log('📋 [fetchStudies] 开始获取病例列表', params);
      this.loading = true;
      this.error = null;

      try {
        console.log('📡 [fetchStudies] 调用 API: /api/studies');
        const response = await studyAPI.getStudies(params);
        console.log('✅ [fetchStudies] API 响应:', response);

        if (response.success) {
          // Map backend data to frontend format
          this.studies = response.data.studies.map((study: StudyRaw) => {
            const imageUrl = getImageUrl(study.images?.[0]?.file_path);
            const latestTaskStatus = resolveLatestTaskStatus(study.analysis_tasks);
            return {
              id: study.id,
              study_id: study.study_id,
              patient_id: study.patient_id,
              patientName: study.patient?.name || '',
              patientId: study.patient?.patient_id || '',
              studyDate: study.study_date,
              status: study.status,
              study_type: study.study_type,
              modality: study.study_type,
              bodyPart: '宫颈',
              description: study.description,
              images: study.images,
              ...(imageUrl ? { imageUrl } : {}),
              uploadedAt: study.created_at,
              created_at: study.created_at,
              // 新增字段
              downloaded: study.downloaded || false,
              downloaded_at: study.downloaded_at,
              diagnosis: study.analysis_results?.[0]?.diagnosis,
              riskLevel: study.analysis_results?.[0]?.risk_level,
              confidence: study.analysis_results?.[0]?.confidence,
              latestTaskStatus,
            };
          });
          console.log('✅ [fetchStudies] 已映射病例数据，共', this.studies.length, '条');
          console.log('📊 [fetchStudies] 病例列表:', this.studies);
          return this.studies;
        } else {
          console.error('❌ [fetchStudies] API 返回失败:', response);
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        console.error('❌ [fetchStudies] 请求失败:', error);
        this.error = err.response?.data?.message || '获取病例列表失败';
        throw error;
      } finally {
        this.loading = false;
        console.log('🏁 [fetchStudies] 结束，loading =', this.loading);
      }
    },

    async loadStudyById(id: number, forceRefresh = false) {
      const existingStudy = this.studies.find((study) => study.id === id);
      if (existingStudy && !forceRefresh) {
        this.currentStudy = existingStudy;
        return existingStudy;
      }

      this.loading = true;
      this.error = null;

      try {
        const response = await studyAPI.getStudy(id);
        if (response.success) {
          const imageUrl = getImageUrl(response.data.study.images?.[0]?.file_path);

          // 获取最新的分析结果
          const latestResult = response.data.study.analysis_results?.[0];
          const latestTaskStatus = resolveLatestTaskStatus(response.data.study.analysis_tasks);
          let analysisResult: AnalysisResult | undefined;

          if (latestResult) {
            analysisResult = {
              diagnosis: latestResult.diagnosis || '',
              confidence: latestResult.confidence || 0,
              recommendations: latestResult.recommendations || [],
              suspiciousAreas: latestResult.suspicious_areas || [],
              biomarkers: latestResult.biomarkers,
              detailedReport: latestResult.detailed_report,
            };
          }

          const study: Study = {
            id: response.data.study.id,
            study_id: response.data.study.study_id,
            patient_id: response.data.study.patient_id,
            patientName: response.data.study.patient?.name || '',
            patientId: response.data.study.patient?.patient_id || '',
            studyDate: response.data.study.study_date,
            status: response.data.study.status,
            study_type: response.data.study.study_type,
            modality: response.data.study.study_type,
            bodyPart: '宫颈',
            description: response.data.study.description,
            images: response.data.study.images,
            ...(imageUrl ? { imageUrl } : {}),
            uploadedAt: response.data.study.created_at,
            created_at: response.data.study.created_at,
            // 分析结果
            ...(analysisResult ? { analysisResult } : {}),
            // 新增字段
            downloaded: response.data.study.downloaded || false,
            downloaded_at: response.data.study.downloaded_at,
            diagnosis: latestResult?.diagnosis,
            riskLevel: latestResult?.risk_level,
            confidence: latestResult?.confidence,
            latestTaskStatus,
          };

          // 检查是否有进行中的任务
          const analysisTasks = response.data.study.analysis_tasks;
          if (analysisTasks && analysisTasks.length > 0) {
            // 按创建时间倒序排列
            const tasks = [...analysisTasks].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            );
            const latestTask = tasks[0];
            if (latestTask && ['PENDING', 'PROCESSING'].includes(latestTask.status)) {
              study.taskId = latestTask.task_id;
              study.status = 'processing';
              study.latestTaskStatus = normalizeLatestTaskStatus(latestTask.status);
            }
          }

          this.currentStudy = study;

          // 更新 studies 列表中的数据
          const existingIndex = this.studies.findIndex((s) => s.id === id);
          if (existingIndex >= 0) {
            this.studies[existingIndex] = study;
          } else {
            this.studies.push(study);
          }

          return study;
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        this.error = err.response?.data?.message || '获取病例详情失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createStudy(studyData: {
      patient_id: number;
      study_date: string;
      study_type: string;
      description?: string;
      images?: File[];
    }) {
      this.loading = true;
      this.error = null;

      try {
        // Create study
        const response = await studyAPI.createStudy({
          patient_id: studyData.patient_id,
          study_date: studyData.study_date,
          study_type: studyData.study_type,
          description: studyData.description,
        });

        if (response.success) {
          const newStudy: Study = {
            id: response.data.study.id,
            study_id: response.data.study.study_id,
            patient_id: response.data.study.patient_id,
            patientName: response.data.study.patient?.name || '',
            patientId: response.data.study.patient?.patient_id || '',
            studyDate: response.data.study.study_date,
            status: 'pending',
            study_type: response.data.study.study_type,
            modality: response.data.study.study_type,
            bodyPart: '宫颈',
            description: response.data.study.description,
            uploadedAt: response.data.study.created_at,
            created_at: response.data.study.created_at,
            latestTaskStatus: undefined,
          };

          // Upload images if provided
          if (studyData.images && studyData.images.length > 0) {
            const imagesResponse = await studyAPI.uploadImages(newStudy.id, studyData.images);
            if (imagesResponse.success) {
              newStudy.images = imagesResponse.data.images;
              const imageUrl = getImageUrl(imagesResponse.data.images[0]?.file_path);
              if (imageUrl) {
                newStudy.imageUrl = imageUrl;
              }
            }
          }

          this.studies.unshift(newStudy);
          this.currentStudy = newStudy;

          // Create analysis task
          if (newStudy.images && newStudy.images.length > 0) {
            await analysisTaskAPI.createTask({ study_id: newStudy.id });
            newStudy.status = 'processing';
            newStudy.latestTaskStatus = 'PENDING';
          }

          return newStudy;
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        this.error = err.response?.data?.message || '创建病例失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateStudyStatus(studyId: number, status: Study['status']) {
      const studyIndex = this.studies.findIndex((s) => s.id === studyId);
      if (studyIndex === -1) {
        return;
      }

      try {
        await studyAPI.updateStudy(studyId, { status });

        const study = this.studies[studyIndex];
        if (!study) {
          return;
        }

        const updatedStudy: Study = { ...study, status };
        this.studies.splice(studyIndex, 1, updatedStudy);

        if (this.currentStudy && this.currentStudy.id === studyId) {
          this.currentStudy = updatedStudy;
        }
      } catch (error: unknown) {
        console.error('更新病例状态失败:', error);
      }
    },

    updateStudyAnalysisResult(studyId: number, analysisResult: AnalysisResult) {
      const studyIndex = this.studies.findIndex((s) => s.id === studyId);
      if (studyIndex === -1) {
        return;
      }

      const study = this.studies[studyIndex];
      if (!study) {
        return;
      }

      const updatedStudy: Study = { ...study, analysisResult, status: 'completed' };
      this.studies.splice(studyIndex, 1, updatedStudy);

      if (this.currentStudy && this.currentStudy.id === studyId) {
        this.currentStudy = updatedStudy;
      }
    },

    async deleteStudy(studyId: number) {
      try {
        await studyAPI.deleteStudy(studyId);
        const index = this.studies.findIndex((s) => s.id === studyId);
        if (index !== -1) {
          this.studies.splice(index, 1);
        }
        if (this.currentStudy?.id === studyId) {
          this.currentStudy = null;
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        this.error = err.response?.data?.message || '删除病例失败';
        throw error;
      }
    },

    async uploadImage(studyId: number, file: File) {
      this.loading = true;
      this.error = null;

      try {
        const response = await studyAPI.uploadImages(studyId, [file]);
        if (response.success) {
          // Update local study data with new image
          if (this.currentStudy && this.currentStudy.id === studyId) {
            const newImages = response.data.images;
            this.currentStudy.images = newImages;
            const imageUrl = getImageUrl(newImages[0]?.file_path);
            if (imageUrl) {
              this.currentStudy.imageUrl = imageUrl;
            }

            // Update in list as well
            const listIndex = this.studies.findIndex((s) => s.id === studyId);
            if (listIndex !== -1) {
              this.studies[listIndex] = { ...this.currentStudy };
            }
          }
          return true;
        }
        return false;
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        this.error = err.response?.data?.message || '上传影像失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
