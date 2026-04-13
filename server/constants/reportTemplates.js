/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 报告模板配置
 * 支持按医院ID匹配自定义模板
 */
const DEFAULT_TEMPLATE = {
  id: 'default',
  name: '标准检测报告',
  hospital_name: '宫颈检测AI辅助诊断中心',
  logo_path: null,
  header: '宫颈细胞学AI辅助诊断报告',
  footer: '本报告由AI辅助生成，仅供临床参考，最终诊断以临床医师判断为准。',
  sections: ['patient_info', 'study_info', 'analysis_result', 'images', 'recommendations'],
  version: '1.0',
};

// 按 hospital_id 扩展模板
const HOSPITAL_TEMPLATES = {
  'hospital_jzzxyy': {
    ...DEFAULT_TEMPLATE,
    id: 'jzzxyy',
    name: '荆州市中心医院检测报告',
    hospital_name: '荆州市中心医院',
    logo_path: '/icons/hospitals/jzzxyy.png',
  },
  // 其他医院可在此扩展...
};

/**
 * 获取报告模板
 * @param {string|null} hospitalId - 医院ID
 * @param {string|null} templateId - 指定模板ID
 * @returns {object} 模板配置
 */
function getTemplate(hospitalId, templateId) {
  if (templateId && HOSPITAL_TEMPLATES[templateId]) return HOSPITAL_TEMPLATES[templateId];
  if (hospitalId && HOSPITAL_TEMPLATES[hospitalId]) return HOSPITAL_TEMPLATES[hospitalId];
  return DEFAULT_TEMPLATE;
}

module.exports = { DEFAULT_TEMPLATE, HOSPITAL_TEMPLATES, getTemplate };
