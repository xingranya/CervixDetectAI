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

module.exports = {
  getPatientOverview,
  getPatientHistory,
  getPatientCompare,
  getPatientTimeline,
  getPatientRiskProfile,
};
