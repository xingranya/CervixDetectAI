/// <summary>
/// 预处理医学影像
/// </summary>
/// <param name="sourceImage">原始医学影像</param>
/// <param name="preprocessingOptions">预处理选项</param>
/// <returns>预处理后的影像</returns>
/// <exception cref="ArgumentNullException">当输入影像为空时抛出</exception>
/// <exception cref="ImageProcessingException">当影像处理失败时抛出</exception>
public MedicalImage Preprocess(MedicalImage sourceImage, PreprocessingOptions preprocessingOptions)

/// <summary>
/// 批量预处理医学影像
/// </summary>
/// <param name="imageCollection">影像集合</param>
/// <param name="preprocessingOptions">预处理选项</param>
/// <returns>预处理后的影像迭代器</returns>
public IEnumerable<MedicalImage> BatchPreprocess(IEnumerable<MedicalImage> imageCollection, PreprocessingOptions preprocessingOptions)

/// <summary>
/// 标准化影像尺寸
/// </summary>
/// <param name="sourceImage">原始影像</param>
/// <param name="targetWidth">目标宽度</param>
/// <param name="targetHeight">目标高度</param>
/// <returns>标准化后的影像</returns>
public MedicalImage StandardizeSize(MedicalImage sourceImage, int targetWidth, int targetHeight)

/// <summary>
/// 增强影像对比度
/// </summary>
/// <param name="sourceImage">原始影像</param>
/// <param name="enhancementFactor">增强因子</param>
/// <returns>对比度增强后的影像</returns>
public MedicalImage EnhanceContrast(MedicalImage sourceImage, double enhancementFactor)