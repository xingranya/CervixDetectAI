import { defineStore } from 'pinia';
import {
  patientInsightsAPI,
  type PatientInsightOverviewData,
  type PatientInsightHistoryData,
  type PatientInsightCompareData,
  type PatientInsightTimelineData,
  type PatientInsightRiskProfileData,
  type PatientInsightDiseaseAlertData,
  type PatientInsightComparisonData,
  type PatientInsightRiskFactorsData,
} from 'src/services/api';

interface PatientInsightsLoadingState {
  overview: boolean;
  history: boolean;
  compare: boolean;
  timeline: boolean;
  riskProfile: boolean;
  diseaseAlert: boolean;
  comparison: boolean;
  riskFactors: boolean;
}

interface PatientInsightsRequestTokens {
  overview: number;
  history: number;
  compare: number;
  timeline: number;
  riskProfile: number;
  diseaseAlert: number;
  comparison: number;
  riskFactors: number;
}

interface PatientInsightsState {
  currentPatientId: number | null;
  overview: PatientInsightOverviewData | null;
  history: PatientInsightHistoryData | null;
  compareResult: PatientInsightCompareData | null;
  timeline: PatientInsightTimelineData | null;
  riskProfile: PatientInsightRiskProfileData | null;
  diseaseAlert: PatientInsightDiseaseAlertData | null;
  comparisonResult: PatientInsightComparisonData | null;
  riskFactorsData: PatientInsightRiskFactorsData | null;
  loading: PatientInsightsLoadingState;
  requestSerial: number;
  requestTokens: PatientInsightsRequestTokens;
  error: string | null;
  historyFilters: {
    limit: number;
    date_from?: string;
    date_to?: string;
  };
  timelineFilters: {
    page: number;
    limit: number;
    date_from?: string;
    date_to?: string;
  };
}

export const usePatientInsightsStore = defineStore('patientInsights', {
  state: (): PatientInsightsState => ({
    currentPatientId: null,
    overview: null,
    history: null,
    compareResult: null,
    timeline: null,
    riskProfile: null,
    diseaseAlert: null,
    comparisonResult: null,
    riskFactorsData: null,
    loading: {
      overview: false,
      history: false,
      compare: false,
      timeline: false,
      riskProfile: false,
      diseaseAlert: false,
      comparison: false,
      riskFactors: false,
    },
    requestSerial: 0,
    requestTokens: {
      overview: 0,
      history: 0,
      compare: 0,
      timeline: 0,
      riskProfile: 0,
      diseaseAlert: 0,
      comparison: 0,
      riskFactors: 0,
    },
    error: null,
    historyFilters: {
      limit: 120,
      date_from: '',
      date_to: '',
    },
    timelineFilters: {
      page: 1,
      limit: 20,
      date_from: '',
      date_to: '',
    },
  }),

  getters: {
    isLoading: (state) =>
      state.loading.overview ||
      state.loading.history ||
      state.loading.compare ||
      state.loading.timeline ||
      state.loading.riskProfile ||
      state.loading.diseaseAlert ||
      state.loading.comparison ||
      state.loading.riskFactors,

    studyOptions: (state) => {
      if (!state.history?.series?.length) {
        return [] as Array<{ label: string; value: number }>;
      }

      const map = new Map<number, { label: string; value: number; date: string }>();
      state.history.series.forEach((item) => {
        if (!item.study_id) return;
        if (map.has(item.study_id)) return;

        const date = item.study_date ? new Date(item.study_date).toLocaleDateString('zh-CN') : '未知日期';
        const label = `${item.study_unique_id || `病例${item.study_id}`} · ${date}`;
        map.set(item.study_id, {
          label,
          value: item.study_id,
          date: item.study_date || '',
        });
      });

      return [...map.values()]
        .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
        .map(({ label, value }) => ({ label, value }));
    },
  },

  actions: {
    reset() {
      this.currentPatientId = null;
      this.overview = null;
      this.history = null;
      this.compareResult = null;
      this.timeline = null;
      this.riskProfile = null;
      this.diseaseAlert = null;
      this.comparisonResult = null;
      this.riskFactorsData = null;
      this.error = null;
      this.loading = {
        overview: false,
        history: false,
        compare: false,
        timeline: false,
        riskProfile: false,
        diseaseAlert: false,
        comparison: false,
        riskFactors: false,
      };
      this.requestTokens = {
        overview: 0,
        history: 0,
        compare: 0,
        timeline: 0,
        riskProfile: 0,
        diseaseAlert: 0,
        comparison: 0,
        riskFactors: 0,
      };
      this.historyFilters = {
        limit: 120,
        date_from: '',
        date_to: '',
      };
      this.timelineFilters = {
        page: 1,
        limit: 20,
        date_from: '',
        date_to: '',
      };
    },

    ensurePatient(patientId: number) {
      if (this.currentPatientId !== patientId) {
        this.reset();
        this.currentPatientId = patientId;
      }
    },

    nextRequestToken(key: keyof PatientInsightsRequestTokens) {
      this.requestSerial += 1;
      const token = this.requestSerial;
      this.requestTokens[key] = token;
      return token;
    },

    isActiveRequest(
      key: keyof PatientInsightsRequestTokens,
      token: number,
      patientId: number,
    ) {
      return this.currentPatientId === patientId && this.requestTokens[key] === token;
    },

    async fetchOverview(patientId: number) {
      this.ensurePatient(patientId);
      const token = this.nextRequestToken('overview');
      this.loading.overview = true;
      this.error = null;
      try {
        const response = await patientInsightsAPI.getOverview(patientId);
        if (!this.isActiveRequest('overview', token, patientId)) {
          return this.overview;
        }
        this.overview = response.data;
        return response.data;
      } catch (error) {
        if (!this.isActiveRequest('overview', token, patientId)) {
          return this.overview;
        }
        this.error = error instanceof Error ? error.message : '获取患者总览失败';
        throw error;
      } finally {
        if (this.isActiveRequest('overview', token, patientId)) {
          this.loading.overview = false;
        }
      }
    },

    async fetchHistory(
      patientId: number,
      filters?: Partial<PatientInsightsState['historyFilters']>,
    ) {
      this.ensurePatient(patientId);
      const token = this.nextRequestToken('history');
      this.loading.history = true;
      this.error = null;
      this.historyFilters = {
        ...this.historyFilters,
        ...filters,
      };

      try {
        const historyParams: {
          limit?: number;
          date_from?: string;
          date_to?: string;
        } = {
          limit: this.historyFilters.limit,
        };
        if (this.historyFilters.date_from) {
          historyParams.date_from = this.historyFilters.date_from;
        }
        if (this.historyFilters.date_to) {
          historyParams.date_to = this.historyFilters.date_to;
        }

        const response = await patientInsightsAPI.getHistory(patientId, historyParams);
        if (!this.isActiveRequest('history', token, patientId)) {
          return this.history;
        }
        this.history = response.data;
        return response.data;
      } catch (error) {
        if (!this.isActiveRequest('history', token, patientId)) {
          return this.history;
        }
        this.error = error instanceof Error ? error.message : '获取患者历史趋势失败';
        throw error;
      } finally {
        if (this.isActiveRequest('history', token, patientId)) {
          this.loading.history = false;
        }
      }
    },

    async fetchCompare(patientId: number, leftStudyId: number, rightStudyId: number) {
      this.ensurePatient(patientId);
      const token = this.nextRequestToken('compare');
      this.loading.compare = true;
      this.error = null;
      try {
        const response = await patientInsightsAPI.getCompare(patientId, leftStudyId, rightStudyId);
        if (!this.isActiveRequest('compare', token, patientId)) {
          return this.compareResult;
        }
        this.compareResult = response.data;
        return response.data;
      } catch (error) {
        if (!this.isActiveRequest('compare', token, patientId)) {
          return this.compareResult;
        }
        this.error = error instanceof Error ? error.message : '获取患者对比数据失败';
        throw error;
      } finally {
        if (this.isActiveRequest('compare', token, patientId)) {
          this.loading.compare = false;
        }
      }
    },

    async fetchTimeline(
      patientId: number,
      filters?: Partial<PatientInsightsState['timelineFilters']>,
    ) {
      this.ensurePatient(patientId);
      const token = this.nextRequestToken('timeline');
      this.loading.timeline = true;
      this.error = null;
      this.timelineFilters = {
        ...this.timelineFilters,
        ...filters,
      };

      try {
        const timelineParams: {
          page?: number;
          limit?: number;
          date_from?: string;
          date_to?: string;
        } = {
          page: this.timelineFilters.page,
          limit: this.timelineFilters.limit,
        };
        if (this.timelineFilters.date_from) {
          timelineParams.date_from = this.timelineFilters.date_from;
        }
        if (this.timelineFilters.date_to) {
          timelineParams.date_to = this.timelineFilters.date_to;
        }

        const response = await patientInsightsAPI.getTimeline(patientId, timelineParams);
        if (!this.isActiveRequest('timeline', token, patientId)) {
          return this.timeline;
        }
        this.timeline = response.data;
        return response.data;
      } catch (error) {
        if (!this.isActiveRequest('timeline', token, patientId)) {
          return this.timeline;
        }
        this.error = error instanceof Error ? error.message : '获取患者时间线失败';
        throw error;
      } finally {
        if (this.isActiveRequest('timeline', token, patientId)) {
          this.loading.timeline = false;
        }
      }
    },

    async fetchRiskProfile(patientId: number) {
      this.ensurePatient(patientId);
      const token = this.nextRequestToken('riskProfile');
      this.loading.riskProfile = true;
      this.error = null;
      try {
        const response = await patientInsightsAPI.getRiskProfile(patientId);
        if (!this.isActiveRequest('riskProfile', token, patientId)) {
          return this.riskProfile;
        }
        this.riskProfile = response.data;
        return response.data;
      } catch (error) {
        if (!this.isActiveRequest('riskProfile', token, patientId)) {
          return this.riskProfile;
        }
        this.error = error instanceof Error ? error.message : '获取患者风险画像失败';
        throw error;
      } finally {
        if (this.isActiveRequest('riskProfile', token, patientId)) {
          this.loading.riskProfile = false;
        }
      }
    },

    async fetchInitial(patientId: number) {
      this.ensurePatient(patientId);
      const results = await Promise.allSettled([
        this.fetchOverview(patientId),
        this.fetchHistory(patientId),
        this.fetchTimeline(patientId),
        this.fetchRiskProfile(patientId),
      ]);

      if (results.every((item) => item.status === 'rejected')) {
        throw new Error('患者洞察数据全部加载失败');
      }
    },

    async fetchDiseaseAlert(patientId: number) {
      this.ensurePatient(patientId);
      const token = this.nextRequestToken('diseaseAlert');
      this.loading.diseaseAlert = true;
      this.error = null;
      try {
        const response = await patientInsightsAPI.getDiseaseAlert(patientId);
        if (!this.isActiveRequest('diseaseAlert', token, patientId)) {
          return this.diseaseAlert;
        }
        this.diseaseAlert = response.data;
        return response.data;
      } catch (error) {
        if (!this.isActiveRequest('diseaseAlert', token, patientId)) {
          return this.diseaseAlert;
        }
        this.error = error instanceof Error ? error.message : '获取疾病预警数据失败';
        throw error;
      } finally {
        if (this.isActiveRequest('diseaseAlert', token, patientId)) {
          this.loading.diseaseAlert = false;
        }
      }
    },

    async fetchComparison(
      patientId: number,
      params: {
        periodA_start: string;
        periodA_end: string;
        periodB_start: string;
        periodB_end: string;
      },
    ) {
      this.ensurePatient(patientId);
      const token = this.nextRequestToken('comparison');
      this.loading.comparison = true;
      this.error = null;
      try {
        const response = await patientInsightsAPI.getComparison(patientId, params);
        if (!this.isActiveRequest('comparison', token, patientId)) {
          return this.comparisonResult;
        }
        this.comparisonResult = response.data;
        return response.data;
      } catch (error) {
        if (!this.isActiveRequest('comparison', token, patientId)) {
          return this.comparisonResult;
        }
        this.error = error instanceof Error ? error.message : '获取对比分析数据失败';
        throw error;
      } finally {
        if (this.isActiveRequest('comparison', token, patientId)) {
          this.loading.comparison = false;
        }
      }
    },

    async fetchRiskFactors(patientId: number) {
      this.ensurePatient(patientId);
      const token = this.nextRequestToken('riskFactors');
      this.loading.riskFactors = true;
      this.error = null;
      try {
        const response = await patientInsightsAPI.getRiskFactors(patientId);
        if (!this.isActiveRequest('riskFactors', token, patientId)) {
          return this.riskFactorsData;
        }
        this.riskFactorsData = response.data;
        return response.data;
      } catch (error) {
        if (!this.isActiveRequest('riskFactors', token, patientId)) {
          return this.riskFactorsData;
        }
        this.error = error instanceof Error ? error.message : '获取风险因素分析数据失败';
        throw error;
      } finally {
        if (this.isActiveRequest('riskFactors', token, patientId)) {
          this.loading.riskFactors = false;
        }
      }
    },
  },
});
