/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const qwenService = require('../services/qwenService');
const { Study, AnalysisTask, AnalysisResult, Patient } = require('../models');

const router = express.Router();

/**
 * 构建系统提示词 + 分析结果上下文
 * @param {Object} analysisResult - 分析结果数据
 * @param {Object} studyInfo - 病例信息
 * @returns {string} 系统提示词
 */
function buildSystemPrompt(analysisResult, studyInfo) {
  const parts = [
    '# 角色定义',
    '你是 CervixDetectAI 平台的专业医疗 AI 助手，专注于宫颈癌筛查与辅助诊断领域。',
    '你具备以下专业能力：',
    '- 宫颈细胞病理学（TBS 分类体系：NILM、ASC-US、ASC-H、LSIL、HSIL、SCC 等）',
    '- HPV 感染与宫颈癌前病变的关联分析',
    '- 生物标志物解读（HPV 分型、p16/Ki67 双染、免疫组化指标）',
    '- 阴道镜检查结果分析（醋酸白试验、碘试验、转化区评估）',
    '- 宫颈癌筛查指南（ASCCP/WHO/中国 CSCCP 等权威指南）',
    '- 风险分层与随访管理建议',
    '',
    '# 核心推理机制',
    '在生成回答前，必须执行以下深度思维链（CoT）过程，确保诊断逻辑的严密性：',
    '1. **逻辑依赖分析**：识别输入数据中各指标间的因果与制约关系（如 TBS 分类结果对后续生物标志物解读的逻辑约束），拒绝孤立看待单一指标。',
    '2. **溯因推理应用**：基于观察到的异常表现（如特定的细胞形态或染色模式），反向推导最可能的病理生理机制，并列举支持该推导的关键证据。',
    '3. **动态风险评估**：结合患者历史数据与当前多模态检测结果，进行多维度的风险量化计算，而非简单的定性描述。',
    '4. **适应性调整策略**：根据证据的充分性与一致性，动态调整结论的置信度；若发现数据冲突，主动启动鉴别诊断流程以排除干扰因素。',
    '',
    '# 交互准则',
    '1. 你正在基于下方提供的 AI 分析结果与医生/用户交流，帮助解读分析报告中的各项指标。',
    '2. 回答应专业、准确、有条理，使用医学术语的同时提供通俗解释。',
    '3. 引用相关医学指南或文献来支持你的分析（如 ASCCP 2019 指南、WHO 分类标准等）。',
    '4. 对于不确定的结论，明确说明置信区间和可能的鉴别诊断。',
    '5. 主动关联分析结果中各指标之间的关系（如诊断分类与生物标志物的一致性）。',
    '6. 在适当时提供下一步检查或随访建议。',
    '',
    '# 医学伦理边界',
    '⚠️ 重要声明：',
    '- 你是辅助诊断工具，所有输出仅供参考，最终临床决策必须由执业医师做出。',
    '- 不直接给出治疗方案或处方建议，但可以提供指南推荐的管理路径供医生参考。',
    '- 对于高危或紧急情况，应建议尽快转诊至上级医院或专科门诊。',
    '',
    '# 回答格式',
    '- 结构化回答：使用编号列表和小标题组织内容。',
    '- 对于复杂问题，先给出简明结论，再展开详细分析（需体现上述推理过程的关键节点）。',
    '- 如涉及风险评估，使用低/中/高风险分层并详细说明推导依据。',
    '',
    '=== 当前病例分析结果 ===',
  ];

  if (studyInfo) {
    parts.push(`患者: ${studyInfo.patientName || '未知'}`);
    parts.push(`检查日期: ${studyInfo.studyDate || '未知'}`);
    parts.push(`检查方式: ${studyInfo.modality || '未知'}`);
  }

  if (analysisResult) {
    parts.push(`诊断结论: ${analysisResult.diagnosis || '未知'}`);
    parts.push(`置信度: ${analysisResult.confidence || '未知'}`);

    if (analysisResult.risk_level) {
      parts.push(`风险等级: ${analysisResult.risk_level}`);
    }

    if (analysisResult.biomarkers) {
      const bio = analysisResult.biomarkers;
      parts.push(
        `生物标志物: HPV=${bio.HPV || '未检测'}, p16=${bio.p16 || '未检测'}, Ki67=${bio.Ki67 || '未检测'}`,
      );
    }

    if (analysisResult.recommendations?.length) {
      parts.push(`建议: ${analysisResult.recommendations.join('; ')}`);
    }

    if (analysisResult.detailed_report) {
      parts.push(`详细报告: ${analysisResult.detailed_report}`);
    }
  }

  return parts.join('\n');
}

/**
 * POST /api/chat
 * AI 追问对话（SSE 流式响应）
 *
 * Body: { studyId: number, message: string, history: [{role, content}] }
 */
router.post('/', optionalAuth, async (req, res) => {
  const startTime = Date.now();
  const { studyId, message, history = [], enableThinking = true } = req.body;

  console.log(`\n💬 ===== Chat 请求 =====`);
  console.log(`   studyId=${studyId}, enableThinking=${enableThinking}`);
  console.log(`   message="${message?.slice(0, 80)}${message?.length > 80 ? '...' : ''}"`);
  console.log(`   history length=${history.length}`);

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: '消息内容不能为空',
    });
  }

  try {
    // 加载分析结果作为上下文
    let systemPrompt =
      '你是CervixDetectAI的医疗AI助手，专注于宫颈癌筛查辅助诊断。请用专业但易于理解的方式回答。';

    if (studyId) {
      const dbStart = Date.now();
      const study = await Study.findByPk(studyId, {
        include: [{ model: Patient, as: 'patient', attributes: ['name', 'patient_id'] }],
      });

      if (study) {
        const latestTask = await AnalysisTask.findOne({
          where: { study_id: study.id, status: 'SUCCESS' },
          include: [{ model: AnalysisResult, as: 'result' }],
          order: [['created_at', 'DESC']],
        });

        const studyInfo = {
          patientName: study.patient?.name,
          studyDate: study.study_date,
          modality: study.study_type,
        };

        systemPrompt = buildSystemPrompt(
          latestTask?.result?.dataValues || latestTask?.result,
          studyInfo,
        );
        console.log(
          `   📋 DB 查询完成 (${Date.now() - dbStart}ms), 提示词长度: ${systemPrompt.length}`,
        );
      } else {
        console.log(`   ⚠️ 未找到病例 ${studyId} (${Date.now() - dbStart}ms)`);
      }
    }

    // 构建 messages 数组
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-20),
      { role: 'user', content: message.trim() },
    ];

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // 调用 Qwen 流式接口
    const apiStart = Date.now();
    const stream = await qwenService.chatStream(messages, { enableThinking });
    console.log(`   🚀 Qwen 流已连接 (${Date.now() - apiStart}ms), 开始接收...`);

    let buffer = '';
    let chunkCount = 0;
    let reasoningChars = 0;
    let contentChars = 0;

    stream.on('data', (chunk) => {
      buffer += chunk.toString();

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed === 'data: [DONE]') {
          res.write('data: [DONE]\n\n');
          continue;
        }

        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta;
            if (!delta) continue;

            chunkCount++;

            // 深度思考模型：reasoning_content 为思考过程，content 为正式回复
            if (delta.reasoning_content) {
              reasoningChars += delta.reasoning_content.length;
              res.write(
                `data: ${JSON.stringify({ type: 'reasoning', content: delta.reasoning_content })}\n\n`,
              );
            }

            if (delta.content) {
              contentChars += delta.content.length;
              res.write(`data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`);
            }
          } catch {
            // 忽略不完整的 JSON 片段
          }
        }
      }
    });

    stream.on('end', () => {
      if (buffer.trim() === 'data: [DONE]') {
        res.write('data: [DONE]\n\n');
      }
      res.end();

      const totalTime = Date.now() - startTime;
      console.log(
        `   ✅ Chat 完成: ${chunkCount} chunks, 思考 ${reasoningChars} 字, 正文 ${contentChars} 字, 总耗时 ${totalTime}ms`,
      );
      console.log(`💬 ===== Chat 结束 =====\n`);
    });

    stream.on('error', (error) => {
      console.error(`   ❌ 流错误: ${error.message}`);
      res.write(
        `data: ${JSON.stringify({ type: 'error', content: '对话生成失败，请稍后重试' })}\n\n`,
      );
      res.write('data: [DONE]\n\n');
      res.end();
    });

    req.on('close', () => {
      stream.destroy();
      console.log(`   🔌 客户端断开连接`);
    });
  } catch (error) {
    console.error(`   ❌ Chat API 异常: ${error.message}`);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: '对话服务暂不可用，请稍后重试',
      });
    }

    res.write(`data: ${JSON.stringify({ type: 'error', content: '对话服务异常' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

module.exports = router;
