/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const analysisService = require('../services/analysisService');
const {
  Patient,
  Study,
  StudyImage,
  AnalysisTask,
  AnalysisResult,
  sequelize,
} = require('../models');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    // 确保目录存在（避免首次部署/清理后上传失败）
    try {
      require('fs').mkdirSync(uploadDir, { recursive: true });
    } catch (e) {
      return cb(e);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/tiff',
    'image/bmp',
    'image/x-ms-bmp',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件格式。请上传JPG、PNG、TIFF或BMP格式的图像。'), false);
  }
};

// 配置multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    // 与前端/病例上传保持一致，默认 20MB（可用环境变量覆盖）
    fileSize: parseInt(process.env.MAX_IMAGE_SIZE) || 20 * 1024 * 1024, // 20MB
  },
});

/**
 * POST /api/analyze
 * 上传图像并创建分析任务
 */
router.post('/', optionalAuth, upload.single('image'), async (req, res, next) => {
  let transaction;
  try {
    console.log('➡️ 收到分析请求');
    // 验证文件
    if (!req.file) {
      console.error('❌ 请求中未包含文件');
      return res.status(400).json({
        error: '请求参数错误',
        details: '缺少图像文件',
      });
    }

    // 验证必填字段
    const { patientName, patientId, studyDate, modality } = req.body;
    if (!patientName || !patientId || !studyDate || !modality) {
      console.error('❌ 缺少必填字段:', req.body);
      // 删除已上传的文件
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        error: '请求参数错误',
        details: '缺少必填字段：patientName、patientId、studyDate、modality',
      });
    }

    // 生成ID
    const taskId = `task_${uuidv4()}`;
    const studyId = `study_${uuidv4()}`;
    const userId = req.user?.id || null;

    console.log(`📝 创建分析任务: ${taskId}`);
    console.log(`👤 患者: ${patientName} (${patientId})`);

    // 开启事务
    transaction = await sequelize.transaction();
    console.log('✅ 事务已开启');

    try {
      // 1. 查找或创建患者
      console.log('🔍 正在查找或创建患者...');
      let patient = await Patient.findOne({
        where: { patient_id: patientId },
        transaction,
      });

      if (!patient) {
        patient = await Patient.create(
          {
            patient_id: patientId,
            name: patientName,
            gender: 'female', // 默认
            created_by: userId,
          },
          { transaction },
        );
        console.log('🆕 新患者创建成功');
      } else {
        console.log('✅ 找到现有患者');
      }

      // 2. 创建病例记录
      console.log('🔍 正在创建病例记录...');
      const study = await Study.create(
        {
          study_id: studyId,
          patient_id: patient.id,
          user_id: userId,
          study_date: new Date(studyDate),
          study_type: modality,
          description: req.body.description || '',
          status: 'processing',
        },
        { transaction },
      );
      console.log('✅ 病例记录创建成功, ID:', study.id);

      // 3. 创建图像记录
      console.log('🔍 正在创建图像记录...');
      const fileExt = path.extname(req.file.originalname).substring(1).toUpperCase();
      const fileFormat = fileExt === 'JPG' ? 'JPEG' : fileExt;

      await StudyImage.create(
        {
          study_id: study.id,
          original_filename: req.file.originalname,
          stored_filename: path.basename(req.file.filename),
          file_path: `/uploads/${path.basename(req.file.path)}`,
          file_size: req.file.size,
          mime_type: req.file.mimetype,
          file_format: fileFormat,
          is_primary: true,
          upload_status: 'completed',
        },
        { transaction },
      );
      console.log('✅ 图像记录创建成功');

      // 4. 创建分析任务记录
      console.log('🔍 正在创建分析任务...');
      const analysisTask = await AnalysisTask.create(
        {
          task_id: taskId,
          study_id: study.id,
          user_id: userId,
          status: 'PENDING',
          progress: 0,
        },
        { transaction },
      );
      console.log('✅ 分析任务创建成功, ID:', analysisTask.id);

      await transaction.commit();
      console.log('✅ 事务提交成功');

      // 返回结果
      res.status(200).json({
        taskId,
        studyId,
        studyDbId: study.id,
        status: 'PENDING',
        estimatedTime: 30,
      });

      // 异步执行分析 (传入数据库ID)
      analysisService.processTask(analysisTask.id, req.file.path, study.id).catch((err) => {
        console.error(`❌ 任务后台执行失败:`, err);
      });
    } catch (dbError) {
      console.error('❌ 数据库操作失败:', dbError);
      await transaction.rollback();
      console.log('⏪ 事务已回滚');
      throw dbError;
    }
  } catch (error) {
    // 发生错误时尝试删除文件
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    console.error('分析请求处理失败 (Outer Catch):', error);
    next(error);
  }
});

/**
 * GET /api/analyze/:taskId
 * 查询任务状态 (直接查库)
 */
router.get('/:taskId', async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await AnalysisTask.findOne({
      where: { task_id: taskId },
      include: [
        {
          model: AnalysisResult,
          as: 'result',
        },
        {
          model: Study,
          as: 'study',
          include: [
            {
              model: Patient,
              as: 'patient',
              attributes: ['name', 'patient_id'],
            },
          ],
        },
      ],
    });

    if (!task) {
      return res.status(404).json({
        error: '任务不存在',
        taskId,
      });
    }

    const response = {
      taskId: task.task_id,
      studyId: task.study?.study_id,
      studyDbId: task.study_id,
      status: task.status,
      progress: task.progress,
      createdAt: task.created_at,
      completedAt: task.completed_at,
    };

    if (task.status === 'SUCCESS' && task.result) {
      response.result = {
        diagnosis: task.result.diagnosis,
        confidence: task.result.confidence,
        riskLevel: task.result.risk_level,
        recommendations: task.result.recommendations,
        suspiciousAreas: task.result.suspicious_areas,
        biomarkers: task.result.biomarkers,
        detailedReport: task.result.detailed_report,
      };
    }

    if (task.status === 'FAILED') {
      response.error = task.error_message;
    }

    res.json(response);
  } catch (error) {
    console.error('查询任务状态失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/analyze/study/:studyId
 */
router.get('/study/:studyId', async (req, res) => {
  const { studyId } = req.params;

  try {
    const isNumericId = /^\d+$/.test(studyId);
    const whereClause = isNumericId ? { id: studyId } : { study_id: studyId };

    const study = await Study.findOne({
      where: whereClause,
      include: [
        { model: Patient, as: 'patient', attributes: ['name', 'patient_id'] },
        { model: StudyImage, as: 'images', limit: 1 },
      ],
    });

    if (!study) {
      return res.status(404).json({ error: '未找到该病例' });
    }

    const latestTask = await AnalysisTask.findOne({
      where: { study_id: study.id },
      include: [{ model: AnalysisResult, as: 'result' }],
      order: [['created_at', 'DESC']],
    });

    const studyInfo = {
      patientName: study.patient?.name,
      patientId: study.patient?.patient_id,
      studyDate: study.study_date,
      modality: study.study_type,
      description: study.description,
      imageUrl: study.images?.[0]?.file_path,
    };

    if (!latestTask) {
      // 无任务记录
      return res.json({
        taskId: `temp_${study.id}`,
        studyId: String(study.id),
        status: 'PENDING',
        progress: 0,
        studyInfo,
      });
    }

    const response = {
      taskId: latestTask.task_id,
      studyId: String(study.id),
      status: latestTask.status,
      progress: latestTask.progress,
      studyInfo,
      createdAt: latestTask.created_at,
    };

    if (latestTask.result) {
      response.result = {
        diagnosis: latestTask.result.diagnosis,
        confidence: latestTask.result.confidence,
        recommendations: latestTask.result.recommendations,
        detailedReport: latestTask.result.detailed_report,
      };
      response.completedAt = latestTask.completed_at;
    }

    if (latestTask.error_message) {
      response.error = latestTask.error_message;
    }

    res.json(response);
  } catch (error) {
    console.error('查询病例分析失败:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

module.exports = router;
