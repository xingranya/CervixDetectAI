/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const { AnalysisTask, AnalysisResult, Study, User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/analysis-tasks
 * 创建分析任务
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { study_id, model_name, model_version, priority = 'normal' } = req.body;

    // 验证必填字段
    if (!study_id) {
      return res.status(400).json({
        success: false,
        message: '病例ID为必填项',
      });
    }

    // 验证病例是否存在
    const study = await Study.findByPk(study_id);
    if (!study) {
      return res.status(404).json({
        success: false,
        message: '病例不存在',
      });
    }

    // 非管理员只能为自己的病例创建任务
    if (req.user.role !== 'admin' && study.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权为该病例创建分析任务',
      });
    }

    // 创建分析任务（task_id会在beforeCreate hook中自动生成）
    const task = await AnalysisTask.create({
      study_id,
      user_id: req.user.id,
      model_name,
      model_version,
      priority,
      status: 'pending',
      progress: 0,
    });

    const createdTask = await AnalysisTask.findByPk(task.id, {
      include: [
        {
          model: Study,
          as: 'study',
          attributes: ['id', 'study_id', 'study_date', 'study_type'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'real_name'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: '分析任务创建成功',
      data: { task: createdTask },
    });
  } catch (error) {
    console.error('创建分析任务错误:', error);
    res.status(500).json({
      success: false,
      message: '创建分析任务失败',
      error: error.message,
    });
  }
});

/**
 * GET /api/analysis-tasks
 * 获取分析任务列表
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, study_id, priority } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (study_id) where.study_id = study_id;
    if (priority) where.priority = priority;

    // 非管理员只能查看自己的任务
    if (req.user.role !== 'admin') {
      where.user_id = req.user.id;
    }

    const { count, rows } = await AnalysisTask.findAndCountAll({
      where,
      include: [
        {
          model: Study,
          as: 'study',
          attributes: ['id', 'study_id', 'study_date', 'study_type'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'real_name'],
        },
        {
          model: AnalysisResult,
          as: 'result',
          required: false,
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        tasks: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取分析任务列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分析任务列表失败',
      error: error.message,
    });
  }
});

/**
 * GET /api/analysis-tasks/:id
 * 获取分析任务详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await AnalysisTask.findByPk(req.params.id, {
      include: [
        {
          model: Study,
          as: 'study',
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'real_name'],
        },
        {
          model: AnalysisResult,
          as: 'result',
        },
      ],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '分析任务不存在',
      });
    }

    // 非管理员只能查看自己的任务
    if (req.user.role !== 'admin' && task.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权访问该分析任务',
      });
    }

    res.json({
      success: true,
      data: { task },
    });
  } catch (error) {
    console.error('获取分析任务详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分析任务详情失败',
      error: error.message,
    });
  }
});

/**
 * PUT /api/analysis-tasks/:id/status
 * 更新任务状态和进度
 */
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const task = await AnalysisTask.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '分析任务不存在',
      });
    }

    // 非管理员只能更新自己的任务
    if (req.user.role !== 'admin' && task.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权更新该任务',
      });
    }

    const { status, progress, error_message } = req.body;
    const updateData = {};

    if (status !== undefined) {
      updateData.status = status;
      if (status === 'running' && !task.started_at) {
        updateData.started_at = new Date();
      } else if (['completed', 'failed', 'cancelled'].includes(status)) {
        updateData.completed_at = new Date();
      }
    }

    if (progress !== undefined) updateData.progress = progress;
    if (error_message !== undefined) updateData.error_message = error_message;

    await task.update(updateData);

    const updatedTask = await AnalysisTask.findByPk(req.params.id, {
      include: [
        {
          model: Study,
          as: 'study',
          attributes: ['id', 'study_id', 'study_date', 'study_type'],
        },
      ],
    });

    res.json({
      success: true,
      message: '任务状态更新成功',
      data: { task: updatedTask },
    });
  } catch (error) {
    console.error('更新任务状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新任务状态失败',
      error: error.message,
    });
  }
});

/**
 * POST /api/analysis-tasks/:id/result
 * 保存分析结果
 */
router.post('/:id/result', authenticate, async (req, res) => {
  try {
    const task = await AnalysisTask.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '分析任务不存在',
      });
    }

    // 非管理员只能保存自己任务的结果
    if (req.user.role !== 'admin' && task.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权保存该任务的结果',
      });
    }

    const {
      risk_level,
      confidence_score,
      primary_diagnosis,
      recommendations,
      biomarkers,
      suspicious_areas,
      notes,
    } = req.body;

    // 验证必填字段
    if (!risk_level || confidence_score === undefined) {
      return res.status(400).json({
        success: false,
        message: '风险等级和置信度为必填项',
      });
    }

    // 检查是否已存在结果
    const existingResult = await AnalysisResult.findOne({
      where: { task_id: task.id },
    });

    if (existingResult) {
      // 更新现有结果
      await existingResult.update({
        risk_level,
        confidence_score,
        primary_diagnosis,
        recommendations,
        biomarkers,
        suspicious_areas,
        notes,
      });

      res.json({
        success: true,
        message: '分析结果更新成功',
        data: { result: existingResult },
      });
    } else {
      // 创建新结果
      const result = await AnalysisResult.create({
        task_id: task.id,
        risk_level,
        confidence_score,
        primary_diagnosis,
        recommendations,
        biomarkers,
        suspicious_areas,
        notes,
      });

      // 更新任务状态为已完成
      await task.update({
        status: 'completed',
        progress: 100,
        completed_at: new Date(),
      });

      res.status(201).json({
        success: true,
        message: '分析结果保存成功',
        data: { result },
      });
    }
  } catch (error) {
    console.error('保存分析结果错误:', error);
    res.status(500).json({
      success: false,
      message: '保存分析结果失败',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/analysis-tasks/:id
 * 删除分析任务
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await AnalysisTask.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '分析任务不存在',
      });
    }

    // 非管理员只能删除自己的任务
    if (req.user.role !== 'admin' && task.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权删除该任务',
      });
    }

    // 软删除
    await task.destroy();

    res.json({
      success: true,
      message: '任务已删除',
    });
  } catch (error) {
    console.error('删除任务错误:', error);
    res.status(500).json({
      success: false,
      message: '删除任务失败',
      error: error.message,
    });
  }
});

module.exports = router;
