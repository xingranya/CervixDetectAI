/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 验证码相关常量配置
 * 统一管理邮箱/短信验证码的有效期、发送间隔与每日上限
 */
module.exports = {
  /** 验证码有效期（分钟） */
  CODE_EXPIRE_MINUTES: 5,
  /** 同一目标发送间隔（秒） */
  SEND_INTERVAL_SECONDS: 60,
  /** 每日同一目标最大发送次数 */
  MAX_DAILY_SEND_COUNT: 10,
};
