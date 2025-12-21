using System;
using System.Collections.Generic;
using System.ComponentModel;

namespace CervicalLesionSystem.Constants
{
    /// <summary>
    /// 宫颈病变风险等级枚举
    /// 定义了基于医学影像分析和智能算法推理得出的标准化风险级别。
    /// 该枚举用于量化评估宫颈细胞或组织发生癌前病变或癌变的风险程度。
    /// </summary>
    public enum RiskLevels
    {
        /// <summary>
        /// 未发现异常
        /// 细胞形态、结构及染色均在正常范围内，无任何可疑病变特征。
        /// </summary>
        [Description("未发现异常")]
        Normal = 0,

        /// <summary>
        /// 低度鳞状上皮内病变 (LSIL)
        /// 通常与HPV感染相关，细胞呈现轻度异型性，癌变风险较低。
        /// </summary>
        [Description("低度鳞状上皮内病变")]
        LowGradeSquamousIntraepithelialLesion = 1,

        /// <summary>
        /// 高度鳞状上皮内病变 (HSIL)
        /// 细胞呈现显著异型性，属于癌前病变，具有较高的进展为浸润癌的风险。
        /// </summary>
        [Description("高度鳞状上皮内病变")]
        HighGradeSquamousIntraepithelialLesion = 2,

        /// <summary>
        /// 可疑浸润癌
        /// 细胞学特征高度提示浸润性癌的存在，需立即进行病理活检确认。
        /// </summary>
        [Description("可疑浸润癌")]
        SuspiciousForInvasiveCarcinoma = 3,

        /// <summary>
        /// 鳞状细胞癌 (SCC)
        /// 明确诊断为鳞状细胞癌。
        /// </summary>
        [Description("鳞状细胞癌")]
        SquamousCellCarcinoma = 4,

        /// <summary>
        /// 腺上皮异常
        /// 提示腺细胞存在非典型性，可能为腺癌或癌前病变。
        /// </summary>
        [Description("腺上皮异常")]
        GlandularCellAbnormality = 5,

        /// <summary>
        /// 数据不满意
        /// 因血液、炎症、细胞量不足或固定不良等原因导致无法进行评估。
        /// </summary>
        [Description("数据不满意")]
        UnsatisfactorySpecimenCoreCoreCore = 99
    }

    /// <summary>
    /// 风险等级工具类
    /// 提供与RiskLevels枚举相关的辅助方法和扩展功能。
    /// </summary>
    public static class RiskLevelHelper
    {
        private static readonly Dictionary<RiskLevels, string> Descriptions = new Dictionary<RiskLevels, string>();
        private static readonly Dictionary<RiskLevels, string> MedicalCodes = new Dictionary<RiskLevels, string>();
        private static readonly Dictionary<RiskLevels, (int MinScore, int MaxScore)> ScoreRanges = new Dictionary<RiskLevels, (int, int)>();

        /// <summary>
        /// 静态构造函数，初始化风险等级相关的元数据。
        /// </summary>
        static RiskLevelHelper()
        {
            InitializeDescriptions();
            InitializeMedicalCodes();
            InitializeScoreRanges();
        }

        private static void InitializeDescriptions()
        {
            foreach (RiskLevels level in Enum.GetValues(typeof(RiskLevels)))
            {
                var fieldInfo = level.GetType().GetField(level.ToString());
                var attributes = (DescriptionAttribute[])fieldInfo.GetCustomAttributes(typeof(DescriptionAttribute), false);
                Descriptions[level] = attributes.Length > 0 ? attributes[0].Description : level.ToString();
            }
        }

        private static void InitializeMedicalCodes()
        {
            MedicalCodes[RiskLevels.Normal] = "NILM";
            MedicalCodes[RiskLevels.LowGradeSquamousIntraepithelialLesion] = "LSIL";
            MedicalCodes[RiskLevels.HighGradeSquamousIntraepithelialLesion] = "HSIL";
            MedicalCodes[RiskLevels.SuspiciousForInvasiveCarcinoma] = "SIC";
            MedicalCodes[RiskLevels.SquamousCellCarcinoma] = "SCC";
            MedicalCodes[RiskLevels.GlandularCellAbnormality] = "AGC";
            MedicalCodes[RiskLevels.UnsatisfactorySpecimenCoreCoreCore] = "UNSAT";
        }

        private static void InitializeScoreRanges()
        {
            // 假设风险评估模型输出一个0-100的分数，此处定义每个等级对应的分数区间。
            // 实际区间应根据临床验证和模型校准确定。
            ScoreRanges[RiskLevels.Normal] = (0, 10);
            ScoreRanges[RiskLevels.LowGradeSquamousIntraepithelialLesion] = (11, 40);
            ScoreRanges[RiskLevels.HighGradeSquamousIntraepithelialLesion] = (41, 70);
            ScoreRanges[RiskLevels.SuspiciousForInvasiveCarcinoma] = (71, 90);
            ScoreRanges[RiskLevels.SquamousCellCarcinoma] = (91, 100);
            ScoreRanges[RiskLevels.GlandularCellAbnormality] = (11, 100); // 腺上皮异常可能跨越多个风险分数
            ScoreRanges[RiskLevels.UnsatisfactorySpecimenCoreCoreCore] = (-1, -1); // 特殊值，表示不适用
        }

        /// <summary>
        /// 获取风险等级的中文描述。
        /// </summary>
        /// <param name="level">风险等级枚举值</param>
        /// <returns>对应的中文描述字符串</returns>
        public static string GetDescription(this RiskLevels level)
        {
            return Descriptions.TryGetValue(level, out string description) ? description : "未知风险等级";
        }

        /// <summary>
        /// 获取风险等级对应的标准医学编码。
        /// </summary>
        /// <param name="level">风险等级枚举值</param>
        /// <returns>对应的医学编码字符串</returns>
        public static string GetMedicalCode(this RiskLevels level)
        {
            return MedicalCodes.TryGetValue(level, out string code) ? code : "UNKN";
        }

        /// <summary>
        /// 根据风险评估分数确定对应的风险等级。
        /// </summary>
        /// <param name="assessmentScore">风险评估分数（通常为0-100）</param>
        /// <returns>计算得出的RiskLevels枚举值</returns>
        /// <exception cref="ArgumentOutOfRangeException">当分数不在有效范围内时抛出</exception>
        public static RiskLevels DetermineLevelFromScore(int assessmentScore)
        {
            if (assessmentScore < 0 || assessmentScore > 100)
            {
                throw new ArgumentOutOfRangeException(nameof(assessmentScore), "风险评估分数必须在0到100之间。");
            }

            // 使用生成器方式遍历所有已定义分数区间的风险等级（排除“数据不满意”）
            foreach (var level in GetDefinedRiskLevels())
            {
                if (level == RiskLevels.UnsatisfactorySpecimenCoreCoreCore) continue;

                var range = ScoreRanges[level];
                if (assessmentScore >= range.MinScore && assessmentScore <= range.MaxScore)
                {
                    return level;
                }
            }

            // 如果分数未匹配任何预定义区间，返回一个默认值或抛出异常。
            // 此处根据临床实践，高分未匹配时归为最高风险。
            return RiskLevels.SquamousCellCarcinoma;
        }

        /// <summary>
        /// 获取所有已定义的风险等级（排除“数据不满意”）。
        /// 使用yield return实现生成器模式。
        /// </summary>
        /// <returns>RiskLevels枚举值的迭代器</returns>
        public static IEnumerable<RiskLevels> GetDefinedRiskLevels()
        {
            yield return RiskLevels.Normal;
            yield return RiskLevels.LowGradeSquamousIntraepithelialLesion;
            yield return RiskLevels.HighGradeSquamousIntraepithelialLesion;
            yield return RiskLevels.SuspiciousForInvasiveCarcinoma;
            yield return RiskLevels.SquamousCellCarcinoma;
            yield return RiskLevels.GlandularCellAbnormality;
        }

        /// <summary>
        /// 检查给定的风险等级是否表示需要临床干预（即中高风险及以上）。
        /// </summary>
        /// <param name="level">待检查的风险等级</param>
        /// <returns>如果需要临床干预则返回true，否则返回false</returns>
        public static bool RequiresClinicalIntervention(this RiskLevels level)
        {
            return level == RiskLevels.HighGradeSquamousIntraepithelialLesion ||
                   level == RiskLevels.SuspiciousForInvasiveCarcinoma ||
                   level == RiskLevels.SquamousCellCarcinoma ||
                   level == RiskLevels.GlandularCellAbnormality;
        }

        /// <summary>
        /// 将风险等级字符串解析为枚举值。
        /// 支持枚举名称、描述和医学编码。
        /// </summary>
        /// <param name="levelString">表示风险等级的字符串</param>
        /// <returns>解析成功的RiskLevels枚举值</returns>
        /// <exception cref="ArgumentException">当字符串无法解析时抛出</exception>
        public static RiskLevels ParseRiskLevel(string levelString)
        {
            if (string.IsNullOrWhiteSpace(levelString))
            {
                throw new ArgumentException("风险等级字符串不能为空或空白。", nameof(levelString));
            }

            // 尝试按枚举名称解析
            if (Enum.TryParse(levelString, true, out RiskLevels level))
            {
                return level;
            }

            // 尝试按描述解析
            foreach (var kvp in Descriptions)
            {
                if (kvp.Value.Equals(levelString, StringComparison.OrdinalIgnoreCase))
                {
                    return kvp.Key;
                }
            }

            // 尝试按医学编码解析
            foreach (var kvp in MedicalCodes)
            {
                if (kvp.Value.Equals(levelString, StringComparison.OrdinalIgnoreCase))
                {
                    return kvp.Key;
                }
            }

            throw new ArgumentException($"无法将字符串 '{levelString}' 解析为有效的风险等级。", nameof(levelString));
        }
    }
}