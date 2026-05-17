/* eslint-disable @typescript-eslint/no-require-imports */
const { sequelize } = require('../config/sequelize');
const { MedicalReport } = require('../models');

let ensureInfrastructurePromise = null;

function hasColumn(columns, field) {
  return Array.isArray(columns) && columns.some((item) => item?.Field === field);
}

function hasEnumValue(columnType, value) {
  if (!columnType || typeof columnType !== 'string') {
    return false;
  }
  return columnType.includes(`'${value}'`);
}

async function ensureColumn(query) {
  await sequelize.query(query);
}

async function tableExists(tableName) {
  const [rows] = await sequelize.query('SHOW TABLES LIKE ?', {
    replacements: [tableName],
  });
  return Array.isArray(rows) && rows.length > 0;
}

async function ensureMedicalReportsInfrastructure() {
  if (!ensureInfrastructurePromise) {
    ensureInfrastructurePromise = (async () => {
      if (sequelize.getDialect() !== 'mysql') {
        await MedicalReport.sync();
        console.log('[MedicalReportsInfrastructure] 非 MySQL 环境，跳过存储字段兼容检查');
        return;
      }

      const exists = await tableExists('medical_reports');
      if (!exists) {
        await MedicalReport.sync();
        console.log('[MedicalReportsInfrastructure] medical_reports 表不存在，已按最新模型创建');
        return;
      }

      const [columns] = await sequelize.query('SHOW COLUMNS FROM medical_reports');

      if (!hasColumn(columns, 'storage_provider')) {
        await ensureColumn(
          "ALTER TABLE medical_reports ADD COLUMN storage_provider ENUM('local','edgeone-blob') NOT NULL DEFAULT 'local' COMMENT '报告文件存储提供方' AFTER file_path",
        );
      } else {
        const providerColumn = columns.find((item) => item?.Field === 'storage_provider');
        const currentType = providerColumn?.Type || providerColumn?.type || '';
        if (!hasEnumValue(currentType, 'edgeone-blob')) {
          await ensureColumn(
            "ALTER TABLE medical_reports MODIFY COLUMN storage_provider ENUM('local','edgeone-blob') NOT NULL DEFAULT 'local' COMMENT '报告文件存储提供方'",
          );
        }
      }

      if (!hasColumn(columns, 'storage_key')) {
        await ensureColumn(
          "ALTER TABLE medical_reports ADD COLUMN storage_key VARCHAR(500) NULL COMMENT '存储提供方内部对象键' AFTER storage_provider",
        );
      }

      if (!hasColumn(columns, 'storage_namespace')) {
        await ensureColumn(
          "ALTER TABLE medical_reports ADD COLUMN storage_namespace VARCHAR(255) NULL COMMENT '对象所属命名空间或桶标识' AFTER storage_key",
        );
      }

      if (!hasColumn(columns, 'storage_url')) {
        await ensureColumn(
          "ALTER TABLE medical_reports ADD COLUMN storage_url VARCHAR(1000) NULL COMMENT '存储提供方返回的对象访问地址' AFTER storage_namespace",
        );
      }

      if (!hasColumn(columns, 'storage_status')) {
        await ensureColumn(
          "ALTER TABLE medical_reports ADD COLUMN storage_status ENUM('pending','completed','failed') NOT NULL DEFAULT 'completed' COMMENT '报告文件存储状态' AFTER storage_url",
        );
      } else {
        const statusColumn = columns.find((item) => item?.Field === 'storage_status');
        const currentType = statusColumn?.Type || statusColumn?.type || '';
        if (!hasEnumValue(currentType, 'pending') || !hasEnumValue(currentType, 'failed')) {
          await ensureColumn(
            "ALTER TABLE medical_reports MODIFY COLUMN storage_status ENUM('pending','completed','failed') NOT NULL DEFAULT 'completed' COMMENT '报告文件存储状态'",
          );
        }
      }

      console.log('[MedicalReportsInfrastructure] medical_reports 存储扩展字段已就绪');
    })().catch((error) => {
      ensureInfrastructurePromise = null;
      throw error;
    });
  }

  return ensureInfrastructurePromise;
}

module.exports = {
  ensureMedicalReportsInfrastructure,
};
