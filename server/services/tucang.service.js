/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const https = require('https');
const axios = require('axios');

const DEFAULT_TUCANG_API_BASE_URL = 'https://api.tucang.cc';
const DEFAULT_UPLOAD_PATH = '/api/v1/upload';
const DEFAULT_TUCANG_IMAGE_BASE_URL = 'https://img1.tucang.cc/api/image/show';
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRY_MAX = 2;
const DEFAULT_TLS_REJECT_UNAUTHORIZED = true;

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function normalizeApiBaseUrl(value) {
  const raw = String(value || DEFAULT_TUCANG_API_BASE_URL).trim();
  if (!raw) {
    return DEFAULT_TUCANG_API_BASE_URL;
  }
  return raw.replace(/\/+$/, '');
}

function normalizeImageBaseUrl(value) {
  const raw = String(value || DEFAULT_TUCANG_IMAGE_BASE_URL).trim();
  if (!raw) {
    return DEFAULT_TUCANG_IMAGE_BASE_URL;
  }
  return raw.replace(/\/+$/, '');
}

function isMd5(value) {
  return /^[a-f0-9]{32}$/i.test(String(value || '').trim());
}

function normalizeRemoteUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }
  if (raw.startsWith('//')) {
    return `https:${raw}`;
  }
  return raw;
}

function isStandardTucangImageUrl(value) {
  return /https?:\/\/[^/]*tucang\.cc\/api\/image\/show\/[a-f0-9]{32}$/i.test(
    String(value || '').trim(),
  );
}

function buildTucangImageUrl(md5) {
  if (!isMd5(md5)) {
    return '';
  }
  const imageBaseUrl = normalizeImageBaseUrl(process.env.TUCANG_IMAGE_BASE_URL);
  return `${imageBaseUrl}/${String(md5).trim()}`;
}

function parseBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const text = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(text)) return true;
  if (['0', 'false', 'no', 'off'].includes(text)) return false;
  return fallback;
}

function isRetryableError(error) {
  const status = Number(error?.status || error?.response?.status);
  if (status === 429) return true;
  if (status >= 500 && status < 600) return true;

  const code = String(error?.code || '');
  return (
    code === 'ABORT_ERR' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND'
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractFileType(filename) {
  const ext = path.extname(filename || '').toLowerCase().replace('.', '');
  if (!ext) return null;
  return ext;
}

function ensureToken(providedToken) {
  const token = String(providedToken || process.env.TUCANG_TOKEN || '').trim();
  if (!token) {
    throw new Error('图仓上传失败：未配置 TUCANG_TOKEN');
  }
  return token;
}

function ensureUploadData(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('图仓上传失败：上传文件内容为空');
  }
}

function normalizeFolderId(folderId) {
  if (folderId === undefined || folderId === null) {
    return null;
  }
  const text = String(folderId).trim();
  return text ? text : null;
}

async function doUpload({
  endpoint,
  token,
  buffer,
  filename,
  mimeType,
  folderId,
  timeoutMs,
  tlsRejectUnauthorized,
}) {
  if (typeof globalThis.FormData !== 'function' || typeof globalThis.Blob !== 'function') {
    throw new Error('当前 Node.js 环境不支持 FormData/Blob，无法调用图仓 API');
  }

  const formData = new globalThis.FormData();
  const blob = new globalThis.Blob([buffer], {
    type: mimeType || 'application/octet-stream',
  });
  const safeFilename = filename || `image-${Date.now()}.jpg`;

  formData.append('token', token);
  formData.append('file', blob, safeFilename);

  const imageType = extractFileType(safeFilename);
  if (imageType) {
    formData.append('type', imageType);
  }

  const normalizedFolderId = normalizeFolderId(folderId);
  if (normalizedFolderId) {
    formData.append('folderId', normalizedFolderId);
  }

  try {
    const requestConfig = {
      method: 'POST',
      url: endpoint,
      data: formData,
      timeout: timeoutMs,
      maxBodyLength: Infinity,
    };

    if (String(endpoint).startsWith('https://')) {
      requestConfig.httpsAgent = new https.Agent({
        rejectUnauthorized: tlsRejectUnauthorized,
      });
    }

    const response = await axios(requestConfig);
    const payload = response?.data || null;

    const success = payload?.success === true || String(payload?.code) === '200';
    const md5 = payload?.data?.md5 || null;
    const rawUrl = normalizeRemoteUrl(payload?.data?.url);
    const canonicalUrl = buildTucangImageUrl(md5);
    const finalUrl = isStandardTucangImageUrl(rawUrl) ? rawUrl : canonicalUrl || rawUrl;

    if (!success || !finalUrl) {
      throw new Error(payload?.msg || '图仓上传失败：返回数据无效');
    }

    return {
      url: finalUrl,
      md5,
      raw: payload,
    };
  } catch (error) {
    if (error?.code === 'ECONNABORTED') {
      const timeoutError = new Error('图仓上传超时，请稍后重试');
      timeoutError.code = 'ABORT_ERR';
      throw timeoutError;
    }

    if (error?.response) {
      const status = Number(error.response.status || 500);
      const msg = error.response.data?.msg || error.response.data?.message || '';
      const requestError = new Error(`图仓上传失败：HTTP ${status}${msg ? ` - ${msg}` : ''}`);
      requestError.status = status;
      throw requestError;
    }

    const causeCode = String(error?.cause?.code || error?.code || '');
    if (causeCode === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      throw new Error(
        '图仓上传失败：TLS 证书链校验失败（UNABLE_TO_VERIFY_LEAF_SIGNATURE），请配置 TUCANG_TLS_REJECT_UNAUTHORIZED=false 或修复服务器 CA 证书链',
      );
    }

    throw error;
  }
}

async function uploadBufferToTucang({
  buffer,
  filename,
  mimeType,
  folderId,
  token,
  timeoutMs,
  retryMax,
  tlsRejectUnauthorized,
}) {
  ensureUploadData(buffer);
  const normalizedToken = ensureToken(token);
  const baseUrl = normalizeApiBaseUrl(process.env.TUCANG_API_BASE_URL);
  const endpoint = `${baseUrl}${DEFAULT_UPLOAD_PATH}`;
  const finalTimeoutMs = parsePositiveInt(timeoutMs ?? process.env.TUCANG_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  const finalRetryMax = parsePositiveInt(retryMax ?? process.env.TUCANG_RETRY_MAX, DEFAULT_RETRY_MAX);
  const finalTlsRejectUnauthorized = parseBoolean(
    tlsRejectUnauthorized ?? process.env.TUCANG_TLS_REJECT_UNAUTHORIZED,
    DEFAULT_TLS_REJECT_UNAUTHORIZED,
  );
  const totalAttempts = finalRetryMax + 1;

  let lastError = null;
  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    try {
      return await doUpload({
        endpoint,
        token: normalizedToken,
        buffer,
        filename,
        mimeType,
        folderId,
        timeoutMs: finalTimeoutMs,
        tlsRejectUnauthorized: finalTlsRejectUnauthorized,
      });
    } catch (error) {
      lastError = error;
      const retryable = isRetryableError(error);
      if (!retryable || attempt >= totalAttempts) {
        break;
      }
      const delayMs = attempt * 800;
      await sleep(delayMs);
    }
  }

  throw lastError || new Error('图仓上传失败：未知错误');
}

module.exports = {
  buildTucangImageUrl,
  isMd5,
  isStandardTucangImageUrl,
  uploadBufferToTucang,
};
