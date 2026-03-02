/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const serverRootDir = path.resolve(__dirname, '..');
const uploadsRootDir = path.resolve(serverRootDir, 'uploads');
const studiesUploadDir = path.join(uploadsRootDir, 'studies');

function toPlainRecord(record) {
  if (!record) return null;
  if (typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  return { ...record };
}

function sanitizeName(value) {
  return String(value || '')
    .replace(/[^\w.-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);
}

function resolveFileExt(fileName) {
  const ext = path.extname(fileName || '').toLowerCase();
  return ext || '.jpg';
}

function buildStoredFileName(originalFilename, prefix = 'study') {
  const ext = resolveFileExt(originalFilename);
  const baseName = path.basename(originalFilename || 'image', ext);
  const safeBase = sanitizeName(baseName) || 'image';
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${ext}`;
}

function resolveUploadAbsolutePath(storedPath) {
  if (!storedPath || typeof storedPath !== 'string') {
    return null;
  }

  const trimmed = storedPath.replace(/^\/+/, '');
  const absPath = path.resolve(serverRootDir, trimmed);
  const relativeToUploads = path.relative(uploadsRootDir, absPath);

  if (relativeToUploads.startsWith('..') || path.isAbsolute(relativeToUploads)) {
    return null;
  }

  return absPath;
}

async function safeUnlink(filePath) {
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // 清理失败不阻断主流程
  }
}

async function persistStudyImage({ file }) {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    throw new Error('影像文件无效，未读取到文件内容');
  }

  const storedFileName = buildStoredFileName(file.originalname, 'study');
  await fs.promises.mkdir(studiesUploadDir, { recursive: true });
  const localAbsolutePath = path.join(studiesUploadDir, storedFileName);
  await fs.promises.writeFile(localAbsolutePath, file.buffer);

  return {
    storedFilename: storedFileName,
    filePath: `/uploads/studies/${storedFileName}`,
    rollback: async () => {
      await safeUnlink(localAbsolutePath);
    },
  };
}

async function removeStudyImageFile(studyImageRecord) {
  const plain = toPlainRecord(studyImageRecord);
  const localFilePath = resolveUploadAbsolutePath(plain?.file_path);
  await safeUnlink(localFilePath);
}

async function prepareStudyImageForAnalysis(studyImageRecord) {
  const plain = toPlainRecord(studyImageRecord);
  const localPath = resolveUploadAbsolutePath(plain?.file_path);
  return {
    imagePath: localPath,
    cleanup: async () => {},
  };
}

async function serializeStudyImageForResponse(studyImageRecord) {
  const plain = toPlainRecord(studyImageRecord);
  if (!plain) return plain;
  return {
    ...plain,
    file_path: plain.file_path,
  };
}

async function serializeStudyForResponse(studyRecord) {
  const plain = toPlainRecord(studyRecord);
  if (!plain) return plain;

  if (Array.isArray(plain.images) && plain.images.length > 0) {
    plain.images = await Promise.all(plain.images.map((img) => serializeStudyImageForResponse(img)));
  }

  return plain;
}

module.exports = {
  persistStudyImage,
  removeStudyImageFile,
  prepareStudyImageForAnalysis,
  serializeStudyImageForResponse,
  serializeStudyForResponse,
};
