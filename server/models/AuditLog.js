/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

/**
 * 审计日志模型
 * 记录系统中的关键操作，用于安全审计和运维分析
 */
const AuditLog = sequelize.define(
  'AuditLog',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true, // 系统操作无用户
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment:
        '操作类型：LOGIN, LOGOUT, CREATE_PATIENT, UPDATE_PATIENT, DELETE_PATIENT, CREATE_STUDY, UPLOAD_IMAGE, CREATE_ANALYSIS, GENERATE_REPORT, DOWNLOAD_REPORT, SHARE_REPORT, EXPORT_DATA, IMPORT_DATA, UPDATE_SETTINGS, CREATE_FOLLOWUP, COMPLETE_FOLLOWUP, SEND_NOTIFICATION',
    },
    resource_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '资源类型：patient, study, report, followup, user, system 等',
    },
    resource_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: '关联资源ID',
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '操作详情（修改字段、旧值新值等）',
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // 日志不可修改，不需要 updated_at
    paranoid: false, // 日志不可删除，不需要软删除
    indexes: [
      { fields: ['user_id'] },
      { fields: ['action'] },
      { fields: ['resource_type'] },
      { fields: ['created_at'] },
      {
        name: 'idx_audit_user_created',
        fields: ['user_id', 'created_at'],
      },
    ],
  },
);

module.exports = AuditLog;
