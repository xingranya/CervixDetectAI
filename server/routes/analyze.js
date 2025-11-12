/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const qwenService = require('../services/qwenService');

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
  }
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
    fileSize: parseInt(process.env.MAX_IMAGE_SIZE) || 10485760 // 10MB
  }
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
        details: '缺少图像文件'
      });
    }

    // 验证必填字段
    const { patientName, patientId, studyDate, modality } = req.body;
    if (!patientName || !patientId || !studyDate || !modality) {
      // 删除已上传的文件
      await fs.unlink(req.file.path);
      return res.status(400).json({
        error: '请求参数错误',
        details: '缺少必填字段：patientName、patientId、studyDate、modality'
      });
    }

    // 生成任务ID和病例ID
    const taskId = `task_${uuidv4()}`;
    const studyId = `study_${uuidv4()}`;

    // 创建任务记录
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
        imagePath: req.file.path
      }
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
      estimatedTime: 30
    });

    // 异步执行分析
    processAnalysisTask(taskId).catch(error => {
      console.error(`❌ 任务 ${taskId} 执行失败:`, error);
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
      taskId
    });
  }

  // 返回任务状态
  const response = {
    taskId: task.taskId,
    studyId: task.studyId,
    status: task.status,
    progress: task.progress
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

  } catch (error) {
    console.error(`❌ 任务 ${taskId} 失败:`, error.message);
    
    // 更新任务状态为失败
    task.status = 'FAILED';
    task.error = error.message;
    task.completedAt = new Date().toISOString();
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
      studyId
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
    completedAt: foundTask.completedAt
  });
});

module.exports = router;
