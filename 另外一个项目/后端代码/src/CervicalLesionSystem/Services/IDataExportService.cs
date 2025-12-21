using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace CervicalLesionSystem.Services
{
    /// <summary>
    /// 数据导出服务接口。
    /// 定义将分析结果导出为多种格式（如CSV、Excel、PDF）的操作契约。
    /// 支持批量导出和自定义模板。
    /// </summary>
    public interface IInfoExportModule
    {
        /// <summary>
        /// 将风险评估结果导出为指定格式。
        /// </summary>
        /// <typeparam name="T">结果项的数据类型。</typeparam>
        /// <param name="assessmentResults">待导出的风险评估结果集合。</param>
        /// <param name="format">目标导出格式。</param>
        /// <param name="templateIdentifier">可选的自定义模板标识符。</param>
        /// <param name="cancellationToken">用于取消操作的令牌。</param>
        /// <returns>表示导出操作的任务，任务结果为包含导出文件字节流的 <see cref="ExportResult"/>。</returns>
        /// <exception cref="ArgumentNullException">当 <paramref name="assessmentResults"/> 为 null 时抛出。</exception>
        /// <exception cref="ArgumentException">当 <paramref name="format"/> 无效时抛出。</exception>
        /// <exception cref="ExportOperationException">当导出过程中发生错误时抛出。</exception>
        Task<ExportResult> ExportRiskAssessmentAsync<T>(
            IEnumerable<T> assessmentResults,
            ExportFormat format,
            string? templateIdentifier = null,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// 将诊断报告导出为指定格式。
        /// </summary>
        /// <param name="diagnosticReport">待导出的诊断报告数据。</param>
        /// <param name="format">目标导出格式。</param>
        /// <param name="templateIdentifier">可选的自定义模板标识符。</param>
        /// <param name="cancellationToken">用于取消操作的令牌。</param>
        /// <returns>表示导出操作的任务，任务结果为包含导出文件字节流的 <see cref="ExportResult"/>。</returns>
        /// <exception cref="ArgumentNullException">当 <paramref name="diagnosticReport"/> 为 null 时抛出。</exception>
        /// <exception cref="ArgumentException">当 <paramref name="format"/> 无效时抛出。</exception>
        /// <exception cref="ExportOperationException">当导出过程中发生错误时抛出。</exception>
        Task<ExportResult> ExportDiagnosticReportAsync(
            DiagnosticReportData diagnosticReport,
            ExportFormat format,
            string? templateIdentifier = null,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// 批量导出多个诊断报告。
        /// 使用生成器模式按需获取报告数据，以支持大规模数据集。
        /// </summary>
        /// <param name="reportProducer">生成诊断报告数据的枚举器。</param>
        /// <param name="format">目标导出格式。</param>
        /// <param name="templateIdentifier">可选的自定义模板标识符。</param>
        /// <param name="cancellationToken">用于取消操作的令牌。</param>
        /// <returns>表示导出操作的任务，任务结果为包含导出文件字节流的 <see cref="ExportResult"/>。</returns>
        /// <exception cref="ArgumentNullException">当 <paramref name="reportProducer"/> 为 null 时抛出。</exception>
        /// <exception cref="ArgumentException">当 <paramref name="format"/> 无效时抛出。</exception>
        /// <exception cref="ExportOperationException">当导出过程中发生错误时抛出。</exception>
        Task<ExportResult> BatchExportReportsAsync(
            IAsyncEnumerable<DiagnosticReportData> reportProducer,
            ExportFormat format,
            string? templateIdentifier = null,
            CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// 支持的导出格式。
    /// </summary>
    public enum ExportFormat
    {
        /// <summary>
        /// 逗号分隔值文件格式。
        /// </summary>
        Csv,
        /// <summary>
        /// Microsoft Excel 文件格式。
        /// </summary>
        Excel,
        /// <summary>
        /// 便携式文档格式。
        /// </summary>
        Pdf
    }

    /// <summary>
    /// 导出操作的结果。
    /// </summary>
    public class ExportResult
    {
        /// <summary>
        /// 初始化 <see cref="ExportResult"/> 类的新实例。
        /// </summary>
        /// <param name="fileContent">导出文件的字节内容。</param>
        /// <param name="fileName">建议的文件名。</param>
        /// <param name="mimeType">文件的 MIME 类型。</param>
        public ExportResult(byte[] fileContent, string fileName, string mimeType)
        {
            FileContent = fileContent ?? throw new ArgumentNullException(nameof(fileContent));
            FileName = fileName ?? throw new ArgumentNullException(nameof(fileName));
            MimeType = mimeType ?? throw new ArgumentNullException(nameof(mimeType));
        }

        /// <summary>
        /// 获取导出文件的字节内容。
        /// </summary>
        public byte[] FileContent { get; }

        /// <summary>
        /// 获取建议的文件名。
        /// </summary>
        public string FileName { get; }

        /// <summary>
        /// 获取文件的 MIME 类型。
        /// </summary>
        public string MimeType { get; }
    }

    /// <summary>
    /// 诊断报告数据模型。
    /// 包含生成结构化报告所需的所有信息。
    /// </summary>
    public class DiagnosticReportData
    {
        /// <summary>
        /// 获取或设置报告的唯一标识符。
        /// </summary>
        public string ReportId { get; set; } = string.Empty;

        /// <summary>
        /// 获取或设置患者标识符。
        /// </summary>
        public string PatientIdentifier { get; set; } = string.Empty;

        /// <summary>
        /// 获取或设置检查日期。
        /// </summary>
        public DateTime ExaminationDate { get; set; }

        /// <summary>
        /// 获取或设置病变风险评估等级。
        /// </summary>
        public string RiskGrade { get; set; } = string.Empty;

        /// <summary>
        /// 获取或设置病变特征描述。
        /// </summary>
        public string LesionDescription { get; set; } = string.Empty;

        /// <summary>
        /// 获取或设置诊断医师姓名。
        /// </summary>
        public string Diagnostician { get; set; } = string.Empty;

        /// <summary>
        /// 获取或设置生成报告的时间戳。
        /// </summary>
        public DateTime GeneratedAt { get; set; }

        /// <summary>
        /// 获取或设置附加的元数据键值对。
        /// </summary>
        public Dictionary<string, object> Metadata { get; set; } = new Dictionary<string, object>();
    }

    /// <summary>
    /// 表示在数据导出过程中发生的异常。
    /// </summary>
    public class ExportOperationException : Exception
    {
        /// <summary>
        /// 初始化 <see cref="ExportOperationException"/> 类的新实例。
        /// </summary>
        /// <param name="message">解释异常原因的错误消息。</param>
        public ExportOperationException(string message) : base(message)
        {
        }

        /// <summary>
        /// 初始化 <see cref="ExportOperationException"/> 类的新实例。
        /// </summary>
        /// <param name="message">解释异常原因的错误消息。</param>
        /// <param name="innerException">导致当前异常的异常。</param>
        public ExportOperationException(string message, Exception innerException) : base(message, innerException)
        {
        }
    }
}