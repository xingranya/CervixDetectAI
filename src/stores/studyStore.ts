import { defineStore } from 'pinia'
import type { AnalysisResult } from './analysisStore'

export interface Study {
  id: string;
  patientName: string;
  patientId: string;
  studyDate: string; // ISO date string
  status: 'completed' | 'processing' | 'failed'; // AI analysis status
  modality: string;
  bodyPart: string;
  description?: string;
  imageUrl: string; // URL to the medical image
  analysisResult?: AnalysisResult; // Result from AI analysis
  uploadedAt: string; // ISO date string
  taskId?: string; // Backend task ID for tracking
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
      return state.studies.find(study => study.id === id) || null;
    },
    completedStudies: (state) => state.studies.filter(study => study.status === 'completed'),
    processingStudies: (state) => state.studies.filter(study => study.status === 'processing'),
    recentStudies: (state) => 
      [...state.studies]
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .slice(0, 5),
  },

  actions: {
    fetchStudies() {
      this.loading = true;
      this.error = null;

      // In a real app, this would be an API call to your backend
      // For now, we'll simulate the API call
      return new Promise<Study[]>((resolve) => {
        setTimeout(() => {
          // Simulated data
          this.studies = [
            {
              id: '1',
              patientName: '张小明',
              patientId: 'P001234',
              studyDate: '2024-11-10T09:30:00Z',
              status: 'completed',
              modality: 'MRI（磁共振成像）',
              bodyPart: '宫颈',
              description: '常规宫颈筛查',
              imageUrl: 'https://placehold.co/600x400/cccccc/666666?text=MRI图像',
              uploadedAt: '2024-11-10T09:30:00Z',
              analysisResult: {
                diagnosis: '正常',
                confidence: 0.92,
                recommendations: ['一年后常规随访'],
                suspiciousAreas: [],
                biomarkers: {
                  HPV: '阴性',
                  p16: '阴性',
                  Ki67: '低',
                },
              },
            },
            {
              id: '2',
              patientName: '李小红',
              patientId: 'P001235',
              studyDate: '2024-11-09T14:15:00Z',
              status: 'processing',
              modality: 'CT（计算机断层扫描）',
              bodyPart: '宫颈',
              description: '肿瘤分期评估',
              imageUrl: 'https://placehold.co/600x400/cccccc/666666?text=CT图像',
              uploadedAt: '2024-11-09T14:15:00Z',
            },
            {
              id: '3',
              patientName: '王小华',
              patientId: 'P001236',
              studyDate: '2024-11-08T11:45:00Z',
              status: 'completed',
              modality: 'PET-CT（正电子发射断层扫描）',
              bodyPart: '宫颈',
              description: '转移病灶筛查',
              imageUrl: 'https://placehold.co/600x400/cccccc/666666?text=PET-CT图像',
              uploadedAt: '2024-11-08T11:45:00Z',
              analysisResult: {
                diagnosis: 'ASC-US',
                confidence: 0.78,
                recommendations: ['建议进一步MRI检查', '3个月后随访复查'],
                suspiciousAreas: [],
                biomarkers: {
                  HPV: '阳性',
                  p16: '阳性',
                  Ki67: '高',
                },
              },
            },
          ];
          this.loading = false;
          resolve(this.studies);
        }, 800);
      });
    },

    async loadStudyById(id: string) {
      const existingStudy = this.studies.find(study => study.id === id);
      if (existingStudy) {
        this.currentStudy = existingStudy;
        return existingStudy;
      }

      this.loading = true;
      this.error = null;

      return new Promise<Study>((resolve, reject) => {
        setTimeout(() => {
          // Find the study in our local array (in real app, fetch from API)
          const study = this.studies.find(s => s.id === id);
          
          if (study) {
            this.currentStudy = study;
            this.loading = false;
            resolve(study);
          } else {
            this.loading = false;
            reject(new Error('研究未找到'));
          }
        }, 500);
      });
    },

    createStudy(studyData: Omit<Study, 'id' | 'uploadedAt' | 'status'>) {
      this.loading = true;
      this.error = null;

      return new Promise<Study>((resolve) => {
        setTimeout(() => {
          const newStudy: Study = {
            ...studyData,
            id: `study_${Date.now()}`,
            status: 'processing', // New studies start as processing
            uploadedAt: new Date().toISOString(),
          };
          
          this.studies.unshift(newStudy);
          this.currentStudy = newStudy;
          
          // Simulate the analysis process by updating the status after a delay
          setTimeout(() => {
            this.updateStudyStatus(newStudy.id, 'completed');
          }, 3000);
          
          this.loading = false;
          resolve(newStudy);
        }, 800);
      });
    },

    updateStudyStatus(studyId: string, status: Study['status']) {
      const studyIndex = this.studies.findIndex(s => s.id === studyId);
      if (studyIndex === -1) {
        return;
      }

      const study = this.studies[studyIndex];
      if (!study) {
        return;
      }

      const updatedStudy: Study = { ...study, status };
      this.studies.splice(studyIndex, 1, updatedStudy);

      // If we're updating the current study, update that too
      if (this.currentStudy && this.currentStudy.id === studyId) {
        this.currentStudy = updatedStudy;
      }
    },

    updateStudyAnalysisResult(studyId: string, analysisResult: AnalysisResult) {
      const studyIndex = this.studies.findIndex(s => s.id === studyId);
      if (studyIndex === -1) {
        return;
      }

      const study = this.studies[studyIndex];
      if (!study) {
        return;
      }

      const updatedStudy: Study = { ...study, analysisResult };
      this.studies.splice(studyIndex, 1, updatedStudy);

      // If we're updating the current study, update that too
      if (this.currentStudy && this.currentStudy.id === studyId) {
        this.currentStudy = updatedStudy;
      }
    }
  },
})