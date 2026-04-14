export interface User {
  id: number;
  username: string;
  email: string;
  real_name?: string;
  phone?: string;
  role: 'admin' | 'doctor' | 'user';
  status: 'active' | 'disabled';
  avatar_url?: string;
  last_login_at?: string;
  name?: string; // alias
}

export interface Patient {
  id: number;
  patientId: string;
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  phone: string;
  sexualHistory:
    | 'none'
    | 'regular'
    | 'irregular'
    | 'multiple_partners'
    | 'early_sexual_activity'
    | 'other';
  idCard?: string;
  medicalCardNo?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  allergyHistory?: string;
  medicalHistory?: string;
  familyHistory?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientRaw {
  id: number;
  patient_id: string;
  name: string;
  gender: 'male' | 'female';
  birth_date: string;
  phone: string;
  sexual_history: string;
  id_card?: string;
  medical_card_no?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  emergency_relation?: string;
  allergy_history?: string;
  medical_history?: string;
  family_history?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudyImage {
  id: number;
  file_path: string;
  original_filename: string;
}

export interface SuspiciousArea {
  box_2d?: number[];
  bbox_2d?: number[];
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

export interface Study {
  id: number;
  study_id: string;
  patient_id: number;
  patientName: string;
  patientId: string;
  studyDate: string;
  status: 'pending' | 'completed' | 'processing' | 'failed';
  study_type: string;
  modality: string;
  bodyPart: string;
  description?: string;
  imageUrl?: string;
  images?: StudyImage[];
  analysisResult?: AnalysisResult;
  uploadedAt: string;
  created_at: string;
  taskId?: string;
  downloaded?: boolean;
  downloaded_at?: string;
  diagnosis?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnalysisTask {
  id: string;
  studyId: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  progress: number;
  result?: AnalysisResult;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  version: string;
  accuracy: number;
  sensitivity: number;
  specificity: number;
  f1Score: number;
  size: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'training' | 'error';
  description: string;
  architecture: string;
  inputShape: string[];
  outputClasses: string[];
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  confusionMatrix: number[][];
}
