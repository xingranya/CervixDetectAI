import type { StudyRaw } from 'src/services/api';
import { getImageUrl } from 'src/utils/mappers';
import type { AnalysisResult } from 'src/stores/analysisStore';
import type { LatestTaskStatus, Study, StudyDisplayStatus } from 'src/types/study';

type StudyTaskLike = Array<{ task_id?: string; status: string; created_at: string }> | undefined;

/**
 * 标准化任务状态，兼容历史返回值与大小写差异。
 */
export function normalizeLatestTaskStatus(
  status: string | undefined,
): LatestTaskStatus | undefined {
  if (!status) return undefined;

  const normalized = status.toUpperCase();
  if (normalized === 'PENDING') return 'PENDING';
  if (normalized === 'PROCESSING' || normalized === 'RUNNING') return 'PROCESSING';
  if (normalized === 'SUCCESS' || normalized === 'COMPLETED') return 'SUCCESS';
  if (normalized === 'FAILED' || normalized === 'CANCELLED' || normalized === 'CANCELED') {
    return 'FAILED';
  }

  return undefined;
}

/**
 * 统一归一化置信度。
 * 兼容小数、字符串、小于等于 100 的百分比数值。
 */
export function normalizeConfidenceValue(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;

  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num < 0) return undefined;

  if (num > 1 && num <= 100) {
    return num / 100;
  }

  if (num > 100) return undefined;

  return num;
}

/**
 * 获取最新任务状态，按创建时间倒序取最近一条。
 */
export function resolveLatestTaskStatus(tasks: StudyTaskLike): LatestTaskStatus | undefined {
  if (!tasks?.length) return undefined;

  const latestTask = [...tasks].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];

  return normalizeLatestTaskStatus(latestTask?.status);
}

/**
 * 获取最近一条任务记录。
 */
export function resolveLatestTask(tasks: StudyTaskLike) {
  if (!tasks?.length) return undefined;

  return [...tasks].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];
}

/**
 * 推导前端展示用病例状态。
 */
export function resolveStudyDisplayStatus(raw: StudyRaw): StudyDisplayStatus {
  const latestTaskStatus = resolveLatestTaskStatus(raw.analysis_tasks);
  const hasAnalysisResult = Boolean(raw.analysis_results?.[0]);

  if (hasAnalysisResult) {
    return 'completed';
  }

  if (latestTaskStatus === 'PENDING' || latestTaskStatus === 'PROCESSING') {
    return 'processing';
  }

  if (latestTaskStatus === 'FAILED' && raw.status === 'processing') {
    return 'failed';
  }

  return raw.status;
}

/**
 * 将后端分析结果映射为前端分析结果结构。
 */
export function mapStudyAnalysisResult(raw: StudyRaw): AnalysisResult | undefined {
  const latestResult = raw.analysis_results?.[0];
  if (!latestResult) return undefined;

  return {
    diagnosis: latestResult.diagnosis || '',
    confidence: normalizeConfidenceValue(latestResult.confidence) ?? 0,
    recommendations: latestResult.recommendations || [],
    suspiciousAreas: latestResult.suspicious_areas || [],
    biomarkers: latestResult.biomarkers,
    detailedReport: latestResult.detailed_report,
  };
}

/**
 * 将 StudyRaw 映射为前端统一使用的 Study。
 */
export function mapStudyRawToStudy(raw: StudyRaw): Study {
  const analysisResult = mapStudyAnalysisResult(raw);
  const latestTask = resolveLatestTask(raw.analysis_tasks);
  const latestTaskStatus = resolveLatestTaskStatus(raw.analysis_tasks);
  const normalizedStatus = resolveStudyDisplayStatus(raw);
  const normalizedConfidence = normalizeConfidenceValue(raw.analysis_results?.[0]?.confidence);
  const imageUrl = getImageUrl(raw.images?.[0]?.file_path);

  let displayTaskStatus = latestTaskStatus;
  if (
    analysisResult &&
    (!latestTaskStatus || latestTaskStatus === 'PENDING' || latestTaskStatus === 'PROCESSING')
  ) {
    displayTaskStatus = 'SUCCESS';
  }

  const study: Study = {
    id: raw.id,
    study_id: raw.study_id,
    patient_id: raw.patient_id,
    patientName: raw.patient?.name || '',
    patientId: raw.patient?.patient_id || '',
    studyDate: raw.study_date,
    status: normalizedStatus,
    study_type: raw.study_type,
    modality: raw.study_type,
    bodyPart: '宫颈',
    description: raw.description,
    images: raw.images,
    ...(analysisResult ? { analysisResult } : {}),
    uploadedAt: raw.created_at,
    created_at: raw.created_at,
    downloaded: raw.downloaded || false,
    downloaded_at: raw.downloaded_at,
    diagnosis: raw.analysis_results?.[0]?.diagnosis,
    riskLevel: raw.analysis_results?.[0]?.risk_level,
    confidence: normalizedConfidence,
    latestTaskStatus: displayTaskStatus,
    reviewStatus: raw.review_status || 'pending',
    reviewedAt: raw.reviewed_at,
    reviewedBy: raw.reviewed_by,
    ...(latestTask &&
    !analysisResult &&
    (latestTaskStatus === 'PENDING' || latestTaskStatus === 'PROCESSING')
      ? { taskId: latestTask.task_id }
      : {}),
  };

  if (imageUrl) {
    study.imageUrl = imageUrl;
  }

  return study;
}
