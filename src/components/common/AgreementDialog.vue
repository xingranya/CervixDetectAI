<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :maximized="$q.screen.lt.sm"
    transition-show="fade"
    transition-hide="fade"
  >
    <q-card class="agreement-dialog">
      <!-- 对话框头部 -->
      <q-card-section class="dialog-header bg-primary text-white">
        <div class="row items-center">
          <div class="col">
            <div class="text-h6">
              <q-icon name="gavel" class="q-mr-sm" />
              用户协议与隐私政策
            </div>
            <div class="text-caption text-white-7">请仔细阅读以下条款</div>
          </div>
          <div class="col-auto">
            <q-btn
              flat
              round
              icon="close"
              color="white"
              @click="$emit('update:modelValue', false)"
            />
          </div>
        </div>
      </q-card-section>

      <!-- Tab 切换 -->
      <q-tabs
        v-model="activeTab"
        class="text-grey-7 bg-grey-1"
        active-color="primary"
        indicator-color="primary"
        align="center"
        narrow-indicator
      >
        <q-tab name="agreement" label="用户协议" icon="description" />
        <q-tab name="privacy" label="隐私政策" icon="security" />
      </q-tabs>

      <q-separator />

      <!-- 内容区域 -->
      <q-card-section class="dialog-content q-pa-none">
        <q-tab-panels v-model="activeTab" animated class="full-height">
          <!-- 用户协议面板 -->
          <q-tab-panel name="agreement" class="q-pa-none">
            <q-scroll-area class="scroll-area">
              <div class="q-pa-lg agreement-text">
                <!-- 引言 -->
                <div class="text-center q-mb-lg">
                  <q-icon name="workspace_premium" color="primary" size="48px" />
                  <div class="text-h5 text-weight-medium q-mt-sm">CervixDetect AI 用户服务协议</div>
                  <div class="text-caption text-grey-6">更新日期：2026年3月11日</div>
                </div>

                <q-banner class="bg-blue-1 text-primary q-mb-lg" rounded>
                  <template v-slot:avatar>
                    <q-icon name="info" color="primary" />
                  </template>
                  <span class="text-body2">
                    请您在使用本服务前仔细阅读并充分理解本协议的全部内容。
                    您的注册、登录、使用等行为将视为对本协议的接受。
                  </span>
                </q-banner>

                <!-- 协议条款摘要 -->
                <div class="terms-summary">
                  <h4 class="text-primary q-mb-md">一、服务概述</h4>
                  <p>
                    CervixDetect AI 是一款基于人工智能技术的宫颈癌筛查辅助诊断系统，
                    通过对宫颈细胞学图像进行智能分析，为医疗专业人员提供辅助诊断参考意见。
                  </p>

                  <q-banner class="bg-orange-1 text-orange-9 q-my-md" rounded dense>
                    <template v-slot:avatar>
                      <q-icon name="warning" color="orange" size="sm" />
                    </template>
                    <span class="text-body2">
                      <strong>重要声明：</strong
                      >本系统仅作为医疗辅助工具，分析结果仅供参考，不构成临床诊断。
                    </span>
                  </q-banner>

                  <h4 class="text-primary q-mb-md">二、账户管理</h4>
                  <ul>
                    <li>用户应提供真实、准确、完整的注册信息</li>
                    <li>用户应妥善保管账户密码，不得将账户转让、出借给他人使用</li>
                    <li>发现账户异常应立即联系我们进行处理</li>
                  </ul>

                  <h4 class="text-primary q-mb-md">三、订阅与付费</h4>
                  <ul>
                    <li>我们提供“基础套餐 / 顶级套餐”两级订阅方案，可在订阅页选择不同档位</li>
                    <li>订阅页内的“支付流程”为页面内状态同步流程，用于展示套餐开通后的交互效果，不产生真实交易</li>
                    <li>连续包月档位会展示“自动扣费提示”，实际计费与续费规则以届时签约/支付说明为准</li>
                    <li>若未来启用真实支付，将在支付页面、合同或补充协议中另行说明价格、对账与退款规则</li>
                  </ul>

                  <h4 class="text-primary q-mb-md">四、医疗免责声明</h4>
                  <q-banner class="bg-red-1 text-red-9 q-my-md" rounded dense>
                    <template v-slot:avatar>
                      <q-icon name="medical_services" color="red" size="sm" />
                    </template>
                    <span class="text-body2">
                      本系统为医疗辅助工具，所有分析结果仅供医疗专业人员参考，
                      <strong>不能替代临床诊断、病理诊断或其他医学检查</strong>。
                    </span>
                  </q-banner>

                  <h4 class="text-primary q-mb-md">五、用户行为规范</h4>
                  <ul>
                    <li>用户应遵守相关法律法规及医疗行业规范</li>
                    <li>用户应确保获得患者知情同意后方可上传其医学影像</li>
                    <li>禁止上传虚假、伪造或与患者无关的医学影像</li>
                  </ul>

                  <h4 class="text-primary q-mb-md">六、知识产权</h4>
                  <p>
                    本系统的所有权利（包括软件著作权、专利权、商标权等）均归云端智诊团队所有。
                    用户对其上传的原始医学影像拥有所有权。
                  </p>

                  <h4 class="text-primary q-mb-md">七、争议解决</h4>
                  <p>
                    本协议的订立、执行、解释及争议解决均适用中华人民共和国法律。
                    因本协议产生的争议，双方应首先友好协商解决。
                  </p>

                  <div class="text-center q-mt-lg">
                    <q-btn
                      flat
                      color="primary"
                      label="查看完整协议"
                      icon-right="open_in_new"
                      no-caps
                      @click="openFullAgreement"
                    />
                  </div>
                </div>
              </div>
            </q-scroll-area>
          </q-tab-panel>

          <!-- 隐私政策面板 -->
          <q-tab-panel name="privacy" class="q-pa-none">
            <q-scroll-area class="scroll-area">
              <div class="q-pa-lg privacy-text">
                <!-- 引言 -->
                <div class="text-center q-mb-lg">
                  <q-icon name="security" color="positive" size="48px" />
                  <div class="text-h5 text-weight-medium q-mt-sm">CervixDetect AI 隐私政策</div>
                  <div class="text-caption text-grey-6">更新日期：2026年3月11日</div>
                </div>

                <q-banner class="bg-green-1 text-positive q-mb-lg" rounded>
                  <template v-slot:avatar>
                    <q-icon name="shield" color="positive" />
                  </template>
                  <span class="text-body2">
                    我们深知个人信息对您的重要性，并会尽全力保护您的个人信息安全可靠。
                  </span>
                </q-banner>

                <!-- 隐私政策摘要 -->
                <div class="privacy-summary">
                  <h4 class="text-positive q-mb-md">一、我们收集的信息</h4>
                  <ul>
                    <li><strong>账户信息：</strong>电子邮箱、手机号码、登录密码（加密存储）</li>
                    <li><strong>患者信息：</strong>姓名、性别、出生日期（需获得患者同意）</li>
                    <li><strong>医学影像：</strong>用于AI分析的宫颈细胞学图像</li>
                    <li><strong>使用日志：</strong>访问时间、操作记录、设备信息</li>
                  </ul>

                  <h4 class="text-positive q-mb-md">二、信息使用目的</h4>
                  <ul>
                    <li>提供账户注册、登录和身份验证服务</li>
                    <li>对医学影像进行AI分析并生成报告</li>
                    <li>改进AI模型和优化服务体验（使用脱敏数据）</li>
                    <li>发送服务通知和安全提醒</li>
                  </ul>

                  <h4 class="text-positive q-mb-md">三、信息安全保护</h4>
                  <div class="row q-col-gutter-sm q-my-md">
                    <div class="col-6">
                      <q-chip icon="https" color="positive" text-color="white" dense>
                        SSL/TLS加密
                      </q-chip>
                    </div>
                    <div class="col-6">
                      <q-chip icon="enhanced_encryption" color="positive" text-color="white" dense>
                        bcrypt密码加密
                      </q-chip>
                    </div>
                    <div class="col-6">
                      <q-chip icon="token" color="positive" text-color="white" dense>
                        JWT双Token认证
                      </q-chip>
                    </div>
                    <div class="col-6">
                      <q-chip icon="admin_panel_settings" color="positive" text-color="white" dense>
                        RBAC权限控制
                      </q-chip>
                    </div>
                  </div>

                  <h4 class="text-positive q-mb-md">四、第三方服务</h4>
                  <ul>
                    <li><strong>阿里云短信服务：</strong>用于发送验证码</li>
                    <li><strong>通义千问AI：</strong>用于医学影像分析</li>
                    <li>
                      <strong>支付相关服务：</strong>订阅页可能展示支付方式选项或记录支付方式偏好（页面交互用途）。若未来启用真实支付，将以实际接入的第三方服务为准
                    </li>
                  </ul>

                  <h4 class="text-positive q-mb-md">五、您的权利</h4>
                  <p>您享有以下个人信息权利：</p>
                  <div class="row q-col-gutter-sm q-my-md">
                    <div class="col-4 text-center">
                      <q-icon name="visibility" color="primary" size="24px" />
                      <div class="text-caption">访问权</div>
                    </div>
                    <div class="col-4 text-center">
                      <q-icon name="edit" color="primary" size="24px" />
                      <div class="text-caption">更正权</div>
                    </div>
                    <div class="col-4 text-center">
                      <q-icon name="delete" color="primary" size="24px" />
                      <div class="text-caption">删除权</div>
                    </div>
                    <div class="col-4 text-center">
                      <q-icon name="file_download" color="primary" size="24px" />
                      <div class="text-caption">可携带权</div>
                    </div>
                    <div class="col-4 text-center">
                      <q-icon name="block" color="primary" size="24px" />
                      <div class="text-caption">撤回同意</div>
                    </div>
                    <div class="col-4 text-center">
                      <q-icon name="person_off" color="primary" size="24px" />
                      <div class="text-caption">注销账户</div>
                    </div>
                  </div>

                  <h4 class="text-positive q-mb-md">六、联系我们</h4>
                  <p>
                    如您对隐私政策有任何疑问，请联系：
                    <a href="mailto:privacy@cervixdetect.ai" class="text-primary">
                      privacy@cervixdetect.ai
                    </a>
                  </p>

                  <div class="text-center q-mt-lg">
                    <q-btn
                      flat
                      color="positive"
                      label="查看完整隐私政策"
                      icon-right="open_in_new"
                      no-caps
                      @click="openFullPrivacy"
                    />
                  </div>
                </div>
              </div>
            </q-scroll-area>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <!-- 底部操作按钮 -->
      <q-separator />
      <q-card-actions class="dialog-actions q-pa-md" align="center">
        <q-btn
          v-if="showAgreeButton"
          unelevated
          color="primary"
          label="我已阅读并同意以上协议"
          icon="check_circle"
          class="full-width"
          size="lg"
          no-caps
          @click="handleAgree"
        />
        <q-btn
          v-else
          flat
          color="primary"
          label="关闭"
          class="full-width"
          no-caps
          @click="$emit('update:modelValue', false)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

// Props 定义
interface Props {
  /** 控制弹窗显示 */
  modelValue: boolean;
  /** 初始显示的Tab */
  initialTab?: 'agreement' | 'privacy';
  /** 是否显示同意按钮 */
  showAgreeButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  initialTab: 'agreement',
  showAgreeButton: true,
});

// Emits 定义
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'agree'): void;
}>();

const router = useRouter();
const $q = useQuasar();

// 当前激活的Tab
const activeTab = ref<'agreement' | 'privacy'>(props.initialTab);

// 监听 initialTab 变化
watch(
  () => props.initialTab,
  (newTab) => {
    activeTab.value = newTab;
  },
);

// 监听弹窗打开时重置Tab
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      activeTab.value = props.initialTab;
    }
  },
);

/**
 * 处理用户点击同意
 */
const handleAgree = () => {
  emit('agree');
  emit('update:modelValue', false);
};

/**
 * 打开完整用户协议页面
 */
const openFullAgreement = () => {
  const routeData = router.resolve({ path: '/user-agreement' });
  window.open(routeData.href, '_blank');
};

/**
 * 打开完整隐私政策页面
 */
const openFullPrivacy = () => {
  const routeData = router.resolve({ path: '/privacy-policy' });
  window.open(routeData.href, '_blank');
};
</script>

<style scoped>
.agreement-dialog {
  display: flex;
  flex-direction: column;
  width: 700px;
  max-width: 90vw;
  height: 80vh;
  max-height: 700px;
  border-radius: 12px;
  overflow: hidden;
}

.dialog-header {
  flex-shrink: 0;
}

.dialog-content {
  flex: 1;
  overflow: hidden;
}

.scroll-area {
  height: 100%;
}

.dialog-actions {
  flex-shrink: 0;
  background: #f5f5f5;
}

/* 协议文本样式 */
.agreement-text,
.privacy-text {
  max-width: 100%;
  margin: 0 auto;
  line-height: 1.8;
}

.agreement-text h4,
.privacy-text h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-top: 20px;
  margin-bottom: 12px;
  padding-left: 12px;
  border-left: 3px solid currentColor;
}

.agreement-text ul,
.privacy-text ul {
  padding-left: 24px;
  margin: 12px 0;
}

.agreement-text li,
.privacy-text li {
  margin-bottom: 8px;
}

.agreement-text p,
.privacy-text p {
  margin-bottom: 12px;
  text-align: justify;
}

/* 移动端全屏时恢复原样式 */
@media (max-width: 599px) {
  .agreement-dialog {
    width: 100%;
    max-width: 100%;
    height: 100vh;
    max-height: 100%;
    border-radius: 0;
  }

  .agreement-text,
  .privacy-text {
    padding: 12px;
  }
}
</style>

<style lang="scss">
body.body--dark {
  .dialog-actions {
    background: var(--app-elevated-bg) !important;
  }

  .agreement-dialog {
    background: var(--app-surface);
  }
}
</style>
