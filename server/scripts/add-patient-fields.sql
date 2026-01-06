-- =====================================================
-- 患者表新增字段迁移脚本
-- 添加 sexual_history, medical_card_no 等新字段
-- 兼容 MySQL 5.7+
-- 创建日期: 2026-01-07
-- =====================================================

-- 使用存储过程安全添加字段

DELIMITER //

DROP PROCEDURE IF EXISTS add_patient_columns//

CREATE PROCEDURE add_patient_columns()
BEGIN
    -- 添加 sexual_history 字段
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'patients' 
        AND COLUMN_NAME = 'sexual_history'
    ) THEN
        ALTER TABLE patients ADD COLUMN sexual_history ENUM('none', 'regular', 'irregular', 'multiple_partners', 'early_sexual_activity', 'other') DEFAULT 'none' COMMENT '性生活史';
    END IF;

    -- 添加 medical_card_no 字段
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'patients' 
        AND COLUMN_NAME = 'medical_card_no'
    ) THEN
        ALTER TABLE patients ADD COLUMN medical_card_no VARCHAR(50) NULL COMMENT '医保卡号';
    END IF;

    -- 添加 emergency_relation 字段
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'patients' 
        AND COLUMN_NAME = 'emergency_relation'
    ) THEN
        ALTER TABLE patients ADD COLUMN emergency_relation VARCHAR(50) NULL COMMENT '紧急联系人关系';
    END IF;

    -- 添加 allergy_history 字段
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'patients' 
        AND COLUMN_NAME = 'allergy_history'
    ) THEN
        ALTER TABLE patients ADD COLUMN allergy_history TEXT NULL COMMENT '过敏史';
    END IF;

    -- 添加 family_history 字段
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'patients' 
        AND COLUMN_NAME = 'family_history'
    ) THEN
        ALTER TABLE patients ADD COLUMN family_history TEXT NULL COMMENT '家族病史';
    END IF;

    -- 添加 notes 字段
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'patients' 
        AND COLUMN_NAME = 'notes'
    ) THEN
        ALTER TABLE patients ADD COLUMN notes TEXT NULL COMMENT '备注';
    END IF;
END//

DELIMITER ;

-- 执行存储过程
CALL add_patient_columns();

-- 清理存储过程
DROP PROCEDURE IF EXISTS add_patient_columns;

-- 迁移旧的 allergies 数据（如果字段存在）
-- UPDATE patients SET allergy_history = allergies WHERE allergies IS NOT NULL AND allergy_history IS NULL;

-- 验证结果
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'patients' 
ORDER BY ORDINAL_POSITION;
