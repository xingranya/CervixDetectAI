/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const AnalysisResult = sequelize.define(
  'AnalysisResult',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    task_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      references: {
        model: 'analysis_tasks',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    study_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'studies',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    diagnosis: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    confidence: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      validate: {
        min: 0,
        max: 1,
      },
    },
    risk_level: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
    },
    recommendations: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: '医疗建议列表',
    },
    suspicious_areas: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '可疑区域坐标数据',
    },
    biomarkers: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '生物标志物数据（HPV、p16、Ki67等）',
    },
    detailed_report: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    heatmap_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '热力图文件路径',
    },
    annotated_image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '标注图像路径',
    },
    raw_output: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'AI模型原始输出（用于调试）',
    },
    reviewed_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    review_comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'analysis_results',
    indexes: [
      {
        unique: true,
        fields: ['task_id'],
      },
      {
        fields: ['study_id'],
      },
      {
        fields: ['reviewed_by'],
      },
      {
        fields: ['diagnosis'],
      },
      {
        fields: ['risk_level'],
      },
    ],
  }
);

module.exports = AnalysisResult;
