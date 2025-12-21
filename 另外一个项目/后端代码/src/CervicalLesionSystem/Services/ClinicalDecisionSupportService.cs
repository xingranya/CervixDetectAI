using System;
using System.Collections.Generic;
using System.Linq;
using CervicalLesionSystem.Models;
using Microsoft.Extensions.Logging;
using NRules;
using NRules.Fluent;

namespace CervicalLesionSystem.Services
{
    /// <summary>
    /// 临床决策支持服务实现
    /// 集成规则引擎和机器学习模型，根据风险评估等级、患者历史数据、临床指南生成分级诊疗建议、随访计划和治疗推荐
    /// </summary>
    public class ClinicalDecisionSupportService : IClinicalDecisionSupportService
    {
        private readonly ILogger<ClinicalDecisionSupportService> _logger;
        private readonly ISessionFacility _ruleSessionFacility;
        private readonly IRecommendationModel _recommendationModel;
        private readonly IRetryPolicyService _retryPolicy;

        /// <summary>
        /// 构造函数
        /// </summary>
        /// <param name="logger">日志记录器</param>
        /// <param name="ruleSessionFacility">规则引擎会话工厂</param>
        /// <param name="recommendationModel">推荐模型</param>
        /// <param name="retryPolicyService">重试策略提供器</param>
        public ClinicalDecisionSupportService(
            ILogger<ClinicalDecisionSupportService> logger,
            ISessionFacility ruleSessionFacility,
            IRecommendationModel recommendationModel,
            IRetryPolicyService retryPolicyService)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _ruleSessionFacility = ruleSessionFacility ?? throw new ArgumentNullException(nameof(ruleSessionFacility));
            _recommendationModel = recommendationModel ?? throw new ArgumentNullException(nameof(recommendationModel));
            _retryPolicy = retryPolicyService ?? throw new ArgumentNullException(nameof(retryPolicyService));
        }

        /// <summary>
        /// 生成临床推荐结果
        /// </summary>
        /// <param name="assessmentResult">风险评估结果</param>
        /// <param name="patientHistory">患者历史数据</param>
        /// <param name="clinicalGuidelines">临床指南版本</param>
        /// <returns>临床推荐结果</returns>
        public ClinicalRecommendation GenerateRecommendation(
            RiskAssessmentResult assessmentResult,
            PatientHistory patientHistory,
            string clinicalGuidelines)
        {
            if (assessmentResult == null)
                throw new ArgumentNullException(nameof(assessmentResult));
            if (patientHistory == null)
                throw new ArgumentNullException(nameof(patientHistory));
            if (string.IsNullOrWhiteSpace(clinicalGuidelines))
                throw new ArgumentException("临床指南版本不能为空", nameof(clinicalGuidelines));

            try
            {
                _logger.LogInformation("开始生成临床推荐，患者ID：{PatientId}，风险评估等级：{RiskLevel}",
                    patientHistory.PatientId, assessmentResult.RiskLevel);

                // 使用重试策略执行规则引擎推理
                var ruleBasedSuggestions = _retryPolicy.ExecuteWithRetry(() =>
                    ExecuteRuleEngine(assessmentResult, patientHistory, clinicalGuidelines));

                // 使用机器学习模型生成个性化推荐
                var modelBasedSuggestions = _retryPolicy.ExecuteWithRetry(() =>
                    _recommendationModel.GeneratePersonalizedRecommendations(assessmentResult, patientHistory));

                // 融合规则引擎和模型结果
                var finalRecommendation = CombineRecommendations(
                    ruleBasedSuggestions, modelBasedSuggestions, assessmentResult, patientHistory);

                _logger.LogInformation("临床推荐生成完成，患者ID：{PatientId}，置信度：{Confidence}",
                    patientHistory.PatientId, finalRecommendation.ConfidenceScore);

                return finalRecommendation;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "生成临床推荐时发生错误，患者ID：{PatientId}", patientHistory.PatientId);
                throw new ClinicalDecisionSupportException("生成临床推荐失败", ex);
            }
        }

        /// <summary>
        /// 批量生成临床推荐结果
        /// </summary>
        /// <param name="assessmentCases">风险评估病例集合</param>
        /// <param name="clinicalGuidelines">临床指南版本</param>
        /// <returns>临床推荐结果集合</returns>
        public IEnumerable<ClinicalRecommendation> GenerateBatchRecommendations(
            IEnumerable<AssessmentCase> assessmentCases,
            string clinicalGuidelines)
        {
            if (assessmentCases == null)
                throw new ArgumentNullException(nameof(assessmentCases));

            // 使用生成器方式处理批量数据
            return GenerateRecommendationsInternal(assessmentCases, clinicalGuidelines);
        }

        /// <summary>
        /// 执行规则引擎推理
        /// </summary>
        private RuleBasedSuggestions ExecuteRuleEngine(
            RiskAssessmentResult assessmentResult,
            PatientHistory patientHistory,
            string clinicalGuidelines)
        {
            try
            {
                var session = _ruleSessionFacility.CreateSession();
                
                // 插入事实到规则引擎
                session.Insert(assessmentResult);
                session.Insert(patientHistory);
                session.Insert(new ClinicalGuideline { Version = clinicalGuidelines, EffectiveDate = DateTime.UtcNow });

                // 执行规则
                session.Fire();

                // 查询规则执行结果
                var suggestions = session.Query<RuleBasedSuggestions>().FirstOrDefault();
                
                if (suggestions == null)
                {
                    _logger.LogWarning("规则引擎未生成建议，使用默认规则");
                    suggestions = GenerateDefaultSuggestions(assessmentResult, patientHistory);
                }

                return suggestions;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "规则引擎执行失败");
                throw new RuleEngineException("规则引擎执行失败", ex);
            }
        }

        /// <summary>
        /// 生成默认建议（当规则引擎失败时使用）
        /// </summary>
        private RuleBasedSuggestions GenerateDefaultSuggestions(
            RiskAssessmentResult assessmentResult,
            PatientHistory patientHistory)
        {
            var suggestions = new RuleBasedSuggestions
            {
                TreatmentOptions = GenerateDefaultTreatmentOptions(assessmentResult.RiskLevel),
                FollowUpPlan = GenerateDefaultFollowUpPlan(assessmentResult.RiskLevel, patientHistory.Age),
                EvidenceReferences = new List<string> { "默认临床指南" }
            };

            return suggestions;
        }

        /// <summary>
        /// 生成默认治疗选项
        /// </summary>
        private List<TreatmentOption> GenerateDefaultTreatmentOptions(RiskLevel riskLevel)
        {
            var options = new List<TreatmentOption>();

            switch (riskLevel)
            {
                case RiskLevel.Low:
                    options.Add(new TreatmentOption
                    {
                        Name = "定期随访",
                        Description = "建议12个月后复查宫颈细胞学",
                        Priority = 1
                    });
                    break;
                case RiskLevel.Medium:
                    options.Add(new TreatmentOption
                    {
                        Name = "阴道镜检查",
                        Description = "建议进行阴道镜检查评估",
                        Priority = 1
                    });
                    options.Add(new TreatmentOption
                    {
                        Name = "HPV分型检测",
                        Description = "进行高危型HPV分型检测",
                        Priority = 2
                    });
                    break;
                case RiskLevel.High:
                    options.Add(new TreatmentOption
                    {
                        Name = "宫颈活检",
                        Description = "建议进行宫颈多点活检",
                        Priority = 1
                    });
                    options.Add(new TreatmentOption
                    {
                        Name = "LEEP手术",
                        Description = "考虑环形电切术治疗",
                        Priority = 2
                    });
                    break;
                case RiskLevel.Critical:
                    options.Add(new TreatmentOption
                    {
                        Name = "锥形切除术",
                        Description = "建议宫颈锥形切除术",
                        Priority = 1
                    });
                    options.Add(new TreatmentOption
                    {
                        Name = "多学科会诊",
                        Description = "建议肿瘤科、病理科多学科会诊",
                        Priority = 2
                    });
                    break;
            }

            return options;
        }

        /// <summary>
        /// 生成默认随访计划
        /// </summary>
        private FollowUpPlan GenerateDefaultFollowUpPlan(RiskLevel riskLevel, int patientAge)
        {
            var plan = new FollowUpPlan();

            switch (riskLevel)
            {
                case RiskLevel.Low:
                    plan.IntervalMonths = 12;
                    plan.Examinations = new List<string> { "宫颈细胞学检查" };
                    plan.Notes = "常规年度随访";
                    break;
                case RiskLevel.Medium:
                    plan.IntervalMonths = 6;
                    plan.Examinations = new List<string> { "宫颈细胞学检查", "HPV检测" };
                    plan.Notes = "密切随访，6个月后复查";
                    break;
                case RiskLevel.High:
                    plan.IntervalMonths = 3;
                    plan.Examinations = new List<string> { "阴道镜检查", "宫颈活检" };
                    plan.Notes = "积极随访，必要时治疗";
                    break;
                case RiskLevel.Critical:
                    plan.IntervalMonths = 1;
                    plan.Examinations = new List<string> { "病理会诊", "影像学检查" };
                    plan.Notes = "紧急处理，密切监测";
                    break;
            }

            // 根据年龄调整随访计划
            if (patientAge > 50)
            {
                plan.Notes += "（绝经后患者，需考虑年龄因素）";
            }

            return plan;
        }

        /// <summary>
        /// 融合规则引擎和机器学习模型的结果
        /// </summary>
        private ClinicalRecommendation CombineRecommendations(
            RuleBasedSuggestions ruleBasedSuggestions,
            ModelBasedSuggestions modelBasedSuggestions,
            RiskAssessmentResult assessmentResult,
            PatientHistory patientHistory)
        {
            // 计算综合置信度
            var confidenceScore = CalculateConfidenceScore(
                ruleBasedSuggestions, modelBasedSuggestions, assessmentResult.Confidence);

            // 优先使用模型推荐的治疗选项，如果模型置信度足够高
            var finalTreatmentOptions = modelBasedSuggestions.Confidence > 0.7
                ? modelBasedSuggestions.TreatmentOptions
                : ruleBasedSuggestions.TreatmentOptions;

            // 合并循证依据
            var allEvidenceReferences = new List<string>();
            allEvidenceReferences.AddRange(ruleBasedSuggestions.EvidenceReferences);
            allEvidenceReferences.AddRange(modelBasedSuggestions.EvidenceReferences);
            allEvidenceReferences = allEvidenceReferences.Distinct().ToList();

            return new ClinicalRecommendation
            {
                PatientId = patientHistory.PatientId,
                AssessmentId = assessmentResult.AssessmentId,
                GeneratedDate = DateTime.UtcNow,
                TreatmentOptions = finalTreatmentOptions,
                FollowUpPlan = ruleBasedSuggestions.FollowUpPlan,
                ConfidenceScore = confidenceScore,
                EvidenceReferences = allEvidenceReferences,
                ClinicalNotes = GenerateClinicalNotes(assessmentResult, patientHistory, confidenceScore)
            };
        }

        /// <summary>
        /// 计算综合置信度
        /// </summary>
        private double CalculateConfidenceScore(
            RuleBasedSuggestions ruleBased,
            ModelBasedSuggestions modelBased,
            double assessmentConfidence)
        {
            // 加权平均计算综合置信度
            var ruleWeight = 0.4;
            var modelWeight = 0.4;
            var assessmentWeight = 0.2;

            // 规则引擎置信度（基于规则匹配度）
            var ruleConfidence = ruleBased.EvidenceReferences.Any() ? 0.8 : 0.5;

            return (ruleConfidence * ruleWeight) +
                   (modelBased.Confidence * modelWeight) +
                   (assessmentConfidence * assessmentWeight);
        }

        /// <summary>
        /// 生成临床备注
        /// </summary>
        private string GenerateClinicalNotes(
            RiskAssessmentResult assessmentResult,
            PatientHistory patientHistory,
            double confidenceScore)
        {
            var notes = new List<string>
            {
                $"风险评估等级：{assessmentResult.RiskLevel}",
                $"患者年龄：{patientHistory.Age}岁",
                $"HPV感染史：{(patientHistory.HasHPVHistory ? "有" : "无")}",
                $"细胞学异常史：{(patientHistory.HasCytologyAbnormality ? "有" : "无")}",
                $"推荐置信度：{confidenceScore:P1}"
            };

            if (patientHistory.PreviousTreatments?.Any() == true)
            {
                notes.Add($"既往治疗：{string.Join("、", patientHistory.PreviousTreatments)}");
            }

            return string.Join("；", notes);
        }

        /// <summary>
        /// 内部批量生成方法（使用生成器）
        /// </summary>
        private IEnumerable<ClinicalRecommendation> GenerateRecommendationsInternal(
            IEnumerable<AssessmentCase> assessmentCases,
            string clinicalGuidelines)
        {
            foreach (var assessmentCase in assessmentCases)
            {
                ClinicalRecommendation recommendation = null;

                try
                {
                    recommendation = GenerateRecommendation(
                        assessmentCase.AssessmentResult,
                        assessmentCase.PatientHistory,
                        clinicalGuidelines);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "批量生成推荐失败，病例ID：{CaseId}", assessmentCase.CaseId);
                    
                    // 生成错误占位推荐
                    recommendation = CreateErrorPlaceholderRecommendation(assessmentCase);
                }

                yield return recommendation;
            }
        }

        /// <summary>
        /// 创建错误占位推荐
        /// </summary>
        private ClinicalRecommendation CreateErrorPlaceholderRecommendation(AssessmentCase assessmentCase)
        {
            return new ClinicalRecommendation
            {
                PatientId = assessmentCase.PatientHistory.PatientId,
                AssessmentId = assessmentCase.AssessmentResult.AssessmentId,
                GeneratedDate = DateTime.UtcNow,
                TreatmentOptions = new List<TreatmentOption>
                {
                    new TreatmentOption
                    {
                        Name = "系统错误",
                        Description = "推荐生成失败，请人工评估",
                        Priority = 1
                    }
                },
                FollowUpPlan = new FollowUpPlan
                {
                    IntervalMonths = 1,
                    Examinations = new List<string> { "人工评估" },
                    Notes = "系统生成推荐失败，需要医生人工评估"
                },
                ConfidenceScore = 0.0,
                EvidenceReferences = new List<string> { "系统错误处理流程" },
                ClinicalNotes = "系统生成临床推荐时发生错误，请医生进行人工评估和决策"
            };
        }
    }

    /// <summary>
    /// 规则引擎生成的建议
    /// </summary>
    public class RuleBasedSuggestions
    {
        public List<TreatmentOption> TreatmentOptions { get; set; }
        public FollowUpPlan FollowUpPlan { get; set; }
        public List<string> EvidenceReferences { get; set; }
    }

    /// <summary>
    /// 机器学习模型生成的建议
    /// </summary>
    public class ModelBasedSuggestions
    {
        public List<TreatmentOption> TreatmentOptions { get; set; }
        public double Confidence { get; set; }
        public List<string> EvidenceReferences { get; set; }
    }

    /// <summary>
    /// 临床指南事实
    /// </summary>
    public class ClinicalGuideline
    {
        public string Version { get; set; }
        public DateTime EffectiveDate { get; set; }
    }

    /// <summary>
    /// 风险评估等级枚举
    /// </summary>
    public enum RiskLevel
    {
        Low,
        Medium,
        High,
        Critical
    }

    /// <summary>
    /// 治疗选项
    /// </summary>
    public class TreatmentOption
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public int Priority { get; set; }
    }

    /// <summary>
    /// 随访计划
    /// </summary>
    public class FollowUpPlan
    {
        public int IntervalMonths { get; set; }
        public List<string> Examinations { get; set; }
        public string Notes { get; set; }
    }

    /// <summary>
    /// 风险评估结果
    /// </summary>
    public class RiskAssessmentResult
    {
        public string AssessmentId { get; set; }
        public RiskLevel RiskLevel { get; set; }
        public double Confidence { get; set; }
    }

    /// <summary>
    /// 患者历史数据
    /// </summary>
    public class PatientHistory
    {
        public string PatientId { get; set; }
        public int Age { get; set; }
        public bool HasHPVHistory { get; set; }
        public bool HasCytologyAbnormality { get; set; }
        public List<string> PreviousTreatments { get; set; }
    }

    /// <summary>
    /// 评估病例
    /// </summary>
    public class AssessmentCase
    {
        public string CaseId { get; set; }
        public RiskAssessmentResult AssessmentResult { get; set; }
        public PatientHistory PatientHistory { get; set; }
    }

    /// <summary>
    /// 推荐模型接口
    /// </summary>
    public interface IRecommendationModel
    {
        ModelBasedSuggestions GeneratePersonalizedRecommendations(
            RiskAssessmentResult assessmentResult,
            PatientHistory patientHistory);
    }

    /// <summary>
    /// 重试策略提供器接口
    /// </summary>
    public interface IRetryPolicyService
    {
        T ExecuteWithRetry<T>(Func<T> operation);
    }

    /// <summary>
    /// 临床决策支持异常
    /// </summary>
    public class ClinicalDecisionSupportException : Exception
    {
        public ClinicalDecisionSupportException(string message) : base(message) { }
        public ClinicalDecisionSupportException(string message, Exception innerException) 
            : base(message, innerException) { }
    }

    /// <summary>
    /// 规则引擎异常
    /// </summary>
    public class RuleEngineException : Exception
    {
        public RuleEngineException(string message) : base(message) { }
        public RuleEngineException(string message, Exception innerException) 
            : base(message, innerException) { }
    }
}