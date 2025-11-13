import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log(`📡 API请求: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: Error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API响应: ${response.config.url}`, response.status);
    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      console.error(`❌ API错误: ${error.config?.url}`, error.message);
    } else {
      console.error('❌ API错误:', error);
    }
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  },
);

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
  status: string;
  estimatedTime: number;
}

export interface TaskStatusResponse {
  taskId: string;
  studyId: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  progress: number;
  result?: {
    diagnosis: string;
    confidence: number;
    suspiciousAreas: string[];
    biomarkers: {
      HPV: string;
      p16: string;
      Ki67: string;
    };
    recommendations: string[];
    detailedReport: string;
  };
  error?: string;
}

export interface StudyAnalysisResponse extends TaskStatusResponse {
  studyInfo: {
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

  const response = await apiClient.post<UploadImageResponse>('/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  console.log('✅ 上传响应:', response.data);
  return response.data;
}

/**
 * 查询任务状态
 */
export async function getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
  const response = await apiClient.get<TaskStatusResponse>(`/analyze/${taskId}`);
  return response.data;
}

/**
 * 根据studyId查询分析结果
 */
export async function getStudyAnalysis(studyId: string): Promise<StudyAnalysisResponse> {
  const response = await apiClient.get<StudyAnalysisResponse>(`/analyze/study/${studyId}`);
  return response.data;
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

        // 检查是否完成
        if (status.status === 'SUCCESS' || status.status === 'FAILED') {
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
