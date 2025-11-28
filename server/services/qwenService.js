/* eslint-disable @typescript-eslint/no-require-imports */
const axios = require('axios');
const fs = require('fs').promises;

/**
 * 根据检查方式生成优化的提示词
 * @param {string} modality - 检查方式类型
 * @returns {string} 优化的提示词
 */
function generatePrompt(modality = '巴氏染色涂片（Pap Smear）') {
  // 根据检查方式提供专门的分析指导
  let modalityGuidance = '';
  let diagnosisOptions = '';
  
  if (modality.includes('巴氏染色') || modality.includes('Pap Smear')) {
    modalityGuidance = `
本次分析的图像类型为：**巴氏染色涂片（Pap Smear）**

关键识别要点：
- 细胞核染色：细胞核呈蓝紫色或深蓝色
- 细胞质染色：细胞质呈粉红色、橙红色或淡蓝色
- 关注核质比例、核形态、染色质分布
- 识别鳞状上皮细胞、柱状上皮细胞、化生细胞
- 注意核异型性、核增大、核浆比增加等病变特征`;
    
    diagnosisOptions = `
诊断分类选项（TBS系统）：
- NILM（未见上皮内病变或恶性病变）
- ASC-US（意义不明确的不典型鳞状细胞）
- ASC-H（不排除HSIL的不典型鳞状细胞）
- LSIL（低度鳞状上皮内病变）
- HSIL（高度鳞状上皮内病变）
- SCC（鳞状细胞癌）
- AGC（不典型腺细胞）
- 无法诊断（图像质量不佳、非细胞学图像等）`;
  } else if (modality.includes('液基细胞学') || modality.includes('TCT') || modality.includes('LCT')) {
    modalityGuidance = `
本次分析的图像类型为：**液基细胞学（TCT/LCT）**

关键识别要点：
- 细胞分布均匀，背景干净清晰
- 细胞形态保存良好，核结构清晰
- 关注细胞核大小、形态、染色质分布
- 识别异常细胞的核质比、核轮廓、核仁
- 注意细胞簇的排列方式和极性`;
    
    diagnosisOptions = `
诊断分类选项（TBS系统）：
- NILM（未见上皮内病变或恶性病变）
- ASC-US（意义不明确的不典型鳞状细胞）
- ASC-H（不排除HSIL的不典型鳞状细胞）
- LSIL（低度鳞状上皮内病变）
- HSIL（高度鳞状上皮内病变）
- SCC（鳞状细胞癌）
- AGC（不典型腺细胞）
- 无法诊断（图像质量不佳、非细胞学图像等）`;
  } else if (modality.includes('活检切片') || modality.includes('HE染色')) {
    modalityGuidance = `
本次分析的图像类型为：**宫颈活检切片（HE染色）**

关键识别要点：
- 细胞核：苏木精染色呈蓝紫色
- 细胞质和基质：伊红染色呈粉红色
- 评估组织结构：上皮层次、基底膜完整性
- 识别细胞极性丢失、核异型性、病理性核分裂
- 观察浸润深度、间质反应`;
    
    diagnosisOptions = `
诊断分类选项（组织病理学）：
- 正常宫颈组织
- 慢性宫颈炎
- CIN 1（宫颈上皮内瘤变1级）
- CIN 2（宫颈上皮内瘤变2级）
- CIN 3（宫颈上皮内瘤变3级）
- 原位癌
- 浸润性鳞状细胞癌
- 腺癌
- 无法诊断（图像质量不佳、非组织学图像等）`;
  } else if (modality.includes('HPV')) {
    modalityGuidance = `
本次分析的图像类型为：**HPV分型检测图像**

关键识别要点：
- 识别HPV感染相关的细胞学改变
- 核周空晕（Koilocytosis）
- 双核或多核细胞
- 核异型性、核增大
- 结合分子标记物表达`;
    
    diagnosisOptions = `
诊断分类选项：
- HPV阴性
- 低危型HPV感染
- 高危型HPV感染
- HPV16/18型感染
- 无法诊断（图像质量不佳）`;
  } else if (modality.includes('p16') || modality.includes('Ki67')) {
    modalityGuidance = `
本次分析的图像类型为：**p16/Ki67双染图像**

关键识别要点：
- p16：细胞核和细胞质呈棕褐色阳性染色
- Ki67：细胞核呈棕褐色阳性染色
- 双阳性细胞：同时表达p16和Ki67的细胞
- 评估阳性细胞比例和分布模式`;
    
    diagnosisOptions = `
诊断分类选项：
- 阴性（双染阴性）
- 阳性（双染阳性，提示HSIL）
- 可疑（部分阳性）
- 无法诊断（图像质量不佳）`;
  } else if (modality.includes('阴道镜')) {
    modalityGuidance = `
本次分析的图像类型为：**阴道镜检查图像**

关键识别要点：
- 转化区的可见性和类型
- 醋酸白上皮的范围和密度
- 异常血管形态
- 碘染色反应
- 病变边界的清晰度`;
    
    diagnosisOptions = `
诊断分类选项：
- 正常表现
- 低度病变（Minor Changes）
- 高度病变（Major Changes）
- 可疑浸润癌
- 无法诊断（图像质量不佳）`;
  } else {
    modalityGuidance = `
本次分析的图像类型为：**${modality}**

请根据图像的实际特征进行分析，如果图像不符合宫颈细胞学检查的特征，请在诊断中说明"无法诊断"并给出原因。`;
    
    diagnosisOptions = `
诊断分类选项：
- 请根据实际图像类型选择合适的诊断分类
- 如无法识别为宫颈细胞学图像，请选择"无法诊断"`;
  }

  return `- Role: 宫颈细胞学病理专家
- Background: 用户需要对宫颈细胞学图像进行专业分析，以确定是否存在病变，并提供详细的诊断报告。用户可能是一位病理学研究人员、临床医生或相关领域的专业人士，需要准确的诊断信息来指导后续的治疗或研究。
- Profile: 你是一位在宫颈细胞学病理领域拥有多年经验的专家，精通各类宫颈细胞学检查方法（巴氏染色、液基细胞学、HE染色组织学、免疫组化、阴道镜等）。你对宫颈细胞的形态学变化、病变特征以及相关生物标志物有着深入的理解和丰富的实践经验。
${modalityGuidance}

- Skills: 你具备以下关键能力：
  - 精准识别不同类型的宫颈细胞学图像（巴氏染色、TCT、HE染色、免疫组化等）
  - 准确解读细胞形态学特征和组织结构变化
  - 根据细胞学特征和生物标志物状态，准确判断病变类型
  - 提供详细的病理分析报告，包括诊断分类、置信度、可疑区域描述、生物标志物评估以及临床建议
  - 能够识别非细胞学图像并给出"无法诊断"的明确反馈

- Goals:
  1. **首先判断**：图像是否为宫颈细胞学相关检查图像，如果不是（如CT、MRI、X光等影像学图像），应诊断为"无法诊断"并说明原因。
  2. 分析宫颈细胞学图像的类型和染色方法。
  3. 识别细胞形态学特征或组织结构特征。
  4. 确定诊断分类并评估置信度。
  5. 描述图像中异常区域的位置和特征。
  6. 推测HPV、p16、Ki67的状态（如适用）。
  7. 提供具体的临床建议。
  8. 生成完整的病理分析报告。

${diagnosisOptions}

- Constrains: 
  - 诊断报告应基于图像分析和现有知识，确保信息的准确性和客观性
  - 诊断分类必须从上述给定选项中选择
  - 置信度应以0到1之间的小数表示（0.0-1.0）
  - **如果图像不是细胞学或组织学图像（如CT、MRI、超声等），必须诊断为"无法诊断"**
  - **如果图像质量过差无法判读，必须诊断为"无法诊断"并说明原因**

- OutputFormat: 必须以严格的JSON格式返回结果，包含以下字段：
  {
    "diagnosis": "诊断分类（从上述选项中选择）",
    "confidence": 0.85,
    "suspiciousAreas": ["异常区域1的描述", "异常区域2的描述"],
    "biomarkers": {
      "HPV": "阳性/阴性/未检测/不适用",
      "p16": "阳性/阴性/未检测/不适用",
      "Ki67": "阳性/阴性/未检测/不适用"
    },
    "recommendations": ["建议1", "建议2"],
    "detailedReport": "完整的病理分析报告文字描述"
  }

- Workflow:
  1. **图像类型判断**：首先确认这是否为宫颈细胞学相关检查图像（巴氏染色、TCT、HE染色、免疫组化、阴道镜等），如果是CT、MRI、X光等非细胞学图像，立即返回"无法诊断"。
  2. **图像质量评估**：评估图像清晰度、染色质量、细胞分布等，如质量过差无法判读，返回"无法诊断"。
  3. **细胞形态学观察**：仔细观察细胞或组织的形态学特征，识别关键病理改变。
  4. **诊断分类**：根据观察到的特征，从给定的诊断选项中选择最合适的分类，并评估诊断置信度。
  5. **异常区域定位**：描述图像中可疑或异常区域的具体位置和特征。
  6. **生物标志物推测**：结合细胞学特征，推测HPV、p16、Ki67的可能状态（如适用）。
  7. **临床建议**：根据诊断结果，提供具体的后续检查或治疗建议。
  8. **生成报告**：整合所有分析结果，生成完整的、结构化的病理分析报告。`;
}

/**
 * 通义千问API服务类
 */
class QwenService {
  constructor() {
    this.apiKey = process.env.QWEN_API_KEY;
    this.apiUrl = process.env.QWEN_API_URL;
    this.model = process.env.QWEN_MODEL || 'qwen-vl-max';

    if (!this.apiKey) {
      throw new Error('QWEN_API_KEY 环境变量未设置');
    }

    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      timeout: 60000,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 将图像文件转换为Base64编码
   * @param {string} imagePath - 图像文件路径
   * @returns {Promise<string>} Base64编码的Data URL
   */
  async imageToBase64(imagePath) {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      const base64String = imageBuffer.toString('base64');

      // 获取MIME类型
      let mimeType = 'image/jpeg';
      if (imagePath.endsWith('.png')) {
        mimeType = 'image/png';
      } else if (imagePath.endsWith('.tiff') || imagePath.endsWith('.tif')) {
        mimeType = 'image/tiff';
      }

      return `data:${mimeType};base64,${base64String}`;
    } catch (error) {
      throw new Error(`图像Base64编码失败: ${error.message}`);
    }
  }

  /**
   * 调用通义千闪API分析宫颈图像
   * @param {string} imagePath - 图像文件路径
   * @param {string} modality - 检查方式类型
   * @param {number} retryCount - 重试次数
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeImage(imagePath, modality = '巴氏染色涂片（Pap Smear）', retryCount = 3) {
    try {
      // 转换图像为Base64
      const imageDataUrl = await this.imageToBase64(imagePath);

      // 根据检查方式生成优化的提示词
      const systemPrompt = generatePrompt(modality);

      // 构建请求体
      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: systemPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
        top_p: 0.8,
      };

      // 发送请求
      console.log(`🤖 调用通义千问API (${this.model})...`);
      const response = await this.axiosInstance.post('/chat/completions', requestBody);

      // 解析响应
      if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        throw new Error('API响应格式错误：缺少choices字段');
      }

      const content = response.data.choices[0].message.content;
      console.log('✅ API调用成功，正在解析结果...');

      // 解析JSON结果
      let result;
      try {
        // 清理可能的markdown代码块标记
        let cleanContent = content.trim();

        // 移除markdown代码块标记
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '');
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '');
        }

        if (cleanContent.endsWith('```')) {
          cleanContent = cleanContent.replace(/\s*```$/, '');
        }

        // 去除首尾空白
        cleanContent = cleanContent.trim();

        result = JSON.parse(cleanContent);
        console.log('✅ JSON解析成功');
      } catch (parseError) {
        console.error('JSON解析失败，原始内容:', content);
        throw new Error(`解析AI响应失败: ${parseError.message}`);
      }

      // 验证必需字段
      const requiredFields = ['diagnosis', 'confidence', 'recommendations', 'detailedReport'];
      for (const field of requiredFields) {
        if (!(field in result)) {
          console.warn(`⚠️ 缺少必需字段: ${field}`);
        }
      }

      // 标准化数据结构
      return {
        diagnosis: result.diagnosis || '未知',
        confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
        suspiciousAreas: Array.isArray(result.suspiciousAreas) ? result.suspiciousAreas : [],
        biomarkers: result.biomarkers || {
          HPV: '未检测',
          p16: '未检测',
          Ki67: '未检测',
        },
        recommendations: Array.isArray(result.recommendations)
          ? result.recommendations
          : ['请咨询专科医生'],
        detailedReport: result.detailedReport || '分析报告生成失败',
        rawResponse: content, // 保存原始响应用于调试
      };
    } catch (error) {
      console.error(`❌ API调用失败 (剩余重试次数: ${retryCount - 1}):`, error.message);

      // 重试逻辑
      if (retryCount > 1 && this.shouldRetry(error)) {
        const delay = (4 - retryCount) * 1000; // 递增延迟：1s, 2s, 3s
        console.log(`⏳ ${delay}ms后重试...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.analyzeImage(imagePath, modality, retryCount - 1);
      }

      // 抛出错误
      throw this.formatError(error);
    }
  }

  /**
   * 判断是否应该重试
   * @param {Error} error - 错误对象
   * @returns {boolean}
   */
  shouldRetry(error) {
    // 网络错误或超时应该重试
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // API限流应该重试
    if (error.response && error.response.status === 429) {
      return true;
    }

    // 服务器错误应该重试
    if (error.response && error.response.status >= 500) {
      return true;
    }

    return false;
  }

  /**
   * 格式化错误信息
   * @param {Error} error - 原始错误
   * @returns {Error} 格式化后的错误
   */
  formatError(error) {
    if (error.response) {
      // API返回的错误
      const status = error.response.status;
      const message =
        error.response.data?.error?.message || error.response.data?.message || '未知错误';

      switch (status) {
        case 400:
          return new Error(`请求参数错误: ${message}`);
        case 401:
          return new Error('API密钥无效或已过期');
        case 403:
          return new Error('无权限访问该API');
        case 429:
          return new Error('API请求频率超限，请稍后重试');
        case 500:
        case 502:
        case 503:
          return new Error('通义千问服务暂时不可用');
        default:
          return new Error(`API错误 (${status}): ${message}`);
      }
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new Error('API请求超时，请检查网络连接');
    } else {
      return new Error(`调用通义千问API失败: ${error.message}`);
    }
  }
}

module.exports = new QwenService();
