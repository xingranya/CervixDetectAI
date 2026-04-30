import apiClient from './apiClient';

const API_BASE_URL = apiClient.defaults.baseURL;

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
export interface UploadImageRequest {
  image: File;
  patientName: string;
  patientId: string;
  studyDate: string;
  modality: string;
  description?: string;
}

export interface UploadImageResponse {
  taskId: string;
  studyId: string;
  studyDbId?: number; // 数据库中的数字 ID
  status: string;
  estimatedTime: number;
}

/**
 * 后端可疑区域数据结构（Qwen 输出）
 * - 兼容历史：部分接口可能只返回字符串描述数组
 */
export interface ApiSuspiciousArea {
  description?: string;
  location?: string;
  box_2d?: number[];
  bbox_2d?: number[];
  features?: string[];
}

export interface TaskStatusResponse {
  taskId: string;
  studyId: string;
  studyDbId?: number; // 数据库中的数字 ID
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  progress: number;
  result?: {
    diagnosis: string;
    confidence: number;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    suspiciousAreas?: Array<string | ApiSuspiciousArea>;
    biomarkers?: Record<string, string>;
    recommendations?: string[];
    detailedReport?: string;
  };
  error?: string;
}

export interface StudyAnalysisResponse extends TaskStatusResponse {
  studyInfo: {
    patientDbId?: number;
    patientName: string;
    patientId: string;
    studyDate: string;
    modality: string;
    description: string;
    imageUrl: string;
  };
  createdAt: string;
  completedAt?: string;
}

/**
 * 上传图像并创建分析任务
 */
export async function uploadImage(data: UploadImageRequest): Promise<UploadImageResponse> {
  console.log('🚀 uploadImage 函数被调用');
  console.log('📊 API_BASE_URL:', API_BASE_URL);
  console.log('📂 上传数据:', {
    imageName: data.image.name,
    imageSize: data.image.size,
    patientName: data.patientName,
    patientId: data.patientId,
  });

  const formData = new FormData();
  formData.append('image', data.image);
  formData.append('patientName', data.patientName);
  formData.append('patientId', data.patientId);
  formData.append('studyDate', data.studyDate);
  formData.append('modality', data.modality);
  if (data.description) {
    formData.append('description', data.description);
  }

  console.log('📤 发送 POST 请求到:', `${API_BASE_URL}/analyze`);

  const response = await apiClient.post<ApiResponse<UploadImageResponse>>('/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  console.log('✅ 上传响应:', response.data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '上传失败');
  }
  return response.data.data;
}

/**
 * 查询任务状态
 */
export async function getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
  const response = await apiClient.get<ApiResponse<TaskStatusResponse>>(`/analyze/${taskId}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '获取任务状态失败');
  }
  return response.data.data;
}

/**
 * 根据studyId查询分析结果
 */
export async function getStudyAnalysis(studyId: string): Promise<StudyAnalysisResponse> {
  const response = await apiClient.get<ApiResponse<StudyAnalysisResponse>>(
    `/analyze/study/${studyId}`,
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '获取分析结果失败');
  }
  return response.data.data;
}

/**
 * 轮询任务状态直到完成
 * @param taskId 任务ID
 * @param onProgress 进度回调
 * @param interval 轮询间隔（毫秒）
 * @param maxAttempts 最大尝试次数
 */
export async function pollTaskStatus(
  taskId: string,
  onProgress?: (status: TaskStatusResponse) => void,
  interval = 2000,
  maxAttempts = 150, // 5分钟
): Promise<TaskStatusResponse> {
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        attempts++;
        const status = await getTaskStatus(taskId);

        // 调用进度回调
        if (onProgress) {
          onProgress(status);
        }

        // 检查是否完成（大小写不敏感）
        const normalizedStatus = status.status?.toUpperCase();
        if (normalizedStatus === 'SUCCESS' || normalizedStatus === 'FAILED') {
          resolve(status);
          return;
        }

        // 检查是否超时
        if (attempts >= maxAttempts) {
          reject(new Error('分析超时，请稍后重试'));
          return;
        }

        // 继续轮询
        setTimeout(() => {
          void poll();
        }, interval);
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };

    void poll();
  });
}

export default {
  uploadImage,
  getTaskStatus,
  getStudyAnalysis,
  pollTaskStatus,
};
