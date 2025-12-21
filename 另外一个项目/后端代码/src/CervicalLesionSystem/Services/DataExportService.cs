using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using OfficeOpenXml;
using iTextSharp.text;
using iTextSharp.text.pdf;
using Microsoft.Extensions.Logging;

namespace CervicalLesionSystem.Services
{
    /// <summary>
    /// 数据导出服务实现类
    /// 集成EPPlus（Excel）、iTextSharp（PDF）等库，提供风险评估结果和诊断报告的标准化导出功能
    /// </summary>
    public class InfoExportModule : IInfoExportModule
    {
        private readonly ILogger<InfoExportModule> _logger;
        private readonly ExportTemplateManager _templateManager;
        private readonly IExportRetryStrategy _retryStrategy;

        /// <summary>
        /// 构造函数
        /// </summary>
        /// <param name="logger">日志记录器</param>
        /// <param name="templateManager">导出模板管理器</param>
        /// <param name="retryStrategy">重试策略装饰器</param>
        public InfoExportModule(
            ILogger<InfoExportModule> logger,
            ExportTemplateManager templateManager,
            IExportRetryStrategy retryStrategy = null)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _templateManager = templateManager ?? throw new ArgumentNullException(nameof(templateManager));
            _retryStrategy = retryStrategy ?? new DefaultExportRetryStrategy(logger);
        }

        /// <summary>
        /// 导出风险评估结果为CSV格式
        /// </summary>
        /// <param name="assessmentRecords">风险评估记录集合</param>
        /// <param name="outputPath">输出文件路径</param>
        /// <returns>导出是否成功</returns>
        public bool ExportToCsv(IEnumerable<RiskAssessmentRecord> assessmentRecords, string outputPath)
        {
            if (assessmentRecords == null)
                throw new ArgumentNullException(nameof(assessmentRecords));
            if (string.IsNullOrWhiteSpace(outputPath))
                throw new ArgumentNullException(nameof(outputPath));

            return _retryStrategy.ExecuteWithRetry(() =>
            {
                _logger.LogInformation("开始导出CSV文件到路径: {OutputPath}", outputPath);

                var records = assessmentRecords.ToList();
                if (!records.Any())
                {
                    _logger.LogWarning("导出的风险评估记录集合为空");
                    return false;
                }

                var csvContent = GenerateCsvContent(records);
                File.WriteAllText(outputPath, csvContent, Encoding.UTF8);

                _logger.LogInformation("CSV文件导出成功，共导出 {RecordCount} 条记录", records.Count);
                return true;
            }, "CSV导出");
        }

        /// <summary>
        /// 导出风险评估结果为Excel格式
        /// </summary>
        /// <param name="assessmentRecords">风险评估记录集合</param>
        /// <param name="outputPath">输出文件路径</param>
        /// <param name="templateName">模板名称（可选）</param>
        /// <returns>导出是否成功</returns>
        public bool ExportToExcel(IEnumerable<RiskAssessmentRecord> assessmentRecords, string outputPath, string templateName = null)
        {
            if (assessmentRecords == null)
                throw new ArgumentNullException(nameof(assessmentRecords));
            if (string.IsNullOrWhiteSpace(outputPath))
                throw new ArgumentNullException(nameof(outputPath));

            return _retryStrategy.ExecuteWithRetry(() =>
            {
                _logger.LogInformation("开始导出Excel文件到路径: {OutputPath}，使用模板: {TemplateName}", 
                    outputPath, templateName ?? "默认模板");

                var records = assessmentRecords.ToList();
                if (!records.Any())
                {
                    _logger.LogWarning("导出的风险评估记录集合为空");
                    return false;
                }

                using (var excelPackage = new ExcelPackage())
                {
                    var worksheet = excelPackage.Workbook.Worksheets.Add("风险评估结果");

                    // 应用模板样式（如果提供了模板名称）
                    if (!string.IsNullOrWhiteSpace(templateName))
                    {
                        ApplyExcelTemplate(worksheet, templateName);
                    }

                    // 写入表头
                    WriteExcelHeaders(worksheet);

                    // 使用生成器方式写入数据行
                    WriteExcelDataRows(worksheet, records);

                    // 自动调整列宽
                    worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

                    // 保存文件
                    excelPackage.SaveAs(new FileInfo(outputPath));
                }

                _logger.LogInformation("Excel文件导出成功，共导出 {RecordCount} 条记录", records.Count);
                return true;
            }, "Excel导出");
        }

        /// <summary>
        /// 导出诊断报告为PDF格式
        /// </summary>
        /// <param name="diagnosisReport">诊断报告数据</param>
        /// <param name="outputPath">输出文件路径</param>
        /// <param name="templateName">模板名称（可选）</param>
        /// <returns>导出是否成功</returns>
        public bool ExportToPdf(DiagnosisReport diagnosisReport, string outputPath, string templateName = null)
        {
            if (diagnosisReport == null)
                throw new ArgumentNullException(nameof(diagnosisReport));
            if (string.IsNullOrWhiteSpace(outputPath))
                throw new ArgumentNullException(nameof(outputPath));

            return _retryStrategy.ExecuteWithRetry(() =>
            {
                _logger.LogInformation("开始导出PDF文件到路径: {OutputPath}，使用模板: {TemplateName}", 
                    outputPath, templateName ?? "默认模板");

                using (var fileStream = new FileStream(outputPath, FileMode.Create))
                {
                    var document = new Document(PageSize.A4, 50, 50, 50, 50);
                    var pdfWriter = PdfWriter.GetInstance(document, fileStream);

                    document.Open();

                    // 应用PDF模板（如果提供了模板名称）
                    if (!string.IsNullOrWhiteSpace(templateName))
                    {
                        ApplyPdfTemplate(document, templateName, diagnosisReport);
                    }
                    else
                    {
                        // 使用默认模板生成PDF内容
                        GenerateDefaultPdfContent(document, diagnosisReport);
                    }

                    document.Close();
                }

                _logger.LogInformation("PDF文件导出成功，报告ID: {ReportId}", diagnosisReport.ReportId);
                return true;
            }, "PDF导出");
        }

        /// <summary>
        /// 批量导出风险评估结果
        /// </summary>
        /// <param name="exportRequests">批量导出请求集合</param>
        /// <returns>批量导出结果</returns>
        public BatchExportResult BatchExport(IEnumerable<ExportRequest> exportRequests)
        {
            if (exportRequests == null)
                throw new ArgumentNullException(nameof(exportRequests));

            var requests = exportRequests.ToList();
            if (!requests.Any())
            {
                _logger.LogWarning("批量导出请求集合为空");
                return new BatchExportResult { SuccessCount = 0, FailedCount = 0, FailedItems = new List<FailedExportItem>() };
            }

            _logger.LogInformation("开始批量导出，共 {RequestCount} 个导出请求", requests.Count);

            var result = new BatchExportResult();
            var failedItems = new List<FailedExportItem>();

            // 使用生成器方式处理每个导出请求
            foreach (var request in GenerateExportRequests(requests))
            {
                try
                {
                    bool exportSuccess = false;

                    switch (request.Format)
                    {
                        case ExportFormat.Csv:
                            exportSuccess = ExportToCsv(request.AssessmentRecords, request.OutputPath);
                            break;
                        case ExportFormat.Excel:
                            exportSuccess = ExportToExcel(request.AssessmentRecords, request.OutputPath, request.TemplateName);
                            break;
                        case ExportFormat.Pdf:
                            if (request.DiagnosisReport != null)
                            {
                                exportSuccess = ExportToPdf(request.DiagnosisReport, request.OutputPath, request.TemplateName);
                            }
                            else
                            {
                                throw new InvalidOperationException("PDF导出需要诊断报告数据");
                            }
                            break;
                        default:
                            throw new NotSupportedException($"不支持的导出格式: {request.Format}");
                    }

                    if (exportSuccess)
                    {
                        result.SuccessCount++;
                    }
                    else
                    {
                        failedItems.Add(new FailedExportItem
                        {
                            Request = request,
                            ErrorMessage = "导出操作返回失败"
                        });
                        result.FailedCount++;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "批量导出单个请求失败，输出路径: {OutputPath}", request.OutputPath);
                    failedItems.Add(new FailedExportItem
                    {
                        Request = request,
                        ErrorMessage = ex.Message
                    });
                    result.FailedCount++;
                }
            }

            result.FailedItems = failedItems;
            _logger.LogInformation("批量导出完成，成功: {SuccessCount}, 失败: {FailedCount}", 
                result.SuccessCount, result.FailedCount);

            return result;
        }

        /// <summary>
        /// 生成CSV文件内容
        /// </summary>
        /// <param name="records">风险评估记录集合</param>
        /// <returns>CSV格式的字符串</returns>
        private string GenerateCsvContent(IEnumerable<RiskAssessmentRecord> records)
        {
            var csvAssembler = new StringAssembler();

            // 写入CSV表头
            csvAssembler.AppendLine("患者ID,检查日期,病变类型,风险等级,置信度,备注");

            // 使用生成器方式写入数据行
            foreach (var record in records)
            {
                csvAssembler.AppendLine(
                    $"{EscapeCsvField(record.PatientId)}," +
                    $"{record.ExaminationDate:yyyy-MM-dd}," +
                    $"{EscapeCsvField(record.LesionType)}," +
                    $"{EscapeCsvField(record.RiskLevel)}," +
                    $"{record.ConfidenceScore:F2}," +
                    $"{EscapeCsvField(record.Notes)}");
            }

            return csvAssembler.ToString();
        }

        /// <summary>
        /// 转义CSV字段中的特殊字符
        /// </summary>
        /// <param name="field">原始字段值</param>
        /// <returns>转义后的字段值</returns>
        private string EscapeCsvField(string field)
        {
            if (string.IsNullOrEmpty(field))
                return string.Empty;

            // 如果字段包含逗号、双引号或换行符，需要用双引号包裹并转义内部的双引号
            if (field.Contains(",") || field.Contains("\"") || field.Contains("\n") || field.Contains("\r"))
            {
                return $"\"{field.Replace("\"", "\"\"")}\"";
            }

            return field;
        }

        /// <summary>
        /// 应用Excel模板样式
        /// </summary>
        /// <param name="worksheet">Excel工作表</param>
        /// <param name="templateName">模板名称</param>
        private void ApplyExcelTemplate(ExcelWorksheet worksheet, string templateName)
        {
            try
            {
                var template = _templateManager.LoadTemplate(templateName);
                if (template != null && template.ExcelStyles != null)
                {
                    // 应用模板中的样式配置
                    foreach (var styleConfig in template.ExcelStyles)
                    {
                        // 这里根据实际模板配置应用样式
                        _logger.LogDebug("应用Excel模板样式: {StyleName}", styleConfig.StyleName);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "应用Excel模板失败，将使用默认样式");
            }
        }

        /// <summary>
        /// 写入Excel表头
        /// </summary>
        /// <param name="worksheet">Excel工作表</param>
        private void WriteExcelHeaders(ExcelWorksheet worksheet)
        {
            string[] headers = { "患者ID", "患者姓名", "检查日期", "病变类型", "风险等级", "置信度", "检查医生", "备注" };
            
            for (int i = 0; i < headers.Length; i++)
            {
                worksheet.Cells[1, i + 1].Value = headers[i];
                worksheet.Cells[1, i + 1].Style.Font.Bold = true;
                worksheet.Cells[1, i + 1].Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                worksheet.Cells[1, i + 1].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
            }
        }

        /// <summary>
        /// 使用生成器方式写入Excel数据行
        /// </summary>
        /// <param name="worksheet">Excel工作表</param>
        /// <param name="records">风险评估记录集合</param>
        private void WriteExcelDataRows(ExcelWorksheet worksheet, IEnumerable<RiskAssessmentRecord> records)
        {
            int rowIndex = 2; // 从第2行开始写入数据

            foreach (var record in records)
            {
                worksheet.Cells[rowIndex, 1].Value = record.PatientId;
                worksheet.Cells[rowIndex, 2].Value = record.PatientName;
                worksheet.Cells[rowIndex, 3].Value = record.ExaminationDate;
                worksheet.Cells[rowIndex, 4].Value = record.LesionType;
                worksheet.Cells[rowIndex, 5].Value = record.RiskLevel;
                worksheet.Cells[rowIndex, 6].Value = record.ConfidenceScore;
                worksheet.Cells[rowIndex, 7].Value = record.ExaminingPhysician;
                worksheet.Cells[rowIndex, 8].Value = record.Notes;

                // 根据风险等级设置单元格背景色
                var riskLevelCell = worksheet.Cells[rowIndex, 5];
                switch (record.RiskLevel?.ToUpper())
                {
                    case "高危":
                        riskLevelCell.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                        riskLevelCell.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.Red);
                        riskLevelCell.Style.Font.Color.SetColor(System.Drawing.Color.White);
                        break;
                    case "中危":
                        riskLevelCell.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                        riskLevelCell.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.Orange);
                        break;
                    case "低危":
                        riskLevelCell.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                        riskLevelCell.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGreen);
                        break;
                }

                rowIndex++;
            }
        }

        /// <summary>
        /// 应用PDF模板
        /// </summary>
        /// <param name="document">PDF文档对象</param>
        /// <param name="templateName">模板名称</param>
        /// <param name="diagnosisReport">诊断报告数据</param>
        private void ApplyPdfTemplate(Document document, string templateName, DiagnosisReport diagnosisReport)
        {
            try
            {
                var template = _templateManager.LoadTemplate(templateName);
                if (template != null && template.PdfTemplate != null)
                {
                    // 使用模板管理器渲染PDF内容
                    var renderedContent = _templateManager.RenderTemplate(templateName, diagnosisReport);
                    
                    // 将渲染后的内容添加到PDF文档
                    var paragraph = new Paragraph(renderedContent)
                    {
                        Alignment = Element.ALIGN_JUSTIFIED
                    };
                    document.Add(paragraph);
                }
                else
                {
                    _logger.LogWarning("未找到PDF模板或模板为空，使用默认模板");
                    GenerateDefaultPdfContent(document, diagnosisReport);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "应用PDF模板失败");
                throw;
            }
        }

        /// <summary>
        /// 生成默认PDF内容
        /// </summary>
        /// <param name="document">PDF文档对象</param>
        /// <param name="diagnosisReport">诊断报告数据</param>
        private void GenerateDefaultPdfContent(Document document, DiagnosisReport diagnosisReport)
        {
            // 添加标题
            var titleFont = FontFacility.GetFont("Arial", 16, Font.BOLD);
            var titleParagraph = new Paragraph("宫颈病变诊断报告", titleFont)
            {
                Alignment = Element.ALIGN_CENTER,
                SpacingAfter = 20f
            };
            document.Add(titleParagraph);

            // 添加报告基本信息
            var normalFont = FontFacility.GetFont("Arial", 12, Font.NORMAL);
            document.Add(new Paragraph($"报告编号: {diagnosisReport.ReportId}", normalFont));
            document.Add(new Paragraph($"患者姓名: {diagnosisReport.PatientName}", normalFont));
            document.Add(new Paragraph($"患者ID: {diagnosisReport.PatientId}", normalFont));
            document.Add(new Paragraph($"检查日期: {diagnosisReport.ExaminationDate:yyyy年MM月dd日}", normalFont));
            document.Add(new Paragraph($"检查医生: {diagnosisReport.ExaminingPhysician}", normalFont));
            
            document.Add(new Paragraph(" ")); // 空行

            // 添加诊断结果
            var resultFont = FontFacility.GetFont("Arial", 12, Font.BOLD);
            document.Add(new Paragraph("诊断结果:", resultFont));
            document.Add(new Paragraph($"病变类型: {diagnosisReport.LesionType}", normalFont));
            document.Add(new Paragraph($"风险等级: {diagnosisReport.RiskLevel}", normalFont));
            document.Add(new Paragraph($"置信度: {diagnosisReport.ConfidenceScore:P2}", normalFont));
            
            document.Add(new Paragraph(" ")); // 空行

            // 添加详细描述
            document.Add(new Paragraph("详细描述:", resultFont));
            document.Add(new Paragraph(diagnosisReport.DetailedDescription ?? "无详细描述", normalFont));
            
            document.Add(new Paragraph(" ")); // 空行

            // 添加建议
            document.Add(new Paragraph("医学建议:", resultFont));
            document.Add(new Paragraph(diagnosisReport.MedicalAdvice ?? "请根据临床情况制定后续检查或治疗方案", normalFont));
            
            document.Add(new Paragraph(" ")); // 空行
            document.Add(new Paragraph(" ")); // 空行

            // 添加签名区域
            document.Add(new Paragraph("_________________________", normalFont));
            document.Add(new Paragraph("医生签名", normalFont));
            document.Add(new Paragraph($"报告生成时间: {DateTime.Now:yyyy年MM月dd日 HH:mm:ss}", normalFont));
        }

        /// <summary>
        /// 生成器方法：迭代处理导出请求
        /// </summary>
        /// <param name="requests">导出请求集合</param>
        /// <returns>导出请求迭代器</returns>
        private IEnumerable<ExportRequest> GenerateExportRequests(IEnumerable<ExportRequest> requests)
        {
            foreach (var request in requests)
            {
                // 这里可以添加请求的预处理逻辑
                if (ValidateExportRequest(request))
                {
                    yield return request;
                }
                else
                {
                    _logger.LogWarning("跳过无效的导出请求: {OutputPath}", request.OutputPath);
                }
            }
        }

        /// <summary>
        /// 验证导出请求的有效性
        /// </summary>
        /// <param name="request">导出请求</param>
        /// <returns>是否有效</returns>
        private bool ValidateExportRequest(ExportRequest request)
        {
            if (request == null)
                return false;

            if (string.IsNullOrWhiteSpace(request.OutputPath))
                return false;

            // 根据导出格式验证必要的数据
            switch (request.Format)
            {
                case ExportFormat.Csv:
                case ExportFormat.Excel:
                    return request.AssessmentRecords != null && request.AssessmentRecords.Any();
                case ExportFormat.Pdf:
                    return request.DiagnosisReport != null;
                default:
                    return false;
            }
        }
    }

    /// <summary>
    /// 导出重试策略接口
    /// </summary>
    public interface IExportRetryStrategy
    {
        /// <summary>
        /// 使用重试策略执行导出操作
        /// </summary>
        /// <param name="exportAction">导出操作</param>
        /// <param name="operationName">操作名称（用于日志记录）</param>
        /// <returns>操作结果</returns>
        bool ExecuteWithRetry(Func<bool> exportAction, string operationName);
    }

    /// <summary>
    /// 默认导出重试策略实现（装饰器模式）
    /// </summary>
    public class DefaultExportRetryStrategy : IExportRetryStrategy
    {
        private readonly ILogger _logger;
        private const int MaxRetryCount = 3;
        private const int RetryDelayMilliseconds = 1000;

        public DefaultExportRetryStrategy(ILogger logger)
        {
            _logger = logger;
        }

        public bool ExecuteWithRetry(Func<bool> exportAction, string operationName)
        {
            int retryCount = 0;
            
            while (retryCount <= MaxRetryCount)
            {
                try
                {
                    return exportAction();
                }
                catch (Exception ex) when (retryCount < MaxRetryCount)
                {
                    retryCount++;
                    _logger.LogWarning(ex, 
                        "{OperationName} 操作失败，正在进行第 {RetryCount} 次重试...", 
                        operationName, retryCount);
                    
                    System.Threading.Thread.Sleep(RetryDelayMilliseconds);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, 
                        "{OperationName} 操作失败，已达到最大重试次数 {MaxRetryCount}", 
                        operationName, MaxRetryCount);
                    throw;
                }
            }

            return false;
        }
    }

    /// <summary>
    /// 风险评估记录类
    /// </summary>
    public class RiskAssessmentRecord
    {
        public string PatientId { get; set; }
        public string PatientName { get; set; }
        public DateTime ExaminationDate { get; set; }
        public string LesionType { get; set; }
        public string RiskLevel { get; set; }
        public double ConfidenceScore { get; set; }
        public string ExaminingPhysician { get; set; }
        public string Notes { get; set; }
    }

    /// <summary>
    /// 诊断报告类
    /// </summary>
    public class DiagnosisReport
    {
        public string ReportId { get; set; }
        public string PatientId { get; set; }
        public string PatientName { get; set; }
        public DateTime ExaminationDate { get; set; }
        public string ExaminingPhysician { get; set; }
        public string LesionType { get; set; }
        public string RiskLevel { get; set; }
        public double ConfidenceScore { get; set; }
        public string DetailedDescription { get; set; }
        public string MedicalAdvice { get; set; }
    }

    /// <summary>
    /// 导出请求类
    /// </summary>
    public class ExportRequest
    {
        public ExportFormat Format { get; set; }
        public string OutputPath { get; set; }
        public string TemplateName { get; set; }
        public IEnumerable<RiskAssessmentRecord> AssessmentRecords { get; set; }
        public DiagnosisReport DiagnosisReport { get; set; }
    }

    /// <summary>
    /// 导出格式枚举
    /// </summary>
    public enum ExportFormat
    {
        Csv,
        Excel,
        Pdf
    }

    /// <summary>
    /// 批量导出结果类
    /// </summary>
    public class BatchExportResult
    {
        public int SuccessCount { get; set; }
        public int FailedCount { get; set; }
        public IEnumerable<FailedExportItem> FailedItems { get; set; }
    }

    /// <summary>
    /// 失败的导出项类
    /// </summary>
    public class FailedExportItem
    {
        public ExportRequest Request { get; set; }
        public string ErrorMessage { get; set; }
    }
}