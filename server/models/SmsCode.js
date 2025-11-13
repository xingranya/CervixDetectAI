/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const SmsCode = sequelize.define(
  'SmsCode',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '手机号',
    },
    code: {
      type: DataTypes.STRING(6),
      allowNull: false,
      comment: '验证码',
    },
    biz_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '阿里云短信业务ID',
    },
    type: {
      type: DataTypes.ENUM('login', 'register', 'reset_password'),
      allowNull: false,
      defaultValue: 'login',
      comment: '验证码类型',
    },
    status: {
      type: DataTypes.ENUM('pending', 'used', 'expired'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '状态：待使用、已使用、已过期',
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '过期时间',
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: '请求IP地址',
    },
  },
  {
    tableName: 'sms_codes',
    indexes: [
      {
        fields: ['phone'],
      },
      {
        fields: ['phone', 'code'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['expires_at'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

module.exports = SmsCode;
