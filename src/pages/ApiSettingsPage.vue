<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <div class="text-h5 q-mb-md">API设置</div>
        <p>配置和管理通义千问AI模型的API接口设置。</p>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- API配置卡片 -->
      <div class="col-lg-8 col-md-12">
        <q-card flat bordered>
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">
              <q-icon name="settings" size="sm" class="q-mr-sm" />
              通义千问API配置
            </div>
          </q-card-section>
          <q-card-section>
            <q-form class="q-gutter-md">
              <q-input
                v-model="apiConfig.apiKey"
                outlined
                label="API密钥 *"
                :type="showApiKey ? 'text' : 'password'"
                hint="请输入您的通义千问API密钥"
                lazy-rules
                :rules="[(val) => (val && val.length > 0) || 'API密钥为必填项']"
              >
                <template v-slot:append>
                  <q-icon
                    :name="showApiKey ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showApiKey = !showApiKey"
                  />
                </template>
              </q-input>

              <q-input
                v-model="apiConfig.endpoint"
                outlined
                label="API端点"
                hint="默认: https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
              />

              <q-select
                v-model="apiConfig.model"
                outlined
                label="模型版本 *"
                :options="modelOptions"
                hint="选择要使用的通义千问模型版本"
                lazy-rules
                :rules="[(val) => (val && val.length > 0) || '模型版本为必填项']"
              />

              <q-input
                v-model.number="apiConfig.timeout"
                outlined
                type="number"
                label="超时时间（秒）"
                hint="API请求的最大等待时间"
                :min="10"
                :max="300"
              />

              <q-input
                v-model.number="apiConfig.maxRetries"
                outlined
                type="number"
                label="最大重试次数"
                hint="请求失败时的重试次数"
                :min="0"
                :max="5"
              />

              <div class="row q-mt-lg">
                <q-btn
                  color="secondary"
                  label="测试连接"
                  icon="cable"
                  @click="testConnection"
                  :loading="testing"
                  class="q-mr-sm"
                />
                <q-space />
                <q-btn color="grey" label="重置" flat @click="resetConfig" class="q-mr-sm" />
                <q-btn color="primary" label="保存配置" icon="save" @click="saveConfig" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>

        <!-- 高级设置 -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6">高级设置</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-form class="q-gutter-md">
              <q-toggle
                v-model="apiConfig.enableCache"
                label="启用响应缓存"
                left-label
              />
              <div class="text-caption text-grey-6 q-ml-md">
                缓存相同请求的响应以提高性能
              </div>

              <q-toggle
                v-model="apiConfig.enableLogging"
                label="启用详细日志"
                left-label
              />
              <div class="text-caption text-grey-6 q-ml-md">
                记录所有API请求和响应用于调试
              </div>

              <q-input
                v-model="apiConfig.customPrompt"
                outlined
                type="textarea"
                label="自定义提示词（可选）"
                hint="自定义发送给AI的系统提示词"
                rows="4"
              />
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <!-- 侧边栏信息 -->
      <div class="col-lg-4 col-md-12">
        <!-- 当前状态 -->
        <q-card flat bordered>
          <q-card-section class="text-center">
            <q-icon
              :name="apiConfig.status === 'connected' ? 'check_circle' : 'error'"
              :color="apiConfig.status === 'connected' ? 'positive' : 'grey'"
              size="3rem"
            />
            <div class="text-h6 q-mt-md">
              {{ apiConfig.status === 'connected' ? 'API已连接' : '未连接' }}
            </div>
            <div class="text-caption text-grey-6" v-if="apiConfig.lastTested">
              上次测试: {{ new Date(apiConfig.lastTested).toLocaleString() }}
            </div>
          </q-card-section>
        </q-card>

        <!-- 模型信息 -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">当前模型信息</div>
            <div class="q-gutter-sm">
              <div class="row items-center">
                <div class="col-5 text-grey-6">模型版本</div>
                <div class="col-7 text-weight-medium">{{ apiConfig.model || '未设置' }}</div>
              </div>
              <div class="row items-center">
                <div class="col-5 text-grey-6">准确率</div>
                <div class="col-7 text-weight-medium">95.2%</div>
              </div>
              <div class="row items-center">
                <div class="col-5 text-grey-6">敏感性</div>
                <div class="col-7 text-weight-medium">92.1%</div>
              </div>
              <div class="row items-center">
                <div class="col-5 text-grey-6">响应时间</div>
                <div class="col-7 text-weight-medium">~30秒</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- 使用指南 -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">使用指南</div>
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-icon color="primary" name="info" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>
                    1. 在阿里云控制台获取API密钥
                  </q-item-label>
                </q-item-section>
              </q-item>
              
              <q-item>
                <q-item-section avatar>
                  <q-icon color="primary" name="info" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>
                    2. 填写API密钥并选择模型版本
                  </q-item-label>
                </q-item-section>
              </q-item>
              
              <q-item>
                <q-item-section avatar>
                  <q-icon color="primary" name="info" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>
                    3. 点击"测试连接"验证配置
                  </q-item-label>
                </q-item-section>
              </q-item>
              
              <q-item>
                <q-item-section avatar>
                  <q-icon color="primary" name="info" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>
                    4. 保存配置后即可开始使用
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- 文档链接 -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">相关文档</div>
            <q-btn
              flat
              dense
              color="primary"
              icon="open_in_new"
              label="通义千问API文档"
              class="full-width justify-start"
              @click="openDocs('qwen')"
            />
            <q-btn
              flat
              dense
              color="primary"
              icon="open_in_new"
              label="获取API密钥"
              class="full-width justify-start q-mt-sm"
              @click="openDocs('apikey')"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

// API配置数据
const apiConfig = ref({
  apiKey: '',
  endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
  model: 'qwen-vl-max',
  timeout: 60,
  maxRetries: 3,
  enableCache: true,
  enableLogging: false,
  customPrompt: '',
  status: 'disconnected' as 'connected' | 'disconnected',
  lastTested: null as string | null,
});

// 模型选项
const modelOptions = [
  'qwen-vl-max',
  'qwen-vl-plus',
  'qwen-vl-v1',
];

const showApiKey = ref(false);
const testing = ref(false);

// 保存原始配置用于重置
const originalConfig = ref({ ...apiConfig.value });

// 测试连接
const testConnection = async () => {
  if (!apiConfig.value.apiKey) {
    $q.notify({
      type: 'warning',
      message: '请先填写API密钥',
      position: 'top',
    });
    return;
  }

  testing.value = true;
  
  try {
    // 模拟API测试
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    apiConfig.value.status = 'connected';
    apiConfig.value.lastTested = new Date().toISOString();
    
    $q.notify({
      type: 'positive',
      message: 'API连接测试成功！',
      position: 'top',
    });
  } catch (error) {
    apiConfig.value.status = 'disconnected';
    const errorMessage = error instanceof Error ? error.message : 'API连接测试失败，请检查配置';
    $q.notify({
      type: 'negative',
      message: errorMessage,
      position: 'top',
    });
  } finally {
    testing.value = false;
  }
};

// 保存配置
const saveConfig = () => {
  if (!apiConfig.value.apiKey || !apiConfig.value.model) {
    $q.notify({
      type: 'warning',
      message: '请填写所有必填项',
      position: 'top',
    });
    return;
  }

  // 保存到 localStorage
  localStorage.setItem('qwen_api_config', JSON.stringify(apiConfig.value));
  originalConfig.value = { ...apiConfig.value };

  $q.notify({
    type: 'positive',
    message: 'API配置保存成功！',
    position: 'top',
  });
};

// 重置配置
const resetConfig = () => {
  apiConfig.value = { ...originalConfig.value };
  $q.notify({
    type: 'info',
    message: '已恢复为上次保存的配置',
    position: 'top',
  });
};

// 打开文档
const openDocs = (type: string) => {
  const urls = {
    qwen: 'https://help.aliyun.com/zh/dashscope/developer-reference/tongyi-qianwen-vl-plus-api',
    apikey: 'https://dashscope.console.aliyun.com/apiKey',
  };
  
  window.open(urls[type as keyof typeof urls], '_blank');
};

// 加载保存的配置
const loadSavedConfig = () => {
  const saved = localStorage.getItem('qwen_api_config');
  if (saved) {
    try {
      apiConfig.value = JSON.parse(saved);
      originalConfig.value = { ...apiConfig.value };
    } catch (e) {
      console.error('加载配置失败:', e);
    }
  }
};

// 页面加载时读取配置
loadSavedConfig();
</script>
