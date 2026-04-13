/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const multer = require('multer');
const path = require('path');
const { Op } = require('sequelize');
const {
  Study,
  Patient,
  StudyImage,
  User,
  AnalysisTask,
  AnalysisResult,
  sequelize,
} = require('../models');
const { authenticate } = require('../middleware/auth');
const { handleRouteError } = require('../utils/errorHandler');
const { logAudit } = require('../middleware/auditLogger');
const {
  persistStudyImage,
  syncStudyImageToTucang,
  removeStudyImageFile,
  serializeStudyImageForResponse,
  serializeStudyForResponse,
} = require('../services/studyImageStorage.service');

const router = express.Router();

const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB per file
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/bmp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 JPEG, PNG, TIFF, BMP 格式的医学影像'));
    }
  },
});

/**
 * POST /api/studies
 * 创建病例
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      patient_id,
      study_date,
      study_type,
      description,
      department,
      doctor_name,
      clinical_diagnosis,
      symptoms,
    } = req.body;

    // 验证必填字段
    if (!patient_id || !study_date || !study_type) {
      return res.status(400).json({
        success: false,
        message: '患者ID、检查日期和检查类型为必填项',
      });
    }

    // 验证患者是否存在
    const patient = await Patient.findByPk(patient_id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: '患者不存在',
      });
    }

    // 非管理员只能为自己创建的患者创建病例
    if (req.user.role !== 'admin' && patient.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权为该患者创建病例',
      });
    }

    // 创建病例（study_id会在beforeCreate hook中自动生成）
    const study = await Study.create({
      patient_id,
      user_id: req.user.id,
      study_date,
      study_type,
      description,
      department,
      doctor_name,
      clinical_diagnosis,
      symptoms,
      status: 'pending',
    });

    const createdStudy = await Study.findByPk(study.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'patient_id', 'name', 'gender', 'birth_date'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'real_name'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: '病例创建成功',
      data: { study: createdStudy },
    });

    // 记录创建病例审计日志
    await logAudit({
      userId: req.user.id,
      action: 'CREATE_STUDY',
      resourceType: 'study',
      resourceId: study.id,
      details: { patient_id, study_type },
      req,
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Studies', endpoint: 'POST /' });
  }
});

/**
 * POST /api/studies/:id/images
 * 上传影像文件
 */
router.post('/:id/images', authenticate, uploadImages.array('images', 10), async (req, res) => {
  let transaction;
  const rollbackHandlers = [];
  try {
    transaction = await sequelize.transaction();
    const study = await Study.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!study) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '病例不存在',
      });
    }

    // 验证权限
    if (req.user.role !== 'admin' && study.user_id !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: '无权上传影像',
      });
    }

    if (!req.files || req.files.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '请上传影像文件',
      });
    }

    // 保存影像信息到数据库
    const images = [];
    // 如果该病例还没有主图，则将本次上传的第一张图片设为主图
    const existingPrimary = await StudyImage.findOne({
      where: { study_id: study.id, is_primary: true },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const shouldSetPrimary = !existingPrimary;

    const uploadedFiles = Array.isArray(req.files) ? req.files : [];
    for (const [index, file] of uploadedFiles.entries()) {
      const ext = path.extname(file.originalname).substring(1).toUpperCase();
      const fileFormat = ext === 'JPG' ? 'JPEG' : ext || 'JPEG';
      const isPrimary = shouldSetPrimary && index === 0;
      const persistedImage = await persistStudyImage({ file, studyId: study.id });
      rollbackHandlers.push(persistedImage.rollback);

      const image = await StudyImage.create(
        {
          study_id: study.id,
          file_path: persistedImage.filePath,
          original_filename: file.originalname,
          stored_filename: persistedImage.storedFilename,
          file_size: file.size,
          mime_type: file.mimetype,
          file_format: fileFormat,
          is_primary: isPrimary,
          upload_status: persistedImage.uploadStatus || 'completed',
        },
        { transaction },
      );
      images.push(image);
    }

    await transaction.commit();
    transaction = null;
    await Promise.all(
      images.map(async (img) => {
        try {
          await syncStudyImageToTucang(img);
        } catch (error) {
          console.warn(`[POST /studies/:id/images] 图仓同步失败，保留本地路径: ${error.message}`);
        }
      }),
    );
    const responseImages = await Promise.all(images.map((img) => serializeStudyImageForResponse(img)));

    res.json({
      success: true,
      message: `成功上传 ${responseImages.length} 个影像文件`,
      data: { images: responseImages },
    });

    // 记录上传影像审计日志
    await logAudit({
      userId: req.user.id,
      action: 'UPLOAD_IMAGE',
      resourceType: 'study',
      resourceId: study.id,
      details: { count: responseImages.length },
      req,
    });
  } catch (error) {
    console.error('上传影像错误:', error);
    if (transaction) {
      await transaction.rollback();
    }
    for (const rollback of rollbackHandlers) {
      try {
        await rollback();
      } catch {
        // 上传回滚失败不阻断错误返回
      }
    }

    handleRouteError(res, error, { service: 'Studies', endpoint: 'POST /:id/images' });
  }
});

/**
 * GET /api/studies
 * 获取病例列表
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, patient_id, status, study_type, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    // 筛选条件
    if (patient_id) where.patient_id = patient_id;
    if (status) where.status = status;
    if (study_type) where.study_type = study_type;

    if (search) {
      where[Op.or] = [
        { study_id: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { clinical_diagnosis: { [Op.like]: `%${search}%` } },
      ];
    }

    // 设置查询权限
    if (req.user.role !== 'admin') {
      where[Op.or] = [{ user_id: req.user.id }, { user_id: null }];
    }

    const { count, rows } = await Study.findAndCountAll({
      where,
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'patient_id', 'name', 'gender', 'birth_date'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'real_name'],
        },
        {
          model: StudyImage,
          as: 'images',
          attributes: ['id', 'file_path', 'stored_filename', 'original_filename', 'created_at'],
        },
        {
          model: AnalysisResult,
          as: 'analysis_results',
          attributes: ['id', 'diagnosis', 'risk_level', 'confidence'],
          separate: true,
          limit: 1,
          order: [['created_at', 'DESC']],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['study_date', 'DESC']],
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] 病例查询: 总数=${count}, 返回=${rows.length}`);
    }
    const normalizedStudies = await Promise.all(rows.map((row) => serializeStudyForResponse(row)));

    res.json({
      success: true,
      data: {
        studies: normalizedStudies,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Studies', endpoint: 'GET /' });
  }
});

/**
 * GET /api/studies/:id
 * 获取病例详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const study = await Study.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'real_name'],
        },
        {
          model: StudyImage,
          as: 'images',
        },
        {
          model: AnalysisTask,
          as: 'analysis_tasks',
          separate: true,
          order: [['created_at', 'DESC']],
        },
        {
          model: AnalysisResult,
          as: 'analysis_results',
          separate: true,
          limit: 1,
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!study) {
      return res.status(404).json({
        success: false,
        message: '病例不存在',
      });
    }

    // 非管理员可以查看自己创建的病例 + 未分配用户的病例（匿名上传）
    if (req.user.role !== 'admin' && study.user_id !== null && study.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权访问该病例',
      });
    }
    const normalizedStudy = await serializeStudyForResponse(study);

    res.json({
      success: true,
      data: { study: normalizedStudy },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Studies', endpoint: 'GET /:id' });
  }
});

/**
 * PUT /api/studies/:id
 * 更新病例信息
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const study = await Study.findByPk(req.params.id);

    if (!study) {
      return res.status(404).json({
        success: false,
        message: '病例不存在',
      });
    }

    // 非管理员可以更新自己创建的病例 + 未分配用户的病例（匿名上传）
    if (req.user.role !== 'admin' && study.user_id !== null && study.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权更新该病例',
      });
    }

    const {
      study_date,
      study_type,
      description,
      department,
      doctor_name,
      clinical_diagnosis,
      symptoms,
      status,
    } = req.body;

    const updateData = {};
    if (study_date !== undefined) updateData.study_date = study_date;
    if (study_type !== undefined) updateData.study_type = study_type;
    if (description !== undefined) updateData.description = description;
    if (department !== undefined) updateData.department = department;
    if (doctor_name !== undefined) updateData.doctor_name = doctor_name;
    if (clinical_diagnosis !== undefined) updateData.clinical_diagnosis = clinical_diagnosis;
    if (symptoms !== undefined) updateData.symptoms = symptoms;
    if (status !== undefined) updateData.status = status;

    await study.update(updateData);

    const updatedStudy = await Study.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'real_name'],
        },
      ],
    });

    res.json({
      success: true,
      message: '更新成功',
      data: { study: updatedStudy },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Studies', endpoint: 'PUT /:id' });
  }
});

/**
 * PUT /api/studies/batch-review
 * 批量标记审核状态
 * 请求体：{ study_ids: number[], review_status: 'reviewed' | 'rejected' }
 */
router.put('/batch-review', authenticate, async (req, res) => {
  try {
    const { study_ids, review_status = 'reviewed' } = req.body;

    // 参数校验
    if (!Array.isArray(study_ids) || study_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'study_ids 必须为非空数组',
      });
    }

    // 数量限制（最多50条）
    if (study_ids.length > 50) {
      return res.status(400).json({
        success: false,
        message: '批量操作数量不能超过50条',
      });
    }

    const validStatuses = ['reviewed', 'rejected'];
    if (!validStatuses.includes(review_status)) {
      return res.status(400).json({
        success: false,
        message: `无效的审核状态：${review_status}，可选：${validStatuses.join(', ')}`,
      });
    }

    const items = [];
    let successCount = 0;
    let failCount = 0;

    for (const studyId of study_ids) {
      try {
        const study = await Study.findByPk(studyId);

        if (!study) {
          items.push({
            study_id: studyId,
            status: 'FAILED',
            error: '病例不存在',
          });
          failCount += 1;
          continue;
        }

        // 权限校验：非管理员只能操作自己的病例或匿名病例
        if (req.user.role !== 'admin' && study.user_id !== null && study.user_id !== req.user.id) {
          items.push({
            study_id: studyId,
            status: 'FAILED',
            error: '无权操作该病例',
          });
          failCount += 1;
          continue;
        }

        // 更新审核状态
        await study.update({
          review_status,
          reviewed_at: new Date(),
          reviewed_by: req.user.id,
        });

        items.push({
          study_id: studyId,
          status: 'SUCCESS',
          review_status,
        });
        successCount += 1;
      } catch (err) {
        items.push({
          study_id: studyId,
          status: 'FAILED',
          error: err.message || '更新失败',
        });
        failCount += 1;
      }
    }

    // 记录批量审核审计日志
    await logAudit({
      userId: req.user.id,
      action: 'BATCH_REVIEW_STUDIES',
      resourceType: 'study',
      resourceId: null,
      details: {
        total: study_ids.length,
        success: successCount,
        failed: failCount,
        review_status,
        study_ids,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message:
        failCount > 0
          ? `批量审核完成，成功 ${successCount} 条，失败 ${failCount} 条`
          : '批量审核成功',
      data: {
        summary: {
          total: study_ids.length,
          success: successCount,
          failed: failCount,
        },
        items,
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Studies', endpoint: 'PUT /batch-review' });
  }
});

/**
 * DELETE /api/studies/:id
 * 删除病例（软删除）
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const study = await Study.findByPk(req.params.id);

    if (!study) {
      return res.status(404).json({
        success: false,
        message: '病例不存在',
      });
    }

    // 非管理员可以删除自己创建的病例 + 未分配用户的病例（匿名上传）
    if (req.user.role !== 'admin' && study.user_id !== null && study.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权删除该病例',
      });
    }

    // 软删除
    await study.destroy();

    res.json({
      success: true,
      message: '病例已删除',
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Studies', endpoint: 'DELETE /:id' });
  }
});

/**
 * DELETE /api/studies/:id/images/:imageId
 * 删除病例影像
 */
router.delete('/:id/images/:imageId', authenticate, async (req, res) => {
  try {
    const study = await Study.findByPk(req.params.id);

    if (!study) {
      return res.status(404).json({
        success: false,
        message: '病例不存在',
      });
    }

    // 验证权限
    if (req.user.role !== 'admin' && study.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权删除影像',
      });
    }

    const image = await StudyImage.findByPk(req.params.imageId);

    if (!image || image.study_id !== study.id) {
      return res.status(404).json({
        success: false,
        message: '影像不存在',
      });
    }

    // 删除文件
    const deletedWasPrimary = image.is_primary === true;
    await removeStudyImageFile(image);

    // 删除数据库记录
    await image.destroy();

    // 如果删除的是主图，尝试将最新一张图像设置为主图（避免后续任务找不到主图）
    if (deletedWasPrimary) {
      const remainingPrimary = await StudyImage.findOne({
        where: { study_id: study.id, is_primary: true },
      });

      if (!remainingPrimary) {
        const fallback = await StudyImage.findOne({
          where: { study_id: study.id },
          order: [['created_at', 'DESC']],
        });
        if (fallback) {
          await fallback.update({ is_primary: true });
        }
      }
    }

    res.json({
      success: true,
      message: '影像已删除',
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Studies', endpoint: 'DELETE /:id/images/:imageId' });
  }
});

/**
 * PATCH /api/studies/:id/mark-downloaded
 * 标记报告已下载
 */
/*
router.patch('/:id/mark-downloaded', authenticate, async (req, res) => {
  try {
    const study = await Study.findByPk(req.params.id);

    if (!study) {
      return res.status(404).json({
        success: false,
        message: '病例不存在',
      });
    }

    // 非管理员可以标记自己创建的病例 + 未分配用户的病例（匿名上传）
    if (req.user.role !== 'admin' && study.user_id !== null && study.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权标记该病例',
      });
    }

    // 如果已经标记过，不重复更新时间
    const updateData = { downloaded: true };
    if (!study.downloaded) {
      updateData.downloaded_at = new Date();
    }

    await study.update(updateData);

    res.json({
      success: true,
      message: '标记成功',
      data: { study },
    });
  } catch (error) {
    console.error('标记下载状态错误:', error);
    res.status(500).json({
      success: false,
      message: '标记下载状态失败',
      error: error.message,
    });
  }
});
*/

module.exports = router;
