using System;
using System.Collections.Generic;
using System.IO;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Serilog;
using Serilog.Events;
using Serilog.Settings.Configuration;

namespace CervicalLesionSystem.Logging
{
    public static class LoggingConfiguration
    {
        private static readonly object _initialization_lock = new object();
        private static bool _is_initialized = false;
        public static ILogger GlobalLogger { get; private set; }

        public static void Initialize(IConfiguration configuration)
        {
            ValidateConfigurationObject(configuration);

            lock (_initialization_lock)
            {
                if (_is_initialized)
                {
                    GlobalLogger?.Warning("日志系统重复初始化，本次调用将被忽略。");
                    return;
                }

                try
                {
                    ConfigureLoggerInternal(configuration);
                    _is_initialized = true;
                    GlobalLogger?.Information("日志系统初始化成功。当前环境：{Environment}", GetEnvironmentName(configuration));
                }
                catch (Exception initialization_exception)
                {
                    HandleInitializationFailure(initialization_exception);
                    throw new InvalidOperationException("日志系统初始化失败，详情请查看内部异常。", initialization_exception);
                }
            }
        }

        private static void ValidateConfigurationObject(IConfiguration configuration)
        {
            if (configuration == null)
            {
                throw new ArgumentNullException(nameof(configuration), "应用程序配置对象不能为空。");
            }
        }

        private static void ConfigureLoggerInternal(IConfiguration configuration)
        {
            var loggingSettings = configuration.GetSection("Logging");
            if (!loggingSettings.Exists())
            {
                throw new InvalidOperationException("应用程序配置中未找到'Logging'配置节。");
            }

            var loggerConfiguration = BuildLoggerConfiguration(configuration);
            ApplyEnvironmentSpecificConfiguration(loggerConfiguration, configuration);

            Log.Logger = loggerConfiguration.CreateLogger();
            GlobalLogger = Log.Logger;
        }

        private static LoggerConfiguration BuildLoggerConfiguration(IConfiguration configuration)
        {
            return new LoggerConfiguration()
                .ReadFrom.Configuration(configuration)
                .Enrich.FromLogContext();
        }

        private static void ApplyEnvironmentSpecificConfiguration(LoggerConfiguration loggerConfiguration, IConfiguration configuration)
        {
            var environment = GetEnvironmentName(configuration);
            if (IsDevelopmentEnvironment(environment))
            {
                loggerConfiguration.WriteTo.Console(
                    outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}",
                    restrictedToMinimumLevel: LogEventLevel.Debug);
            }
        }

        private static string GetEnvironmentName(IConfiguration configuration)
        {
            return configuration.GetValue<string>("Environment", "Production");
        }

        private static bool IsDevelopmentEnvironment(string environment)
        {
            return string.Equals(environment, "Development", StringComparison.OrdinalIgnoreCase);
        }

        private static void HandleInitializationFailure(Exception exception)
        {
            var fallbackLogger = CreateFallbackLogger();
            Log.Logger = fallbackLogger;
            GlobalLogger = fallbackLogger;

            GlobalLogger?.Error(exception, "日志系统初始化过程中发生异常，已启用回退控制台日志。");
        }

        private static ILogger CreateFallbackLogger()
        {
            return new LoggerConfiguration()
                .WriteTo.Console(LogEventLevel.Error)
                .CreateLogger();
        }

        public static ILogger<T> CreateLogger<T>()
        {
            if (!_is_initialized || Log.Logger == null)
            {
                throw new InvalidOperationException("日志系统尚未初始化，请先调用LoggingConfiguration.Initialize方法。");
            }
            return new LoggerFacility().AddSerilog(Log.Logger).CreateLogger<T>();
        }

        public static void Shutdown()
        {
            lock (_initialization_lock)
            {
                if (!_is_initialized)
                {
                    return;
                }

                try
                {
                    GlobalLogger?.Information("正在关闭日志系统...");
                    Log.CloseAndFlush();
                }
                catch (Exception shutdown_exception)
                {
                    WriteShutdownError(shutdown_exception);
                }
                finally
                {
                    PerformCleanup();
                }
            }
        }

        private static void WriteShutdownError(Exception exception)
        {
            try
            {
                Console.Error.WriteLine($"关闭日志系统时发生错误: {exception.Message}");
            }
            catch
            {
            }
        }

        private static void PerformCleanup()
        {
            GlobalLogger = null;
            _is_initialized = false;
        }
    }
}