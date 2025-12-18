/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Study = sequelize.define(
  'Study',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    study_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    patient_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'patients',
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
    study_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    study_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '检查类型（宫颈细胞学检查、阴道镜检查等）',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '科室',
    },
    doctor_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '医生姓名',
    },
    clinical_diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '临床诊断',
    },
    symptoms: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '症状描述',
    },
    status: {
      type: DataTypes.ENUM('pending', 'uploaded', 'processing', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    downloaded: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '报告是否已下载',
    },
    downloaded_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '首次下载报告的时间',
    },
    priority: {
      type: DataTypes.ENUM('normal', 'urgent', 'emergency'),
      allowNull: false,
      defaultValue: 'normal',
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'studies',
    indexes: [
      {
        unique: true,
        fields: ['study_id'],
      },
      {
        fields: ['patient_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['patient_id', 'study_date'],
      },
      {
        fields: ['status', 'created_at'],
      },
    ],
  },
);

// Hook：创建病例前自动生成study_id
Study.beforeCreate(async (study) => {
  if (!study.study_id) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

    // 查询当天已有的记录数
    const count = await Study.count({
      where: {
        study_id: {
          [sequelize.Sequelize.Op.like]: `S${dateStr}%`,
        },
      },
    });

    const sequence = (count + 1).toString().padStart(6, '0');
    study.study_id = `S${dateStr}${sequence}`;
  }
});

module.exports = Study;
