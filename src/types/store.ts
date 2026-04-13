import type { User, Patient, Study, AnalysisTask, ModelInfo } from './models';
import type { PredictionResponse } from './api';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
}

export interface PatientState {
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

export interface StudyState {
  studies: Study[];
  currentStudy: Study | null;
  loading: boolean;
  error: string | null;
}

export interface AnalysisState {
  tasks: AnalysisTask[];
  currentTask: AnalysisTask | null;
  loading: boolean;
  error: string | null;
  pollingIntervals: Map<string, NodeJS.Timeout>;
}

export interface ModelState {
  models: ModelInfo[];
  currentModel: ModelInfo | null;
  isLoading: boolean;
  error: string | null;
  predictions: PredictionResponse | null;
}
