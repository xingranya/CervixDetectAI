/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const MedicalReport = sequelize.define(
  'MedicalReport',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    report_id: {
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
    analysis_result_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'analysis_results',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
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
    report_type: {
      type: DataTypes.ENUM('preliminary', 'final', 'supplementary'),
      allowNull: false,
    },
    report_title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'PDF文件存储路径',
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    page_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    template_version: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    generated_by: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    signed_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    signed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    signature_data: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '电子签名数据',
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_review', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'draft',
    },
    download_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    last_downloaded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'medical_reports',
    indexes: [
      {
        unique: true,
        fields: ['report_id'],
      },
      {
        fields: ['study_id'],
      },
      {
        fields: ['analysis_result_id'],
      },
      {
        fields: ['patient_id'],
      },
      {
        fields: ['generated_by'],
      },
      {
        fields: ['signed_by'],
      },
      {
        fields: ['patient_id', 'created_at'],
      },
      {
        fields: ['status', 'created_at'],
      },
    ],
  }
);

// Hook：创建报告前自动生成report_id
MedicalReport.beforeCreate(async (report) => {
  if (!report.report_id) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    
    // 查询当天已有的报告数
    const count = await MedicalReport.count({
      where: {
        report_id: {
          [sequelize.Sequelize.Op.like]: `R${dateStr}%`,
        },
      },
    });
    
    const sequence = (count + 1).toString().padStart(6, '0');
    report.report_id = `R${dateStr}${sequence}`;
  }
});

module.exports = MedicalReport;
