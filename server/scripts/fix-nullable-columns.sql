-- 修复数据库表结构：允许 created_by 和 user_id 字段为 NULL
-- 用于支持匿名用户上传病例

USE cervix_detect_ai;

-- 1. 修改 patients 表的 created_by 字段
ALTER TABLE patients 
MODIFY COLUMN created_by BIGINT NULL 
COMMENT '创建用户ID，允许NULL以支持匿名创建';

-- 2. 修改 studies 表的 user_id 字段
ALTER TABLE studies 
MODIFY COLUMN user_id BIGINT NULL 
COMMENT '创建用户ID，允许NULL以支持匿名创建';

-- 3. 修改 analysis_tasks 表的 user_id 字段
ALTER TABLE analysis_tasks 
MODIFY COLUMN user_id BIGINT NULL 
COMMENT '创建用户ID，允许NULL以支持匿名创建';

-- 验证修改结果
SHOW COLUMNS FROM patients LIKE 'created_by';
SHOW COLUMNS FROM studies LIKE 'user_id';
SHOW COLUMNS FROM analysis_tasks LIKE 'user_id';

SELECT '✅ 数据库表结构修复完成！' AS status;
