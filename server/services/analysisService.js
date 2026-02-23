/* eslint-disable @typescript-eslint/no-require-imports */
const qwenService = require('./qwenService');
const { Study, AnalysisTask, AnalysisResult, User, sequelize } = require('../models');
const { createAnalysisNotifications } = require('./notificationService');
const emailService = require('./email.service');

// 风险等级配置（关键词 -> 等级映射）
const RISK_LEVEL_CONFIG = [
  { keywords: ['浸润性癌', 'HSIL', '高度鳞状上皮内病变'], level: 'critical' },
  { keywords: ['LSIL', 'ASC-H', '低度鳞状上皮内病变'], level: 'high' },
  { keywords: ['ASC-US', '意义不明确'], level: 'medium' },
];

/**
 * 根据诊断结果判断风险等级
 * @param {string} diagnosis - 诊断结果文本
 * @returns {string} 风险等级 (critical/high/medium/low)
 */
function getRiskLevel(diagnosis) {
  for (const config of RISK_LEVEL_CONFIG) {
    if (config.keywords.some((kw) => diagnosis.includes(kw))) {
      return config.level;
    }
  }
  return 'low';
}

/**
 * 异步处理分析任务
 * @param {number} analysisTaskId - 数据库中的任务ID (AnalysisTask.id)
 * @param {string} imagePath - 图像文件路径
 * @param {number} studyId - 数据库中的病例ID (Study.id)
 */
async function processTask(analysisTaskId, imagePath, studyId) {
  try {
    console.log(`🔄 [AnalysisService] 开始处理任务 (DB ID: ${analysisTaskId})`);

    // 获取病例信息，以获取检查方式
    const study = await Study.findByPk(studyId);
    const taskRecord = await AnalysisTask.findByPk(analysisTaskId);
    const modality = study?.study_type || '巴氏染色涂片（Pap Smear）';
    console.log(`🔬 [AnalysisService] 检查方式: ${modality}`);

    // 更新状态: PROCESSING
    await AnalysisTask.update(
      { status: 'PROCESSING', progress: 10, started_at: new Date() },
      { where: { id: analysisTaskId } },
    );
    await Study.update({ status: 'processing' }, { where: { id: studyId } });

    // 图像预处理阶段
    await AnalysisTask.update({ progress: 20 }, { where: { id: analysisTaskId } });

    // 准备AI分析
    await AnalysisTask.update({ progress: 30 }, { where: { id: analysisTaskId } });

    // 启动进度模拟器（在AI分析期间逐步更新进度）
    let currentProgress = 30;
    const progressInterval = setInterval(async () => {
      if (currentProgress < 85) {
        currentProgress += 5;
        await AnalysisTask.update(
          { progress: currentProgress },
          { where: { id: analysisTaskId } },
        ).catch(() => {}); // 忽略错误
      }
    }, 3000); // 每3秒增加5%

    try {
      // 调用 Qwen 服务进行分析
      const result = await qwenService.analyzeImage(imagePath, modality);

      // 停止进度模拟器
      clearInterval(progressInterval);

      console.log(`✅ [AnalysisService] 任务完成, 诊断: ${result.diagnosis}`);

      // 更新进度到90%
      await AnalysisTask.update({ progress: 90 }, { where: { id: analysisTaskId } });

      // 根据诊断结果确定风险等级
      const riskLevel = getRiskLevel(result.diagnosis);

      // 更新进度到95%
      await AnalysisTask.update({ progress: 95 }, { where: { id: analysisTaskId } });

      // 事务保存结果并更新状态
      await sequelize.transaction(async (t) => {
        await AnalysisResult.create(
          {
            task_id: analysisTaskId,
            study_id: studyId,
            diagnosis: result.diagnosis,
            confidence: result.confidence,
            risk_level: riskLevel,
            recommendations: result.recommendations || [],
            suspicious_areas: result.suspiciousAreas || [],
            biomarkers: result.biomarkers || {},
            detailed_report: result.detailedReport,
            raw_output: result.rawResponse ? { rawResponse: result.rawResponse } : null,
          },
          { transaction: t },
        );

        await AnalysisTask.update(
          { status: 'SUCCESS', progress: 100, completed_at: new Date() },
          { where: { id: analysisTaskId }, transaction: t },
        );

        await Study.update({ status: 'completed' }, { where: { id: studyId }, transaction: t });
      });

      // 创建站内通知（不影响主流程）
      try {
        await createAnalysisNotifications({
          userId: taskRecord?.user_id || study?.user_id,
          studyId,
          studyCode: study?.study_id,
          diagnosis: result.diagnosis,
          riskLevel,
          confidence: result.confidence,
        });
      } catch (notifyError) {
        console.error('[AnalysisService] 创建站内通知失败:', notifyError.message);
      }

      // 发送报告生成完成邮件（不影响主流程）
      try {
        const receiverId = taskRecord?.user_id || study?.user_id;
        if (receiverId) {
          const receiver = await User.findByPk(receiverId, {
            attributes: ['id', 'email', 'username', 'real_name'],
          });
          if (receiver?.email) {
            const sendResult = await emailService.sendReportReadyEmail(receiver.email, {
              studyId: study?.study_id || String(studyId),
              diagnosis: result.diagnosis,
              riskLevel,
              completedAt: new Date().toLocaleString('zh-CN'),
            });
            if (!sendResult.success) {
              console.error('[AnalysisService] 报告完成邮件发送失败:', sendResult.message);
            }
          }
        }
      } catch (emailError) {
        console.error('[AnalysisService] 报告完成邮件发送异常:', emailError.message);
      }
    } catch (aiError) {
      clearInterval(progressInterval);
      throw aiError;
    }
  } catch (error) {
    console.error(`❌ [AnalysisService] 任务失败:`, error.message);
    await AnalysisTask.update(
      {
        status: 'FAILED',
        progress: 0,
        error_message: error.message,
        completed_at: new Date(),
      },
      { where: { id: analysisTaskId } },
    ).catch((e) => console.error('[AnalysisService] 状态更新失败:', e));

    await Study.update({ status: 'failed' }, { where: { id: studyId } }).catch((e) =>
      console.error('[AnalysisService] 状态更新失败:', e),
    );
  }
}

module.exports = {
  processTask,
};
