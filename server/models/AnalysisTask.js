/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const AnalysisTask = sequelize.define(
  'AnalysisTask',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    task_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
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
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true, // 允许为null，支持匿名创建
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // 用户删除后设置为null
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    ai_model_version: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    processing_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '处理耗时（毫秒）',
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    retry_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'analysis_tasks',
    indexes: [
      {
        unique: true,
        fields: ['task_id'],
      },
      {
        fields: ['study_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['status', 'created_at'],
      },
      {
        name: 'idx_analysis_task_study_status',
        fields: ['study_id', 'status'],
      },
    ],
  },
);

// Hook：创建任务前自动生成task_id
AnalysisTask.beforeCreate(async (task) => {
  if (!task.task_id) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    task.task_id = `TASK${timestamp}${random}`;
  }
});

module.exports = AnalysisTask;
