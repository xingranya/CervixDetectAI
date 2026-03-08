/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const {
  AnalysisTask,
  AnalysisResult,
  Study,
  User,
  StudyImage,
  Patient,
  sequelize,
} = require('../models');
const { authenticate } = require('../middleware/auth');
const analysisService = require('../services/analysisService');
const { createAnalysisNotifications } = require('../services/notificationService');
const emailService = require('../services/email.service');
const {
  persistStudyImage,
  syncStudyImageToTucang,
  prepareStudyImageForAnalysis,
} = require('../services/studyImageStorage.service');

const router = express.Router();

async function safeCleanup(handler) {
  if (typeof handler !== 'function') return;
  try {
    await handler();
  } catch {
    // 清理失败不阻断主流程
  }
}

/**
 * 归一化优先级
 * @param {unknown} inputPriority 优先级输入
 * @returns {'normal' | 'urgent' | 'emergency'}
 */
function normalizePriority(inputPriority) {
  const raw = typeof inputPriority === 'string' ? inputPriority.trim().toLowerCase() : 'normal';
  if (raw === 'urgent' || raw === 'emergency') {
    return raw;
  }
  return 'normal';
}

/**
 * 根据原始文件名推断格式
 * @param {string} originalFilename 原始文件名
 * @returns {string}
 */
function resolveFileFormat(originalFilename) {
  const ext = path.extname(originalFilename || '').slice(1).toUpperCase();
  if (!ext) return 'JPEG';
  return ext === 'JPG' ? 'JPEG' : ext;
}

const batchUploadImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_IMAGE_SIZE || '', 10) || 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'image/bmp',
      'image/x-ms-bmp',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('只支持 JPEG、PNG、TIFF、BMP 格式的医学影像'));
  },
});

/**
 * 规范化任务状态（兼容历史值）
 * - 允许值：PENDING/PROCESSING/SUCCESS/FAILED
 * - 兼容值：running->PROCESSING, completed->SUCCESS, failed/cancelled->FAILED
 * @param {unknown} inputStatus 状态输入
 * @returns {'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | undefined}
 */
function normalizeTaskStatus(inputStatus) {
  if (inputStatus === undefined || inputStatus === null) {
    return undefined;
  }

  const normalized = String(inputStatus).trim().toUpperCase();
  if (!normalized) {
    return undefined;
  }

  switch (normalized) {
    case 'PENDING':
    case 'PROCESSING':
    case 'SUCCESS':
    case 'FAILED':
      return normalized;
    case 'RUNNING':
      return 'PROCESSING';
    case 'COMPLETED':
      return 'SUCCESS';
    case 'CANCELLED':
    case 'CANCELED':
      return 'FAILED';
    default:
      return undefined;
  }
}

/**
 * POST /api/analysis-tasks
 * 创建分析任务
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { study_id, model_name, model_version, priority = 'normal' } = req.body;

    console.log('🔵 [POST /analysis-tasks] 收到请求');
    console.log('📊 请求参数:', { study_id, model_name, model_version, priority });
    console.log('👤 当前用户:', { id: req.user.id, role: req.user.role });

    // 验证必填字段
    if (!study_id) {
      return res.status(400).json({
        success: false,
        message: '病例ID为必填项',
      });
    }

    // 验证病例是否存在
    const study = await Study.findByPk(study_id);
    if (!study) {
      console.error('❌ 病例不存在:', study_id);
      return res.status(404).json({
        success: false,
        message: '病例不存在',
      });
    }

    console.log('📋 病例信息:', { id: study.id, user_id: study.user_id, status: study.status });

    // 非管理员只能为自己的病例创建任务，但允许为user_id为null的病例（匿名上传）创建任务
    if (req.user.role !== 'admin' && study.user_id !== null && study.user_id !== req.user.id) {
      console.error('❌ 权限检查失败:');
      console.error('   - study.user_id:', study.user_id, typeof study.user_id);
      console.error('   - req.user.id:', req.user.id, typeof req.user.id);
      console.error('   - 相等:', study.user_id === req.user.id);
      return res.status(403).json({
        success: false,
        message: '无权为该病例创建分析任务',
      });
    }

    // 生成任务ID（与上传路由保持一致）
    const taskId = `task_${uuidv4()}`;

    // 创建分析任务
    const task = await AnalysisTask.create({
      task_id: taskId,
      study_id,
      user_id: req.user.id,
      ai_model_version: model_version,
      status: 'PENDING',
      progress: 0,
    });

    const createdTask = await AnalysisTask.findByPk(task.id, {
      include: [
        {
          model: Study,
          as: 'study',
          attributes: ['id', 'study_id', 'study_date', 'study_type'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'real_name'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: '分析任务创建成功',
      data: { task: createdTask },
    });

    // 异步触发分析流程
    (async () => {
      try {
        // 获取病例的原始图像
        let studyImage = await StudyImage.findOne({
          where: { study_id: study.id, is_primary: true },
          order: [['created_at', 'DESC']],
        });

        // 兜底：历史数据可能没有 is_primary=true 的记录
        if (!studyImage) {
          studyImage = await StudyImage.findOne({
            where: { study_id: study.id },
            order: [['created_at', 'DESC']],
          });
        }

        if (studyImage) {
          const preparedImage = await prepareStudyImageForAnalysis(studyImage);
          if (!preparedImage.imagePath) {
            await task.update({
              status: 'FAILED',
              error_message: '图像路径解析失败，无法开始分析',
              completed_at: new Date(),
            });
            return;
          }

          console.log(
            `🚀 [POST /analysis-tasks] 触发后台分析: TaskID=${task.id}, Image=${preparedImage.imagePath}`,
          );
          try {
            await analysisService.processTask(task.id, preparedImage.imagePath, study.id);
          } finally {
            await safeCleanup(preparedImage.cleanup);
          }
        } else {
          console.error(
            `❌ [POST /analysis-tasks] 无法触发分析: 未找到病例图像 (StudyID=${study.id})`,
          );
          await task.update({
            status: 'FAILED',
            error_message: '未找到病例图像，无法开始分析',
            completed_at: new Date(),
          });
        }
      } catch (err) {
        console.error(`❌ [POST /analysis-tasks] 触发分析失败:`, err);
      }
    })();
  } catch (error) {
    console.error('创建分析任务错误:', error);
    // 参赛 core：不写入本地文件日志，避免同步 IO 阻塞
    if (error && error.stack) {
      console.error('创建分析任务错误堆栈:', error.stack);
    }

    res.status(500).json({
      success: false,
      message: '创建分析任务失败',
      error: error.message,
    });
  }
});

/**
 * POST /api/analysis-tasks/batch
 * 批量上传影像并创建分析任务（部分成功）
 */
router.post('/batch', authenticate, batchUploadImages.array('images', 10), async (req, res) => {
  const uploadedFiles = Array.isArray(req.files) ? req.files : [];
  const batchId = `batch_${uuidv4()}`;

  try {
    const { patientName, patientId, studyDate, modality, description, model_version, priority } =
      req.body;

    if (!uploadedFiles.length) {
      return res.status(400).json({
        success: false,
        message: '请至少上传一张影像',
      });
    }

    if (!patientName || !patientId || !studyDate || !modality) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段：patientName、patientId、studyDate、modality',
      });
    }

    const studyDateObj = new Date(studyDate);
    if (Number.isNaN(studyDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: '检查日期格式不正确',
      });
    }

    const finalPriority = normalizePriority(priority);

    // 查找或创建患者（使用业务号）
    let patient = await Patient.findOne({ where: { patient_id: patientId } });
    if (!patient) {
      try {
        patient = await Patient.create({
          patient_id: patientId,
          name: patientName,
          gender: 'female',
          created_by: req.user.id,
        });
      } catch (error) {
        // 并发场景下可能重复创建，回查兜底
        patient = await Patient.findOne({ where: { patient_id: patientId } });
        if (!patient) {
          throw error;
        }
      }
    }

    const items = [];
    let createdCount = 0;

    for (const [index, file] of uploadedFiles.entries()) {
      let transaction;
      let rollbackPersistedImage = null;
      try {
        transaction = await sequelize.transaction();

        const study = await Study.create(
          {
            study_id: `study_${uuidv4()}`,
            patient_id: patient.id,
            user_id: req.user.id,
            study_date: studyDateObj,
            study_type: modality,
            description: description || '',
            status: 'processing',
            priority: finalPriority,
          },
          { transaction },
        );
        const persistedImage = await persistStudyImage({
          file,
          studyId: study.id,
        });
        rollbackPersistedImage = persistedImage.rollback;

        const image = await StudyImage.create(
          {
            study_id: study.id,
            original_filename: file.originalname,
            stored_filename: persistedImage.storedFilename,
            file_path: persistedImage.filePath,
            file_size: file.size,
            mime_type: file.mimetype,
            file_format: resolveFileFormat(file.originalname),
            is_primary: true,
            upload_status: persistedImage.uploadStatus || 'completed',
          },
          { transaction },
        );

        const taskId = `task_${uuidv4()}`;
        const task = await AnalysisTask.create(
          {
            task_id: taskId,
            study_id: study.id,
            user_id: req.user.id,
            ai_model_version: model_version,
            status: 'PENDING',
            progress: 0,
          },
          { transaction },
        );

        await transaction.commit();
        transaction = null;
        try {
          await syncStudyImageToTucang(image);
        } catch (error) {
          console.warn(`[POST /analysis-tasks/batch] 图仓同步失败，保留本地路径: ${error.message}`);
        }
        createdCount += 1;

        const item = {
          index,
          originalFilename: file.originalname,
          studyDbId: study.id,
          studyId: study.study_id,
          imageId: image.id,
          taskId,
          status: 'PENDING',
        };
        items.push(item);

        // 异步触发分析，不阻塞响应
        const preparedImage = await prepareStudyImageForAnalysis(image);
        if (!preparedImage.imagePath) {
          await task.update({
            status: 'FAILED',
            progress: 0,
            error_message: '图像路径解析失败，无法开始分析',
            completed_at: new Date(),
          });
          await Study.update({ status: 'failed' }, { where: { id: study.id } });
          item.status = 'FAILED';
          item.error = '图像路径解析失败，无法开始分析';
          continue;
        }

        analysisService
          .processTask(task.id, preparedImage.imagePath, study.id)
          .finally(async () => {
            await safeCleanup(preparedImage.cleanup);
          })
          .catch((error) => {
            console.error(
              `❌ [POST /analysis-tasks/batch] 异步分析失败: Task=${task.id}, Study=${study.id}`,
              error,
            );
          });
      } catch (error) {
        if (transaction) {
          await transaction.rollback();
        }

        await safeCleanup(rollbackPersistedImage);
        items.push({
          index,
          originalFilename: file.originalname,
          status: 'FAILED',
          error: error.message || '创建任务失败',
        });
      }
    }

    const failedCount = uploadedFiles.length - createdCount;

    res.status(200).json({
      success: true,
      message:
        failedCount > 0 ? `批量任务创建完成，成功 ${createdCount} 条，失败 ${failedCount} 条` : '批量任务创建成功',
      data: {
        batchId,
        summary: {
          total: uploadedFiles.length,
          created: createdCount,
          failed: failedCount,
        },
        items,
      },
    });
  } catch (error) {
    console.error('批量创建分析任务错误:', error);
    res.status(500).json({
      success: false,
      message: '批量创建分析任务失败',
      error: error.message,
    });
  }
});

/**
 * GET /api/analysis-tasks
 * 获取分析任务列表
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, study_id, priority } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (study_id) where.study_id = study_id;
    if (priority) where.priority = priority;

    // 非管理员只能查看自己的任务
    if (req.user.role !== 'admin') {
      where.user_id = req.user.id;
    }

    const { count, rows } = await AnalysisTask.findAndCountAll({
      where,
      include: [
        {
          model: Study,
          as: 'study',
          attributes: ['id', 'study_id', 'study_date', 'study_type'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'real_name'],
        },
        {
          model: AnalysisResult,
          as: 'result',
          required: false,
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        tasks: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取分析任务列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分析任务列表失败',
      error: error.message,
    });
  }
});

/**
 * GET /api/analysis-tasks/:id
 * 获取分析任务详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await AnalysisTask.findByPk(req.params.id, {
      include: [
        {
          model: Study,
          as: 'study',
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'real_name'],
        },
        {
          model: AnalysisResult,
          as: 'result',
        },
      ],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '分析任务不存在',
      });
    }

    // 非管理员只能查看自己的任务
    if (req.user.role !== 'admin' && task.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权访问该分析任务',
      });
    }

    res.json({
      success: true,
      data: { task },
    });
  } catch (error) {
    console.error('获取分析任务详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分析任务详情失败',
      error: error.message,
    });
  }
});

/**
 * PUT /api/analysis-tasks/:id/status
 * 更新任务状态和进度
 */
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const task = await AnalysisTask.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '分析任务不存在',
      });
    }

    // 非管理员只能更新自己的任务
    if (req.user.role !== 'admin' && task.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权更新该任务',
      });
    }

    const { status, progress, error_message } = req.body;
    const updateData = {};

    if (status !== undefined) {
      const normalizedStatus = normalizeTaskStatus(status);
      if (!normalizedStatus) {
        return res.status(400).json({
          success: false,
          message: '任务状态不合法',
        });
      }

      updateData.status = normalizedStatus;

      if (normalizedStatus === 'PROCESSING' && !task.started_at) {
        updateData.started_at = new Date();
      } else if (['SUCCESS', 'FAILED'].includes(normalizedStatus)) {
        updateData.completed_at = new Date();
      }
    }

    if (progress !== undefined) updateData.progress = progress;
    if (error_message !== undefined) updateData.error_message = error_message;

    await task.update(updateData);

    const updatedTask = await AnalysisTask.findByPk(req.params.id, {
      include: [
        {
          model: Study,
          as: 'study',
          attributes: ['id', 'study_id', 'study_date', 'study_type'],
        },
      ],
    });

    res.json({
      success: true,
      message: '任务状态更新成功',
      data: { task: updatedTask },
    });
  } catch (error) {
    console.error('更新任务状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新任务状态失败',
      error: error.message,
    });
  }
});

/**
 * POST /api/analysis-tasks/:id/result
 * 保存分析结果
 */
router.post('/:id/result', authenticate, async (req, res) => {
  try {
    const task = await AnalysisTask.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '分析任务不存在',
      });
    }

    // 非管理员只能保存自己任务的结果
    if (req.user.role !== 'admin' && task.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权保存该任务的结果',
      });
    }

    /**
     * 兼容多版本的结果字段：
     * - 新版（与 AnalysisResult 模型一致）：diagnosis / confidence / detailed_report
     * - 旧版（历史字段）：primary_diagnosis / confidence_score / notes
     */
    const {
      risk_level,
      diagnosis,
      confidence,
      detailed_report,
      raw_output,
      // 旧字段兼容
      confidence_score,
      primary_diagnosis,
      detailedReport,
      notes,
      // 通用字段
      recommendations,
      biomarkers,
      suspicious_areas,
    } = req.body;

    const finalDiagnosis = diagnosis || primary_diagnosis;
    const confidenceRaw = confidence ?? confidence_score;
    const finalDetailedReport = detailed_report || detailedReport || notes || null;

    const normalizeConfidence = (value) => {
      const num = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(num)) return null;
      // 兼容 0-100 百分比输入（仅允许整数百分比）
      if (num > 1) {
        if (num < 0 || num > 100 || !Number.isInteger(num)) return null;
        return num / 100;
      }
      if (num < 0 || num > 1) return null;
      return num;
    };

    // 验证必填字段
    if (!risk_level || confidenceRaw === undefined || !finalDiagnosis) {
      return res.status(400).json({
        success: false,
        message: '风险等级、诊断结论、置信度为必填项',
      });
    }

    const finalConfidence = normalizeConfidence(confidenceRaw);
    if (finalConfidence === null) {
      return res.status(400).json({
        success: false,
        message: '置信度格式不正确（应为 0-1 小数或 0-100 百分比）',
      });
    }

    const finalRecommendations = Array.isArray(recommendations) ? recommendations : [];
    const finalBiomarkers = biomarkers && typeof biomarkers === 'object' ? biomarkers : null;
    const finalSuspiciousAreas = Array.isArray(suspicious_areas) ? suspicious_areas : null;

    // 检查是否已存在结果
    const existingResult = await AnalysisResult.findOne({
      where: { task_id: task.id },
    });

    if (existingResult) {
      // 更新现有结果
      await existingResult.update({
        risk_level,
        diagnosis: finalDiagnosis,
        confidence: finalConfidence,
        recommendations: finalRecommendations,
        biomarkers: finalBiomarkers,
        suspicious_areas: finalSuspiciousAreas,
        detailed_report: finalDetailedReport,
        raw_output: raw_output && typeof raw_output === 'object' ? raw_output : null,
      });

      // 同步任务状态（避免结果已写入但任务仍是非终态）
      if (task.status !== 'SUCCESS') {
        await task.update({
          status: 'SUCCESS',
          progress: 100,
          completed_at: task.completed_at || new Date(),
        });
      }

      res.json({
        success: true,
        message: '分析结果更新成功',
        data: { result: existingResult },
      });
    } else {
      // 创建新结果
      const result = await AnalysisResult.create({
        task_id: task.id,
        study_id: task.study_id,
        risk_level,
        diagnosis: finalDiagnosis,
        confidence: finalConfidence,
        recommendations: finalRecommendations,
        biomarkers: finalBiomarkers,
        suspicious_areas: finalSuspiciousAreas,
        detailed_report: finalDetailedReport,
        raw_output: raw_output && typeof raw_output === 'object' ? raw_output : null,
      });

      // 更新任务状态为已完成
      await task.update({
        status: 'SUCCESS',
        progress: 100,
        completed_at: new Date(),
      });

      // 创建站内通知（不影响主流程）
      try {
        const relatedStudy = await Study.findByPk(task.study_id, {
          attributes: ['id', 'study_id'],
        });
        await createAnalysisNotifications({
          userId: task.user_id,
          studyId: task.study_id,
          studyCode: relatedStudy?.study_id,
          diagnosis: finalDiagnosis,
          riskLevel: risk_level,
          confidence: finalConfidence,
        });
      } catch (notifyError) {
        console.error('创建分析通知失败:', notifyError.message);
      }

      // 发送报告生成完成邮件（不影响主流程）
      try {
        const receiver = await User.findByPk(task.user_id, {
          attributes: ['id', 'email'],
        });
        if (receiver?.email) {
          const relatedStudy = await Study.findByPk(task.study_id, {
            attributes: ['id', 'study_id'],
          });
          const sendResult = await emailService.sendReportReadyEmail(receiver.email, {
            studyId: relatedStudy?.study_id || String(task.study_id),
            diagnosis: finalDiagnosis,
            riskLevel: risk_level,
            completedAt: new Date().toLocaleString('zh-CN'),
          });
          if (!sendResult.success) {
            console.error('报告完成邮件发送失败:', sendResult.message);
          }
        }
      } catch (emailError) {
        console.error('报告完成邮件发送异常:', emailError.message);
      }

      res.status(201).json({
        success: true,
        message: '分析结果保存成功',
        data: { result },
      });
    }
  } catch (error) {
    console.error('保存分析结果错误:', error);
    res.status(500).json({
      success: false,
      message: '保存分析结果失败',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/analysis-tasks/:id
 * 删除分析任务
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await AnalysisTask.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '分析任务不存在',
      });
    }

    // 非管理员只能删除自己的任务
    if (req.user.role !== 'admin' && task.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权删除该任务',
      });
    }

    // 软删除
    await task.destroy();

    res.json({
      success: true,
      message: '任务已删除',
    });
  } catch (error) {
    console.error('删除任务错误:', error);
    res.status(500).json({
      success: false,
      message: '删除任务失败',
      error: error.message,
    });
  }
});

module.exports = router;
