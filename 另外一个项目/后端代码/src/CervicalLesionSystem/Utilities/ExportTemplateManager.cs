using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace CervicalLesionSystem.Utilities
{
    /// <summary>
    /// 导出模板管理器接口
    /// 定义模板加载、验证和渲染的核心操作
    /// </summary>
    public interface IExportTemplateManager
    {
        /// <summary>
        /// 加载指定标识符的模板
        /// </summary>
        /// <param name="templateIdentifier">模板标识符</param>
        /// <returns>加载的模板对象</returns>
        TemplateDescriptor LoadTemplate(string templateIdentifier);

        /// <summary>
        /// 验证模板内容是否符合规范
        /// </summary>
        /// <param name="template">待验证的模板</param>
        /// <returns>验证结果</returns>
        ValidationResult ValidateTemplate(TemplateDescriptor template);

        /// <summary>
        /// 使用提供的模型数据渲染模板
        /// </summary>
        /// <param name="template">模板描述符</param>
        /// <param name="modelData">渲染所需的数据模型</param>
        /// <returns>渲染后的字符串内容</returns>
        string RenderTemplate(TemplateDescriptor template, object modelData);
    }

    /// <summary>
    /// 模板描述符，封装模板的元数据和内容
    /// </summary>
    public class TemplateDescriptor
    {
        public string Identifier { get; set; }
        public string Name { get; set; }
        public string Version { get; set; }
        public string InstitutionCode { get; set; }
        public string TemplateContent { get; set; }
        public DateTime LastModified { get; set; }
        public Dictionary<string, string> Metadata { get; set; } = new Dictionary<string, string>();
    }

    /// <summary>
    /// 模板验证结果
    /// </summary>
    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public IReadOnlyList<string> ErrorMessages { get; set; } = new List<string>();
        public IReadOnlyList<string> WarningMessages { get; set; } = new List<string>();
    }

    /// <summary>
    /// 基础模板管理器，实现核心功能
    /// </summary>
    public class BaseExportTemplateManager : IExportTemplateManager
    {
        protected readonly ILogger<BaseExportTemplateManager> Logger;
        protected readonly string TemplateDirectory;

        public BaseExportTemplateManager(ILogger<BaseExportTemplateManager> logger, string templateDirectory)
        {
            Logger = logger ?? throw new ArgumentNullException(nameof(logger));
            TemplateDirectory = templateDirectory ?? throw new ArgumentNullException(nameof(templateDirectory));

            if (!Directory.Exists(TemplateDirectory))
            {
                Directory.CreateDirectory(TemplateDirectory);
                Logger.LogInformation("创建模板目录: {Directory}", TemplateDirectory);
            }
        }

        public virtual TemplateDescriptor LoadTemplate(string templateIdentifier)
        {
            if (string.IsNullOrWhiteSpace(templateIdentifier))
            {
                throw new ArgumentException("模板标识符不能为空", nameof(templateIdentifier));
            }

            string templateFilePath = Path.Combine(TemplateDirectory, $"{templateIdentifier}.json");
            if (!File.Exists(templateFilePath))
            {
                Logger.LogWarning("模板文件不存在: {FilePath}", templateFilePath);
                throw new FileNotFoundException($"模板文件未找到: {templateIdentifier}", templateFilePath);
            }

            try
            {
                string jsonContent = File.ReadAllText(templateFilePath);
                var template = JsonSerializer.Deserialize<TemplateDescriptor>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (template == null)
                {
                    throw new InvalidOperationException("模板反序列化失败");
                }

                Logger.LogDebug("成功加载模板: {Identifier}", templateIdentifier);
                return template;
            }
            catch (JsonException ex)
            {
                Logger.LogError(ex, "模板JSON解析失败: {FilePath}", templateFilePath);
                throw new FormatException($"模板文件格式错误: {templateIdentifier}", ex);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "加载模板时发生未知错误: {FilePath}", templateFilePath);
                throw;
            }
        }

        public virtual ValidationResult ValidateTemplate(TemplateDescriptor template)
        {
            if (template == null)
            {
                throw new ArgumentNullException(nameof(template));
            }

            var errorMessages = new List<string>();
            var warningMessages = new List<string>();

            // 验证必需字段
            if (string.IsNullOrWhiteSpace(template.Identifier))
            {
                errorMessages.Add("模板标识符不能为空");
            }

            if (string.IsNullOrWhiteSpace(template.Name))
            {
                errorMessages.Add("模板名称不能为空");
            }

            if (string.IsNullOrWhiteSpace(template.TemplateContent))
            {
                errorMessages.Add("模板内容不能为空");
            }

            // 验证模板内容语法
            if (!string.IsNullOrWhiteSpace(template.TemplateContent))
            {
                ValidateTemplateSyntax(template.TemplateContent, errorMessages, warningMessages);
            }

            // 验证版本格式
            if (!string.IsNullOrWhiteSpace(template.Version) && !Regex.IsMatch(template.Version, @"^\d+\.\d+\.\d+$"))
            {
                warningMessages.Add($"版本号格式可能不规范: {template.Version}");
            }

            bool isValid = errorMessages.Count == 0;
            var result = new ValidationResult
            {
                IsValid = isValid,
                ErrorMessages = errorMessages,
                WarningMessages = warningMessages
            };

            if (isValid)
            {
                Logger.LogDebug("模板验证通过: {Identifier}", template.Identifier);
            }
            else
            {
                Logger.LogWarning("模板验证失败: {Identifier}, 错误数: {ErrorCount}", template.Identifier, errorMessages.Count);
            }

            return result;
        }

        public virtual string RenderTemplate(TemplateDescriptor template, object modelData)
        {
            if (template == null)
            {
                throw new ArgumentNullException(nameof(template));
            }

            if (modelData == null)
            {
                throw new ArgumentNullException(nameof(modelData));
            }

            // 先验证模板
            var validationResult = ValidateTemplate(template);
            if (!validationResult.IsValid)
            {
                throw new InvalidOperationException($"模板验证失败: {string.Join("; ", validationResult.ErrorMessages)}");
            }

            try
            {
                string renderedContent = PerformTemplateRendering(template.TemplateContent, modelData);
                Logger.LogDebug("模板渲染完成: {Identifier}", template.Identifier);
                return renderedContent;
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "模板渲染失败: {Identifier}", template.Identifier);
                throw new TemplateRenderingException($"模板渲染失败: {template.Identifier}", ex);
            }
        }

        /// <summary>
        /// 执行实际的模板渲染逻辑
        /// </summary>
        protected virtual string PerformTemplateRendering(string templateContent, object modelData)
        {
            // 核心的占位符替换实现，实际项目中可替换为更强大的模板引擎
            string result = templateContent;
            var properties = modelData.GetType().GetProperties();

            foreach (var property in properties)
            {
                string placeholder = $"{{{{{property.Name}}}}}";
                object value = property.GetValue(modelData);
                string stringValue = value?.ToString() ?? string.Empty;
                result = result.Replace(placeholder, stringValue);
            }

            return result;
        }

        /// <summary>
        /// 验证模板语法
        /// </summary>
        protected virtual void ValidateTemplateSyntax(string templateContent, List<string> errors, List<string> warnings)
        {
            // 检查未闭合的占位符
            int openBraces = templateContent.Count(c => c == '{');
            int closeBraces = templateContent.Count(c => c == '}');
            
            if (openBraces != closeBraces)
            {
                errors.Add("模板中的花括号未匹配");
            }

            // 检查可能的占位符格式错误
            var placeholderPattern = @"\{\{(\w+)\}\}";
            var matches = Regex.Matches(templateContent, placeholderPattern);
            
            foreach (Match match in matches)
            {
                if (match.Success)
                {
                    string placeholderName = match.Groups[1].Value;
                    if (string.IsNullOrWhiteSpace(placeholderName))
                    {
                        warnings.Add("检测到空的占位符名称");
                    }
                }
            }

            // 检查模板长度限制
            const int maxTemplateLength = 100000;
            if (templateContent.Length > maxTemplateLength)
            {
                warnings.Add($"模板内容过长，可能影响渲染性能: {templateContent.Length} 字符");
            }
        }
    }

    /// <summary>
    /// 模板渲染异常
    /// </summary>
    public class TemplateRenderingException : Exception
    {
        public TemplateRenderingException(string message) : base(message)
        {
        }

        public TemplateRenderingException(string message, Exception innerException) : base(message, innerException)
        {
        }
    }

    /// <summary>
    /// 模板管理器装饰器基类
    /// </summary>
    public abstract class ExportTemplateManagerDecorator : IExportTemplateManager
    {
        protected readonly IExportTemplateManager InnerManager;

        protected ExportTemplateManagerDecorator(IExportTemplateManager innerManager)
        {
            InnerManager = innerManager ?? throw new ArgumentNullException(nameof(innerManager));
        }

        public virtual TemplateDescriptor LoadTemplate(string templateIdentifier)
        {
            return InnerManager.LoadTemplate(templateIdentifier);
        }

        public virtual ValidationResult ValidateTemplate(TemplateDescriptor template)
        {
            return InnerManager.ValidateTemplate(template);
        }

        public virtual string RenderTemplate(TemplateDescriptor template, object modelData)
        {
            return InnerManager.RenderTemplate(template, modelData);
        }
    }

    /// <summary>
    /// 缓存装饰器，提供模板缓存功能
    /// </summary>
    public class CachingTemplateManagerDecorator : ExportTemplateManagerDecorator
    {
        private readonly Dictionary<string, TemplateDescriptor> _templateCache = new Dictionary<string, TemplateDescriptor>();
        private readonly TimeSpan _cacheDuration;
        private readonly Dictionary<string, DateTime> _cacheTimestamps = new Dictionary<string, DateTime>();
        private readonly ILogger<CachingTemplateManagerDecorator> _logger;

        public CachingTemplateManagerDecorator(IExportTemplateManager innerManager, TimeSpan cacheDuration, ILogger<CachingTemplateManagerDecorator> logger) 
            : base(innerManager)
        {
            _cacheDuration = cacheDuration;
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public override TemplateDescriptor LoadTemplate(string templateIdentifier)
        {
            if (_templateCache.TryGetValue(templateIdentifier, out var cachedTemplate))
            {
                if (_cacheTimestamps.TryGetValue(templateIdentifier, out var timestamp))
                {
                    if (DateTime.UtcNow - timestamp < _cacheDuration)
                    {
                        _logger.LogDebug("从缓存加载模板: {Identifier}", templateIdentifier);
                        return cachedTemplate;
                    }
                    else
                    {
                        _logger.LogDebug("缓存已过期，重新加载模板: {Identifier}", templateIdentifier);
                        _templateCache.Remove(templateIdentifier);
                        _cacheTimestamps.Remove(templateIdentifier);
                    }
                }
            }

            var template = base.LoadTemplate(templateIdentifier);
            _templateCache[templateIdentifier] = template;
            _cacheTimestamps[templateIdentifier] = DateTime.UtcNow;
            
            _logger.LogDebug("模板已缓存: {Identifier}", templateIdentifier);
            return template;
        }

        public void ClearCache()
        {
            _templateCache.Clear();
            _cacheTimestamps.Clear();
            _logger.LogInformation("模板缓存已清空");
        }

        public void RemoveFromCache(string templateIdentifier)
        {
            if (_templateCache.Remove(templateIdentifier))
            {
                _cacheTimestamps.Remove(templateIdentifier);
                _logger.LogDebug("模板已从缓存移除: {Identifier}", templateIdentifier);
            }
        }
    }

    /// <summary>
    /// 重试装饰器，提供模板加载重试机制
    /// </summary>
    public class RetryTemplateManagerDecorator : ExportTemplateManagerDecorator
    {
        private readonly int _maxRetryCount;
        private readonly TimeSpan _retryDelay;
        private readonly ILogger<RetryTemplateManagerDecorator> _logger;

        public RetryTemplateManagerDecorator(IExportTemplateManager innerManager, int maxRetryCount, TimeSpan retryDelay, ILogger<RetryTemplateManagerDecorator> logger) 
            : base(innerManager)
        {
            if (maxRetryCount < 1)
            {
                throw new ArgumentException("重试次数必须大于0", nameof(maxRetryCount));
            }

            _maxRetryCount = maxRetryCount;
            _retryDelay = retryDelay;
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public override TemplateDescriptor LoadTemplate(string templateIdentifier)
        {
            int attempt = 0;
            while (true)
            {
                attempt++;
                try
                {
                    return base.LoadTemplate(templateIdentifier);
                }
                catch (Exception ex) when (attempt < _maxRetryCount && IsTransientError(ex))
                {
                    _logger.LogWarning(ex, "模板加载失败，正在进行第 {Attempt} 次重试: {Identifier}", attempt, templateIdentifier);
                    System.Threading.Thread.Sleep(_retryDelay);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "模板加载失败，已达到最大重试次数: {Identifier}", templateIdentifier);
                    throw;
                }
            }
        }

        private bool IsTransientError(Exception exception)
        {
            // 判断是否为可重试的瞬时错误
            return exception is IOException ||
                   exception is UnauthorizedAccessException ||
                   (exception is InvalidOperationException && exception.Message.Contains("正由另一进程使用"));
        }
    }

    /// <summary>
    /// 验证增强装饰器，提供额外的模板验证
    /// </summary>
    public class EnhancedValidationTemplateManagerDecorator : ExportTemplateManagerDecorator
    {
        private readonly ILogger<EnhancedValidationTemplateManagerDecorator> _logger;

        public EnhancedValidationTemplateManagerDecorator(IExportTemplateManager innerManager, ILogger<EnhancedValidationTemplateManagerDecorator> logger) 
            : base(innerManager)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public override ValidationResult ValidateTemplate(TemplateDescriptor template)
        {
            var baseResult = base.ValidateTemplate(template);
            
            if (!baseResult.IsValid)
            {
                return baseResult;
            }

            var enhancedErrors = new List<string>(baseResult.ErrorMessages);
            var enhancedWarnings = new List<string>(baseResult.WarningMessages);

            // 执行额外的验证规则
            ValidateInstitutionSpecificRules(template, enhancedErrors, enhancedWarnings);
            ValidateTemplateComplexity(template, enhancedWarnings);
            ValidateRequiredPlaceholders(template, enhancedErrors);

            bool isValid = enhancedErrors.Count == 0;
            var enhancedResult = new ValidationResult
            {
                IsValid = isValid,
                ErrorMessages = enhancedErrors,
                WarningMessages = enhancedWarnings
            };

            if (isValid)
            {
                _logger.LogDebug("增强验证通过: {Identifier}", template.Identifier);
            }

            return enhancedResult;
        }

        private void ValidateInstitutionSpecificRules(TemplateDescriptor template, List<string> errors, List<string> warnings)
        {
            // 机构特定的验证规则
            if (!string.IsNullOrEmpty(template.InstitutionCode))
            {
                // 业务案例：检查机构代码格式
                if (!Regex.IsMatch(template.InstitutionCode, @"^[A-Z]{2}\d{4}$"))
                {
                    warnings.Add($"机构代码格式可能不符合标准: {template.InstitutionCode}");
                }
            }
        }

        private void ValidateTemplateComplexity(TemplateDescriptor template, List<string> warnings)
        {
            // 检查模板复杂度
            int placeholderCount = Regex.Matches(template.TemplateContent, @"\{\{\w+\}\}").Count;
            if (placeholderCount > 50)
            {
                warnings.Add($"模板包含大量占位符({placeholderCount}个)，可能影响渲染性能");
            }
        }

        private void ValidateRequiredPlaceholders(TemplateDescriptor template, List<string> errors)
        {
            // 检查必需占位符是否存在
            var requiredPlaceholders = new[] { "PatientName", "DiagnosisDate", "RiskLevel" };
            
            foreach (var placeholder in requiredPlaceholders)
            {
                string pattern = $"\\{{{{{placeholder}\\}}}}";
                if (!Regex.IsMatch(template.TemplateContent, pattern))
                {
                    errors.Add($"模板缺少必需占位符: {placeholder}");
                }
            }
        }
    }

    /// <summary>
    /// 模板管理器工厂，用于创建装饰后的模板管理器
    /// </summary>
    public static class ExportTemplateManagerFacility
    {
        public static IExportTemplateManager CreateDefaultManager(ILoggerFacility loggerFacility, string templateDirectory)
        {
            if (loggerFacility == null)
            {
                throw new ArgumentNullException(nameof(loggerFacility));
            }

            var baseLogger = loggerFacility.CreateLogger<BaseExportTemplateManager>();
            var baseManager = new BaseExportTemplateManager(baseLogger, templateDirectory);

            var cachingLogger = loggerFacility.CreateLogger<CachingTemplateManagerDecorator>();
            var cachingManager = new CachingTemplateManagerDecorator(baseManager, TimeSpan.FromMinutes(30), cachingLogger);

            var retryLogger = loggerFacility.CreateLogger<RetryTemplateManagerDecorator>();
            var retryManager = new RetryTemplateManagerDecorator(cachingManager, 3, TimeSpan.FromSeconds(1), retryLogger);

            var validationLogger = loggerFacility.CreateLogger<EnhancedValidationTemplateManagerDecorator>();
            var enhancedManager = new EnhancedValidationTemplateManagerDecorator(retryManager, validationLogger);

            return enhancedManager;
        }

        public static IExportTemplateManager CreateCustomManager(
            ILoggerFacility loggerFacility,
            string templateDirectory,
            bool enableCaching = true,
            bool enableRetry = true,
            bool enableEnhancedValidation = true)
        {
            if (loggerFacility == null)
            {
                throw new ArgumentNullException(nameof(loggerFacility));
            }

            IExportTemplateManager manager = new BaseExportTemplateManager(
                loggerFacility.CreateLogger<BaseExportTemplateManager>(), 
                templateDirectory);

            if (enableCaching)
            {
                manager = new CachingTemplateManagerDecorator(
                    manager, 
                    TimeSpan.FromMinutes(30), 
                    loggerFacility.CreateLogger<CachingTemplateManagerDecorator>());
            }

            if (enableRetry)
            {
                manager = new RetryTemplateManagerDecorator(
                    manager, 
                    3, 
                    TimeSpan.FromSeconds(1), 
                    loggerFacility.CreateLogger<RetryTemplateManagerDecorator>());
            }

            if (enableEnhancedValidation)
            {
                manager = new EnhancedValidationTemplateManagerDecorator(
                    manager, 
                    loggerFacility.CreateLogger<EnhancedValidationTemplateManagerDecorator>());
            }

            return manager;
        }
    }
}