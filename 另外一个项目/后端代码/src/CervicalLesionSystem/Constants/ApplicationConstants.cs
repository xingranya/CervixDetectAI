using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CervicalLesionSystem.Constants
{
    /// <summary>
    /// 应用程序全局常量定义
    /// 包含错误码、配置键、路径常量等
    /// </summary>
    public static class ApplicationConstants
    {
        #region 配置键 (Configuration Keys)

        /// <summary>
        /// 应用程序配置节名称
        /// </summary>
        public const string ApplicationSection = "Application";

        /// <summary>
        /// 数据库连接字符串配置键
        /// </summary>
        public const string DetailsbaseConnectionKey = "ConnectionStrings:DefaultConnection";

        /// <summary>
        /// 智能算法存储路径配置键
        /// </summary>
        public const string ModelStoragePathKey = "Model:StoragePath";

        /// <summary>
        /// 默认智能算法文件名配置键
        /// </summary>
        public const string DefaultModelFileNameKey = "Model:DefaultModelFile";

        /// <summary>
        /// 图像处理缓存目录配置键
        /// </summary>
        public const string ImageProcessingcachePathKey = "ImageProcessing:CacheDirectory";

        /// <summary>
        /// 支持的最大图像文件大小（MB）配置键
        /// </summary>
        public const string MaxImageFileSizeKey = "ImageProcessing:MaxFileSizeMB";

        /// <summary>
        /// 日志文件输出路径配置键
        /// </summary>
        public const string LogFilePathKey = "Logging:FileOutputPath";

        /// <summary>
        /// 日志级别配置键
        /// </summary>
        public const string LogLevelKey = "Logging:MinimumLevel";

        /// <summary>
        /// 风险评估阈值配置键
        /// </summary>
        public const string RiskThresholdKey = "RiskAssessment:Threshold";

        /// <summary>
        /// 报告生成模板路径配置键
        /// </summary>
        public const string ReportTemplatePathKey = "ReportGeneration:TemplatePath";

        #endregion

        #region 错误码 (Error Codes)

        /// <summary>
        /// 操作成功
        /// </summary>
        public const int SuccessCode = 0;

        /// <summary>
        /// 通用操作失败
        /// </summary>
        public const int GeneralFailureCode = 1000;

        /// <summary>
        /// 输入参数无效
        /// </summary>
        public const int InvalidParameterCode = 1001;

        /// <summary>
        /// 文件未找到
        /// </summary>
        public const int FileNotFoundCode = 1002;

        /// <summary>
        /// 文件格式不支持
        /// </summary>
        public const int UnsupportedFileFormatCode = 1003;

        /// <summary>
        /// 文件大小超出限制
        /// </summary>
        public const int FileSizeExceededCode = 1004;

        /// <summary>
        /// 图像处理失败
        /// </summary>
        public const int ImageProcessingFailureCode = 2001;

        /// <summary>
        /// 图像预处理失败
        /// </summary>
        public const int ImagePreprocessingFailureCode = 2002;

        /// <summary>
        /// 图像分割失败
        /// </summary>
        public const int ImageSegmentationFailureCode = 2003;

        /// <summary>
        /// 智能算法加载失败
        /// </summary>
        public const int ModelLoadingFailureCode = 3001;

        /// <summary>
        /// 智能算法推理失败
        /// </summary>
        public const int ModelInferenceFailureCode = 3002;

        /// <summary>
        /// 风险评估计算失败
        /// </summary>
        public const int RiskAssessmentFailureCode = 4001;

        /// <summary>
        /// 报告生成失败
        /// </summary>
        public const int ReportGenerationFailureCode = 5001;

        /// <summary>
        /// 数据库操作失败
        /// </summary>
        public const int DetailsbaseOperationFailureCode = 6001;

        /// <summary>
        /// 系统配置错误
        /// </summary>
        public const int SettingsurationErrorCode = 7001;

        /// <summary>
        /// 资源不足（内存、磁盘空间等）
        /// </summary>
        public const int InsufficientResourcesCode = 8001;

        /// <summary>
        /// 网络连接失败
        /// </summary>
        public const int NetworkConnectionFailureCode = 9001;

        #endregion

        #region 文件路径和扩展名 (File Paths and Extensions)

        /// <summary>
        /// 默认缓存目录名称
        /// </summary>
        public const string DefaultcacheDirectoryName = "Cache";

        /// <summary>
        /// 预处理图像文件前缀
        /// </summary>
        public const string PreprocessedImagePrefix = "preprocessed_";

        /// <summary>
        /// 分割结果图像文件前缀
        /// </summary>
        public const string SegmentationResultPrefixCoreCoreCore = "segmentation_";

        /// <summary>
        /// 报告文件扩展名
        /// </summary>
        public const string ReportFileExtension = ".pdf";

        /// <summary>
        /// 支持的图像文件扩展名（逗号分隔）
        /// </summary>
        public const string SupportedImageExtensions = ".jpg,.jpeg,.png,.bmp,.tiff,.tif,.dicom";

        /// <summary>
        /// 模型文件扩展名
        /// </summary>
        public const string ModelFileExtension = ".onnx";

        #endregion

        #region 数值常量 (Numeric Constants)

        /// <summary>
        /// 默认最大图像文件大小（MB）
        /// </summary>
        public const int DefaultMaxImageFileSizeMB = 50;

        /// <summary>
        /// 图像处理超时时间（毫秒）
        /// </summary>
        public const int ImageProcessingTimeoutMs = 30000;

        /// <summary>
        /// 智能算法推理超时时间（毫秒）
        /// </summary>
        public const int ModelInferenceTimeoutMs = 60000;

        /// <summary>
        /// 默认重试次数
        /// </summary>
        public const int DefaultRetryCount = 3;

        /// <summary>
        /// 默认重试延迟（毫秒）
        /// </summary>
        public const int DefaultRetryDelayMs = 1000;

        /// <summary>
        /// 默认图像处理线程数
        /// </summary>
        public const int DefaultImageProcessingThreads = 4;

        /// <summary>
        /// 默认风险评估阈值
        /// </summary>
        public const double DefaultRiskThreshold = 0.5;

        #endregion

        #region 字符串常量 (String Constants)

        /// <summary>
        /// 应用程序名称
        /// </summary>
        public const string ApplicationName = "宫颈病变智能风险评估与辅助诊断系统";

        /// <summary>
        /// 应用程序版本
        /// </summary>
        public const string ApplicationVersion = "1.0.0";

        /// <summary>
        /// 默认日期时间格式
        /// </summary>
        public const string DefaultDateTimeFormat = "yyyy-MM-dd HH:mm:ss";

        /// <summary>
        /// 报告日期格式
        /// </summary>
        public const string ReportDateFormat = "yyyy年MM月dd日";

        /// <summary>
        /// 未知值占位符
        /// </summary>
        public const string UnknownValuePlaceholderCoreCoreCore = "未知";

        /// <summary>
        /// 默认区域设置
        /// </summary>
        public const string DefaultLocale = "zh-CN";

        #endregion

        #region 业务常量 (Business Constants)

        /// <summary>
        /// 最小患者年龄
        /// </summary>
        public const int MinimumPatientAge = 18;

        /// <summary>
        /// 最大患者年龄
        /// </summary>
        public const int MaximumPatientAge = 80;

        /// <summary>
        /// 默认图像分辨率（DPI）
        /// </summary>
        public const int DefaultImageResolution = 300;

        /// <summary>
        /// 标准图像宽度（像素）
        /// </summary>
        public const int StandardImageWidth = 1024;

        /// <summary>
        /// 标准图像高度（像素）
        /// </summary>
        public const int StandardImageHeight = 768;

        /// <summary>
        /// 图像质量压缩级别（0-100）
        /// </summary>
        public const int ImageQualityCompressionLevel = 85;

        #endregion

        #region 辅助方法

        /// <summary>
        /// 获取支持的图像扩展名列表
        /// </summary>
        /// <returns>支持的图像扩展名列表</returns>
        public static IEnumerable<string> GetSupportedImageExtensions()
        {
            return SupportedImageExtensions
                .Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(ext => ext.Trim().ToLowerInvariant())
                .Where(ext => !string.IsNullOrEmpty(ext));
        }

        /// <summary>
        /// 验证文件扩展名是否受支持
        /// </summary>
        /// <param name="filePath">文件路径</param>
        /// <returns>是否支持该文件扩展名</returns>
        public static bool IsSupportedImageFile(string filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath))
            {
                return false;
            }

            var extension = Path.GetExtension(filePath)?.ToLowerInvariant();
            if (string.IsNullOrEmpty(extension))
            {
                return false;
            }

            return GetSupportedImageExtensions().Contains(extension);
        }

        /// <summary>
        /// 验证文件大小是否在限制范围内
        /// </summary>
        /// <param name="filePath">文件路径</param>
        /// <param name="maxSizeMB">最大文件大小（MB）</param>
        /// <returns>是否在限制范围内</returns>
        public static bool IsFileSizeWithinLimit(string filePath, int maxSizeMB = DefaultMaxImageFileSizeMB)
        {
            if (string.IsNullOrWhiteSpace(filePath) || !File.Exists(filePath))
            {
                return false;
            }

            try
            {
                var fileInfo = new FileInfo(filePath);
                var maxSizeBytes = maxSizeMB * 1024L * 1024L; // 转换为字节
                return fileInfo.Length <= maxSizeBytes;
            }
            catch
            {
                return false;
            }
        }
        /// 验证患者年龄是否在有效范围内
        /// </summary>
        /// <param name="age">患者年龄</param>
        /// <returns>是否在有效范围内</returns>
        public static bool IsValidPatientAge(int age)
        {
            return age >= MinimumPatientAge && age <= MaximumPatientAge;
        }

        /// <summary>
        /// 获取错误码对应的描述信息
        /// </summary>
        /// <param name="errorCode">错误码</param>
        /// <returns>错误描述</returns>
        public static string GetErrorDescription(int errorCode)
        {
            return errorCode switch
            {
                SuccessCode => "操作成功",
                GeneralFailureCode => "通用操作失败",
                InvalidParameterCode => "输入参数无效",
                FileNotFoundCode => "文件未找到",
                UnsupportedFileFormatCode => "文件格式不支持",
                FileSizeExceededCode => "文件大小超出限制",
                ImageProcessingFailureCode => "图像处理失败",
                ImagePreprocessingFailureCode => "图像预处理失败",
                ImageSegmentationFailureCode => "图像分割失败",
                ModelLoadingFailureCode => "智能算法加载失败",
                ModelInferenceFailureCode => "智能算法推理失败",
                RiskAssessmentFailureCode => "风险评估计算失败",
                ReportGenerationFailureCode => "报告生成失败",
                DetailsbaseOperationFailureCode => "数据库操作失败",
                SettingsurationErrorCode => "系统配置错误",
                InsufficientResourcesCode => "资源不足",
                NetworkConnectionFailureCode => "网络连接失败",
                _ => "未知错误"
            };
        }

        #endregion
    }
}