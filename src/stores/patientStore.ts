/**
 * 患者状态管理
 * 使用 Pinia 管理患者数据
 */
import { defineStore } from 'pinia';
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  searchPatients,
  type Patient,
  type CreatePatientRequest,
  type PatientListResponse,
} from 'src/services/patientService';

interface PatientState {
  patients: Patient[];
  currentPatient: Patient | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export const usePatientStore = defineStore('patient', {
  state: (): PatientState => ({
    patients: [],
    currentPatient: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
    },
  }),

  getters: {
    /**
     * 获取所有患者
     */
    allPatients: (state) => state.patients,

    /**
     * 根据 ID 获取患者
     */
    getPatientById: (state) => (id: number) => {
      return state.patients.find((p) => p.id === id);
    },

    /**
     * 获取患者总数
     */
    totalPatients: (state) => state.pagination.total,
  },

  actions: {
    /**
     * 获取患者列表
     */
    async fetchPatients(params?: { page?: number; limit?: number; search?: string }) {
      this.loading = true;
      this.error = null;

      try {
        const queryParams: { page: number; limit: number; search?: string } = {
          page: params?.page || this.pagination.page,
          limit: params?.limit || this.pagination.limit,
        };
        if (params?.search) {
          queryParams.search = params.search;
        }
        const response: PatientListResponse = await getPatients(queryParams);

        this.patients = response.patients;
        this.pagination = {
          page: response.page,
          limit: response.limit,
          total: response.total,
        };

        console.log(
          '✅ [PatientStore] 患者列表加载成功:',
          this.patients.length,
          '总数:',
          response.total,
        );
      } catch (error) {
        console.error('❌ [PatientStore] 获取患者列表失败:', error);
        this.error = error instanceof Error ? error.message : '获取患者列表失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 根据 ID 加载患者详情
     */
    async loadPatientById(id: number, forceRefresh = false) {
      // 优先从缓存获取
      if (!forceRefresh) {
        const cached = this.patients.find((p) => p.id === id);
        if (cached) {
          this.currentPatient = cached;
          return cached;
        }
      }

      this.loading = true;
      this.error = null;

      try {
        const patient = await getPatient(id);
        this.currentPatient = patient;

        // 更新缓存
        const index = this.patients.findIndex((p) => p.id === id);
        if (index >= 0) {
          this.patients[index] = patient;
        } else {
          this.patients.push(patient);
        }

        return patient;
      } catch (error) {
        console.error('❌ [PatientStore] 获取患者详情失败:', error);
        this.error = error instanceof Error ? error.message : '获取患者详情失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 创建新患者
     */
    async addPatient(data: CreatePatientRequest) {
      this.loading = true;
      this.error = null;

      try {
        const newPatient = await createPatient(data);
        this.patients.unshift(newPatient);
        this.pagination.total += 1;

        console.log('✅ [PatientStore] 患者创建成功:', newPatient.id);
        return newPatient;
      } catch (error) {
        console.error('❌ [PatientStore] 创建患者失败:', error);
        this.error = error instanceof Error ? error.message : '创建患者失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 更新患者信息
     */
    async editPatient(id: number, data: Partial<CreatePatientRequest>) {
      this.loading = true;
      this.error = null;

      try {
        const updated = await updatePatient(id, data);

        // 更新列表中的数据
        const index = this.patients.findIndex((p) => p.id === id);
        if (index >= 0) {
          this.patients[index] = updated;
        }

        // 更新当前选中的患者
        if (this.currentPatient?.id === id) {
          this.currentPatient = updated;
        }

        console.log('✅ [PatientStore] 患者更新成功:', id);
        return updated;
      } catch (error) {
        console.error('❌ [PatientStore] 更新患者失败:', error);
        this.error = error instanceof Error ? error.message : '更新患者失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 删除患者
     */
    async removePatient(id: number) {
      this.loading = true;
      this.error = null;

      try {
        await deletePatient(id);

        // 从列表中移除
        this.patients = this.patients.filter((p) => p.id !== id);
        this.pagination.total -= 1;

        // 清除当前选中
        if (this.currentPatient?.id === id) {
          this.currentPatient = null;
        }

        console.log('✅ [PatientStore] 患者删除成功:', id);
      } catch (error) {
        console.error('❌ [PatientStore] 删除患者失败:', error);
        this.error = error instanceof Error ? error.message : '删除患者失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * 搜索患者
     */
    async search(keyword: string): Promise<Patient[]> {
      try {
        return await searchPatients(keyword);
      } catch (error) {
        console.error('❌ [PatientStore] 搜索患者失败:', error);
        return [];
      }
    },

    /**
     * 清除当前患者
     */
    clearCurrentPatient() {
      this.currentPatient = null;
    },
  },
});
