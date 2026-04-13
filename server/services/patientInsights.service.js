/* eslint-disable @typescript-eslint/no-require-imports */
const { Op } = require('sequelize');
const {
  Patient,
  Study,
  AnalysisTask,
  AnalysisResult,
  FollowUp,
  MedicalReport,
} = require('../models');

const RISK_LEVEL_WEIGHT = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toConfidenceNumber(value) {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  if (num > 1 && num <= 100) {
    return num / 100;
  }
  return clamp(num, 0, 1);
}

function parseDateBoundary(dateText, boundary) {
  if (!dateText || typeof dateText !== 'string') {
    return null;
  }

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (boundary === 'start') {
    date.setHours(0, 0, 0, 0);
    return date;
  }
  date.setHours(23, 59, 59, 999);
  return date;
}

function buildStudyDateCondition(dateFrom, dateTo) {
  const from = parseDateBoundary(dateFrom, 'start');
  const to = parseDateBoundary(dateTo, 'end');
  if (!from && !to) {
    return {};
  }

  const studyDateCondition = {};
  if (from) studyDateCondition[Op.gte] = from;
  if (to) studyDateCondition[Op.lte] = to;
  return {
    study_date: studyDateCondition,
  };
}

function resolveTrendByRiskWeights(weights) {
  if (!weights || weights.length < 2) {
    return 'insufficient';
  }

  const mid = Math.ceil(weights.length / 2);
  const firstHalf = weights.slice(0, mid);
  const secondHalf = weights.slice(mid);

  if (secondHalf.length === 0) {
    return 'insufficient';
  }

  const avg = (arr) => arr.reduce((sum, n) => sum + n, 0) / arr.length;
  const delta = avg(secondHalf) - avg(firstHalf);

  if (delta > 0.35) return 'up';
  if (delta < -0.35) return 'down';
  return 'stable';
}

function resolveRiskLevelByScore(score) {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function normalizeRiskLevel(level) {
  return ['low', 'medium', 'high', 'critical'].includes(level) ? level : 'low';
}

async function ensurePatientExists(patientId) {
  const patient = await Patient.findByPk(patientId, {
    attributes: ['id', 'patient_id', 'name', 'gender', 'birth_date', 'phone'],
  });

  if (!patient) {
    throw createHttpError(404, '患者不存在');
  }

  return patient;
}

function buildTimelineEvent({
  eventId,
  eventType,
  eventTime,
  title,
  description,
  riskLevel,
  status,
  meta,
}) {
  return {
    event_id: eventId,
    event_type: eventType,
    event_time: eventTime,
    title,
    description,
    ...(riskLevel ? { risk_level: riskLevel } : {}),
    ...(status ? { status } : {}),
    ...(meta ? { meta } : {}),
  };
}

async function getPatientHistory(patientId, options = {}) {
  await ensurePatientExists(patientId);

  const normalizedLimit = clamp(Number(options.limit) || 120, 1, 500);
  const studyDateCondition = buildStudyDateCondition(options.date_from, options.date_to);

  const results = await AnalysisResult.findAll({
    attributes: [
      'id',
      'study_id',
      'diagnosis',
      'confidence',
      'risk_level',
      'recommendations',
      'created_at',
    ],
    include: [
      {
        model: Study,
        as: 'study',
        required: true,
        attributes: ['id', 'study_id', 'study_date', 'study_type'],
        where: {
          patient_id: patientId,
          ...studyDateCondition,
        },
      },
    ],
    order: [
      [{ model: Study, as: 'study' }, 'study_date', 'DESC'],
      ['created_at', 'DESC'],
    ],
    limit: normalizedLimit,
  });

  const rawSeries = results.map((item) => {
    const raw = item.toJSON();
    const riskLevel = normalizeRiskLevel(raw.risk_level);
    const confidence = toConfidenceNumber(raw.confidence);
    return {
      analysis_result_id: raw.id,
      study_id: raw.study?.id,
      study_unique_id: raw.study?.study_id,
      study_date: raw.study?.study_date,
      study_type: raw.study?.study_type,
      diagnosis: raw.diagnosis,
      risk_level: riskLevel,
      confidence,
      recommendations: Array.isArray(raw.recommendations) ? raw.recommendations : [],
      analysis_at: raw.created_at,
    };
  });

  // 先按最新窗口截取，再按时间正序重排，确保趋势计算和“最新一次”基于最新 N 条记录
  const series = rawSeries.sort((a, b) => {
    const aStudyTime = a.study_date ? new Date(a.study_date).getTime() : 0;
    const bStudyTime = b.study_date ? new Date(b.study_date).getTime() : 0;
    if (aStudyTime !== bStudyTime) {
      return aStudyTime - bStudyTime;
    }
    const aAnalysisTime = a.analysis_at ? new Date(a.analysis_at).getTime() : 0;
    const bAnalysisTime = b.analysis_at ? new Date(b.analysis_at).getTime() : 0;
    return aAnalysisTime - bAnalysisTime;
  });

  const riskDistribution = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  series.forEach((item) => {
    riskDistribution[item.risk_level] += 1;
  });

  const avgConfidence =
    series.length > 0
      ? Number(
          (
            series.reduce((sum, item) => sum + toConfidenceNumber(item.confidence), 0) /
            series.length
          ).toFixed(4),
        )
      : 0;

  const riskWeights = series.map((item) => RISK_LEVEL_WEIGHT[item.risk_level] || 1);
  const trend = resolveTrendByRiskWeights(riskWeights);

  return {
    series,
    stats: {
      total_detections: series.length,
      first_detection_at: series[0]?.analysis_at,
      latest_detection_at: series[series.length - 1]?.analysis_at,
      risk_distribution: riskDistribution,
      average_confidence: avgConfidence,
      trend,
    },
  };
}

async function getStudySnapshot(patientId, studyId) {
  const study = await Study.findOne({
    where: {
      id: studyId,
      patient_id: patientId,
    },
    attributes: ['id', 'study_id', 'study_date', 'study_type', 'status'],
  });

  if (!study) {
    return null;
  }

  const [latestResult, latestTask, latestFollowup] = await Promise.all([
    AnalysisResult.findOne({
      where: { study_id: study.id },
      attributes: ['id', 'diagnosis', 'confidence', 'risk_level', 'recommendations', 'created_at'],
      order: [['created_at', 'DESC']],
    }),
    AnalysisTask.findOne({
      where: { study_id: study.id },
      attributes: ['id', 'task_id', 'status', 'progress', 'created_at', 'completed_at'],
      order: [['created_at', 'DESC']],
    }),
    FollowUp.findOne({
      where: {
        patient_id: patientId,
        study_id: study.id,
      },
      attributes: [
        'id',
        'follow_up_id',
        'status',
        'planned_date',
        'ai_flagged_high_attention',
        'doctor_marked_high_attention',
      ],
      order: [['created_at', 'DESC']],
    }),
  ]);

  const resultRaw = latestResult?.toJSON();
  const taskRaw = latestTask?.toJSON();
  const followupRaw = latestFollowup?.toJSON();

  return {
    study_id: study.id,
    study_unique_id: study.study_id,
    study_date: study.study_date,
    study_type: study.study_type,
    study_status: study.status,
    diagnosis: resultRaw?.diagnosis || '',
    risk_level: normalizeRiskLevel(resultRaw?.risk_level || 'low'),
    confidence: toConfidenceNumber(resultRaw?.confidence),
    recommendations: Array.isArray(resultRaw?.recommendations) ? resultRaw.recommendations : [],
    analysis_at: resultRaw?.created_at,
    latest_task: taskRaw
      ? {
          task_id: taskRaw.task_id,
          status: taskRaw.status,
          progress: taskRaw.progress,
          created_at: taskRaw.created_at,
          completed_at: taskRaw.completed_at,
        }
      : null,
    followup: followupRaw
      ? {
          follow_up_id: followupRaw.follow_up_id,
          status: followupRaw.status,
          planned_date: followupRaw.planned_date,
          is_high_attention:
            Boolean(followupRaw.ai_flagged_high_attention) ||
            Boolean(followupRaw.doctor_marked_high_attention),
        }
      : null,
  };
}

async function getPatientCompare(patientId, leftStudyId, rightStudyId) {
  await ensurePatientExists(patientId);

  if (!leftStudyId || !rightStudyId) {
    throw createHttpError(400, '对比参数不完整');
  }

  if (leftStudyId === rightStudyId) {
    throw createHttpError(400, '请选择两次不同的检查进行对比');
  }

  const [leftSnapshot, rightSnapshot] = await Promise.all([
    getStudySnapshot(patientId, leftStudyId),
    getStudySnapshot(patientId, rightStudyId),
  ]);

  if (!leftSnapshot || !rightSnapshot) {
    throw createHttpError(404, '用于对比的病例不存在');
  }

  const leftRiskWeight = RISK_LEVEL_WEIGHT[leftSnapshot.risk_level] || 1;
  const rightRiskWeight = RISK_LEVEL_WEIGHT[rightSnapshot.risk_level] || 1;
  const riskDelta = rightRiskWeight - leftRiskWeight;
  const confidenceDelta = Number((rightSnapshot.confidence - leftSnapshot.confidence).toFixed(4));

  const leftRecs = new Set(leftSnapshot.recommendations);
  const rightRecs = new Set(rightSnapshot.recommendations);
  const recommendationAdded = [...rightRecs].filter((item) => !leftRecs.has(item));
  const recommendationRemoved = [...leftRecs].filter((item) => !rightRecs.has(item));

  const diagnosisChanged = leftSnapshot.diagnosis !== rightSnapshot.diagnosis;

  const summary = [];
  if (riskDelta > 0) summary.push('风险等级较前次上升');
  if (riskDelta < 0) summary.push('风险等级较前次下降');
  if (riskDelta === 0) summary.push('风险等级较前次持平');

  if (confidenceDelta > 0) summary.push('置信度提升');
  if (confidenceDelta < 0) summary.push('置信度下降');
  if (diagnosisChanged) summary.push('诊断结论发生变化');
  if (recommendationAdded.length > 0 || recommendationRemoved.length > 0) {
    summary.push('临床建议存在差异');
  }

  return {
    left: leftSnapshot,
    right: rightSnapshot,
    diff: {
      risk_delta: riskDelta,
      confidence_delta: confidenceDelta,
      diagnosis_changed: diagnosisChanged,
      recommendation_added: recommendationAdded,
      recommendation_removed: recommendationRemoved,
      summary,
    },
  };
}

async function getPatientTimeline(patientId, options = {}) {
  await ensurePatientExists(patientId);

  const page = Math.max(Number(options.page) || 1, 1);
  const limit = clamp(Number(options.limit) || 20, 1, 100);
  const dateFrom = parseDateBoundary(options.date_from, 'start');
  const dateTo = parseDateBoundary(options.date_to, 'end');

  const [studies, tasks, results, followups] = await Promise.all([
    Study.findAll({
      where: { patient_id: patientId },
      attributes: ['id', 'study_id', 'study_date', 'study_type', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 500,
    }),
    AnalysisTask.findAll({
      attributes: [
        'id',
        'task_id',
        'study_id',
        'status',
        'progress',
        'error_message',
        'created_at',
        'started_at',
        'completed_at',
      ],
      include: [
        {
          model: Study,
          as: 'study',
          required: true,
          attributes: ['id', 'study_id'],
          where: { patient_id: patientId },
        },
      ],
      order: [['created_at', 'DESC']],
      limit: 800,
    }),
    AnalysisResult.findAll({
      attributes: ['id', 'study_id', 'diagnosis', 'risk_level', 'confidence', 'created_at'],
      include: [
        {
          model: Study,
          as: 'study',
          required: true,
          attributes: ['id', 'study_id'],
          where: { patient_id: patientId },
        },
      ],
      order: [['created_at', 'DESC']],
      limit: 800,
    }),
    FollowUp.findAll({
      where: { patient_id: patientId },
      attributes: [
        'id',
        'follow_up_id',
        'study_id',
        'status',
        'planned_date',
        'completed_at',
        'cancelled_at',
        'created_at',
        'ai_flagged_high_attention',
        'doctor_marked_high_attention',
      ],
      order: [['created_at', 'DESC']],
      limit: 500,
    }),
  ]);

  let reports = [];
  try {
    reports = await MedicalReport.findAll({
      where: { patient_id: patientId },
      attributes: ['id', 'report_id', 'study_id', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 500,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[patient-insights] 查询医疗报告失败，已降级忽略:', error.message);
    }
  }

  const events = [];

  studies.forEach((item) => {
    const raw = item.toJSON();
    events.push(
      buildTimelineEvent({
        eventId: `study_created_${raw.id}`,
        eventType: 'study_created',
        eventTime: raw.created_at || raw.study_date,
        title: '创建病例',
        description: `病例 ${raw.study_id}（${raw.study_type || '未知类型'}）`,
        status: raw.status,
        meta: {
          study_id: raw.id,
          study_unique_id: raw.study_id,
        },
      }),
    );
  });

  tasks.forEach((item) => {
    const raw = item.toJSON();
    const studyUniqueId = raw.study?.study_id;

    events.push(
      buildTimelineEvent({
        eventId: `task_created_${raw.id}`,
        eventType: 'analysis_task_created',
        eventTime: raw.created_at,
        title: '创建分析任务',
        description: `任务 ${raw.task_id} 已创建（病例 ${studyUniqueId || raw.study_id}）`,
        status: raw.status,
        meta: {
          task_id: raw.id,
          task_unique_id: raw.task_id,
          study_id: raw.study_id,
          study_unique_id: studyUniqueId,
        },
      }),
    );

    if (raw.started_at || raw.status === 'PROCESSING') {
      events.push(
        buildTimelineEvent({
          eventId: `task_started_${raw.id}`,
          eventType: 'analysis_started',
          eventTime: raw.started_at || raw.created_at,
          title: '开始分析',
          description: `任务 ${raw.task_id} 进入分析流程`,
          status: raw.status,
          meta: {
            task_id: raw.id,
            task_unique_id: raw.task_id,
            study_id: raw.study_id,
            study_unique_id: studyUniqueId,
          },
        }),
      );
    }

    if (raw.status === 'SUCCESS') {
      events.push(
        buildTimelineEvent({
          eventId: `task_success_${raw.id}`,
          eventType: 'analysis_completed',
          eventTime: raw.completed_at || raw.created_at,
          title: '分析完成',
          description: `任务 ${raw.task_id} 已完成`,
          status: raw.status,
          meta: {
            task_id: raw.id,
            task_unique_id: raw.task_id,
            study_id: raw.study_id,
            study_unique_id: studyUniqueId,
          },
        }),
      );
    }

    if (raw.status === 'FAILED') {
      events.push(
        buildTimelineEvent({
          eventId: `task_failed_${raw.id}`,
          eventType: 'analysis_failed',
          eventTime: raw.completed_at || raw.created_at,
          title: '分析失败',
          description: raw.error_message || `任务 ${raw.task_id} 分析失败`,
          status: raw.status,
          meta: {
            task_id: raw.id,
            task_unique_id: raw.task_id,
            study_id: raw.study_id,
            study_unique_id: studyUniqueId,
          },
        }),
      );
    }
  });

  results.forEach((item) => {
    const raw = item.toJSON();
    const confidence = Math.round(toConfidenceNumber(raw.confidence) * 100);
    events.push(
      buildTimelineEvent({
        eventId: `analysis_result_${raw.id}`,
        eventType: 'analysis_result',
        eventTime: raw.created_at,
        title: '生成分析结果',
        description: `${raw.diagnosis || '未知诊断'}（置信度 ${confidence}%）`,
        riskLevel: normalizeRiskLevel(raw.risk_level || 'low'),
        meta: {
          analysis_result_id: raw.id,
          study_id: raw.study_id,
          study_unique_id: raw.study?.study_id,
        },
      }),
    );
  });

  followups.forEach((item) => {
    const raw = item.toJSON();
    const isHighAttention =
      Boolean(raw.ai_flagged_high_attention) || Boolean(raw.doctor_marked_high_attention);

    events.push(
      buildTimelineEvent({
        eventId: `followup_created_${raw.id}`,
        eventType: 'followup_created',
        eventTime: raw.created_at,
        title: '创建随访计划',
        description: `随访编号 ${raw.follow_up_id}，计划日期 ${raw.planned_date}`,
        status: raw.status,
        ...(isHighAttention ? { riskLevel: 'high' } : {}),
        meta: {
          follow_up_id: raw.id,
          follow_up_unique_id: raw.follow_up_id,
          study_id: raw.study_id,
          is_high_attention: isHighAttention,
        },
      }),
    );

    if (raw.status === 'overdue') {
      events.push(
        buildTimelineEvent({
          eventId: `followup_overdue_${raw.id}`,
          eventType: 'followup_overdue',
          eventTime: raw.planned_date,
          title: '随访逾期',
          description: `随访计划 ${raw.follow_up_id} 已逾期`,
          status: raw.status,
          riskLevel: isHighAttention ? 'high' : undefined,
          meta: {
            follow_up_id: raw.id,
            follow_up_unique_id: raw.follow_up_id,
            study_id: raw.study_id,
          },
        }),
      );
    }

    if (raw.completed_at) {
      events.push(
        buildTimelineEvent({
          eventId: `followup_completed_${raw.id}`,
          eventType: 'followup_completed',
          eventTime: raw.completed_at,
          title: '完成随访',
          description: `随访计划 ${raw.follow_up_id} 已完成`,
          status: raw.status,
          meta: {
            follow_up_id: raw.id,
            follow_up_unique_id: raw.follow_up_id,
            study_id: raw.study_id,
          },
        }),
      );
    }

    if (raw.cancelled_at) {
      events.push(
        buildTimelineEvent({
          eventId: `followup_cancelled_${raw.id}`,
          eventType: 'followup_cancelled',
          eventTime: raw.cancelled_at,
          title: '取消随访',
          description: `随访计划 ${raw.follow_up_id} 已取消`,
          status: raw.status,
          meta: {
            follow_up_id: raw.id,
            follow_up_unique_id: raw.follow_up_id,
            study_id: raw.study_id,
          },
        }),
      );
    }
  });

  reports.forEach((item) => {
    const raw = item.toJSON();
    events.push(
      buildTimelineEvent({
        eventId: `report_created_${raw.id}`,
        eventType: 'report_generated',
        eventTime: raw.created_at,
        title: '生成报告',
        description: `报告编号 ${raw.report_id}`,
        status: raw.status,
        meta: {
          report_id: raw.id,
          report_unique_id: raw.report_id,
          study_id: raw.study_id,
        },
      }),
    );
  });

  const filteredEvents = events.filter((eventItem) => {
    if (!eventItem.event_time) return false;
    const time = new Date(eventItem.event_time);
    if (Number.isNaN(time.getTime())) return false;
    if (dateFrom && time < dateFrom) return false;
    if (dateTo && time > dateTo) return false;
    return true;
  });

  filteredEvents.sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime());

  const total = filteredEvents.length;
  const pages = Math.max(Math.ceil(total / limit), 1);
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * limit;
  const items = filteredEvents.slice(start, start + limit);

  return {
    items,
    pagination: {
      total,
      page: safePage,
      limit,
      pages,
    },
  };
}

async function getPatientRiskProfile(patientId) {
  await ensurePatientExists(patientId);

  const history = await getPatientHistory(patientId, { limit: 300 });
  const series = history.series;
  const latest = series[series.length - 1];
  const latestRiskLevel = normalizeRiskLevel(latest?.risk_level || 'low');

  const latestRiskScoreMap = {
    low: 8,
    medium: 18,
    high: 28,
    critical: 35,
  };

  const highRiskCount = series.filter((item) => ['high', 'critical'].includes(item.risk_level)).length;
  const highRiskRatio = series.length > 0 ? highRiskCount / series.length : 0;
  const highRiskRatioScore = Math.round(highRiskRatio * 25);

  const riskWeights = series.map((item) => RISK_LEVEL_WEIGHT[item.risk_level] || 1);
  const trend = resolveTrendByRiskWeights(riskWeights);
  const trendScoreMap = {
    up: 20,
    stable: 10,
    down: 4,
    insufficient: 6,
  };

  const followups = await FollowUp.findAll({
    where: { patient_id: patientId },
    attributes: [
      'id',
      'status',
      'ai_flagged_high_attention',
      'doctor_marked_high_attention',
      'planned_date',
    ],
    limit: 500,
  });

  const overdueCount = followups.filter((item) => item.status === 'overdue').length;
  const overdueScore = Math.min(10, overdueCount * 4);
  const highAttentionCount = followups.filter(
    (item) => item.ai_flagged_high_attention || item.doctor_marked_high_attention,
  ).length;
  const highAttentionScore = Math.min(10, highAttentionCount * 5);

  const factorScores = {
    latest_risk: latestRiskScoreMap[latestRiskLevel],
    high_risk_ratio: highRiskRatioScore,
    trend: trendScoreMap[trend],
    followup_overdue: overdueScore,
    high_attention: highAttentionScore,
  };

  const score = clamp(
    factorScores.latest_risk +
      factorScores.high_risk_ratio +
      factorScores.trend +
      factorScores.followup_overdue +
      factorScores.high_attention,
    0,
    100,
  );
  const level = resolveRiskLevelByScore(score);

  const factors = [
    {
      key: 'latest_risk',
      label: '最近一次风险等级',
      weight: 35,
      score: factorScores.latest_risk,
      value: latestRiskLevel,
      description: '最近一次检查结果对当前风险判断影响最大',
    },
    {
      key: 'high_risk_ratio',
      label: '高风险占比',
      weight: 25,
      score: factorScores.high_risk_ratio,
      value: Number(highRiskRatio.toFixed(4)),
      description: '历史结果中 high/critical 占比越高，累计风险越高',
    },
    {
      key: 'trend',
      label: '风险趋势',
      weight: 20,
      score: factorScores.trend,
      value: trend,
      description: '最近多次检查是否呈上升趋势',
    },
    {
      key: 'followup_overdue',
      label: '随访逾期',
      weight: 10,
      score: factorScores.followup_overdue,
      value: overdueCount,
      description: '逾期随访越多，潜在风险越高',
    },
    {
      key: 'high_attention',
      label: '重点关注标记',
      weight: 10,
      score: factorScores.high_attention,
      value: highAttentionCount,
      description: 'AI 或医生标记重点关注时提高风险评估',
    },
  ];

  const suggestions = [];

  if (['high', 'critical'].includes(level)) {
    suggestions.push('建议尽快安排复检或进一步病理检查');
  } else if (level === 'medium') {
    suggestions.push('建议缩短复查周期，并关注风险变化趋势');
  } else {
    suggestions.push('建议保持常规筛查频率并持续随访');
  }

  if (trend === 'up') {
    suggestions.push('近期风险呈上升趋势，建议医生优先复核近期检查结果');
  }
  if (overdueCount > 0) {
    suggestions.push(`存在 ${overdueCount} 条逾期随访，请优先处理`);
  }
  if (highAttentionCount > 0) {
    suggestions.push(`存在 ${highAttentionCount} 条重点关注记录，建议纳入重点管理`);
  }

  if (series.length === 0) {
    suggestions.push('当前暂无可用于评分的历史分析数据');
  }

  return {
    score,
    level,
    trend,
    factors,
    suggestions,
    metrics: {
      total_analyses: series.length,
      high_risk_count: highRiskCount,
      high_risk_ratio: Number(highRiskRatio.toFixed(4)),
      overdue_followups: overdueCount,
      high_attention_followups: highAttentionCount,
      latest_analysis_at: latest?.analysis_at,
    },
  };
}

async function getPatientOverview(patientId) {
  const patient = await ensurePatientExists(patientId);

  const [totalStudies, totalAnalyses, highRiskAnalyses, latestStudy, latestResult, pendingFollowups, overdueFollowups, riskProfile] =
    await Promise.all([
      Study.count({
        where: { patient_id: patientId },
      }),
      AnalysisResult.count({
        include: [
          {
            model: Study,
            as: 'study',
            required: true,
            attributes: [],
            where: { patient_id: patientId },
          },
        ],
      }),
      AnalysisResult.count({
        where: {
          risk_level: {
            [Op.in]: ['high', 'critical'],
          },
        },
        include: [
          {
            model: Study,
            as: 'study',
            required: true,
            attributes: [],
            where: { patient_id: patientId },
          },
        ],
      }),
      Study.findOne({
        where: { patient_id: patientId },
        attributes: ['id', 'study_id', 'study_date', 'study_type', 'status', 'created_at'],
        order: [['study_date', 'DESC']],
      }),
      AnalysisResult.findOne({
        attributes: ['id', 'study_id', 'diagnosis', 'confidence', 'risk_level', 'created_at'],
        include: [
          {
            model: Study,
            as: 'study',
            required: true,
            attributes: ['id', 'study_id', 'study_date', 'study_type'],
            where: { patient_id: patientId },
          },
        ],
        order: [['created_at', 'DESC']],
      }),
      FollowUp.count({
        where: {
          patient_id: patientId,
          status: 'pending',
        },
      }),
      FollowUp.count({
        where: {
          patient_id: patientId,
          status: 'overdue',
        },
      }),
      getPatientRiskProfile(patientId),
    ]);

  const latestResultRaw = latestResult?.toJSON();
  const latestStudyRaw = latestStudy?.toJSON();

  return {
    patient: patient.toJSON(),
    summary: {
      total_studies: totalStudies,
      total_analyses: totalAnalyses,
      high_risk_analyses: highRiskAnalyses,
      pending_followups: pendingFollowups,
      overdue_followups: overdueFollowups,
      latest_study: latestStudyRaw
        ? {
            study_id: latestStudyRaw.id,
            study_unique_id: latestStudyRaw.study_id,
            study_date: latestStudyRaw.study_date,
            study_type: latestStudyRaw.study_type,
            status: latestStudyRaw.status,
            created_at: latestStudyRaw.created_at,
          }
        : null,
      latest_analysis: latestResultRaw
        ? {
            analysis_result_id: latestResultRaw.id,
            study_id: latestResultRaw.study_id,
            study_unique_id: latestResultRaw.study?.study_id,
            diagnosis: latestResultRaw.diagnosis,
            confidence: toConfidenceNumber(latestResultRaw.confidence),
            risk_level: normalizeRiskLevel(latestResultRaw.risk_level || 'low'),
            analysis_at: latestResultRaw.created_at,
          }
        : null,
    },
    risk_profile: {
      score: riskProfile.score,
      level: riskProfile.level,
      trend: riskProfile.trend,
    },
  };
}

/**
 * 疾病进展预警 — 基于历史分析结果预测疾病进展趋势
 * @param {number} patientId
 * @returns {Promise<{alertLevel, alerts, trend, history, prediction}>}
 */
async function predictDiseaseProgression(patientId) {
  await ensurePatientExists(patientId);

  // 获取患者所有分析结果（按时间正序）
  const results = await AnalysisResult.findAll({
    attributes: ['id', 'study_id', 'diagnosis', 'confidence', 'risk_level', 'created_at'],
    include: [
      {
        model: Study,
        as: 'study',
        required: true,
        attributes: ['id', 'study_id', 'study_date'],
        where: { patient_id: patientId },
      },
    ],
    order: [
      [{ model: Study, as: 'study' }, 'study_date', 'ASC'],
      ['created_at', 'ASC'],
    ],
    limit: 500,
  });

  const historyItems = results.map((item) => {
    const raw = item.toJSON();
    return {
      date: raw.study?.study_date || raw.created_at,
      diagnosis: raw.diagnosis || '',
      riskLevel: normalizeRiskLevel(raw.risk_level),
      confidence: toConfidenceNumber(raw.confidence),
    };
  });

  // 不足2条数据，无法分析
  if (historyItems.length < 2) {
    return {
      alertLevel: 'none',
      alerts: [],
      trend: 'stable',
      history: historyItems,
      prediction: '当前数据量不足，无法进行趋势预测。建议完成更多检查后再查看。',
    };
  }

  const alerts = [];
  const riskWeights = historyItems.map((h) => RISK_LEVEL_WEIGHT[h.riskLevel] || 1);
  const len = riskWeights.length;

  // 判断连续变化
  let consecutiveUp = 0;
  let consecutiveDown = 0;
  for (let i = 1; i < len; i++) {
    if (riskWeights[i] > riskWeights[i - 1]) {
      consecutiveUp += 1;
      consecutiveDown = 0;
    } else if (riskWeights[i] < riskWeights[i - 1]) {
      consecutiveDown += 1;
      consecutiveUp = 0;
    } else {
      consecutiveUp = 0;
      consecutiveDown = 0;
    }
  }

  let alertLevel = 'none';
  let trend = 'stable';

  const latestRisk = historyItems[len - 1].riskLevel;

  // 最近一次为 critical
  if (latestRisk === 'critical') {
    alertLevel = 'critical';
    alerts.push({
      type: 'critical_detected',
      message: '最近一次检查结果为极高风险，需立即关注。',
      data: { riskLevel: latestRisk },
    });
  }

  // 连续2次风险等级上升
  if (consecutiveUp >= 2) {
    trend = 'worsening';
    if (alertLevel !== 'critical') alertLevel = 'warning';
    alerts.push({
      type: 'risk_escalation',
      message: `风险等级连续 ${consecutiveUp} 次上升，疾病可能正在进展。`,
      data: { consecutiveUp },
    });
  } else if (consecutiveDown >= 2) {
    trend = 'improving';
  } else {
    // 检查整体波动
    const uniqueWeights = new Set(riskWeights.slice(-5));
    if (uniqueWeights.size >= 3) {
      trend = 'fluctuating';
    }
  }

  // 置信度持续下降检查（最近3次）
  if (len >= 3) {
    const recentConfs = historyItems.slice(-3).map((h) => h.confidence);
    const drop1 = recentConfs[0] - recentConfs[1];
    const drop2 = recentConfs[1] - recentConfs[2];
    if (drop1 > 0.1 && drop2 > 0.1) {
      if (alertLevel === 'none') alertLevel = 'watch';
      alerts.push({
        type: 'confidence_drop',
        message: '近期检测置信度持续下降，建议核实图像质量或更换检测策略。',
        data: { recentConfidences: recentConfs },
      });
    }
  }

  // 检查是否有逾期随访
  const overdueFollowups = await FollowUp.count({
    where: { patient_id: patientId, status: 'overdue' },
  });
  if (overdueFollowups > 0) {
    if (alertLevel === 'none') alertLevel = 'watch';
    alerts.push({
      type: 'overdue_followup',
      message: `存在 ${overdueFollowups} 条逾期随访，可能延误病情监控。`,
      data: { overdueCount: overdueFollowups },
    });
  }

  // 生成预测建议
  const predictions = [];
  if (trend === 'worsening') {
    predictions.push('风险持续升高，建议尽快安排进一步病理检查或转诊。');
  } else if (trend === 'improving') {
    predictions.push('近期风险呈下降趋势，建议继续保持当前筛查频率。');
  } else if (trend === 'fluctuating') {
    predictions.push('风险水平波动较大，建议缩短复查间隔并结合临床评估。');
  } else {
    predictions.push('风险水平整体平稳，建议维持常规随访计划。');
  }

  if (latestRisk === 'high' || latestRisk === 'critical') {
    predictions.push('当前处于高风险状态，建议优先安排专科会诊。');
  }

  return {
    alertLevel,
    alerts,
    trend,
    history: historyItems,
    prediction: predictions.join(' '),
  };
}

/**
 * 多时段对比 — 两个时间段的检查结果对比
 * @param {number} patientId
 * @param {{start: string, end: string}} periodA
 * @param {{start: string, end: string}} periodB
 */
async function crossPeriodComparison(patientId, periodA, periodB) {
  await ensurePatientExists(patientId);

  if (!periodA?.start || !periodA?.end || !periodB?.start || !periodB?.end) {
    throw createHttpError(400, '两个时段的起止时间均为必填参数');
  }

  // 按时间范围查询分析结果
  async function fetchPeriodResults(period) {
    const from = parseDateBoundary(period.start, 'start');
    const to = parseDateBoundary(period.end, 'end');
    if (!from || !to) {
      throw createHttpError(400, '时间格式不合法');
    }

    return AnalysisResult.findAll({
      attributes: ['id', 'study_id', 'diagnosis', 'confidence', 'risk_level', 'created_at'],
      include: [
        {
          model: Study,
          as: 'study',
          required: true,
          attributes: ['id', 'study_id', 'study_date', 'study_type'],
          where: {
            patient_id: patientId,
            study_date: { [Op.gte]: from, [Op.lte]: to },
          },
        },
      ],
      order: [['created_at', 'ASC']],
    });
  }

  const [rawA, rawB] = await Promise.all([
    fetchPeriodResults(periodA),
    fetchPeriodResults(periodB),
  ]);

  // 统计单个时段的指标
  function summarizePeriod(rawResults) {
    const items = rawResults.map((item) => {
      const raw = item.toJSON();
      return {
        date: raw.study?.study_date || raw.created_at,
        diagnosis: raw.diagnosis || '',
        riskLevel: normalizeRiskLevel(raw.risk_level),
        confidence: toConfidenceNumber(raw.confidence),
        studyType: raw.study?.study_type || '',
      };
    });

    const avgConfidence =
      items.length > 0
        ? Number((items.reduce((s, i) => s + i.confidence, 0) / items.length).toFixed(4))
        : 0;

    // 出现次数最多的风险等级
    const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    items.forEach((i) => { riskCounts[i.riskLevel] += 1; });
    const dominantRisk = Object.entries(riskCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'low';

    return { results: items, avgConfidence, dominantRisk, count: items.length };
  }

  const summaryA = summarizePeriod(rawA);
  const summaryB = summarizePeriod(rawB);

  // 对比变化
  const aWeight = RISK_LEVEL_WEIGHT[summaryA.dominantRisk] || 1;
  const bWeight = RISK_LEVEL_WEIGHT[summaryB.dominantRisk] || 1;
  let riskChange = 'stable';
  if (bWeight < aWeight) riskChange = 'improved';
  else if (bWeight > aWeight) riskChange = 'worsened';

  const confidenceChange = Number((summaryB.avgConfidence - summaryA.avgConfidence).toFixed(4));

  // 诊断变化
  const diagSetA = new Set(summaryA.results.map((r) => r.diagnosis).filter(Boolean));
  const diagSetB = new Set(summaryB.results.map((r) => r.diagnosis).filter(Boolean));
  const diagnosisChanges = [...diagSetB].filter((d) => !diagSetA.has(d));

  return {
    periodA: summaryA,
    periodB: summaryB,
    changes: {
      riskChange,
      confidenceChange,
      diagnosisChanges,
    },
  };
}

/**
 * 个性化风险因素分析 — 基于患者特征的加权评分
 * @param {number} patientId
 */
async function analyzeRiskFactors(patientId) {
  const patient = await Patient.findByPk(patientId, {
    attributes: [
      'id', 'patient_id', 'name', 'gender', 'birth_date',
      'sexual_history', 'family_history', 'medical_history',
    ],
  });
  if (!patient) {
    throw createHttpError(404, '患者不存在');
  }

  const patientRaw = patient.toJSON();

  // 获取最近一次分析结果
  const latestResult = await AnalysisResult.findOne({
    attributes: ['id', 'diagnosis', 'confidence', 'risk_level', 'biomarkers', 'created_at'],
    include: [
      {
        model: Study,
        as: 'study',
        required: true,
        attributes: ['id'],
        where: { patient_id: patientId },
      },
    ],
    order: [['created_at', 'DESC']],
  });

  // 获取历史高风险次数
  const highRiskCount = await AnalysisResult.count({
    where: { risk_level: { [Op.in]: ['high', 'critical'] } },
    include: [
      {
        model: Study,
        as: 'study',
        required: true,
        attributes: [],
        where: { patient_id: patientId },
      },
    ],
  });

  // 随访合规检查
  const [totalFollowups, overdueFollowups] = await Promise.all([
    FollowUp.count({ where: { patient_id: patientId } }),
    FollowUp.count({ where: { patient_id: patientId, status: 'overdue' } }),
  ]);

  const factors = [];

  // —— 1. 年龄因素（权重 15）——
  let ageScore = 30;
  let ageLevel = 'medium';
  let ageDesc = '年龄信息缺失，按中风险估算';
  if (patientRaw.birth_date) {
    const age = Math.floor(
      (Date.now() - new Date(patientRaw.birth_date).getTime()) / (365.25 * 86400000),
    );
    if (age < 25) {
      ageScore = 15; ageLevel = 'low'; ageDesc = `${age}岁，低龄段，宫颈病变风险相对较低`;
    } else if (age <= 45) {
      ageScore = 45; ageLevel = 'medium'; ageDesc = `${age}岁，处于宫颈癌高发年龄段`;
    } else {
      ageScore = 70; ageLevel = 'high'; ageDesc = `${age}岁，高龄段需持续关注`;
    }
  }
  factors.push({
    name: '年龄因素', category: '人口学', score: ageScore,
    weight: 15, description: ageDesc, level: ageLevel,
  });

  // —— 2. 性行为史（权重 20）——
  const sexHistory = patientRaw.sexual_history || 'none';
  const highRiskSexual = ['irregular', 'multiple_partners', 'early_sexual_activity'];
  let sexScore = 10;
  let sexLevel = 'low';
  let sexDesc = '无特殊性行为史记录';
  if (highRiskSexual.includes(sexHistory)) {
    sexScore = 75; sexLevel = 'high';
    const labelMap = {
      irregular: '不规律性行为',
      multiple_partners: '多伴侣',
      early_sexual_activity: '过早性行为',
    };
    sexDesc = `存在${labelMap[sexHistory] || '高风险'}性行为史，HPV感染风险较高`;
  } else if (sexHistory === 'regular') {
    sexScore = 25; sexLevel = 'low'; sexDesc = '规律性行为史，风险相对可控';
  } else if (sexHistory === 'other') {
    sexScore = 40; sexLevel = 'medium'; sexDesc = '其他性行为情况，建议进一步评估';
  }
  factors.push({
    name: '性行为史', category: '行为', score: sexScore,
    weight: 20, description: sexDesc, level: sexLevel,
  });

  // —— 3. 家族史（权重 15）——
  let familyScore = 10;
  let familyLevel = 'low';
  let familyDesc = '无相关家族病史记录';
  if (patientRaw.family_history && patientRaw.family_history.trim().length > 0) {
    familyScore = 65; familyLevel = 'high';
    familyDesc = '存在家族病史记录，遗传风险需关注';
  }
  factors.push({
    name: '家族病史', category: '遗传', score: familyScore,
    weight: 15, description: familyDesc, level: familyLevel,
  });

  // —— 4. 既往诊断（权重 25）——
  let pastScore = 10;
  let pastLevel = 'low';
  let pastDesc = '历史检查均为低风险';
  if (highRiskCount > 0) {
    pastScore = clamp(30 + highRiskCount * 15, 30, 90);
    pastLevel = pastScore >= 70 ? 'critical' : 'high';
    pastDesc = `既往 ${highRiskCount} 次高风险检查结果，需持续随访`;
  }
  // 叠加最新结果
  if (latestResult) {
    const latestRisk = normalizeRiskLevel(latestResult.risk_level);
    if (latestRisk === 'critical') {
      pastScore = clamp(pastScore + 20, 0, 100);
      pastLevel = 'critical';
    } else if (latestRisk === 'high') {
      pastScore = clamp(pastScore + 10, 0, 100);
    }
  }
  factors.push({
    name: '既往诊断', category: '临床', score: pastScore,
    weight: 25, description: pastDesc, level: pastLevel,
  });

  // —— 5. 随访合规（权重 15）——
  let complianceScore = 10;
  let complianceLevel = 'low';
  let complianceDesc = '随访记录良好';
  if (totalFollowups === 0) {
    complianceScore = 30; complianceLevel = 'medium';
    complianceDesc = '暂无随访记录，建议建立随访计划';
  } else if (overdueFollowups > 0) {
    const overdueRatio = overdueFollowups / totalFollowups;
    complianceScore = clamp(Math.round(overdueRatio * 100), 30, 90);
    complianceLevel = complianceScore >= 60 ? 'high' : 'medium';
    complianceDesc = `${overdueFollowups}/${totalFollowups} 条随访逾期（${(overdueRatio * 100).toFixed(0)}%）`;
  }
  factors.push({
    name: '随访合规', category: '管理', score: complianceScore,
    weight: 15, description: complianceDesc, level: complianceLevel,
  });

  // —— 6. HPV 生物标志物（权重 10）——
  let hpvScore = 20;
  let hpvLevel = 'low';
  let hpvDesc = '未检测到 HPV 相关标志物数据';
  if (latestResult) {
    const biomarkers = latestResult.toJSON().biomarkers;
    if (biomarkers && typeof biomarkers === 'object') {
      const hpvValue = biomarkers.HPV || biomarkers.hpv || biomarkers.hpv_status || '';
      if (/positive|阳性|高危/i.test(String(hpvValue))) {
        hpvScore = 80; hpvLevel = 'critical';
        hpvDesc = 'HPV 阳性/高危型，宫颈病变风险显著增高';
      } else if (/negative|阴性/i.test(String(hpvValue))) {
        hpvScore = 5; hpvLevel = 'low';
        hpvDesc = 'HPV 阴性，当前感染风险较低';
      }
    }
  }
  factors.push({
    name: 'HPV 状态', category: '生物标志物', score: hpvScore,
    weight: 10, description: hpvDesc, level: hpvLevel,
  });

  // 加权计算综合评分
  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const overallScore = clamp(
    Math.round(factors.reduce((s, f) => s + f.score * (f.weight / totalWeight), 0)),
    0,
    100,
  );

  // 个性化建议
  const recommendations = [];
  const overallLevel = resolveRiskLevelByScore(overallScore);

  if (overallLevel === 'critical' || overallLevel === 'high') {
    recommendations.push('综合风险较高，建议尽快安排阴道镜检查或组织活检。');
  } else if (overallLevel === 'medium') {
    recommendations.push('综合风险中等，建议每6个月进行一次筛查。');
  } else {
    recommendations.push('综合风险较低，建议保持每年常规筛查。');
  }

  factors.forEach((f) => {
    if (f.level === 'high' || f.level === 'critical') {
      if (f.name === '性行为史') {
        recommendations.push('建议加强 HPV 疫苗接种宣教和定期 HPV 检测。');
      } else if (f.name === '家族病史') {
        recommendations.push('有家族病史，建议适当提高筛查频率。');
      } else if (f.name === '随访合规') {
        recommendations.push('存在逾期随访，请尽快完成待处理的随访计划。');
      } else if (f.name === 'HPV 状态') {
        recommendations.push('HPV 阳性需定期复查，建议结合 TCT 联合筛查。');
      }
    }
  });

  return {
    overallScore,
    factors,
    recommendations,
  };
}

module.exports = {
  getPatientOverview,
  getPatientHistory,
  getPatientCompare,
  getPatientTimeline,
  getPatientRiskProfile,
  predictDiseaseProgression,
  crossPeriodComparison,
  analyzeRiskFactors,
};
