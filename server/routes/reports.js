/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { authenticate } = require('../middleware/auth');
const { handleRouteError } = require('../utils/errorHandler');
const {
  MedicalReport,
  ReportShareLink,
  Study,
  Patient,
  AnalysisResult,
  User,
} = require('../models');
const { generatePDF, generateWord, generateExcel } = require('../services/reportGenerator.service');
const { getTemplate } = require('../constants/reportTemplates');

// ============================================================
// 公开接口（无需认证）— 必须放在 /:id 之前以避免路由冲突
// ============================================================

/**
 * GET /shared/:token — 通过分享链接访问报告（无需认证）
 */
router.get('/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const shareLink = await ReportShareLink.findOne({
      where: { share_token: token, is_active: true },
      include: [
        {
          model: MedicalReport,
          as: 'report',
          include: [
            { model: Study, as: 'study' },
            { model: Patient, as: 'patient' },
            { model: AnalysisResult, as: 'analysis_result' },
          ],
        },
      ],
    });

    if (!shareLink) {
      return res.status(404).json({ success: false, message: '分享链接不存在或已失效' });
    }

    // 检查过期
    if (new Date() > new Date(shareLink.expires_at)) {
      return res.status(410).json({ success: false, message: '分享链接已过期' });
    }

    // 检查访问次数
    if (
      shareLink.max_access_count > 0 &&
      shareLink.current_access_count >= shareLink.max_access_count
    ) {
      return res.status(410).json({ success: false, message: '分享链接访问次数已用完' });
    }

    // 更新访问次数
    await shareLink.increment('current_access_count');

    const report = shareLink.report;
    if (!report) {
      return res.status(404).json({ success: false, message: '关联报告不存在' });
    }

    // 如果文件存在则返回下载，否则返回报告数据
    const filePath = report.file_path;
    if (filePath && fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeMap = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
      res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
      return fs.createReadStream(filePath).pipe(res);
    }

    // 文件不存在时返回报告元数据
    return res.json({
      success: true,
      data: {
        report: {
          id: report.id,
          report_id: report.report_id,
          report_title: report.report_title,
          status: report.status,
          created_at: report.created_at,
          study: report.study,
          patient: report.patient,
          analysis_result: report.analysis_result,
        },
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Reports', endpoint: 'GET /shared/:token' });
  }
});

// ============================================================
// 需要认证的接口
// ============================================================

/**
 * POST /batch-export
 * 批量导出报告为 ZIP 压缩包
 * 请求体：{ study_ids: number[], format: 'pdf' | 'word' | 'excel' }
 */
router.post('/batch-export', authenticate, async (req, res) => {
  try {
    const { study_ids, format = 'pdf' } = req.body;

    // 参数校验
    if (!Array.isArray(study_ids) || study_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'study_ids 必须为非空数组' });
    }

    // 数量限制（最多50条）
    if (study_ids.length > 50) {
      return res.status(400).json({ success: false, message: '批量导出数量不能超过50条' });
    }

    const validFormats = ['pdf', 'word', 'excel'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        message: `不支持的格式：${format}，可选：${validFormats.join(', ')}`,
      });
    }

    // 获取模板
    const user = await User.findByPk(req.user.id);
    const template = getTemplate(user?.hospital_id);

    // 准备 ZIP 响应
    const timestamp = Date.now();
    const zipFileName = `reports_batch_${timestamp}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    const items = [];
    let successCount = 0;
    let failCount = 0;

    for (const studyId of study_ids) {
      try {
        // 验证病例存在且有分析结果
        const study = await Study.findByPk(studyId, {
          include: [
            { model: Patient, as: 'patient' },
            { model: AnalysisResult, as: 'analysis_results' },
          ],
        });

        if (!study) {
          items.push({ study_id: studyId, status: 'FAILED', error: '病例不存在' });
          failCount += 1;
          continue;
        }

        if (!study.analysis_results || study.analysis_results.length === 0) {
          items.push({ study_id: studyId, status: 'FAILED', error: '该病例暂无分析结果' });
          failCount += 1;
          continue;
        }

        // 生成报告文件
        let result;
        if (format === 'pdf') {
          result = await generatePDF(studyId, template);
        } else if (format === 'word') {
          result = await generateWord(studyId, template);
        } else {
          result = await generateExcel(studyId);
        }

        // 添加到 ZIP
        const fileStream = fs.createReadStream(result.filePath);
        archive.append(fileStream, { name: result.fileName });

        items.push({ study_id: studyId, status: 'SUCCESS', file_name: result.fileName });
        successCount += 1;
      } catch (err) {
        items.push({ study_id: studyId, status: 'FAILED', error: err.message || '生成报告失败' });
        failCount += 1;
      }
    }

    // 在 ZIP 中添加结果摘要
    const summaryContent = JSON.stringify(
      {
        export_time: new Date().toISOString(),
        format,
        total: study_ids.length,
        success: successCount,
        failed: failCount,
        items,
      },
      null,
      2,
    );
    archive.append(summaryContent, { name: '_export_summary.json' });

    // 完成 ZIP 打包
    await archive.finalize();
  } catch (error) {
    // 如果响应头已发送，无法返回错误 JSON
    if (!res.headersSent) {
      handleRouteError(res, error, { service: 'Reports', endpoint: 'POST /batch-export' });
    } else {
      console.error('批量导出过程中发生错误:', error);
    }
  }
});

/**
 * POST /generate — 生成报告
 */
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { study_id, format = 'pdf', template_id } = req.body;

    if (!study_id) {
      return res.status(400).json({ success: false, message: '缺少 study_id 参数' });
    }

    // 验证病例存在且有分析结果
    const study = await Study.findByPk(study_id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: AnalysisResult, as: 'analysis_results' },
      ],
    });

    if (!study) {
      return res.status(404).json({ success: false, message: '病例不存在' });
    }

    if (!study.analysis_results || study.analysis_results.length === 0) {
      return res.status(400).json({ success: false, message: '该病例暂无分析结果，无法生成报告' });
    }

    // 获取模板
    const user = await User.findByPk(req.user.id);
    const template = getTemplate(user?.hospital_id, template_id);

    let result;
    const validFormats = ['pdf', 'word', 'excel'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        message: `不支持的格式：${format}，可选：${validFormats.join(', ')}`,
      });
    }

    if (format === 'pdf') {
      result = await generatePDF(study_id, template);
    } else if (format === 'word') {
      result = await generateWord(study_id, template);
    } else {
      result = await generateExcel(study_id);
    }

    // 创建 MedicalReport 记录
    const latestResult = study.analysis_results[study.analysis_results.length - 1];
    const report = await MedicalReport.create({
      study_id: study.id,
      analysis_result_id: latestResult.id,
      patient_id: study.patient_id,
      report_type: 'final',
      report_title: `${template.header} - ${study.study_id}`,
      file_path: result.filePath,
      file_size: result.fileSize,
      page_count: result.pageCount || null,
      template_version: template.version,
      generated_by: req.user.id,
      status: 'approved',
    });

    return res.json({
      success: true,
      message: '报告生成成功',
      data: {
        report: {
          id: report.id,
          report_id: report.report_id,
          report_title: report.report_title,
          file_path: result.fileName,
          file_size: result.fileSize,
          format,
          status: report.status,
          created_at: report.created_at,
        },
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Reports', endpoint: 'POST /generate' });
  }
});

/**
 * GET / — 报告列表（分页）
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, patient_id, study_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (patient_id) where.patient_id = parseInt(patient_id);
    if (study_id) where.study_id = parseInt(study_id);

    const { count, rows } = await MedicalReport.findAndCountAll({
      where,
      include: [
        {
          model: Study,
          as: 'study',
          attributes: ['id', 'study_id', 'study_type', 'study_date', 'status'],
        },
        { model: Patient, as: 'patient', attributes: ['id', 'patient_id', 'name', 'gender'] },
        { model: User, as: 'generator', attributes: ['id', 'username', 'real_name'] },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return res.json({
      success: true,
      data: {
        reports: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Reports', endpoint: 'GET /' });
  }
});

/**
 * GET /:id — 报告详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const report = await MedicalReport.findByPk(req.params.id, {
      include: [
        { model: Study, as: 'study' },
        { model: Patient, as: 'patient' },
        { model: AnalysisResult, as: 'analysis_result' },
        { model: User, as: 'generator', attributes: ['id', 'username', 'real_name'] },
        { model: ReportShareLink, as: 'shareLinks' },
      ],
    });

    if (!report) {
      return res.status(404).json({ success: false, message: '报告不存在' });
    }

    return res.json({ success: true, data: { report } });
  } catch (error) {
    handleRouteError(res, error, { service: 'Reports', endpoint: 'GET /:id' });
  }
});

/**
 * GET /:id/download — 下载报告文件
 */
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const report = await MedicalReport.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: '报告不存在' });
    }

    const filePath = report.file_path;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: '报告文件不存在，可能已被清理' });
    }

    // 更新下载统计
    await report.update({
      download_count: (report.download_count || 0) + 1,
      last_downloaded_at: new Date(),
    });

    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    return fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    handleRouteError(res, error, { service: 'Reports', endpoint: 'GET /:id/download' });
  }
});

/**
 * POST /:id/share — 创建分享链接
 */
router.post('/:id/share', authenticate, async (req, res) => {
  try {
    const { expires_hours = 24, max_access_count = 0 } = req.body;
    const reportId = req.params.id;

    const report = await MedicalReport.findByPk(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: '报告不存在' });
    }

    // 生成分享令牌
    const shareToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expires_hours * 60 * 60 * 1000);

    const shareLink = await ReportShareLink.create({
      report_id: report.id,
      share_token: shareToken,
      expires_at: expiresAt,
      max_access_count: parseInt(max_access_count) || 0,
      created_by: req.user.id,
    });

    // 构造分享URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const shareUrl = `${baseUrl}/api/reports/shared/${shareToken}`;

    return res.json({
      success: true,
      message: '分享链接创建成功',
      data: {
        share_link: {
          id: shareLink.id,
          share_url: shareUrl,
          share_token: shareToken,
          expires_at: expiresAt,
          max_access_count: shareLink.max_access_count,
        },
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Reports', endpoint: 'POST /:id/share' });
  }
});

module.exports = router;
