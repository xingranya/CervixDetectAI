/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');
const bcrypt = require('bcrypt');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    real_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'doctor', 'user'),
      allowNull: false,
      defaultValue: 'user',
    },
    status: {
      type: DataTypes.ENUM('active', 'disabled'),
      allowNull: false,
      defaultValue: 'active',
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_login_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    subscription_type: {
      type: DataTypes.ENUM('none', 'monthly', 'yearly', 'package'),
      defaultValue: 'none',
    },
    subscription_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    remaining_credits: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: 'users',
    indexes: [
      {
        unique: true,
        fields: ['username'],
      },
      {
        unique: true,
        fields: ['email'],
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

// 实例方法：验证密码
User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password_hash);
};

// 实例方法：生成密码哈希
User.prototype.setPassword = async function (password) {
  this.password_hash = await bcrypt.hash(password, 10);
};

// Hook：创建用户前自动生成用户名（如果未提供）
User.beforeCreate(async (user) => {
  if (!user.username) {
    user.username = `user_${Date.now()}`;
  }
});

// Hook：创建或更新用户前加密密码
User.beforeSave(async (user) => {
  // 如果password字段存在（用于注册或修改密码），则加密
  if (user._changed && user._changed.has('password_hash') && !user.password_hash.startsWith('$2')) {
    user.password_hash = await bcrypt.hash(user.password_hash, 10);
  }
});

module.exports = User;
