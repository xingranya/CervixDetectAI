import { defineStore } from 'pinia';
import type { AnalysisResult } from './analysisStore';
import { studyAPI, analysisTaskAPI } from 'src/services/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Study {
  id: number;
  study_id: string;
  patient_id: number;
  patientName: string;
  patientId: string;
  studyDate: string; // ISO date string
  status: 'pending' | 'completed' | 'processing' | 'failed';
  study_type: string;
  modality: string;
  bodyPart: string;
  description?: string;
  imageUrl?: string; // URL to the medical image
  images?: Array<{ id: number; file_path: string; original_filename: string }>;
  analysisResult?: AnalysisResult; // Result from AI analysis
  uploadedAt: string; // ISO date string
  created_at: string;
  taskId?: number; // Backend task ID for tracking
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
          this.studies = response.data.studies.map((study: any) => ({
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
            imageUrl: study.images?.[0]?.file_path,
            uploadedAt: study.created_at,
            created_at: study.created_at,
          }));
          console.log('✅ [fetchStudies] 已映射病例数据，共', this.studies.length, '条');
          console.log('📊 [fetchStudies] 病例列表:', this.studies);
          return this.studies;
        } else {
          console.error('❌ [fetchStudies] API 返回失败:', response);
        }
      } catch (error: any) {
        console.error('❌ [fetchStudies] 请求失败:', error);
        console.error('❌ [fetchStudies] 错误详情:', error.response?.data);
        this.error = error.response?.data?.message || '获取病例列表失败';
        throw error;
      } finally {
        this.loading = false;
        console.log('🏁 [fetchStudies] 结束，loading =', this.loading);
      }
    },

    async loadStudyById(id: number) {
      const existingStudy = this.studies.find((study) => study.id === id);
      if (existingStudy) {
        this.currentStudy = existingStudy;
        return existingStudy;
      }

      this.loading = true;
      this.error = null;

      try {
        const response = await studyAPI.getStudy(id);
        if (response.success) {
          const study = {
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
            imageUrl: response.data.study.images?.[0]?.file_path,
            uploadedAt: response.data.study.created_at,
            created_at: response.data.study.created_at,
          };
          this.currentStudy = study;
          return study;
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || '获取病例详情失败';
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
          };

          // Upload images if provided
          if (studyData.images && studyData.images.length > 0) {
            const imagesResponse = await studyAPI.uploadImages(newStudy.id, studyData.images);
            if (imagesResponse.success) {
              newStudy.images = imagesResponse.data.images;
              newStudy.imageUrl = imagesResponse.data.images[0]?.file_path;
            }
          }

          this.studies.unshift(newStudy);
          this.currentStudy = newStudy;

          // Create analysis task
          if (newStudy.images && newStudy.images.length > 0) {
            await analysisTaskAPI.createTask({ study_id: newStudy.id });
            newStudy.status = 'processing';
          }

          return newStudy;
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || '创建病例失败';
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
      } catch (error: any) {
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
      } catch (error: any) {
        this.error = error.response?.data?.message || '删除病例失败';
        throw error;
      }
    },
  },
});
