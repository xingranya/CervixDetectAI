import { RISK_CONFIG, LABEL_CONFIG } from './constants';
import type { Annotation } from './types';

// 根据置信度获取风险等级配置
export const getRiskConfig = (confidence?: number) => {
  const conf = confidence ?? 0.5;
  if (conf >= RISK_CONFIG.HIGH.threshold) return RISK_CONFIG.HIGH;
  if (conf >= RISK_CONFIG.MEDIUM_HIGH.threshold) return RISK_CONFIG.MEDIUM_HIGH;
  if (conf >= RISK_CONFIG.MEDIUM.threshold) return RISK_CONFIG.MEDIUM;
  return RISK_CONFIG.LOW;
};

// 根据置信度获取边框颜色
export const getAnnotationColor = (confidence?: number): string => getRiskConfig(confidence).color;

// 根据置信度获取填充颜色
export const getAnnotationFill = (confidence?: number): string => getRiskConfig(confidence).fill;

// 获取风险等级文字
export const getRiskLevel = (confidence?: number): string => getRiskConfig(confidence).label;

// 格式化标签文字（截断过长的标签）
export const formatLabel = (ann: Annotation): string => {
  const label = ann.label || '';
  const conf = Math.round((ann.confidence || 0) * 100);
  const displayLabel =
    label.length > LABEL_CONFIG.MAX_LENGTH
      ? label.substring(0, LABEL_CONFIG.MAX_LENGTH) + '...'
      : label;
  return `${displayLabel} ${conf}%`;
};

// 获取完整标签（用于悬停提示）
export const getFullLabel = (ann: Annotation): string => {
  const label = ann.label || '未知区域';
  const conf = Math.round((ann.confidence || 0) * 100);
  const riskLevel = getRiskLevel(ann.confidence);
  return `${label}\n置信度: ${conf}%\n风险等级: ${riskLevel}`;
};

// 计算标签宽度
export const getLabelWidth = (ann: Annotation): number => {
  const text = formatLabel(ann);
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return (
    chineseChars * LABEL_CONFIG.CHAR_WIDTH_CN +
    otherChars * LABEL_CONFIG.CHAR_WIDTH_EN +
    LABEL_CONFIG.PADDING
  );
};
