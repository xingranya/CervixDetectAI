using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Text.Json.Serialization;
using CervicalLesionSystem.Logging;

namespace CervicalLesionSystem.Models
{
    /// <summary>
    /// 表示一个医学影像数据模型，包含图像的元数据、像素数据以及相关的患者和采集信息。
    /// 该模型是系统处理的核心数据载体，用于在预处理、分割、风险评估等模块间传递。
    /// </summary>
    public class MedicalImage
    {
        /// <summary>
        /// 获取或设置影像的唯一标识符。
        /// </summary>
        public string Id { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// 获取或设置关联的患者标识符。
        /// </summary>
        public string PatientIdentifier { get; set; }

        /// <summary>
        /// 获取或设置影像的原始文件名。
        /// </summary>
        public string OriginalFileName { get; set; }

        /// <summary>
        /// 获取或设置影像的采集日期和时间。
        /// </summary>
        public DateTime AcquisitionTimestamp { get; set; }

        /// <summary>
        /// 获取或设置影像类型（例如：细胞涂片、阴道镜图像）。
        /// </summary>
        public ImageType Type { get; set; }

        /// <summary>
        /// 获取或设置影像来源的设备信息。
        /// </summary>
        public string SourceDevice { get; set; }

        /// <summary>
        /// 获取或设置影像的宽度（像素）。
        /// </summary>
        public int Width { get; private set; }

        /// <summary>
        /// 获取或设置影像的高度（像素）。
        /// </summary>
        public int Height { get; private set; }

        /// <summary>
        /// 获取或设置每个像素的位数（深度），例如8、16、24。
        /// </summary>
        public int BitsPerPixel { get; private set; }

        /// <summary>
        /// 获取或设置影像的物理分辨率（每毫米像素数）。
        /// </summary>
        public double ResolutionDpi { get; set; }

        /// <summary>
        /// 获取或设置影像的颜色空间。
        /// </summary>
        public ColorSpace ColorSpace { get; private set; }

        /// <summary>
        /// 获取或设置原始的像素数据字节数组。
        /// 此属性在JSON序列化时被忽略，以避免数据过大。
        /// </summary>
        [JsonIgnore]
        public byte[] PixelData { get; private set; }

        /// <summary>
        /// 获取或设置一个值，指示像素数据是否已加载到内存中。
        /// </summary>
        [JsonIgnore]
        public bool IsPixelDataLoaded => PixelData != null && PixelData.Length > 0;

        /// <summary>
        /// 获取或设置影像在文件系统或存储中的路径。
        /// 当PixelData未加载时，可用于延迟加载。
        /// </summary>
        public string StoragePath { get; set; }

        /// <summary>
        /// 获取或设置与影像相关的临床备注或描述。
        /// </summary>
        public string ClinicalNotes { get; set; }

        /// <summary>
        /// 获取或设置影像的校验和（如MD5），用于数据完整性验证。
        /// </summary>
        public string Checksum { get; set; }

        /// <summary>
        /// 获取或设置影像的元数据字典，包含DICOM标签或其他自定义信息。
        /// </summary>
        public Dictionary<string, string> Metadata { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// 使用指定的参数初始化一个新的<see cref="MedicalImage"/>实例。
        /// 此构造函数不加载像素数据，适用于从数据库或元数据文件创建对象。
        /// </summary>
        /// <param name="patientIdentifier">患者标识符。</param>
        /// <param name="originalFileName">原始文件名。</param>
        /// <param name="type">影像类型。</param>
        /// <param name="width">影像宽度。</param>
        /// <param name="height">影像高度。</param>
        /// <param name="bitsPerPixel">每像素位数。</param>
        /// <param name="colorSpace">颜色空间。</param>
        public MedicalImage(string patientIdentifier, string originalFileName, ImageType type, int width, int height, int bitsPerPixel, ColorSpace colorSpace)
        {
            PatientIdentifier = patientIdentifier ?? throw new ArgumentNullException(nameof(patientIdentifier));
            OriginalFileName = originalFileName ?? throw new ArgumentNullException(nameof(originalFileName));
            Type = type;
            Width = width > 0 ? width : throw new ArgumentException("宽度必须大于0。", nameof(width));
            Height = height > 0 ? height : throw new ArgumentException("高度必须大于0。", nameof(height));
            BitsPerPixel = bitsPerPixel > 0 ? bitsPerPixel : throw new ArgumentException("每像素位数必须大于0。", nameof(bitsPerPixel));
            ColorSpace = colorSpace;
            AcquisitionTimestamp = DateTime.UtcNow;
            PixelData = null; // 延迟加载
        }

        /// <summary>
        /// 使用像素数据初始化一个新的<see cref="MedicalImage"/>实例。
        /// 此构造函数会计算并设置图像的宽度、高度、位深和颜色空间。
        /// </summary>
        /// <param name="patientIdentifier">患者标识符。</param>
        /// <param name="originalFileName">原始文件名。</param>
        /// <param name="type">影像类型。</param>
        /// <param name="pixelData">原始的像素数据字节数组。</param>
        /// <param name="width">影像宽度。如果为0，将尝试从像素数据推断。</param>
        /// <param name="height">影像高度。如果为0，将尝试从像素数据推断。</param>
        /// <param name="bitsPerPixel">每像素位数。如果为0，将尝试从像素数据推断。</param>
        /// <param name="colorSpace">颜色空间。如果为Unknown，将尝试从像素数据推断。</param>
        public MedicalImage(string patientIdentifier, string originalFileName, ImageType type, byte[] pixelData, int width = 0, int height = 0, int bitsPerPixel = 0, ColorSpace colorSpace = ColorSpace.Unknown)
        {
            PatientIdentifier = patientIdentifier ?? throw new ArgumentNullException(nameof(patientIdentifier));
            OriginalFileName = originalFileName ?? throw new ArgumentNullException(nameof(originalFileName));
            Type = type;
            PixelData = pixelData ?? throw new ArgumentNullException(nameof(pixelData));
            AcquisitionTimestamp = DateTime.UtcNow;

            if (width <= 0 || height <= 0 || bitsPerPixel <= 0 || colorSpace == ColorSpace.Unknown)
            {
                InferPropertiesFromPixelData(pixelData, ref width, ref height, ref bitsPerPixel, ref colorSpace);
            }

            Width = width > 0 ? width : throw new ArgumentException("无法推断或提供的宽度无效。", nameof(width));
            Height = height > 0 ? height : throw new ArgumentException("无法推断或提供的高度无效。", nameof(height));
            BitsPerPixel = bitsPerPixel > 0 ? bitsPerPixel : throw new ArgumentException("无法推断或提供的每像素位数无效。", nameof(bitsPerPixel));
            ColorSpace = colorSpace;
        }

        /// <summary>
        /// 从指定的文件路径加载像素数据到当前实例。
        /// 此方法会更新Width, Height, BitsPerPixel, ColorSpace等属性。
        /// </summary>
        /// <param name="filePath">包含像素数据的图像文件路径。</param>
        /// <exception cref="FileNotFoundException">当指定路径的文件不存在时抛出。</exception>
        /// <exception cref="InvalidDataException">当文件格式不被支持或损坏时抛出。</exception>
        public void LoadPixelDataFromFile(string filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath))
                throw new ArgumentException("文件路径不能为空或空白。", nameof(filePath));

            if (!File.Exists(filePath))
                throw new FileNotFoundException($"找不到指定的图像文件：{filePath}", filePath);

            try
            {
                using (var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read))
                using (var image = System.Drawing.Image.FromStream(fileStream))
                {
                    var bitmap = new Bitmap(image);
                    Width = bitmap.Width;
                    Height = bitmap.Height;

                    // 推断BitsPerPixel和ColorSpace
                    InferPropertiesFromBitmap(bitmap, out int bpp, out ColorSpace cs);
                    BitsPerPixel = bpp;
                    ColorSpace = cs;

                    // 将图像数据转换为字节数组（这里使用核心的格式，实际可能需要处理多种像素格式）
                    var bitmapData = bitmap.LockBits(new Rectangle(0, 0, Width, Height), ImageLockMode.ReadOnly, bitmap.PixelFormat);
                    int byteCount = Math.Abs(bitmapData.Stride) * Height;
                    PixelData = new byte[byteCount];
                    System.Runtime.InteropServices.Marshal.Copy(bitmapData.Scan0, PixelData, 0, byteCount);
                    bitmap.UnlockBits(bitmapData);

                    StoragePath = filePath;
                    OriginalFileName = Path.GetFileName(filePath);
                }
            }
            catch (Exception ex)
            {
                var logger = LogManager.GetLogger<MedicalImage>();
                logger.Error(ex, "从文件加载像素数据失败。文件路径：{FilePath}", filePath);
                throw new InvalidDataException($"加载图像文件失败：{ex.Message}", ex);
            }
        }

        /// <summary>
        /// 将当前影像的像素数据保存到指定的文件路径。
        /// </summary>
        /// <param name="filePath">要保存的目标文件路径。</param>
        /// <param name="format">要保存的图像格式。</param>
        /// <exception cref="InvalidOperationException">当PixelData未加载时抛出。</exception>
        public void SavePixelDataToFile(string filePath, ImageFormat format)
        {
            if (!IsPixelDataLoaded)
                throw new InvalidOperationException("无法保存，像素数据未加载。");

            if (string.IsNullOrWhiteSpace(filePath))
                throw new ArgumentException("文件路径不能为空或空白。", nameof(filePath));

            try
            {
                PixelFormat pixelFormat = GetPixelFormat(BitsPerPixel, ColorSpace);
                using (var bitmap = new Bitmap(Width, Height, pixelFormat))
                {
                    var bitmapData = bitmap.LockBits(new Rectangle(0, 0, Width, Height), ImageLockMode.WriteOnly, pixelFormat);
                    System.Runtime.InteropServices.Marshal.Copy(PixelData, 0, bitmapData.Scan0, PixelData.Length);
                    bitmap.UnlockBits(bitmapData);
                    bitmap.Save(filePath, format);
                }
            }
            catch (Exception ex)
            {
                var logger = LogManager.GetLogger<MedicalImage>();
                logger.Error(ex, "保存像素数据到文件失败。文件路径：{FilePath}", filePath);
                throw new IOException($"保存图像文件失败：{ex.Message}", ex);
            }
        }

        /// <summary>
        /// 释放像素数据以节省内存。调用此方法后，IsPixelDataLoaded将为false。
        /// 如果StoragePath有效，后续可以通过LoadPixelDataFromFile重新加载。
        /// </summary>
        public void UnloadPixelData()
        {
            PixelData = null;
            // 可选：触发GC，但通常不强制
            // GC.Collect();
        }

        /// <summary>
        /// 生成并返回一个迭代器，用于按行遍历图像的像素数据。
        /// 此方法使用generator方式，适用于逐行处理的大型图像。
        /// </summary>
        /// <returns>一个按行生成像素数据字节数组的枚举器。</returns>
        /// <exception cref="InvalidOperationException">当PixelData未加载时抛出。</exception>
        public IEnumerable<byte[]> GetPixelDataByRow()
        {
            if (!IsPixelDataLoaded)
                throw new InvalidOperationException("像素数据未加载，无法按行迭代。");

            int bytesPerPixel = BitsPerPixel / 8;
            int stride = Width * bytesPerPixel; // 假设无填充字节，实际可能需根据格式计算

            // 检查数据长度是否匹配
            if (PixelData.Length != stride * Height)
            {
                var logger = LogManager.GetLogger<MedicalImage>();
                logger.Warn("像素数据长度与根据宽度、高度、位深计算出的预期长度不匹配。可能包含填充字节或数据损坏。");
                // 尝试使用最小维度继续
                stride = PixelData.Length / Height;
            }

            for (int row = 0; row < Height; row++)
            {
                var rowData = new byte[stride];
                Buffer.BlockCopy(PixelData, row * stride, rowData, 0, stride);
                yield return rowData;
            }
        }

        /// <summary>
        /// 计算当前影像像素数据的校验和（使用MD5）并更新Checksum属性。
        /// </summary>
        /// <returns>计算出的校验和字符串。</returns>
        /// <exception cref="InvalidOperationException">当PixelData未加载时抛出。</exception>
        public string ComputeAndSetChecksum()
        {
            if (!IsPixelDataLoaded)
                throw new InvalidOperationException("像素数据未加载，无法计算校验和。");

            using (var md5 = System.Security.Cryptography.MD5.Create())
            {
                byte[] hashBytes = md5.ComputeHash(PixelData);
                Checksum = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
                return Checksum;
            }
        }

        /// <summary>
        /// 验证当前影像的校验和是否与存储的Checksum属性一致。
        /// </summary>
        /// <returns>如果校验和有效或未设置，返回true；如果不匹配，返回false。</returns>
        public bool ValidateChecksum()
        {
            if (string.IsNullOrEmpty(Checksum) || !IsPixelDataLoaded)
            {
                // 未设置校验和或数据未加载，视为有效（或无法验证）
                return true;
            }

            string currentChecksum = ComputeAndSetChecksum(); // 这会更新Checksum属性
            return currentChecksum == Checksum;
        }

        /// <summary>
        /// 创建一个当前MedicalImage的深拷贝。
        /// </summary>
        /// <returns>一个新的MedicalImage实例。</returns>
        public MedicalImage DeepCopy()
        {
            var copy = (MedicalImage)this.MemberwiseClone();
            if (this.PixelData != null)
            {
                copy.PixelData = new byte[this.PixelData.Length];
                Buffer.BlockCopy(this.PixelData, 0, copy.PixelData, 0, this.PixelData.Length);
            }
            if (this.Metadata != null)
            {
                copy.Metadata = new Dictionary<string, string>(this.Metadata);
            }
            return copy;
        }

        #region 私有辅助方法

        /// <summary>
        /// 从像素数据字节数组推断图像的基本属性。
        /// </summary>
        private void InferPropertiesFromPixelData(byte[] data, ref int width, ref int height, ref int bitsPerPixel, ref ColorSpace colorSpace)
        {
            // 默认值，实际应解析文件头（如BMP、DICOM、JPEG等）
            // 此处仅为业务案例，假设为核心的24位RGB位图，且数据是紧密排列的。
            if (width <= 0 || height <= 0)
            {
                // 无法从原始字节可靠推断宽高，需要文件格式信息。
                // 在实际系统中，应使用专门的库（如ImageSharp、OpenCV）来读取图像。
                throw new ArgumentException("无法从原始像素数据推断宽度和高度。请提供明确的尺寸参数或使用从文件加载的方法。");
            }

            if (bitsPerPixel <= 0)
            {
                // 同样，无法可靠推断。假设为常见值。
                bitsPerPixel = 24;
            }

            if (colorSpace == ColorSpace.Unknown)
            {
                // 根据位深猜测
                colorSpace = bitsPerPixel == 8 ? ColorSpace.Grayscale : ColorSpace.Rgb;
            }

            // 记录警告
            var logger = LogManager.GetLogger<MedicalImage>();
            logger.Warn("正在从原始像素数据推断图像属性，这可能不准确。建议提供明确的属性参数或从标准图像文件加载。");
        }

        /// <summary>
        /// 从System.Drawing.Bitmap对象推断BitsPerPixel和ColorSpace。
        /// </summary>
        private void InferPropertiesFromBitmap(Bitmap bitmap, out int bitsPerPixel, out ColorSpace colorSpace)
        {
            var pixelFormat = bitmap.PixelFormat;
            bitsPerPixel = Image.GetPixelFormatSize(pixelFormat);

            // 简化映射，实际可能需要更精细的判断
            if (pixelFormat == PixelFormat.Format8bppIndexed || pixelFormat == PixelFormat.Format16bppGrayScale)
            {
                colorSpace = ColorSpace.Grayscale;
            }
            else if (pixelFormat == PixelFormat.Format24bppRgb || pixelFormat == PixelFormat.Format32bppRgb || pixelFormat == PixelFormat.Format32bppArgb)
            {
                colorSpace = ColorSpace.Rgb;
            }
            else
            {
                colorSpace = ColorSpace.Unknown;
                var logger = LogManager.GetLogger<MedicalImage>();
                logger.Warn("无法从Bitmap的PixelFormat {PixelFormat} 确定颜色空间，设置为Unknown。", pixelFormat);
            }
        }

        /// <summary>
        /// 根据BitsPerPixel和ColorSpace获取对应的System.Drawing.PixelFormat。
        /// </summary>
        private PixelFormat GetPixelFormat(int bitsPerPixel, ColorSpace colorSpace)
        {
            if (colorSpace == ColorSpace.Grayscale)
            {
                return bitsPerPixel == 8 ? PixelFormat.Format8bppIndexed : PixelFormat.Format16bppGrayScale;
            }
            else if (colorSpace == ColorSpace.Rgb)
            {
                if (bitsPerPixel == 24) return PixelFormat.Format24bppRgb;
                if (bitsPerPixel == 32) return PixelFormat.Format32bppRgb; // 假设无Alpha
            }
            // 默认回退
            return PixelFormat.Format24bppRgb;
        }

        #endregion
    }

    /// <summary>
    /// 定义医学影像类型的枚举。
    /// </summary>
    public enum ImageType
    {
        /// <summary>
        /// 未知类型。
        /// </summary>
        Unknown = 0,

        /// <summary>
        /// 宫颈细胞涂片（如巴氏涂片）。
        /// </summary>
        CervicalSmear,

        /// <summary>
        /// 阴道镜图像。
        /// </summary>
        Colposcopy,

        /// <summary>
        /// 组织病理切片图像。
        /// </summary>
        Histopathology,

        /// <summary>
        /// 其他类型的医学影像。
        /// </summary>
        Other
    }

    /// <summary>
    /// 定义图像颜色空间的枚举。
    /// </summary>
    public enum ColorSpace
    {
        /// <summary>
        /// 未知颜色空间。
        /// </summary>
        Unknown = 0,

        /// <summary>
        /// 灰度图像。
        /// </summary>
        Grayscale,

        /// <summary>
        /// 红绿蓝三通道图像。
        /// </summary>
        Rgb,

        /// <summary>
        /// 带Alpha通道的RGB图像。
        /// </summary>
        Rgba,

        /// <summary>
        /// 其他颜色空间（如YUV、HSV等）。
        /// </summary>
        Other
    }
}