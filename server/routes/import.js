/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 数据导入路由
 * 提供患者 XLSX 文件上传预览、确认导入与模板下载接口
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { handleRouteError } = require('../utils/errorHandler');
const {
  parseFile,
  validateRows,
  checkDuplicates,
  importPatients,
  generateTemplate,
  previewCache,
  CACHE_TTL_MS,
} = require('../services/dataImport.service');

// 确保临时上传目录存在
const importTempDir = path.join(__dirname, '../uploads/import-temp');
if (!fs.existsSync(importTempDir)) {
  fs.mkdirSync(importTempDir, { recursive: true });
}

// multer 配置 - 临时存储上传文件
const upload = multer({
  dest: importTempDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx') {
      cb(null, true);
    } else {
      cb(new Error('仅支持 XLSX 文件'));
    }
  },
});

/**
 * 安全清理临时文件
 * @param {string|undefined} filePath 文件路径
 */
function cleanupTempFile(filePath) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // 静默忽略清理失败
  }
}

// ------------------------------------------------------------------
// POST /api/import/patients/preview — 上传文件并返回预览数据
// ------------------------------------------------------------------
router.post('/patients/preview', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传文件' });
    }

    // 1. 解析文件
    const rows = await parseFile(req.file.path);

    if (rows.length === 0) {
      cleanupTempFile(req.file.path);
      return res.status(400).json({ success: false, message: '文件为空或无法解析' });
    }

    // 2. 验证
    const { valid, invalid } = validateRows(rows);

    // 3. 去重检查（合并有效和无效行，保留完整预览）
    const allRows = [...valid, ...invalid];
    const checkedRows = await checkDuplicates(allRows);

    // 4. 缓存预览数据
    const previewId = uuidv4();
    previewCache.set(previewId, { rows: checkedRows, createdAt: Date.now() });

    // 30 分钟后自动清除缓存
    setTimeout(() => {
      previewCache.delete(previewId);
    }, CACHE_TTL_MS);

    // 5. 清理临时文件
    cleanupTempFile(req.file.path);

    // 6. 返回预览结果
    res.json({
      success: true,
      data: {
        previewId,
        total: checkedRows.length,
        valid: checkedRows.filter((r) => !r._errors?.length).length,
        invalid: checkedRows.filter((r) => r._errors?.length > 0).length,
        duplicate: checkedRows.filter((r) => r._duplicate).length,
        rows: checkedRows,
      },
    });
  } catch (error) {
    cleanupTempFile(req.file?.path);
    handleRouteError(res, error, { service: 'Import', endpoint: 'POST /patients/preview' });
  }
});

// ------------------------------------------------------------------
// POST /api/import/patients/confirm — 确认导入
// ------------------------------------------------------------------
router.post('/patients/confirm', authenticate, async (req, res) => {
  try {
    const { previewId, selectedIndices } = req.body;

    if (!previewId) {
      return res.status(400).json({ success: false, message: '缺少 previewId' });
    }

    const result = await importPatients(previewId, selectedIndices || null, req.user.id);

    res.json({
      success: true,
      message: `成功导入 ${result.imported} 条患者数据`,
      data: result,
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Import', endpoint: 'POST /patients/confirm' });
  }
});

// ------------------------------------------------------------------
// GET /api/import/patients/template — 下载导入模板
// ------------------------------------------------------------------
router.get('/patients/template', authenticate, async (_req, res) => {
  try {
    const buffer = await generateTemplate();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=patient_import_template.xlsx');
    res.send(buffer);
  } catch (error) {
    handleRouteError(res, error, { service: 'Import', endpoint: 'GET /patients/template' });
  }
});

module.exports = router;
