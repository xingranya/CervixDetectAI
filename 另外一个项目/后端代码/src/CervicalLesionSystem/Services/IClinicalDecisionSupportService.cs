using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CervicalLesionSystem.Models;

namespace CervicalLesionSystem.Services
{
    public interface IClinicalDecisionSupportService
    {
        Task<ClinicalRecommendation> GenerateRecommendationAsync(
            PatientAssessment patientAssessment,
            IEnumerable<HistoricalEpisode> historicalEpisodes,
            CancellationToken cancellationToken = default);

        Task<IEnumerable<ClinicalRule>> GetApplicableRulesAsync(
            RiskTier riskTier,
            PatientProfile patientProfile,
            CancellationToken cancellationToken = default);

        Task UpdateDecisionEngineAsync(
            EngineUpdatePackage updatePackage,
            CancellationToken cancellationToken = default);
    }

    public class PatientAssessment
    {
        public string PatientIdentifier { get; set; }
        public RiskTier LesionRiskTier { get; set; }
        public double RiskScore { get; set; }
        public IEnumerable<string> IdentifiedFeatures { get; set; }
        public string SourceImageId { get; set; }
        public DateTime AssessmentTime { get; set; }
    }

    public class HistoricalEpisode
    {
        public string EpisodeId { get; set; }
        public DateTime VisitDate { get; set; }
        public string Diagnosis { get; set; }
        public string Intervention { get; set; }
        public string FollowUpOutcome { get; set; }
    }

    public enum RiskTier
    {
        Negative,
        LowGrade,
        HighGrade,
        SuspectedCarcinoma
    }

    public class PatientProfile
    {
        public int Age { get; set; }
        public HpvStatus HpvStatus { get; set; }
        public bool HasPriorLesionHistory { get; set; }
        public string ParityHistory { get; set; }
        public string ImmuneStatus { get; set; }
    }

    public enum HpvStatus
    {
        Unknown,
        Negative,
        PositiveOther,
        Positive16Or18
    }

    public class ClinicalRule
    {
        public string RuleId { get; set; }
        public string Description { get; set; }
        public string SourceGuideline { get; set; }
        public double MatchConfidence { get; set; }
    }

    public class EngineUpdatePackage
    {
        public string Version { get; set; }
        public IEnumerable<ClinicalRule> UpdatedRules { get; set; }
        public byte[] ModelData { get; set; }
        public IDictionary<string, object> Configuration { get; set; }
    }

    public class ClinicalRecommendation
    {
        public string RecommendationId { get; set; }
        public string Summary { get; set; }
        public IEnumerable<string> Actions { get; set; }
        public DateTime FollowUpDate { get; set; }
        public IEnumerable<ClinicalRule> AppliedRules { get; set; }
    }

    public class ClinicalDecisionSupportService : IClinicalDecisionSupportService
    {
        private readonly DecisionEngineCore _engineCore;
        private readonly IRecommendationLogger _logger;

        public ClinicalDecisionSupportService()
        {
            _engineCore = new DecisionEngineCore();
            _logger = new FileRecommendationLogger();
        }

        public async Task<ClinicalRecommendation> GenerateRecommendationAsync(
            PatientAssessment patientAssessment,
            IEnumerable<HistoricalEpisode> historicalEpisodes,
            CancellationToken cancellationToken = default)
        {
            const string operation_name = "GenerateRecommendationAsync";
            if (patientAssessment == null)
            {
                _logger.LogError(operation_name, "患者评估数据为空");
                throw new ArgumentNullException(nameof(patientAssessment));
            }

            try
            {
                ValidatePatientAssessment(patientAssessment);
                var safeHistoricalEpisodes = historicalEpisodes ?? Enumerable.Empty<HistoricalEpisode>();

                cancellationToken.ThrowIfCancellationRequested();

                var riskContext = BuildRiskContext(patientAssessment, safeHistoricalEpisodes);
                var applicableRules = await DetermineApplicableRulesAsync(riskContext, cancellationToken);
                var recommendation = await FormulateRecommendationAsync(riskContext, applicableRules, cancellationToken);

                _logger.LogInformation(operation_name, $"成功生成建议，ID: {recommendation.RecommendationId}");
                return recommendation;
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning(operation_name, "操作被用户取消");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(operation_name, $"生成建议失败: {ex.Message}");
                return CreateFallbackRecommendation(patientAssessment?.PatientIdentifier);
            }
        }

        public async Task<IEnumerable<ClinicalRule>> GetApplicableRulesAsync(
            RiskTier riskTier,
            PatientProfile patientProfile,
            CancellationToken cancellationToken = default)
        {
            const string operation_name = "GetApplicableRulesAsync";
            if (patientProfile == null)
            {
                _logger.LogError(operation_name, "患者特征简档为空");
                return Enumerable.Empty<ClinicalRule>();
            }

            try
            {
                ValidatePatientProfile(patientProfile);
                cancellationToken.ThrowIfCancellationRequested();

                var ruleQuery = new RuleQueryContext
                {
                    RiskTier = riskTier,
                    PatientAge = patientProfile.Age,
                    HpvStatus = patientProfile.HpvStatus,
                    HasHistory = patientProfile.HasPriorLesionHistory
                };

                var rules = await _engineCore.FetchRulesAsync(ruleQuery, cancellationToken);
                var filteredRules = FilterRulesByConfidence(rules, threshold: 0.6);

                _logger.LogInformation(operation_name, $"获取到 {filteredRules.Count()} 条适用规则");
                return filteredRules;
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning(operation_name, "规则查询被取消");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(operation_name, $"获取规则失败: {ex.Message}");
                return Enumerable.Empty<ClinicalRule>();
            }
        }

        public async Task UpdateDecisionEngineAsync(
            EngineUpdatePackage updatePackage,
            CancellationToken cancellationToken = default)
        {
            const string operation_name = "UpdateDecisionEngineAsync";
            if (updatePackage == null)
            {
                _logger.LogError(operation_name, "更新包为空");
                throw new ArgumentNullException(nameof(updatePackage));
            }

            bool updateSuccessful = false;
            try
            {
                ValidateUpdatePackage(updatePackage);
                cancellationToken.ThrowIfCancellationRequested();

                await _engineCore.ApplyUpdateAsync(updatePackage, cancellationToken);
                updateSuccessful = true;

                _logger.LogInformation(operation_name, $"引擎更新成功，版本: {updatePackage.Version}");
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning(operation_name, "引擎更新被取消");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(operation_name, $"引擎更新失败: {ex.Message}");
                throw;
            }
            finally
            {
                if (!updateSuccessful)
                {
                    _logger.LogWarning(operation_name, "引擎更新未完成，可能处于不一致状态");
                }
            }
        }

        private void ValidatePatientAssessment(PatientAssessment assessment)
        {
            if (string.IsNullOrWhiteSpace(assessment.PatientIdentifier))
                throw new ArgumentException("患者标识符无效");

            if (assessment.RiskScore < 0 || assessment.RiskScore > 1)
                throw new ArgumentException("风险评分超出有效范围 [0, 1]");

            if (assessment.IdentifiedFeatures?.Any(f => string.IsNullOrWhiteSpace(f)) == true)
                throw new ArgumentException("病变特征描述包含空值");
        }

        private void ValidatePatientProfile(PatientProfile profile)
        {
            if (profile.Age < 0 || profile.Age > 120)
                throw new ArgumentException("患者年龄超出合理范围");

            if (profile.HpvStatus == HpvStatus.Unknown)
                _logger.LogWarning("ValidatePatientProfile", "HPV状态未知，可能影响规则匹配精度");
        }

        private void ValidateUpdatePackage(EngineUpdatePackage updatePackage)
        {
            if (string.IsNullOrWhiteSpace(updatePackage.Version))
                throw new ArgumentException("更新包版本号无效");

            if (updatePackage.ModelData != null && updatePackage.ModelData.Length == 0)
                throw new ArgumentException("模型数据为空数组");

            if (updatePackage.UpdatedRules?.Any(r => string.IsNullOrWhiteSpace(r.RuleId)) == true)
                throw new ArgumentException("更新规则包含无效ID");
        }

        private RiskContext BuildRiskContext(PatientAssessment assessment, IEnumerable<HistoricalEpisode> episodes)
        {
            return new RiskContext
            {
                PatientId = assessment.PatientIdentifier,
                CurrentRiskTier = assessment.LesionRiskTier,
                RiskScore = assessment.RiskScore,
                Features = assessment.IdentifiedFeatures?.ToList() ?? new List<string>(),
                HistoricalEpisodes = episodes.ToList(),
                AssessmentTime = assessment.AssessmentTime
            };
        }

        private async Task<IEnumerable<ClinicalRule>> DetermineApplicableRulesAsync(
            RiskContext context, CancellationToken cancellationToken)
        {
            var profile = new PatientProfile
            {
                Age = CalculateAgeFromHistory(context.HistoricalEpisodes),
                HpvStatus = HpvStatus.Unknown,
                HasPriorLesionHistory = context.HistoricalEpisodes.Any(h => !string.IsNullOrEmpty(h.Diagnosis))
            };

            return await GetApplicableRulesAsync(context.CurrentRiskTier, profile, cancellationToken);
        }

        private async Task<ClinicalRecommendation> FormulateRecommendationAsync(
            RiskContext context, IEnumerable<ClinicalRule> rules, CancellationToken cancellationToken)
        {
            var actions = new List<string>();
            if (context.CurrentRiskTier >= RiskTier.HighGrade)
                actions.Add("建议进行阴道镜检查及活检");
            else if (context.CurrentRiskTier == RiskTier.LowGrade)
                actions.Add("建议6-12个月后复查HPV及细胞学");

            if (context.RiskScore > 0.8)
                actions.Add("高风险，需优先处理");

            return new ClinicalRecommendation
            {
                RecommendationId = $"REC_{Guid.NewGuid():N}",
                Summary = $"基于{context.CurrentRiskTier}风险等级的建议",
                Actions = actions,
                FollowUpDate = DateTime.Now.AddMonths(6),
                AppliedRules = rules
            };
        }

        private ClinicalRecommendation CreateFallbackRecommendation(string patientId)
        {
            return new ClinicalRecommendation
            {
                RecommendationId = $"FALLBACK_{Guid.NewGuid():N}",
                Summary = "无法生成个性化建议，请复核输入数据",
                Actions = new[] { "建议联系临床专家进行人工评估" },
                FollowUpDate = DateTime.Now.AddDays(7),
                AppliedRules = Enumerable.Empty<ClinicalRule>()
            };
        }

        private int CalculateAgeFromHistory(List<HistoricalEpisode> episodes)
        {
            if (episodes == null || !episodes.Any())
                return 30;

            var latestVisit = episodes.Max(e => e.VisitDate);
            var yearsSinceVisit = (DateTime.Now - latestVisit).TotalDays / 365.25;
            return 30 + (int)Math.Floor(yearsSinceVisit);
        }

        private IEnumerable<ClinicalRule> FilterRulesByConfidence(IEnumerable<ClinicalRule> rules, double threshold)
        {
            return rules?.Where(r => r.MatchConfidence >= threshold).OrderByDescending(r => r.MatchConfidence)
                   ?? Enumerable.Empty<ClinicalRule>();
        }
    }

    internal class RiskContext
    {
        public string PatientId { get; set; }
        public RiskTier CurrentRiskTier { get; set; }
        public double RiskScore { get; set; }
        public List<string> Features { get; set; }
        public List<HistoricalEpisode> HistoricalEpisodes { get; set; }
        public DateTime AssessmentTime { get; set; }
    }

    internal class RuleQueryContext
    {
        public RiskTier RiskTier { get; set; }
        public int PatientAge { get; set; }
        public HpvStatus HpvStatus { get; set; }
        public bool HasHistory { get; set; }
    }

    internal class DecisionEngineCore
    {
        private readonly List<ClinicalRule> _cachedRules = new List<ClinicalRule>();

        public async Task<IEnumerable<ClinicalRule>> FetchRulesAsync(
            RuleQueryContext query, CancellationToken cancellationToken)
        {
            await Task.Delay(10, cancellationToken);

            return _cachedRules.Where(rule => IsRuleApplicable(rule, query)).ToList();
        }

        public async Task ApplyUpdateAsync(
            EngineUpdatePackage updatePackage, CancellationToken cancellationToken)
        {
            await Task.Delay(50, cancellationToken);

            if (updatePackage.UpdatedRules != null)
            {
                _cachedRules.RemoveAll(r => updatePackage.UpdatedRules.Any(ur => ur.RuleId == r.RuleId));
                _cachedRules.AddRange(updatePackage.UpdatedRules);
            }
        }

        private bool IsRuleApplicable(ClinicalRule rule, RuleQueryContext query)
        {
            return rule.MatchConfidence > 0.5;
        }
    }

    internal interface IRecommendationLogger
    {
        void LogInformation(string operation, string message);
        void LogWarning(string operation, string message);
        void LogError(string operation, string message);
    }

    internal class FileRecommendationLogger : IRecommendationLogger
    {
        private readonly string _logFilePath;
        private readonly SemaphoreSlim _logLock = new SemaphoreSlim(1, 1);

        public FileRecommendationLogger()
        {
            var appDataPath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            _logFilePath = Path.Combine(appDataPath, "CervicalLesionSystem", "clinical_decisions.log");
            Directory.CreateDirectory(Path.GetDirectoryName(_logFilePath));
        }

        public void LogInformation(string operation, string message)
        {
            WriteLog("INFO", operation, message);
        }

        public void LogWarning(string operation, string message)
        {
            WriteLog("WARN", operation, message);
        }

        public void LogError(string operation, string message)
        {
            WriteLog("ERROR", operation, message);
        }

        private void WriteLog(string level, string operation, string message)
        {
            _logLock.Wait();
            try
            {
                var logEntry = $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} [{level}] {operation}: {message}";
                File.AppendAllLines(_logFilePath, new[] { logEntry });
            }
            finally
            {
                _logLock.Release();
            }
        }
    }
}