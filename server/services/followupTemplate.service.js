/* eslint-disable @typescript-eslint/no-require-imports */
const { FOLLOWUP_TEMPLATES } = require('../constants/followupTemplates');

/**
 * 根据诊断文本和风险等级推荐随访模板
 * @param {string} diagnosisText - 诊断文本
 * @param {string} riskLevel - 风险等级 (low/medium/high/critical)
 * @returns {{ recommended: object, alternatives: object[] }}
 */
function recommendTemplate(diagnosisText, riskLevel) {
  const normalizedText = (diagnosisText || '').toUpperCase();
  const normalizedRisk = (riskLevel || '').toLowerCase();

  // 优先按诊断关键词精确匹配
  const keywordMatched = FOLLOWUP_TEMPLATES.filter((tpl) =>
    tpl.diagnosisKeywords.some((kw) => normalizedText.includes(kw.toUpperCase())),
  );

  if (keywordMatched.length > 0) {
    return {
      recommended: keywordMatched[0],
      alternatives: keywordMatched.slice(1),
    };
  }

  // 其次按风险等级匹配
  const riskMatched = FOLLOWUP_TEMPLATES.filter((tpl) => tpl.risk === normalizedRisk);
  if (riskMatched.length > 0) {
    // 其余模板作为备选（排除已推荐的）
    const others = FOLLOWUP_TEMPLATES.filter((tpl) => tpl.id !== riskMatched[0].id);
    return {
      recommended: riskMatched[0],
      alternatives: others,
    };
  }

  // 兜底返回中等风险模板
  const fallback = FOLLOWUP_TEMPLATES.find((tpl) => tpl.risk === 'medium') || FOLLOWUP_TEMPLATES[0];
  const fallbackAlternatives = FOLLOWUP_TEMPLATES.filter((tpl) => tpl.id !== fallback.id);
  return {
    recommended: fallback,
    alternatives: fallbackAlternatives,
  };
}

/**
 * 根据模板ID获取模板详情
 * @param {string} templateId - 模板ID
 * @returns {object|null}
 */
function getTemplateById(templateId) {
  return FOLLOWUP_TEMPLATES.find((tpl) => tpl.id === templateId) || null;
}

/**
 * 获取所有可用模板列表
 * @returns {object[]}
 */
function getAllTemplates() {
  return FOLLOWUP_TEMPLATES;
}

module.exports = { recommendTemplate, getTemplateById, getAllTemplates };
