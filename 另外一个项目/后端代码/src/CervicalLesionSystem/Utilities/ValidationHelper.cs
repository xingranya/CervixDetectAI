using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace CervicalLesionSystem.Utilities
{
    /// <summary>
    /// 数据验证工具类，提供输入数据有效性的验证方法。
    /// 遵循单一职责原则，专注于验证逻辑。
    /// </summary>
    public class ValidationHelper
    {
        private readonly ILogger<ValidationHelper> _logger;

        /// <summary>
        /// 初始化验证助手的新实例。
        /// </summary>
        /// <param name="logger">日志记录器实例。</param>
        public ValidationHelper(ILogger<ValidationHelper> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// 验证医学影像文件路径的有效性。
        /// </summary>
        /// <param name="filePath">待验证的文件路径。</param>
        /// <param name="allowedExtensions">允许的文件扩展名集合。</param>
        /// <returns>验证结果，包含是否成功及错误信息。</returns>
        public ValidationResult ValidateImageFilePath(string filePath, IEnumerable<string> allowedExtensions)
        {
            if (string.IsNullOrWhiteSpace(filePath))
            {
                _logger.LogWarning("验证文件路径失败：路径为空或空白。");
                return ValidationResult.Failure("文件路径不能为空。");
            }

            if (!File.Exists(filePath))
            {
                _logger.LogWarning("验证文件路径失败：文件 '{FilePath}' 不存在。", filePath);
                return ValidationResult.Failure($"文件 '{filePath}' 不存在。");
            }

            var extension = Path.GetExtension(filePath)?.ToLowerInvariant();
            if (string.IsNullOrEmpty(extension))
            {
                _logger.LogWarning("验证文件路径失败：文件 '{FilePath}' 无扩展名。", filePath);
                return ValidationResult.Failure($"文件 '{filePath}' 无有效扩展名。");
            }

            // 使用生成器方式检查允许的扩展名
            var allowedExtensionSet = new HashSet<string>(allowedExtensions.Select(ext => ext.ToLowerInvariant()));
            if (!allowedExtensionSet.Contains(extension))
            {
                _logger.LogWarning("验证文件路径失败：文件扩展名 '{Extension}' 不被支持。", extension);
                return ValidationResult.Failure($"文件扩展名 '{extension}' 不被支持。允许的扩展名：{string.Join(", ", allowedExtensionSet)}。");
            }

            _logger.LogDebug("文件路径验证通过：'{FilePath}'。", filePath);
            return ValidationResult.Success();
        }

        /// <summary>
        /// 验证图像尺寸是否在允许的范围内。
        /// </summary>
        /// <param name="width">图像宽度。</param>
        /// <param name="height">图像高度。</param>
        /// <param name="maxWidth">最大允许宽度。</param>
        /// <param name="maxHeight">最大允许高度。</param>
        /// <param name="minWidth">最小允许宽度。</param>
        /// <param name="minHeight">最小允许高度。</param>
        /// <returns>验证结果。</returns>
        public ValidationResult ValidateImageDimensions(int width, int height, int maxWidth, int maxHeight, int minWidth = 1, int minHeight = 1)
        {
            if (width < minWidth || height < minHeight)
            {
                _logger.LogWarning("图像尺寸验证失败：尺寸过小 ({Width}x{Height})，最小要求为 {MinWidth}x{MinHeight}。", width, height, minWidth, minHeight);
                return ValidationResult.Failure($"图像尺寸过小 ({width}x{height})。最小要求为 {minWidth}x{minHeight}。");
            }

            if (width > maxWidth || height > maxHeight)
            {
                _logger.LogWarning("图像尺寸验证失败：尺寸过大 ({Width}x{Height})，最大允许为 {MaxWidth}x{MaxHeight}。", width, height, maxWidth, maxHeight);
                return ValidationResult.Failure($"图像尺寸过大 ({width}x{height})。最大允许为 {maxWidth}x{maxHeight}。");
            }

            _logger.LogDebug("图像尺寸验证通过：{Width}x{Height}。", width, height);
            return ValidationResult.Success();
        }

        /// <summary>
        /// 验证风险评估分数是否在有效范围内。
        /// </summary>
        /// <param name="score">待验证的风险分数。</param>
        /// <param name="minScore">最小有效分数（包含）。</param>
        /// <param name="maxScore">最大有效分数（包含）。</param>
        /// <returns>验证结果。</returns>
        public ValidationResult ValidateRiskScore(double score, double minScore = 0.0, double maxScore = 1.0)
        {
            if (score < minScore || score > maxScore)
            {
                _logger.LogWarning("风险分数验证失败：分数 {Score} 超出有效范围 [{MinScore}, {MaxScore}]。", score, minScore, maxScore);
                return ValidationResult.Failure($"风险分数 {score} 无效。有效范围应为 [{minScore}, {maxScore}]。");
            }

            if (double.IsNaN(score) || double.IsInfinity(score))
            {
                _logger.LogWarning("风险分数验证失败：分数 {Score} 不是有效数值。", score);
                return ValidationResult.Failure($"风险分数 {score} 不是有效的数值。");
            }

            _logger.LogDebug("风险分数验证通过：{Score}。", score);
            return ValidationResult.Success();
        }

        /// <summary>
        /// 验证患者标识符格式。
        /// </summary>
        /// <param name="patientIdentifier">患者标识符字符串。</param>
        /// <returns>验证结果。</returns>
        public ValidationResult ValidatePatientIdentifier(string patientIdentifier)
        {
            if (string.IsNullOrWhiteSpace(patientIdentifier))
            {
                _logger.LogWarning("患者标识符验证失败：标识符为空。");
                return ValidationResult.Failure("患者标识符不能为空。");
            }

            // 业务案例格式：字母开头，后跟数字和横线，长度6-20
            var identifierPattern = @"^[A-Za-z][A-Za-z0-9\-]{5,19}$";
            if (!Regex.IsMatch(patientIdentifier, identifierPattern))
            {
                _logger.LogWarning("患者标识符验证失败：格式不正确 '{Identifier}'。", patientIdentifier);
                return ValidationResult.Failure($"患者标识符 '{patientIdentifier}' 格式不正确。应为字母开头，可包含字母、数字和横线，长度6-20。");
            }

            _logger.LogDebug("患者标识符验证通过：'{Identifier}'。", patientIdentifier);
            return ValidationResult.Success();
        }

        /// <summary>
        /// 验证日期范围的有效性。
        /// </summary>
        /// <param name="startDate">开始日期。</param>
        /// <param name="endDate">结束日期。</param>
        /// <param name="allowSameDay">是否允许开始和结束日期相同。</param>
        /// <returns>验证结果。</returns>
        public ValidationResult ValidateDateRange(DateTime startDate, DateTime endDate, bool allowSameDay = false)
        {
            if (startDate > endDate)
            {
                _logger.LogWarning("日期范围验证失败：开始日期 {StartDate} 晚于结束日期 {EndDate}。", startDate, endDate);
                return ValidationResult.Failure($"开始日期 {startDate:yyyy-MM-dd} 不能晚于结束日期 {endDate:yyyy-MM-dd}。");
            }

            if (!allowSameDay && startDate.Date == endDate.Date)
            {
                _logger.LogWarning("日期范围验证失败：开始日期与结束日期相同 {Date}，但不允许相同。", startDate.Date);
                return ValidationResult.Failure($"开始日期和结束日期不能为同一天 ({startDate:yyyy-MM-dd})。");
            }

            _logger.LogDebug("日期范围验证通过：{StartDate} 至 {EndDate}。", startDate, endDate);
            return ValidationResult.Success();
        }

        /// <summary>
        /// 批量验证字符串集合，确保无空值或空白项。
        /// </summary>
        /// <param name="items">待验证的字符串集合。</param>
        /// <param name="parameterName">参数名称，用于错误信息。</param>
        /// <returns>验证结果。</returns>
        public ValidationResult ValidateStringCollection(IEnumerable<string> items, string parameterName)
        {
            if (items == null)
            {
                _logger.LogWarning("字符串集合验证失败：集合 '{ParameterName}' 为 null。", parameterName);
                return ValidationResult.Failure($"参数 '{parameterName}' 不能为 null。");
            }

            // 使用生成器方式迭代检查
            var invalidItems = items.Where(string.IsNullOrWhiteSpace).ToList();
            if (invalidItems.Any())
            {
                _logger.LogWarning("字符串集合验证失败：集合 '{ParameterName}' 中包含 {Count} 个空或空白项。", parameterName, invalidItems.Count);
                return ValidationResult.Failure($"参数 '{parameterName}' 中包含 {invalidItems.Count} 个无效的空或空白项。");
            }

            _logger.LogDebug("字符串集合验证通过：'{ParameterName}' 包含 {Count} 个有效项。", parameterName, items.Count());
            return ValidationResult.Success();
        }

        /// <summary>
        /// 验证模型文件路径和完整性（通过检查文件头签名业务案例）。
        /// </summary>
        /// <param name="modelPath">模型文件路径。</param>
        /// <param name="expectedSignature">预期的文件头签名（前几个字节）。</param>
        /// <returns>验证结果。</returns>
        public ValidationResult ValidateModelFile(string modelPath, byte[] expectedSignature)
        {
            var fileValidation = ValidateImageFilePath(modelPath, new[] { ".onnx", ".pb", ".tflite", ".model" });
            if (!fileValidation.IsValid)
            {
                return fileValidation;
            }

            try
            {
                using var fileStream = new FileStream(modelPath, FileMode.Open, FileAccess.Read);
                if (fileStream.Length < expectedSignature.Length)
                {
                    _logger.LogWarning("模型文件验证失败：文件 '{ModelPath}' 过小，可能已损坏。", modelPath);
                    return ValidationResult.Failure($"模型文件 '{modelPath}' 大小异常，可能已损坏。");
                }

                var signature = new byte[expectedSignature.Length];
                fileStream.Read(signature, 0, signature.Length);

                if (!signature.SequenceEqual(expectedSignature))
                {
                    _logger.LogWarning("模型文件验证失败：文件 '{ModelPath}' 签名不匹配。", modelPath);
                    return ValidationResult.Failure($"模型文件 '{modelPath}' 格式或签名不正确，可能不是有效的模型文件。");
                }

                _logger.LogDebug("模型文件验证通过：'{ModelPath}'。", modelPath);
                return ValidationResult.Success();
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "模型文件验证失败：无法访问文件 '{ModelPath}'。", modelPath);
                return ValidationResult.Failure($"无法访问模型文件 '{modelPath}'。请检查文件权限。");
            }
            catch (IOException ex)
            {
                _logger.LogError(ex, "模型文件验证失败：读取文件 '{ModelPath}' 时发生IO错误。", modelPath);
                return ValidationResult.Failure($"读取模型文件 '{modelPath}' 时发生错误。文件可能被占用或损坏。");
            }
        }
    }

    /// <summary>
    /// 表示验证操作的结果。
    /// </summary>
    public class ValidationResult
    {
        /// <summary>
        /// 获取一个值，指示验证是否成功。
        /// </summary>
        public bool IsValid { get; }

        /// <summary>
        /// 获取验证失败时的错误信息。验证成功时为 null 或空字符串。
        /// </summary>
        public string ErrorMessage { get; }

        private ValidationResult(bool isValid, string errorMessage)
        {
            IsValid = isValid;
            ErrorMessage = errorMessage;
        }

        /// <summary>
        /// 创建一个表示验证成功的实例。
        /// </summary>
        /// <returns>验证成功的实例。</returns>
        public static ValidationResult Success() => new ValidationResult(true, null);

        /// <summary>
        /// 创建一个表示验证失败的实例。
        /// </summary>
        /// <param name="errorMessage">错误描述信息。</param>
        /// <returns>验证失败的实例。</returns>
        public static ValidationResult Failure(string errorMessage) => new ValidationResult(false, errorMessage ?? "验证失败。");
    }
}