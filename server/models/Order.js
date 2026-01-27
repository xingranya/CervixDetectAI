/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    out_trade_no: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    trade_no: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    }, // alipay/wxpay
    name: {
      type: DataTypes.STRING(127),
      allowNull: false,
    },
    money: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    plan_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    credits: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'expired'),
      defaultValue: 'pending',
    },
    pay_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notify_data: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'orders',
    indexes: [
      {
        unique: true,
        fields: ['out_trade_no'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

module.exports = Order;
