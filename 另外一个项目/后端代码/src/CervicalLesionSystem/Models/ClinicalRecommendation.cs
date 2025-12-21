using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using CervicalLesionSystem.Common.Enums;

namespace CervicalLesionSystem.Models
{
    /// <summary>
    /// 临床推荐结果模型
    /// 包含诊疗建议、随访计划、治疗选项、置信度评分和循证依据引用
    /// 支持结构化存储和导出
    /// </summary>
    public class ClinicalRecommendation
    {
        /// <summary>
        /// 推荐唯一标识符
        /// </summary>
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>
        /// 关联的患者标识符
        /// </summary>
        public string PatientIdentifier { get; set; } = string.Empty;

        /// <summary>
        /// 关联的评估报告标识符
        /// </summary>
        public Guid AssessmentReportId { get; set; }

        /// <summary>
        /// 推荐生成时间戳
        /// </summary>
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// 风险评估等级
        /// </summary>
        public RiskGrade RiskGrade { get; set; }

        /// <summary>
        /// 诊疗建议摘要
        /// </summary>
        public string TreatmentAdviceSummary { get; set; } = string.Empty;

        /// <summary>
        /// 详细的诊疗建议列表
        /// </summary>
        public List<TherapeuticAdvice> DetailedAdvice { get; set; } = new List<TherapeuticAdvice>();

        /// <summary>
        /// 随访计划
        /// </summary>
        public FollowUpPlan FollowUpPlan { get; set; } = new FollowUpPlan();

        /// <summary>
        /// 推荐的治疗选项列表
        /// </summary>
        public List<TreatmentOption> TreatmentOptions { get; set; } = new List<TreatmentOption>();

        /// <summary>
        /// 整体推荐置信度评分（0-1）
        /// </summary>
        public double ConfidenceScore { get; set; }

        /// <summary>
        /// 循证医学依据引用列表
        /// </summary>
        public List<EvidenceReference> EvidenceReferences { get; set; } = new List<EvidenceReference>();

        /// <summary>
        /// 推荐生成算法或规则版本
        /// </summary>
        public string RecommendationVersion { get; set; } = "1.0.0";

        /// <summary>
        /// 医生备注或个性化调整
        /// </summary>
        public string PhysicianNotes { get; set; } = string.Empty;

        /// <summary>
        /// 推荐状态
        /// </summary>
        public RecommendationStatus Status { get; set; } = RecommendationStatus.Generated;

        /// <summary>
        /// 获取所有治疗选项的迭代器
        /// </summary>
        /// <returns>治疗选项迭代器</returns>
        public IEnumerable<TreatmentOption> EnumerateTreatmentOptions()
        {
            return TreatmentOptions;
        }

        /// <summary>
        /// 获取所有循证依据的迭代器
        /// </summary>
        /// <returns>循证依据迭代器</returns>
        public IEnumerable<EvidenceReference> EnumerateEvidenceReferences()
        {
            return EvidenceReferences;
        }

        /// <summary>
        /// 验证推荐结果的完整性
        /// </summary>
        /// <returns>验证结果</returns>
        public ValidationResult Validate()
        {
            var validationResult = new ValidationResult();

            try
            {
                ValidatePatientIdentifier(validationResult);
                ValidateAssessmentReportId(validationResult);
                ValidateConfidenceScore(validationResult);
                ValidateDetailedAdvice(validationResult);
                ValidateFollowUpPlan(validationResult);
                ValidateTreatmentOptions(validationResult);
                ValidateEvidenceReferences(validationResult);
            }
            catch (Exception ex)
            {
                validationResult.Errors.Add($"验证过程中发生异常: {ex.Message}");
            }

            validationResult.IsValid = validationResult.Errors.Count == 0;
            return validationResult;
        }

        private void ValidatePatientIdentifier(ValidationResult validationResult)
        {
            if (string.IsNullOrWhiteSpace(PatientIdentifier))
            {
                validationResult.Errors.Add("患者标识符不能为空");
            }
        }

        private void ValidateAssessmentReportId(ValidationResult validationResult)
        {
            if (AssessmentReportId == Guid.Empty)
            {
                validationResult.Errors.Add("评估报告标识符无效");
            }
        }

        private void ValidateConfidenceScore(ValidationResult validationResult)
        {
            if (ConfidenceScore < 0.0 || ConfidenceScore > 1.0)
            {
                validationResult.Errors.Add("置信度评分必须在0到1之间");
            }
        }

        private void ValidateDetailedAdvice(ValidationResult validationResult)
        {
            if (DetailedAdvice == null || DetailedAdvice.Count == 0)
            {
                validationResult.Errors.Add("至少需要一条详细的诊疗建议");
                return;
            }

            for (int i = 0; i < DetailedAdvice.Count; i++)
            {
                var advice = DetailedAdvice[i];
                if (advice == null)
                {
                    validationResult.Errors.Add($"第{i + 1}条详细诊疗建议为空");
                    continue;
                }

                if (string.IsNullOrWhiteSpace(advice.Description))
                {
                    validationResult.Errors.Add($"第{i + 1}条详细诊疗建议描述为空");
                }

                if (advice.Priority < 1 || advice.Priority > 5)
                {
                    validationResult.Errors.Add($"第{i + 1}条详细诊疗建议优先级必须在1-5之间");
                }
            }
        }

        private void ValidateFollowUpPlan(ValidationResult validationResult)
        {
            if (FollowUpPlan == null)
            {
                validationResult.Errors.Add("随访计划不能为空");
                return;
            }

            if (FollowUpPlan.FollowUpIntervalMonths <= 0)
            {
                validationResult.Errors.Add("随访周期必须大于0个月");
            }

            if (FollowUpPlan.NextFollowUpDate.HasValue && FollowUpPlan.NextFollowUpDate.Value < DateTime.UtcNow)
            {
                validationResult.Errors.Add("下次随访建议日期不能早于当前时间");
            }
        }

        private void ValidateTreatmentOptions(ValidationResult validationResult)
        {
            if (TreatmentOptions == null)
            {
                validationResult.Errors.Add("治疗选项列表不能为空");
                return;
            }

            for (int i = 0; i < TreatmentOptions.Count; i++)
            {
                var option = TreatmentOptions[i];
                if (option == null)
                {
                    validationResult.Errors.Add($"第{i + 1}个治疗选项为空");
                    continue;
                }

                if (string.IsNullOrWhiteSpace(option.TreatmentName))
                {
                    validationResult.Errors.Add($"第{i + 1}个治疗选项名称为空");
                }

                if (option.ExpectedSuccessRate < 0.0 || option.ExpectedSuccessRate > 1.0)
                {
                    validationResult.Errors.Add($"第{i + 1}个治疗选项预期成功率必须在0到1之间");
                }
            }
        }

        private void ValidateEvidenceReferences(ValidationResult validationResult)
        {
            if (EvidenceReferences == null)
            {
                return;
            }

            for (int i = 0; i < EvidenceReferences.Count; i++)
            {
                var reference = EvidenceReferences[i];
                if (reference == null)
                {
                    validationResult.Errors.Add($"第{i + 1}条循证依据为空");
                    continue;
                }

                if (string.IsNullOrWhiteSpace(reference.Title))
                {
                    validationResult.Errors.Add($"第{i + 1}条循证依据标题为空");
                }

                if (reference.PublicationYear < 1900 || reference.PublicationYear > DateTime.UtcNow.Year)
                {
                    validationResult.Errors.Add($"第{i + 1}条循证依据发表年份无效");
                }
            }
        }
    }

    /// <summary>
    /// 治疗建议详情
    /// </summary>
    public class TherapeuticAdvice
    {
        /// <summary>
        /// 建议类别
        /// </summary>
        public AdviceCategory Category { get; set; }

        /// <summary>
        /// 建议描述
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// 优先级（1-5，1为最高）
        /// </summary>
        public int Priority { get; set; } = 3;

        /// <summary>
        /// 适用条件描述
        /// </summary>
        public string ApplicableCondition { get; set; } = string.Empty;

        /// <summary>
        /// 预期效果
        /// </summary>
        public string ExpectedOutcome { get; set; } = string.Empty;

        /// <summary>
        /// 验证治疗建议的完整性
        /// </summary>
        /// <returns>验证结果</returns>
        public ValidationResult Validate()
        {
            var validationResult = new ValidationResult();

            if (string.IsNullOrWhiteSpace(Description))
            {
                validationResult.Errors.Add("建议描述不能为空");
            }

            if (Priority < 1 || Priority > 5)
            {
                validationResult.Errors.Add("优先级必须在1-5之间");
            }

            validationResult.IsValid = validationResult.Errors.Count == 0;
            return validationResult;
        }
    }

    /// <summary>
    /// 随访计划
    /// </summary>
    public class FollowUpPlan
    {
        /// <summary>
        /// 随访周期（月）
        /// </summary>
        public int FollowUpIntervalMonths { get; set; } = 12;

        /// <summary>
        /// 建议的随访检查项目列表
        /// </summary>
        public List<string> RecommendedExaminations { get; set; } = new List<string>();

        /// <summary>
        /// 特殊重要提示事项
        /// </summary>
        public string SpecialConsiderations { get; set; } = string.Empty;

        /// <summary>
        /// 下次随访建议日期
        /// </summary>
        public DateTime? NextFollowUpDate { get; set; }

        /// <summary>
        /// 获取随访检查项目的迭代器
        /// </summary>
        /// <returns>检查项目迭代器</returns>
        public IEnumerable<string> EnumerateExaminations()
        {
            return RecommendedExaminations ?? new List<string>();
        }

        /// <summary>
        /// 验证随访计划的完整性
        /// </summary>
        /// <returns>验证结果</returns>
        public ValidationResult Validate()
        {
            var validationResult = new ValidationResult();

            if (FollowUpIntervalMonths <= 0)
            {
                validationResult.Errors.Add("随访周期必须大于0个月");
            }

            if (NextFollowUpDate.HasValue && NextFollowUpDate.Value < DateTime.UtcNow)
            {
                validationResult.Errors.Add("下次随访建议日期不能早于当前时间");
            }

            validationResult.IsValid = validationResult.Errors.Count == 0;
            return validationResult;
        }
    }

    /// <summary>
    /// 治疗选项
    /// </summary>
    public class TreatmentOption
    {
        /// <summary>
        /// 治疗方案名称
        /// </summary>
        public string TreatmentName { get; set; } = string.Empty;

        /// <summary>
        /// 治疗方案描述
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// 治疗方案类型
        /// </summary>
        public TreatmentType TreatmentType { get; set; }

        /// <summary>
        /// 预期成功率（0-1）
        /// </summary>
        public double ExpectedSuccessRate { get; set; }

        /// <summary>
        /// 风险评估（并发症风险等）
        /// </summary>
        public string RiskAssessment { get; set; } = string.Empty;

        /// <summary>
        /// 适用人群描述
        /// </summary>
        public string TargetPopulation { get; set; } = string.Empty;

        /// <summary>
        /// 禁忌症列表
        /// </summary>
        public List<string> Contraindications { get; set; } = new List<string>();

        /// <summary>
        /// 获取禁忌症的迭代器
        /// </summary>
        /// <returns>禁忌症迭代器</returns>
        public IEnumerable<string> EnumerateContraindications()
        {
            return Contraindications ?? new List<string>();
        }

        /// <summary>
        /// 验证治疗选项的完整性
        /// </summary>
        /// <returns>验证结果</returns>
        public ValidationResult Validate()
        {
            var validationResult = new ValidationResult();

            if (string.IsNullOrWhiteSpace(TreatmentName))
            {
                validationResult.Errors.Add("治疗方案名称不能为空");
            }

            if (ExpectedSuccessRate < 0.0 || ExpectedSuccessRate > 1.0)
            {
                validationResult.Errors.Add("预期成功率必须在0到1之间");
            }

            validationResult.IsValid = validationResult.Errors.Count == 0;
            return validationResult;
        }
    }

    /// <summary>
    /// 循证医学依据引用
    /// </summary>
    public class EvidenceReference
    {
        /// <summary>
        /// 文献标题
        /// </summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// 系统列表
        /// </summary>
        public List<string> Authors { get; set; } = new List<string>();

        /// <summary>
        /// 期刊或来源
        /// </summary>
        public string Journal { get; set; } = string.Empty;

        /// <summary>
        /// 发表年份
        /// </summary>
        public int PublicationYear { get; set; }

        /// <summary>
        /// 证据等级
        /// </summary>
        public EvidenceLevel EvidenceLevel { get; set; }

        /// <summary>
        /// 相关章节或页码
        /// </summary>
        public string RelevantSection { get; set; } = string.Empty;

        /// <summary>
        /// 数字对象标识符
        /// </summary>
        public string DOI { get; set; } = string.Empty;

        /// <summary>
        /// 获取系统的迭代器
        /// </summary>
        /// <returns>系统迭代器</returns>
        public IEnumerable<string> EnumerateAuthors()
        {
            return Authors ?? new List<string>();
        }

        /// <summary>
        /// 验证循证依据的完整性
        /// </summary>
        /// <returns>验证结果</returns>
        public ValidationResult Validate()
        {
            var validationResult = new ValidationResult();

            if (string.IsNullOrWhiteSpace(Title))
            {
                validationResult.Errors.Add("文献标题不能为空");
            }

            if (PublicationYear < 1900 || PublicationYear > DateTime.UtcNow.Year)
            {
                validationResult.Errors.Add("发表年份无效");
            }

            validationResult.IsValid = validationResult.Errors.Count == 0;
            return validationResult;
        }
    }

    /// <summary>
    /// 验证结果
    /// </summary>
    public class ValidationResult
    {
        /// <summary>
        /// 是否验证通过
        /// </summary>
        public bool IsValid { get; set; }

        /// <summary>
        /// 错误信息列表
        /// </summary>
        public List<string> Errors { get; set; } = new List<string>();

        /// <summary>
        /// 获取错误信息的迭代器
        /// </summary>
        /// <returns>错误信息迭代器</returns>
        public IEnumerable<string> EnumerateErrors()
        {
            return Errors;
        }

        /// <summary>
        /// 获取错误信息汇总
        /// </summary>
        /// <returns>错误信息字符串</returns>
        public string GetErrorSummary()
        {
            return string.Join("; ", Errors);
        }
    }

    /// <summary>
    /// 建议类别枚举
    /// </summary>
    public enum AdviceCategory
    {
        /// <summary>
        /// 诊断建议
        /// </summary>
        Diagnostic,
        
        /// <summary>
        /// 治疗建议
        /// </summary>
        Therapeutic,
        
        /// <summary>
        /// 随访建议
        /// </summary>
        FollowUp,
        
        /// <summary>
        /// 生活方式建议
        /// </summary>
        Lifestyle,
        
        /// <summary>
        /// 预防建议
        /// </summary>
        Preventive
    }

    /// <summary>
    /// 治疗方案类型枚举
    /// </summary>
    public enum TreatmentType
    {
        /// <summary>
        /// 手术治疗
        /// </summary>
        Surgical,
        
        /// <summary>
        /// 药物治疗
        /// </summary>
        Pharmaceutical,
        
        /// <summary>
        /// 物理治疗
        /// </summary>
        Physical,
        
        /// <summary>
        /// 观察等待
        /// </summary>
        WatchfulWaiting,
        
        /// <summary>
        /// 综合治疗
        /// </summary>
        Comprehensive
    }

    /// <summary>
    /// 证据等级枚举
    /// </summary>
    public enum EvidenceLevel
    {
        /// <summary>
        /// 一级证据（最高）
        /// </summary>
        Level1,
        
        /// <summary>
        /// 二级证据
        /// </summary>
        Level2,
        
        /// <summary>
        /// 三级证据
        /// </summary>
        Level3,
        
        /// <summary>
        /// 四级证据
        /// </summary>
        Level4,
        
        /// <summary>
        /// 五级证据（最低）
        /// </summary>
        Level5
    }

    /// <summary>
    /// 推荐状态枚举
    /// </summary>
    public enum RecommendationStatus
    {
        /// <summary>
        /// 已生成
        /// </summary>
        Generated,
        
        /// <summary>
        /// 已审核
        /// </summary>
        Reviewed,
        
        /// <summary>
        /// 已采纳
        /// </summary>
        Adopted,
        
        /// <summary>
        /// 已修改
        /// </summary>
        Modified,
        
        /// <summary>
        /// 已归档
        /// </summary>
        Archived
    }
}