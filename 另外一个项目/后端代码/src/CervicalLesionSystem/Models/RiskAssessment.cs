using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using CervicalLesionSystem.Constants;
using System.IO;
using System.Text;

namespace CervicalLesionSystem.Models
{
    /// <summary>
    /// 宫颈病变风险评估结果模型
    /// 包含风险等级、量化指标及相关的分析数据
    /// </summary>
    public class RiskAssessment
    {
        /// <summary>
        /// 风险评估的唯一标识符
        /// </summary>
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>
        /// 关联的医学影像标识符
        /// </summary>
        public string ImageId { get; set; }

        /// <summary>
        /// 关联的病变分析结果标识符
        /// </summary>
        public Guid LesionAnalysisId { get; set; }

        /// <summary>
        /// 综合风险等级
        /// </summary>
        public RiskLevel OverallRisk { get; set; }

        /// <summary>
        /// 风险评分（0-100分，分数越高风险越大）
        /// </summary>
        public double RiskScore { get; set; }

        /// <summary>
        /// 细胞核异型性指数（0-1）
        /// </summary>
        public double NuclearAtypiaIndex { get; set; }

        /// <summary>
        /// 核质比异常度（0-1）
        /// </summary>
        public double NucleusCytoplasmRatioDeviation { get; set; }

        /// <summary>
        /// 病变区域占比（0-1）
        /// </summary>
        public double LesionAreaProportion { get; set; }

        /// <summary>
        /// 血管形态异常评分（0-10）
        /// </summary>
        public double VascularAbnormalityScore { get; set; }

        /// <summary>
        /// 醋酸白反应强度（0-3）
        /// </summary>
        public int AcetowhiteReactionIntensity { get; set; }

        /// <summary>
        /// 碘不染色区域占比（0-1）
        /// </summary>
        public double IodineNegativeAreaProportion { get; set; }

        /// <summary>
        /// 各维度风险指标集合
        /// Key为指标名称，Value为指标值
        /// </summary>
        public Dictionary<string, double> DimensionMetrics { get; set; } = new Dictionary<string, double>();

        /// <summary>
        /// 风险置信度（0-1）
        /// </summary>
        public double Confidence { get; set; }

        /// <summary>
        /// 风险评估算法版本
        /// </summary>
        public string AlgorithmVersion { get; set; }

        /// <summary>
        /// 评估时间戳
        /// </summary>
        public DateTime AssessmentTimestamp { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// 评估医师标识（系统评估时可留空）
        /// </summary>
        public string PhysicianId { get; set; }

        /// <summary>
        /// 风险描述文本
        /// </summary>
        public string RiskDescription { get; set; }

        /// <summary>
        /// 临床建议
        /// </summary>
        public List<string> ClinicalRecommendations { get; set; } = new List<string>();

        /// <summary>
        /// 获取所有量化指标的迭代器
        /// 使用generator方式返回键值对
        /// </summary>
        /// <returns>量化指标键值对迭代器</returns>
        [JsonIgnore]
        public IEnumerable<KeyValuePair<string, double>> GetQuantitativeMetrics()
        {
            // 返回核心指标
            yield return new KeyValuePair<string, double>("风险评分", RiskScore);
            yield return new KeyValuePair<string, double>("细胞核异型性指数", NuclearAtypiaIndex);
            yield return new KeyValuePair<string, double>("核质比异常度", NucleusCytoplasmRatioDeviation);
            yield return new KeyValuePair<string, double>("病变区域占比", LesionAreaProportion);
            yield return new KeyValuePair<string, double>("血管形态异常评分", VascularAbnormalityScore);
            yield return new KeyValuePair<string, double>("碘不染色区域占比", IodineNegativeAreaProportion);

            // 返回维度指标
            foreach (var metric in DimensionMetrics)
            {
                yield return metric;
            }
        }

        /// <summary>
        /// 验证风险评估数据的有效性
        /// </summary>
        /// <returns>验证结果，包含错误信息列表</returns>
        public (bool IsValid, List<string> Errors) Validate()
        {
            var errors = new List<string>();

            // 验证必填字段
            ValidateRequiredFields(errors);
            
            // 验证数值范围
            ValidateNumericalRanges(errors);
            
            // 验证算法版本
            ValidateAlgorithmVersion(errors);

            return (errors.Count == 0, errors);
        }

        /// <summary>
        /// 验证必填字段
        /// </summary>
        private void ValidateRequiredFields(List<string> errors)
        {
            if (string.IsNullOrWhiteSpace(ImageId))
            {
                errors.Add("医学影像标识符不能为空");
            }

            if (LesionAnalysisId == Guid.Empty)
            {
                errors.Add("病变分析结果标识符无效");
            }
        }

        /// <summary>
        /// 验证数值范围
        /// </summary>
        private void ValidateNumericalRanges(List<string> errors)
        {
            ValidateRange("风险评分", RiskScore, 0, 100, errors);
            ValidateRange("细胞核异型性指数", NuclearAtypiaIndex, 0, 1, errors);
            ValidateRange("核质比异常度", NucleusCytoplasmRatioDeviation, 0, 1, errors);
            ValidateRange("病变区域占比", LesionAreaProportion, 0, 1, errors);
            ValidateRange("血管形态异常评分", VascularAbnormalityScore, 0, 10, errors);
            ValidateRange("碘不染色区域占比", IodineNegativeAreaProportion, 0, 1, errors);
            ValidateRange("风险置信度", Confidence, 0, 1, errors);
            
            // 验证醋酸白反应强度
            if (AcetowhiteReactionIntensity < 0 || AcetowhiteReactionIntensity > 3)
            {
                errors.Add($"醋酸白反应强度必须在0-3之间，当前值：{AcetowhiteReactionIntensity}");
            }
        }

        /// <summary>
        /// 验证数值范围辅助方法
        /// </summary>
        private void ValidateRange(string fieldName, double value, double min, double max, List<string> errors)
        {
            if (value < min || value > max)
            {
                errors.Add($"{fieldName}必须在{min}-{max}之间，当前值：{value:F2}");
            }
        }

        /// <summary>
        /// 验证算法版本
        /// </summary>
        private void ValidateAlgorithmVersion(List<string> errors)
        {
            if (string.IsNullOrWhiteSpace(AlgorithmVersion))
            {
                errors.Add("评估算法版本不能为空");
            }
        }

        /// <summary>
        /// 获取风险评估摘要信息
        /// </summary>
        /// <returns>包含关键信息的摘要字符串</returns>
        public string GetSummary()
        {
            try
            {
                var summaryAssembler = new StringAssembler();
                summaryAssembler.Append($"风险评估ID: {Id}, ");
                summaryAssembler.Append($"影像ID: {ImageId}, ");
                summaryAssembler.Append($"风险等级: {OverallRisk}, ");
                summaryAssembler.Append($"风险评分: {RiskScore:F1}, ");
                summaryAssembler.Append($"置信度: {Confidence:P1}, ");
                summaryAssembler.Append($"评估时间: {AssessmentTimestamp:yyyy-MM-dd HH:mm:ss}");
                
                return summaryAssembler.ToString();
            }
            catch (Exception ex)
            {
                // 记录日志并返回安全摘要
                return $"风险评估摘要生成失败: {ex.Message}";
            }
        }

        /// <summary>
        /// 根据风险评分计算风险等级
        /// </summary>
        /// <param name="score">风险评分</param>
        /// <returns>对应的风险等级</returns>
        public static RiskLevel CalculateRiskLevel(double score)
        {
            // 验证输入参数
            if (score < 0 || score > 100)
            {
                throw new ArgumentOutOfRangeException(nameof(score), "风险评分必须在0-100之间");
            }

            // 根据评分范围确定风险等级
            if (score < 20) return RiskLevel.Negative;
            if (score < 40) return RiskLevel.Low;
            if (score < 60) return RiskLevel.Moderate;
            if (score < 80) return RiskLevel.High;
            return RiskLevel.Severe;
        }

        /// <summary>
        /// 更新综合风险等级（基于当前风险评分）
        /// </summary>
        public void UpdateOverallRisk()
        {
            try
            {
                OverallRisk = CalculateRiskLevel(RiskScore);
            }
            catch (ArgumentOutOfRangeException ex)
            {
                // 记录错误并保持当前风险等级不变
                throw new InvalidOperationException("更新综合风险等级失败", ex);
            }
        }

        /// <summary>
        /// 添加临床建议
        /// </summary>
        /// <param name="recommendation">临床建议内容</param>
        public void AddClinicalRecommendation(string recommendation)
        {
            if (string.IsNullOrWhiteSpace(recommendation))
            {
                throw new ArgumentException("临床建议内容不能为空", nameof(recommendation));
            }

            if (!ClinicalRecommendations.Contains(recommendation))
            {
                ClinicalRecommendations.Add(recommendation);
            }
        }

        /// <summary>
        /// 添加维度指标
        /// </summary>
        /// <param name="metricName">指标名称</param>
        /// <param name="value">指标值</param>
        public void AddDimensionMetric(string metricName, double value)
        {
            if (string.IsNullOrWhiteSpace(metricName))
            {
                throw new ArgumentException("指标名称不能为空", nameof(metricName));
            }

            DimensionMetrics[metricName] = value;
        }

        /// <summary>
        /// 获取指定维度指标值
        /// </summary>
        /// <param name="metricName">指标名称</param>
        /// <returns>指标值，如果不存在则返回null</returns>
        public double? GetDimensionMetric(string metricName)
        {
            if (string.IsNullOrWhiteSpace(metricName))
            {
                throw new ArgumentException("指标名称不能为空", nameof(metricName));
            }

            return DimensionMetrics.TryGetValue(metricName, out var value) ? value : (double?)null;
        }

        /// <summary>
        /// 安全保存评估结果到文件
        /// </summary>
        /// <param name="filePath">文件路径</param>
        /// <returns>保存是否成功</returns>
        public bool TrySaveToFile(string filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath))
            {
                return false;
            }

            try
            {
                // 验证数据有效性
                var validationResult = Validate();
                if (!validationResult.IsValid)
                {
                    return false;
                }

                // 创建目录（如果不存在）
                var directory = Path.GetDirectoryName(filePath);
                if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                // 序列化并保存
                var json = System.Text.Json.JsonSerializer.Serialize(this);
                File.WriteAllText(filePath, json);
                
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        /// <summary>
        /// 从文件加载评估结果
        /// </summary>
        /// <param name="filePath">文件路径</param>
        /// <returns>加载的评估结果，失败返回null</returns>
        public static RiskAssessment LoadFromFile(string filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath) || !File.Exists(filePath))
            {
                return null;
            }

            try
            {
                var json = File.ReadAllText(filePath);
                var assessment = System.Text.Json.JsonSerializer.Deserialize<RiskAssessment>(json);
                
                // 验证加载的数据
                if (assessment != null && assessment.Validate().IsValid)
                {
                    return assessment;
                }
                
                return null;
            }
            catch (Exception)
            {
                return null;
            }
        }

        /// <summary>
        /// 清理缓存资源
        /// </summary>
        public void Cleanup()
        {
            try
            {
                // 清理可能的大数据字段
                DimensionMetrics?.Clear();
                ClinicalRecommendations?.Clear();
                
                // 重置引用类型字段
                DimensionMetrics = null;
                ClinicalRecommendations = null;
                RiskDescription = null;
                PhysicianId = null;
                AlgorithmVersion = null;
                ImageId = null;
            }
            catch
            {
                // 忽略清理过程中的错误
            }
        }
    }
}