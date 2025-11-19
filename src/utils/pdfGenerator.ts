/**
 * PDF 报告生成工具
 * 用于生成宫颈癌AI筛查报告
 */

/**
 * 病例数据接口
 */
interface StudyData {
  id: string | number;
  patientName: string;
  patientId: string;
  studyDate: string;
  modality: string;
  bodyPart?: string;
}

/**
 * 分析结果接口
 */
interface AnalysisResult {
  diagnosis: string;
  confidence: number;
  biomarkers?: Record<string, string | number>;
  recommendations?: string[];
  detailedReport?: string;
}

/**
 * PDF 报告数据接口
 */
export interface PDFReportData {
  study: StudyData;
  result: AnalysisResult;
}

/**
 * 生成 PDF 报告
 * @param data 报告数据
 * @returns Promise<void>
 */
export async function generatePDFReport(data: PDFReportData): Promise<void> {
  // 动态导入 PDF 生成库
  const { default: jsPDF } = await import('jspdf');
  const { setupChineseFontAdvanced } = await import('./pdfFonts');

  // 创建 PDF 文档 (A4 尺寸)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // 添加中文字体支持
  await setupChineseFontAdvanced(doc);

  // ========== 页眉 ==========
  doc.setFillColor(25, 118, 210); // 主题蓝色
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('CervixDetect AI', margin, 15);

  doc.setFontSize(12);
  doc.text('宫颈癌AI筛查报告', margin, 22);

  yPos = 40;

  // ========== 报告信息栏 ==========
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);

  const reportDate = new Date().toLocaleString('zh-CN');
  const reportId = `RPT-${data.study.id}-${Date.now().toString(36).toUpperCase()}`;

  doc.text(`报告ID: ${reportId}`, margin, yPos);
  doc.text(`生成时间: ${reportDate}`, pageWidth - margin - 60, yPos);

  yPos += 10;
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // ========== 患者信息 ==========
  doc.setFontSize(14);
  doc.setTextColor(25, 118, 210);
  doc.text('患者信息', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const patientInfo = [
    `患者姓名: ${data.study.patientName}`,
    `患者ID: ${data.study.patientId}`,
    `检查日期: ${new Date(data.study.studyDate).toLocaleDateString()}`,
    `检查ID: ${data.study.id}`,
    `检查方式: ${data.study.modality}`,
  ];

  // 如果有检查部位信息，添加到列表中
  if (data.study.bodyPart) {
    patientInfo.push(`检查部位: ${data.study.bodyPart}`);
  }

  patientInfo.forEach((info) => {
    doc.text(info, margin + 5, yPos);
    yPos += 6;
  });

  yPos += 5;

  // ========== AI 分析结果 ==========
  doc.setFontSize(14);
  doc.setTextColor(25, 118, 210);
  doc.text('AI分析结果', margin, yPos);
  yPos += 8;

  // 诊断结果框
  const diagnosisBoxY = yPos;
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin, diagnosisBoxY, pageWidth - 2 * margin, 30, 3, 3, 'F');

  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text('诊断结果:', margin + 5, diagnosisBoxY + 8);

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  // 诊断结果可能包含中文，继续使用SimSun字体
  doc.text(data.result.diagnosis || 'N/A', margin + 5, diagnosisBoxY + 18);
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text('置信度:', margin + 5, diagnosisBoxY + 25);
  doc.setTextColor(0, 150, 0);
  doc.text(
    `${Math.round((data.result.confidence || 0) * 100)}%`,
    margin + 30,
    diagnosisBoxY + 25,
  );

  yPos = diagnosisBoxY + 38;

  // ========== 生物标志物 ==========
  if (data.result.biomarkers && Object.keys(data.result.biomarkers).length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('生物标志物:', margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    Object.entries(data.result.biomarkers).forEach(([key, value]) => {
      doc.text(`  • ${key}: ${value}`, margin + 5, yPos);
      yPos += 6;
    });

    yPos += 3;
  }

  // ========== 临床建议 ==========
  if (data.result.recommendations && data.result.recommendations.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('临床建议:', margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    data.result.recommendations.forEach((rec: string, index: number) => {
      const lines = doc.splitTextToSize(rec, pageWidth - 2 * margin - 10);

      if (yPos + lines.length * 6 > pageHeight - margin - 30) {
        doc.addPage();
        yPos = margin;
      }

      doc.text(`${index + 1}. ${lines[0]}`, margin + 5, yPos);
      yPos += 6;

      for (let i = 1; i < lines.length; i++) {
        doc.text(`   ${lines[i]}`, margin + 5, yPos);
        yPos += 6;
      }
    });

    yPos += 3;
  }

  // ========== 详细报告 ==========
  if (data.result.detailedReport) {
    if (yPos + 20 > pageHeight - margin - 30) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('详细报告:', margin, yPos);
    yPos += 7;

    doc.setFontSize(9);
    const reportLines = doc.splitTextToSize(
      data.result.detailedReport,
      pageWidth - 2 * margin - 10,
    );

    reportLines.forEach((line: string) => {
      if (yPos + 6 > pageHeight - margin - 30) {
        doc.addPage();
        yPos = margin;
      }

      doc.text(line, margin + 5, yPos);
      yPos += 5;
    });
  }

  // ========== 页脚 ==========
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('CervixDetect AI - 机密医疗报告', pageWidth / 2, pageHeight - 10, {
      align: 'center',
    });
    doc.text(`第 ${pageNum} 页 共 ${totalPages} 页`, pageWidth - margin, pageHeight - 10, {
      align: 'right',
    });
  };

  // 为所有页面添加页脚
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // ========== 免责声明（最后一页）==========
  doc.addPage();
  yPos = margin;

  doc.setFontSize(12);
  doc.setTextColor(200, 0, 0);
  doc.text('免责声明', margin, yPos);
  yPos += 10;

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const disclaimer = [
    '本报告由 CervixDetect AI 人工智能辅助诊断系统生成，结果仅供参考，必须由合格的医疗',
    '专业人员进行审查。',
    '',
    '该AI系统旨在帮助筛查和检测宫颈异常,但不应取代专业医学判断。最终诊断和治疗决定',
    '应由执业医疗服务提供者基于综合临床评估做出。',
    '',
    '本系统的诊断结果不能作为单独的诊断依据，应结合临床症状、其他检查结果及医生经验',
    '进行综合判断。如对报告有任何疑问，请咨询您的医疗服务提供者。',
  ];

  disclaimer.forEach((line) => {
    doc.text(line, margin, yPos);
    yPos += 5;
  });

  addFooter(doc.getNumberOfPages(), doc.getNumberOfPages());

  // ========== 保存 PDF ==========
  const filename = `CervixDetect_Report_${data.study.patientId}_${Date.now()}.pdf`;
  doc.save(filename);
}
