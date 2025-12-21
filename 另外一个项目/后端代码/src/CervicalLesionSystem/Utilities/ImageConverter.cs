using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using Microsoft.Extensions.Logging;

namespace CervicalLesionSystem.Utilities
{
    /// <summary>
    /// 医学图像格式转换工具类。
    /// 支持DICOM、TIFF、PNG、JPEG、BMP等常见医学图像格式的相互转换。
    /// 采用生成器模式进行图像数据迭代，以提高大图像处理时的内存效率。
    /// </summary>
    public class ImageConverter
    {
        private readonly ILogger<ImageConverter> _logger;

        /// <summary>
        /// 初始化图像转换器实例。
        /// </summary>
        /// <param name="logger">日志记录器。</param>
        public ImageConverter(ILogger<ImageConverter> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// 支持的源图像格式枚举。
        /// </summary>
        public enum SourceImageFormat
        {
            DICOM,
            TIFF,
            PNG,
            JPEG,
            BMP,
            UNKNOWN
        }

        /// <summary>
        /// 目标图像格式枚举。
        /// </summary>
        public enum TargetImageFormat
        {
            TIFF,
            PNG,
            JPEG,
            BMP
        }

        /// <summary>
        /// 将图像文件从一种格式转换为另一种格式。
        /// </summary>
        /// <param name="sourceFilePath">源图像文件路径。</param>
        /// <param name="targetFilePath">目标图像文件路径。</param>
        /// <param name="targetFormat">目标图像格式。</param>
        /// <param name="compressionQuality">JPEG压缩质量（1-100），仅对JPEG格式有效。</param>
        /// <returns>转换成功返回true，否则返回false。</returns>
        public bool ConvertImage(string sourceFilePath, string targetFilePath, TargetImageFormat targetFormat, int compressionQuality = 90)
        {
            if (string.IsNullOrWhiteSpace(sourceFilePath))
                throw new ArgumentException("源文件路径不能为空。", nameof(sourceFilePath));
            if (string.IsNullOrWhiteSpace(targetFilePath))
                throw new ArgumentException("目标文件路径不能为空。", nameof(targetFilePath));
            if (compressionQuality < 1 || compressionQuality > 100)
                throw new ArgumentOutOfRangeException(nameof(compressionQuality), "压缩质量必须在1到100之间。");

            try
            {
                _logger.LogInformation("开始转换图像：{SourcePath} -> {TargetPath}，目标格式：{Format}", sourceFilePath, targetFilePath, targetFormat);

                SourceImageFormat sourceFormat = DetectImageFormat(sourceFilePath);
                if (sourceFormat == SourceImageFormat.UNKNOWN)
                {
                    _logger.LogError("无法识别的源图像格式：{SourcePath}", sourceFilePath);
                    return false;
                }

                using (Bitmap sourceBitmap = LoadImage(sourceFilePath, sourceFormat))
                {
                    if (sourceBitmap == null)
                    {
                        _logger.LogError("加载源图像失败：{SourcePath}", sourceFilePath);
                        return false;
                    }

                    ImageFormat dotNetTargetFormat = GetImageFormat(targetFormat);
                    EncoderParameters encoderParams = null;

                    if (targetFormat == TargetImageFormat.JPEG)
                    {
                        encoderParams = CreateJpegEncoderParameters(compressionQuality);
                    }

                    // 使用生成器迭代像素数据块进行处理（适用于大图像）
                    foreach (var pixelBlock in IteratePixelBlocks(sourceBitmap, 1024))
                    {
                        // 此处可添加针对每个像素块的预处理逻辑（如颜色空间转换）
                        // 当前业务案例中，转换由Save方法统一完成
                    }

                    if (encoderParams != null)
                    {
                        var encoder = GetEncoder(dotNetTargetFormat);
                        sourceBitmap.Save(targetFilePath, encoder, encoderParams);
                    }
                    else
                    {
                        sourceBitmap.Save(targetFilePath, dotNetTargetFormat);
                    }

                    _logger.LogInformation("图像转换成功：{TargetPath}", targetFilePath);
                    return true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "图像转换过程中发生异常。源文件：{SourcePath}，目标文件：{TargetPath}", sourceFilePath, targetFilePath);
                return false;
            }
        }

        /// <summary>
        /// 将图像转换为字节数组。
        /// </summary>
        /// <param name="imageFilePath">图像文件路径。</param>
        /// <param name="targetFormat">目标格式。</param>
        /// <param name="compressionQuality">JPEG压缩质量（1-100）。</param>
        /// <returns>包含图像数据的字节数组。</returns>
        public byte[] ConvertImageToBytes(string imageFilePath, TargetImageFormat targetFormat, int compressionQuality = 90)
        {
            if (string.IsNullOrWhiteSpace(imageFilePath))
                throw new ArgumentException("图像文件路径不能为空。", nameof(imageFilePath));

            try
            {
                _logger.LogDebug("开始将图像转换为字节数组：{FilePath}，格式：{Format}", imageFilePath, targetFormat);

                SourceImageFormat sourceFormat = DetectImageFormat(imageFilePath);
                using (Bitmap sourceBitmap = LoadImage(imageFilePath, sourceFormat))
                {
                    if (sourceBitmap == null)
                    {
                        _logger.LogError("加载图像失败：{FilePath}", imageFilePath);
                        return Array.Empty<byte>();
                    }

                    using (MemoryStream memoryStream = new MemoryStream())
                    {
                        ImageFormat dotNetTargetFormat = GetImageFormat(targetFormat);

                        if (targetFormat == TargetImageFormat.JPEG)
                        {
                            var encoderParams = CreateJpegEncoderParameters(compressionQuality);
                            var encoder = GetEncoder(dotNetTargetFormat);
                            sourceBitmap.Save(memoryStream, encoder, encoderParams);
                        }
                        else
                        {
                            sourceBitmap.Save(memoryStream, dotNetTargetFormat);
                        }

                        _logger.LogDebug("图像转换为字节数组成功，大小：{Size} 字节", memoryStream.Length);
                        return memoryStream.ToArray();
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "将图像转换为字节数组时发生异常。文件：{FilePath}", imageFilePath);
                return Array.Empty<byte>();
            }
        }

        /// <summary>
        /// 检测图像文件的格式。
        /// </summary>
        /// <param name="filePath">文件路径。</param>
        /// <returns>检测到的图像格式。</returns>
        private SourceImageFormat DetectImageFormat(string filePath)
        {
            string extension = Path.GetExtension(filePath).ToUpperInvariant();

            return extension switch
            {
                ".DCM" or ".DICOM" => SourceImageFormat.DICOM,
                ".TIF" or ".TIFF" => SourceImageFormat.TIFF,
                ".PNG" => SourceImageFormat.PNG,
                ".JPG" or ".JPEG" => SourceImageFormat.JPEG,
                ".BMP" => SourceImageFormat.BMP,
                _ => SourceImageFormat.UNKNOWN
            };
        }

        /// <summary>
        /// 根据检测到的格式加载图像。
        /// </summary>
        /// <param name="filePath">文件路径。</param>
        /// <param name="format">图像格式。</param>
        /// <returns>加载的Bitmap对象。</returns>
        /// <remarks>DICOM格式加载需要专门的库（如fo-dicom），此处为简化业务案例。</remarks>
        private Bitmap LoadImage(string filePath, SourceImageFormat format)
        {
            try
            {
                switch (format)
                {
                    case SourceImageFormat.DICOM:
                        // 实际项目中应集成DICOM解析库（如fo-dicom）
                        // 此处返回一个占位符异常，提示需要实现
                        throw new NotImplementedException("DICOM格式加载需要集成专门的DICOM库（如fo-dicom）。");
                    case SourceImageFormat.TIFF:
                    case SourceImageFormat.PNG:
                    case SourceImageFormat.JPEG:
                    case SourceImageFormat.BMP:
                        // 使用System.Drawing加载常见光栅图像
                        return new Bitmap(filePath);
                    default:
                        _logger.LogWarning("不支持的图像格式：{Format}，文件：{FilePath}", format, filePath);
                        return null;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "加载图像时发生异常。文件：{FilePath}，格式：{Format}", filePath, format);
                return null;
            }
        }

        /// <summary>
        /// 将目标格式枚举转换为.NET ImageFormat。
        /// </summary>
        private ImageFormat GetImageFormat(TargetImageFormat format)
        {
            return format switch
            {
                TargetImageFormat.TIFF => ImageFormat.Tiff,
                TargetImageFormat.PNG => ImageFormat.Png,
                TargetImageFormat.JPEG => ImageFormat.Jpeg,
                TargetImageFormat.BMP => ImageFormat.Bmp,
                _ => ImageFormat.Png // 默认
            };
        }

        /// <summary>
        /// 获取指定图像格式的编码器。
        /// </summary>
        private ImageCodecInfo GetEncoder(ImageFormat format)
        {
            ImageCodecInfo[] codecs = ImageCodecInfo.GetImageEncoders();
            return codecs.FirstOrDefault(codec => codec.FormatID == format.Guid);
        }

        /// <summary>
        /// 创建JPEG编码器参数以设置压缩质量。
        /// </summary>
        private EncoderParameters CreateJpegEncoderParameters(int quality)
        {
            var encoderParams = new EncoderParameters(1);
            var qualityParam = new EncoderParameter(Encoder.Quality, quality);
            encoderParams.Param[0] = qualityParam;
            return encoderParams;
        }

        /// <summary>
        /// 生成器方法：按块迭代图像像素数据。
        /// 用于处理大图像时避免一次性加载全部像素数据到内存。
        /// </summary>
        /// <param name="bitmap">源位图。</param>
        /// <param name="blockSize">每个像素块的大小（像素行数）。</param>
        /// <returns>像素数据块的枚举。</returns>
        private IEnumerable<PixelBlock> IteratePixelBlocks(Bitmap bitmap, int blockSize)
        {
            if (bitmap == null) yield break;

            int height = bitmap.Height;
            int width = bitmap.Width;

            for (int y = 0; y < height; y += blockSize)
            {
                int currentBlockHeight = Math.Min(blockSize, height - y);

                // 锁定位图的一部分以进行高效访问
                Rectangle rect = new Rectangle(0, y, width, currentBlockHeight);
                BitmapData bitmapData = bitmap.LockBits(rect, ImageLockMode.ReadOnly, bitmap.PixelFormat);

                try
                {
                    int bytesPerPixel = Image.GetPixelFormatSize(bitmap.PixelFormat) / 8;
                    int byteCount = bitmapData.Stride * currentBlockHeight;
                    byte[] pixelBytes = new byte[byteCount];

                    // 将像素数据复制到托管数组
                    Marshal.Copy(bitmapData.Scan0, pixelBytes, 0, byteCount);

                    yield return new PixelBlock
                    {
                        StartY = y,
                        Height = currentBlockHeight,
                        Width = width,
                        PixelFormat = bitmap.PixelFormat,
                        Data = pixelBytes,
                        Stride = bitmapData.Stride
                    };
                }
                finally
                {
                    bitmap.UnlockBits(bitmapData);
                }
            }
        }

        /// <summary>
        /// 表示一个图像像素数据块。
        /// </summary>
        public class PixelBlock
        {
            public int StartY { get; set; }
            public int Height { get; set; }
            public int Width { get; set; }
            public PixelFormat PixelFormat { get; set; }
            public byte[] Data { get; set; }
            public int Stride { get; set; }
        }
    }
}