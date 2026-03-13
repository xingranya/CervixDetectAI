/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const {
  uploadBufferToTucang,
  buildTucangImageUrl,
  isMd5,
  isStandardTucangImageUrl,
} = require('./tucang.service');

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

function isRemoteFilePath(value) {
  return /^https?:\/\//i.test(String(value || ''));
}

function normalizeStoredFilePath(value) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed || isRemoteFilePath(trimmed)) {
    return trimmed;
  }

  const normalizedPath = trimmed.replace(/^\/+/, '');
  if (/^(uploads|reports)\//i.test(normalizedPath)) {
    return `/${normalizedPath}`;
  }

  return trimmed;
}

function resolvePreferredStudyImagePath(record) {
  const normalizedFilePath = normalizeStoredFilePath(record?.file_path);
  if (isStandardTucangImageUrl(normalizedFilePath)) {
    return normalizedFilePath;
  }

  const storedFilename = String(record?.stored_filename || '').trim();
  if (isMd5(storedFilename)) {
    const canonicalUrl = buildTucangImageUrl(storedFilename);
    if (canonicalUrl) {
      return canonicalUrl;
    }
  }

  return normalizedFilePath;
}

function resolveUploadAbsolutePath(storedPath) {
  const normalizedStoredPath = normalizeStoredFilePath(storedPath);
  if (!normalizedStoredPath || typeof normalizedStoredPath !== 'string') {
    return null;
  }
  if (isRemoteFilePath(normalizedStoredPath)) {
    return null;
  }

  const trimmed = normalizedStoredPath.replace(/^\/+/, '');
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

async function resolveUploadedFileBuffer(file) {
  if (!file) {
    throw new Error('影像文件无效，未读取到文件内容');
  }
  if (Buffer.isBuffer(file.buffer) && file.buffer.length > 0) {
    return {
      buffer: file.buffer,
      cleanupSource: async () => {},
    };
  }
  if (typeof file.path === 'string' && file.path) {
    const buffer = await fs.promises.readFile(file.path);
    return {
      buffer,
      cleanupSource: async () => {
        await safeUnlink(file.path);
      },
    };
  }
  throw new Error('影像文件无效，未读取到文件内容');
}

async function persistStudyImage({ file }) {
  const { buffer, cleanupSource } = await resolveUploadedFileBuffer(file);

  const storedFileName = buildStoredFileName(file.originalname, 'study');
  let localAbsolutePath = null;
  try {
    await fs.promises.mkdir(studiesUploadDir, { recursive: true });
    localAbsolutePath = path.join(studiesUploadDir, storedFileName);
    await fs.promises.writeFile(localAbsolutePath, buffer);
    await cleanupSource();

    return {
      storedFilename: storedFileName,
      filePath: `/uploads/studies/${storedFileName}`,
      uploadStatus: 'pending',
      rollback: async () => {
        await safeUnlink(localAbsolutePath);
      },
    };
  } catch (error) {
    await cleanupSource();
    await safeUnlink(localAbsolutePath);
    throw error;
  }
}

async function syncStudyImageToTucang(studyImageRecord) {
  const plain = toPlainRecord(studyImageRecord);
  const normalizedFilePath = normalizeStoredFilePath(plain?.file_path);
  if (!normalizedFilePath) {
    throw new Error('影像文件路径为空，无法同步到图仓');
  }
  if (isRemoteFilePath(normalizedFilePath)) {
    return {
      uploaded: false,
      filePath: normalizedFilePath,
      storedFilename: plain.stored_filename,
    };
  }

  const localAbsolutePath = resolveUploadAbsolutePath(normalizedFilePath);
  if (!localAbsolutePath) {
    throw new Error('本地影像路径无效，无法同步到图仓');
  }

  const fileBuffer = await fs.promises.readFile(localAbsolutePath);
  const uploaded = await uploadBufferToTucang({
    buffer: fileBuffer,
    filename: plain.original_filename || plain.stored_filename,
    mimeType: plain.mime_type,
    folderId: process.env.TUCANG_STUDY_FOLDER_ID,
  });

  const nextFilePath = uploaded.url;
  const nextStoredFilename = uploaded.md5 || plain.stored_filename;

  if (typeof studyImageRecord?.update === 'function') {
    await studyImageRecord.update({
      file_path: nextFilePath,
      stored_filename: nextStoredFilename,
      upload_status: 'completed',
    });
  }

  await safeUnlink(localAbsolutePath);
  return {
    uploaded: true,
    filePath: nextFilePath,
    storedFilename: nextStoredFilename,
  };
}

async function removeStudyImageFile(studyImageRecord) {
  const plain = toPlainRecord(studyImageRecord);
  const localFilePath = resolveUploadAbsolutePath(plain?.file_path);
  await safeUnlink(localFilePath);
}

async function prepareStudyImageForAnalysis(studyImageRecord) {
  const plain = toPlainRecord(studyImageRecord);
  const normalizedFilePath = resolvePreferredStudyImagePath(plain);
  if (isRemoteFilePath(normalizedFilePath)) {
    return {
      imagePath: normalizedFilePath,
      cleanup: async () => {},
    };
  }

  try {
    const synced = await syncStudyImageToTucang(studyImageRecord);
    if (isRemoteFilePath(synced?.filePath)) {
      return {
        imagePath: synced.filePath,
        cleanup: async () => {},
      };
    }
  } catch (error) {
    console.warn(`[StudyImageStorage] 分析前图仓同步失败，将使用本地路径: ${error.message}`);
  }

  const localPath = resolveUploadAbsolutePath(normalizedFilePath);
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
    file_path: resolvePreferredStudyImagePath(plain),
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
  syncStudyImageToTucang,
  removeStudyImageFile,
  prepareStudyImageForAnalysis,
  serializeStudyImageForResponse,
  serializeStudyForResponse,
  resolveUploadAbsolutePath,
  isRemoteFilePath,
  normalizeStoredFilePath,
  resolvePreferredStudyImagePath,
};
