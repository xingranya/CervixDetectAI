/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM('followup_due', 'followup_overdue', 'followup_high_attention', 'system'),
      allowNull: false,
      defaultValue: 'system',
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    related_type: {
      type: DataTypes.ENUM('followup', 'patient', 'study'),
      allowNull: true,
    },
    related_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'notifications',
    indexes: [
      {
        name: 'idx_notification_user_read_date',
        fields: ['user_id', 'is_read', 'created_at'],
      },
      {
        fields: ['type', 'created_at'],
      },
    ],
  },
);

module.exports = Notification;
