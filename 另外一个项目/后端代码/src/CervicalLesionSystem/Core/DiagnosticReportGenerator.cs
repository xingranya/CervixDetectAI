using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CervicalLesionSystem.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CervicalLesionSystem.Core
{
    /// <summary>
    /// 结构化辅助诊断报告生成器
    /// 负责将病变分析结果和风险评估整合为标准化诊断报告
    /// </summary>
    public class DiagnosticReportProducer
    {
        private readonly ILogger<DiagnosticReportProducer> _logger;
        private readonly ReportConfiguration _configuration;

        /// <summary>
        /// 报告生成器构造函数
        /// </summary>
        /// <param name="logger">日志记录器</param>
        /// <param name="configuration">报告配置选项</param>
        public DiagnosticReportProducer(
            ILogger<DiagnosticReportProducer> logger,
            IOptions<ReportConfiguration> configuration)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _configuration = configuration?.Value ?? throw new ArgumentNullException(nameof(configuration));
            
            _logger.LogInformation("诊断报告生成器初始化完成");
        }

        /// <summary>
        /// 生成结构化诊断报告
        /// </summary>
        /// <param name="patientInfo">患者信息</param>
        /// <param name="imageAnalysis">医学影像分析结果</param>
        /// <param name="riskEvaluation">风险评估结果</param>
        /// <returns>完整的诊断报告对象</returns>
        /// <exception cref="ArgumentNullException">当输入参数为空时抛出</exception>
        /// <exception cref="ReportGenerationException">当报告生成失败时抛出</exception>
        public DiagnosticReport GenerateStructuredReport(
            PatientInformation patientInfo,
            LesionAnalysisResult imageAnalysis,
            RiskAssessment riskEvaluation)
        {
            if (patientInfo == null)
                throw new ArgumentNullException(nameof(patientInfo), "患者信息不能为空");
            if (imageAnalysis == null)
                throw new ArgumentNullException(nameof(imageAnalysis), "影像分析结果不能为空");
            if (riskEvaluation == null)
                throw new ArgumentNullException(nameof(riskEvaluation), "风险评估结果不能为空");

            try
            {
                _logger.LogInformation("开始为患者 {PatientId} 生成诊断报告", patientInfo.PatientId);

                var report = new DiagnosticReport
                {
                    ReportId = GenerateReportId(),
                    CreationTime = DateTime.Now,
                    PatientDetails = patientInfo,
                    AnalysisFindings = imageAnalysis,
                    RiskEvaluation = riskEvaluation,
                    ReportContent = BuildReportContent(patientInfo, imageAnalysis, riskEvaluation),
                    Recommendations = GenerateClinicalRecommendations(riskEvaluation),
                    ConfidenceScore = CalculateOverallConfidence(imageAnalysis, riskEvaluation)
                };

                _logger.LogInformation("诊断报告生成成功，报告ID: {ReportId}", report.ReportId);
                return report;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "生成诊断报告时发生错误，患者ID: {PatientId}", patientInfo.PatientId);
                throw new ReportGenerationException("诊断报告生成失败", ex);
            }
        }

        /// <summary>
        /// 将诊断报告导出为指定格式
        /// </summary>
        /// <param name="report">诊断报告对象</param>
        /// <param name="format">导出格式</param>
        /// <returns>导出文件的字节数组</returns>
        public byte[] ExportReport(DiagnosticReport report, ExportFormat format)
        {
            if (report == null)
                throw new ArgumentNullException(nameof(report), "诊断报告不能为空");

            try
            {
                _logger.LogInformation("开始导出报告 {ReportId}，格式: {Format}", report.ReportId, format);

                byte[] exportedData = format switch
                {
                    ExportFormat.PlainText => ExportAsPlainText(report),
                    ExportFormat.Html => ExportAsHtml(report),
                    ExportFormat.Pdf => ExportAsPdf(report),
                    ExportFormat.Json => ExportAsJson(report),
                    _ => throw new NotSupportedException($"不支持的导出格式: {format}")
                };

                _logger.LogInformation("报告导出成功，大小: {Size} 字节", exportedData.Length);
                return exportedData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "导出诊断报告时发生错误，报告ID: {ReportId}", report.ReportId);
                throw new ReportExportException("报告导出失败", ex);
            }
        }

        /// <summary>
        /// 批量生成诊断报告
        /// </summary>
        /// <param name="analysisResults">分析结果集合</param>
        /// <returns>生成的诊断报告迭代器</returns>
        public IEnumerable<DiagnosticReport> GenerateBatchReports(
            IEnumerable<AnalysisBundle> analysisResults)
        {
            if (analysisResults == null)
                throw new ArgumentNullException(nameof(analysisResults));

            return GenerateReportsInternal(analysisResults);
        }

        /// <summary>
        /// 验证报告数据的完整性
        /// </summary>
        /// <param name="report">待验证的诊断报告</param>
        /// <returns>验证结果</returns>
        public ValidationResult ValidateReport(DiagnosticReport report)
        {
            if (report == null)
                return ValidationResult.Failure("报告对象为空");

            var validationErrors = new List<string>();

            if (string.IsNullOrWhiteSpace(report.ReportId))
                validationErrors.Add("报告ID不能为空");

            if (report.PatientDetails == null)
                validationErrors.Add("患者信息缺失");
            else
            {
                if (string.IsNullOrWhiteSpace(report.PatientDetails.PatientId))
                    validationErrors.Add("患者ID不能为空");
                if (string.IsNullOrWhiteSpace(report.PatientDetails.Name))
                    validationErrors.Add("患者姓名不能为空");
            }

            if (report.AnalysisFindings == null)
                validationErrors.Add("影像分析结果缺失");

            if (report.RiskEvaluation == null)
                validationErrors.Add("风险评估结果缺失");

            if (string.IsNullOrWhiteSpace(report.ReportContent))
                validationErrors.Add("报告内容为空");

            if (validationErrors.Any())
            {
                _logger.LogWarning("报告验证失败，报告ID: {ReportId}，错误: {Errors}",
                    report.ReportId, string.Join("; ", validationErrors));
                return ValidationResult.Failure(string.Join("; ", validationErrors));
            }

            return ValidationResult.Success();
        }

        #region 私有方法

        /// <summary>
        /// 生成唯一的报告ID
        /// </summary>
        private string GenerateReportId()
        {
            return $"REP-{DateTime.Now:yyyyMMddHHmmss}-{Guid.NewGuid():N.Substring(0, 8)}";
        }

        /// <summary>
        /// 构建报告内容
        /// </summary>
        private string BuildReportContent(
            PatientInformation patientInfo,
            LesionAnalysisResult analysis,
            RiskAssessment risk)
        {
            var contentBuilder = new StringAssembler();

            // 报告头部
            contentBuilder.AppendLine($"宫颈病变智能诊断报告");
            contentBuilder.AppendLine($"报告生成时间: {DateTime.Now:yyyy年MM月dd日 HH:mm:ss}");
            contentBuilder.AppendLine(new string('=', 50));

            // 患者信息
            contentBuilder.AppendLine("【患者基本信息】");
            contentBuilder.AppendLine($"患者ID: {patientInfo.PatientId}");
            contentBuilder.AppendLine($"姓名: {patientInfo.Name}");
            contentBuilder.AppendLine($"性别: {patientInfo.Gender}");
            contentBuilder.AppendLine($"年龄: {patientInfo.Age}");
            contentBuilder.AppendLine($"检查日期: {patientInfo.ExaminationDate:yyyy年MM月dd日}");
            contentBuilder.AppendLine();

            // 影像分析发现
            contentBuilder.AppendLine("【影像分析发现】");
            contentBuilder.AppendLine($"图像质量评分: {analysis.ImageQualityScore:F2}/10.0");
            contentBuilder.AppendLine($"病变区域数量: {analysis.LesionRegions?.Count ?? 0}");
            
            if (analysis.DetectedFeatures != null && analysis.DetectedFeatures.Any())
            {
                contentBuilder.AppendLine("检测到的特征:");
                foreach (var feature in analysis.DetectedFeatures)
                {
                    contentBuilder.AppendLine($"  - {feature.Name}: {feature.Confidence:P1}");
                }
            }
            contentBuilder.AppendLine($"分析置信度: {analysis.OverallConfidence:P1}");
            contentBuilder.AppendLine();

            // 风险评估
            contentBuilder.AppendLine("【风险评估结果】");
            contentBuilder.AppendLine($"风险等级: {risk.RiskLevel}");
            contentBuilder.AppendLine($"风险评分: {risk.RiskScore:F2}/100");
            
            if (risk.RiskFactors != null && risk.RiskFactors.Any())
            {
                contentBuilder.AppendLine("风险因素:");
                foreach (var factor in risk.RiskFactors)
                {
                    contentBuilder.AppendLine($"  - {factor.FactorName}: {factor.Score:F2}");
                }
            }
            
            contentBuilder.AppendLine($"评估时间: {risk.EvaluationTime:yyyy年MM月dd日 HH:mm:ss}");
            contentBuilder.AppendLine();

            // 系统说明
            contentBuilder.AppendLine("【系统说明】");
            contentBuilder.AppendLine("本报告由宫颈病变智能风险评估与辅助诊断系统生成，");
            contentBuilder.AppendLine("仅供临床医生参考，不能作为最终诊断依据。");
            contentBuilder.AppendLine("医生应结合临床检查和其他诊断方法进行综合判断。");

            return contentBuilder.ToString();
        }

        /// <summary>
        /// 生成临床建议
        /// </summary>
        private List<string> GenerateClinicalRecommendations(RiskAssessment risk)
        {
            var recommendations = new List<string>();

            switch (risk.RiskLevel)
            {
                case RiskLevel.Normal:
                    recommendations.Add("建议定期进行常规宫颈癌筛查");
                    recommendations.Add("保持健康生活方式，重要提示个人卫生");
                    break;
                case RiskLevel.Low:
                    recommendations.Add("建议6-12个月后复查");
                    recommendations.Add("可考虑进行HPV病毒检测");
                    recommendations.Add("重要提示观察异常症状");
                    break;
                case RiskLevel.Medium:
                    recommendations.Add("建议3-6个月后复查或进行阴道镜检查");
                    recommendations.Add("建议进行HPV分型检测");
                    recommendations.Add("必要时进行病理活检");
                    break;
                case RiskLevel.High:
                    recommendations.Add("建议立即进行阴道镜检查及病理活检");
                    recommendations.Add("建议专科医生会诊");
                    recommendations.Add("根据病理结果制定治疗方案");
                    break;
                case RiskLevel.Critical:
                    recommendations.Add("建议立即住院治疗");
                    recommendations.Add("建议多学科会诊");
                    recommendations.Add("尽快制定手术或治疗方案");
                    break;
                default:
                    recommendations.Add("请结合临床其他检查结果综合判断");
                    break;
            }

            recommendations.Add("具体诊疗方案请由专业医生根据完整临床资料确定");

            return recommendations;
        }

        /// <summary>
        /// 计算总体置信度
        /// </summary>
        private double CalculateOverallConfidence(
            LesionAnalysisResult analysis,
            RiskAssessment risk)
        {
            double analysisConfidence = analysis.OverallConfidence;
            double riskConfidence = risk.ConfidenceScore;

            // 加权计算总体置信度
            double overallConfidence = (analysisConfidence * 0.6) + (riskConfidence * 0.4);
            
            // 如果任何关键数据缺失，降低置信度
            if (analysis.LesionRegions == null || !analysis.LesionRegions.Any())
                overallConfidence *= 0.8;
            
            if (risk.RiskFactors == null || !risk.RiskFactors.Any())
                overallConfidence *= 0.9;

            return Math.Min(overallConfidence, 1.0);
        }

        /// <summary>
        /// 内部批量报告生成器
        /// </summary>
        private IEnumerable<DiagnosticReport> GenerateReportsInternal(
            IEnumerable<AnalysisBundle> analysisResults)
        {
            foreach (var bundle in analysisResults)
            {
                DiagnosticReport report = null;
                
                try
                {
                    report = GenerateStructuredReport(
                        bundle.PatientInfo,
                        bundle.AnalysisResult,
                        bundle.RiskAssessment);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "批量生成报告时处理患者 {PatientId} 失败",
                        bundle.PatientInfo?.PatientId ?? "未知");
                    // 继续处理下一个，不中断整个批量操作
                    continue;
                }

                yield return report;
            }
        }

        /// <summary>
        /// 导出为纯文本格式
        /// </summary>
        private byte[] ExportAsPlainText(DiagnosticReport report)
        {
            return Encoding.UTF8.GetBytes(report.ReportContent);
        }

        /// <summary>
        /// 导出为HTML格式
        /// </summary>
        private byte[] ExportAsHtml(DiagnosticReport report)
        {
            var htmlAssembler = new StringAssembler();
            
            htmlAssembler.AppendLine("<!DOCTYPE html>");
            htmlAssembler.AppendLine("<html lang='zh-CN'>");
            htmlAssembler.AppendLine("<head>");
            htmlAssembler.AppendLine("    <meta charset='UTF-8'>");
            htmlAssembler.AppendLine("    <title>宫颈病变诊断报告</title>");
            htmlAssembler.AppendLine("    <style>");
            htmlAssembler.AppendLine("        body { font-family: 'Microsoft YaHei', sans-serif; margin: 40px; }");
            htmlAssembler.AppendLine("        .header { text-align: center; margin-bottom: 30px; }");
            htmlAssembler.AppendLine("        .section { margin-bottom: 20px; }");
            htmlAssembler.AppendLine("        .section-title { font-weight: bold; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }");
            htmlAssembler.AppendLine("        .recommendation { color: #e74c3c; font-weight: bold; }");
            htmlAssembler.AppendLine("        .footer { margin-top: 40px; font-size: 12px; color: #7f8c8d; }");
            htmlAssembler.AppendLine("    </style>");
            htmlAssembler.AppendLine("</head>");
            htmlAssembler.AppendLine("<body>");
            
            // 将纯文本报告内容转换为HTML
            var lines = report.ReportContent.Split('\n');
            foreach (var line in lines)
            {
                if (line.StartsWith("【") && line.EndsWith("】"))
                {
                    htmlAssembler.AppendLine($"    <div class='section'>");
                    htmlAssembler.AppendLine($"        <div class='section-title'>{line}</div>");
                }
                else if (line.StartsWith("建议") || line.StartsWith("具体诊疗方案"))
                {
                    htmlAssembler.AppendLine($"        <div class='recommendation'>{line}</div>");
                }
                else if (string.IsNullOrWhiteSpace(line))
                {
                    htmlAssembler.AppendLine("        <br/>");
                }
                else
                {
                    htmlAssembler.AppendLine($"        <div>{line}</div>");
                }
            }
            
            htmlAssembler.AppendLine("    </div>");
            htmlAssembler.AppendLine("    <div class='footer'>");
            htmlAssembler.AppendLine($"        报告ID: {report.ReportId} | 生成时间: {report.CreationTime:yyyy-MM-dd HH:mm:ss}");
            htmlAssembler.AppendLine("    </div>");
            htmlAssembler.AppendLine("</body>");
            htmlAssembler.AppendLine("</html>");

            return Encoding.UTF8.GetBytes(htmlAssembler.ToString());
        }

        /// <summary>
        /// 导出为PDF格式（简化实现，实际项目中应使用PDF库）
        /// </summary>
        private byte[] ExportAsPdf(DiagnosticReport report)
        {
            // 实际项目中应集成PDF生成库如iTextSharp、QuestPDF等
            // 此处返回HTML内容作为占位，实际使用时需要替换为真正的PDF生成逻辑
            _logger.LogWarning("PDF导出功能需要集成PDF生成库，当前返回HTML格式");
            return ExportAsHtml(report);
        }

        /// <summary>
        /// 导出为JSON格式
        /// </summary>
        private byte[] ExportAsJson(DiagnosticReport report)
        {
            var jsonData = new
            {
                report.ReportId,
                report.CreationTime,
                Patient = new
                {
                    report.PatientDetails.PatientId,
                    report.PatientDetails.Name,
                    report.PatientDetails.Gender,
                    report.PatientDetails.Age
                },
                Analysis = new
                {
                    report.AnalysisFindings.ImageQualityScore,
                    LesionCount = report.AnalysisFindings.LesionRegions?.Count,
                    report.AnalysisFindings.OverallConfidence
                },
                Risk = new
                {
                    Level = report.RiskEvaluation.RiskLevel.ToString(),
                    report.RiskEvaluation.RiskScore,
                    Factors = report.RiskEvaluation.RiskFactors?.Select(f => new
                    {
                        f.FactorName,
                        f.Score
                    })
                },
                report.Recommendations,
                report.ConfidenceScore,
                ReportText = report.ReportContent
            };

            string json = System.Text.Json.JsonSerializer.Serialize(jsonData, new System.Text.Json.JsonSerializerOptions
            {
                WriteIndented = true,
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            });

            return Encoding.UTF8.GetBytes(json);
        }

        #endregion
    }

    /// <summary>
    /// 报告生成配置
    /// </summary>
    public class ReportConfiguration
    {
        public string HospitalName { get; set; } = "智能医疗诊断中心";
        public string ReportTemplatePath { get; set; } = "Templates/DiagnosticReport.html";
        public bool IncludeDetailedFindings { get; set; } = true;
        public bool IncludeRecommendations { get; set; } = true;
        public int MaxRecommendations { get; set; } = 10;
        public string DefaultLanguage { get; set; } = "zh-CN";
    }

    /// <summary>
    /// 分析结果捆绑包
    /// </summary>
    public class AnalysisBundle
    {
        public PatientInformation PatientInfo { get; set; }
        public LesionAnalysisResult AnalysisResult { get; set; }
        public RiskAssessment RiskAssessment { get; set; }
    }

    /// <summary>
    /// 导出格式枚举
    /// </summary>
    public enum ExportFormat
    {
        PlainText,
        Html,
        Pdf,
        Json
    }

    /// <summary>
    /// 验证结果
    /// </summary>
    public class ValidationResult
    {
        public bool IsValid { get; }
        public string ErrorMessage { get; }

        private ValidationResult(bool isValid, string errorMessage)
        {
            IsValid = isValid;
            ErrorMessage = errorMessage;
        }

        public static ValidationResult Success() => new ValidationResult(true, null);
        public static ValidationResult Failure(string errorMessage) => new ValidationResult(false, errorMessage);
    }

    /// <summary>
    /// 报告生成异常
    /// </summary>
    public class ReportGenerationException : Exception
    {
        public ReportGenerationException(string message) : base(message) { }
        public ReportGenerationException(string message, Exception innerException) : base(message, innerException) { }
    }

    /// <summary>
    /// 报告导出异常
    /// </summary>
    public class ReportExportException : Exception
    {
        public ReportExportException(string message) : base(message) { }
        public ReportExportException(string message, Exception innerException) : base(message, innerException) { }
    }
}