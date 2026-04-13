/**
 * 随访模板库
 * 根据风险等级和诊断类型预设随访方案
 */
const FOLLOWUP_TEMPLATES = [
  {
    id: 'tpl_critical_hsil',
    name: 'HSIL/浸润性癌高危随访方案',
    risk: 'critical',
    diagnosisKeywords: ['浸润性癌', 'HSIL', '高度鳞状上皮内病变'],
    interval_months: 1,
    checklist: ['阴道镜复查', 'HPV分型检测', '宫颈活检', '组织病理学检查'],
    description: '极高风险病变，需密切随访，建议每月复查',
    reminders: [7, 3, 1],
  },
  {
    id: 'tpl_high_lsil',
    name: 'LSIL/ASC-H随访方案',
    risk: 'high',
    diagnosisKeywords: ['LSIL', 'ASC-H', '低度鳞状上皮内病变'],
    interval_months: 3,
    checklist: ['HPV检测', '液基细胞学检查', '阴道镜检查'],
    description: '高风险病变，建议每3个月复查',
    reminders: [14, 7, 3],
  },
  {
    id: 'tpl_medium_ascus',
    name: 'ASC-US观察随访方案',
    risk: 'medium',
    diagnosisKeywords: ['ASC-US', '意义不明确'],
    interval_months: 6,
    checklist: ['HPV检测', '液基细胞学检查'],
    description: '中等风险，建议每6个月复查',
    reminders: [14, 7],
  },
  {
    id: 'tpl_low_nilm',
    name: 'NILM常规复查方案',
    risk: 'low',
    diagnosisKeywords: ['NILM', '正常', '未见上皮内病变'],
    interval_months: 12,
    checklist: ['常规宫颈筛查'],
    description: '低风险，建议每年常规复查',
    reminders: [30, 7],
  },
];

module.exports = { FOLLOWUP_TEMPLATES };
