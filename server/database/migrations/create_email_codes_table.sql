-- =====================================================
-- 邮箱验证码数据表创建脚本
-- =====================================================
-- 用途：存储邮箱验证码记录
-- 创建时间：2026-02-05
-- =====================================================

-- 创建 email_codes 表
CREATE TABLE IF NOT EXISTS `email_codes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  `email` VARCHAR(100) NOT NULL COMMENT '邮箱地址',
  `code` VARCHAR(6) NOT NULL COMMENT '6位验证码',
  `biz_id` VARCHAR(100) NULL COMMENT '腾讯云返回的RequestId',
  `type` ENUM('register', 'reset_password') NOT NULL DEFAULT 'register' COMMENT '验证码类型',
  `status` ENUM('pending', 'used', 'expired') NOT NULL DEFAULT 'pending' COMMENT '验证码状态',
  `expires_at` DATETIME NOT NULL COMMENT '过期时间（5分钟后）',
  `ip_address` VARCHAR(45) NULL COMMENT '请求IP地址（支持IPv6）',
  `user_agent` TEXT NULL COMMENT '用户代理信息',
  `created_at` DATETIME NOT NULL COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL COMMENT '更新时间',

  -- 索引
  INDEX `idx_email` (`email`),
  INDEX `idx_email_code` (`email`, `code`),
  INDEX `idx_status` (`status`),
  INDEX `idx_expires_at` (`expires_at`),
  INDEX `idx_type` (`type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邮箱验证码表';

-- =====================================================
-- 说明
-- =====================================================
--
-- 1. 表结构说明：
--    - id: 自增主键
--    - email: 收件人邮箱
--    - code: 6位数字验证码
--    - biz_id: 腾讯云SES返回的RequestId，用于追踪
--    - type: 验证码类型（register=注册，reset_password=重置密码）
--    - status: 验证码状态（pending=待使用，used=已使用，expired=已过期）
--    - expires_at: 过期时间（创建时自动设置为5分钟后）
--    - ip_address: 请求来源IP（用于安全审计）
--    - user_agent: 浏览器用户代理（用于安全审计）
--
-- 2. 索引说明：
--    - idx_email: 按邮箱查询（检查是否频繁发送）
--    - idx_email_code: 验证码验证查询（邮箱+验证码）
--    - idx_status: 按状态过滤（查询待使用的验证码）
--    - idx_expires_at: 过期时间查询（定时清理过期数据）
--    - idx_type: 按类型查询
--    - idx_created_at: 按创建时间排序
--
-- 3. 使用示例：
--
--    查询有效验证码：
--    SELECT * FROM email_codes
--    WHERE email = 'test@example.com'
--      AND code = '123456'
--      AND type = 'register'
--      AND status = 'pending'
--      AND expires_at > NOW()
--    ORDER BY created_at DESC
--    LIMIT 1;
--
--    统计今日发送次数：
--    SELECT COUNT(*) FROM email_codes
--    WHERE email = 'test@example.com'
--      AND created_at >= CURDATE();
--
--    清理过期记录（建议定时任务）：
--    DELETE FROM email_codes
--    WHERE expires_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
--
-- 4. 数据保留策略：
--    - 建议每天清理一次过期数据
--    - 保留24小时内的记录用于审计
--    - 超过24小时的记录可以删除
--
-- =====================================================
