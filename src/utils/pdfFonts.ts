// 这个文件是为了解决PDF中文乱码问题
// 使用项目中已有的 SimSun.ttf 字体文件

import type jsPDF from 'jspdf';


/**
 * 完整的中文PDF支持解决方案
 */
export async function setupChineseFontAdvanced(doc: jsPDF) {
  try {
    // 为了处理中文字符，我们需要加载一个中文字体
    let hasChineseFont = false;
    
    // 尝试加载项目中的 SimSun 字体文件
    try {
      const fontUrl = '/fonts/SimSun.ttf';
      const response = await fetch(fontUrl);
      
      if (response.ok) {
        const fontBuffer = await response.arrayBuffer();
        const fontBase64 = arrayBufferToBase64(fontBuffer);
        
        // 添加字体到虚拟文件系统
        doc.addFileToVFS('SimSun.ttf', fontBase64);
        doc.addFont('SimSun.ttf', 'SimSun', 'normal');
        doc.setFont('SimSun');
        
        hasChineseFont = true;
        console.log("✅ 已加载 SimSun 中文字体");
      } else {
        console.warn("⚠️ SimSun.ttf 字体文件未找到或无法访问");
      }
    } catch (fontLoadError) {
      const errorMsg = fontLoadError instanceof Error ? fontLoadError.message : String(fontLoadError);
      console.warn("⚠️ 无法加载 SimSun 字体，错误详情:", errorMsg);
    }
    
    if (!hasChineseFont) {
      // 尝试加载 SourceHanSansSC 作为备选
      try {
        const fontUrl = '/fonts/SourceHanSansSC-Regular.ttf';
        const response = await fetch(fontUrl);
        
        if (response.ok) {
          const fontBuffer = await response.arrayBuffer();
          const fontBase64 = arrayBufferToBase64(fontBuffer);
          
          // 添加字体到虚拟文件系统
          doc.addFileToVFS('SourceHanSansSC-Regular.ttf', fontBase64);
          doc.addFont('SourceHanSansSC-Regular.ttf', 'SourceHanSansSC', 'normal');
          doc.setFont('SourceHanSansSC');
          
          hasChineseFont = true;
          console.log("✅ 已加载 SourceHanSansSC 中文字体");
        }
      } catch (fallbackError) {
        const errorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        console.warn("⚠️ 备选字体加载失败:", errorMsg);
      }
    }
    
    if (!hasChineseFont) {
      // 最后的备选方案：使用 helvetica，但会显示乱码
      doc.setFont('helvetica');
      console.warn("⚠️ 未找到中文字体，中文可能显示为乱码");
    }
    
    return hasChineseFont;
  } catch (error) {
    console.error("设置中文字体时出错:", error);
    doc.setFont('helvetica');
    return false;
  }
}

/**
 * 将ArrayBuffer转换为Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

