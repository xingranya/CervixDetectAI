import { api } from 'src/boot/axios';

export interface ModelInfo {
  id: string;
  name: string;
  version: string;
  accuracy: number;
  sensitivity: number;
  specificity: number;
  f1Score: number;
  size: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'training' | 'error';
  description: string;
  architecture: string;
  inputShape: string[];
  outputClasses: string[];
}

export interface ModelUploadResponse {
  modelId: string;
  uploadUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface PredictionRequest {
  image: string; // base64 encoded image
  modelId: string;
  confidenceThreshold?: number;
}

export interface PredictionResponse {
  predictions: {
    class: string;
    confidence: number;
    bbox?: [number, number, number, number];
  }[];
  processingTime: number;
  modelVersion: string;
  timestamp: string;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  confusionMatrix: number[][];
}

class ModelService {
  private baseUrl = '/api/models';

  async getModels(): Promise<ModelInfo[]> {
    try {
      const response = await api.get(`${this.baseUrl}/`);
      return response.data;
    } catch (error) {
      console.error('获取模型列表失败:', error);
      throw error;
    }
  }

  async getModel(modelId: string): Promise<ModelInfo> {
    try {
      const response = await api.get(`${this.baseUrl}/${modelId}`);
      return response.data;
    } catch (error) {
      console.error(`获取模型 ${modelId} 失败:`, error);
      throw error;
    }
  }

  async uploadModel(modelFile: File, metadata: Partial<ModelInfo>): Promise<ModelUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('model', modelFile);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await api.post(`${this.baseUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('上传模型失败:', error);
      throw error;
    }
  }

  async predict(request: PredictionRequest): Promise<PredictionResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/${request.modelId}/predict`, request);
      return response.data;
    } catch (error) {
      console.error('模型预测失败:', error);
      throw error;
    }
  }

  async getModelMetrics(modelId: string): Promise<ModelMetrics> {
    try {
      const response = await api.get(`${this.baseUrl}/${modelId}/metrics`);
      return response.data;
    } catch (error) {
      console.error(`获取模型 ${modelId} 指标失败:`, error);
      throw error;
    }
  }

  async updateModelStatus(modelId: string, status: 'active' | 'inactive'): Promise<ModelInfo> {
    try {
      const response = await api.patch(`${this.baseUrl}/${modelId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`更新模型 ${modelId} 状态失败:`, error);
      throw error;
    }
  }

  async deleteModel(modelId: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${modelId}`);
    } catch (error) {
      console.error(`删除模型 ${modelId} 失败:`, error);
      throw error;
    }
  }
}

export const modelService = new ModelService();