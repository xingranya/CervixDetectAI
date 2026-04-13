/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getPatientOverview,
  getPatientHistory,
  getPatientCompare,
  getPatientTimeline,
  getPatientRiskProfile,
  predictDiseaseProgression,
  crossPeriodComparison,
  analyzeRiskFactors,
} = require('../services/patientInsights.service');
const { handleRouteError } = require('../utils/errorHandler');

const router = express.Router();

function parsePositiveInt(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return null;
  }
  return num;
}

/**
 * GET /api/patient-insights/:patientId/overview
 * 获取患者总览
 */
router.get('/:patientId/overview', authenticate, async (req, res) => {
  try {
    const patientId = parsePositiveInt(req.params.patientId);
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId 参数无效',
      });
    }

    const overview = await getPatientOverview(patientId);
    return res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    return handleRouteError(res, error, { service: 'PatientInsights', endpoint: 'GET /:patientId/overview' });
  }
});

/**
 * GET /api/patient-insights/:patientId/history
 * 获取患者历史趋势
 */
router.get('/:patientId/history', authenticate, async (req, res) => {
  try {
    const patientId = parsePositiveInt(req.params.patientId);
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId 参数无效',
      });
    }

    const history = await getPatientHistory(patientId, {
      limit: req.query.limit,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
    });

    return res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    return handleRouteError(res, error, { service: 'PatientInsights', endpoint: 'GET /:patientId/history' });
  }
});

/**
 * GET /api/patient-insights/:patientId/compare
 * 对比两次病例检查结果
 */
router.get('/:patientId/compare', authenticate, async (req, res) => {
  try {
    const patientId = parsePositiveInt(req.params.patientId);
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId 参数无效',
      });
    }

    const leftStudyId = parsePositiveInt(req.query.left_study_id);
    const rightStudyId = parsePositiveInt(req.query.right_study_id);

    if (!leftStudyId || !rightStudyId) {
      return res.status(400).json({
        success: false,
        message: 'left_study_id 与 right_study_id 为必填正整数',
      });
    }

    const compare = await getPatientCompare(patientId, leftStudyId, rightStudyId);
    return res.json({
      success: true,
      data: compare,
    });
  } catch (error) {
    return handleRouteError(res, error, { service: 'PatientInsights', endpoint: 'GET /:patientId/compare' });
  }
});

/**
 * GET /api/patient-insights/:patientId/timeline
 * 获取患者时间线
 */
router.get('/:patientId/timeline', authenticate, async (req, res) => {
  try {
    const patientId = parsePositiveInt(req.params.patientId);
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId 参数无效',
      });
    }

    const timeline = await getPatientTimeline(patientId, {
      page: req.query.page,
      limit: req.query.limit,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
    });

    return res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    return handleRouteError(res, error, { service: 'PatientInsights', endpoint: 'GET /:patientId/timeline' });
  }
});

/**
 * GET /api/patient-insights/:patientId/risk-profile
 * 获取患者风险画像
 */
router.get('/:patientId/risk-profile', authenticate, async (req, res) => {
  try {
    const patientId = parsePositiveInt(req.params.patientId);
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId 参数无效',
      });
    }

    const riskProfile = await getPatientRiskProfile(patientId);
    return res.json({
      success: true,
      data: riskProfile,
    });
  } catch (error) {
    return handleRouteError(res, error, { service: 'PatientInsights', endpoint: 'GET /:patientId/risk-profile' });
  }
});

/**
 * GET /api/patient-insights/:patientId/disease-alert
 * 疾病进展预警
 */
router.get('/:patientId/disease-alert', authenticate, async (req, res) => {
  try {
    const patientId = parsePositiveInt(req.params.patientId);
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId 参数无效',
      });
    }

    const result = await predictDiseaseProgression(patientId);
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleRouteError(res, error, { service: 'PatientInsights', endpoint: 'GET /:patientId/disease-alert' });
  }
});

/**
 * GET /api/patient-insights/:patientId/comparison
 * 多时段对比分析
 */
router.get('/:patientId/comparison', authenticate, async (req, res) => {
  try {
    const patientId = parsePositiveInt(req.params.patientId);
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId 参数无效',
      });
    }

    const periodA = { start: req.query.periodA_start, end: req.query.periodA_end };
    const periodB = { start: req.query.periodB_start, end: req.query.periodB_end };
    const result = await crossPeriodComparison(patientId, periodA, periodB);
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleRouteError(res, error, { service: 'PatientInsights', endpoint: 'GET /:patientId/comparison' });
  }
});

/**
 * GET /api/patient-insights/:patientId/risk-factors
 * 个性化风险因素分析
 */
router.get('/:patientId/risk-factors', authenticate, async (req, res) => {
  try {
    const patientId = parsePositiveInt(req.params.patientId);
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId 参数无效',
      });
    }

    const result = await analyzeRiskFactors(patientId);
    return res.json({ success: true, data: result });
  } catch (error) {
    return handleRouteError(res, error, { service: 'PatientInsights', endpoint: 'GET /:patientId/risk-factors' });
  }
});

module.exports = router;
