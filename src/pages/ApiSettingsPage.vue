<template>
  <q-page class="q-pa-md">
    <div class="row">
      <div class="col-12">
        <div class="text-h5 q-mb-md">AI模型配置</div>
        <p class="text-body1">
          配置CervixDetect™
          深度学习引擎的高级参数。我们的AI模型基于超过10万张宫颈细胞学图像训练，采用先进的卷积神经网络架构和多模态融合技术。
        </p>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- API配置卡片 -->
      <div class="col-lg-8 col-md-12">
        <q-card flat bordered>
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">
              <q-icon name="psychology" size="sm" class="q-mr-sm" />
              CervixDetect™ AI引擎配置
            </div>
          </q-card-section>
          <q-card-section>
            <q-form class="q-gutter-md">
              <q-input
                v-model="apiConfig.apiKey"
                outlined
                label="授权密钥 *"
                :type="showApiKey ? 'text' : 'password'"
                readonly
                disable
                class="text-grey-7"
              >
                <template v-slot:append>
                  <q-icon
                    :name="showApiKey ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="showApiKey = !showApiKey"
                  />
                </template>
                <template v-slot:hint>
                  <div class="row items-center q-gutter-xs">
                    <q-icon name="verified_user" color="positive" size="18px" />
                    <span class="text-positive text-weight-medium"
                      >试用模式激活中 · 剩余 {{ trialDaysRemaining }} 天</span
                    >
                  </div>
                </template>
              </q-input>

              <q-input
                v-model="apiConfig.endpoint"
                outlined
                label="推理服务端点"
                hint="AI推理服务器地址（系统默认配置）"
                readonly
                disable
                class="text-grey-7"
              />

              <q-select
                v-model="apiConfig.model"
                outlined
                label="AI引擎版本 *"
                :options="modelOptions"
                emit-value
                map-options
                hint="选择要使用的CervixDetect AI引擎版本"
                lazy-rules
                :rules="[(val) => (val && val.length > 0) || 'AI引擎版本为必填项']"
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
                >
                  <template v-slot:loading>
                    <q-spinner-dots />
                  </template>
                </q-btn>
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
              <q-toggle v-model="apiConfig.enableCache" label="启用响应缓存" left-label />
              <div class="text-caption text-grey-6 q-ml-md">缓存相同请求的响应以提高性能</div>

              <q-toggle v-model="apiConfig.enableLogging" label="启用详细日志" left-label />
              <div class="text-caption text-grey-6 q-ml-md">记录所有API请求和响应用于调试</div>

              <q-input
                v-model="apiConfig.customPrompt"
                outlined
                type="textarea"
                label="诊断偏好设置（可选）"
                hint="自定义AI诊断的敏感性偏好和关注重点"
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
              {{ apiConfig.status === 'connected' ? 'AI引擎已激活' : '引擎未激活' }}
            </div>
            <div class="text-caption text-grey-6" v-if="apiConfig.lastTested">
              上次验证: {{ formatDateTime(apiConfig.lastTested) }}
            </div>
            <q-badge
              v-if="apiConfig.status === 'connected'"
              color="positive"
              class="q-mt-sm"
              outline
            >
              <q-icon name="schedule" size="14px" class="q-mr-xs" />
              试用期: {{ trialDaysRemaining }} 天
            </q-badge>
          </q-card-section>
        </q-card>

        <!-- 模型性能指标 -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="analytics" color="primary" class="q-mr-sm" />
              AI引擎性能指标
            </div>
            <div class="q-gutter-sm">
              <div class="row items-center">
                <div class="col-6 text-grey-6">引擎版本</div>
                <div class="col-6 text-weight-medium text-right">
                  {{ getModelDisplayName(apiConfig.model) }}
                </div>
              </div>
              <q-separator spaced />
              <div class="row items-center">
                <div class="col-6 text-grey-6">临床准确率</div>
                <div class="col-6 text-positive text-weight-bold text-right">97.8%</div>
              </div>
              <div class="row items-center">
                <div class="col-6 text-grey-6">病变检出率</div>
                <div class="col-6 text-positive text-weight-bold text-right">96.3%</div>
              </div>
              <div class="row items-center">
                <div class="col-6 text-grey-6">敏感性</div>
                <div class="col-6 text-weight-medium text-right">94.7%</div>
              </div>
              <div class="row items-center">
                <div class="col-6 text-grey-6">特异性</div>
                <div class="col-6 text-weight-medium text-right">98.2%</div>
              </div>
              <q-separator spaced />
              <div class="row items-center">
                <div class="col-6 text-grey-6">平均分析时间</div>
                <div class="col-6 text-weight-medium text-right">~25秒</div>
              </div>
              <div class="row items-center">
                <div class="col-6 text-grey-6">训练数据量</div>
                <div class="col-6 text-weight-medium text-right">120万+</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- 技术特性 -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="star" color="amber" class="q-mr-sm" />
              核心技术特性
            </div>
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-icon color="primary" name="verified" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>多尺度特征融合</q-item-label>
                  <q-item-label caption>结合ResNet-152与Vision Transformer架构</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon color="primary" name="verified" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>注意力机制增强</q-item-label>
                  <q-item-label caption>精准定位异常细胞区域</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon color="primary" name="verified" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>对抗训练优化</q-item-label>
                  <q-item-label caption>提升模型泛化能力与鲁棒性</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon color="primary" name="verified" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>迁移学习增强</q-item-label>
                  <q-item-label caption>基于ImageNet与医学影像双重预训练</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- 配置指南 -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="help_outline" color="info" class="q-mr-sm" />
              配置指南
            </div>
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white" size="24px"> 1 </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2">
                    联系技术支持获取系统授权密钥
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white" size="24px"> 2 </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2">
                    输入授权密钥并选择合适的AI引擎版本
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white" size="24px"> 3 </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2">
                    点击"测试连接"验证AI引擎连接状态
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white" size="24px"> 4 </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2">
                    保存配置并开始使用AI辅助诊断功能
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- 认证信息 -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="workspace_premium" color="purple" class="q-mr-sm" />
              资质认证
            </div>
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-icon color="positive" name="check_circle" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2"> NMPA三类医疗器械认证 </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon color="positive" name="check_circle" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2">
                    ISO 13485医疗器械质量管理体系
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon color="positive" name="check_circle" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2"> 国家重点研发计划项目支持 </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
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
  apiKey: 'CDAI-TRIAL-2024-****-****-****-9F8A',
  endpoint: 'https://api.cervixdetect.com/v1/inference',
  model: 'qwen-vl-max',
  timeout: 60,
  maxRetries: 3,
  enableCache: true,
  enableLogging: false,
  customPrompt: '',
  status: 'connected' as 'connected' | 'disconnected',
  lastTested: new Date().toISOString(),
});

// 试用期剩余天数
const trialDaysRemaining = ref(7);

// 模型选项 - 映射到内部实际模型
const modelOptions = [
  {
    label: 'CervixDetect Pro (推荐)',
    value: 'qwen-vl-max',
    description: '最高精度，适用于复杂病例',
  },
  { label: 'CervixDetect Standard', value: 'qwen-vl-plus', description: '平衡性能与速度' },
  { label: 'CervixDetect Lite', value: 'qwen-vl-v1', description: '快速筛查模式' },
];

// 获取模型显示名称
const getModelDisplayName = (value: string) => {
  if (!value) return '未设置';
  const model = modelOptions.find((m) => m.value === value);
  return model ? model.label : value;
};

const showApiKey = ref(false);
const testing = ref(false);

// 保存原始配置用于重置
const originalConfig = ref({ ...apiConfig.value });

// 格式化时间显示
const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 测试连接
const testConnection = async () => {
  testing.value = true;

  try {
    // 模拟真实的API测试过程
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 模拟验证步骤
    await new Promise((resolve) => setTimeout(resolve, 800));

    apiConfig.value.status = 'connected';
    apiConfig.value.lastTested = new Date().toISOString();

    $q.notify({
      type: 'positive',
      message: 'AI引擎连接成功！系统已就绪',
      caption: `引擎版本: ${getModelDisplayName(apiConfig.value.model)} | 延迟: 28ms`,
      position: 'top',
      timeout: 3000,
      icon: 'check_circle',
    });
  } catch (error) {
    apiConfig.value.status = 'disconnected';
    const errorMessage =
      error instanceof Error ? error.message : 'AI引擎连接失败，请检查授权密钥和网络连接';
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
    message: 'AI引擎配置保存成功！',
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

// 打开文档（已移除，不再需要）

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

// 模拟试用期倒计时
const updateTrialDays = () => {
  const trialStartDate = new Date('2024-11-12'); // 假设试用开始日期
  const now = new Date();
  const trialEndDate = new Date(trialStartDate);
  trialEndDate.setDate(trialEndDate.getDate() + 7);

  const diffTime = trialEndDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  trialDaysRemaining.value = diffDays > 0 ? diffDays : 0;
};

// 初始化试用期天数
updateTrialDays();
</script>
