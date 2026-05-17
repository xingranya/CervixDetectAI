/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { Op } = require('sequelize');
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
const {
  createLocalFileReadStream,
  deleteReport,
  getReportDownloadTarget,
  getSignedShareTarget,
  guessMimeType,
  saveReport,
} = require('../services/reportStorage.service');

function resolveDownloadFileName(report) {
  const rawPath = String(report?.file_path || report?.storage_url || report?.storage_key || '').trim();
  if (!rawPath) {
    return `report_${report?.report_id || report?.id || 'unknown'}`;
  }

  const withoutQuery = rawPath.split('?')[0];
  const fileName = path.basename(withoutQuery);
  return fileName || `report_${report?.report_id || report?.id || 'unknown'}`;
}

function setFileHeaders(res, fileName) {
  res.setHeader('Content-Type', guessMimeType(fileName));
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
}

async function sendReportFile(res, report, target) {
  const fileName = resolveDownloadFileName(report);

  if (target.type === 'buffer') {
    setFileHeaders(res, fileName);
    return res.end(target.buffer);
  }

  setFileHeaders(res, fileName);
  return createLocalFileReadStream(target.filePath).pipe(res);
}

function canAccessStudyReport(user, study) {
  if (!user || !study) return false;
  if (user.role === 'admin') return true;
  return study.user_id === null || study.user_id === user.id;
}

function buildReportStudyAccessWhere(user) {
  if (!user || user.role === 'admin') {
    return {};
  }

  return {
    [Op.or]: [{ user_id: user.id }, { user_id: null }],
  };
}

async function getStudyForReportAccess(studyId, user, include = []) {
  const study = await Study.findByPk(studyId, {
    include,
  });

  if (!study) {
    return { study: null, denied: false };
  }

  if (!canAccessStudyReport(user, study)) {
    return { study: null, denied: true };
  }

  return { study, denied: false };
}

async function getReportForUser(reportId, user, extraIncludes = []) {
  const report = await MedicalReport.findByPk(reportId, {
    include: [
      {
        model: Study,
        as: 'study',
        attributes: ['id', 'study_id', 'study_type', 'study_date', 'status', 'user_id'],
      },
      ...extraIncludes,
    ],
  });

  if (!report) {
    return { report: null, denied: false };
  }

  if (!canAccessStudyReport(user, report.study)) {
    return { report: null, denied: true };
  }

  return { report, denied: false };
}

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

    if (new Date() > new Date(shareLink.expires_at)) {
      return res.status(410).json({ success: false, message: '分享链接已过期' });
    }

    if (
      shareLink.max_access_count > 0 &&
      shareLink.current_access_count >= shareLink.max_access_count
    ) {
      return res.status(410).json({ success: false, message: '分享链接访问次数已用完' });
    }

    await shareLink.increment('current_access_count');

    const report = shareLink.report;
    if (!report) {
      return res.status(404).json({ success: false, message: '关联报告不存在' });
    }

    const target = await getSignedShareTarget(report, shareLink.share_token);

    await sendReportFile(res, report, target);
    return;
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

    if (!Array.isArray(study_ids) || study_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'study_ids 必须为非空数组' });
    }

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

    const user = await User.findByPk(req.user.id);
    const template = getTemplate(user?.hospital_id);

    const timestamp = Date.now();
    const zipFileName = `reports_batch_${timestamp}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    const items = [];
    const temporaryBlobKeys = [];
    let successCount = 0;
    let failCount = 0;

    for (const studyId of study_ids) {
      try {
        const { study, denied } = await getStudyForReportAccess(studyId, req.user, [
          { model: Patient, as: 'patient' },
          { model: AnalysisResult, as: 'analysis_results' },
        ]);

        if (!study) {
          items.push({
            study_id: studyId,
            status: 'FAILED',
            error: denied ? '无权访问该病例报告' : '病例不存在',
          });
          failCount += 1;
          continue;
        }

        if (!study.analysis_results || study.analysis_results.length === 0) {
          items.push({ study_id: studyId, status: 'FAILED', error: '该病例暂无分析结果' });
          failCount += 1;
          continue;
        }

        let result;
        if (format === 'pdf') {
          result = await generatePDF(studyId, template);
        } else if (format === 'word') {
          result = await generateWord(studyId, template);
        } else {
          result = await generateExcel(studyId);
        }
        const storedReport = await saveReport(result.filePath, {
          reportId: `batch-${study.study_id || study.id}`,
          studyId: study.study_id || study.id,
          patientId: study.patient?.patient_id || study.patient_id,
          provider: process.env.REPORT_STORAGE_PROVIDER,
        });
        const target = await getReportDownloadTarget({
          storage_provider: storedReport.storageProvider,
          storage_key: storedReport.storageKey,
          storage_namespace: storedReport.storageNamespace,
          storage_url: storedReport.storageUrl,
          file_path: storedReport.filePath,
        });

        if (storedReport.storageProvider === 'edgeone-blob') {
          temporaryBlobKeys.push(storedReport.storageKey);
          await fs.promises.unlink(result.filePath).catch(() => {});
        }

        if (target.type === 'buffer') {
          archive.append(target.buffer, { name: storedReport.fileName });
        } else {
          archive.append(fs.createReadStream(target.filePath), { name: result.fileName });
        }

        items.push({
          study_id: studyId,
          status: 'SUCCESS',
          file_name: storedReport.fileName,
          storage_provider: storedReport.storageProvider,
        });
        successCount += 1;
      } catch (err) {
        items.push({ study_id: studyId, status: 'FAILED', error: err.message || '生成报告失败' });
        failCount += 1;
      }
    }

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

    await archive.finalize();
    await Promise.all(
      temporaryBlobKeys.map((storageKey) =>
        deleteReport(storageKey, {
          storage_provider: 'edgeone-blob',
        }).catch(() => {}),
      ),
    );
  } catch (error) {
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

    const { study, denied } = await getStudyForReportAccess(study_id, req.user, [
      { model: Patient, as: 'patient' },
      { model: AnalysisResult, as: 'analysis_results' },
    ]);

    if (!study) {
      return res
        .status(denied ? 403 : 404)
        .json({ success: false, message: denied ? '无权访问该病例报告' : '病例不存在' });
    }

    if (!study.analysis_results || study.analysis_results.length === 0) {
      return res.status(400).json({ success: false, message: '该病例暂无分析结果，无法生成报告' });
    }

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

    const latestResult = study.analysis_results[study.analysis_results.length - 1];
    const storedReport = await saveReport(result.filePath, {
      reportId: latestResult.task_id || `study-${study.id}`,
      studyId: study.study_id || study.id,
      patientId: study.patient?.patient_id || study.patient_id,
      provider: process.env.REPORT_STORAGE_PROVIDER,
    });
    let report;
    try {
      report = await MedicalReport.createWithRetry({
        study_id: study.id,
        analysis_result_id: latestResult.id,
        patient_id: study.patient_id,
        report_type: 'final',
        report_title: `${template.header} - ${study.study_id}`,
        file_path: storedReport.filePath,
        storage_provider: storedReport.storageProvider,
        storage_key: storedReport.storageKey,
        storage_namespace: storedReport.storageNamespace,
        storage_url: storedReport.storageUrl,
        storage_status: storedReport.storageStatus,
        file_size: storedReport.fileSize || result.fileSize,
        page_count: result.pageCount || null,
        template_version: template.version,
        generated_by: req.user.id,
        status: 'approved',
      });
    } catch (error) {
      if (storedReport.storageProvider === 'edgeone-blob' && storedReport.storageKey) {
        try {
          await deleteReport(storedReport.storageKey, {
            storage_provider: storedReport.storageProvider,
          });
        } catch (cleanupError) {
          console.error('[Reports] 报告写库失败后清理 EdgeOne Blob 失败:', cleanupError.message);
        }
      }
      throw error;
    }

    if (storedReport.storageProvider === 'edgeone-blob') {
      await fs.promises.unlink(result.filePath).catch(() => {});
    }

    return res.json({
      success: true,
      message: '报告生成成功',
      data: {
        report: {
          id: report.id,
          report_id: report.report_id,
          report_title: report.report_title,
          file_path: storedReport.fileName,
          file_size: storedReport.fileSize || result.fileSize,
          storage_provider: report.storage_provider,
          storage_status: report.storage_status,
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
          attributes: ['id', 'study_id', 'study_type', 'study_date', 'status', 'user_id'],
          where: buildReportStudyAccessWhere(req.user),
          required: true,
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
    const { report, denied } = await getReportForUser(req.params.id, req.user, [
      { model: Patient, as: 'patient' },
      { model: AnalysisResult, as: 'analysis_result' },
      { model: User, as: 'generator', attributes: ['id', 'username', 'real_name'] },
      { model: ReportShareLink, as: 'shareLinks' },
    ]);

    if (!report) {
      return res
        .status(denied ? 403 : 404)
        .json({ success: false, message: denied ? '无权访问该报告' : '报告不存在' });
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
    const { report, denied } = await getReportForUser(req.params.id, req.user);

    if (!report) {
      return res
        .status(denied ? 403 : 404)
        .json({ success: false, message: denied ? '无权下载该报告' : '报告不存在' });
    }

    const target = await getReportDownloadTarget(report);

    await report.update({
      download_count: (report.download_count || 0) + 1,
      last_downloaded_at: new Date(),
    });

    return sendReportFile(res, report, target);
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

    const { report, denied } = await getReportForUser(reportId, req.user);

    if (!report) {
      return res
        .status(denied ? 403 : 404)
        .json({ success: false, message: denied ? '无权分享该报告' : '报告不存在' });
    }

    const shareToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expires_hours * 60 * 60 * 1000);

    const shareLink = await ReportShareLink.create({
      report_id: report.id,
      share_token: shareToken,
      expires_at: expiresAt,
      max_access_count: parseInt(max_access_count) || 0,
      created_by: req.user.id,
    });

    const shareBaseUrl = `${req.protocol}://${req.get('host')}`;
    const shareUrl = `${shareBaseUrl}/api/reports/shared/${shareToken}`;

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
