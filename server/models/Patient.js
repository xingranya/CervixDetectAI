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
    id_card: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '身份证号（加密存储）',
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
    medical_history: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    allergies: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '过敏信息',
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
    ],
  },
);

// Hook：创建患者前自动生成patient_id
Patient.beforeCreate(async (patient) => {
  if (!patient.patient_id) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    patient.patient_id = `P${timestamp}${random}`;
  }
});

module.exports = Patient;
