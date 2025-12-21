using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace CervicalLesionSystem.Utilities
{
    public interface IRetryableOperation<T>
    {
        T Execute();
        Task<T> ExecuteAsync(CancellationToken cancellationToken = default);
    }

    public class RetryPolicy
    {
        public int MaxAttempts { get; set; } = 3;
        public TimeSpan Delay { get; set; } = TimeSpan.FromSeconds(1);
        public Func<int, TimeSpan> DelayStrategy { get; set; } = attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt - 1));
        public Func<Exception, bool> ExceptionFilter { get; set; } = ex => true;
        public Action<int, Exception> OnRetry { get; set; }
    }

    public class RetryDecorator<T> : IRetryableOperation<T>
    {
        private readonly Func<T> _operation;
        private readonly Func<Task<T>> _async_operation;
        private readonly RetryPolicy _policy;
        private readonly ILogger<RetryDecorator<T>> _logger;

        public RetryDecorator(Func<T> operation, RetryPolicy policy, ILogger<RetryDecorator<T>> logger)
        {
            _operation = operation ?? throw new ArgumentNullException(nameof(operation));
            _policy = ValidatePolicy(policy);
            _logger = logger;
        }

        public RetryDecorator(Func<Task<T>> asyncOperation, RetryPolicy policy, ILogger<RetryDecorator<T>> logger)
        {
            _async_operation = asyncOperation ?? throw new ArgumentNullException(nameof(asyncOperation));
            _policy = ValidatePolicy(policy);
            _logger = logger;
        }

        private static RetryPolicy ValidatePolicy(RetryPolicy policy)
        {
            if (policy == null)
            {
                return new RetryPolicy();
            }
            if (policy.MaxAttempts < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(policy.MaxAttempts), "最大重试次数不能为负数");
            }
            if (policy.Delay < TimeSpan.Zero)
            {
                throw new ArgumentOutOfRangeException(nameof(policy.Delay), "延迟时间不能为负数");
            }
            return policy;
        }

        public T Execute()
        {
            if (_operation == null)
            {
                _logger?.LogError("同步操作未初始化");
                throw new InvalidOperationException("同步操作未初始化");
            }

            int attempt_count = 0;
            var exceptions = new List<Exception>();

            while (true)
            {
                attempt_count++;
                try
                {
                    _logger?.LogInformation("开始执行同步操作，当前尝试次数: {attempt_count}", attempt_count);
                    return _operation();
                }
                catch (Exception ex) when (ShouldRetry(ex))
                {
                    exceptions.Add(ex);
                    _logger?.LogWarning(ex, "同步操作执行失败，尝试次数: {attempt_count}", attempt_count);

                    if (attempt_count > _policy.MaxAttempts)
                    {
                        _logger?.LogError("已达到最大重试次数 {max_attempts}，操作终止", _policy.MaxAttempts);
                        throw new AggregateException($"操作在 {attempt_count} 次尝试后失败", exceptions);
                    }

                    PerformRetryActions(attempt_count, ex);
                    ApplyRetryDelay(attempt_count);
                }
                catch (Exception fatal_ex)
                {
                    _logger?.LogError(fatal_ex, "发生不可重试的异常，操作立即终止");
                    throw;
                }
            }
        }

        public async Task<T> ExecuteAsync(CancellationToken cancellation_token = default)
        {
            if (_async_operation == null)
            {
                _logger?.LogError("异步操作未初始化");
                throw new InvalidOperationException("异步操作未初始化");
            }

            int attempt_count = 0;
            var exceptions = new List<Exception>();

            while (true)
            {
                attempt_count++;
                cancellation_token.ThrowIfCancellationRequested();

                try
                {
                    _logger?.LogInformation("开始执行异步操作，当前尝试次数: {attempt_count}", attempt_count);
                    return await _async_operation().ConfigureAwait(false);
                }
                catch (Exception ex) when (ShouldRetry(ex) && !(ex is OperationCanceledException))
                {
                    exceptions.Add(ex);
                    _logger?.LogWarning(ex, "异步操作执行失败，尝试次数: {attempt_count}", attempt_count);

                    if (attempt_count > _policy.MaxAttempts)
                    {
                        _logger?.LogError("已达到最大重试次数 {max_attempts}，异步操作终止", _policy.MaxAttempts);
                        throw new AggregateException($"异步操作在 {attempt_count} 次尝试后失败", exceptions);
                    }

                    PerformRetryActions(attempt_count, ex);
                    await ApplyRetryDelayAsync(attempt_count, cancellation_token).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    _logger?.LogInformation("异步操作已被取消");
                    throw;
                }
                catch (Exception fatal_ex)
                {
                    _logger?.LogError(fatal_ex, "发生不可重试的异常，异步操作立即终止");
                    throw;
                }
            }
        }

        private bool ShouldRetry(Exception ex)
        {
            try
            {
                return _policy.ExceptionFilter?.Invoke(ex) ?? true;
            }
            catch (Exception filter_ex)
            {
                _logger?.LogError(filter_ex, "异常过滤器执行失败，默认允许重试");
                return true;
            }
        }

        private void PerformRetryActions(int attempt, Exception ex)
        {
            try
            {
                _policy.OnRetry?.Invoke(attempt, ex);
            }
            catch (Exception callback_ex)
            {
                _logger?.LogError(callback_ex, "重试回调执行失败");
            }
        }

        private void ApplyRetryDelay(int attempt)
        {
            TimeSpan delay = CalculateDelay(attempt);
            if (delay > TimeSpan.Zero)
            {
                _logger?.LogDebug("等待 {delay_ms} 毫秒后重试", delay.TotalMilliseconds);
                Thread.Sleep(delay);
            }
        }

        private async Task ApplyRetryDelayAsync(int attempt, CancellationToken cancellation_token)
        {
            TimeSpan delay = CalculateDelay(attempt);
            if (delay > TimeSpan.Zero)
            {
                _logger?.LogDebug("异步等待 {delay_ms} 毫秒后重试", delay.TotalMilliseconds);
                await Task.Delay(delay, cancellation_token).ConfigureAwait(false);
            }
        }

        private TimeSpan CalculateDelay(int attempt)
        {
            try
            {
                return _policy.DelayStrategy?.Invoke(attempt) ?? _policy.Delay;
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "延迟策略计算失败，使用默认延迟");
                return _policy.Delay;
            }
        }
    }

    public static class RetryDecoratorExtensions
    {
        public static IRetryableOperation<T> WithRetry<T>(
            this Func<T> operation,
            Action<RetryPolicy> configurePolicy = null,
            ILogger<RetryDecorator<T>> logger = null)
        {
            if (operation == null)
            {
                throw new ArgumentNullException(nameof(operation));
            }

            var policy = new RetryPolicy();
            try
            {
                configurePolicy?.Invoke(policy);
            }
            catch (Exception ex)
            {
                logger?.LogError(ex, "重试策略配置失败，使用默认策略");
            }
            return new RetryDecorator<T>(operation, policy, logger);
        }

        public static IRetryableOperation<T> WithRetry<T>(
            this Func<Task<T>> asyncOperation,
            Action<RetryPolicy> configurePolicy = null,
            ILogger<RetryDecorator<T>> logger = null)
        {
            if (asyncOperation == null)
            {
                throw new ArgumentNullException(nameof(asyncOperation));
            }

            var policy = new RetryPolicy();
            try
            {
                configurePolicy?.Invoke(policy);
            }
            catch (Exception ex)
            {
                logger?.LogError(ex, "重试策略配置失败，使用默认策略");
            }
            return new RetryDecorator<T>(asyncOperation, policy, logger);
        }
    }
}