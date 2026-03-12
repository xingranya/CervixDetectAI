export interface SelectOption {
  label: string;
  value: string;
}

export interface ModelOption extends SelectOption {
  description: string;
}

export interface AiConfigState {
  model: string;
  confidence: number;
  sensitivity: number;
}

export interface NotificationPreferencesState {
  enable: boolean;
  channels: string[];
  types: string[];
  dndMode: boolean;
}

export interface AnalysisPreferencesState {
  autoStart: boolean;
  aiSecondOpinion: boolean;
  roiStyle: string;
  heatmapColor: string;
}

export interface ReportsPreferencesState {
  autoSave: boolean;
  defaultFormat: SelectOption;
  imageQuality: SelectOption;
  watermark: boolean;
  watermarkText: string;
}

export interface PrivacyPreferencesState {
  desensitization: boolean;
  mfa: boolean;
}

export interface BillingPreferencesState {
  autoRenewal: boolean;
  lowBalanceAlert: boolean;
  threshold: number;
}

export interface UserPreferencesState {
  notifications: NotificationPreferencesState;
  analysis: AnalysisPreferencesState;
  reports: ReportsPreferencesState;
  privacy: PrivacyPreferencesState;
  billing: BillingPreferencesState;
}

export type AiPreferencesTab = 'engine' | 'workflow' | 'delivery' | 'billing';
