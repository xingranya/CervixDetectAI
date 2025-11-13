/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const qwenService = require('../services/qwenService');
const { Patient, Study, StudyImage, AnalysisTask, AnalysisResult } = require('../models');

const router = express.Router();

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
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
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件格式。请上传JPG、PNG或TIFF格式的图像。'), false);
  }
};

// 配置multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_IMAGE_SIZE) || 10485760, // 10MB
  },
});

// 存储任务状态（生产环境应使用数据库）
const tasks = new Map();

/**
 * POST /api/analyze
 * 上传图像并创建分析任务
 */
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    // 验证文件
    if (!req.file) {
      return res.status(400).json({
        error: '请求参数错误',
        details: '缺少图像文件',
      });
    }

    // 验证必填字段
    const { patientName, patientId, studyDate, modality } = req.body;
    if (!patientName || !patientId || !studyDate || !modality) {
      // 删除已上传的文件
      await fs.unlink(req.file.path);
      return res.status(400).json({
        error: '请求参数错误',
        details: '缺少必填字段：patientName、patientId、studyDate、modality',
      });
    }

    // 生成任务ID和病例ID
    const taskId = `task_${uuidv4()}`;
    const studyId = `study_${uuidv4()}`;

    // 保存到内存 Map（用于快速查询）
    const task = {
      taskId,
      studyId,
      status: 'PENDING',
      progress: 0,
      createdAt: new Date().toISOString(),
      studyInfo: {
        patientName,
        patientId,
        studyDate,
        modality,
        description: req.body.description || '',
        imageUrl: `/uploads/${path.basename(req.file.path)}`,
        imagePath: req.file.path,
      },
    };

    tasks.set(taskId, task);

    console.log(`📝 创建分析任务: ${taskId}`);
    console.log(`👤 患者: ${patientName} (${patientId})`);
    console.log(`📸 图像: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);

    // 立即返回任务ID
    res.status(200).json({
      taskId,
      studyId,
      status: 'PENDING',
      estimatedTime: 30,
    });

    // 异步保存到数据库并执行分析
    saveToDatabase(task, req.file)
      .then(() => {
        return processAnalysisTask(taskId);
      })
      .catch((error) => {
        console.error(`❌ 任务 ${taskId} 保存或执行失败:`, error);
        task.status = 'FAILED';
        task.error = error.message;
      });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analyze/:taskId
 * 查询任务状态
 */
router.get('/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = tasks.get(taskId);

  if (!task) {
    return res.status(404).json({
      error: '任务不存在',
      taskId,
    });
  }

  // 返回任务状态
  const response = {
    taskId: task.taskId,
    studyId: task.studyId,
    status: task.status,
    progress: task.progress,
  };

  if (task.status === 'SUCCESS' && task.result) {
    response.result = task.result;
  }

  if (task.status === 'FAILED' && task.error) {
    response.error = task.error;
  }

  res.json(response);
});

/**
 * 保存任务到数据库
 * @param {Object} task - 任务对象
 * @param {Object} file - 上传的文件对象
 */
async function saveToDatabase(task, file) {
  try {
    console.log(`💾 开始保存任务到数据库: ${task.taskId}`);

    // 1. 查找或创建患者
    let patient = await Patient.findOne({
      where: { patient_id: task.studyInfo.patientId },
    });

    if (!patient) {
      console.log(`🆕 创建新患者: ${task.studyInfo.patientName}`);
      patient = await Patient.create({
        patient_id: task.studyInfo.patientId,
        name: task.studyInfo.patientName,
        gender: 'female', // 宫颈癖查默认女性
        created_by: 1, // TODO: 使用实际登录用户ID
      });
    }

    // 2. 创建病例记录
    console.log(`🏯 创建病例记录: ${task.studyId}`);
    const study = await Study.create({
      study_id: task.studyId,
      patient_id: patient.id,
      user_id: 1, // TODO: 使用实际登录用户ID
      study_date: new Date(task.studyInfo.studyDate),
      study_type: task.studyInfo.modality || '宫颈细胞学检查',
      description: task.studyInfo.description,
      status: 'uploaded',
    });

    // 3. 创建图像记录
    console.log(`🖼️ 创建图像记录`);

    // 提取文件格式
    const fileExt = path.extname(file.originalname).substring(1).toUpperCase();
    const fileFormat = fileExt === 'JPG' ? 'JPEG' : fileExt;

    await StudyImage.create({
      study_id: study.id,
      original_filename: file.originalname,
      stored_filename: path.basename(file.filename),
      file_path: task.studyInfo.imageUrl,
      file_size: file.size,
      mime_type: file.mimetype,
      file_format: fileFormat,
      is_primary: true,
      upload_status: 'completed',
    });

    // 4. 创建分析任务记录
    console.log(`🧪 创建分析任务记录`);
    const analysisTask = await AnalysisTask.create({
      task_id: task.taskId,
      study_id: study.id,
      user_id: 1, // TODO: 使用实际登录用户ID
      status: 'PENDING',
      progress: 0,
    });

    // 将数据库 ID 保存到任务对象
    task.dbIds = {
      patientId: patient.id,
      studyId: study.id,
      analysisTaskId: analysisTask.id,
    };

    console.log(`✅ 数据库保存完成`);
  } catch (error) {
    console.error(`❌ 保存数据库失败:`, error);
    throw error;
  }
}

/**
 * 异步处理分析任务
 * @param {string} taskId - 任务ID
 */
async function processAnalysisTask(taskId) {
  const task = tasks.get(taskId);
  if (!task) {
    console.error(`任务 ${taskId} 不存在`);
    return;
  }

  try {
    // 更新状态为处理中
    task.status = 'PROCESSING';
    task.progress = 10;
    task.startedAt = new Date().toISOString();
    console.log(`🔄 开始处理任务: ${taskId}`);

    // 更新数据库中的任务状态
    if (task.dbIds?.analysisTaskId) {
      await AnalysisTask.update(
        { status: 'PROCESSING', progress: 10, started_at: new Date() },
        { where: { id: task.dbIds.analysisTaskId } },
      );
      await Study.update({ status: 'processing' }, { where: { id: task.dbIds.studyId } });
    }

    // 调用通义千问API分析图像
    task.progress = 30;
    const result = await qwenService.analyzeImage(task.studyInfo.imagePath);

    task.progress = 90;
    console.log(`✅ 任务 ${taskId} 分析完成`);
    console.log(`📊 诊断: ${result.diagnosis}, 置信度: ${(result.confidence * 100).toFixed(1)}%`);

    // 更新任务状态为成功
    task.status = 'SUCCESS';
    task.progress = 100;
    task.completedAt = new Date().toISOString();
    task.result = result;

    // 保存分析结果到数据库
    if (task.dbIds?.analysisTaskId && task.dbIds?.studyId) {
      console.log(`💾 保存分析结果到数据库...`);

      // 确定风险等级
      let riskLevel = 'low';
      if (result.diagnosis.includes('浸润性癌') || result.diagnosis.includes('HSIL')) {
        riskLevel = 'critical';
      } else if (result.diagnosis.includes('LSIL') || result.diagnosis.includes('ASC-H')) {
        riskLevel = 'high';
      } else if (result.diagnosis.includes('ASC-US')) {
        riskLevel = 'medium';
      }

      await AnalysisResult.create({
        task_id: task.dbIds.analysisTaskId,
        study_id: task.dbIds.studyId,
        diagnosis: result.diagnosis,
        confidence: result.confidence,
        risk_level: riskLevel,
        recommendations: result.recommendations || [],
        suspicious_areas: result.suspiciousAreas || [],
        biomarkers: result.biomarkers || {},
        detailed_report: result.detailedReport,
        raw_output: result.rawResponse ? { rawResponse: result.rawResponse } : null,
      });

      // 更新任务和病例状态
      await AnalysisTask.update(
        { status: 'SUCCESS', progress: 100, completed_at: new Date() },
        { where: { id: task.dbIds.analysisTaskId } },
      );
      await Study.update({ status: 'completed' }, { where: { id: task.dbIds.studyId } });

      console.log(`✅ 分析结果已保存到数据库`);
    }
  } catch (error) {
    console.error(`❌ 任务 ${taskId} 失败:`, error.message);

    // 更新任务状态为失败
    task.status = 'FAILED';
    task.error = error.message;
    task.completedAt = new Date().toISOString();

    // 更新数据库中的状态
    if (task.dbIds?.analysisTaskId) {
      await AnalysisTask.update(
        {
          status: 'FAILED',
          progress: task.progress || 0,
          error_message: error.message,
          completed_at: new Date(),
        },
        { where: { id: task.dbIds.analysisTaskId } },
      ).catch((err) => console.error('更新数据库失败:', err));

      await Study.update({ status: 'failed' }, { where: { id: task.dbIds.studyId } }).catch((err) =>
        console.error('更新数据库失败:', err),
      );
    }
  }
}

/**
 * GET /api/analyze/study/:studyId
 * 根据studyId查询分析结果
 */
router.get('/study/:studyId', (req, res) => {
  const { studyId } = req.params;

  // 查找对应的任务
  let foundTask = null;
  for (const [, task] of tasks) {
    if (task.studyId === studyId) {
      foundTask = task;
      break;
    }
  }

  if (!foundTask) {
    return res.status(404).json({
      error: '未找到该病例的分析任务',
      studyId,
    });
  }

  // 返回完整信息
  res.json({
    taskId: foundTask.taskId,
    studyId: foundTask.studyId,
    status: foundTask.status,
    progress: foundTask.progress,
    studyInfo: foundTask.studyInfo,
    result: foundTask.result,
    error: foundTask.error,
    createdAt: foundTask.createdAt,
    completedAt: foundTask.completedAt,
  });
});

module.exports = router;
