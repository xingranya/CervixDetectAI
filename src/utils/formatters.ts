/**
 * 格式化工具函数集合
 * 包括日期、数字、文件大小等格式化
 */
import { date } from 'quasar';

/**
 * 格式化日期
 * @param dateStr 日期字符串或 Date 对象
 * @param formatStr 格式化字符串 (默认 'YYYY-MM-DD')
 * @returns 格式化后的日期字符串
 */
export const formatDate = (dateStr: string | Date | number, formatStr = 'YYYY-MM-DD'): string => {
  if (!dateStr) return '';
  return date.formatDate(dateStr, formatStr);
};

/**
 * 格式化日期时间
 * @param dateStr 日期字符串或 Date 对象
 * @returns 'YYYY-MM-DD HH:mm:ss' 格式的字符串
 */
export const formatDateTime = (dateStr: string | Date | number): string => {
  return formatDate(dateStr, 'YYYY-MM-DD HH:mm:ss');
};

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的文件大小字符串 (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * 格式化金额
 * @param amount 金额数值
 * @param currency 货币符号 (默认 '¥')
 * @param decimals 小数位数 (默认 2)
 * @returns 格式化后的金额字符串
 */
export const formatCurrency = (amount: number, currency = '¥', decimals = 2): string => {
  return `${currency}${amount.toFixed(decimals)}`;
};

/**
 * 格式化百分比
 * @param value 数值 (0-1 或 0-100)
 * @param decimals 小数位数
 * @param isDecimal 是否为小数 (默认 true, 即 0.5 -> 50%)
 * @returns 格式化后的百分比字符串
 */
export const formatPercent = (value: number, decimals = 1, isDecimal = true): string => {
  const num = isDecimal ? value * 100 : value;
  return `${num.toFixed(decimals)}%`;
};

/**
 * 截断文本
 * @param text 文本内容
 * @param length 最大长度
 * @param suffix 后缀 (默认 '...')
 */
export const truncateText = (text: string, length: number, suffix = '...'): string => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + suffix;
};
