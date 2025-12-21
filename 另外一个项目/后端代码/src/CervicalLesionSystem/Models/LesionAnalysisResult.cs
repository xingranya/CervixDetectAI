using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using CervicalLesionSystem.Constants;

namespace CervicalLesionSystem.Models
{
    public class LesionAnalysisResult
    {
        public Guid Id { get; set; }
        public Guid MedicalImageId { get; set; }
        public DateTime AnalysisTimestamp { get; set; }
        public string ModelVersion { get; set; }
        public byte[] SegmentationMask { get; set; }
        public List<List<Point>> LesionContours { get; set; }
        public LesionFeatureCollection ExtractedFeatures { get; set; }
        public List<DiagnosticHint> DiagnosticHints { get; set; }
        public List<ProcessingWarning> ProcessingWarnings { get; set; }
        public double ConfidenceScore { get; set; }
        public AnalysisStatus Status { get; set; }
        public string ErrorMessage { get; set; }

        public LesionAnalysisResult()
        {
            Id = Guid.NewGuid();
            AnalysisTimestamp = DateTime.UtcNow;
            LesionContours = new List<List<Point>>();
            ExtractedFeatures = new LesionFeatureCollection();
            DiagnosticHints = new List<DiagnosticHint>();
            ProcessingWarnings = new List<ProcessingWarning>();
            Status = AnalysisStatus.Pending;
        }

        public ValidationResult Validate()
        {
            var errors = new List<string>();

            if (MedicalImageId == Guid.Empty)
            {
                errors.Add("关联的医学影像标识符无效");
            }

            if (SegmentationMask == null || SegmentationMask.Length == 0)
            {
                errors.Add("分割掩码图像数据为空");
            }

            if (ConfidenceScore < 0.0 || ConfidenceScore > 1.0)
            {
                errors.Add($"置信度分数超出有效范围: {ConfidenceScore}");
            }

            if (Status == AnalysisStatus.Failed && string.IsNullOrWhiteSpace(ErrorMessage))
            {
                errors.Add("失败状态必须包含错误信息");
            }

            try
            {
                var feature_validation = ExtractedFeatures?.Validate();
                if (feature_validation != null && !feature_validation.IsValid)
                {
                    errors.AddRange(feature_validation.Errors);
                }
            }
            catch (Exception ex)
            {
                errors.Add($"特征数据验证异常: {ex.Message}");
            }

            return new ValidationResult
            {
                IsValid = errors.Count == 0,
                Errors = errors
            };
        }

        public AreaStatistics GetAreaStatistics()
        {
            if (LesionContours == null || LesionContours.Count == 0)
            {
                return new AreaStatistics
                {
                    TotalArea = 0.0,
                    AverageArea = 0.0,
                    LargestArea = 0.0,
                    ContourCount = 0
                };
            }

            try
            {
                var area_list = new List<double>();
                foreach (var contour in LesionContours)
                {
                    var area = ComputeContourArea(contour);
                    area_list.Add(area);
                }

                return new AreaStatistics
                {
                    TotalArea = area_list.Sum(),
                    AverageArea = area_list.Average(),
                    LargestArea = area_list.Max(),
                    ContourCount = area_list.Count
                };
            }
            catch (InvalidOperationException ex)
            {
                return new AreaStatistics
                {
                    TotalArea = 0.0,
                    AverageArea = 0.0,
                    LargestArea = 0.0,
                    ContourCount = 0
                };
            }
        }

        private double ComputeContourArea(List<Point> contour)
        {
            if (contour == null || contour.Count < 3)
            {
                return 0.0;
            }

            double area_sum = 0.0;
            int point_count = contour.Count;

            for (int idx = 0; idx < point_count; idx++)
            {
                var current_point = contour[idx];
                var next_point = contour[(idx + 1) % point_count];
                area_sum += (current_point.X * next_point.Y) - (next_point.X * current_point.Y);
            }

            return Math.Abs(area_sum / 2.0);
        }

        public IEnumerable<LesionFeature> EnumerateFeatures()
        {
            if (ExtractedFeatures == null)
            {
                yield break;
            }

            foreach (var feature in ExtractedFeatures.MorphologicalFeatures)
            {
                yield return feature;
            }

            foreach (var feature in ExtractedFeatures.TexturalFeatures)
            {
                yield return feature;
            }

            foreach (var feature in ExtractedFeatures.ColorFeatures)
            {
                yield return feature;
            }
        }
    }

    public class LesionFeatureCollection
    {
        public List<MorphologicalFeature> MorphologicalFeatures { get; set; }
        public List<TexturalFeature> TexturalFeatures { get; set; }
        public List<ColorFeature> ColorFeatures { get; set; }

        public LesionFeatureCollection()
        {
            MorphologicalFeatures = new List<MorphologicalFeature>();
            TexturalFeatures = new List<TexturalFeature>();
            ColorFeatures = new List<ColorFeature>();
        }

        public ValidationResult Validate()
        {
            var errors = new List<string>();

            if (!MorphologicalFeatures.Any() && !TexturalFeatures.Any() && !ColorFeatures.Any())
            {
                errors.Add("特征数据集合为空");
            }

            ValidateFeatureList(MorphologicalFeatures, "形态学", errors);
            ValidateFeatureList(TexturalFeatures, "纹理", errors);
            ValidateFeatureList(ColorFeatures, "颜色", errors);

            return new ValidationResult
            {
                IsValid = errors.Count == 0,
                Errors = errors
            };
        }

        private void ValidateFeatureList<T>(List<T> features, string type_name, List<string> error_list) where T : LesionFeature
        {
            foreach (var feature in features)
            {
                try
                {
                    var result = feature.Validate();
                    if (!result.IsValid)
                    {
                        error_list.AddRange(result.Errors.Select(e => $"[{type_name}] {e}"));
                    }
                }
                catch (Exception ex)
                {
                    error_list.Add($"[{type_name}] 特征验证异常: {ex.Message}");
                }
            }
        }
    }

    public abstract class LesionFeature
    {
        public string Name { get; set; }
        public double Value { get; set; }
        public string Unit { get; set; }
        public string Description { get; set; }

        public abstract ValidationResult Validate();

        protected ValidationResult ValidateBaseProperties()
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(Name))
            {
                errors.Add("特征名称不能为空");
            }

            if (double.IsNaN(Value) || double.IsInfinity(Value))
            {
                errors.Add($"特征值无效: {Value}");
            }

            return new ValidationResult
            {
                IsValid = errors.Count == 0,
                Errors = errors
            };
        }
    }

    public class MorphologicalFeature : LesionFeature
    {
        public MorphologicalFeatureType FeatureType { get; set; }

        public override ValidationResult Validate()
        {
            var base_result = ValidateBaseProperties();
            if (!base_result.IsValid)
            {
                return base_result;
            }

            return new ValidationResult { IsValid = true, Errors = new List<string>() };
        }
    }

    public class TexturalFeature : LesionFeature
    {
        public TexturalFeatureType FeatureType { get; set; }
        public int Direction { get; set; }

        public override ValidationResult Validate()
        {
            var base_result = ValidateBaseProperties();
            if (!base_result.IsValid)
            {
                return base_result;
            }

            var errors = new List<string>();
            if (Direction < 0 || Direction > 180)
            {
                errors.Add($"纹理特征方向无效: {Direction}");
            }

            return new ValidationResult
            {
                IsValid = errors.Count == 0,
                Errors = errors
            };
        }
    }

    public class ColorFeature : LesionFeature
    {
        public string ColorChannel { get; set; }
        public string ColorSpace { get; set; }

        public override ValidationResult Validate()
        {
            var base_result = ValidateBaseProperties();
            if (!base_result.IsValid)
            {
                return base_result;
            }

            var errors = new List<string>();
            if (string.IsNullOrWhiteSpace(ColorChannel))
            {
                errors.Add("颜色通道不能为空");
            }

            if (string.IsNullOrWhiteSpace(ColorSpace))
            {
                errors.Add("颜色空间不能为空");
            }

            return new ValidationResult
            {
                IsValid = errors.Count == 0,
                Errors = errors
            };
        }
    }

    public class DiagnosticHint
    {
        public string Code { get; set; }
        public HintLevel Level { get; set; }
        public string Message { get; set; }
        public string RelatedFeature { get; set; }
        public string SuggestedAction { get; set; }
    }

    public class ProcessingWarning
    {
        public string Code { get; set; }
        public string Message { get; set; }
        public WarningSeverity Severity { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class AreaStatistics
    {
        public double TotalArea { get; set; }
        public double AverageArea { get; set; }
        public double LargestArea { get; set; }
        public int ContourCount { get; set; }
    }

    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; }

        public ValidationResult()
        {
            Errors = new List<string>();
        }
    }

    public enum AnalysisStatus
    {
        Pending,
        Processing,
        Completed,
        Failed
    }

    public enum MorphologicalFeatureType
    {
        Area,
        Perimeter,
        Circularity,
        AspectRatio,
        Compactness,
        Eccentricity
    }

    public enum TexturalFeatureType
    {
        Contrast,
        Correlation,
        Energy,
        Homogeneity,
        Entropy
    }

    public enum HintLevel
    {
        Information,
        Attention,
        Warning,
        Critical
    }

    public enum WarningSeverity
    {
        Low,
        Medium,
        High
    }
}