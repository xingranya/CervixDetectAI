import type { Patient, PatientRaw } from './models';
import type { User } from './models';

// Generic API Response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

// Auth API Types
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  real_name?: string;
  phone?: string;
}

// Patient API Types
export interface CreatePatientRequest {
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  phone: string;
  sexualHistory: string;
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
}

export interface PatientListResponse {
  patients: Patient[];
  total: number;
  page: number;
  limit: number;
}

export interface PatientListApiData {
  patients: PatientRaw[];
  pagination: { total: number; page: number; limit: number };
}

// Analysis API Types
export interface UploadImageRequest {
  image: File;
  patientName: string;
  patientId: string;
  studyDate: string;
  modality: string;
  description?: string;
}

export interface UploadImageResponse {
  taskId: string;
  studyId: string;
  studyDbId?: number;
  status: string;
  estimatedTime: number;
}

export interface TaskStatusResponse {
  taskId: string;
  studyId: string;
  studyDbId?: number;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  progress: number;
  result?: {
    diagnosis: string;
    confidence: number;
    suspiciousAreas: string[];
    biomarkers: {
      HPV: string;
      p16: string;
      Ki67: string;
    };
    recommendations: string[];
    detailedReport: string;
  };
  error?: string;
}

export interface StudyAnalysisResponse extends TaskStatusResponse {
  studyInfo: {
    patientName: string;
    patientId: string;
    studyDate: string;
    modality: string;
    description: string;
    imageUrl: string;
  };
  createdAt: string;
  completedAt?: string;
}

// Model API Types
export interface ModelUploadResponse {
  modelId: string;
  uploadUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface PredictionRequest {
  image: string; // base64 encoded image
  modelId: string;
  confidenceThreshold?: number;
}

export interface PredictionResponse {
  predictions: {
    class: string;
    confidence: number;
    bbox?: [number, number, number, number];
  }[];
  processingTime: number;
  modelVersion: string;
  timestamp: string;
}
