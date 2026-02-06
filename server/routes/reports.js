/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();

// Mock Data
let reports = [
  {
    id: 'RPT-20251212-001',
    patientName: '张丽',
    age: 42,
    patientId: 'P20251212001',
    date: '2025-12-12',
    riskLevel: 'high',
    status: 'completed',
    confidence: 92,
    acetowhite: '阳性（厚醋白）',
    iodine: '不着色',
    lesionArea: '3点-6点',
    recommendation: '建议行宫颈活检术以明确病理诊断。',
  },
  {
    id: 'RPT-20251211-045',
    patientName: '王芳',
    age: 35,
    patientId: 'P20251211045',
    date: '2025-12-11',
    riskLevel: 'medium',
    status: 'pending',
    confidence: 78,
    acetowhite: '弱阳性',
    iodine: '部分着色',
    lesionArea: '12点方向',
    recommendation: '建议阴道镜下活检。',
  },
  {
    id: 'RPT-20251210-128',
    patientName: '李娜',
    age: 50,
    patientId: 'P20251210128',
    date: '2025-12-10',
    riskLevel: 'low',
    status: 'completed',
    confidence: 95,
    acetowhite: '阴性',
    iodine: '完全着色',
    lesionArea: '无明显病变',
    recommendation: '定期随访。',
  },
  {
    id: 'RPT-20251209-087',
    patientName: '刘霞',
    age: 28,
    patientId: 'P20251209087',
    date: '2025-12-09',
    riskLevel: 'high',
    status: 'completed',
    confidence: 88,
    acetowhite: '阳性',
    iodine: '不着色',
    lesionArea: '全周',
    recommendation: '建议立即转诊。',
  },
  {
    id: 'RPT-20251208-056',
    patientName: '陈静',
    age: 39,
    patientId: 'P20251208056',
    date: '2025-12-08',
    riskLevel: 'medium',
    status: 'draft',
    confidence: 75,
    acetowhite: '可疑',
    iodine: '点状不着色',
    lesionArea: '9点方向',
    recommendation: '建议复查。',
  },
];

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: 获取报告列表
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: patient
 *         schema:
 *           type: string
 *         description: 患者姓名或ID
 *       - in: query
 *         name: riskLevel
 *         schema:
 *           type: string
 *         description: 风险等级
 *     responses:
 *       200:
 *         description: 成功获取报告列表
 */
router.get('/', (req, res) => {
  const { patient, riskLevel, status } = req.query;
  let filtered = [...reports];

  if (patient) {
    filtered = filtered.filter(
      (r) => r.patientName.includes(patient) || r.patientId.includes(patient),
    );
  }
  if (riskLevel) {
    filtered = filtered.filter((r) => r.riskLevel === riskLevel);
  }
  if (status) {
    filtered = filtered.filter((r) => r.status === status);
  }

  res.json({
    success: true,
    data: { reports: filtered },
  });
});

/**
 * @swagger
 * /reports/{id}:
 *   get:
 *     summary: 获取报告详情
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功获取报告详情
 */
router.get('/:id', (req, res) => {
  const report = reports.find((r) => r.id === req.params.id);
  if (report) {
    res.json({
      success: true,
      data: { report },
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }
});

/**
 * @swagger
 * /reports/{id}:
 *   put:
 *     summary: 更新报告
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: 成功更新报告
 */
router.put('/:id', (req, res) => {
  const index = reports.findIndex((r) => r.id === req.params.id);
  if (index !== -1) {
    reports[index] = { ...reports[index], ...req.body };
    res.json({
      success: true,
      message: 'Report updated',
      data: { report: reports[index] },
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }
});

module.exports = router;
