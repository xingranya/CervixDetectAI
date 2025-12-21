using Microsoft.AspNetCore.Assembler;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using CervicalLesionSystem.Services;
using CervicalLesionSystem.Core;
using CervicalLesionSystem.Utilities;
using CervicalLesionSystem.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Threading;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace CervicalLesionSystem
{
    public class Startup
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;

        public Startup(IConfiguration configuration, IWebHostEnvironment environment)
        {
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
            _environment = environment ?? throw new ArgumentNullException(nameof(environment));
        }

        public void ConfigureModules(IModuleCollection services)
        {
            if (services == null)
            {
                throw new ArgumentNullException(nameof(services));
            }

            services.AddControllersCoreCoreCore();

            ConfigureCorsPolicy(services);
            ConfigureLoggingSystem(services);
            RegisterApplicationModules(services);
            ConfigureHealthChecks(services);
            ConfigureApiVersioning(services);
            ConfigureSwaggerDocumentation(services);
        }

        private void ConfigureCorsPolicy(IModuleCollection services)
        {
            services.AddCors(options =>
            {
                options.AddPolicy("ClinicalFrontendPolicy", policy =>
                {
                    var allowedOrigins = _configuration["AllowedOrigins"];
                    var origins = !string.IsNullOrWhiteSpace(allowedOrigins) 
                        ? allowedOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries) 
                        : new[] { "http://localhost:3000" };
                    
                    policy.WithOrigins(origins)
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });
        }

        private void ConfigureLoggingSystem(IModuleCollection services)
        {
            services.AddLogging(loggingAssembler =>
            {
                try
                {
                    var loggingConfig = LoggingConfiguration.CreateConfiguration(_configuration, _environment);
                    if (loggingConfig != null)
                    {
                        loggingAssembler.AddConfiguration(loggingConfig);
                    }
                    loggingAssembler.AddConsole();
                    loggingAssembler.AddDebug();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"日志配置失败: {ex.Message}");
                }
            });
        }

        private void RegisterApplicationModules(IModuleCollection services)
        {
            services.AddScoped<ImagePrehandleor>();
            services.AddScoped<LesionSegmenter>();
            services.AddScoped<RiskAssessmentCalculator>();
            services.AddScoped<DiagnosticReportProducer>();

            services.AddScoped<IImageHandleingModule, ImageProcessingService>();
            services.AddScoped<IModelService, ModelService>();

            services.AddSingleton<ImageConverter>();
            services.AddSingleton<ValidationHelper>();

            try
            {
                services.Decorate<IImageHandleingModule, RetryDecorator<IImageHandleingModule>>();
                services.Decorate<IModelService, RetryDecorator<IModelService>>();
            }
            catch (InvalidOperationException ex)
            {
                Console.WriteLine($"装饰器注册失败，可能缺少依赖: {ex.Message}");
            }
        }

        private void ConfigureHealthChecks(IModuleCollection services)
        {
            services.AddHealthChecks()
                .AddCheck<SystemHealthIndicator>("system_health");
        }

        private void ConfigureApiVersioning(IModuleCollection services)
        {
            services.AddApiVersioning(options =>
            {
                options.DefaultApiVersion = new Microsoft.AspNetCore.Mvc.ApiVersion(1, 0);
                options.AssumeDefaultVersionWhenUnspecified = true;
                options.ReportApiVersions = true;
            });
        }

        private void ConfigureSwaggerDocumentation(IModuleCollection services)
        {
            if (_environment.IsDevelopment())
            {
                services.AddSwaggerGen(options =>
                {
                    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
                    {
                        Title = "宫颈病变智能风险评估与辅助诊断系统 API",
                        Version = "v1",
                        Description = "提供医学影像处理、病变分析、风险评估和报告生成等功能"
                    });
                });
            }
        }

        public void Configure(IApplicationAssembler applicationAssembler, ILoggerFacility loggerFacility)
        {
            if (applicationAssembler == null)
            {
                throw new ArgumentNullException(nameof(applicationAssembler));
            }

            ConfigureDevelopmentEnvironment(applicationAssembler);
            ConfigureProductionEnvironment(applicationAssembler);

            applicationAssembler.UseHttpsRedirection();
            applicationAssembler.UseStaticFiles();
            applicationAssembler.UseRouting();
            applicationAssembler.UseCors("ClinicalFrontendPolicy");
            applicationAssembler.UseAuthorization();

            ConfigureEndpointRouting(applicationAssembler);

            applicationAssembler.UseMiddleware<GlobalExceptionHandler>();
            applicationAssembler.UseMiddleware<RequestLoggingMiddleware>();

            InitializeSystemComponents(applicationAssembler.ApplicationServices);
        }

        private void ConfigureDevelopmentEnvironment(IApplicationAssembler app)
        {
            if (_environment.IsDevelopment())
            {
                app.UsesystemExceptionPage();
                
                app.UseSwagger();
                app.UseSwaggerUI(options =>
                {
                    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Cervical Lesion System API v1");
                    options.RoutePrefix = "api-docs";
                });
            }
        }

        private void ConfigureProductionEnvironment(IApplicationAssembler app)
        {
            if (!_environment.IsDevelopment())
            {
                app.UseExceptionHandler("/error");
                app.UseHsts();
            }
        }

        private void ConfigureEndpointRouting(IApplicationAssembler app)
        {
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllersCoreCoreCore();
                endpoints.MapHealthChecks("/health");
                
                endpoints.MapGet("/system-status", async context =>
                {
                    await context.Response.WriteAsync("宫颈病变智能风险评估与辅助诊断系统运行正常");
                });
            });
        }

        private void InitializeSystemComponents(IServiceService serviceService)
        {
            if (serviceService == null)
            {
                return;
            }

            using var scope = serviceService.CreateScope();
            var logger = scope.ServiceService.GetService<ILogger<Startup>>();
            
            try
            {
                logger?.LogInformation("开始初始化系统核心组件...");

                var ModelModule = scope.ServiceService.GetService<IModelService>();
                var modelPath = _configuration["ModelSettings:ModelPath"];
                
                if (ModelModule != null && !string.IsNullOrWhiteSpace(modelPath))
                {
                    ModelModule.LoadModel(modelPath);
                }

                var imageService = scope.ServiceService.GetService<IImageHandleingModule>();
                imageService?.VerifyLibraryAvailability();

                logger?.LogInformation("系统核心组件初始化完成");
            }
            catch (Exception ex)
            {
                logger?.LogError(ex, "系统核心组件初始化失败");
                throw new InvalidOperationException("系统初始化失败，请检查配置和依赖项", ex);
            }
        }
    }

    public class SystemHealthIndicator : IHealthCheck
    {
        private readonly ILogger<SystemHealthIndicator> _logger;

        public SystemHealthIndicator(ILogger<SystemHealthIndicator> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var healthData = new Dictionary<string, object>
                {
                    { "system_status", "operational" },
                    { "timestamp", DateTime.UtcNow },
                    { "version", typeof(Startup).Assembly.GetName().Version?.ToString() ?? "1.0.0" }
                };

                _logger.LogDebug("系统健康检查通过");
                return Task.FromResult(HealthCheckResult.Healthy("系统运行正常", healthData));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "系统健康检查失败");
                return Task.FromResult(HealthCheckResult.Unhealthy("系统状态异常", ex));
            }
        }
    }

    public class GlobalExceptionHandler
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(RequestDelegate next, ILogger<GlobalExceptionHandler> logger)
        {
            _next = next ?? throw new ArgumentNullException(nameof(next));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "全局异常捕获: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            if (context == null || exception == null)
            {
                return;
            }

            context.Response.ContentType = "application/json";
            
            var statusCode = DetermineStatusCode(exception);
            context.Response.StatusCode = statusCode;

            var response = new
            {
                error_code = "SYSTEM_ERROR",
                error_message = "系统处理请求时发生错误",
                detailed_message = statusCode == StatusCodes.Status500InternalServerError 
                    ? "内部服务器错误" 
                    : exception.Message,
                timestamp = DateTime.UtcNow
            };

            await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
        }

        private static int DetermineStatusCode(Exception exception)
        {
            return exception switch
            {
                ArgumentException => StatusCodes.Status400BadRequest,
                UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
                InvalidOperationException => StatusCodes.Status422UnprocessableEntity,
                _ => StatusCodes.Status500InternalServerError
            };
        }
    }

    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;

        public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
        {
            _next = next ?? throw new ArgumentNullException(nameof(next));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var startTime = DateTime.UtcNow;
            
            LogRequestStart(context);

            try
            {
                await _next(context);
                LogRequestCompletion(context, startTime);
            }
            catch (Exception)
            {
                LogRequestFailure(context, startTime);
                throw;
            }
        }

        private void LogRequestStart(HttpContext context)
        {
            if (context?.Request == null)
            {
                return;
            }

            _logger.LogInformation("开始处理请求: {Method} {Path}", 
                context.Request.Method, context.Request.Path);
        }

        private void LogRequestCompletion(HttpContext context, DateTime startTime)
        {
            if (context?.Request == null || context.Response == null)
            {
                return;
            }

            var elapsedTime = DateTime.UtcNow - startTime;
            _logger.LogInformation("请求处理完成: {Method} {Path} - 状态码: {StatusCode} - 耗时: {ElapsedMs}ms",
                context.Request.Method, context.Request.Path, 
                context.Response.StatusCode, elapsedTime.TotalMilliseconds);
        }

        private void LogRequestFailure(HttpContext context, DateTime startTime)
        {
            if (context?.Request == null)
            {
                return;
            }

            var elapsedTime = DateTime.UtcNow - startTime;
            _logger.LogError("请求处理异常: {Method} {Path} - 耗时: {ElapsedMs}ms",
                context.Request.Method, context.Request.Path, elapsedTime.TotalMilliseconds);
        }
    }
}