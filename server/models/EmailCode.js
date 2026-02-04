module.exports = (sequelize, DataTypes) => {
  const EmailCode = sequelize.define(
    'EmailCode',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          isEmail: {
            msg: '邮箱格式不正确',
          },
        },
        comment: '邮箱地址',
      },
      code: {
        type: DataTypes.STRING(6),
        allowNull: false,
        comment: '6位验证码',
      },
      biz_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '腾讯云返回的RequestId',
      },
      type: {
        type: DataTypes.ENUM('register', 'reset_password'),
        allowNull: false,
        defaultValue: 'register',
        comment: '验证码类型',
      },
      status: {
        type: DataTypes.ENUM('pending', 'used', 'expired'),
        allowNull: false,
        defaultValue: 'pending',
        comment: '验证码状态',
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '过期时间（5分钟后）',
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: '请求IP地址（支持IPv6）',
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '用户代理信息',
      },
    },
    {
      tableName: 'email_codes',
      timestamps: true,
      indexes: [
        {
          name: 'idx_email',
          fields: ['email'],
        },
        {
          name: 'idx_email_code',
          fields: ['email', 'code'],
        },
        {
          name: 'idx_status',
          fields: ['status'],
        },
        {
          name: 'idx_expires_at',
          fields: ['expires_at'],
        },
        {
          name: 'idx_type',
          fields: ['type'],
        },
        {
          name: 'idx_created_at',
          fields: ['created_at'],
        },
      ],
      hooks: {
        beforeCreate: (emailCode) => {
          // 设置5分钟后过期
          emailCode.expires_at = new Date(Date.now() + 5 * 60 * 1000);
        },
      },
    }
  );

  /**
   * 实例方法
   */
  EmailCode.prototype.markAsUsed = async function () {
    this.status = 'used';
    await this.save();
  };

  EmailCode.prototype.markAsExpired = async function () {
    this.status = 'expired';
    await this.save();
  };

  /**
   * 静态方法
   */

  // 查找有效的验证码
  EmailCode.findValidCode = async function (email, code, type) {
    return await this.findOne({
      where: {
        email,
        code,
        type,
        status: 'pending',
        expires_at: {
          [sequelize.Sequelize.Op.gt]: new Date(),
        },
      },
      order: [['created_at', 'DESC']],
    });
  };

  // 使该邮箱之前的同类验证码失效
  EmailCode.invalidatePreviousCodes = async function (email, type) {
    await this.update(
      { status: 'expired' },
      {
        where: {
          email,
          type,
          status: 'pending',
        },
      }
    );
  };

  // 清理过期的验证码（建议定时任务调用）
  EmailCode.cleanupExpiredCodes = async function () {
    const deleted = await this.destroy({
      where: {
        expires_at: {
          [sequelize.Sequelize.Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24小时前
        },
      },
    });
    console.log(`[EmailCode] 清理了 ${deleted} 条过期验证码记录`);
    return deleted;
  };

  return EmailCode;
};
