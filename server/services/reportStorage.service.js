/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Readable } = require('stream');
const { getStore } = require('@edgeone/pages-blob');

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_CONSISTENCY = 'strong';
const MAX_BLOB_VERIFY_RETRY_COUNT = 3;
const BLOB_VERIFY_RETRY_DELAY_MS = 250;

function normalizeProvider(value) {
  const provider = String(value || '').trim().toLowerCase();
  if (provider === 'edgeone-blob') {
    return 'edgeone-blob';
  }
  return 'local';
}

function getConfiguredProvider() {
  return normalizeProvider(process.env.REPORT_STORAGE_PROVIDER);
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function ensureAbsoluteFilePath(filePath) {
  const normalized = String(filePath || '').trim();
  if (!normalized) {
    throw new Error('报告存储失败：文件路径为空');
  }
  return path.resolve(normalized);
}

function ensureReadableLocalFile(filePath) {
  const absolutePath = ensureAbsoluteFilePath(filePath);
  if (!fs.existsSync(absolutePath)) {
    const error = new Error('报告文件不存在，无法继续存储流程');
    error.statusCode = 404;
    error.code = 'REPORT_FILE_NOT_FOUND';
    throw error;
  }
  return absolutePath;
}

function guessMimeType(fileName) {
  const ext = path.extname(String(fileName || '')).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (ext === '.xlsx') {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  return 'application/octet-stream';
}

function sanitizeSegment(value, fallback = 'unknown') {
  const normalized = String(value || '')
    .trim()
    .replace(/[^\w.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || fallback;
}

function buildStorageKey(metadata = {}, fileName = 'report.bin') {
  const studySegment = sanitizeSegment(metadata.studyId, 'study');
  const reportSegment = sanitizeSegment(metadata.reportId, 'report');
  const fileSegment = sanitizeSegment(path.basename(fileName, path.extname(fileName)), 'file');
  const ext = path.extname(fileName) || '.bin';
  const uniqueSuffix =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `reports/${studySegment}/${reportSegment}-${fileSegment}-${Date.now()}-${uniqueSuffix}${ext}`;
}

function getBlobStoreName() {
  const storeName = String(process.env.EDGEONE_BLOB_STORE || process.env.EDGEONE_BLOB_NAMESPACE || '').trim();
  if (!storeName) {
    const error = new Error('未配置 EDGEONE_BLOB_STORE，无法使用 EdgeOne Blob');
    error.statusCode = 500;
    error.code = 'EDGEONE_BLOB_STORE_MISSING';
    throw error;
  }
  return storeName;
}

function getBlobConsistency() {
  const consistency = String(process.env.EDGEONE_BLOB_CONSISTENCY || DEFAULT_CONSISTENCY)
    .trim()
    .toLowerCase();
  return consistency === 'eventual' ? 'eventual' : 'strong';
}

function getBlobProjectId() {
  const projectId = String(process.env.EDGEONE_PROJECT_ID || '').trim();
  if (!projectId) {
    const error = new Error('未配置 EDGEONE_PROJECT_ID，无法使用 EdgeOne Blob');
    error.statusCode = 500;
    error.code = 'EDGEONE_PROJECT_ID_MISSING';
    throw error;
  }
  return projectId;
}

function getBlobApiToken() {
  const token = String(process.env.EDGEONE_API_TOKEN || '').trim();
  if (!token) {
    const error = new Error('未配置 EDGEONE_API_TOKEN，无法使用 EdgeOne Blob');
    error.statusCode = 500;
    error.code = 'EDGEONE_API_TOKEN_MISSING';
    throw error;
  }
  return token;
}

function getBlobStore() {
  return getStore({
    name: getBlobStoreName(),
    projectId: getBlobProjectId(),
    token: getBlobApiToken(),
    consistency: getBlobConsistency(),
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildLocalStorageResult(filePath, metadata = {}) {
  const absolutePath = ensureReadableLocalFile(filePath);
  const fileName = path.basename(absolutePath);
  const stats = fs.statSync(absolutePath);
  return {
    storageProvider: 'local',
    storageKey: null,
    storageNamespace: null,
    storageUrl: null,
    storageStatus: 'completed',
    filePath: absolutePath,
    fileName,
    fileSize: stats.size,
    publicUrl: null,
    metadata,
  };
}

async function uploadReportToEdgeOne(filePath, metadata = {}) {
  const absolutePath = ensureReadableLocalFile(filePath);
  const fileName = path.basename(absolutePath);
  const fileBuffer = await fs.promises.readFile(absolutePath);
  const contentType = guessMimeType(fileName);
  const cacheControl = contentType === 'application/pdf' ? 'private, max-age=0, no-store' : 'max-age=0, no-store';
  const objectKey = buildStorageKey(metadata, fileName);

  try {
    const store = getBlobStore();
    await Promise.race([
      store.set(objectKey, fileBuffer, {
        cacheControl,
      }),
      new Promise((_, reject) =>
        setTimeout(() => {
          const timeoutError = new Error('上传 EdgeOne Blob 超时');
          timeoutError.statusCode = 504;
          timeoutError.code = 'EDGEONE_UPLOAD_TIMEOUT';
          reject(timeoutError);
        }, parsePositiveInt(process.env.EDGEONE_REQUEST_TIMEOUT_MS, DEFAULT_TIMEOUT_MS)),
      ),
    ]);
    await verifyUploadedObject(store, objectKey, {
      expectedSize: fileBuffer.length,
      expectedContentType: contentType,
    });
  } catch (error) {
    await bestEffortDeleteBlob(objectKey);
    const uploadError = new Error(`上传 EdgeOne Blob 失败：${error.message || '未知错误'}`);
    uploadError.statusCode = Number(error?.statusCode || error?.status || 502);
    uploadError.code = error?.code || 'EDGEONE_UPLOAD_FAILED';
    throw uploadError;
  }

  return {
    storageProvider: 'edgeone-blob',
    storageKey: objectKey,
    storageNamespace: getBlobStoreName(),
    storageUrl: null,
    storageStatus: 'completed',
    filePath: objectKey,
    fileName,
    fileSize: fileBuffer.length,
    publicUrl: null,
    metadata,
  };
}

async function verifyUploadedObject(store, objectKey, { expectedSize, expectedContentType }) {
  let lastMetadata = null;
  for (let attempt = 1; attempt <= MAX_BLOB_VERIFY_RETRY_COUNT; attempt += 1) {
    lastMetadata = await store.getMetadata(objectKey, {
      consistency: getBlobConsistency(),
    });

    const actualSize = Number(lastMetadata?.headers?.['content-length'] || 0);
    const actualContentType = String(lastMetadata?.contentType || '').trim().toLowerCase();
    const expectedType = String(expectedContentType || '').trim().toLowerCase();
    const sizeMatches = actualSize === expectedSize;
    const typeMatches = !expectedType || actualContentType === expectedType;

    if (lastMetadata && sizeMatches && typeMatches) {
      return;
    }

    if (attempt < MAX_BLOB_VERIFY_RETRY_COUNT) {
      await sleep(BLOB_VERIFY_RETRY_DELAY_MS * attempt);
    }
  }

  const verifyError = new Error('EdgeOne Blob 写入后校验失败');
  verifyError.statusCode = 502;
  verifyError.code = 'EDGEONE_UPLOAD_VERIFY_FAILED';
  verifyError.details = lastMetadata;
  throw verifyError;
}

async function saveReport(filePath, metadata = {}) {
  const provider = normalizeProvider(metadata.provider || getConfiguredProvider());
  if (provider === 'edgeone-blob') {
    return uploadReportToEdgeOne(filePath, metadata);
  }
  return buildLocalStorageResult(filePath, metadata);
}

function createLocalFileReadStream(filePath) {
  const absolutePath = ensureReadableLocalFile(filePath);
  return fs.createReadStream(absolutePath);
}

function arrayBufferToNodeStream(arrayBuffer) {
  return Readable.from(Buffer.from(arrayBuffer));
}

function buildStoragePayload(report) {
  return {
    reportId: report?.id,
    reportCode: report?.report_id,
    storageProvider: report?.storage_provider || 'local',
    storageKey: report?.storage_key || null,
    storageNamespace: report?.storage_namespace || null,
    storageUrl: report?.storage_url || null,
    filePath: report?.file_path || null,
  };
}

async function getBlobArrayBuffer(storageKey) {
  try {
    const store = getBlobStore();
    const result = await Promise.race([
      store.get(storageKey, {
        type: 'arrayBuffer',
        consistency: getBlobConsistency(),
      }),
      new Promise((_, reject) =>
        setTimeout(() => {
          const timeoutError = new Error('读取 EdgeOne Blob 超时');
          timeoutError.statusCode = 504;
          timeoutError.code = 'EDGEONE_DOWNLOAD_TIMEOUT';
          reject(timeoutError);
        }, parsePositiveInt(process.env.EDGEONE_REQUEST_TIMEOUT_MS, DEFAULT_TIMEOUT_MS)),
      ),
    ]);
    return result;
  } catch (error) {
    const readError = new Error(`读取 EdgeOne Blob 失败：${error.message || '未知错误'}`);
    readError.statusCode = Number(error?.statusCode || error?.status || 502);
    readError.code = error?.code || 'EDGEONE_DOWNLOAD_FAILED';
    throw readError;
  }
}

async function getReportDownloadTarget(report) {
  const provider = normalizeProvider(report?.storage_provider);
  if (provider === 'edgeone-blob' && report?.storage_key) {
    const arrayBuffer = await getBlobArrayBuffer(report.storage_key);
    if (!arrayBuffer) {
      const error = new Error('远程报告文件不存在，可能已被清理');
      error.statusCode = 404;
      error.code = 'REMOTE_REPORT_NOT_FOUND';
      throw error;
    }

    return {
      type: 'buffer',
      provider,
      buffer: Buffer.from(arrayBuffer),
      stream: arrayBufferToNodeStream(arrayBuffer),
      payload: buildStoragePayload(report),
    };
  }

  return {
    type: 'local',
    provider: 'local',
    filePath: ensureReadableLocalFile(report?.file_path),
    payload: buildStoragePayload(report),
  };
}

async function getSignedShareTarget(report) {
  return getReportDownloadTarget(report);
}

async function bestEffortDeleteBlob(storageKey) {
  if (!storageKey) return;
  try {
    const store = getBlobStore();
    await store.delete(storageKey);
  } catch {
    // 清理失败不覆盖主错误
  }
}

async function deleteReport(storageKey, report = null) {
  const provider = normalizeProvider(report?.storage_provider);

  if (provider === 'edgeone-blob' && storageKey) {
    try {
      const store = getBlobStore();
      await Promise.race([
        store.delete(storageKey),
        new Promise((_, reject) =>
          setTimeout(() => {
            const timeoutError = new Error('删除 EdgeOne Blob 超时');
            timeoutError.statusCode = 504;
            timeoutError.code = 'EDGEONE_DELETE_TIMEOUT';
            reject(timeoutError);
          }, parsePositiveInt(process.env.EDGEONE_REQUEST_TIMEOUT_MS, DEFAULT_TIMEOUT_MS)),
        ),
      ]);
    } catch (error) {
      const deleteError = new Error(`删除 EdgeOne Blob 报告失败：${error.message || '未知错误'}`);
      deleteError.statusCode = Number(error?.statusCode || error?.status || 502);
      deleteError.code = error?.code || 'EDGEONE_DELETE_FAILED';
      throw deleteError;
    }
    return;
  }

  if (!report?.file_path) {
    return;
  }

  const absolutePath = ensureReadableLocalFile(report.file_path);
  await fs.promises.unlink(absolutePath).catch(() => {});
}

module.exports = {
  createLocalFileReadStream,
  deleteReport,
  getConfiguredProvider,
  getReportDownloadTarget,
  getSignedShareTarget,
  guessMimeType,
  normalizeProvider,
  saveReport,
};
