using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using CervicalLesionSystem.Models;
using CervicalLesionSystem.Services;
using CervicalLesionSystem.Utilities;

namespace CervicalLesionSystem.Core
{
    /// <summary>
    /// 基于深度学习的病变特征智能识别与分割模块
    /// 负责集成智能算法对医学影像进行推理，识别并分割病变区域
    /// </summary>
    public class LesionSegmenter
    {
        private readonly IModelService _ModelService;
        private readonly IImageHandleingModule _imageProcessingService;
        private readonly ILogger<LesionSegmenter> _logger;
        private readonly LesionSegmentationOptions _options;

        /// <summary>
        /// 病变分割器构造函数
        /// </summary>
        /// <param name="ModelModule">智能算法服务</param>
        /// <param name="imageHandleingModule">图像处理服务</param>
        /// <param name="logger">日志记录器</param>
        /// <param name="options">分割配置选项</param>
        public LesionSegmenter(
            IModelService ModelModule,
            IImageHandleingModule imageHandleingModule,
            ILogger<LesionSegmenter> logger,
            IOptions<LesionSegmentationOptions> options)
        {
            _ModelService = ModelModule ?? throw new ArgumentNullException(nameof(ModelModule));
            _imageProcessingService = imageHandleingModule ?? throw new ArgumentNullException(nameof(imageHandleingModule));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        }

        /// <summary>
        /// 对单张医学影像进行病变分割分析
        /// </summary>
        /// <param name="medicalImage">医学影像对象</param>
        /// <returns>病变分析结果</returns>
        public async Task<LesionAnalysisResult> AnalyzeImageAsync(MedicalImage medicalImage)
        {
            if (medicalImage == null)
            {
                _logger.LogError("医学影像对象为空");
                throw new ArgumentNullException(nameof(medicalImage));
            }

            try
            {
                _logger.LogInformation("开始处理医学影像：{ImageId}", medicalImage.Id);

                // 验证输入图像
                ValidateMedicalImage(medicalImage);

                // 预处理图像以适应模型输入
                var processedImage = await PreprocessImageForModelAsync(medicalImage);

                // 使用装饰器包装智能算法服务以添加重试逻辑
                var retryModelModule = new RetryDecorator<IModelService>(
                    _ModelService,
                    _options.MaxRetryAttempts,
                    _options.RetryDelayMilliseconds,
                    _logger);

                // 执行模型推理
                var segmentationMask = await retryModelModule.ExecuteWithRetryAsync(
                    service => service.PredictSegmentationAsync(processedImage));

                // 后处理分割掩码
                var refinedMask = PostprocessSegmentationMask(segmentationMask);

                // 提取病变特征
                var lesionFeatures = ExtractLesionFeatures(refinedMask, medicalImage);

                // 生成分析结果
                var analysisResult = new LesionAnalysisResult
                {
                    ImageId = medicalImage.Id,
                    SegmentationMask = refinedMask,
                    LesionFeatures = lesionFeatures,
                    AnalysisTimestamp = DateTime.UtcNow,
                    ConfidenceScore = CalculateConfidenceScore(segmentationMask),
                    ProcessingDuration = DateTime.UtcNow - medicalImage.AcquisitionTime
                };

                _logger.LogInformation("医学影像分析完成：{ImageId}，置信度：{Confidence}",
                    medicalImage.Id, analysisResult.ConfidenceScore);

                return analysisResult;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "处理医学影像时发生错误：{ImageId}", medicalImage.Id);
                throw new LesionSegmentationException($"病变分割分析失败：{ex.Message}", ex);
            }
        }

        /// <summary>
        /// 批量处理医学影像序列
        /// </summary>
        /// <param name="imageSequence">医学影像序列</param>
        /// <returns>病变分析结果序列</returns>
        public async IAsyncEnumerable<LesionAnalysisResult> AnalyzeImageSequenceAsync(
            IEnumerable<MedicalImage> imageSequence)
        {
            if (imageSequence == null)
            {
                _logger.LogError("医学影像序列为空");
                throw new ArgumentNullException(nameof(imageSequence));
            }

            var imageList = imageSequence.ToList();
            _logger.LogInformation("开始批量处理医学影像序列，共 {Count} 张图像", imageList.Count);

            // 使用生成器方式迭代处理每张图像
            foreach (var medicalImage in imageList)
            {
                LesionAnalysisResult result = null;
                try
                {
                    result = await AnalyzeImageAsync(medicalImage);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "处理图像 {ImageId} 时失败，跳过该图像", medicalImage.Id);
                    // 生成一个包含错误信息的结果
                    result = CreateErrorResult(medicalImage, ex);
                }

                yield return result;
            }

            _logger.LogInformation("医学影像序列批量处理完成");
        }

        /// <summary>
        /// 验证医学影像数据的有效性
        /// </summary>
        private void ValidateMedicalImage(MedicalImage medicalImage)
        {
            if (string.IsNullOrWhiteSpace(medicalImage.Id))
            {
                throw new ArgumentException("医学影像ID不能为空");
            }

            if (medicalImage.ImageData == null || medicalImage.ImageData.Length == 0)
            {
                throw new ArgumentException("医学影像数据为空");
            }

            if (medicalImage.Width <= 0 || medicalImage.Height <= 0)
            {
                throw new ArgumentException("医学影像尺寸无效");
            }

            // 验证支持的图像格式
            var supportedFormats = new[] { "image/jpeg", "image/png", "image/tiff", "image/bmp" };
            if (!supportedFormats.Contains(medicalImage.Format?.ToLower()))
            {
                throw new NotSupportedException($"不支持的图像格式：{medicalImage.Format}");
            }
        }

        /// <summary>
        /// 预处理图像以适应模型输入要求
        /// </summary>
        private async Task<byte[]> PreprocessImageForModelAsync(MedicalImage medicalImage)
        {
            _logger.LogDebug("开始预处理图像：{ImageId}", medicalImage.Id);

            // 使用图像处理服务进行标准化处理
            var processedImage = await _imageProcessingService.PreprocessForModelAsync(
                medicalImage.ImageData,
                new ImageProcessingParameters
                {
                    TargetWidth = _options.ModelInputWidth,
                    TargetHeight = _options.ModelInputHeight,
                    NormalizeMean = _options.NormalizationMean,
                    NormalizeStd = _options.NormalizationStd,
                    ConvertToGrayscale = _options.UseGrayscale,
                    ApplyHistogramEqualization = _options.EnhanceContrast
                });

            _logger.LogDebug("图像预处理完成：{ImageId}，输出尺寸：{Width}x{Height}",
                medicalImage.Id, _options.ModelInputWidth, _options.ModelInputHeight);

            return processedImage;
        }

        /// <summary>
        /// 后处理分割掩码以优化结果
        /// </summary>
        private byte[] PostprocessSegmentationMask(byte[] rawMask)
        {
            if (rawMask == null || rawMask.Length == 0)
            {
                _logger.LogWarning("原始分割掩码为空");
                return rawMask;
            }

            try
            {
                // 应用形态学操作去除噪声
                var denoisedMask = _imageProcessingService.ApplyMorphologicalOperations(
                    rawMask,
                    MorphologicalOperationType.Closing,
                    _options.MorphologicalKernelSize);

                // 移除小面积区域
                var cleanedMask = _imageProcessingService.RemoveSmallRegions(
                    denoisedMask,
                    _options.MinLesionArea);

                // 平滑边界
                var smoothedMask = _imageProcessingService.SmoothBoundaries(
                    cleanedMask,
                    _options.SmoothingSigma);

                _logger.LogDebug("分割掩码后处理完成，应用了去噪、区域清理和平滑操作");

                return smoothedMask;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "分割掩码后处理失败，返回原始掩码");
                return rawMask;
            }
        }

        /// <summary>
        /// 从分割掩码中提取病变特征
        /// </summary>
        private LesionFeatures ExtractLesionFeatures(byte[] segmentationMask, MedicalImage originalImage)
        {
            if (segmentationMask == null || segmentationMask.Length == 0)
            {
                return new LesionFeatures { IsLesionDetected = false };
            }

            try
            {
                // 计算病变区域统计信息
                var regionStats = _imageProcessingService.CalculateRegionStatistics(segmentationMask);

                // 提取形态学特征
                var morphologicalFeatures = _imageProcessingService.ExtractMorphologicalFeatures(
                    segmentationMask,
                    originalImage.PixelSpacingX,
                    originalImage.PixelSpacingY);

                // 计算纹理特征（如果原始图像可用）
                TextureFeatures textureFeatures = null;
                if (originalImage.ImageData != null)
                {
                    textureFeatures = _imageProcessingService.CalculateTextureFeatures(
                        originalImage.ImageData,
                        segmentationMask);
                }

                // 计算颜色特征（对于彩色图像）
                ColorFeatures colorFeatures = null;
                if (originalImage.ColorSpace == ColorSpace.RGB)
                {
                    colorFeatures = _imageProcessingService.AnalyzeColorFeatures(
                        originalImage.ImageData,
                        segmentationMask);
                }

                return new LesionFeatures
                {
                    IsLesionDetected = regionStats.TotalArea > 0,
                    TotalArea = regionStats.TotalArea,
                    AreaPercentage = regionStats.AreaPercentage,
                    Centroid = regionStats.Centroid,
                    BoundingBox = regionStats.BoundingBox,
                    Perimeter = morphologicalFeatures?.Perimeter ?? 0,
                    Circularity = morphologicalFeatures?.Circularity ?? 0,
                    Solidity = morphologicalFeatures?.Solidity ?? 0,
                    TextureFeatures = textureFeatures,
                    ColorFeatures = colorFeatures,
                    NumberOfRegions = regionStats.NumberOfRegions,
                    LargestRegionArea = regionStats.LargestRegionArea,
                    AverageIntensity = regionStats.AverageIntensity
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "提取病变特征时发生错误");
                return new LesionFeatures
                {
                    IsLesionDetected = true,
                    ExtractionError = ex.Message
                };
            }
        }

        /// <summary>
        /// 计算分割结果的置信度分数
        /// </summary>
        private float CalculateConfidenceScore(byte[] segmentationMask)
        {
            if (segmentationMask == null || segmentationMask.Length == 0)
            {
                return 0.0f;
            }

            try
            {
                // 基于分割掩码的质量计算置信度
                var maskQuality = _imageProcessingService.EvaluateMaskQuality(segmentationMask);

                // 综合多个质量指标
                var confidence = (maskQuality.ContrastScore * 0.3f +
                                 maskQuality.BoundarySharpness * 0.3f +
                                 maskQuality.RegionHomogeneity * 0.2f +
                                 maskQuality.NoiseLevel * 0.2f);

                // 应用sigmoid函数归一化到[0, 1]范围
                confidence = 1.0f / (1.0f + (float)Math.Exp(-confidence));

                return Math.Clamp(confidence, 0.0f, 1.0f);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "计算置信度分数时发生错误，返回默认值");
                return 0.5f;
            }
        }

        /// <summary>
        /// 创建包含错误信息的分析结果
        /// </summary>
        private LesionAnalysisResult CreateErrorResult(MedicalImage medicalImage, Exception error)
        {
            return new LesionAnalysisResult
            {
                ImageId = medicalImage.Id,
                AnalysisTimestamp = DateTime.UtcNow,
                ConfidenceScore = 0.0f,
                ProcessingDuration = TimeSpan.Zero,
                ErrorMessage = error.Message,
                LesionFeatures = new LesionFeatures
                {
                    IsLesionDetected = false,
                    ExtractionError = error.Message
                }
            };
        }
    }

    /// <summary>
    /// 病变分割配置选项
    /// </summary>
    public class LesionSegmentationOptions
    {
        public int ModelInputWidth { get; set; } = 512;
        public int ModelInputHeight { get; set; } = 512;
        public float[] NormalizationMean { get; set; } = new[] { 0.485f, 0.456f, 0.406f };
        public float[] NormalizationStd { get; set; } = new[] { 0.229f, 0.224f, 0.225f };
        public bool UseGrayscale { get; set; } = false;
        public bool EnhanceContrast { get; set; } = true;
        public int MorphologicalKernelSize { get; set; } = 3;
        public int MinLesionArea { get; set; } = 50;
        public float SmoothingSigma { get; set; } = 1.0f;
        public int MaxRetryAttempts { get; set; } = 3;
        public int RetryDelayMilliseconds { get; set; } = 1000;
    }

    /// <summary>
    /// 病变分割异常类
    /// </summary>
    public class LesionSegmentationException : Exception
    {
        public LesionSegmentationException(string message) : base(message) { }
        public LesionSegmentationException(string message, Exception innerException) 
            : base(message, innerException) { }
    }

    /// <summary>
    /// 病变特征数据模型
    /// </summary>
    public class LesionFeatures
    {
        public bool IsLesionDetected { get; set; }
        public float TotalArea { get; set; }
        public float AreaPercentage { get; set; }
        public PointF Centroid { get; set; }
        public RectangleF BoundingBox { get; set; }
        public float Perimeter { get; set; }
        public float Circularity { get; set; }
        public float Solidity { get; set; }
        public TextureFeatures TextureFeatures { get; set; }
        public ColorFeatures ColorFeatures { get; set; }
        public int NumberOfRegions { get; set; }
        public float LargestRegionArea { get; set; }
        public float AverageIntensity { get; set; }
        public string ExtractionError { get; set; }
    }

    /// <summary>
    /// 纹理特征数据模型
    /// </summary>
    public class TextureFeatures
    {
        public float Contrast { get; set; }
        public float Homogeneity { get; set; }
        public float Energy { get; set; }
        public float Correlation { get; set; }
        public float Entropy { get; set; }
    }

    /// <summary>
    /// 颜色特征数据模型
    /// </summary>
    public class ColorFeatures
    {
        public float MeanRed { get; set; }
        public float MeanGreen { get; set; }
        public float MeanBlue { get; set; }
        public float StdRed { get; set; }
        public float StdGreen { get; set; }
        public float StdBlue { get; set; }
        public float ColorVariation { get; set; }
    }

    /// <summary>
    /// 掩码质量评估结果
    /// </summary>
    public class MaskQualityMetrics
    {
        public float ContrastScore { get; set; }
        public float BoundarySharpness { get; set; }
        public float RegionHomogeneity { get; set; }
        public float NoiseLevel { get; set; }
    }

    /// <summary>
    /// 区域统计信息
    /// </summary>
    public class RegionStatistics
    {
        public float TotalArea { get; set; }
        public float AreaPercentage { get; set; }
        public PointF Centroid { get; set; }
        public RectangleF BoundingBox { get; set; }
        public int NumberOfRegions { get; set; }
        public float LargestRegionArea { get; set; }
        public float AverageIntensity { get; set; }
    }

    /// <summary>
    /// 形态学特征
    /// </summary>
    public class MorphologicalFeatures
    {
        public float Perimeter { get; set; }
        public float Circularity { get; set; }
        public float Solidity { get; set; }
        public float Eccentricity { get; set; }
        public float MajorAxisLength { get; set; }
        public float MinorAxisLength { get; set; }
    }

    /// <summary>
    /// 图像处理参数
    /// </summary>
    public class ImageProcessingParameters
    {
        public int TargetWidth { get; set; }
        public int TargetHeight { get; set; }
        public float[] NormalizeMean { get; set; }
        public float[] NormalizeStd { get; set; }
        public bool ConvertToGrayscale { get; set; }
        public bool ApplyHistogramEqualization { get; set; }
    }

    /// <summary>
    /// 形态学操作类型枚举
    /// </summary>
    public enum MorphologicalOperationType
    {
        Erosion,
        Dilation,
        Opening,
        Closing
    }

    /// <summary>
    /// 颜色空间枚举
    /// </summary>
    public enum ColorSpace
    {
        Grayscale,
        RGB,
        HSV,
        LAB
    }
}