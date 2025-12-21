using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using CervicalLesionSystem.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace CervicalLesionSystem.Services
{
    public interface IModelService : IDisposable
    {
        ModelMetadata? CurrentModel { get; }
        bool IsReady { get; }
        Task<bool> LoadModelAsync(string modelPath, ModelLoadConfiguration? configuration = null, CancellationToken cancellationToken = default);
        Task<LesionAnalysisResult> InferAsync(MedicalImage inputImage, InferenceOptions? inferenceOptions = null, CancellationToken cancellationToken = default);
        IAsyncEnumerable<LesionAnalysisResult> BatchInferAsync(IAsyncEnumerable<MedicalImage> imageSequence, int batchSize, InferenceOptions? inferenceOptions = null, CancellationToken cancellationToken = default);
        void UnloadModel();
        Task WarmUpAsync(CancellationToken cancellationToken = default);
    }

    public class ModelLoadConfiguration
    {
        public string? ComputeDevice { get; set; }
        public string? Precision { get; set; }
        public string? InputNodeName { get; set; }
        public string? OutputNodeName { get; set; }
        public IDictionary<string, string>? AdditionalParameters { get; set; }
    }

    public class InferenceOptions
    {
        public float ConfidenceThreshold { get; set; } = 0.5f;
        public float NmsIouThreshold { get; set; } = 0.45f;
        public bool EnablePostProcessing { get; set; } = true;
        public bool ReturnDetailedOutput { get; set; } = false;
    }

    public class ModelMetadata
    {
        public required string Name { get; set; }
        public required string Version { get; set; }
        public string? Description { get; set; }
        public int InputWidth { get; set; }
        public int InputHeight { get; set; }
        public int InputChannels { get; set; }
        public IReadOnlyList<string>? SupportedClasses { get; set; }
        public string? System { get; set; }
        public DateTimeOffset? Timestamp { get; set; }
    }

    internal sealed class ModelService : IModelService
    {
        private readonly ILogger<ModelService> _logger;
        private readonly object _state_lock = new object();
        private ModelMetadata? _current_model;
        private bool _is_disposed = false;
        private bool _is_ready = false;

        public ModelMetadata? CurrentModel
        {
            get
            {
                lock (_state_lock)
                {
                    return _current_model?.ShallowCopy();
                }
            }
        }

        public bool IsReady
        {
            get
            {
                lock (_state_lock)
                {
                    return _is_ready && !_is_disposed;
                }
            }
        }

        public ModelService(ILogger<ModelService>? logger = null)
        {
            _logger = logger ?? NullLogger<ModelService>.Instance;
            _logger.LogInformation("智能算法服务实例已创建");
        }

        public async Task<bool> LoadModelAsync(string modelPath, ModelLoadConfiguration? configuration = null, CancellationToken cancellationToken = default)
        {
            ValidateNotDisposed();
            ValidateModelPath(modelPath);

            lock (_state_lock)
            {
                if (_is_ready)
                {
                    _logger.LogWarning("尝试加载模型时服务已就绪，当前模型：{ModelName}", _current_model?.Name);
                    throw new InvalidOperationException("模型已加载，请先卸载当前模型");
                }
            }

            try
            {
                _logger.LogInformation("开始加载模型，路径：{ModelPath}", modelPath);
                await SimulateModelLoadingAsync(modelPath, configuration, cancellationToken).ConfigureAwait(false);

                var metadata = new ModelMetadata
                {
                    Name = Path.GetFileNameWithoutExtension(modelPath),
                    Version = "1.0.0",
                    Description = "深度学习病变识别模型",
                    InputWidth = 512,
                    InputHeight = 512,
                    InputChannels = 3,
                    SupportedClasses = new List<string> { "病变A", "病变B", "病变C" },
                    System = "CervicalLesionSystem",
                    Timestamp = DateTimeOffset.UtcNow
                };

                lock (_state_lock)
                {
                    _current_model = metadata;
                    _is_ready = true;
                }

                _logger.LogInformation("模型加载成功，名称：{ModelName}，版本：{ModelVersion}", metadata.Name, metadata.Version);
                return true;
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("模型加载操作被取消");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "模型加载失败，路径：{ModelPath}，错误：{ErrorMessage}", modelPath, ex.Message);
                ResetServiceState();
                throw new FormatException($"模型文件格式无效或损坏: {ex.Message}", ex);
            }
        }

        public async Task<LesionAnalysisResult> InferAsync(MedicalImage inputImage, InferenceOptions? inferenceOptions = null, CancellationToken cancellationToken = default)
        {
            ValidateNotDisposed();
            ValidateServiceReady();
            ValidateInputImage(inputImage);

            try
            {
                _logger.LogDebug("开始单张影像推理，影像ID：{ImageId}", inputImage.Id);
                await SimulateInferenceAsync(cancellationToken).ConfigureAwait(false);

                var result = new LesionAnalysisResult
                {
                    ImageId = inputImage.Id,
                    Confidence = 0.85f,
                    DetectedFeatures = new List<string> { "特征A", "特征B" },
                    ProcessingTime = TimeSpan.FromMilliseconds(150)
                };

                _logger.LogInformation("单张影像推理完成，影像ID：{ImageId}，置信度：{Confidence}", inputImage.Id, result.Confidence);
                return result;
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("推理操作被取消，影像ID：{ImageId}", inputImage.Id);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "推理过程发生异常，影像ID：{ImageId}，错误：{ErrorMessage}", inputImage.Id, ex.Message);
                throw new InvalidOperationException($"推理执行失败: {ex.Message}", ex);
            }
        }

        public async IAsyncEnumerable<LesionAnalysisResult> BatchInferAsync(IAsyncEnumerable<MedicalImage> imageSequence, int batchSize, InferenceOptions? inferenceOptions = null, CancellationToken cancellationToken = default)
        {
            ValidateNotDisposed();
            ValidateServiceReady();
            ValidateImageSequence(imageSequence);
            ValidateBatchSize(batchSize);

            var currentBatch = new List<MedicalImage>();
            _logger.LogInformation("开始批量推理，批次大小：{BatchSize}", batchSize);

            await foreach (var image in imageSequence.WithCancellation(cancellationToken))
            {
                if (image == null)
                {
                    _logger.LogWarning("批量推理中遇到空影像，已跳过");
                    continue;
                }

                currentBatch.Add(image);
                if (currentBatch.Count >= batchSize)
                {
                    await foreach (var result in ProcessBatchAsync(currentBatch, inferenceOptions, cancellationToken).ConfigureAwait(false))
                    {
                        yield return result;
                    }
                    currentBatch.Clear();
                }
            }

            if (currentBatch.Count > 0)
            {
                await foreach (var result in ProcessBatchAsync(currentBatch, inferenceOptions, cancellationToken).ConfigureAwait(false))
                {
                    yield return result;
                }
            }

            _logger.LogInformation("批量推理完成");
        }

        public void UnloadModel()
        {
            ValidateNotDisposed();

            lock (_state_lock)
            {
                if (!_is_ready)
                {
                    _logger.LogDebug("尝试卸载模型时服务未就绪，无需操作");
                    return;
                }

                _logger.LogInformation("开始卸载模型，当前模型：{ModelName}", _current_model?.Name);
                ResetServiceState();
                _logger.LogInformation("模型卸载完成");
            }
        }

        public async Task WarmUpAsync(CancellationToken cancellationToken = default)
        {
            ValidateNotDisposed();
            ValidateServiceReady();

            try
            {
                _logger.LogDebug("开始模型预热");
                await Task.Delay(100, cancellationToken).ConfigureAwait(false);
                _logger.LogInformation("模型预热完成");
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("模型预热操作被取消");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "模型预热失败，错误：{ErrorMessage}", ex.Message);
                throw;
            }
        }

        public void Dispose()
        {
            if (_is_disposed) return;

            lock (_state_lock)
            {
                if (_is_disposed) return;

                _logger.LogInformation("开始释放智能算法服务资源");
                try
                {
                    ResetServiceState();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "资源释放过程中发生异常");
                }
                finally
                {
                    _is_disposed = true;
                    _logger.LogInformation("智能算法服务资源释放完成");
                }
            }
        }

        private void ValidateNotDisposed()
        {
            if (_is_disposed)
            {
                throw new ObjectDisposedException(nameof(ModelService), "智能算法服务已被释放");
            }
        }

        private void ValidateServiceReady()
        {
            lock (_state_lock)
            {
                if (!_is_ready)
                {
                    throw new InvalidOperationException("模型服务未就绪，请先加载模型");
                }
            }
        }

        private static void ValidateModelPath(string modelPath)
        {
            if (string.IsNullOrWhiteSpace(modelPath))
            {
                throw new ArgumentNullException(nameof(modelPath), "模型路径不能为空");
            }

            if (!File.Exists(modelPath))
            {
                throw new FileNotFoundException($"模型文件不存在: {modelPath}");
            }
        }

        private static void ValidateInputImage(MedicalImage inputImage)
        {
            if (inputImage == null)
            {
                throw new ArgumentNullException(nameof(inputImage), "输入影像不能为空");
            }

            if (inputImage.Data == null || inputImage.Data.Length == 0)
            {
                throw new ArgumentException("输入影像数据为空", nameof(inputImage));
            }
        }

        private static void ValidateImageSequence(IAsyncEnumerable<MedicalImage> imageSequence)
        {
            if (imageSequence == null)
            {
                throw new ArgumentNullException(nameof(imageSequence), "影像序列不能为空");
            }
        }

        private static void ValidateBatchSize(int batchSize)
        {
            if (batchSize <= 0)
            {
                throw new ArgumentOutOfRangeException(nameof(batchSize), "批次大小必须大于0");
            }
        }

        private void ResetServiceState()
        {
            lock (_state_lock)
            {
                _current_model = null;
                _is_ready = false;
            }
        }

        private async IAsyncEnumerable<LesionAnalysisResult> ProcessBatchAsync(List<MedicalImage> batch, InferenceOptions? options, CancellationToken cancellationToken)
        {
            _logger.LogDebug("处理批次，包含 {BatchCount} 张影像", batch.Count);

            foreach (var image in batch)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    _logger.LogWarning("批次处理被取消");
                    yield break;
                }

                LesionAnalysisResult result;
                try
                {
                    result = await InferAsync(image, options, cancellationToken).ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "批次中单张影像推理失败，影像ID：{ImageId}，已返回空结果", image.Id);
                    result = CreateErrorResult(image.Id, ex.Message);
                }

                yield return result;
            }
        }

        private static LesionAnalysisResult CreateErrorResult(string imageId, string errorMessage)
        {
            return new LesionAnalysisResult
            {
                ImageId = imageId,
                Confidence = 0.0f,
                DetectedFeatures = new List<string>(),
                ProcessingTime = TimeSpan.Zero,
                ErrorMessage = errorMessage
            };
        }

        private static async Task SimulateModelLoadingAsync(string modelPath, ModelLoadConfiguration? configuration, CancellationToken cancellationToken)
        {
            await Task.Delay(500, cancellationToken).ConfigureAwait(false);
        }

        private static async Task SimulateInferenceAsync(CancellationToken cancellationToken)
        {
            await Task.Delay(50, cancellationToken).ConfigureAwait(false);
        }
    }

    internal static class ModelMetadataExtensions
    {
        public static ModelMetadata ShallowCopy(this ModelMetadata metadata)
        {
            if (metadata == null) return null;

            return new ModelMetadata
            {
                Name = metadata.Name,
                Version = metadata.Version,
                Description = metadata.Description,
                InputWidth = metadata.InputWidth,
                InputHeight = metadata.InputHeight,
                InputChannels = metadata.InputChannels,
                SupportedClasses = metadata.SupportedClasses,
                System = metadata.System,
                Timestamp = metadata.Timestamp
            };
        }
    }
}