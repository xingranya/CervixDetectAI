// PDF中文字体支持工具
// 使用项目中已有的字体文件

import type jsPDF from 'jspdf';

// 字体配置（按优先级顺序）
const FONT_CONFIG = [
  { path: '/fonts/SimSun.ttf', name: 'SimSun' },
  { path: '/fonts/SourceHanSansSC-Regular.ttf', name: 'SourceHanSansSC' },
] as const;

// 回退字体
const FALLBACK_FONT = 'helvetica';

/**
 * 将 ArrayBuffer 转换为 Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * 尝试加载单个字体
 * @returns 成功返回字体名称，失败返回 null
 */
async function tryLoadFont(doc: jsPDF, fontPath: string, fontName: string): Promise<string | null> {
  try {
    const response = await fetch(fontPath);
    if (!response.ok) {
      console.warn(`⚠️ 字体文件未找到: ${fontPath}`);
      return null;
    }

    const fontBuffer = await response.arrayBuffer();
    const fontBase64 = arrayBufferToBase64(fontBuffer);
    const fileName = `${fontName}.ttf`;

    doc.addFileToVFS(fileName, fontBase64);
    doc.addFont(fileName, fontName, 'normal');
    doc.setFont(fontName);

    console.log(`✅ 已加载中文字体: ${fontName}`);
    return fontName;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ 加载字体 ${fontName} 失败: ${msg}`);
    return null;
  }
}

/**
 * 设置中文字体支持（自动回退）
 * 按优先级尝试加载字体，全部失败则使用回退字体
 */
export async function setupChineseFontAdvanced(doc: jsPDF): Promise<boolean> {
  try {
    // 按优先级尝试加载字体
    for (const font of FONT_CONFIG) {
      const loaded = await tryLoadFont(doc, font.path, font.name);
      if (loaded) return true;
    }

    // 全部失败，使用回退字体
    doc.setFont(FALLBACK_FONT);
    console.warn('⚠️ 未找到中文字体，中文可能显示为乱码');
    return false;
  } catch (error) {
    console.error('设置中文字体时出错:', error);
    doc.setFont(FALLBACK_FONT);
    return false;
  }
}
