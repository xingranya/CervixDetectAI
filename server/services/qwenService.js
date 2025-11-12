/* eslint-disable @typescript-eslint/no-require-imports */
const axios = require('axios');
const fs = require('fs').promises;

/**
 * 完整的宫颈细胞学病理分析提示词
 */
const SYSTEM_PROMPT = `- Role: 宫颈细胞学病理专家
- Background: 用户需要对宫颈细胞学图像进行专业分析，以确定是否存在病变，并提供详细的诊断报告。用户可能是一位病理学研究人员、临床医生或相关领域的专业人士，需要准确的诊断信息来指导后续的治疗或研究。
- Profile: 你是一位在宫颈细胞学病理领域拥有多年经验的专家，对宫颈细胞的形态学变化、病变特征以及相关生物标志物有着深入的理解和丰富的实践经验。你能够通过细胞学图像准确判断病变类型，并结合生物标志物推测病变的潜在风险。
- Skills: 你具备以下关键能力：
  - 精准解读宫颈细胞学图像，识别细胞形态学的细微变化。
  - 根据细胞学特征和生物标志物状态，准确判断病变类型。
  - 提供详细的病理分析报告，包括诊断分类、置信度、可疑区域描述、生物标志物评估以及临床建议。
- Goals:
  1. 分析宫颈细胞学图像，确定诊断分类。
  2. 评估诊断置信度。
  3. 描述图像中异常区域的位置和特征。
  4. 推测HPV、p16、Ki67的状态。
  5. 提供具体的临床建议。
  6. 生成完整的病理分析报告。
- Constrains: 诊断报告应基于图像分析和现有知识，确保信息的准确性和客观性。诊断分类必须从给定选项中选择，置信度应以0到1之间的小数表示。
- OutputFormat: 以JSON格式返回结果，包含以下字段：diagnosis、confidence、suspiciousAreas、biomarkers、recommendations、detailedReport。
- Workflow:
  1. 仔细观察宫颈细胞学图像，识别细胞形态学特征。
  2. 根据细胞学特征，确定诊断分类并评估置信度。
  3. 描述图像中异常区域的位置和特征。
  4. 结合细胞学特征，推测HPV、p16、Ki67的状态。
  5. 提供具体的临床建议。
  6. 生成完整的病理分析报告。`;

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
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
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
   * 调用通义千问API分析宫颈图像
   * @param {string} imagePath - 图像文件路径
   * @param {number} retryCount - 重试次数
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeImage(imagePath, retryCount = 3) {
    try {
      // 转换图像为Base64
      const imageDataUrl = await this.imageToBase64(imagePath);
      
      // 构建请求体
      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: SYSTEM_PROMPT
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        top_p: 0.8
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
          Ki67: '未检测'
        },
        recommendations: Array.isArray(result.recommendations) ? result.recommendations : ['请咨询专科医生'],
        detailedReport: result.detailedReport || '分析报告生成失败',
        rawResponse: content // 保存原始响应用于调试
      };
      
    } catch (error) {
      console.error(`❌ API调用失败 (剩余重试次数: ${retryCount - 1}):`, error.message);
      
      // 重试逻辑
      if (retryCount > 1 && this.shouldRetry(error)) {
        const delay = (4 - retryCount) * 1000; // 递增延迟：1s, 2s, 3s
        console.log(`⏳ ${delay}ms后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.analyzeImage(imagePath, retryCount - 1);
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
      const message = error.response.data?.error?.message || error.response.data?.message || '未知错误';
      
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
