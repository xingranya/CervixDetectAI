/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ReportShareLink = sequelize.define(
  'ReportShareLink',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    report_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'medical_reports',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    share_token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    max_access_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '最大访问次数，0表示无限制',
    },
    current_access_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    created_by: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'report_share_links',
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['share_token'],
      },
      {
        fields: ['report_id'],
      },
      {
        fields: ['expires_at'],
      },
    ],
  },
);

module.exports = ReportShareLink;
