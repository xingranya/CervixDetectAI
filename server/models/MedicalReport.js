/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes, Op } = require('sequelize');
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

async function ensureReportId(report) {
  if (report.report_id) {
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `R${dateStr}`;

  // 查询当天已有的报告数，用日期前缀生成可读报告编号
  const count = await MedicalReport.count({
    where: {
      report_id: {
        [Op.like]: `${prefix}%`,
      },
    },
  });

  const sequence = String(count + 1).padStart(6, '0');
  report.report_id = `${prefix}${sequence}`;
}

// Hook：校验前自动生成 report_id，避免 allowNull 校验先于 beforeCreate 触发
MedicalReport.beforeValidate(async (report) => {
  await ensureReportId(report);
});

// Hook：创建前再次兜底，兼容显式跳过校验等调用场景
MedicalReport.beforeCreate(async (report) => {
  await ensureReportId(report);
});

module.exports = MedicalReport;
