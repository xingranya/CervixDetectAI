/**
 * 数据修复脚本：将 analysis_tasks 和 studies 表中的 null user_id 更新为实际用户ID
 * 
 * 使用方法：
 * node scripts/fix-task-user-ids.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize } = require('../models');
const AnalysisTask = require('../models/AnalysisTask');
const Study = require('../models/Study');
const User = require('../models/User');

async function fixUserIds() {
  try {
    console.log('🔧 开始修复任务和病例的 user_id...\n');

    // 1. 获取一个有效用户（优先选择ID为8的用户，因为日志显示他在使用系统）
    const targetUser = await User.findOne({
      where: { id: 8 },
    });

    if (!targetUser) {
      console.error('❌ 未找到ID为8的用户，尝试查找任何有效用户...');
      const anyUser = await User.findOne();
      if (!anyUser) {
        console.error('❌ 数据库中没有任何用户！请先创建用户。');
        process.exit(1);
      }
      console.log(`✅ 找到用户: ${anyUser.username} (ID: ${anyUser.id})`);
      return anyUser;
    }

    console.log(`✅ 找到目标用户: ${targetUser.username} (ID: ${targetUser.id})\n`);

    // 2. 修复 studies 表中 user_id 为 null 的记录
    console.log('📊 修复 studies 表...');
    const nullUserStudies = await Study.findAll({
      where: { user_id: null },
    });

    console.log(`   找到 ${nullUserStudies.length} 条 user_id 为 null 的病例记录`);

    if (nullUserStudies.length > 0) {
      await Study.update(
        { user_id: targetUser.id },
        { where: { user_id: null } }
      );
      console.log(`   ✅ 已将这些病例的 user_id 更新为 ${targetUser.id}\n`);
    }

    // 3. 修复 analysis_tasks 表中 user_id 为 null 的记录
    console.log('📋 修复 analysis_tasks 表...');
    const nullUserTasks = await AnalysisTask.findAll({
      where: { user_id: null },
    });

    console.log(`   找到 ${nullUserTasks.length} 条 user_id 为 null 的任务记录`);

    if (nullUserTasks.length > 0) {
      await AnalysisTask.update(
        { user_id: targetUser.id },
        { where: { user_id: null } }
      );
      console.log(`   ✅ 已将这些任务的 user_id 更新为 ${targetUser.id}\n`);
    }

    // 4. 验证修复结果
    console.log('🔍 验证修复结果...');
    const remainingNullStudies = await Study.count({ where: { user_id: null } });
    const remainingNullTasks = await AnalysisTask.count({ where: { user_id: null } });

    console.log(`   病例表中剩余 null user_id: ${remainingNullStudies}`);
    console.log(`   任务表中剩余 null user_id: ${remainingNullTasks}\n`);

    if (remainingNullStudies === 0 && remainingNullTasks === 0) {
      console.log('✅ 所有 user_id 已成功修复！');
    } else {
      console.log('⚠️  仍有部分记录未修复，请检查数据');
    }

    console.log('\n📈 修复统计:');
    console.log(`   - 修复的病例数: ${nullUserStudies.length}`);
    console.log(`   - 修复的任务数: ${nullUserTasks.length}`);
    console.log(`   - 目标用户: ${targetUser.username} (ID: ${targetUser.id})`);

  } catch (error) {
    console.error('❌ 修复过程出错:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 执行修复
fixUserIds()
  .then(() => {
    console.log('\n✅ 修复完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 修复失败:', error);
    process.exit(1);
  });
