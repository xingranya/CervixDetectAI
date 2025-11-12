import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { modelService, type ModelInfo, type PredictionRequest, type PredictionResponse, type ModelMetrics } from 'src/services/modelService';

export const useModelStore = defineStore('models', () => {
  const models = ref<ModelInfo[]>([]);
  const currentModel = ref<ModelInfo | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const predictions = ref<PredictionResponse | null>(null);

  const activeModels = computed(() => 
    models.value.filter(model => model.status === 'active')
  );

  const latestModel = computed(() => 
    models.value.length > 0 ? models.value[0] : null
  );

  async function fetchModels() {
    isLoading.value = true;
    error.value = null;
    try {
      models.value = await modelService.getModels();
    } catch (err) {
      error.value = '获取模型列表失败';
      console.error('获取模型失败:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchModel(modelId: string) {
    isLoading.value = true;
    error.value = null;
    try {
      currentModel.value = await modelService.getModel(modelId);
    } catch (err) {
      error.value = '获取模型详情失败';
      console.error('获取模型详情失败:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function uploadModel(file: File, metadata: Partial<ModelInfo>) {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await modelService.uploadModel(file, metadata);
      await fetchModels(); // 重新获取模型列表
      return response;
    } catch (err) {
      error.value = '上传模型失败';
      console.error('上传模型失败:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function predict(request: PredictionRequest) {
    isLoading.value = true;
    error.value = null;
    try {
      predictions.value = await modelService.predict(request);
      return predictions.value;
    } catch (err) {
      error.value = '模型预测失败';
      console.error('模型预测失败:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function getModelMetrics(modelId: string): Promise<ModelMetrics> {
    try {
      return await modelService.getModelMetrics(modelId);
    } catch (err) {
      error.value = '获取模型指标失败';
      console.error('获取模型指标失败:', err);
      throw err;
    }
  }

  async function updateModelStatus(modelId: string, status: 'active' | 'inactive') {
    try {
      const updatedModel = await modelService.updateModelStatus(modelId, status);
      const index = models.value.findIndex(m => m.id === modelId);
      if (index !== -1) {
        models.value[index] = updatedModel;
      }
      if (currentModel.value?.id === modelId) {
        currentModel.value = updatedModel;
      }
    } catch (err) {
      error.value = '更新模型状态失败';
      console.error('更新模型状态失败:', err);
      throw err;
    }
  }

  async function deleteModel(modelId: string) {
    try {
      await modelService.deleteModel(modelId);
      models.value = models.value.filter(m => m.id !== modelId);
      if (currentModel.value?.id === modelId) {
        currentModel.value = null;
      }
    } catch (err) {
      error.value = '删除模型失败';
      console.error('删除模型失败:', err);
      throw err;
    }
  }

  function clearError() {
    error.value = null;
  }

  function clearPredictions() {
    predictions.value = null;
  }

  return {
    models,
    currentModel,
    isLoading,
    error,
    predictions,
    activeModels,
    latestModel,
    fetchModels,
    fetchModel,
    uploadModel,
    predict,
    getModelMetrics,
    updateModelStatus,
    deleteModel,
    clearError,
    clearPredictions,
  };
});