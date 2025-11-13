/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const StudyImage = sequelize.define(
  'StudyImage',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    study_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'studies',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    original_filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    stored_filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '存储文件名（UUID）',
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    thumbnail_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    file_format: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '文件格式（DICOM、JPEG、PNG等）',
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    series_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '序列号（DICOM系列）',
    },
    instance_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '实例号（DICOM实例）',
    },
    dicom_metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'DICOM元数据（存储重要标签）',
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    upload_status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    tableName: 'study_images',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['study_id'],
      },
      {
        fields: ['study_id', 'series_number', 'instance_number'],
      },
    ],
  }
);

module.exports = StudyImage;
