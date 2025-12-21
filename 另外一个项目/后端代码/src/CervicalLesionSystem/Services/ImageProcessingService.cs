using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenCvSharp;
using CervicalLesionSystem.Models;
using CervicalLesionSystem.Utilities;

namespace CervicalLesionSystem.Services
{
    /// <summary>
    /// 图像处理服务实现，封装OpenCV等库的操作。
    /// 负责医学影像的加载、预处理、转换和基础分析。
    /// </summary>
    public class ImageProcessingService : IImageHandleingModule
    {
        private readonly ILogger<ImageProcessingService> _logger;
        private readonly IRetryExecutorCoreCoreCore _retryExecutor;
        private readonly ImageProcessingOptions _options;

        /// <summary>
        /// 图像处理服务构造函数。
        /// </summary>
        /// <param name="logger">日志记录器。</param>
        /// <param name="retryExecutor">重试策略执行器。</param>
        /// <param name="options">图像处理配置选项。</param>
        public ImageProcessingService(
            ILogger<ImageProcessingService> logger,
            IRetryExecutorCoreCoreCore retryExecutor,
            IOptions<ImageProcessingOptions> options)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _retryExecutor = retryExecutor ?? throw new ArgumentNullException(nameof(retryExecutor));
            _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        }

        /// <summary>
        /// 从文件路径加载医学图像。
        /// </summary>
        /// <param name="filePath">图像文件路径。</param>
        /// <returns>加载的医学图像模型。</returns>
        public MedicalImage LoadImage(string filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath))
            {
                throw new ArgumentException("文件路径不能为空或空白。", nameof(filePath));
            }

            if (!File.Exists(filePath))
            {
                _logger.LogError("图像文件不存在：{FilePath}", filePath);
                throw new FileNotFoundException($"图像文件未找到：{filePath}");
            }

            try
            {
                _logger.LogInformation("开始加载图像：{FilePath}", filePath);

                // 使用重试策略执行文件读取操作
                var imageData = _retryExecutor.ExecuteWithRetry(() =>
                {
                    using var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
                    var buffer = new byte[fileStream.Length];
                    fileStream.Read(buffer, 0, buffer.Length);
                    return buffer;
                });

                var fileName = Path.GetFileName(filePath);
                var fileExtension = Path.GetExtension(fileName).ToLowerInvariant();
                var supportedFormats = new[] { ".jpg", ".jpeg", ".png", ".tiff", ".bmp", ".dicom" };

                if (!supportedFormats.Contains(fileExtension))
                {
                    _logger.LogWarning("不支持的图像格式：{Format}，文件：{FileName}", fileExtension, fileName);
                }

                var medicalImage = new MedicalImage
                {
                    Id = Guid.NewGuid(),
                    FileName = fileName,
                    FilePath = filePath,
                    Format = fileExtension,
                    RawData = imageData,
                    AcquisitionTime = File.GetCreationTimeUtc(filePath),
                    Metadata = ExtractImageMetadata(filePath)
                };

                _logger.LogInformation("成功加载图像，ID：{ImageId}，大小：{Size} 字节", medicalImage.Id, imageData.Length);
                return medicalImage;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "加载图像时发生异常，文件路径：{FilePath}", filePath);
                throw new ImageProcessingException($"加载图像失败：{filePath}", ex);
            }
        }

        /// <summary>
        /// 将图像转换为标准格式（如RGB三通道，统一尺寸）。
        /// </summary>
        /// <param name="sourceImage">源医学图像。</param>
        /// <param name="targetWidth">目标宽度。</param>
        /// <param name="targetHeight">目标高度。</param>
        /// <returns>标准化后的图像数据。</returns>
        public byte[] StandardizeImage(MedicalImage sourceImage, int targetWidth, int targetHeight)
        {
            if (sourceImage == null)
            {
                throw new ArgumentNullException(nameof(sourceImage));
            }

            if (targetWidth <= 0 || targetHeight <= 0)
            {
                throw new ArgumentException("目标宽度和高度必须为正数。");
            }

            try
            {
                _logger.LogInformation("开始标准化图像，ID：{ImageId}，目标尺寸：{Width}x{Height}",
                    sourceImage.Id, targetWidth, targetHeight);

                using var mat = DecodeImageToMat(sourceImage.RawData);

                // 转换为RGB三通道
                Mat rgbMat;
                if (mat.Channels() == 1)
                {
                    rgbMat = new Mat();
                    Cv2.CvtColor(mat, rgbMat, ColorConversionCodes.GRAY2RGB);
                    mat.Dispose();
                }
                else if (mat.Channels() == 4)
                {
                    rgbMat = new Mat();
                    Cv2.CvtColor(mat, rgbMat, ColorConversionCodes.BGRA2RGB);
                    mat.Dispose();
                }
                else if (mat.Channels() == 3)
                {
                    rgbMat = mat;
                }
                else
                {
                    throw new ImageProcessingException($"不支持的通道数：{mat.Channels()}");
                }

                // 调整尺寸
                Mat resizedMat = new Mat();
                Cv2.Resize(rgbMat, resizedMat, new Size(targetWidth, targetHeight), 0, 0, InterpolationFlags.Lanczos4);

                // 应用直方图均衡化增强对比度（可选，根据配置）
                if (_options.EnableHistogramEqualization)
                {
                    ApplyHistogramEqualization(resizedMat);
                }

                // 编码为JPEG格式字节数组
                var standardizedData = resizedMat.ToBytes(".jpg", _options.JpegQuality);

                rgbMat.Dispose();
                if (rgbMat != mat) mat.Dispose();
                resizedMat.Dispose();

                _logger.LogInformation("图像标准化完成，ID：{ImageId}，输出大小：{Size} 字节",
                    sourceImage.Id, standardizedData.Length);

                return standardizedData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "标准化图像时发生异常，图像ID：{ImageId}", sourceImage.Id);
                throw new ImageProcessingException($"标准化图像失败：{sourceImage.Id}", ex);
            }
        }

        /// <summary>
        /// 增强图像对比度和清晰度。
        /// </summary>
        /// <param name="imageData">原始图像数据。</param>
        /// <returns>增强后的图像数据。</returns>
        public byte[] EnhanceImage(byte[] imageData)
        {
            if (imageData == null || imageData.Length == 0)
            {
                throw new ArgumentException("图像数据不能为空。", nameof(imageData));
            }

            try
            {
                _logger.LogDebug("开始增强图像，输入大小：{Size} 字节", imageData.Length);

                using var mat = DecodeImageToMat(imageData);

                // 应用CLAHE（对比度受限的自适应直方图均衡化）进行局部对比度增强
                Mat enhancedMat = ApplyClahe(mat);

                // 应用非局部均值去噪
                if (_options.EnableDenoising)
                {
                    Mat denoisedMat = new Mat();
                    Cv2.FastNlMeansDenoisingColored(enhancedMat, denoisedMat,
                        _options.DenoisingStrength,
                        _options.DenoisingColorStrength,
                        _options.DenoisingTemplateWindowSize,
                        _options.DenoisingSearchWindowSize);
                    enhancedMat.Dispose();
                    enhancedMat = denoisedMat;
                }

                // 锐化图像
                if (_options.EnableSharpening)
                {
                    Mat sharpenedMat = ApplySharpening(enhancedMat);
                    enhancedMat.Dispose();
                    enhancedMat = sharpenedMat;
                }

                var enhancedData = enhancedMat.ToBytes(".png");
                enhancedMat.Dispose();

                _logger.LogDebug("图像增强完成，输出大小：{Size} 字节", enhancedData.Length);
                return enhancedData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "增强图像时发生异常");
                throw new ImageProcessingException("增强图像失败", ex);
            }
        }

        /// <summary>
        /// 提取图像中的感兴趣区域（ROI）。
        /// </summary>
        /// <param name="imageData">原始图像数据。</param>
        /// <param name="roiRectangle">感兴趣区域矩形。</param>
        /// <returns>ROI图像数据。</returns>
        public byte[] ExtractRegionOfInterest(byte[] imageData, Rect roiRectangle)
        {
            if (imageData == null || imageData.Length == 0)
            {
                throw new ArgumentException("图像数据不能为空。", nameof(imageData));
            }

            if (roiRectangle.Width <= 0 || roiRectangle.Height <= 0)
            {
                throw new ArgumentException("ROI矩形宽度和高度必须为正数。");
            }

            try
            {
                _logger.LogDebug("开始提取ROI，矩形：{X},{Y},{Width},{Height}",
                    roiRectangle.X, roiRectangle.Y, roiRectangle.Width, roiRectangle.Height);

                using var mat = DecodeImageToMat(imageData);

                // 验证ROI是否在图像边界内
                var imageRect = new Rect(0, 0, mat.Width, mat.Height);
                if (!imageRect.Contains(roiRectangle))
                {
                    _logger.LogWarning("ROI矩形超出图像边界，将进行裁剪调整。");
                    roiRectangle = roiRectangle.Intersect(imageRect);

                    if (roiRectangle.Width <= 0 || roiRectangle.Height <= 0)
                    {
                        throw new ImageProcessingException("ROI矩形与图像无有效交集。");
                    }
                }

                using var roiMat = new Mat(mat, roiRectangle);
                var roiData = roiMat.ToBytes(".png");

                _logger.LogDebug("ROI提取完成，输出大小：{Size} 字节", roiData.Length);
                return roiData;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "提取ROI时发生异常");
                throw new ImageProcessingException("提取ROI失败", ex);
            }
        }

        /// <summary>
        /// 批量处理图像集合。
        /// </summary>
        /// <param name="imageCollection">医学图像集合。</param>
        /// <param name="processingAction">处理操作函数。</param>
        /// <returns>处理后的图像枚举。</returns>
        public IEnumerable<MedicalImage> ProcessImageBatch(
            IEnumerable<MedicalImage> imageCollection,
            Func<MedicalImage, MedicalImage> processingAction)
        {
            if (imageCollection == null)
            {
                throw new ArgumentNullException(nameof(imageCollection));
            }

            if (processingAction == null)
            {
                throw new ArgumentNullException(nameof(processingAction));
            }

            _logger.LogInformation("开始批量处理图像，预计数量：{Count}", imageCollection.Count());

            // 使用生成器方式逐个处理并返回
            foreach (var image in imageCollection)
            {
                MedicalImage processedImage = null;
                try
                {
                    processedImage = processingAction(image);
                    _logger.LogDebug("成功处理图像：{ImageId}", image.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "处理图像时发生异常，图像ID：{ImageId}，跳过此图像", image.Id);
                    // 根据配置决定是否继续处理后续图像
                    if (!_options.ContinueOnBatchError)
                    {
                        throw;
                    }
                }

                if (processedImage != null)
                {
                    yield return processedImage;
                }
            }

            _logger.LogInformation("批量处理图像完成");
        }

        /// <summary>
        /// 计算图像的基本统计信息。
        /// </summary>
        /// <param name="imageData">图像数据。</param>
        /// <returns>包含均值、标准差等统计信息的字典。</returns>
        public Dictionary<string, double> CalculateImageStatistics(byte[] imageData)
        {
            if (imageData == null || imageData.Length == 0)
            {
                throw new ArgumentException("图像数据不能为空。", nameof(imageData));
            }

            try
            {
                _logger.LogDebug("开始计算图像统计信息");

                using var mat = DecodeImageToMat(imageData);
                var statistics = new Dictionary<string, double>();

                // 计算各通道的均值和标准差
                for (int channel = 0; channel < mat.Channels(); channel++)
                {
                    using var channelMat = mat.ExtractChannel(channel);
                    Cv2.MeanStdDev(channelMat, out var mean, out var stddev);

                    statistics.Add($"Channel{channel}_Mean", mean.Val0);
                    statistics.Add($"Channel{channel}_StdDev", stddev.Val0);
                }

                // 计算整体亮度
                if (mat.Channels() == 3)
                {
                    using var grayMat = new Mat();
                    Cv2.CvtColor(mat, grayMat, ColorConversionCodes.RGB2GRAY);
                    Cv2.MeanStdDev(grayMat, out var mean, out _);
                    statistics.Add("OverallBrightness", mean.Val0);
                }

                _logger.LogDebug("图像统计信息计算完成，共 {Count} 项指标", statistics.Count);
                return statistics;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "计算图像统计信息时发生异常");
                throw new ImageProcessingException("计算图像统计信息失败", ex);
            }
        }

        #region 私有辅助方法

        /// <summary>
        /// 将字节数组解码为OpenCV Mat对象。
        /// </summary>
        private Mat DecodeImageToMat(byte[] imageData)
        {
            try
            {
                return Mat.FromImageData(imageData, ImreadModes.Color);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "解码图像数据失败");
                throw new ImageProcessingException("无法解码图像数据", ex);
            }
        }

        /// <summary>
        /// 应用CLAHE（对比度受限的自适应直方图均衡化）。
        /// </summary>
        private Mat ApplyClahe(Mat sourceMat)
        {
            using var clahe = CLAHE.Create();
            clahe.ClipLimit = _options.ClaheClipLimit;
            clahe.TilesGridSize = new Size(_options.ClaheGridSize, _options.ClaheGridSize);

            Mat resultMat = new Mat();
            if (sourceMat.Channels() == 1)
            {
                clahe.Apply(sourceMat, resultMat);
            }
            else if (sourceMat.Channels() == 3)
            {
                // 对每个通道分别应用CLAHE
                var channels = sourceMat.Split();
                var processedChannels = new Mat[channels.Length];

                for (int i = 0; i < channels.Length; i++)
                {
                    processedChannels[i] = new Mat();
                    clahe.Apply(channels[i], processedChannels[i]);
                    channels[i].Dispose();
                }

                Cv2.Merge(processedChannels, resultMat);

                foreach (var channel in processedChannels)
                {
                    channel.Dispose();
                }
            }

            return resultMat;
        }

        /// <summary>
        /// 应用直方图均衡化。
        /// </summary>
        private void ApplyHistogramEqualization(Mat sourceMat)
        {
            if (sourceMat.Channels() == 1)
            {
                Cv2.EqualizeHist(sourceMat, sourceMat);
            }
            else if (sourceMat.Channels() == 3)
            {
                var channels = sourceMat.Split();
                for (int i = 0; i < channels.Length; i++)
                {
                    Cv2.EqualizeHist(channels[i], channels[i]);
                }
                Cv2.Merge(channels, sourceMat);

                foreach (var channel in channels)
                {
                    channel.Dispose();
                }
            }
        }

        /// <summary>
        /// 应用图像锐化。
        /// </summary>
        private Mat ApplySharpening(Mat sourceMat)
        {
            // 使用拉普拉斯算子进行锐化
            Mat sharpenedMat = new Mat();
            Mat laplacian = new Mat();
            Cv2.Laplacian(sourceMat, laplacian, MatType.CV_32F, 3, 1, 0, BorderTypes.Default);

            // 将源图像转换为浮点型以便进行加权相加
            Mat sourceFloat = new Mat();
            sourceMat.ConvertTo(sourceFloat, MatType.CV_32F);

            // 源图像 + α * 拉普拉斯结果
            Cv2.AddWeighted(sourceFloat, 1.0, laplacian, _options.SharpeningStrength, 0, sharpenedMat);

            // 转换回原始类型
            sharpenedMat.ConvertTo(sharpenedMat, sourceMat.Type());

            laplacian.Dispose();
            sourceFloat.Dispose();

            return sharpenedMat;
        }

        /// <summary>
        /// 提取图像元数据。
        /// </summary>
        private Dictionary<string, string> ExtractImageMetadata(string filePath)
        {
            var metadata = new Dictionary<string, string>
            {
                { "FileSize", new FileInfo(filePath).Length.ToString() },
                { "LastModified", File.GetLastWriteTimeUtc(filePath).ToString("O") }
            };

            // 这里可以扩展更多元数据提取逻辑，如EXIF信息等
            return metadata;
        }

        #endregion
    }

    /// <summary>
    /// 图像处理配置选项。
    /// </summary>
    public class ImageProcessingOptions
    {
        public bool EnableHistogramEqualization { get; set; } = true;
        public bool EnableDenoising { get; set; } = true;
        public bool EnableSharpening { get; set; } = false;
        public int JpegQuality { get; set; } = 95;
        public double DenoisingStrength { get; set; } = 10.0;
        public double DenoisingColorStrength { get; set; } = 10.0;
        public int DenoisingTemplateWindowSize { get; set; } = 7;
        public int DenoisingSearchWindowSize { get; set; } = 21;
        public double ClaheClipLimit { get; set; } = 2.0;
        public int ClaheGridSize { get; set; } = 8;
        public double SharpeningStrength { get; set; } = 0.5;
        public bool ContinueOnBatchError { get; set; } = true;
    }

    /// <summary>
    /// 图像处理异常。
    /// </summary>
    public class ImageProcessingException : Exception
    {
        public ImageProcessingException(string message) : base(message) { }
        public ImageProcessingException(string message, Exception innerException) : base(message, innerException) { }
    }
}