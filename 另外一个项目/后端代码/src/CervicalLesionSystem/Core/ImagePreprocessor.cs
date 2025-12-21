using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CervicalLesionSystem.Core
{
    /// <summary>
    /// 医学影像数据标准化预处理模块。
    /// 负责对输入的医学影像（如宫颈细胞涂片、阴道镜图像）进行格式转换、质量增强和标准化处理，
    /// 为后续的AI特征识别与分割模块提供高质量的输入数据。
    /// </summary>
    public class ImagePrehandleor
    {
        private readonly ILogger<ImagePrehandleor> _logger;
        private readonly IImageHandleingModule _imageProcessingService;
        private readonly ImagePrehandleorOptions _options;

        /// <summary>
        /// 初始化图像预处理器的新实例。
        /// </summary>
        /// <param name="logger">日志记录器。</param>
        /// <param name="imageHandleingModule">图像处理服务。</param>
        /// <param name="options">预处理器配置选项。</param>
        public ImagePrehandleor(
            ILogger<ImagePrehandleor> logger,
            IImageHandleingModule imageHandleingModule,
            IOptions<ImagePrehandleorOptions> options)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _imageProcessingService = imageHandleingModule ?? throw new ArgumentNullException(nameof(imageHandleingModule));
            _options = options?.Value ?? throw new ArgumentNullException(nameof(options));

            _logger.LogInformation("图像预处理器已初始化。标准化目标尺寸：{Width}x{Height}，目标格式：{Format}",
                _options.StandardizedWidth, _options.StandardizedHeight, _options.StandardizedFormat);
        }

        /// <summary>
        /// 对单个医学影像执行完整的标准化预处理流程。
        /// </summary>
        /// <param name="sourceImage">待处理的原始医学影像。</param>
        /// <returns>处理完成并已标准化的医学影像。</returns>
        /// <exception cref="ArgumentNullException">当输入影像为null时抛出。</exception>
        /// <exception cref="ImageProcessingException">当图像处理过程中发生错误时抛出。</exception>
        public MedicalImage ProcessSingleImage(MedicalImage sourceImage)
        {
            if (sourceImage == null)
            {
                _logger.LogError("预处理失败：输入影像为空。");
                throw new ArgumentNullException(nameof(sourceImage));
            }

            _logger.LogDebug("开始预处理影像：{ImageId}，原始尺寸：{Width}x{Height}，格式：{Format}",
                sourceImage.Id, sourceImage.Width, sourceImage.Height, sourceImage.Format);

            try
            {
                // 步骤1：验证图像基本完整性
                ValidateImageIntegrity(sourceImage);

                // 步骤2：转换为内部统一格式（如从DICOM转为Bitmap）
                MedicalImage convertedImage = ConvertToInternalFormat(sourceImage);

                // 步骤3：应用图像增强技术（如对比度拉伸、去噪）
                MedicalImage enhancedImage = ApplyEnhancements(convertedImage);

                // 步骤4：标准化尺寸和颜色空间
                MedicalImage standardizedImage = StandardizeImage(enhancedImage);

                // 步骤5：添加预处理元数据
                standardizedImage.Metadata.PreprocessingHistory = GenerateProcessingHistory(sourceImage, standardizedImage);
                standardizedImage.Metadata.IsPreprocessed = true;

                _logger.LogInformation("影像预处理成功完成：{ImageId}。输出尺寸：{Width}x{Height}",
                    standardizedImage.Id, standardizedImage.Width, standardizedImage.Height);

                return standardizedImage;
            }
            catch (Exception ex) when (ex is not ImageProcessingException)
            {
                // 捕获非特定异常，包装并重新抛出
                _logger.LogError(ex, "预处理影像时发生未预期的错误：{ImageId}", sourceImage.Id);
                throw new ImageProcessingException($"预处理影像 '{sourceImage.Id}' 失败。", ex);
            }
        }

        /// <summary>
        /// 批量处理医学影像集合，使用生成器模式逐个产出结果，适用于大型数据集。
        /// </summary>
        /// <param name="sourceImages">待处理的原始医学影像集合。</param>
        /// <returns>一个生成器，逐个产出处理完成并已标准化的医学影像。</returns>
        public IEnumerable<MedicalImage> ProcessImageBatch(IEnumerable<MedicalImage> sourceImages)
        {
            if (sourceImages == null)
            {
                _logger.LogWarning("批量处理输入为空集合，跳过处理。");
                yield break;
            }

            int processedCount = 0;
            int failedCount = 0;

            foreach (var sourceImage in sourceImages)
            {
                MedicalImage result = null;
                try
                {
                    result = ProcessSingleImage(sourceImage);
                    processedCount++;
                }
                catch (Exception ex)
                {
                    failedCount++;
                    _logger.LogError(ex, "批量处理中单个影像处理失败：{ImageId}，已跳过。", sourceImage?.Id);
                    // 根据配置决定是否继续处理后续影像
                    if (_options.HaltBatchOnFailure)
                    {
                        _logger.LogCritical("批量处理因配置'HaltBatchOnFailure'而中止。成功处理：{Processed}，失败：{Failed}",
                            processedCount, failedCount);
                        throw;
                    }
                    continue; // 跳过当前失败项，继续处理下一个
                }

                yield return result;
            }

            _logger.LogInformation("批量处理完成。总计：{Total}，成功：{Processed}，失败：{Failed}",
                processedCount + failedCount, processedCount, failedCount);
        }

        /// <summary>
        /// 验证医学影像的基本完整性和有效性。
        /// </summary>
        /// <param name="image">待验证的影像。</param>
        /// <exception cref="InvalidImageException">当影像无效时抛出。</exception>
        private void ValidateImageIntegrity(MedicalImage image)
        {
            if (image.PixelData == null || image.PixelData.Length == 0)
            {
                throw new InvalidImageException($"影像 '{image.Id}' 的像素数据为空。");
            }

            if (image.Width <= 0 || image.Height <= 0)
            {
                throw new InvalidImageException($"影像 '{image.Id}' 的尺寸无效：{image.Width}x{image.Height}。");
            }

            // 可添加更多领域特定的验证，如最小分辨率检查
            if (image.Width < _options.MinimumWidth || image.Height < _options.MinimumHeight)
            {
                _logger.LogWarning("影像 '{ImageId}' 的分辨率低于建议最小值 {MinWidth}x{MinHeight}。当前：{Width}x{Height}",
                    image.Id, _options.MinimumWidth, _options.MinimumHeight, image.Width, image.Height);
            }
        }

        /// <summary>
        /// 将影像转换为系统内部处理的统一格式。
        /// </summary>
        /// <param name="sourceImage">原始影像。</param>
        /// <returns>转换格式后的影像。</returns>
        private MedicalImage ConvertToInternalFormat(MedicalImage sourceImage)
        {
            // 如果已经是目标格式，则直接返回副本
            if (string.Equals(sourceImage.Format, _options.InternalWorkingFormat, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogDebug("影像 '{ImageId}' 已为目标内部格式 '{Format}'，跳过转换。",
                    sourceImage.Id, _options.InternalWorkingFormat);
                return sourceImage.Clone();
            }

            _logger.LogDebug("将影像 '{ImageId}' 从格式 '{SourceFormat}' 转换为内部格式 '{TargetFormat}'。",
                sourceImage.Id, sourceImage.Format, _options.InternalWorkingFormat);

            // 调用图像处理服务进行格式转换
            var convertedPixelDetails = _imageProcessingService.ConvertFormat(
                sourceImage.PixelData,
                sourceImage.Format,
                _options.InternalWorkingFormat);

            var convertedImage = sourceImage.Clone();
            convertedImage.PixelData = convertedPixelDetails;
            convertedImage.Format = _options.InternalWorkingFormat;
            convertedImage.Metadata.ConversionPerformed = true;
            convertedImage.Metadata.OriginalFormat = sourceImage.Format;

            return convertedImage;
        }

        /// <summary>
        /// 应用一系列图像增强技术以改善影像质量。
        /// </summary>
        /// <param name="image">待增强的影像。</param>
        /// <returns>增强后的影像。</returns>
        private MedicalImage ApplyEnhancements(MedicalImage image)
        {
            MedicalImage enhancedImage = image.Clone();
            bool anyEnhancementApplied = false;

            // 应用配置中启用的增强过滤器
            foreach (var enhancement in _options.EnabledEnhancements)
            {
                try
                {
                    _logger.LogTrace("对影像 '{ImageId}' 应用增强过滤器：{EnhancementName}。",
                        enhancedImage.Id, enhancement.Name);

                    enhancedImage.PixelData = enhancement.Apply(enhancedImage.PixelData, enhancedImage.Width, enhancedImage.Height);
                    anyEnhancementApplied = true;

                    enhancedImage.Metadata.AppliedEnhancements.Add(enhancement.Name);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "对影像 '{ImageId}' 应用增强过滤器 '{EnhancementName}' 失败。",
                        enhancedImage.Id, enhancement.Name);
                    if (_options.FailOnEnhancementError)
                    {
                        throw new ImageProcessingException($"应用增强 '{enhancement.Name}' 失败。", ex);
                    }
                    // 否则记录错误并继续下一个增强
                }
            }

            if (anyEnhancementApplied)
            {
                enhancedImage.Metadata.EnhancementPerformed = true;
            }

            return enhancedImage;
        }

        /// <summary>
        /// 将影像标准化到统一的尺寸、颜色空间和像素值范围。
        /// </summary>
        /// <param name="image">待标准化的影像。</param>
        /// <returns>标准化后的影像。</returns>
        private MedicalImage StandardizeImage(MedicalImage image)
        {
            MedicalImage standardizedImage = image.Clone();

            // 1. 调整尺寸
            if (image.Width != _options.StandardizedWidth || image.Height != _options.StandardizedHeight)
            {
                _logger.LogDebug("将影像 '{ImageId}' 从尺寸 {OrigWidth}x{OrigHeight} 调整为 {TargetWidth}x{TargetHeight}。",
                    image.Id, image.Width, image.Height, _options.StandardizedWidth, _options.StandardizedHeight);

                standardizedImage.PixelData = _imageProcessingService.Resize(
                    image.PixelData,
                    image.Width,
                    image.Height,
                    _options.StandardizedWidth,
                    _options.StandardizedHeight,
                    _options.ResizeInterpolationMethod);

                standardizedImage.Width = _options.StandardizedWidth;
                standardizedImage.Height = _options.StandardizedHeight;
                standardizedImage.Metadata.ResizingPerformed = true;
                standardizedImage.Metadata.OriginalDimensions = $"{image.Width}x{image.Height}";
            }

            // 2. 标准化颜色空间（例如，确保为RGB）
            if (!string.Equals(image.ColorSpace, _options.StandardizedColorSpace, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogDebug("将影像 '{ImageId}' 的颜色空间从 '{SourceColorSpace}' 转换为 '{TargetColorSpace}'。",
                    standardizedImage.Id, image.ColorSpace, _options.StandardizedColorSpace);

                standardizedImage.PixelData = _imageProcessingService.ConvertColorSpace(
                    standardizedImage.PixelData,
                    image.ColorSpace,
                    _options.StandardizedColorSpace,
                    standardizedImage.Width,
                    standardizedImage.Height);

                standardizedImage.ColorSpace = _options.StandardizedColorSpace;
                standardizedImage.Metadata.ColorSpaceConversionPerformed = true;
                standardizedImage.Metadata.OriginalColorSpace = image.ColorSpace;
            }

            // 3. 标准化像素值范围（例如，归一化到[0,1]或标准化到特定均值和方差）
            if (_options.PixelNormalizationEnabled)
            {
                _logger.LogTrace("对影像 '{ImageId}' 应用像素值归一化。方法：{NormalizationMethod}。",
                    standardizedImage.Id, _options.NormalizationMethod);

                standardizedImage.PixelData = _imageProcessingService.NormalizePixelValues(
                    standardizedImage.PixelData,
                    _options.NormalizationMethod,
                    _options.NormalizationParameters);

                standardizedImage.Metadata.NormalizationPerformed = true;
                standardizedImage.Metadata.NormalizationMethod = _options.NormalizationMethod;
            }

            // 4. 转换为最终输出格式
            if (!string.Equals(standardizedImage.Format, _options.StandardizedFormat, StringComparison.OrdinalIgnoreCase))
            {
                standardizedImage.PixelData = _imageProcessingService.ConvertFormat(
                    standardizedImage.PixelData,
                    standardizedImage.Format,
                    _options.StandardizedFormat);

                standardizedImage.Format = _options.StandardizedFormat;
                standardizedImage.Metadata.FinalFormatConversionPerformed = true;
            }

            return standardizedImage;
        }

        /// <summary>
        /// 生成影像处理历史记录。
        /// </summary>
        /// <param name="originalImage">原始影像。</param>
        /// <param name="processedImage">处理后的影像。</param>
        /// <returns>处理历史描述。</returns>
        private string GenerateProcessingHistory(MedicalImage originalImage, MedicalImage processedImage)
        {
            return $"预处理于 {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC。 " +
                   $"原始：{originalImage.Width}x{originalImage.Height} {originalImage.Format}。 " +
                   $"处理后：{processedImage.Width}x{processedImage.Height} {processedImage.Format}。 " +
                   $"应用增强：{string.Join(", ", processedImage.Metadata.AppliedEnhancements)}。";
        }
    }

    /// <summary>
    /// 图像预处理器的配置选项。
    /// </summary>
    public class ImagePrehandleorOptions
    {
        /// <summary>系统内部处理时使用的中间格式（如"Bitmap"）。</summary>
        public string InternalWorkingFormat { get; set; } = "Bitmap";

        /// <summary>标准化输出格式（如"PNG"）。</summary>
        public string StandardizedFormat { get; set; } = "PNG";

        /// <summary>标准化宽度（像素）。</summary>
        public int StandardizedWidth { get; set; } = 1024;

        /// <summary>标准化高度（像素）。</summary>
        public int StandardizedHeight { get; set; } = 1024;

        /// <summary>标准化颜色空间（如"RGB"）。</summary>
        public string StandardizedColorSpace { get; set; } = "RGB";

        /// <summary>可接受的最小影像宽度。</summary>
        public int MinimumWidth { get; set; } = 256;

        /// <summary>可接受的最小影像高度。</summary>
        public int MinimumHeight { get; set; } = 256;

        /// <summary>调整大小时使用的插值方法。</summary>
        public string ResizeInterpolationMethod { get; set; } = "Lanczos4";

        /// <summary>是否启用像素值归一化。</summary>
        public bool PixelNormalizationEnabled { get; set; } = true;

        /// <summary>像素归一化方法（如"MinMax"、"ZScore"）。</summary>
        public string NormalizationMethod { get; set; } = "MinMax";

        /// <summary>像素归一化参数。</summary>
        public Dictionary<string, double> NormalizationParameters { get; set; } = new Dictionary<string, double>();

        /// <summary>启用的图像增强过滤器列表。</summary>
        public List<ImageEnhancement> EnabledEnhancements { get; set; } = new List<ImageEnhancement>();

        /// <summary>当单个增强步骤失败时，是否导致整个预处理失败。</summary>
        public bool FailOnEnhancementError { get; set; } = false;

        /// <summary>批量处理时，单个失败是否导致整个批次中止。</summary>
        public bool HaltBatchOnFailure { get; set; } = false;
    }

    /// <summary>
    /// 表示一个图像增强操作（如对比度增强、高斯模糊）。
    /// </summary>
    public class ImageEnhancement
    {
        public string Name { get; set; }
        public Func<byte[], int, int, byte[]> Apply { get; set; }
    }

    /// <summary>
    /// 表示图像处理过程中发生的异常。
    /// </summary>
    public class ImageProcessingException : Exception
    {
        public ImageProcessingException() { }
        public ImageProcessingException(string message) : base(message) { }
        public ImageProcessingException(string message, Exception innerException) : base(message, innerException) { }
    }

    /// <summary>
    /// 表示输入的医学影像无效。
    /// </summary>
    public class InvalidImageException : ImageProcessingException
    {
        public InvalidImageException() { }
        public InvalidImageException(string message) : base(message) { }
        public InvalidImageException(string message, Exception innerException) : base(message, innerException) { }
    }
}