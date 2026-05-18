/* eslint-disable @typescript-eslint/no-require-imports */

const CANONICAL_RISK_LEVELS = ['low', 'medium', 'high', 'critical'];

function clampNumber(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

function normalizeSentence(value, fallback = '') {
  const text = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
  return text || fallback;
}

function isInvalidDisplayText(value) {
  const text = String(value || '').trim();
  if (!text) return true;
  return /(无法得出结论|无法判断|无法明确|信息不足|未知|待补充|未提供|暂无数据)/i.test(
    text,
  );
}

function normalizeConfidenceValue(value, fallback = 0.5) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric > 1 && numeric <= 100) {
    return clampNumber(numeric / 100, 0, 1);
  }
  return clampNumber(numeric, 0, 1);
}

function normalizeRiskLevel(level, fallback = 'medium') {
  const normalized = String(level || '')
    .trim()
    .toLowerCase();
  return CANONICAL_RISK_LEVELS.includes(normalized) ? normalized : fallback;
}

function inferRiskLevelFromDiagnosis(diagnosis) {
  const text = String(diagnosis || '');
  if (/浸润性癌|可疑浸润|鳞状细胞癌|SCC|腺癌|原位癌|HSIL|CIN\s*3/i.test(text)) {
    return 'critical';
  }
  if (/ASC-H|LSIL|CIN\s*2|高度病变|低度病变/i.test(text)) {
    return 'high';
  }
  if (/ASC-US|AGC|炎症|感染|HPV阳性|高危型/i.test(text)) {
    return 'medium';
  }
  return 'low';
}

function normalizeBiomarkers(biomarkers = {}) {
  const safeValue = (value, fallback = '未检测') => {
    const text = normalizeSentence(value, fallback);
    return isInvalidDisplayText(text) ? fallback : text;
  };

  return {
    HPV: safeValue(biomarkers.HPV || biomarkers.hpv, '未检测'),
    p16: safeValue(biomarkers.p16, '未检测'),
    Ki67: safeValue(biomarkers.Ki67 || biomarkers.ki67, '未检测'),
  };
}

function normalizeSuspiciousAreas(areas, diagnosis) {
  if (!Array.isArray(areas) || areas.length === 0) {
    return [];
  }

  const normalized = areas
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          description: normalizeSentence(item, `可疑区域 ${index + 1}`),
          location: `区域 ${index + 1}`,
          features: ['细胞形态异常'],
        };
      }

      if (!item || typeof item !== 'object') return null;

      const features = Array.isArray(item.features)
        ? item.features
            .map((feature) => normalizeSentence(feature, ''))
            .filter(Boolean)
            .slice(0, 4)
        : [];

      const box2d = Array.isArray(item.box_2d)
        ? item.box_2d.filter((point) => Number.isFinite(Number(point))).map((point) => Number(point))
        : undefined;

      const bbox2d = Array.isArray(item.bbox_2d)
        ? item.bbox_2d.filter((point) => Number.isFinite(Number(point))).map((point) => Number(point))
        : undefined;

      return {
        description: normalizeSentence(item.description, `可疑区域 ${index + 1}`),
        location: normalizeSentence(item.location, `区域 ${index + 1}`),
        ...(box2d?.length ? { box_2d: box2d } : {}),
        ...(bbox2d?.length ? { bbox_2d: bbox2d } : {}),
        features: features.length ? features : ['细胞形态异常'],
      };
    })
    .filter(Boolean);

  return normalized.length ? normalized : [];
}

function buildRecommendationFallback(diagnosis, biomarkers) {
  const diagnosisText = String(diagnosis || '');
  const hpvValue = String(biomarkers?.HPV || '');

  if (/HSIL|CIN\s*2|CIN\s*3|癌|可疑浸润/i.test(diagnosisText)) {
    return [
      '建议尽快结合阴道镜检查及病理活检进一步明确病变范围。',
      '建议由妇科或宫颈专科医生优先复核本次图像和病理依据。',
    ];
  }

  if (/LSIL|ASC-H|ASC-US|AGC|低度病变/i.test(diagnosisText)) {
    return [
      '建议结合 HPV 分型和 TCT 复查结果进行分层管理。',
      '建议按医嘱缩短复查周期，持续观察病变演变趋势。',
    ];
  }

  if (/阳性|high risk|高危/i.test(hpvValue)) {
    return [
      '建议结合 HPV 阳性结果进一步评估宫颈上皮病变风险。',
      '建议按规范完成阴道镜或复查随访，避免延误干预时机。',
    ];
  }

  return [
    '建议结合临床症状、HPV 检测和既往筛查结果进行综合判断。',
    '建议由专科医生对本次图像进行复核，并按常规路径安排后续随访。',
  ];
}

function normalizeRecommendations(recommendations, diagnosis, biomarkers) {
  const normalized = Array.isArray(recommendations)
    ? recommendations
        .map((item) => normalizeSentence(item, ''))
        .filter((item) => item && !isInvalidDisplayText(item))
        .slice(0, 5)
    : [];

  return normalized.length ? normalized : buildRecommendationFallback(diagnosis, biomarkers);
}

function ensureMarkdownSections(report, diagnosis, areas, recommendations) {
  const text = String(report || '').trim();
  if (text && /(^|\n)\s*(#{1,6}\s|总体判断|综合诊断|临床建议)/m.test(text)) {
    return text;
  }

  const areaText = areas.length
    ? areas.map((area) => `- ${area.location}：${area.description}`).join('\n')
    : '- 当前图像中未见可独立框定的局灶性高危区域，但仍需结合整体细胞形态综合判断。';
  const recText = recommendations.length
    ? recommendations.map((item) => `- ${item}`).join('\n')
    : '- 建议结合 HPV / TCT 结果与临床症状进行综合评估。';

  return [
    '### 总体判断',
    `- 本次图像分析倾向于 ${diagnosis}，建议结合临床资料综合判读。`,
    '',
    '### 关键影像/病理依据',
    areaText,
    '',
    '### 免疫组化/生物标志物解读',
    '- 当前输出已结合图像形态对 HPV、p16、Ki67 状态进行辅助判断，具体结果应以实验室检测为准。',
    '',
    '### 综合诊断',
    `- 综合细胞学/组织学表现，当前最符合 ${diagnosis}。`,
    '',
    '### 临床建议',
    recText,
  ].join('\n');
}

function normalizeDiagnosis(result) {
  const rawDiagnosis = normalizeSentence(result?.diagnosis, '');
  const qualityAdequacy = String(result?.qualityAssessment?.adequacy || '')
    .trim()
    .toLowerCase();

  if (/无法诊断/i.test(rawDiagnosis)) {
    if (/[（(].+[)）]/.test(rawDiagnosis)) {
      return rawDiagnosis;
    }
    if (qualityAdequacy === 'unsatisfactory') {
      return '无法诊断（图像质量不足）';
    }
    if (/图像|样本|染色|遮挡|清晰度|质量/i.test(String(result?.qualityAssessment?.details || ''))) {
      return `${rawDiagnosis}（图像质量不足）`;
    }
    return `${rawDiagnosis}（原因待复核）`;
  }

  if (isInvalidDisplayText(rawDiagnosis)) {
    return '需结合人工复核的可疑病变';
  }

  return rawDiagnosis;
}

function normalizeRiskAssessment(result, diagnosis) {
  const inferredLevel = inferRiskLevelFromDiagnosis(diagnosis);
  const persistedLevel = normalizeRiskLevel(result?.risk_level || result?.riskLevel, inferredLevel);
  const modelLevel = normalizeRiskLevel(result?.riskAssessment?.level, inferredLevel);
  const hasPersistedRiskLevel = Boolean(result?.risk_level || result?.riskLevel);
  const finalLevel = hasPersistedRiskLevel ? persistedLevel : modelLevel || inferredLevel;

  const defaultScoreMap = {
    low: 2,
    medium: 3,
    high: 4,
    critical: 5,
  };

  return {
    level: finalLevel,
    score: clampNumber(result?.riskAssessment?.score, defaultScoreMap[finalLevel], 5),
    rationale: normalizeSentence(
      result?.riskAssessment?.rationale,
      `当前诊断倾向于 ${diagnosis}，风险分级建议结合病理复核结果综合判断。`,
    ),
  };
}

function normalizeQualityAssessment(result) {
  const adequacy = normalizeSentence(result?.qualityAssessment?.adequacy, 'Satisfactory');
  const normalizedAdequacy = /unsatisfactory/i.test(adequacy)
    ? 'Unsatisfactory'
    : /limited/i.test(adequacy)
      ? 'Limited'
      : 'Satisfactory';

  return {
    score: clampNumber(result?.qualityAssessment?.score, 2, 5),
    clarity: normalizeSentence(result?.qualityAssessment?.clarity, 'Medium'),
    adequacy: normalizedAdequacy,
    details: normalizeSentence(
      result?.qualityAssessment?.details,
      '图像可用于辅助分析，建议结合人工复核确认关键病理特征。',
    ),
  };
}

function normalizeAnalysisResult(result = {}) {
  const diagnosis = normalizeDiagnosis(result);
  const qualityAssessment = normalizeQualityAssessment(result);
  const biomarkers = normalizeBiomarkers(result.biomarkers);
  const suspiciousAreas = normalizeSuspiciousAreas(result.suspiciousAreas, diagnosis);
  const recommendations = normalizeRecommendations(result.recommendations, diagnosis, biomarkers);
  const riskAssessment = normalizeRiskAssessment(result, diagnosis);

  return {
    diagnosis,
    confidence: normalizeConfidenceValue(result.confidence, 0.5),
    riskLevel: riskAssessment.level,
    qualityAssessment,
    riskAssessment,
    suspiciousAreas,
    biomarkers,
    recommendations,
    detailedReport: ensureMarkdownSections(
      result.detailedReport,
      diagnosis,
      suspiciousAreas,
      recommendations,
    ),
  };
}

function normalizePersistedAnalysisResult(result = {}) {
  const normalized = normalizeAnalysisResult({
    ...result,
    suspiciousAreas: result.suspiciousAreas || result.suspicious_areas,
    detailedReport: result.detailedReport || result.detailed_report,
  });

  return {
    diagnosis: normalized.diagnosis,
    confidence: normalized.confidence,
    risk_level: normalized.riskLevel,
    riskLevel: normalized.riskLevel,
    qualityAssessment: normalized.qualityAssessment,
    riskAssessment: normalized.riskAssessment,
    suspicious_areas: normalized.suspiciousAreas,
    suspiciousAreas: normalized.suspiciousAreas,
    biomarkers: normalized.biomarkers,
    recommendations: normalized.recommendations,
    detailed_report: normalized.detailedReport,
    detailedReport: normalized.detailedReport,
  };
}

function buildRiskPresentation(level = 'medium') {
  const normalized = normalizeRiskLevel(level, 'medium');
  const textMap = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '极高风险',
  };
  const colorMap = {
    low: 'success',
    medium: 'warning',
    high: 'negative',
    critical: 'negative',
  };

  return {
    level: normalized,
    label: textMap[normalized],
    color: colorMap[normalized],
  };
}

module.exports = {
  CANONICAL_RISK_LEVELS,
  normalizeConfidenceValue,
  normalizeRiskLevel,
  inferRiskLevelFromDiagnosis,
  normalizeAnalysisResult,
  normalizePersistedAnalysisResult,
  buildRiskPresentation,
};
