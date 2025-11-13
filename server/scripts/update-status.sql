-- 更新病例表状态
-- 将 'uploaded' 状态更新为 'pending'
UPDATE studies SET status = 'pending' WHERE status = 'uploaded';

-- 检查更新结果
SELECT id, study_id, status FROM studies;
