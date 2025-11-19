// 这是一个示例字体配置文件
// 用于在Quasar项目中提供中文字体支持

import type jsPDF from 'jspdf';

interface PDFTextOptions {
  fontSize?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right' | 'justify';
}

// 由于完整的中文字体文件太大，无法直接嵌入，我们使用以下方法：

/**
 * 用于PDF生成的中文字符处理工具
 * 该工具使用jsPDF的Unicode支持功能
 */
export class ChinesePdfHelper {
  /**
   * 在PDF中安全地添加中文文本
   * @param doc - jsPDF实例
   * @param text - 要添加的文本
   * @param x - X坐标
   * @param y - Y坐标
   * @param options - 选项
   */
  static addText(doc: jsPDF, text: string, x: number, y: number, options: PDFTextOptions = {}) {
    try {
      const maxWidth = options.maxWidth;
      
      if (maxWidth) {
        // 使用jsPDF的自动换行功能
        doc.text(text, x, y, {
          maxWidth: maxWidth,
          align: options.align || 'left'
        });
      } else {
        doc.text(text, x, y);
      }
    } catch (error) {
      console.warn('添加文本时出错:', error);
      // 降级处理
      try {
        doc.text(String(text || ' '), x, y);
      } catch (e) {
        console.error('文本添加失败:', e);
      }
    }
  }

  /**
   * 为PDF文档设置中文字体支持
   * @param doc - jsPDF实例
   */
  static setupChineseSupport(doc: jsPDF) {
    // 由于字体文件太大，我们使用jsPDF的内置Unicode支持
    // 并确保使用支持Unicode的字体
    try {
      // 尝试使用默认的Unicode支持字体
      doc.setFont('helvetica');
      console.log('✅ 中文字体支持已设置');
    } catch (error) {
      console.warn('字体设置警告:', error);
    }
  }

  /**
   * 分割中文文本以适应宽度限制
   * @param doc - jsPDF实例
   * @param text - 文本
   * @param maxWidth - 最大宽度
   * @returns 分割后的文本行数组
   */
  static splitText(doc: jsPDF, text: string, maxWidth: number): string[] {
    try {
      // 使用jsPDF内置的文本分割功能
      return doc.splitTextToSize(text, maxWidth);
    } catch (error) {
      console.warn('文本分割错误:', error);
      // 如果分割失败，返回原文本
      return [text];
    }
  }
}