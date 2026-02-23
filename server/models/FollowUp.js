/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const FollowUp = sequelize.define(
  'FollowUp',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    follow_up_id: {
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
    study_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'studies',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
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
    assigned_doctor_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    planned_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    recommended_interval_months: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 24,
      },
    },
    risk_level_snapshot: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: true,
    },
    ai_flagged_high_attention: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    doctor_marked_high_attention: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'overdue', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_reminded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'follow_ups',
    indexes: [
      {
        unique: true,
        fields: ['follow_up_id'],
      },
      {
        fields: ['patient_id', 'status'],
      },
      {
        fields: ['assigned_doctor_id', 'status'],
      },
      {
        fields: ['planned_date', 'status'],
      },
      {
        fields: ['created_at'],
      },
    ],
  },
);

FollowUp.beforeValidate(async (followUp) => {
  if (followUp.follow_up_id) {
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `F${dateStr}`;
  const count = await FollowUp.count({
    where: {
      follow_up_id: {
        [Op.like]: `${prefix}%`,
      },
    },
  });
  const sequence = String(count + 1).padStart(6, '0');
  followUp.follow_up_id = `${prefix}${sequence}`;
});

module.exports = FollowUp;
