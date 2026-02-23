/* eslint-disable @typescript-eslint/no-require-imports */
const { sequelize } = require('../config/sequelize');
const { EmailCode } = require('../models');

let ensureInfrastructurePromise = null;

function hasEnumValue(columnType, value) {
  if (!columnType || typeof columnType !== 'string') {
    return false;
  }
  return columnType.includes(`'${value}'`);
}

async function ensureEmailInfrastructure() {
  if (!ensureInfrastructurePromise) {
    ensureInfrastructurePromise = (async () => {
      await EmailCode.sync();

      if (sequelize.getDialect() !== 'mysql') {
        console.log('[EmailInfrastructure] 非 MySQL 环境，跳过枚举兼容检查');
        return;
      }

      const [columns] = await sequelize.query("SHOW COLUMNS FROM email_codes LIKE 'type'");
      const typeColumn = Array.isArray(columns) ? columns[0] : null;
      const currentType = typeColumn?.Type || typeColumn?.type || '';

      if (hasEnumValue(currentType, 'change_email')) {
        console.log('[EmailInfrastructure] email_codes.type 枚举已包含 change_email');
        return;
      }

      await sequelize.query(
        "ALTER TABLE email_codes MODIFY COLUMN type ENUM('register','reset_password','change_email') NOT NULL DEFAULT 'register' COMMENT '验证码类型'",
      );

      console.log('[EmailInfrastructure] email_codes.type 枚举已扩展为 register/reset_password/change_email');
    })().catch((error) => {
      ensureInfrastructurePromise = null;
      throw error;
    });
  }

  return ensureInfrastructurePromise;
}

module.exports = {
  ensureEmailInfrastructure,
};
