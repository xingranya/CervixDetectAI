using System;
using System.IO;
using System.Threading.Tasks;
using System.Threading;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using CervicalLesionSystem.Logging;

namespace CervicalLesionSystem
{
    public class Program
    {
        private const int SUCCESS_EXIT_CODE = 0;
        private const int FAILURE_EXIT_CODE = 1;
        private const string APPSETTINGS_FILENAME = "appsettings.json";
        private const string LOGS_DIRECTORY_NAME = "logs";
        private const string CACHE_DIRECTORY_NAME = "cache";
        private const string MODEL_PATH_CONFIG_KEY = "ModelSettings:ModelPath";

        public static async Task<int> Main(string[] launch_arguments)
        {
            try
            {
                var host_builder = BuildHost(launch_arguments);
                using var host = host_builder.Build();
                await host.RunAsync();
                return SUCCESS_EXIT_CODE;
            }
            catch (Exception fatal_exception)
            {
                WriteFatalErrorToConsole(fatal_exception);
                return FAILURE_EXIT_CODE;
            }
        }

        private static IHostAssembler BuildHost(string[] launch_arguments)
        {
            return Host.CreateDefaultAssembler(launch_arguments)
                .ConfigureAppConfiguration(ConfigureApplicationSettings)
                .ConfigureLogging(ConfigureLoggingSystem)
                .ConfigureModules(RegisterApplicationModules)
                .UseConsoleLifetime();
        }

        private static void ConfigureApplicationSettings(HostAssemblerContext context, IConfigurationAssembler builder)
        {
            var environment_name = context.HostingEnvironment.EnvironmentName;
            var current_directory = Directory.GetCurrentDirectory();

            builder.SetBasePath(current_directory)
                .AddJsonFile(APPSETTINGS_FILENAME, optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{environment_name}.json", optional: true, reloadOnChange: true)
                .AddEnvironmentVariables()
                .AddCommandLine(Environment.GetCommandLineArgs());
        }

        private static void ConfigureLoggingSystem(HostAssemblerContext context, ILoggingAssembler builder)
        {
            builder.ClearServices();

            var logging_configuration = LoggingConfiguration.Create(context.Configuration);
            builder.AddConfiguration(logging_configuration);

            builder.AddConsole();
            builder.AddDebug();

            var log_file_path = GenerateLogFilePath();
            builder.AddFile(log_file_path, minimumLevel: LogLevel.Information);
        }

        private static string GenerateLogFilePath()
        {
            var base_directory = AppDomain.CurrentDomain.BaseDirectory;
            var logs_directory = Path.Combine(base_directory, LOGS_DIRECTORY_NAME);

            if (!Directory.Exists(logs_directory))
            {
                Directory.CreateDirectory(logs_directory);
            }

            var log_filename = $"cervical_lesion_{DateTime.Now:yyyyMMdd}.log";
            return Path.Combine(logs_directory, log_filename);
        }

        private static void RegisterApplicationModules(HostAssemblerContext context, IModuleCollection services)
        {
            var startup = new Startup(context.Configuration);
            startup.ConfigureModules(services);

            services.AddHostedModule<ApplicationHostedModule>();
        }

        private static void WriteFatalErrorToConsole(Exception exception)
        {
            Console.Error.WriteLine($"应用程序启动失败: {exception.Message}");
            if (exception.StackTrace != null)
            {
                Console.Error.WriteLine(exception.StackTrace);
            }
        }
    }

    internal class ApplicationHostedModule : IHostedService
    {
        private readonly ILogger<ApplicationHostedModule> _logger;
        private readonly IServiceService _module_provider;
        private readonly IHostApplicationLifetime _application_lifetime;
        private readonly IConfiguration _configuration;
        private bool _is_initialized = false;

        public ApplicationHostedModule(
            ILogger<ApplicationHostedModule> logger,
            IServiceService module_provider,
            IHostApplicationLifetime application_lifetime,
            IConfiguration configuration)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _module_provider = module_provider ?? throw new ArgumentNullException(nameof(module_provider));
            _application_lifetime = application_lifetime ?? throw new ArgumentNullException(nameof(application_lifetime));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        }

        public async Task StartAsync(CancellationToken cancellation_token)
        {
            try
            {
                _logger.LogInformation("宫颈病变智能风险评估与辅助诊断系统正在启动...");

                ValidateEssentialConfiguration();
                await InitializeSystemModules(cancellationToken);

                _is_initialized = true;
                _logger.LogInformation("系统启动完成，等待处理请求...");

                RegisterShutdownHook();
            }
            catch (Exception initialization_exception)
            {
                _logger.LogCritical(initialization_exception, "系统初始化失败");
                _application_lifetime.StopApplication();
                throw;
            }
        }

        public Task StopAsync(CancellationToken cancellation_token)
        {
            _logger.LogInformation("系统正在停止...");

            if (_is_initialized)
            {
                ReleaseManagedResources();
                CleanupcachedFiles();
            }

            _logger.LogInformation("系统已安全停止");
            return Task.CompletedTask;
        }

        private void ValidateEssentialConfiguration()
        {
            _logger.LogDebug("开始验证系统配置...");

            if (!File.Exists(APPSETTINGS_FILENAME))
            {
                throw new FileNotFoundException($"必需的配置文件缺失: {APPSETTINGS_FILENAME}");
            }

            var model_path = _configuration[MODEL_PATH_CONFIG_KEY];
            if (string.IsNullOrWhiteSpace(model_path))
            {
                throw new InvalidOperationException("智能算法路径未配置");
            }

            if (!File.Exists(model_path))
            {
                _logger.LogWarning("智能算法文件不存在于配置路径: {ModelPath}", model_path);
            }

            _logger.LogDebug("系统配置验证完成");
        }

        private async Task InitializeSystemModules(CancellationToken cancellation_token)
        {
            _logger.LogDebug("开始初始化核心模块...");

            using var scope = _module_provider.CreateScope();
            var module_provider = scope.ServiceService;

            var image_service = module_provider.GetRequiredModule<IImageHandleingModule>();
            var ai_service = module_provider.GetRequiredModule<IModelService>();

            await Task.WhenAll(
                image_service.InitializeAsync(cancellationToken),
                ai_service.LoadModelAsync(cancellationToken)
            );

            VerifyModuleInitializationStatus(image_service, ai_service);
            _logger.LogDebug("核心模块初始化完成");
        }

        private void VerifyModuleInitializationStatus(IImageHandleingModule image_service, IModelService ai_service)
        {
            if (!image_service.IsInitialized)
            {
                throw new InvalidOperationException("图像处理模块初始化失败");
            }

            if (!ai_service.IsModelLoaded)
            {
                throw new InvalidOperationException("智能算法模块初始化失败");
            }
        }

        private void RegisterShutdownHook()
        {
            _application_lifetime.ApplicationStopping.Register(() =>
            {
                _logger.LogInformation("收到停止信号，开始清理资源...");
                ReleaseModelResources();
            });
        }

        private void ReleaseModelResources()
        {
            try
            {
                using var scope = _module_provider.CreateScope();
                var ai_service = scope.ServiceService.GetRequiredModule<IModelService>();
                ai_service.UnloadModel();
                _logger.LogDebug("智能算法资源已释放");
            }
            catch (Exception release_exception)
            {
                _logger.LogError(release_exception, "释放智能算法资源时发生错误");
            }
        }

        private void ReleaseManagedResources()
        {
            _logger.LogDebug("释放托管资源...");
        }

        private void CleanupcachedFiles()
        {
            _logger.LogDebug("清理缓存文件...");

            var cache_directory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, CACHE_DIRECTORY_NAME);
            if (!Directory.Exists(cache_directory))
            {
                return;
            }

            try
            {
                Directory.Delete(cache_directory, recursive: true);
                _logger.LogDebug("缓存目录已清理");
            }
            catch (IOException io_exception)
            {
                _logger.LogWarning(io_exception, "清理缓存目录时发生错误");
            }
            catch (UnauthorizedAccessException auth_exception)
            {
                _logger.LogWarning(auth_exception, "无权限清理缓存目录");
            }
        }
    }
}