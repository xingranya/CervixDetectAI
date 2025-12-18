-- 数据库迁移脚本：为报告中心添加必要字段
-- 使用方法：在 MySQL 命令行或 phpMyAdmin 中执行此脚本

USE cervix_detect_ai;

-- 1. 为 studies 表添加 downloaded 字段（如果已存在会报错，可忽略）
ALTER TABLE studies
ADD COLUMN downloaded TINYINT(1) DEFAULT 0
COMMENT '报告是否已下载（0=未下载，1=已下载）'
AFTER status;

-- 2. 为 studies 表添加 downloaded_at 字段（如果已存在会报错，可忽略）
ALTER TABLE studies
ADD COLUMN downloaded_at DATETIME DEFAULT NULL
COMMENT '首次下载报告的时间'
AFTER downloaded;

-- 3. 验证字段是否添加成功
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'cervix_detect_ai'
  AND TABLE_NAME = 'studies'
  AND COLUMN_NAME IN ('downloaded', 'downloaded_at');

-- 完成提示
SELECT '✅ 数据库迁移完成！' AS message;
