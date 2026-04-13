/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Patient = sequelize.define(
  'Patient',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    patient_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: false,
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    sexual_history: {
      type: DataTypes.ENUM(
        'none',
        'regular',
        'irregular',
        'multiple_partners',
        'early_sexual_activity',
        'other',
      ),
      allowNull: true,
      defaultValue: 'none',
      comment: '性生活史',
    },
    id_card: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '身份证号（加密存储）',
    },
    medical_card_no: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '医保卡号',
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    emergency_contact: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    emergency_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    emergency_relation: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '紧急联系人关系',
    },
    allergy_history: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '过敏史',
    },
    medical_history: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    family_history: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '家族病史',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注',
    },
    created_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
  },
  {
    tableName: 'patients',
    indexes: [
      {
        unique: true,
        fields: ['patient_id'],
      },
      {
        fields: ['name'],
      },
      {
        fields: ['phone'],
      },
      {
        fields: ['created_by'],
      },
      {
        name: 'idx_patient_created_by_date',
        fields: ['created_by', 'created_at'],
      },
    ],
  },
);

// Hook：验证前自动生成 patient_id
Patient.beforeValidate(async (patient) => {
  if (!patient.patient_id) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    patient.patient_id = `P${timestamp}${random}`;
  }
});

module.exports = Patient;
