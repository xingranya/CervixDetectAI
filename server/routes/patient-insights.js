/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getPatientOverview,
  getPatientHistory,
  getPatientCompare,
  getPatientTimeline,
  getPatientRiskProfile,
} = require('../services/patientInsights.service');

const router = express.Router();

function parsePositiveInt(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return null;
  }
  return num;
}

function handleError(res, error, fallbackMessage) {
  const status = error.status || 500;
  res.status(status).json({
    success: false,
    message: error.message || fallbackMessage,
    ...(process.env.NODE_ENV === 'development' && { error: error.stack }),
  });
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
    return handleError(res, error, '获取患者总览失败');
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
    return handleError(res, error, '获取患者历史趋势失败');
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
    return handleError(res, error, '获取患者检查对比失败');
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
    return handleError(res, error, '获取患者时间线失败');
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
    return handleError(res, error, '获取患者风险画像失败');
  }
});

module.exports = router;
