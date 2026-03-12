import type { AnalysisResult } from 'src/stores/analysisStore';

export type LatestTaskStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export type StudyDisplayStatus = 'pending' | 'completed' | 'processing' | 'failed' | 'uploaded';

export interface Study {
  id: number;
  study_id: string;
  patient_id: number;
  patientName: string;
  patientId: string;
  studyDate: string;
  status: StudyDisplayStatus;
  study_type: string;
  modality: string;
  bodyPart: string;
  description?: string | undefined;
  imageUrl?: string;
  images?: Array<{ id: number; file_path: string; original_filename: string }> | undefined;
  analysisResult?: AnalysisResult;
  uploadedAt: string;
  created_at: string;
  taskId?: string;
  downloaded?: boolean;
  downloaded_at?: string | undefined;
  diagnosis?: string | undefined;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical' | undefined;
  confidence?: number | undefined;
  latestTaskStatus?: LatestTaskStatus | undefined;
}

export interface StudiesPaginationState {
  total: number;
  page: number;
  limit: number;
}
