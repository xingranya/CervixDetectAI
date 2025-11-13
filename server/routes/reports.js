/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const path = require('path');
const fs = require('fs');
const { MedicalReport, Study, Patient, AnalysisResult } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/reports
 * 创建医疗报告
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { study_id, report_type, content, doctor_name, doctor_title } = req.body;

    // 验证必填字段
    if (!study_id || !report_type) {
      return res.status(400).json({
        success: false,
        message: '病例ID和报告类型为必填项',
      });
    }

    // 验证病例是否存在
    const study = await Study.findByPk(study_id);
    if (!study) {
      return res.status(404).json({
        success: false,
        message: '病例不存在',
      });
    }

    // 非管理员只能为自己的病例创建报告
    if (req.user.role !== 'admin' && study.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权为该病例创建报告',
      });
    }

    // 创建报告（report_id会在beforeCreate hook中自动生成）
    const report = await MedicalReport.create({
      study_id,
      generated_by: req.user.id,
      report_type,
      content,
      doctor_name,
      doctor_title,
      status: 'draft',
    });

    const createdReport = await MedicalReport.findByPk(report.id, {
      include: [
        {
          model: Study,
          as: 'study',
          attributes: ['id', 'study_id', 'study_date', 'study_type'],
          include: [
            {
              model: Patient,
              as: 'patient',
              attributes: ['id', 'patient_id', 'name', 'gender'],
            },
          ],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: '报告创建成功',
      data: { report: createdReport },
    });
  } catch (error) {
    console.error('创建报告错误:', error);
    res.status(500).json({
      success: false,
      message: '创建报告失败',
      error: error.message,
    });
  }
});

/**
 * POST /api/reports/generate/:studyId
 * 自动生成报告（基于分析结果）
 */
router.post('/generate/:studyId', authenticate, async (req, res) => {
  try {
    const study = await Study.findByPk(req.params.studyId, {
      include: [
        {
          model: Patient,
          as: 'patient',
        },
      ],
    });

    if (!study) {
      return res.status(404).json({
        success: false,
        message: '病例不存在',
      });
    }

    // 非管理员只能为自己的病例生成报告
    if (req.user.role !== 'admin' && study.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权为该病例生成报告',
      });
    }

    // 查找最新的分析结果
    const { AnalysisTask } = require('../models');
    const latestTask = await AnalysisTask.findOne({
      where: { study_id: study.id, status: 'completed' },
      include: [
        {
          model: AnalysisResult,
          as: 'result',
          required: true,
        },
      ],
      order: [['completed_at', 'DESC']],
    });

    if (!latestTask || !latestTask.result) {
      return res.status(400).json({
        success: false,
        message: '未找到该病例的分析结果',
      });
    }

    const result = latestTask.result;

    // 生成报告内容
    const reportContent = {
      patient_info: {
        name: study.patient.name,
        gender: study.patient.gender,
        patient_id: study.patient.patient_id,
      },
      study_info: {
        study_id: study.study_id,
        study_date: study.study_date,
        study_type: study.study_type,
        clinical_diagnosis: study.clinical_diagnosis,
      },
      analysis_result: {
        risk_level: result.risk_level,
        confidence_score: result.confidence_score,
        primary_diagnosis: result.primary_diagnosis,
        recommendations: result.recommendations,
        biomarkers: result.biomarkers,
        suspicious_areas: result.suspicious_areas,
      },
      generated_at: new Date().toISOString(),
    };

    // 创建报告
    const report = await MedicalReport.create({
      study_id: study.id,
      generated_by: req.user.id,
      report_type: 'ai_analysis',
      content: JSON.stringify(reportContent, null, 2),
      doctor_name: req.user.real_name || req.user.username,
      status: 'draft',
    });

    const createdReport = await MedicalReport.findByPk(report.id, {
      include: [
        {
          model: Study,
          as: 'study',
          include: [
            {
              model: Patient,
              as: 'patient',
            },
          ],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: '报告生成成功',
      data: { report: createdReport },
    });
  } catch (error) {
    console.error('生成报告错误:', error);
    res.status(500).json({
      success: false,
      message: '生成报告失败',
      error: error.message,
    });
  }
});

/**
 * GET /api/reports
 * 获取报告列表
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, study_id, report_type, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (study_id) where.study_id = study_id;
    if (report_type) where.report_type = report_type;
    if (status) where.status = status;

    // 非管理员只能查看自己生成的报告
    if (req.user.role !== 'admin') {
      where.generated_by = req.user.id;
    }

    const { count, rows } = await MedicalReport.findAndCountAll({
      where,
      include: [
        {
          model: Study,
          as: 'study',
          attributes: ['id', 'study_id', 'study_date', 'study_type'],
          include: [
            {
              model: Patient,
              as: 'patient',
              attributes: ['id', 'patient_id', 'name'],
            },
          ],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        reports: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取报告列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取报告列表失败',
      error: error.message,
    });
  }
});

/**
 * GET /api/reports/:id
 * 获取报告详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const report = await MedicalReport.findByPk(req.params.id, {
      include: [
        {
          model: Study,
          as: 'study',
          include: [
            {
              model: Patient,
              as: 'patient',
            },
          ],
        },
      ],
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: '报告不存在',
      });
    }

    // 非管理员只能查看自己生成的报告
    if (req.user.role !== 'admin' && report.generated_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权访问该报告',
      });
    }

    res.json({
      success: true,
      data: { report },
    });
  } catch (error) {
    console.error('获取报告详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取报告详情失败',
      error: error.message,
    });
  }
});

/**
 * PUT /api/reports/:id
 * 更新报告
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const report = await MedicalReport.findByPk(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: '报告不存在',
      });
    }

    // 非管理员只能更新自己的报告
    if (req.user.role !== 'admin' && report.generated_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权更新该报告',
      });
    }

    const { content, doctor_name, doctor_title, status } = req.body;
    const updateData = {};

    if (content !== undefined) updateData.content = content;
    if (doctor_name !== undefined) updateData.doctor_name = doctor_name;
    if (doctor_title !== undefined) updateData.doctor_title = doctor_title;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'finalized' && !report.finalized_at) {
        updateData.finalized_at = new Date();
      }
    }

    await report.update(updateData);

    const updatedReport = await MedicalReport.findByPk(req.params.id, {
      include: [
        {
          model: Study,
          as: 'study',
          include: [
            {
              model: Patient,
              as: 'patient',
            },
          ],
        },
      ],
    });

    res.json({
      success: true,
      message: '报告更新成功',
      data: { report: updatedReport },
    });
  } catch (error) {
    console.error('更新报告错误:', error);
    res.status(500).json({
      success: false,
      message: '更新报告失败',
      error: error.message,
    });
  }
});

/**
 * GET /api/reports/:id/download
 * 下载报告PDF
 */
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const report = await MedicalReport.findByPk(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: '报告不存在',
      });
    }

    // 非管理员只能下载自己的报告
    if (req.user.role !== 'admin' && report.generated_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权下载该报告',
      });
    }

    if (!report.pdf_path) {
      return res.status(404).json({
        success: false,
        message: '报告PDF未生成',
      });
    }

    const filePath = path.join(__dirname, '..', report.pdf_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'PDF文件不存在',
      });
    }

    // 设置响应头
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.report_id}.pdf"`);

    // 发送文件
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('下载报告错误:', error);
    res.status(500).json({
      success: false,
      message: '下载报告失败',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/reports/:id
 * 删除报告
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const report = await MedicalReport.findByPk(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: '报告不存在',
      });
    }

    // 非管理员只能删除自己的报告
    if (req.user.role !== 'admin' && report.generated_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权删除该报告',
      });
    }

    // 删除PDF文件
    if (report.pdf_path) {
      const filePath = path.join(__dirname, '..', report.pdf_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 软删除
    await report.destroy();

    res.json({
      success: true,
      message: '报告已删除',
    });
  } catch (error) {
    console.error('删除报告错误:', error);
    res.status(500).json({
      success: false,
      message: '删除报告失败',
      error: error.message,
    });
  }
});

module.exports = router;
