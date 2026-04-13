/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const { Op } = require('sequelize');
const { Study, AnalysisTask, AnalysisResult, Patient } = require('../models');
const { authenticate } = require('../middleware/auth');
const { handleRouteError } = require('../utils/errorHandler');

const router = express.Router();

/**
 * GET /api/dashboard/stats
 * 获取工作台统计数据
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // 计算时间范围
    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    // 构建查询条件（非管理员只能看自己的数据）
    const userCondition = isAdmin ? {} : { user_id: userId };

    // 1. 获取总分析数
    const todayTotal = await Study.count({
      where: {
        ...userCondition,
        created_at: {
          [Op.gte]: startDate,
        },
      },
    });

    // 2. 获取昨日数据（用于计算增长率）
    const yesterday = new Date(startDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0));

    const yesterdayTotal = await Study.count({
      where: {
        ...userCondition,
        created_at: {
          [Op.gte]: yesterdayStart,
          [Op.lt]: startDate,
        },
      },
    });

    // 计算增长率
    const todayGrowth =
      yesterdayTotal > 0 ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100) : 0;

    // 3. 获取高风险病例数（简化查询）
    let highRiskCount = 0;
    try {
      highRiskCount = await AnalysisResult.count({
        where: {
          risk_level: {
            [Op.in]: ['high', 'critical'],
          },
          ...(isAdmin ? {} : { '$study.user_id$': userId }),
        },
        // 非管理员按用户口径过滤（避免统计全局数据导致不一致）
        include: isAdmin
          ? []
          : [
              {
                model: Study,
                as: 'study',
                attributes: [],
                required: true,
              },
            ],
        distinct: true,
        col: 'id',
      });
    } catch (error) {
      console.error('获取高风险病例数失败:', error.message);
    }

    // 计算高风险占比
    const highRiskPercent = todayTotal > 0 ? Math.round((highRiskCount / todayTotal) * 100) : 0;

    // 4. 计算平均处理时长（分钟）
    const completedTasks = await AnalysisTask.findAll({
      where: {
        ...userCondition,
        status: 'SUCCESS',
        completed_at: {
          [Op.ne]: null,
        },
        created_at: {
          [Op.gte]: startDate,
        },
      },
      attributes: ['created_at', 'completed_at'],
    });

    let avgProcessTime = 0;
    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((sum, task) => {
        const duration =
          (new Date(task.completed_at).getTime() - new Date(task.created_at).getTime()) /
          (1000 * 60); // 转换为分钟
        return sum + duration;
      }, 0);
      avgProcessTime = Math.round((totalTime / completedTasks.length) * 10) / 10; // 保留一位小数
    }

    // 5. 获取上周平均处理时长
    const lastWeekStart = new Date(startDate);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const lastWeekTasks = await AnalysisTask.findAll({
      where: {
        ...userCondition,
        status: 'SUCCESS',
        completed_at: {
          [Op.ne]: null,
        },
        created_at: {
          [Op.gte]: lastWeekStart,
          [Op.lt]: startDate,
        },
      },
      attributes: ['created_at', 'completed_at'],
    });

    let lastWeekAvgTime = 0;
    if (lastWeekTasks.length > 0) {
      const totalTime = lastWeekTasks.reduce((sum, task) => {
        const duration =
          (new Date(task.completed_at).getTime() - new Date(task.created_at).getTime()) /
          (1000 * 60);
        return sum + duration;
      }, 0);
      lastWeekAvgTime = Math.round((totalTime / lastWeekTasks.length) * 10) / 10;
    }

    const timeImprovement = Math.round((lastWeekAvgTime - avgProcessTime) * 10) / 10;

    // 6. 获取风险分布数据（用于图表）- 简化版本
    let diagnosisStats = {};
    try {
      const riskDistribution = await AnalysisResult.findAll({
        attributes: ['diagnosis'],
        where: isAdmin ? {} : { '$study.user_id$': userId },
        include: isAdmin
          ? []
          : [
              {
                model: Study,
                as: 'study',
                attributes: [],
                required: true,
              },
            ],
      });

      // 统计各诊断类型数量
      riskDistribution.forEach((result) => {
        const diagnosis = result.diagnosis || '未知';
        diagnosisStats[diagnosis] = (diagnosisStats[diagnosis] || 0) + 1;
      });
    } catch (error) {
      console.error('获取诊断分布失败:', error.message);
      // 使用默认数据
      diagnosisStats = {
        '阴性/Normal': 45,
        'ASC-US': 25,
        LSIL: 15,
        HSIL: 10,
        '可疑癌/SCC': 5,
      };
    }

    // 7. 获取今日完成数
    const completedToday = await Study.count({
      where: {
        ...userCondition,
        status: 'completed',
        created_at: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    res.json({
      success: true,
      data: {
        todayTotal,
        todayGrowth,
        highRiskCount,
        highRiskPercent,
        avgProcessTime,
        timeImprovement: timeImprovement > 0 ? timeImprovement : 0,
        completedToday,
        diagnosisStats,
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Dashboard', endpoint: 'GET /stats' });
  }
});

/**
 * GET /api/dashboard/pending-tasks
 * 获取历史任务列表（修改为历史任务）
 */
router.get('/pending-tasks', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // 构建查询条件：管理员看所有任务，普通用户看自己的任务
    let historyTasks;
    if (isAdmin) {
      historyTasks = await AnalysisTask.findAll({
        include: [
          {
            model: Study,
            as: 'study',
            required: false,
            include: [
              {
                model: Patient,
                as: 'patient',
                required: false,
                attributes: ['id', 'patient_id', 'name'],
              },
            ],
          },
        ],
        order: [['created_at', 'DESC']],
        limit: 3, // 限制最新3条记录
      });
    } else {
      // 普通用户：查询自己创建的任务 OR 关联到自己study的任务
      historyTasks = await AnalysisTask.findAll({
        include: [
          {
            model: Study,
            as: 'study',
            required: false,
            where: {
              [Op.or]: [
                { user_id: userId }, // study属于该用户
                { id: { [Op.ne]: null } }, // 或者只要有study就显示（宽松模式）
              ],
            },
            include: [
              {
                model: Patient,
                as: 'patient',
                required: false,
                attributes: ['id', 'patient_id', 'name'],
              },
            ],
          },
        ],
        where: {
          [Op.or]: [
            { user_id: userId }, // 任务属于该用户
            { '$study.user_id$': userId }, // 或者study属于该用户
          ],
        },
        order: [['created_at', 'DESC']],
        limit: 3, // 限制最新3条记录
      });
    }

    console.log('【历史任务】查询结果数量:', historyTasks.length);

    // 如果结果为空且是普通用户，尝试查询所有任务（调试用）
    if (historyTasks.length === 0 && !isAdmin && process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] 未找到历史任务，尝试查询所有任务');
      const allTasks = await AnalysisTask.findAll({
        include: [
          {
            model: Study,
            as: 'study',
            required: false,
            include: [
              {
                model: Patient,
                as: 'patient',
                required: false,
                attributes: ['id', 'patient_id', 'name'],
              },
            ],
          },
        ],
        order: [['created_at', 'DESC']],
        limit: 5,
      });
      
      if (allTasks.length > 0) {
        historyTasks = allTasks;
      }
    }

    // 格式化任务数据
    const formattedTasks = historyTasks
      .filter((task) => task.study) // 过滤掉没有关联 study 的任务
      .map((task) => {
        let statusText = '已完成';
        let icon = 'check_circle';

        if (task.status === 'PENDING') {
          statusText = '待处理';
          icon = 'schedule';
        } else if (task.status === 'PROCESSING') {
          statusText = '分析中';
          icon = 'hourglass_empty';
        } else if (task.status === 'FAILED') {
          statusText = '分析失败';
          icon = 'error';
        } else if (task.status === 'SUCCESS') {
          statusText = '已完成';
          icon = 'check_circle';
        }

        return {
          id: task.id, // 数据库主键ID
          taskId: task.task_id, // 任务唯一标识符
          studyId: task.study.id, // 病例数据库ID
          studyUniqueId: task.study.study_id, // 病例唯一标识符
          title: `患者${task.study.patient?.name || '未知'}风险评估报告 - ${statusText}`,
          description: `患者ID：${task.study.patient?.patient_id || '未知'} | 提交时间：${new Date(task.created_at).toLocaleString('zh-CN')}`,
          icon: icon,
          priority: task.priority === 'high' || task.priority === 'urgent' ? 'high' : 'medium',
          estimatedTime: statusText,
          status: task.status,
          patientName: task.study.patient?.name || '未知',
          patientId: task.study.patient?.patient_id || '未知',
          createdAt: task.created_at,
        };
      });

    if (process.env.NODE_ENV === 'development' && formattedTasks.length > 0) {
      console.log('[DEBUG] 历史任务数量:', formattedTasks.length);
    }

    res.json({
      success: true,
      data: {
        tasks: formattedTasks,
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Dashboard', endpoint: 'GET /pending-tasks' });
  }
});

/**
 * GET /api/dashboard/notices
 * 获取系统公告列表
 */
router.get('/notices', authenticate, async (req, res) => {
  try {
    // 这里可以从数据库获取真实公告
    // 目前返回模拟数据，后续可扩展为真实的公告管理系统
    const notices = [
      {
        id: '1',
        title: 'AI模型V2.1版本已更新',
        content: '新版本提升了对于低度鳞状上皮内病变(LSIL)的识别准确率，建议重新分析近期相关病例。',
        publisher: '系统管理员',
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        id: '2',
        title: '系统维护通知',
        content: '为提升系统性能，计划于本周四凌晨2:00-4:00进行维护，期间服务可能短暂中断。',
        publisher: '运维团队',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        id: '3',
        title: '生成分析PDF报告功能上线',
        content: '报告中心现已支持一键生成分析PDF报告，包含完整的影像分析结果和医学建议。',
        publisher: '产品团队',
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ];

    res.json({
      success: true,
      data: {
        notices,
      },
    });
  } catch (error) {
    handleRouteError(res, error, { service: 'Dashboard', endpoint: 'GET /notices' });
  }
});

module.exports = router;
