/* eslint-disable @typescript-eslint/no-require-imports */
const https = require('https');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || ''));
}

function inferMimeType(source) {
  const pathname = (() => {
    const raw = String(source || '').trim();
    if (!raw) return '';
    if (isHttpUrl(raw)) {
      try {
        return new URL(raw).pathname || '';
      } catch {
        return '';
      }
    }
    return raw;
  })();

  const ext = path.extname(pathname).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.bmp') return 'image/bmp';
  if (ext === '.tif' || ext === '.tiff') return 'image/tiff';
  return 'image/jpeg';
}

function bufferToDataUrl(buffer, mimeType = 'image/jpeg') {
  return `data:${mimeType};base64,${Buffer.from(buffer).toString('base64')}`;
}

function parseBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const text = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(text)) return true;
  if (['0', 'false', 'no', 'off'].includes(text)) return false;
  return fallback;
}

function createRemoteImageHttpsAgent(url) {
  if (!String(url || '').startsWith('https://')) {
    return undefined;
  }

  return new https.Agent({
    rejectUnauthorized: parseBoolean(
      process.env.TUCANG_TLS_REJECT_UNAUTHORIZED,
      true,
    ),
  });
}

function stripMarkdownCodeFence(content) {
  let normalized = String(content || '').trim();

  if (normalized.startsWith('```json')) {
    normalized = normalized.replace(/^```json\s*/i, '');
  } else if (normalized.startsWith('```')) {
    normalized = normalized.replace(/^```\s*/, '');
  }

  if (normalized.endsWith('```')) {
    normalized = normalized.replace(/\s*```$/, '');
  }

  return normalized.trim();
}

function extractFirstJsonObject(content) {
  const source = String(content || '');
  const startIndex = source.indexOf('{');
  if (startIndex === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];

    if (escaping) {
      escaping = false;
      continue;
    }

    if (char === '\\') {
      escaping = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function parseStructuredJsonContent(content) {
  const normalized = stripMarkdownCodeFence(content);
  const parseCandidates = [normalized];
  const extractedObject = extractFirstJsonObject(normalized);

  if (extractedObject && extractedObject !== normalized) {
    parseCandidates.push(extractedObject);
  }

  let lastError = null;
  for (const candidate of parseCandidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error;
    }
  }

  const parseError = new Error(
    `解析AI响应失败: ${lastError ? lastError.message : '未找到有效JSON'}`,
  );
  parseError.stage = 'response_parse';
  throw parseError;
}

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
  } else if (
    modality.includes('液基细胞学') ||
    modality.includes('TCT') ||
    modality.includes('LCT')
  ) {
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
    "qualityAssessment": {
      "score": 4,
      "clarity": "High/Medium/Low",
      "adequacy": "Satisfactory/Limited/Unsatisfactory",
      "details": "对图像质量的详细评价（1-5级评分理由）"
    },
    "riskAssessment": {
      "level": "Low/Medium/High",
      "score": 3,
      "rationale": "风险分级理由（1-5级，1为低风险，5为极高风险）"
    },
    "suspiciousAreas": [
      {
        "description": "异常区域描述",
        "location": "大致位置（如：左上象限、中央区域）",
        "box_2d": [ymin, xmin, ymax, xmax], // 归一化坐标 [0-1000, 0-1000, 0-1000, 0-1000]
        "features": ["核异型性", "核浆比增高"]
      }
    ],
    "biomarkers": {
      "HPV": "阳性/阴性/未检测/不适用",
      "p16": "阳性/阴性/未检测/不适用",
      "Ki67": "阳性/阴性/未检测/不适用"
    },
    "recommendations": ["建议1", "建议2"],
    "detailedReport": "请使用 Markdown 输出结构化病理分析报告，至少包含“总体判断”“关键影像/病理依据”“免疫组化/生物标志物解读”“综合诊断”“临床建议”五个小节，每个小节使用标题与项目符号分条说明，内容必须使用专业医学术语。"
  }

- Workflow:
  1. **图像类型判断**：首先确认这是否为宫颈细胞学相关检查图像（巴氏染色、TCT、HE染色、免疫组化、阴道镜等），如果是CT、MRI、X光等非细胞学图像，立即返回"无法诊断"。
  2. **图像质量评估**：评估图像清晰度、染色质量、细胞分布等，如质量过差无法判读，返回"无法诊断"。
  3. **细胞形态学观察**：仔细观察细胞或组织的形态学特征，识别关键病理改变。
  4. **诊断分类**：根据观察到的特征，从给定的诊断选项中选择最合适的分类，并评估诊断置信度。
  5. **异常区域定位**：描述图像中可疑或异常区域的具体位置和特征，并尽可能提供 box_2d 坐标（基于1000x1000的归一化坐标）。
  6. **生物标志物推测**：结合细胞学特征，推测HPV、p16、Ki67的可能状态（如适用）。
  7. **临床建议**：根据诊断结果，提供具体的后续检查或治疗建议。
  8. **生成报告**：整合所有分析结果，生成完整的、结构化的病理分析报告，\`detailedReport\` 字段必须使用简体中文 Markdown 输出，按小节标题与项目符号分条描述，不要输出单一大段文字。

  **IMPORTANT**: All output must be in Simplified Chinese (简体中文).`;
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
      timeout: parseInt(process.env.QWEN_API_TIMEOUT_MS || '') || 180000, // 默认 180 秒，可从环境变量调整
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
      return bufferToDataUrl(imageBuffer, inferMimeType(imagePath));
    } catch (error) {
      throw new Error(`图像Base64编码失败: ${error.message}`);
    }
  }

  /**
   * 检测远程图像是否适合直接交给模型拉取
   * @param {string} imageUrl - 远程图像URL
   * @returns {Promise<{ canUseRemoteUrl: boolean, reason: string }>}
   */
  async inspectRemoteImageUrl(imageUrl) {
    try {
      const response = await axios.head(imageUrl, {
        timeout: parseInt(process.env.QWEN_REMOTE_IMAGE_HEAD_TIMEOUT_MS || '', 10) || 10000,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400,
        httpsAgent: createRemoteImageHttpsAgent(imageUrl),
      });

      const contentLength = Number.parseInt(String(response.headers?.['content-length'] || ''), 10);
      const contentType = String(response.headers?.['content-type'] || '')
        .split(';')[0]
        .trim()
        .toLowerCase();

      if (!Number.isFinite(contentLength) || contentLength <= 0) {
        return {
          canUseRemoteUrl: false,
          reason: '最终响应缺少有效的 Content-Length',
        };
      }

      if (!contentType.startsWith('image/')) {
        return {
          canUseRemoteUrl: false,
          reason: `最终响应的 Content-Type 为 ${contentType || '空值'}`,
        };
      }

      return {
        canUseRemoteUrl: true,
        reason: '',
      };
    } catch (error) {
      return {
        canUseRemoteUrl: false,
        reason: `远程探测失败: ${error.message}`,
      };
    }
  }

  /**
   * 下载远程图像并转换为Base64，规避上游对 Content-Length 的限制
   * @param {string} imageUrl - 远程图像URL
   * @returns {Promise<string>}
   */
  async remoteImageToBase64(imageUrl) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: parseInt(process.env.QWEN_REMOTE_IMAGE_FETCH_TIMEOUT_MS || '', 10) || 30000,
        maxRedirects: 5,
        maxContentLength: parseInt(process.env.QWEN_REMOTE_IMAGE_MAX_BYTES || '', 10) || 20 * 1024 * 1024,
        httpsAgent: createRemoteImageHttpsAgent(imageUrl),
        headers: {
          Accept: 'image/*,*/*;q=0.8',
        },
      });

      const headerMimeType = String(response.headers?.['content-type'] || '')
        .split(';')[0]
        .trim()
        .toLowerCase();
      const mimeType = headerMimeType.startsWith('image/')
        ? headerMimeType
        : inferMimeType(imageUrl);

      return bufferToDataUrl(response.data, mimeType);
    } catch (error) {
      const causeCode = String(error?.cause?.code || error?.code || '');
      if (
        causeCode === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
        /unable to verify the first certificate/i.test(String(error?.message || ''))
      ) {
        throw new Error(
          '远程图像下载失败：TLS 证书链校验失败，请配置 TUCANG_TLS_REJECT_UNAUTHORIZED=false 或修复图床服务器证书链',
        );
      }
      throw new Error(`远程图像下载失败: ${error.message}`);
    }
  }

  /**
   * 统一解析图像输入，优先远程直传，不满足条件时回退为Base64
   * @param {string} imagePath - 图像来源（本地路径或公网URL）
   * @returns {Promise<{imageDataUrl: string, sourceLabel: string}>}
   */
  async resolveImageInput(imagePath) {
    if (!isHttpUrl(imagePath)) {
      return {
        imageDataUrl: await this.imageToBase64(imagePath),
        sourceLabel: '本地文件(Base64)',
      };
    }

    const remoteProbe = await this.inspectRemoteImageUrl(imagePath);
    if (remoteProbe.canUseRemoteUrl) {
      return {
        imageDataUrl: imagePath,
        sourceLabel: '远程 URL',
      };
    }

    console.warn(
      `⚠️ 图床展示链接不满足模型直拉要求（${remoteProbe.reason}），已自动回退为下载后Base64上传，不影响本次分析`,
    );
    return {
      imageDataUrl: await this.remoteImageToBase64(imagePath),
      sourceLabel: '远程 URL(Base64回退)',
    };
  }

  /**
   * 调用通义千闪API分析宫颈图像
   * @param {string} imagePath - 图像来源（本地路径或公网URL）
   * @param {string} modality - 检查方式类型
   * @param {number} retryCount - 重试次数
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeImage(imagePath, modality = '巴氏染色涂片（Pap Smear）', retryCount = 3) {
    const startedAt = Date.now();
    try {
      const { imageDataUrl, sourceLabel } = await this.resolveImageInput(imagePath);

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
      console.log(`🤖 调用通义千问 API (${this.model})...`);
      console.log(`📊 图像来源：${sourceLabel}`);
      console.log(`🔬 检查方式：${modality}`);
      console.log(`⏱️ 超时配置：${this.axiosInstance.defaults.timeout}ms`);
      const response = await this.axiosInstance.post('/chat/completions', requestBody);
      console.log(`✅ API 调用成功，状态码：${response.status}`);

      // 解析响应
      if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        const responseError = new Error('API响应格式错误：缺少choices字段');
        responseError.stage = 'response_validate';
        throw responseError;
      }

      const content = response.data.choices[0].message.content;
      console.log(`✅ API调用成功，正在解析结果... (耗时 ${Date.now() - startedAt}ms)`);

      // 解析JSON结果
      let result;
      try {
        result = parseStructuredJsonContent(content);
        console.log(`✅ JSON解析成功 (耗时 ${Date.now() - startedAt}ms)`);
      } catch (parseError) {
        console.error('JSON解析失败，原始内容:', content);
        throw parseError;
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
        qualityAssessment: result.qualityAssessment || {
          score: 3,
          clarity: '未知',
          adequacy: '未知',
          details: '未提供质量评估',
        },
        riskAssessment: result.riskAssessment || {
          level: '未知',
          score: 0,
          rationale: '未提供风险评估',
        },
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
      const elapsedMs = Date.now() - startedAt;
      const stage = error.stage || (error.response ? 'api_request' : 'runtime');

      // 详细错误日志
      console.error(`❌ API 调用失败:`);
      console.error(`   [stage=${stage}]`);
      console.error(`   [耗时=${elapsedMs}ms]`);
      console.error(`   [剩余重试次数：${retryCount - 1}]`);
      console.error(`   [错误消息：${error.message}]`);

      if (error.response) {
        console.error(`   [状态码：${error.response.status}]`);
        console.error(`   [响应数据:`, error.response.data, ']');
      }

      if (error.code) {
        console.error(`   [错误代码：${error.code}]`);
      }

      // 重试逻辑
      if (retryCount > 1 && this.shouldRetry(error)) {
        const delay = (4 - retryCount) * 3000; // 递增延迟：3s, 6s, 9s
        console.log(`⏳ ${delay}ms 后重试...`);
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

  /**
   * 流式多轮对话（SSE）
   * @param {Array} messages - OpenAI 格式消息数组 [{role, content}]
   * @param {Object} options - 可选参数
   * @param {string} options.model - 模型名称
   * @param {boolean} options.enableThinking - 是否启用深度思考（默认 true）
   * @returns {import('stream').Readable} 可读流
   */
  async chatStream(messages, options = {}) {
    const model = options.model || process.env.QWEN_CHAT_MODEL || 'qwen-plus';
    const enableThinking = options.enableThinking !== false;

    const requestBody = {
      model,
      messages: [...messages], // 浅拷贝以免修改原数据
      stream: true,
      max_tokens: enableThinking ? 16000 : 2000,
      enable_thinking: enableThinking,
    };

    if (!enableThinking) {
      // 深度思考模式不支持 temperature / top_p
      requestBody.temperature = 0.7;
      requestBody.top_p = 0.9;
    }

    console.log(`🤖 chatStream: model=${model}, enableThinking=${enableThinking}`);

    const response = await axios({
      method: 'post',
      url: `${this.apiUrl}/chat/completions`,
      data: requestBody,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      responseType: 'stream',
      timeout: 120000,
    });

    return response.data;
  }
}

module.exports = new QwenService();
