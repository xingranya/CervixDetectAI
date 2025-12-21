using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.IO;
using System.Diagnostics;

namespace CervicalLesionSystem.Models
{
    public class DiagnosticReport
    {
        [Key]
        public Guid report_id { get; set; } = Guid.NewGuid();

        [Required(ErrorMessage = "患者标识号是必需的")]
        [StringLength(50, ErrorMessage = "患者标识号长度不能超过50个字符")]
        public string patient_identifier { get; set; }

        [Required(ErrorMessage = "检查日期是必需的")]
        public DateTime examination_date { get; set; }

        public DateTime report_generation_date { get; set; } = DateTime.UtcNow;

        [Required(ErrorMessage = "主治医师姓名是必需的")]
        [StringLength(100, ErrorMessage = "主治医师姓名长度不能超过100个字符")]
        public string attending_physician { get; set; }

        public List<string> image_identifiers { get; set; } = new List<string>();

        public LesionAnalysisSummary lesion_summary { get; set; }

        public RiskEvaluation risk_evaluation { get; set; }

        public DiagnosticConclusion conclusion { get; set; }

        public ReportStatus status { get; set; } = ReportStatus.Draft;

        public int version { get; set; } = 1;

        public IEnumerable<KeyFinding> EnumerateKeyFindings()
        {
            if (lesion_summary?.findings == null)
            {
                yield break;
            }

            foreach (var finding in lesion_summary.findings)
            {
                yield return finding;
            }
        }

        public bool Validate()
        {
            try
            {
                bool is_valid = !string.IsNullOrWhiteSpace(patient_identifier) &&
                                !string.IsNullOrWhiteSpace(attending_physician) &&
                                examination_date <= DateTime.UtcNow &&
                                lesion_summary != null &&
                                risk_evaluation != null &&
                                conclusion != null;

                if (!is_valid)
                {
                    LogValidationIssue();
                }

                return is_valid;
            }
            catch (Exception ex)
            {
                LogError("报告验证过程中发生异常", ex);
                return false;
            }
        }

        public string GenerateSummary()
        {
            try
            {
                if (risk_evaluation == null)
                {
                    LogWarning("风险评估对象为空，生成摘要时使用默认值");
                    return $"患者 {patient_identifier} 于 {examination_date:yyyy-MM-dd} 接受检查。风险评估信息缺失。";
                }

                string primary_finding = lesion_summary?.primary_finding ?? "无显著异常";
                return $"患者 {patient_identifier} 于 {examination_date:yyyy-MM-dd} 接受检查。" +
                       $"风险评估等级：{risk_evaluation.overall_level}。" +
                       $"主要发现：{primary_finding}。";
            }
            catch (Exception ex)
            {
                LogError("生成报告摘要时发生异常", ex);
                return "报告摘要生成失败";
            }
        }

        private void LogValidationIssue()
        {
            StringAssembler issues = new StringAssembler();
            if (string.IsNullOrWhiteSpace(patient_identifier)) issues.Append("患者标识号为空; ");
            if (string.IsNullOrWhiteSpace(attending_physician)) issues.Append("主治医师姓名为空; ");
            if (examination_date > DateTime.UtcNow) issues.Append("检查日期在未来; ");
            if (lesion_summary == null) issues.Append("病变分析摘要为空; ");
            if (risk_evaluation == null) issues.Append("风险评估为空; ");
            if (conclusion == null) issues.Append("诊断结论为空; ");

            Trace.TraceWarning($"报告验证失败: {issues}");
        }

        private void LogError(string message, Exception ex)
        {
            Trace.TraceError($"{message}: {ex.Message}");
        }

        private void LogWarning(string message)
        {
            Trace.TraceWarning(message);
        }
    }

    public class LesionAnalysisSummary
    {
        public DateTime analysis_timestamp { get; set; }

        public string model_version { get; set; }

        [StringLength(500, ErrorMessage = "主要发现描述长度不能超过500个字符")]
        public string primary_finding { get; set; }

        public int lesion_region_count { get; set; }

        public double max_lesion_area { get; set; }

        public double average_lesion_area { get; set; }

        public List<KeyFinding> findings { get; set; } = new List<KeyFinding>();

        [Range(1, 10, ErrorMessage = "图像质量评分必须在1到10之间")]
        public int image_quality_score { get; set; }

        [Range(0.0, 1.0, ErrorMessage = "分析置信度必须在0到1之间")]
        public double analysis_confidence { get; set; }

        public bool HasFindings()
        {
            return findings != null && findings.Any();
        }
    }

    public class KeyFinding
    {
        [Required(ErrorMessage = "发现类型是必需的")]
        public FindingType type { get; set; }

        [Required(ErrorMessage = "发现描述是必需的")]
        [StringLength(300, ErrorMessage = "发现描述长度不能超过300个字符")]
        public string description { get; set; }

        [Range(1, 5, ErrorMessage = "严重程度必须在1到5之间")]
        public int severity { get; set; }

        public RegionCoordinates location { get; set; }

        [Range(0.0, 1.0, ErrorMessage = "置信度必须在0到1之间")]
        public double confidence { get; set; }

        public string related_image_id { get; set; }

        public bool IsHighConfidence(double threshold = 0.7)
        {
            return confidence >= threshold;
        }
    }

    public class RiskEvaluation
    {
        [Required(ErrorMessage = "总体风险等级是必需的")]
        public RiskLevels overall_level { get; set; }

        [Range(0, 100, ErrorMessage = "风险评分必须在0到100之间")]
        public double risk_score { get; set; }

        public List<RiskFactor> contributing_factors { get; set; } = new List<RiskFactor>();

        public string assessment_model_version { get; set; }

        public DateTime evaluation_timestamp { get; set; } = DateTime.UtcNow;

        public IEnumerable<RiskFactor> EnumerateHighRiskFactors()
        {
            if (contributing_factors == null)
            {
                yield break;
            }

            foreach (var factor in contributing_factors.Where(f => f.severity >= 3))
            {
                yield return factor;
            }
        }

        public int CountHighRiskFactors()
        {
            return contributing_factors?.Count(f => f.severity >= 3) ?? 0;
        }
    }

    public class RiskFactor
    {
        [Required(ErrorMessage = "风险因素名称是必需的")]
        [StringLength(100, ErrorMessage = "风险因素名称长度不能超过100个字符")]
        public string name { get; set; }

        [StringLength(200, ErrorMessage = "风险因素描述长度不能超过200个字符")]
        public string description { get; set; }

        [Range(1, 5, ErrorMessage = "严重程度必须在1到5之间")]
        public int severity { get; set; }

        [Range(0.0, 1.0, ErrorMessage = "权重必须在0到1之间")]
        public double weight { get; set; }

        [StringLength(300, ErrorMessage = "证据描述长度不能超过300个字符")]
        public string evidence { get; set; }

        public bool IsSignificant(double weight_threshold = 0.5)
        {
            return weight >= weight_threshold;
        }
    }

    public class DiagnosticConclusion
    {
        [Required(ErrorMessage = "诊断结论是必需的")]
        [StringLength(500, ErrorMessage = "诊断结论长度不能超过500个字符")]
        public string conclusion_text { get; set; }

        public List<Recommendation> recommendations { get; set; } = new List<Recommendation>();

        [StringLength(300, ErrorMessage = "随访建议长度不能超过300个字符")]
        public string follow_up_advice { get; set; }

        public UrgencyLevel urgency { get; set; }

        public string GenerateRecommendationSummary()
        {
            try
            {
                if (recommendations == null || !recommendations.Any())
                {
                    return "无具体建议";
                }

                var primary_recommendations = recommendations.Where(r => r.priority == PriorityLevel.High);
                if (!primary_recommendations.Any())
                {
                    return "无高优先级建议";
                }

                return string.Join("；", primary_recommendations.Select(r => r.description));
            }
            catch (Exception ex)
            {
                Trace.TraceError($"生成建议摘要时发生异常: {ex.Message}");
                return "建议摘要生成失败";
            }
        }

        public bool HasHighPriorityRecommendations()
        {
            return recommendations?.Any(r => r.priority == PriorityLevel.High) ?? false;
        }
    }

    public class Recommendation
    {
        [Required(ErrorMessage = "建议描述是必需的")]
        [StringLength(200, ErrorMessage = "建议描述长度不能超过200个字符")]
        public string description { get; set; }

        public PriorityLevel priority { get; set; }

        public RecommendationType type { get; set; }

        public string expected_timeline { get; set; }
    }

    public class RegionCoordinates
    {
        [Range(0.0, 1.0, ErrorMessage = "X坐标必须在0到1之间")]
        public double x { get; set; }

        [Range(0.0, 1.0, ErrorMessage = "Y坐标必须在0到1之间")]
        public double y { get; set; }

        [Range(0.0, 1.0, ErrorMessage = "宽度必须在0到1之间")]
        public double width { get; set; }

        [Range(0.0, 1.0, ErrorMessage = "高度必须在0到1之间")]
        public double height { get; set; }

        public bool IsValid()
        {
            return x >= 0.0 && x <= 1.0 &&
                   y >= 0.0 && y <= 1.0 &&
                   width >= 0.0 && width <= 1.0 &&
                   height >= 0.0 && height <= 1.0 &&
                   x + width <= 1.0 &&
                   y + height <= 1.0;
        }
    }

    public enum FindingType
    {
        CellularAbnormality,
        VascularAbnormality,
        StructuralAbnormality,
        InflammatoryChange,
        MetaplasticChange,
        Other
    }

    public enum ReportStatus
    {
        Draft,
        Reviewed,
        Issued,
        Archived
    }

    public enum UrgencyLevel
    {
        Routine,
        Urgent,
        Emergency
    }

    public enum PriorityLevel
    {
        Low,
        Medium,
        High
    }

    public enum RecommendationType
    {
        FurtherExamination,
        Treatment,
        FollowUp,
        Lifestyle,
        Referral
    }
}