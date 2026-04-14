/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 数据导入服务
 * 支持 XLSX 文件解析、验证、去重与批量导入
 */

const ExcelJS = require('exceljs');
const { Patient } = require('../models');
const { validatePhone, validateIdCard } = require('../utils/validators');
const { Op } = require('sequelize');
const { sequelize } = require('../config/sequelize');

// 内存缓存预览数据（简单实现，生产环境可用 Redis）
const previewCache = new Map();

/** 缓存过期时间：30 分钟 */
const CACHE_TTL_MS = 30 * 60 * 1000;

/** 批量写入每批数量 */
const BULK_BATCH_SIZE = 500;

// ------------------------------------------------------------------
// 解析
// ------------------------------------------------------------------

/**
 * 解析上传的 XLSX 文件
 * @param {string} filePath - 文件路径
 * @returns {object[]} 标准化数据数组
 */
async function parseFile(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);
  const rows = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // 跳过表头

    const values = row.values;
    // values[0] 是 undefined，实际数据从 values[1] 开始
    rows.push({
      _rowIndex: rowNumber + 1,
      name: String(values[1] || '').trim(),
      gender: normalizeGender(values[2] || ''),
      birth_date: normalizeDate(values[3] || ''),
      phone: String(values[4] || '').trim(),
      id_card: String(values[5] || '').trim(),
      medical_card_no: String(values[6] || '').trim(),
      address: String(values[7] || '').trim(),
      emergency_contact: String(values[8] || '').trim(),
      emergency_phone: String(values[9] || '').trim(),
      notes: String(values[10] || '').trim(),
    });
  });

  return rows;
}

// ------------------------------------------------------------------
// 辅助：标准化
// ------------------------------------------------------------------

/**
 * 标准化性别值
 * @param {*} value 原始值
 * @returns {'male'|'female'|'other'}
 */
function normalizeGender(value) {
  const v = String(value).trim();
  if (['男', 'male', 'M', 'm'].includes(v)) return 'male';
  if (['女', 'female', 'F', 'f'].includes(v)) return 'female';
  return 'other';
}

/**
 * 标准化日期为 YYYY-MM-DD 格式
 * @param {*} value 原始值
 * @returns {string} 标准化后的日期字符串，无效时返回空串
 */
function normalizeDate(value) {
  if (!value) return '';
  const str = String(value).trim();
  if (!str) return '';

  // 尝试常见中文日期格式 yyyy年MM月dd日
  const cnMatch = str.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
  if (cnMatch) {
    const [, y, m, d] = cnMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 尝试 yyyy/MM/dd 或 yyyy-MM-dd
  const slashMatch = str.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (slashMatch) {
    const [, y, m, d] = slashMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Excel 序列号（数值型日期）
  if (/^\d{5}$/.test(str)) {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + Number(str) * 86400000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }

  // 最后尝试 JS 原生解析
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  return '';
}

// ------------------------------------------------------------------
// 验证
// ------------------------------------------------------------------

/**
 * 逐行验证数据
 * @param {object[]} rows 解析后的数据行
 * @returns {{ valid: object[], invalid: object[] }}
 */
function validateRows(rows) {
  const valid = [];
  const invalid = [];

  for (const row of rows) {
    const errors = [];

    // 姓名必填
    if (!row.name) {
      errors.push('姓名不能为空');
    }

    // 性别必须有效
    if (!['male', 'female', 'other'].includes(row.gender)) {
      errors.push('性别无效，请填写 男/女');
    }

    // 手机号（如提供）格式校验
    if (row.phone && !validatePhone(row.phone)) {
      errors.push('手机号格式不正确');
    }

    // 身份证号（如提供）格式校验
    if (row.id_card && !validateIdCard(row.id_card)) {
      errors.push('身份证号格式不正确');
    }

    // 出生日期（如提供）有效性
    if (row.birth_date) {
      const d = new Date(row.birth_date);
      if (isNaN(d.getTime())) {
        errors.push('出生日期格式不正确');
      }
    }

    row._errors = errors;
    if (errors.length > 0) {
      invalid.push(row);
    } else {
      valid.push(row);
    }
  }

  return { valid, invalid };
}

// ------------------------------------------------------------------
// 去重
// ------------------------------------------------------------------

/**
 * 去重检查（数据库 + 文件内部）
 * @param {object[]} rows 已验证的数据行
 * @returns {Promise<object[]>} 标记了重复信息的数据行
 */
async function checkDuplicates(rows) {
  // 1. 收集需要查询的身份证号
  const idCards = rows.filter((r) => r.id_card).map((r) => r.id_card);

  // 2. 收集 name + birth_date 组合
  const nameDatePairs = rows
    .filter((r) => r.name && r.birth_date)
    .map((r) => ({ name: r.name, birth_date: r.birth_date }));

  // 3. 数据库查询
  const existingByIdCard = idCards.length
    ? await Patient.findAll({
        where: { id_card: { [Op.in]: idCards } },
        attributes: ['id', 'patient_id', 'name', 'id_card', 'birth_date'],
        raw: true,
      })
    : [];

  const existingByNameDate = nameDatePairs.length
    ? await Patient.findAll({
        where: {
          [Op.or]: nameDatePairs.map((p) => ({
            name: p.name,
            birth_date: p.birth_date,
          })),
        },
        attributes: ['id', 'patient_id', 'name', 'id_card', 'birth_date'],
        raw: true,
      })
    : [];

  // 快速索引
  const idCardMap = new Map(existingByIdCard.map((p) => [p.id_card, p]));
  const nameDateMap = new Map(existingByNameDate.map((p) => [`${p.name}|${p.birth_date}`, p]));

  // 4. 文件内部去重索引
  const internalIdCardSeen = new Map(); // id_card -> rowIndex
  const internalNameDateSeen = new Map(); // name|birth_date -> rowIndex

  for (const row of rows) {
    row._duplicate = false;
    row._duplicateReason = '';
    row._existingPatient = null;

    // 数据库身份证重复
    if (row.id_card && idCardMap.has(row.id_card)) {
      row._duplicate = true;
      row._duplicateReason = '身份证号已存在';
      row._existingPatient = idCardMap.get(row.id_card);
      continue;
    }

    // 数据库姓名+出生日期重复
    const nameKey = `${row.name}|${row.birth_date}`;
    if (row.name && row.birth_date && nameDateMap.has(nameKey)) {
      row._duplicate = true;
      row._duplicateReason = '姓名+出生日期已存在';
      row._existingPatient = nameDateMap.get(nameKey);
      continue;
    }

    // 文件内部身份证重复
    if (row.id_card) {
      if (internalIdCardSeen.has(row.id_card)) {
        row._duplicate = true;
        row._duplicateReason = `与文件第 ${internalIdCardSeen.get(row.id_card)} 行身份证号重复`;
        continue;
      }
      internalIdCardSeen.set(row.id_card, row._rowIndex);
    }

    // 文件内部姓名+出生日期重复
    if (row.name && row.birth_date) {
      if (internalNameDateSeen.has(nameKey)) {
        row._duplicate = true;
        row._duplicateReason = `与文件第 ${internalNameDateSeen.get(nameKey)} 行姓名+出生日期重复`;
        continue;
      }
      internalNameDateSeen.set(nameKey, row._rowIndex);
    }
  }

  return rows;
}

// ------------------------------------------------------------------
// 导入
// ------------------------------------------------------------------

/**
 * 确认导入（批量创建）
 * @param {string} previewId 预览 ID
 * @param {number[]|null} selectedIndices 用户选择导入的行索引（null 表示导入所有有效行）
 * @param {number} userId 操作用户 ID
 * @returns {Promise<{ imported: number, skipped: number, errors: string[] }>}
 */
async function importPatients(previewId, selectedIndices, userId) {
  const cached = previewCache.get(previewId);
  if (!cached) {
    throw new Error('预览数据已过期或不存在，请重新上传文件');
  }

  const { rows } = cached;

  // 筛选待导入行
  let toImport;
  if (Array.isArray(selectedIndices) && selectedIndices.length > 0) {
    toImport = selectedIndices
      .map((i) => rows[i])
      .filter(Boolean)
      .filter((r) => !r._errors?.length);
  } else {
    // 导入所有无错误行
    toImport = rows.filter((r) => !r._errors?.length);
  }

  if (toImport.length === 0) {
    return { imported: 0, skipped: rows.length, errors: ['没有可导入的有效数据'] };
  }

  const errors = [];
  let imported = 0;
  const skipped = rows.length - toImport.length;

  // 使用事务 + 分批写入
  const t = await sequelize.transaction();
  try {
    for (let i = 0; i < toImport.length; i += BULK_BATCH_SIZE) {
      const batch = toImport.slice(i, i + BULK_BATCH_SIZE).map((r) => ({
        name: r.name,
        gender: r.gender,
        birth_date: r.birth_date || null,
        phone: r.phone || null,
        id_card: r.id_card || null,
        medical_card_no: r.medical_card_no || null,
        address: r.address || null,
        emergency_contact: r.emergency_contact || null,
        emergency_phone: r.emergency_phone || null,
        notes: r.notes || null,
        created_by: userId,
      }));

      await Patient.bulkCreate(batch, {
        transaction: t,
        individualHooks: true, // 触发 beforeValidate 生成 patient_id
      });
      imported += batch.length;
    }

    await t.commit();
  } catch (err) {
    await t.rollback();
    errors.push(`批量导入失败: ${err.message}`);
    imported = 0;
  }

  // 清理缓存
  previewCache.delete(previewId);

  return { imported, skipped, errors };
}

// ------------------------------------------------------------------
// 模板
// ------------------------------------------------------------------

/**
 * 生成导入模板文件
 * @returns {Promise<Buffer>} Excel 文件 Buffer
 */
async function generateTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('患者导入模板');

  // 添加表头
  const headers = [
    '姓名',
    '性别',
    '出生日期',
    '手机号',
    '身份证号',
    '医保卡号',
    '地址',
    '紧急联系人',
    '紧急联系电话',
    '备注',
  ];

  // 示例数据行
  const sampleRow = [
    '张三',
    '女',
    '1990-01-15',
    '13800138000',
    '420100199001151234',
    '',
    '湖北省武汉市',
    '李四',
    '13900139000',
    '',
  ];

  // 设置列宽
  const columnWidths = [
    { width: 10 }, // 姓名
    { width: 8 }, // 性别
    { width: 14 }, // 出生日期
    { width: 14 }, // 手机号
    { width: 22 }, // 身份证号
    { width: 14 }, // 医保卡号
    { width: 24 }, // 地址
    { width: 12 }, // 紧急联系人
    { width: 14 }, // 紧急联系电话
    { width: 16 }, // 备注
  ];

  worksheet.columns = headers.map((header, i) => ({
    header,
    key: header,
    width: columnWidths[i].width,
  }));

  // 添加示例数据
  worksheet.addRow(sampleRow);

  // 生成 buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

module.exports = {
  parseFile,
  validateRows,
  checkDuplicates,
  importPatients,
  generateTemplate,
  previewCache,
  CACHE_TTL_MS,
};
