using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;
using CervicalLesionSystem.Models;
using CervicalLesionSystem.Constants;

namespace CervicalLesionSystem.Core
{
    /// <summary>
    /// 多维度风险评估模型计算模块
    /// 负责量化评估宫颈病变的风险等级，整合影像特征、临床指标和人口统计学数据
    /// </summary>
    public class RiskAssessmentCalculator
    {
        private readonly ILogger<RiskAssessmentCalculator> _logger;
        private readonly RiskAssessmentConfiguration _configuration;

        /// <summary>
        /// 风险评估计算器构造函数
        /// </summary>
        /// <param name="logger">日志记录器</param>
        /// <param name="configuration">风险评估配置参数</param>
        public RiskAssessmentCalculator(ILogger<RiskAssessmentCalculator> logger, RiskAssessmentConfiguration configuration)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
            
            _logger.LogInformation("风险评估计算器初始化完成，使用模型版本：{ModelVersion}", _configuration.ModelVersion);
        }

        /// <summary>
        /// 执行多维度风险评估计算
        /// </summary>
        /// <param name="lesionResult">病变分析结果</param>
        /// <param name="clinicalIndicators">临床指标数据</param>
        /// <returns>风险评估结果</returns>
        public RiskAssessment CalculateRisk(LesionAnalysisResult lesionResult, ClinicalIndicators clinicalIndicators)
        {
            if (lesionResult == null)
                throw new ArgumentNullException(nameof(lesionResult));
            if (clinicalIndicators == null)
                throw new ArgumentNullException(nameof(clinicalIndicators));

            try
            {
                _logger.LogDebug("开始风险评估计算，病变ID：{LesionId}", lesionResult.Id);

                // 验证输入数据
                ValidateInputData(lesionResult, clinicalIndicators);

                // 计算影像特征维度分数
                double imagingScore = ComputeImagingDimensionScore(lesionResult);

                // 计算临床指标维度分数
                double clinicalScore = ComputeClinicalDimensionScore(clinicalIndicators);

                // 计算综合风险分数
                double compositeScore = ComputeCompositeRiskScore(imagingScore, clinicalScore);

                // 确定风险等级
                RiskLevel riskLevel = DetermineRiskLevel(compositeScore);

                // 生成风险因素明细
                var riskFactors = GenerateRiskFactorDetails(lesionResult, clinicalIndicators, imagingScore, clinicalScore);

                // 构建风险评估结果
                var assessment = new RiskAssessment
                {
                    Id = Guid.NewGuid(),
                    LesionAnalysisId = lesionResult.Id,
                    CompositeRiskScore = compositeScore,
                    ImagingDimensionScore = imagingScore,
                    ClinicalDimensionScore = clinicalScore,
                    RiskLevel = riskLevel,
                    RiskFactors = riskFactors,
                    CalculationTimestamp = DateTime.UtcNow,
                    ModelVersion = _configuration.ModelVersion,
                    ConfidenceLevel = CalculateConfidenceLevel(lesionResult, clinicalIndicators)
                };

                _logger.LogInformation("风险评估计算完成，病变ID：{LesionId}，风险等级：{RiskLevel}，综合分数：{CompositeScore}",
                    lesionResult.Id, riskLevel, compositeScore);

                return assessment;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "风险评估计算失败，病变ID：{LesionId}", lesionResult.Id);
                throw new RiskAssessmentException("风险评估计算过程中发生错误", ex);
            }
        }

        /// <summary>
        /// 批量执行风险评估计算
        /// </summary>
        /// <param name="analysisResults">病变分析结果集合</param>
        /// <param name="indicatorsCollection">临床指标集合</param>
        /// <returns>风险评估结果迭代器</returns>
        public IEnumerable<RiskAssessment> CalculateRisksInBatch(
            IEnumerable<LesionAnalysisResult> analysisResults,
            IEnumerable<ClinicalIndicators> indicatorsCollection)
        {
            if (analysisResults == null || indicatorsCollection == null)
                throw new ArgumentNullException("分析结果或临床指标集合不能为空");

            // 使用生成器方式返回结果，避免一次性加载所有数据
            return GenerateRiskAssessments(analysisResults, indicatorsCollection);
        }

        private IEnumerable<RiskAssessment> GenerateRiskAssessments(
            IEnumerable<LesionAnalysisResult> analysisResults,
            IEnumerable<ClinicalIndicators> indicatorsCollection)
        {
            var resultsEnumerator = analysisResults.GetEnumerator();
            var indicatorsEnumerator = indicatorsCollection.GetEnumerator();

            int processedCount = 0;
            int failedCount = 0;

            while (resultsEnumerator.MoveNext() && indicatorsEnumerator.MoveNext())
            {
                RiskAssessment assessment = null;
                try
                {
                    assessment = CalculateRisk(resultsEnumerator.Current, indicatorsEnumerator.Current);
                    processedCount++;
                }
                catch (Exception ex)
                {
                    failedCount++;
                    _logger.LogWarning(ex, "批量风险评估计算失败，跳过当前记录");
                    continue;
                }

                yield return assessment;
            }

            _logger.LogInformation("批量风险评估计算完成，成功处理：{ProcessedCount}条，失败：{FailedCount}条",
                processedCount, failedCount);
        }

        /// <summary>
        /// 验证输入数据的有效性
        /// </summary>
        private void ValidateInputData(LesionAnalysisResult lesionResult, ClinicalIndicators clinicalIndicators)
        {
            if (lesionResult.Features == null || !lesionResult.Features.Any())
                throw new ValidationException("病变特征数据不能为空");

            if (lesionResult.SegmentationMask == null)
                throw new ValidationException("病变分割掩码不能为空");

            if (clinicalIndicators.Age < 18 || clinicalIndicators.Age > 100)
                throw new ValidationException("年龄必须在18-100岁之间");

            if (clinicalIndicators.HPVTypes == null || !clinicalIndicators.HPVTypes.Any())
                throw new ValidationException("HPV类型数据不能为空");

            _logger.LogDebug("输入数据验证通过");
        }

        /// <summary>
        /// 计算影像特征维度分数
        /// </summary>
        private double ComputeImagingDimensionScore(LesionAnalysisResult lesionResult)
        {
            double score = 0.0;

            // 计算病变面积分数
            double areaScore = CalculateLesionAreaScore(lesionResult.SegmentationMask);
            score += areaScore * _configuration.ImagingWeights.AreaWeight;

            // 计算形态特征分数
            double morphologyScore = CalculateMorphologyScore(lesionResult.Features);
            score += morphologyScore * _configuration.ImagingWeights.MorphologyWeight;

            // 计算纹理特征分数
            double textureScore = CalculateTextureScore(lesionResult.Features);
            score += textureScore * _configuration.ImagingWeights.TextureWeight;

            // 计算颜色特征分数
            double colorScore = CalculateColorScore(lesionResult.Features);
            score += colorScore * _configuration.ImagingWeights.ColorWeight;

            // 应用非线性变换
            score = ApplyNonlinearTransformation(score, _configuration.ImagingTransformationParameters);

            _logger.LogDebug("影像特征维度分数计算完成：{ImagingScore}", score);
            return Math.Clamp(score, 0, 100);
        }

        /// <summary>
        /// 计算临床指标维度分数
        /// </summary>
        private double ComputeClinicalDimensionScore(ClinicalIndicators indicators)
        {
            double score = 0.0;

            // 计算HPV相关分数
            double hpvScore = CalculateHpvScore(indicators.HPVTypes, indicators.HPVViralLoad);
            score += hpvScore * _configuration.ClinicalWeights.HpvWeight;

            // 计算细胞学结果分数
            double cytologyScore = CalculateCytologyScore(indicators.CytologyResult);
            score += cytologyScore * _configuration.ClinicalWeights.CytologyWeight;

            // 计算病史分数
            double historyScore = CalculateMedicalHistoryScore(indicators.MedicalHistory);
            score += historyScore * _configuration.ClinicalWeights.HistoryWeight;

            // 计算人口统计学分数
            double demographicScore = CalculateDemographicScore(indicators.Age, indicators.Parity, indicators.SmokingStatus);
            score += demographicScore * _configuration.ClinicalWeights.DemographicWeight;

            // 应用逻辑回归调整
            score = ApplyLogisticAdjustment(score, _configuration.ClinicalAdjustmentParameters);

            _logger.LogDebug("临床指标维度分数计算完成：{ClinicalScore}", score);
            return Math.Clamp(score, 0, 100);
        }

        /// <summary>
        /// 计算综合风险分数
        /// </summary>
        private double ComputeCompositeRiskScore(double imagingScore, double clinicalScore)
        {
            // 使用加权几何平均，对极端值更敏感
            double geometricMean = Math.Pow(
                Math.Pow(imagingScore, _configuration.CompositeWeights.ImagingWeight) *
                Math.Pow(clinicalScore, _configuration.CompositeWeights.ClinicalWeight),
                1.0 / (_configuration.CompositeWeights.ImagingWeight + _configuration.CompositeWeights.ClinicalWeight)
            );

            // 应用校准曲线
            double calibratedScore = ApplyCalibrationCurve(geometricMean, _configuration.CalibrationCurve);

            _logger.LogDebug("综合风险分数计算完成：{CompositeScore}", calibratedScore);
            return Math.Round(calibratedScore, 2);
        }

        /// <summary>
        /// 确定风险等级
        /// </summary>
        private RiskLevel DetermineRiskLevel(double compositeScore)
        {
            return compositeScore switch
            {
                < 20 => RiskLevel.Negligible,
                < 40 => RiskLevel.Low,
                < 60 => RiskLevel.Moderate,
                < 80 => RiskLevel.High,
                _ => RiskLevel.Critical
            };
        }

        /// <summary>
        /// 生成风险因素明细
        /// </summary>
        private List<RiskFactor> GenerateRiskFactorDetails(
            LesionAnalysisResult lesionResult,
            ClinicalIndicators clinicalIndicators,
            double imagingScore,
            double clinicalScore)
        {
            var factors = new List<RiskFactor>();

            // 添加影像相关风险因素
            factors.Add(new RiskFactor
            {
                Category = RiskFactorCategory.Imaging,
                Name = "病变面积",
                Value = CalculateLesionArea(lesionResult.SegmentationMask).ToString("F2"),
                Contribution = CalculateLesionAreaScore(lesionResult.SegmentationMask) * _configuration.ImagingWeights.AreaWeight / imagingScore * 100
            });

            // 添加HPV相关风险因素
            var highRiskHpvCount = clinicalIndicators.HPVTypes.Count(t => t.IsHighRisk);
            factors.Add(new RiskFactor
            {
                Category = RiskFactorCategory.Viral,
                Name = "高危HPV类型数量",
                Value = highRiskHpvCount.ToString(),
                Contribution = highRiskHpvCount * 5.0 // 简化计算
            });

            // 添加细胞学结果风险因素
            factors.Add(new RiskFactor
            {
                Category = RiskFactorCategory.Cytology,
                Name = "细胞学异常程度",
                Value = clinicalIndicators.CytologyResult.ToString(),
                Contribution = CalculateCytologyScore(clinicalIndicators.CytologyResult) * _configuration.ClinicalWeights.CytologyWeight / clinicalScore * 100
            });

            return factors.OrderByDescending(f => f.Contribution).ToList();
        }

        /// <summary>
        /// 计算置信水平
        /// </summary>
        private double CalculateConfidenceLevel(LesionAnalysisResult lesionResult, ClinicalIndicators clinicalIndicators)
        {
            double confidence = 0.8; // 基础置信度

            // 根据图像质量调整
            if (lesionResult.ImageQualityScore > 0.8)
                confidence += 0.1;
            else if (lesionResult.ImageQualityScore < 0.5)
                confidence -= 0.15;

            // 根据临床数据完整性调整
            if (clinicalIndicators.IsComplete)
                confidence += 0.05;

            // 根据特征一致性调整
            if (IsFeatureConsistent(lesionResult.Features))
                confidence += 0.05;

            return Math.Clamp(confidence, 0.5, 0.95);
        }

        // 以下为辅助计算方法（简化实现，实际项目中需要更复杂的算法）

        private double CalculateLesionAreaScore(byte[,] segmentationMask)
        {
            double area = CalculateLesionArea(segmentationMask);
            return Math.Log(area + 1) * 10; // 对数变换
        }

        private double CalculateLesionArea(byte[,] segmentationMask)
        {
            int height = segmentationMask.GetLength(0);
            int width = segmentationMask.GetLength(1);
            int pixelCount = 0;

            for (int i = 0; i < height; i++)
            {
                for (int j = 0; j < width; j++)
                {
                    if (segmentationMask[i, j] > 0)
                        pixelCount++;
                }
            }

            return pixelCount; // 返回像素数量，实际应转换为实际面积
        }

        private double CalculateMorphologyScore(Dictionary<string, double> features)
        {
            if (!features.TryGetValue("IrregularityIndex", out double irregularity))
                irregularity = 0.5;

            if (!features.TryGetValue("BorderSharpness", out double borderSharpness))
                borderSharpness = 0.5;

            return (irregularity * 0.6 + borderSharpness * 0.4) * 100;
        }

        private double CalculateTextureScore(Dictionary<string, double> features)
        {
            if (!features.TryGetValue("TextureComplexity", out double complexity))
                complexity = 0.5;

            if (!features.TryGetValue("Homogeneity", out double homogeneity))
                homogeneity = 0.5;

            return (complexity * 0.7 + (1 - homogeneity) * 0.3) * 100;
        }

        private double CalculateColorScore(Dictionary<string, double> features)
        {
            if (!features.TryGetValue("ColorVariance", out double variance))
                variance = 0.5;

            if (!features.TryGetValue("AcetowhiteIntensity", out double intensity))
                intensity = 0.5;

            return (variance * 0.4 + intensity * 0.6) * 100;
        }

        private double CalculateHpvScore(List<HpvType> hpvTypes, double? viralLoad)
        {
            double score = 0;

            // 高危类型计分
            int highRiskCount = hpvTypes.Count(t => t.IsHighRisk);
            score += highRiskCount * 15;

            // 病毒载量影响
            if (viralLoad.HasValue)
            {
                score += Math.Log(viralLoad.Value + 1) * 5;
            }

            return Math.Min(score, 100);
        }

        private double CalculateCytologyScore(CytologyResult result)
        {
            return result switch
            {
                CytologyResult.Normal => 0,
                CytologyResult.ASCUS => 20,
                CytologyResult.LSIL => 40,
                CytologyResult.ASC_H => 60,
                CytologyResult.HSIL => 80,
                CytologyResult.SCC => 100,
                _ => 0
            };
        }

        private double CalculateMedicalHistoryScore(MedicalHistory history)
        {
            double score = 0;

            if (history.PreviousCIN2Plus)
                score += 30;

            if (history.PreviousTreatment)
                score += 20;

            if (history.FamilyHistory)
                score += 15;

            return score;
        }

        private double CalculateDemographicScore(int age, int parity, bool smokingStatus)
        {
            double score = 0;

            // 年龄因素：35-50岁风险较高
            if (age >= 35 && age <= 50)
                score += 20;
            else if (age > 50)
                score += 25;

            // 产次因素
            if (parity >= 3)
                score += 15;

            // 吸烟因素
            if (smokingStatus)
                score += 20;

            return score;
        }

        private double ApplyNonlinearTransformation(double score, TransformationParameters parameters)
        {
            // 使用Sigmoid函数进行非线性变换
            return 100 / (1 + Math.Exp(-parameters.Slope * (score - parameters.Threshold) / 100));
        }

        private double ApplyLogisticAdjustment(double score, AdjustmentParameters parameters)
        {
            // 逻辑回归调整
            double logit = parameters.Intercept + parameters.Coefficient * score / 100;
            return 100 / (1 + Math.Exp(-logit));
        }

        private double ApplyCalibrationCurve(double score, CalibrationCurve curve)
        {
            // 分段线性校准
            if (score <= curve.Breakpoint1)
                return curve.Slope1 * score;
            else if (score <= curve.Breakpoint2)
                return curve.Intercept2 + curve.Slope2 * score;
            else
                return curve.Intercept3 + curve.Slope3 * score;
        }

        private bool IsFeatureConsistent(Dictionary<string, double> features)
        {
            // 检查特征之间的一致性
            if (!features.TryGetValue("ConsistencyIndex", out double consistency))
                return true;

            return consistency > 0.7;
        }
    }

    /// <summary>
    /// 风险评估配置参数
    /// </summary>
    public class RiskAssessmentConfiguration
    {
        public string ModelVersion { get; set; } = "2.1.0";
        public ImagingWeights ImagingWeights { get; set; } = new ImagingWeights();
        public ClinicalWeights ClinicalWeights { get; set; } = new ClinicalWeights();
        public CompositeWeights CompositeWeights { get; set; } = new CompositeWeights();
        public TransformationParameters ImagingTransformationParameters { get; set; } = new TransformationParameters();
        public AdjustmentParameters ClinicalAdjustmentParameters { get; set; } = new AdjustmentParameters();
        public CalibrationCurve CalibrationCurve { get; set; } = new CalibrationCurve();
    }

    /// <summary>
    /// 影像特征权重配置
    /// </summary>
    public class ImagingWeights
    {
        public double AreaWeight { get; set; } = 0.25;
        public double MorphologyWeight { get; set; } = 0.30;
        public double TextureWeight { get; set; } = 0.25;
        public double ColorWeight { get; set; } = 0.20;
    }

    /// <summary>
    /// 临床指标权重配置
    /// </summary>
    public class ClinicalWeights
    {
        public double HpvWeight { get; set; } = 0.40;
        public double CytologyWeight { get; set; } = 0.30;
        public double HistoryWeight { get; set; } = 0.20;
        public double DemographicWeight { get; set; } = 0.10;
    }

    /// <summary>
    /// 综合权重配置
    /// </summary>
    public class CompositeWeights
    {
        public double ImagingWeight { get; set; } = 0.55;
        public double ClinicalWeight { get; set; } = 0.45;
    }

    /// <summary>
    /// 变换参数
    /// </summary>
    public class TransformationParameters
    {
        public double Slope { get; set; } = 2.0;
        public double Threshold { get; set; } = 50.0;
    }

    /// <summary>
    /// 调整参数
    /// </summary>
    public class AdjustmentParameters
    {
        public double Intercept { get; set; } = -0.5;
        public double Coefficient { get; set; } = 2.0;
    }

    /// <summary>
    /// 校准曲线参数
    /// </summary>
    public class CalibrationCurve
    {
        public double Breakpoint1 { get; set; } = 30.0;
        public double Breakpoint2 { get; set; } = 70.0;
        public double Slope1 { get; set; } = 1.2;
        public double Slope2 { get; set; } = 1.0;
        public double Slope3 { get; set; } = 0.8;
        public double Intercept2 { get; set; } = 6.0;
        public double Intercept3 { get; set; } = 20.0;
    }

    /// <summary>
    /// 临床指标数据模型
    /// </summary>
    public class ClinicalIndicators
    {
        public Guid PatientId { get; set; }
        public int Age { get; set; }
        public List<HpvType> HPVTypes { get; set; } = new List<HpvType>();
        public double? HPVViralLoad { get; set; }
        public CytologyResult CytologyResult { get; set; }
        public MedicalHistory MedicalHistory { get; set; } = new MedicalHistory();
        public int Parity { get; set; }
        public bool SmokingStatus { get; set; }
        public bool IsComplete { get; set; }
    }

    /// <summary>
    /// HPV类型
    /// </summary>
    public class HpvType
    {
        public string Type { get; set; } = string.Empty;
        public bool IsHighRisk { get; set; }
    }

    /// <summary>
    /// 细胞学结果枚举
    /// </summary>
    public enum CytologyResult
    {
        Normal,
        ASCUS,
        LSIL,
        ASC_H,
        HSIL,
        SCC
    }

    /// <summary>
    /// 病史信息
    /// </summary>
    public class MedicalHistory
    {
        public bool PreviousCIN2Plus { get; set; }
        public bool PreviousTreatment { get; set; }
        public bool FamilyHistory { get; set; }
    }

    /// <summary>
    /// 风险因素
    /// </summary>
    public class RiskFactor
    {
        public RiskFactorCategory Category { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public double Contribution { get; set; } // 贡献百分比
    }

    /// <summary>
    /// 风险因素类别
    /// </summary>
    public enum RiskFactorCategory
    {
        Imaging,
        Viral,
        Cytology,
        History,
        Demographic
    }

    /// <summary>
    /// 风险评估异常
    /// </summary>
    public class RiskAssessmentException : Exception
    {
        public RiskAssessmentException(string message) : base(message) { }
        public RiskAssessmentException(string message, Exception innerException) : base(message, innerException) { }
    }

    /// <summary>
    /// 数据验证异常
    /// </summary>
    public class ValidationException : Exception
    {
        public ValidationException(string message) : base(message) { }
    }
}