import { defineStore } from 'pinia';
import type { AnalysisResult } from './analysisStore';
import { analysisTaskAPI, studyAPI } from 'src/services/api';
import type { StudyRaw } from 'src/services/api';
import type { StudiesPaginationState, Study } from 'src/types/study';
import { getImageUrl } from 'src/utils/mappers';
import { mapStudyRawToStudy } from 'src/utils/studyMappers';

const DEFAULT_PAGINATION: StudiesPaginationState = {
  total: 0,
  page: 1,
  limit: 10,
};

export type { LatestTaskStatus, Study, StudyDisplayStatus } from 'src/types/study';

export const useStudyStore = defineStore('study', {
  state: () => ({
    studies: [] as Study[],
    currentStudy: null as Study | null,
    loading: false,
    error: null as string | null,
    pagination: { ...DEFAULT_PAGINATION },
  }),

  getters: {
    allStudies: (state) => state.studies,
    getStudyById: (state) => (id: string) => {
      const numId = Number.parseInt(id, 10);
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
      search?: string;
    }) {
      this.loading = true;
      this.error = null;

      try {
        const response = await studyAPI.getStudies(params);
        if (response.success) {
          this.studies = response.data.studies.map((study: StudyRaw) => mapStudyRawToStudy(study));

          this.pagination = {
            total: response.data.pagination?.total ?? this.studies.length,
            page: response.data.pagination?.page ?? params?.page ?? DEFAULT_PAGINATION.page,
            limit: response.data.pagination?.limit ?? params?.limit ?? DEFAULT_PAGINATION.limit,
          };

          return this.studies;
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        this.error = err.response?.data?.message || '获取病例列表失败';
        throw error;
      } finally {
        this.loading = false;
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
          const study = mapStudyRawToStudy(response.data.study);
          this.currentStudy = study;

          const existingIndex = this.studies.findIndex((item) => item.id === id);
          if (existingIndex >= 0) {
            this.studies.splice(existingIndex, 1, study);
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
        const response = await studyAPI.createStudy({
          patient_id: studyData.patient_id,
          study_date: studyData.study_date,
          study_type: studyData.study_type,
          description: studyData.description,
        });

        if (response.success) {
          const newStudy = mapStudyRawToStudy(response.data.study);

          if (studyData.images?.length) {
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
          this.pagination.total += 1;

          if (newStudy.images?.length) {
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
      const studyIndex = this.studies.findIndex((study) => study.id === studyId);
      if (studyIndex === -1) return;

      try {
        await studyAPI.updateStudy(studyId, { status });
        const study = this.studies[studyIndex];
        if (!study) return;

        const updatedStudy: Study = { ...study, status };
        this.studies.splice(studyIndex, 1, updatedStudy);

        if (this.currentStudy?.id === studyId) {
          this.currentStudy = updatedStudy;
        }
      } catch (error: unknown) {
        console.error('更新病例状态失败:', error);
      }
    },

    updateStudyAnalysisResult(studyId: number, analysisResult: AnalysisResult) {
      const studyIndex = this.studies.findIndex((study) => study.id === studyId);
      if (studyIndex === -1) return;

      const study = this.studies[studyIndex];
      if (!study) return;

      const updatedStudy: Study = {
        ...study,
        analysisResult,
        status: 'completed',
        diagnosis: analysisResult.diagnosis,
        confidence: analysisResult.confidence,
        latestTaskStatus: 'SUCCESS',
      };

      this.studies.splice(studyIndex, 1, updatedStudy);

      if (this.currentStudy?.id === studyId) {
        this.currentStudy = updatedStudy;
      }
    },

    async deleteStudy(studyId: number) {
      try {
        await studyAPI.deleteStudy(studyId);
        const index = this.studies.findIndex((study) => study.id === studyId);
        if (index !== -1) {
          this.studies.splice(index, 1);
          this.pagination.total = Math.max(0, this.pagination.total - 1);
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
        if (response.success && this.currentStudy?.id === studyId) {
          const newImages = response.data.images;
          this.currentStudy.images = newImages;
          const imageUrl = getImageUrl(newImages[0]?.file_path);
          if (imageUrl) {
            this.currentStudy.imageUrl = imageUrl;
          }

          const listIndex = this.studies.findIndex((study) => study.id === studyId);
          if (listIndex !== -1) {
            this.studies[listIndex] = { ...this.currentStudy };
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
