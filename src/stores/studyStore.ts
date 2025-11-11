import { defineStore } from 'pinia'

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
  analysisResult?: any; // Result from AI analysis
  uploadedAt: string; // ISO date string
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
      
      try {
        // In a real app, this would be an API call to your backend
        // For now, we'll simulate the API call
        return new Promise(resolve => {
          setTimeout(() => {
            // Simulated data
            this.studies = [
              {
                id: '1',
                patientName: '张小明',
                patientId: 'P001234',
                studyDate: '2024-11-10T09:30:00Z',
                status: 'completed',
                modality: '阴道镜检查',
                bodyPart: '宫颈',
                description: '常规宫颈筛查',
                imageUrl: 'https://placehold.co/600x400/cccccc/666666?text=宫颈图像',
                uploadedAt: '2024-11-10T09:30:00Z',
                analysisResult: {
                  diagnosis: '正常',
                  confidence: 0.92,
                  recommendations: ['一年后常规随访'],
                  suspiciousAreas: [],
                  biomarkers: {
                    HPV: '阴性',
                    p16: '阴性',
                    Ki67: '低'
                  }
                }
              },
              {
                id: '2',
                patientName: '李小红',
                patientId: 'P001235',
                studyDate: '2024-11-09T14:15:00Z',
                status: 'processing',
                modality: '阴道镜检查',
                bodyPart: '宫颈',
                description: '异常巴氏涂片后随访',
                imageUrl: 'https://placehold.co/600x400/cccccc/666666?text=宫颈图像',
                uploadedAt: '2024-11-09T14:15:00Z'
              },
              {
                id: '3',
                patientName: '王小华',
                patientId: 'P001236',
                studyDate: '2024-11-08T11:45:00Z',
                status: 'completed',
                modality: '阴道镜检查',
                bodyPart: '宫颈',
                description: '初次筛查',
                imageUrl: 'https://placehold.co/600x400/cccccc/666666?text=宫颈图像',
                uploadedAt: '2024-11-08T11:45:00Z',
                analysisResult: {
                  diagnosis: 'ASC-US',
                  confidence: 0.78,
                  recommendations: ['建议HPV检测', '6个月后随访阴道镜检查'],
                  suspiciousAreas: [
                    { x: 0.3, y: 0.4, width: 0.1, height: 0.1, type: 'abnormal' }
                  ],
                  biomarkers: {
                    HPV: '阳性',
                    p16: '阳性',
                    Ki67: '高'
                  }
                }
              }
            ];
            this.loading = false;
            resolve(this.studies);
          }, 800);
        });
      } catch (error: any) {
        this.error = error.message || '获取研究数据失败';
        this.loading = false;
      }
    },

    getStudyById(id: string) {
      const existingStudy = this.getStudyById(id);
      if (existingStudy) {
        this.currentStudy = existingStudy;
        return Promise.resolve(existingStudy);
      }

      this.loading = true;
      this.error = null;
      
      return new Promise((resolve, reject) => {
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
      
      return new Promise((resolve, reject) => {
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
      if (studyIndex !== -1) {
        const updatedStudy = { ...this.studies[studyIndex], status };
        this.studies[studyIndex] = updatedStudy;
        
        // If we're updating the current study, update that too
        if (this.currentStudy && this.currentStudy.id === studyId) {
          this.currentStudy = { ...updatedStudy };
        }
      }
    },

    updateStudyAnalysisResult(studyId: string, analysisResult: any) {
      const studyIndex = this.studies.findIndex(s => s.id === studyId);
      if (studyIndex !== -1) {
        const updatedStudy = { ...this.studies[studyIndex], analysisResult };
        this.studies[studyIndex] = updatedStudy;
        
        // If we're updating the current study, update that too
        if (this.currentStudy && this.currentStudy.id === studyId) {
          this.currentStudy = { ...updatedStudy };
        }
      }
    }
  },
})