<template>
  <q-page class="q-pa-md">
    <!-- 页面头部 -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5 q-mb-xs">
          <q-icon name="workspace_premium" class="q-mr-sm" color="primary" />
          订阅与AI设置
        </div>
        <div class="text-subtitle2 text-grey-7">选择适合您的AI辅助筛查订阅计划，配置AI引擎参数</div>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- 左侧主内容 -->
      <div class="col-lg-8 col-md-12">
        <!-- 订阅计划选择 -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">订阅服务计划</div>
            <div class="row q-col-gutter-md">
              <!-- 按次付费 -->
              <div class="col-12 col-md-4">
                <q-card
                  flat
                  bordered
                  class="cursor-pointer"
                  :class="{ 'bg-blue-1': selectedPlan === 'pay-per-use' }"
                  @click="selectedPlan = 'pay-per-use'"
                >
                  <q-card-section class="text-center">
                    <q-icon name="payments" size="48px" color="primary" class="q-mb-sm" />
                    <div class="text-h6 q-mb-xs">按次付费</div>
                    <div class="text-h4 text-primary q-my-sm">
                      ¥19<span class="text-body2">/次</span>
                    </div>
                    <div class="text-caption text-grey-7">灵活支付，按需使用</div>
                  </q-card-section>
                  <q-separator />
                  <q-card-section>
                    <div class="q-gutter-xs">
                      <div
                        v-for="feature in payPerUseFeatures"
                        :key="feature.text"
                        class="row items-center no-wrap"
                      >
                        <q-icon
                          :name="feature.icon"
                          :color="feature.color"
                          size="xs"
                          class="q-mr-xs"
                        />
                        <span class="text-body2" :class="feature.enabled ? '' : 'text-grey-5'">{{
                          feature.text
                        }}</span>
                      </div>
                    </div>
                  </q-card-section>
                  <q-card-actions>
                    <q-btn
                      flat
                      color="primary"
                      label="选择套餐包"
                      no-caps
                      class="full-width"
                      @click.stop="showPackageDialog = true"
                    />
                  </q-card-actions>
                </q-card>
              </div>

              <!-- 月度订阅 -->
              <div class="col-12 col-md-4">
                <q-card
                  flat
                  bordered
                  class="cursor-pointer subscription-card"
                  :class="{ 'bg-blue-1': selectedPlan === 'monthly' }"
                  @click="selectedPlan = 'monthly'"
                >
                  <q-badge color="orange" floating>
                    <q-icon name="star" size="xs" class="q-mr-xs" />
                    推荐
                  </q-badge>
                  <q-card-section class="text-center">
                    <q-icon name="calendar_month" size="48px" color="primary" class="q-mb-sm" />
                    <div class="text-h6 q-mb-xs">月度订阅</div>

                    <!-- 价格显示优化 -->
                    <div class="price-container q-my-sm">
                      <div class="original-price text-caption text-grey-6 text-strike">¥299</div>
                      <div class="current-price">
                        <span class="text-h4 text-primary text-weight-bold">¥270</span>
                        <span class="text-body2 text-grey-7">/月</span>
                      </div>
                      <div class="discount-tag q-mt-xs">首月立减29元</div>
                    </div>

                    <div class="text-caption text-grey-7">包含20次AI分析</div>
                  </q-card-section>
                  <q-separator />
                  <q-card-section>
                    <div class="q-gutter-xs">
                      <div
                        v-for="feature in monthlyFeatures"
                        :key="feature.text"
                        class="row items-center no-wrap"
                      >
                        <q-icon
                          :name="feature.icon"
                          :color="feature.color"
                          size="xs"
                          class="q-mr-xs"
                        />
                        <span class="text-body2">{{ feature.text }}</span>
                      </div>
                    </div>
                  </q-card-section>
                  <q-card-actions>
                    <q-btn
                      unelevated
                      color="primary"
                      label="立即订阅"
                      no-caps
                      class="full-width"
                      @click.stop="handleSubscribe('monthly')"
                    />
                  </q-card-actions>
                </q-card>
              </div>

              <!-- 年度订阅 -->
              <div class="col-12 col-md-4">
                <q-card
                  flat
                  bordered
                  class="cursor-pointer subscription-card"
                  :class="{ 'bg-blue-1': selectedPlan === 'yearly' }"
                  @click="selectedPlan = 'yearly'"
                >
                  <q-badge color="positive" floating>
                    <q-icon name="trending_up" size="xs" class="q-mr-xs" />
                    超值
                  </q-badge>
                  <q-card-section class="text-center">
                    <q-icon name="workspace_premium" size="48px" color="positive" class="q-mb-sm" />
                    <div class="text-h6 q-mb-xs">年度订阅</div>

                    <!-- 价格显示优化 -->
                    <div class="price-container q-my-sm">
                      <div class="original-price text-caption text-grey-6 text-strike">¥2,999</div>
                      <div class="current-price">
                        <span class="text-h4 text-positive text-weight-bold">¥2,700</span>
                        <span class="text-body2 text-grey-7">/年</span>
                      </div>
                      <div class="discount-tag q-mt-xs">年度特惠299元</div>
                    </div>

                    <div class="text-caption text-positive text-weight-medium">相当于¥225/月</div>
                  </q-card-section>
                  <q-separator />
                  <q-card-section>
                    <div class="q-gutter-xs">
                      <div
                        v-for="feature in yearlyFeatures"
                        :key="feature.text"
                        class="row items-center no-wrap"
                      >
                        <q-icon
                          :name="feature.icon"
                          :color="feature.color"
                          size="xs"
                          class="q-mr-xs"
                        />
                        <span class="text-body2">{{ feature.text }}</span>
                      </div>
                    </div>
                  </q-card-section>
                  <q-card-actions>
                    <q-btn
                      unelevated
                      color="positive"
                      label="立即订阅"
                      no-caps
                      class="full-width"
                      @click.stop="handleSubscribe('yearly')"
                    />
                  </q-card-actions>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- AI模型配置 -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">AI引擎配置</div>
            <q-form class="q-gutter-md">
              <q-select
                v-model="apiConfig.model"
                outlined
                label="AI引擎版本"
                :options="modelOptions"
                emit-value
                map-options
                hint="选择要使用的CervixDetect AI引擎版本"
              >
                <template v-slot:prepend>
                  <q-icon name="psychology" />
                </template>
              </q-select>

              <q-slider
                v-model="apiConfig.confidence"
                :min="0.7"
                :max="0.95"
                :step="0.05"
                label
                label-always
                :label-value="'置信度阈值: ' + (apiConfig.confidence * 100).toFixed(0) + '%'"
                color="primary"
                class="q-mt-lg"
              />
              <div class="text-caption text-grey-6 q-mt-sm">
                AI诊断结果的最低置信度要求，值越高诊断越保守
              </div>

              <q-slider
                v-model="apiConfig.sensitivity"
                :min="0.8"
                :max="1.0"
                :step="0.05"
                label
                label-always
                :label-value="'敏感性: ' + (apiConfig.sensitivity * 100).toFixed(0) + '%'"
                color="orange"
                class="q-mt-lg"
              />
              <div class="text-caption text-grey-6 q-mt-sm">调整AI对异常细胞的检测敏感度</div>

              <div class="row q-mt-md">
                <q-space />
                <q-btn flat label="恢复默认" @click="resetAIConfig" class="q-mr-sm" />
                <q-btn unelevated color="primary" label="保存配置" no-caps @click="saveAIConfig" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>

        <!-- 服务偏好设置 (UI优化版) -->
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center justify-between q-mb-md">
              <div class="text-h6">
                <q-icon name="tune" color="primary" class="q-mr-sm" />
                服务偏好设置
              </div>
              <q-btn
                flat
                round
                icon="restart_alt"
                color="grey-7"
                size="sm"
                @click="resetPreferences"
              >
                <q-tooltip>恢复默认设置</q-tooltip>
              </q-btn>
            </div>

            <div class="row q-col-gutter-lg">
              <!-- 左列：通知与分析 -->
              <div class="col-12 col-md-6">
                <div class="text-subtitle2 text-primary q-mb-sm">
                  <q-icon name="notifications" class="q-mr-xs" />
                  智能通知中心
                </div>
                <q-list separator class="rounded-borders bg-grey-1">
                  <q-item tag="label" v-ripple>
                    <q-item-section>
                      <q-item-label>启用全渠道通知</q-item-label>
                      <q-item-label caption>站内通知、分析完成、异常预警等重要消息</q-item-label>
                    </q-item-section>
                    <q-item-section side top>
                      <q-toggle v-model="preferences.notifications.enable" color="primary" />
                    </q-item-section>
                  </q-item>

                  <q-slide-transition>
                    <div v-show="preferences.notifications.enable">
                      <q-item>
                        <q-item-section>
                          <q-item-label class="text-caption text-grey-7 q-mb-xs"
                            >通知渠道</q-item-label
                          >
                          <div class="q-gutter-sm">
                            <q-checkbox
                              v-model="preferences.notifications.channels"
                              val="in_app"
                              label="站内通知"
                              dense
                              size="sm"
                            />
                            <q-checkbox
                              v-model="preferences.notifications.channels"
                              val="email"
                              label="邮件"
                              dense
                              size="sm"
                            />
                            <q-checkbox
                              v-model="preferences.notifications.channels"
                              val="sms"
                              label="短信"
                              dense
                              size="sm"
                            />
                            <q-checkbox
                              v-model="preferences.notifications.channels"
                              val="browser"
                              label="浏览器推送"
                              dense
                              size="sm"
                            />
                            <q-checkbox
                              v-model="preferences.notifications.channels"
                              val="wechat"
                              label="微信服务号"
                              dense
                              size="sm"
                            />
                          </div>
                        </q-item-section>
                      </q-item>

                      <q-item>
                        <q-item-section>
                          <q-item-label class="text-caption text-grey-7 q-mb-xs"
                            >接收内容</q-item-label
                          >
                          <q-select
                            v-model="preferences.notifications.types"
                            multiple
                            filled
                            dense
                            options-dense
                            emit-value
                            map-options
                            :options="[
                              { label: '分析完成报告', value: 'analysis' },
                              { label: '高风险病变预警', value: 'alert' },
                              { label: '系统安全通知', value: 'security' },
                              { label: '周度/月度汇总', value: 'report' },
                              { label: '营销与优惠', value: 'marketing' },
                            ]"
                            label="选择通知类型"
                          >
                            <template v-slot:option="{ itemProps, opt, selected, toggleOption }">
                              <q-item v-bind="itemProps">
                                <q-item-section>
                                  <q-item-label>{{ opt.label }}</q-item-label>
                                </q-item-section>
                                <q-item-section side>
                                  <q-toggle
                                    :model-value="selected"
                                    @update:model-value="toggleOption(opt)"
                                  />
                                </q-item-section>
                              </q-item>
                            </template>
                          </q-select>
                        </q-item-section>
                      </q-item>

                      <q-item tag="label" v-ripple>
                        <q-item-section>
                          <q-item-label>免打扰模式</q-item-label>
                          <q-item-label caption>夜间 (22:00 - 08:00) 仅接收紧急预警</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <q-toggle
                            v-model="preferences.notifications.dndMode"
                            color="indigo"
                            icon="nightlight"
                          />
                        </q-item-section>
                      </q-item>
                    </div>
                  </q-slide-transition>
                </q-list>

                <div class="text-subtitle2 text-primary q-mt-md q-mb-sm">
                  <q-icon name="science" class="q-mr-xs" />
                  分析与诊断习惯
                </div>
                <q-card flat bordered class="bg-grey-1">
                  <q-card-section class="q-pa-sm">
                    <q-toggle
                      v-model="preferences.analysis.autoStart"
                      label="上传后自动开始分析"
                      dense
                      class="q-mb-sm"
                    />
                    <q-toggle
                      v-model="preferences.analysis.aiSecondOpinion"
                      label="启用AI第二诊疗意见"
                      dense
                      color="purple"
                    />

                    <q-separator class="q-my-sm" />

                    <div class="row q-col-gutter-sm">
                      <div class="col-6">
                        <q-select
                          v-model="preferences.analysis.roiStyle"
                          filled
                          dense
                          options-dense
                          emit-value
                          map-options
                          label="病灶标记样式"
                          :options="[
                            { label: '矩形框 (Box)', value: 'box' },
                            { label: '轮廓遮罩 (Mask)', value: 'mask' },
                            { label: '热力图 (Heatmap)', value: 'heatmap' },
                            { label: '混合显示 (Hybrid)', value: 'hybrid' },
                          ]"
                        />
                      </div>
                      <div class="col-6">
                        <q-select
                          v-model="preferences.analysis.heatmapColor"
                          filled
                          dense
                          options-dense
                          emit-value
                          map-options
                          label="热力图配色"
                          :options="[
                            { label: '经典红蓝 (Jet)', value: 'jet' },
                            { label: '医学灰阶 (Gray)', value: 'gray' },
                            { label: '警告红黄 (Hot)', value: 'hot' },
                            { label: '荧光绿 (Viridis)', value: 'viridis' },
                          ]"
                        />
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <!-- 右列：报告、隐私与订阅 -->
              <div class="col-12 col-md-6">
                <div class="text-subtitle2 text-primary q-mb-sm">
                  <q-icon name="assignment" class="q-mr-xs" />
                  报告与导出配置
                </div>
                <q-list separator class="rounded-borders bg-grey-1">
                  <q-item>
                    <q-item-section>
                      <q-item-label>自动保存历史记录</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-toggle v-model="preferences.reports.autoSave" color="green" />
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <div class="row q-col-gutter-sm">
                        <div class="col-6">
                          <q-select
                            v-model="preferences.reports.defaultFormat"
                            filled
                            dense
                            label="默认导出格式"
                            :options="[
                              { label: 'PDF 专业版', value: 'pdf_pro' },
                              { label: 'PDF 精简版', value: 'pdf_lite' },
                              { label: 'Word 文档', value: 'docx' },
                              { label: 'Excel 数据表', value: 'xlsx' },
                            ]"
                          />
                        </div>
                        <div class="col-6">
                          <q-select
                            v-model="preferences.reports.imageQuality"
                            filled
                            dense
                            label="影像存档质量"
                            :options="[
                              { label: '无损原始图 (RAW)', value: 'lossless' },
                              { label: '高质量 (High)', value: 'high' },
                              { label: '标准压缩 (Standard)', value: 'standard' },
                            ]"
                          />
                        </div>
                      </div>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section>
                      <q-input
                        v-model="preferences.reports.watermarkText"
                        filled
                        dense
                        label="自定义报告水印"
                        placeholder="例如: 仅供内部参考"
                      >
                        <template v-slot:append>
                          <q-toggle v-model="preferences.reports.watermark" dense color="teal" />
                        </template>
                      </q-input>
                    </q-item-section>
                  </q-item>
                </q-list>

                <div class="text-subtitle2 text-primary q-mt-md q-mb-sm">
                  <q-icon name="security" class="q-mr-xs" />
                  隐私与安全
                </div>
                <q-card flat bordered class="bg-grey-1">
                  <q-card-section class="q-pa-sm">
                    <div class="row items-center justify-between q-mb-sm">
                      <div class="text-body2">患者敏感信息脱敏</div>
                      <q-toggle v-model="preferences.privacy.desensitization" color="red" dense />
                    </div>
                    <div class="text-caption text-grey-7 q-mb-sm">
                      在导出报告和演示模式中自动隐藏患者姓名、身份证号
                    </div>

                    <q-separator class="q-my-sm" />

                    <div class="row items-center justify-between">
                      <div class="text-body2">敏感操作二次验证</div>
                      <q-toggle v-model="preferences.privacy.mfa" color="orange" dense />
                    </div>
                  </q-card-section>
                </q-card>

                <div class="text-subtitle2 text-primary q-mt-md q-mb-sm">
                  <q-icon name="account_balance_wallet" class="q-mr-xs" />
                  订阅与账单
                </div>
                <div class="row q-col-gutter-sm">
                  <div class="col-6">
                    <q-card flat bordered class="bg-grey-1">
                      <q-card-section class="q-pa-sm row items-center justify-between">
                        <div class="text-body2">自动续费</div>
                        <q-toggle v-model="preferences.billing.autoRenewal" color="primary" dense />
                      </q-card-section>
                    </q-card>
                  </div>
                  <div class="col-6">
                    <q-card flat bordered class="bg-grey-1">
                      <q-card-section class="q-pa-sm row items-center justify-between">
                        <div class="text-body2">余额预警</div>
                        <q-toggle
                          v-model="preferences.billing.lowBalanceAlert"
                          color="warning"
                          dense
                        />
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
                <q-input
                  v-if="preferences.billing.lowBalanceAlert"
                  v-model.number="preferences.billing.threshold"
                  filled
                  dense
                  type="number"
                  label="预警阈值 (元)"
                  class="q-mt-sm"
                  prefix="¥"
                />
              </div>
            </div>

            <div class="row q-mt-lg">
              <q-space />
              <q-btn
                unelevated
                color="primary"
                label="保存所有偏好设置"
                icon="save"
                no-caps
                @click="savePreferences"
                class="full-width-xs"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- 侧边栏信息 -->
      <div class="col-lg-4 col-md-12">
        <!-- 订阅状态 -->
        <q-card flat bordered>
          <q-card-section class="text-center">
            <q-icon :name="subscriptionStatus.icon" :color="subscriptionStatus.color" size="3rem" />
            <div class="text-h6 q-mt-md">
              {{ subscriptionStatus.title }}
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">
              {{ subscriptionStatus.subtitle }}
            </div>
            <q-badge
              :color="subscriptionStatus.badgeColor"
              class="q-mt-md"
              :outline="subscriptionStatus.type === 'trial'"
            >
              <q-icon name="schedule" size="14px" class="q-mr-xs" />
              {{ subscriptionStatus.badge }}
            </q-badge>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="q-gutter-sm">
              <div class="row items-center">
                <div class="col-6 text-grey-6">订阅类型</div>
                <div class="col-6 text-weight-medium text-right">
                  {{ subscriptionStatus.planName }}
                </div>
              </div>
              <div class="row items-center">
                <div class="col-6 text-grey-6">到期时间</div>
                <div class="col-6 text-weight-medium text-right">
                  {{ subscriptionStatus.expireDate }}
                </div>
              </div>
              <div class="row items-center">
                <div class="col-6 text-grey-6">剩余次数</div>
                <div class="col-6 text-primary text-weight-bold text-right">
                  {{ subscriptionStatus.remainingCount }} 次
                </div>
              </div>
            </div>
          </q-card-section>
          <q-card-actions v-if="subscriptionStatus.type === 'trial'">
            <q-btn
              unelevated
              color="primary"
              label="立即升级"
              icon="arrow_upward"
              class="full-width"
              @click="showUpgradeDialog = true"
            />
          </q-card-actions>
        </q-card>

        <!-- 订阅计划对比 -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="compare" color="primary" class="q-mr-sm" />
              订阅计划对比
            </div>
            <q-markup-table flat dense>
              <thead>
                <tr>
                  <th class="text-left">功能</th>
                  <th class="text-center">按次</th>
                  <th class="text-center">月度</th>
                  <th class="text-center">年度</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>AI分析</td>
                  <td class="text-center">¥19/次</td>
                  <td class="text-center">20次</td>
                  <td class="text-center">300次</td>
                </tr>
                <tr>
                  <td>报告保存</td>
                  <td class="text-center">7天</td>
                  <td class="text-center">永久</td>
                  <td class="text-center">永久</td>
                </tr>
                <tr>
                  <td>优先处理</td>
                  <td class="text-center">
                    <q-icon name="close" color="grey" size="xs" />
                  </td>
                  <td class="text-center">
                    <q-icon name="check" color="positive" size="xs" />
                  </td>
                  <td class="text-center">
                    <q-icon name="check" color="positive" size="xs" />
                  </td>
                </tr>
                <tr>
                  <td>客服支持</td>
                  <td class="text-center">基础</td>
                  <td class="text-center">标准</td>
                  <td class="text-center">VIP</td>
                </tr>
                <tr>
                  <td>数据统计</td>
                  <td class="text-center">
                    <q-icon name="close" color="grey" size="xs" />
                  </td>
                  <td class="text-center">
                    <q-icon name="close" color="grey" size="xs" />
                  </td>
                  <td class="text-center">
                    <q-icon name="check" color="positive" size="xs" />
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-card-section>
        </q-card>

        <!-- AI引擎性能指标 -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="analytics" color="primary" class="q-mr-sm" />
              AI引擎性能指标
            </div>
            <div class="q-gutter-sm">
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

        <!-- 订阅指南 -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="help_outline" color="info" class="q-mr-sm" />
              订阅指南
            </div>
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white" size="24px"> 1 </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2">
                    根据使用频率选择合适的订阅计划
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white" size="24px"> 2 </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2">
                    点击"立即订阅"按钮进入支付流程
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white" size="24px"> 3 </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2">
                    完成支付后即可开始使用AI分析服务
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white" size="24px"> 4 </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2">
                    订阅到期前将收到续费提醒通知
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

            <!-- 软著展示 (置顶优化) -->
            <div class="q-gutter-y-sm q-mb-md">
              <div
                class="bg-purple-1 rounded-borders q-pa-sm relative-position overflow-hidden cursor-pointer copyright-card"
              >
                <div class="row items-center relative-position" style="z-index: 1">
                  <q-icon name="verified" color="purple" size="sm" class="q-mr-sm col-auto" />
                  <div class="col">
                    <div
                      class="text-subtitle2 text-purple-9 text-weight-bold"
                      style="line-height: 1.2"
                    >
                      宫颈智能阅片与分级管理系统
                      <q-badge color="purple-3" text-color="purple-9" class="q-ml-xs" align="top"
                        >V1.0.0</q-badge
                      >
                    </div>
                  </div>
                </div>
                <div
                  class="row q-mt-xs text-caption text-purple-8 q-pl-lg relative-position"
                  style="z-index: 1"
                >
                  <div class="col-12 row items-center" style="line-height: 1.5">
                    <span class="q-mr-sm text-weight-bold opacity-70">登记号</span>
                    <span class="text-weight-medium">2026SR0224083</span>
                  </div>
                  <div class="col-12 row items-center" style="line-height: 1.5">
                    <span class="q-mr-sm text-weight-bold opacity-70">证书号</span>
                    <span class="text-weight-medium">软著登字第17438364号</span>
                  </div>
                </div>
                <!-- 装饰背景 -->
                <q-icon
                  name="copyright"
                  class="absolute-bottom-right text-purple-2"
                  size="48px"
                  style="bottom: -12px; right: -8px; transform: rotate(-15deg)"
                />
              </div>

              <div
                class="bg-purple-1 rounded-borders q-pa-sm relative-position overflow-hidden cursor-pointer copyright-card"
              >
                <div class="row items-center relative-position" style="z-index: 1">
                  <q-icon name="verified" color="purple" size="sm" class="q-mr-sm col-auto" />
                  <div class="col">
                    <div
                      class="text-subtitle2 text-purple-9 text-weight-bold"
                      style="line-height: 1.2"
                    >
                      宫颈护航智能辅助筛查系统
                      <q-badge color="purple-3" text-color="purple-9" class="q-ml-xs" align="top"
                        >V1.0.0</q-badge
                      >
                    </div>
                  </div>
                </div>
                <div
                  class="row q-mt-xs text-caption text-purple-8 q-pl-lg relative-position"
                  style="z-index: 1"
                >
                  <div class="col-12 row items-center" style="line-height: 1.5">
                    <span class="q-mr-sm text-weight-bold opacity-70">登记号</span>
                    <span class="text-weight-medium">2026SR0207339</span>
                  </div>
                  <div class="col-12 row items-center" style="line-height: 1.5">
                    <span class="q-mr-sm text-weight-bold opacity-70">证书号</span>
                    <span class="text-weight-medium">软著登字第17421620号</span>
                  </div>
                </div>
                <!-- 装饰背景 -->
                <q-icon
                  name="copyright"
                  class="absolute-bottom-right text-purple-2"
                  size="48px"
                  style="bottom: -12px; right: -8px; transform: rotate(-15deg)"
                />
              </div>
            </div>

            <q-separator spaced />

            <q-list dense>
              <q-item class="q-px-none">
                <q-item-section avatar style="min-width: 32px">
                  <q-icon color="positive" name="check_circle" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2 text-grey-8">
                    NMPA三类医疗器械认证
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item class="q-px-none">
                <q-item-section avatar style="min-width: 32px">
                  <q-icon color="positive" name="check_circle" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2 text-grey-8">
                    ISO 13485医疗器械质量管理体系
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item class="q-px-none">
                <q-item-section avatar style="min-width: 32px">
                  <q-icon color="positive" name="check_circle" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption class="text-body2 text-grey-8">
                    国家重点研发计划项目支持
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 套餐包选择弹窗 -->
    <q-dialog v-model="showPackageDialog">
      <q-card style="min-width: 500px; max-width: 600px">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">
            <q-icon name="redeem" class="q-mr-sm" />
            选择套餐包
          </div>
          <div class="text-caption">更多次数，更多优惠</div>
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div v-for="pkg in packageOptions" :key="pkg.type" class="col-12">
              <q-card
                flat
                bordered
                class="cursor-pointer package-card"
                @click="handlePackagePurchase(pkg.type, pkg.amount)"
              >
                <q-card-section class="row items-center q-pa-md">
                  <div class="col">
                    <div class="text-h6 text-weight-medium">{{ pkg.name }}</div>
                    <div class="text-caption text-grey-7 q-mt-xs">{{ pkg.credits }}</div>
                    <!-- 优惠信息 -->
                    <div v-if="pkg.discount" class="package-discount-tag q-mt-xs">
                      {{ pkg.discountText }}
                    </div>
                  </div>
                  <div class="col-auto text-right">
                    <div
                      v-if="pkg.originalAmount"
                      class="original-price text-caption text-grey-6 text-strike"
                    >
                      ¥{{ pkg.originalAmount }}
                    </div>
                    <div class="text-h5 text-primary text-weight-bold">¥{{ pkg.amount }}</div>
                    <div class="text-caption text-positive text-weight-medium">
                      ¥{{ pkg.pricePerUnit }}/次
                    </div>
                    <div
                      v-if="pkg.saveAmount"
                      class="text-caption text-orange text-weight-medium q-mt-xs"
                    >
                      节省¥{{ pkg.saveAmount }}
                    </div>
                  </div>
                  <div class="col-auto q-ml-md">
                    <q-icon name="arrow_forward_ios" color="grey-5" size="sm" />
                  </div>
                </q-card-section>
                <q-badge
                  v-if="pkg.recommended"
                  color="orange"
                  floating
                  style="top: 8px; right: 8px"
                >
                  <q-icon name="star" size="xs" class="q-mr-xs" />
                  推荐
                </q-badge>
              </q-card>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 订阅支付弹窗 -->
    <q-dialog v-model="showPaymentDialog" persistent>
      <q-card style="width: 100%; max-width: 650px">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">
            <q-icon name="shopping_cart" class="q-mr-sm" />
            确认订阅
          </div>
          <div class="text-caption">安全、便捷的支付流程</div>
        </q-card-section>

        <!-- 步骤指示器 -->
        <q-stepper v-model="paymentStep" ref="stepper" flat>
          <!-- 步骤1: 订单确认 -->
          <q-step :name="1" title="订单确认" icon="receipt" :done="paymentStep > 1">
            <div class="q-pa-md">
              <div class="text-h6 q-mb-md">订单详情</div>
              <q-list bordered separator class="rounded-borders">
                <q-item>
                  <q-item-section avatar>
                    <q-icon name="workspace_premium" color="primary" size="md" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{
                      paymentInfo.planName
                    }}</q-item-label>
                    <q-item-label caption>{{ paymentInfo.credits }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label class="text-h6 text-primary text-weight-bold">
                      ¥{{ paymentInfo.amount }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <div class="payment-summary q-mt-lg">
                <div class="summary-row">
                  <span class="text-grey-7">订阅费用</span>
                  <span class="text-weight-medium"
                    >¥{{ paymentInfo.originalAmount || paymentInfo.amount }}</span
                  >
                </div>
                <div
                  v-if="paymentInfo.discount && paymentInfo.discount > 0"
                  class="summary-row discount-row"
                >
                  <span class="text-grey-7">
                    <q-icon name="local_offer" size="xs" class="q-mr-xs" />
                    {{ paymentInfo.discountReason }}
                  </span>
                  <span class="text-positive text-weight-medium">-¥{{ paymentInfo.discount }}</span>
                </div>
                <q-separator spaced />
                <div class="summary-row total">
                  <span class="text-h6">应付总额</span>
                  <span class="text-h5 text-primary text-weight-bold"
                    >¥{{ paymentInfo.amount }}</span
                  >
                </div>
                <div
                  v-if="paymentInfo.discount && paymentInfo.discount > 0"
                  class="text-center q-mt-sm"
                >
                  <q-chip dense color="orange" text-color="white" icon="celebration" size="sm">
                    已为您节省 ¥{{ paymentInfo.discount }}
                  </q-chip>
                </div>
              </div>

              <!-- 协议确认复选框 -->
              <div class="agreement-section q-mt-lg">
                <q-checkbox v-model="agreePaymentTerms" dense>
                  <span class="text-body2 text-grey-8">
                    我已阅读并同意
                    <span
                      class="agreement-link"
                      @click.stop.prevent="showPaymentAgreement('agreement')"
                    >
                      《用户协议》
                    </span>
                    和
                    <span
                      class="agreement-link"
                      @click.stop.prevent="showPaymentAgreement('privacy')"
                    >
                      《隐私政策》
                    </span>
                  </span>
                </q-checkbox>
                <div v-if="!agreePaymentTerms" class="text-caption text-orange q-mt-xs q-ml-md">
                  请先同意用户协议和隐私政策后继续
                </div>
              </div>
            </div>
          </q-step>

          <!-- 步骤2: 支付方式 -->
          <q-step :name="2" title="选择支付方式" icon="payment" :done="paymentStep > 2">
            <div class="q-pa-md">
              <div class="text-h6 q-mb-md">支付方式</div>
              <div class="row q-col-gutter-md">
                <div v-for="method in paymentMethods" :key="method.value" class="col-12">
                  <q-card
                    flat
                    bordered
                    class="cursor-pointer"
                    :class="{ 'bg-blue-1': selectedPaymentMethod === method.value }"
                    @click="selectedPaymentMethod = method.value"
                  >
                    <q-card-section class="row items-center q-pa-md">
                      <q-icon
                        :name="method.icon"
                        :color="method.color"
                        size="32px"
                        class="q-mr-md"
                      />
                      <div class="col">
                        <div class="text-body1 text-weight-medium">{{ method.label }}</div>
                        <div class="text-caption text-grey-6">{{ method.description }}</div>
                      </div>
                      <q-radio
                        v-model="selectedPaymentMethod"
                        :val="method.value"
                        color="primary"
                      />
                    </q-card-section>
                  </q-card>
                </div>
              </div>

              <!-- 安全信息 -->
              <div class="row q-col-gutter-sm q-mt-md">
                <div class="col-auto">
                  <q-chip dense color="positive" text-color="white" icon="verified_user">
                    安全加密
                  </q-chip>
                </div>
                <div class="col-auto">
                  <q-chip dense color="positive" text-color="white" icon="lock"> SSL证书 </q-chip>
                </div>
                <div class="col-auto">
                  <q-chip dense color="positive" text-color="white" icon="shield">
                    隐私保护
                  </q-chip>
                </div>
                <div class="col-auto">
                  <q-chip dense color="positive" text-color="white" icon="support_agent">
                    7x24客服
                  </q-chip>
                </div>
              </div>
            </div>
          </q-step>

          <!-- 导航按钮 -->
          <template v-slot:navigation>
            <q-stepper-navigation class="q-pa-md">
              <div class="row items-center">
                <q-btn
                  v-if="paymentStep > 1"
                  flat
                  color="grey-8"
                  label="上一步"
                  icon="arrow_back"
                  @click="stepper.previous()"
                  no-caps
                />
                <q-space />
                <q-btn
                  flat
                  color="grey-8"
                  label="取消订单"
                  @click="cancelPayment"
                  no-caps
                  class="q-mr-sm"
                />
                <q-btn
                  v-if="paymentStep < 2"
                  unelevated
                  label="下一步：选择支付方式"
                  color="primary"
                  icon-right="arrow_forward"
                  @click="stepper.next()"
                  no-caps
                  size="md"
                  :disabled="!agreePaymentTerms"
                />
                <q-btn
                  v-else
                  unelevated
                  label="确认支付"
                  color="positive"
                  icon="payment"
                  @click="processPayment"
                  :loading="paymentProcessing"
                  no-caps
                  size="md"
                  class="payment-confirm-btn"
                >
                  <template v-slot:loading>
                    <q-spinner-dots color="white" />
                  </template>
                </q-btn>
              </div>
            </q-stepper-navigation>
          </template>
        </q-stepper>
      </q-card>
    </q-dialog>

    <!-- 升级弹窗 -->
    <q-dialog v-model="showUpgradeDialog">
      <q-card style="min-width: 400px">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">升级订阅</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body1 q-mb-md">
            试用期即将结束，升级到正式订阅以继续享受AI辅助筛查服务。
          </div>
          <q-list bordered separator>
            <q-item clickable v-ripple @click="handleUpgrade('monthly')">
              <q-item-section>
                <q-item-label>月度订阅</q-item-label>
                <q-item-label caption>¥299/月 · 20次AI分析</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable v-ripple @click="handleUpgrade('yearly')">
              <q-item-section>
                <q-item-label>年度订阅 (推荐)</q-item-label>
                <q-item-label caption>¥2,999/年 · 立省590元</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="稍后再说" color="grey" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 协议弹窗 -->
    <AgreementDialog
      v-model="showPaymentAgreementDialog"
      :initial-tab="paymentAgreementTab"
      :show-agree-button="true"
      @agree="agreePaymentTerms = true"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar, date } from 'quasar';
import { paymentAPI, userAPI } from 'src/services/api';
import AgreementDialog from 'src/components/common/AgreementDialog.vue';
import { getItem, setItem, STORAGE_KEYS } from 'src/utils/storage';

const $q = useQuasar();

// 选中的订阅计划
const selectedPlan = ref<'pay-per-use' | 'monthly' | 'yearly' | null>(null);

// 订阅计划功能列表
const payPerUseFeatures = [
  { icon: 'check_circle', color: 'positive', text: '单次AI分析', enabled: true },
  { icon: 'check_circle', color: 'positive', text: '完整分析报告', enabled: true },
  { icon: 'check_circle', color: 'positive', text: '7天报告保存', enabled: true },
  { icon: 'cancel', color: 'grey-4', text: '优先处理', enabled: false },
];

const monthlyFeatures = [
  { icon: 'check_circle', color: 'positive', text: '20次/月 AI分析' },
  { icon: 'check_circle', color: 'positive', text: '完整分析报告' },
  { icon: 'check_circle', color: 'positive', text: '永久报告保存' },
  { icon: 'check_circle', color: 'positive', text: '优先处理' },
  { icon: 'check_circle', color: 'positive', text: '智能提醒服务' },
];

const yearlyFeatures = [
  { icon: 'check_circle', color: 'positive', text: '300次/年 AI分析' },
  { icon: 'check_circle', color: 'positive', text: '完整分析报告' },
  { icon: 'check_circle', color: 'positive', text: '永久报告保存' },
  { icon: 'check_circle', color: 'positive', text: 'VIP优先处理' },
  { icon: 'check_circle', color: 'positive', text: '专属客服支持' },
  { icon: 'check_circle', color: 'positive', text: '数据统计分析' },
];

// 套餐包选项
const packageOptions = [
  {
    type: 'test',
    name: '测试套餐',
    credits: '1次AI分析',
    originalAmount: 0.01,
    amount: 0.01,
    discount: 0,
    discountText: '',
    saveAmount: 0,
    pricePerUnit: '0.01',
    recommended: false,
  },
  {
    type: 'package-10',
    name: '10次套餐包',
    credits: '10次AI分析',
    originalAmount: 190,
    amount: 158,
    discount: 10,
    discountText: '首次立减10元',
    saveAmount: 32,
    pricePerUnit: '15.8',
    recommended: false,
  },
  {
    type: 'package-30',
    name: '30次套餐包',
    credits: '30次AI分析',
    originalAmount: 570,
    amount: 438,
    discount: 30,
    discountText: '阶梯优惠30元',
    saveAmount: 132,
    pricePerUnit: '14.6',
    recommended: false,
  },
  {
    type: 'package-50',
    name: '50次套餐包',
    credits: '50次AI分析',
    originalAmount: 950,
    amount: 649,
    discount: 50,
    discountText: '超值立减50元',
    saveAmount: 301,
    pricePerUnit: '13.0',
    recommended: true,
  },
];

// API配置数据 (AI引擎配置)
const apiConfig = ref({
  model: 'qwen-vl-max',
  confidence: 0.85,
  sensitivity: 0.9,
});

// 模型选项
const modelOptions = [
  {
    label: 'CervixDetect Pro (推荐)',
    value: 'qwen-vl-max',
    description: '最高精度，适用于复杂病例',
  },
  { label: 'CervixDetect Standard', value: 'qwen-vl-plus', description: '平衡性能与速度' },
  { label: 'CervixDetect Lite', value: 'qwen-vl-v1', description: '快速筛查模式' },
];

// 用户偏好设置
const preferences = ref({
  notifications: {
    enable: true,
    channels: ['in_app', 'email', 'browser'] as string[],
    types: ['analysis', 'alert', 'security'] as string[],
    dndMode: false,
  },
  analysis: {
    autoStart: true,
    aiSecondOpinion: false,
    roiStyle: 'box',
    heatmapColor: 'jet',
  },
  reports: {
    autoSave: true,
    defaultFormat: { label: 'PDF 专业版', value: 'pdf_pro' },
    imageQuality: { label: '高质量 (High)', value: 'high' },
    watermark: false,
    watermarkText: '',
  },
  privacy: {
    desensitization: true,
    mfa: false,
  },
  billing: {
    autoRenewal: false,
    lowBalanceAlert: true,
    threshold: 50,
  },
});

// 订阅状态信息
interface SubscriptionStatus {
  type: 'trial' | 'active' | 'expired';
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  badge: string;
  badgeColor: string;
  planName: string;
  expireDate: string;
  remainingCount: number;
}

const subscriptionStatus = ref<SubscriptionStatus>({
  type: 'trial',
  title: '试用期激活中',
  subtitle: '体验完整AI辅助筛查功能',
  icon: 'verified_user',
  color: 'positive',
  badge: '剩余 7 天',
  badgeColor: 'positive',
  planName: '试用版',
  expireDate: '2026-01-13',
  remainingCount: 10,
});

// 支付相关
const showPaymentDialog = ref(false);
const showPackageDialog = ref(false);
const showUpgradeDialog = ref(false);
const paymentProcessing = ref(false);
// 支付流程步骤控制
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stepper = ref<any>(null);
const paymentStep = ref(1); // 支付流程步骤
const selectedPaymentMethod = ref('alipay'); // 选中的支付方式

// 支付协议相关状态
const agreePaymentTerms = ref(false);
const showPaymentAgreementDialog = ref(false);
const paymentAgreementTab = ref<'agreement' | 'privacy'>('agreement');

/**
 * 显示支付协议弹窗
 * @param tab 要显示的协议类型
 */
const showPaymentAgreement = (tab: 'agreement' | 'privacy') => {
  paymentAgreementTab.value = tab;
  showPaymentAgreementDialog.value = true;
};

// 支付方式选项
const paymentMethods = [
  {
    value: 'alipay',
    label: '支付宝',
    description: '快捷安全的移动支付',
    icon: 'account_balance_wallet',
    color: 'blue',
  },
  {
    value: 'wxpay',
    label: '微信支付',
    description: '十亿用户的选择',
    icon: 'chat',
    color: 'green',
  },
  {
    value: 'bank',
    label: '银行卡支付',
    description: '支持各大银行储蓄卡/信用卡',
    icon: 'credit_card',
    color: 'orange',
  },
];

interface PaymentInfo {
  planType: string;
  planName: string;
  amount: number;
  credits: string;
  originalAmount?: number; // 原价
  discount?: number; // 优惠金额
  discountReason?: string; // 优惠原因
}

const paymentInfo = ref<PaymentInfo>({
  planType: '',
  planName: '',
  amount: 0,
  credits: '',
  originalAmount: 0,
  discount: 0,
  discountReason: '',
});

// 计算优惠金额
const calculateDiscount = (
  planType: string,
  originalAmount: number,
): { discount: number; reason: string } => {
  // 月度订阅优惠策略
  if (planType === 'monthly') {
    if (originalAmount >= 299) {
      return { discount: 29, reason: '首月立减29元' };
    }
  }

  // 年度订阅优惠策略
  if (planType === 'yearly') {
    if (originalAmount >= 2999) {
      return { discount: 299, reason: '年度会员特惠299元' };
    }
  }

  // 套餐包阶梯优惠
  if (planType.startsWith('package-')) {
    if (originalAmount >= 699) {
      return { discount: 50, reason: '套餐优惠立减50元' };
    } else if (originalAmount >= 468) {
      return { discount: 30, reason: '套餐优惠立减30元' };
    } else if (originalAmount >= 168) {
      return { discount: 10, reason: '首次购买立减10元' };
    }
  }

  return { discount: 0, reason: '' };
};

// 处理订阅
const handleSubscribe = (planType: 'monthly' | 'yearly') => {
  const plans = {
    monthly: {
      planName: '月度订阅',
      originalAmount: 299,
      credits: '20次AI分析/月',
    },
    yearly: {
      planName: '年度订阅',
      originalAmount: 2999,
      credits: '300次AI分析/年',
    },
  };

  const plan = plans[planType];
  const { discount, reason } = calculateDiscount(planType, plan.originalAmount);

  paymentInfo.value = {
    planType,
    planName: plan.planName,
    originalAmount: plan.originalAmount,
    discount,
    discountReason: reason,
    amount: plan.originalAmount - discount,
    credits: plan.credits,
  };
  showPaymentDialog.value = true;
};

// 处理套餐包购买
const handlePackagePurchase = (packageType: string, originalAmount: number) => {
  const packages: Record<string, { planName: string; credits: string }> = {
    test: { planName: '测试套餐', credits: '1次AI分析' },
    'package-10': { planName: '10次套餐包', credits: '10次AI分析' },
    'package-30': { planName: '30次套餐包', credits: '30次AI分析' },
    'package-50': { planName: '50次套餐包', credits: '50次AI分析' },
  };

  const packageInfo = packages[packageType];
  if (!packageInfo) {
    $q.notify({
      type: 'negative',
      message: '无效的套餐包',
      position: 'top',
    });
    return;
  }

  const { discount, reason } = calculateDiscount(packageType, originalAmount);

  paymentInfo.value = {
    planType: packageType,
    planName: packageInfo.planName,
    originalAmount,
    discount,
    discountReason: reason,
    amount: originalAmount - discount,
    credits: packageInfo.credits,
  };
  showPackageDialog.value = false;
  showPaymentDialog.value = true;
};

// 处理升级
const handleUpgrade = (planType: 'monthly' | 'yearly') => {
  showUpgradeDialog.value = false;
  handleSubscribe(planType);
};

// 取消支付
const cancelPayment = () => {
  showPaymentDialog.value = false;
  paymentStep.value = 1;
  selectedPaymentMethod.value = 'alipay';
};

// 模拟支付流程
const processPayment = async () => {
  paymentProcessing.value = true;

  try {
    const { data } = await paymentAPI.createOrder(
      paymentInfo.value.planType,
      selectedPaymentMethod.value,
    );

    // 跳转到支付页面
    if (data.success && data.data && data.data.payUrl) {
      window.location.href = data.data.payUrl;
    } else {
      throw new Error(data.message || '获取支付链接失败');
    }
  } catch (error) {
    console.error('创建订单失败:', error);
    $q.notify({
      type: 'negative',
      message: '创建订单失败',
      caption: '请稍后重试或联系客服',
      position: 'top',
      icon: 'error',
    });
  } finally {
    paymentProcessing.value = false;
  }
};

// 保存AI配置
const saveAIConfig = () => {
  setItem(STORAGE_KEYS.AI_CONFIG, apiConfig.value);
  $q.notify({
    type: 'positive',
    message: 'AI引擎配置已保存',
    position: 'top',
    icon: 'check_circle',
  });
};

// 重置AI配置
const resetAIConfig = () => {
  apiConfig.value = {
    model: 'qwen-vl-max',
    confidence: 0.85,
    sensitivity: 0.9,
  };
  $q.notify({
    type: 'info',
    message: '已恢复默认配置',
    position: 'top',
  });
};

// 保存用户偏好
const savePreferences = () => {
  setItem(STORAGE_KEYS.USER_PREFERENCES, preferences.value);
  $q.notify({
    type: 'positive',
    message: '偏好设置已保存',
    position: 'top',
    icon: 'check_circle',
  });
};

// 重置用户偏好为默认值
const resetPreferences = () => {
  preferences.value = {
    notifications: {
      enable: true,
      channels: ['in_app', 'email', 'browser'],
      types: ['analysis', 'alert', 'security'],
      dndMode: false,
    },
    analysis: {
      autoStart: true,
      aiSecondOpinion: false,
      roiStyle: 'box',
      heatmapColor: 'jet',
    },
    reports: {
      autoSave: true,
      defaultFormat: { label: 'PDF 专业版', value: 'pdf_pro' },
      imageQuality: { label: '高质量 (High)', value: 'high' },
      watermark: false,
      watermarkText: '',
    },
    privacy: {
      desensitization: true,
      mfa: false,
    },
    billing: {
      autoRenewal: false,
      lowBalanceAlert: true,
      threshold: 50,
    },
  };
  $q.notify({
    type: 'info',
    message: '已恢复默认偏好设置',
    position: 'top',
  });
};

// 加载保存的配置
const loadSavedConfig = () => {
  const savedAIConfig = getItem<typeof apiConfig.value>(STORAGE_KEYS.AI_CONFIG);
  if (savedAIConfig && typeof savedAIConfig === 'object') {
    apiConfig.value = { ...apiConfig.value, ...savedAIConfig };
  }

  const savedPreferences = getItem<typeof preferences.value>(STORAGE_KEYS.USER_PREFERENCES);
  if (savedPreferences && typeof savedPreferences === 'object') {
    preferences.value = { ...preferences.value, ...savedPreferences };
  }
};

// 从后端获取真实的用户权益数据
const loadUserSubscription = async () => {
  try {
    const response = await userAPI.getProfile();
    const user = response.data.user;

    // 根据后端返回的数据更新订阅状态
    const now = new Date();
    const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    const isExpired = !expiresAt || expiresAt < now;
    const remainingCredits = user.remaining_credits || 0;

    if (user.subscription_type && user.subscription_type !== 'none' && !isExpired) {
      // 有效订阅
      const planNames: Record<string, string> = {
        monthly: '月度订阅',
        yearly: '年度订阅',
        package: '套餐包',
      };
      subscriptionStatus.value = {
        type: 'active',
        title: `${planNames[user.subscription_type] || '订阅'}已激活`,
        subtitle: '享受完整AI辅助筛查服务',
        icon: user.subscription_type === 'yearly' ? 'workspace_premium' : 'check_circle',
        color: user.subscription_type === 'yearly' ? 'amber' : 'positive',
        badge: `有效期至 ${date.formatDate(expiresAt, 'YYYY-MM-DD')}`,
        badgeColor: user.subscription_type === 'yearly' ? 'amber' : 'primary',
        planName: planNames[user.subscription_type] || '订阅会员',
        expireDate: date.formatDate(expiresAt, 'YYYY-MM-DD'),
        remainingCount: remainingCredits,
      };
    } else if (remainingCredits > 0) {
      // 有剩余点数但无订阅
      subscriptionStatus.value = {
        type: 'active',
        title: '套餐包用户',
        subtitle: '按次使用AI分析服务',
        icon: 'payments',
        color: 'primary',
        badge: `剩余 ${remainingCredits} 次`,
        badgeColor: 'primary',
        planName: '按次付费',
        expireDate: '永久有效',
        remainingCount: remainingCredits,
      };
    } else {
      // 无订阅无点数
      subscriptionStatus.value = {
        type: 'trial',
        title: '未订阅',
        subtitle: '开始体验AI辅助筛查服务',
        icon: 'info',
        color: 'grey',
        badge: '暂无权益',
        badgeColor: 'grey',
        planName: '未订阅',
        expireDate: '-',
        remainingCount: 0,
      };
    }
  } catch (e) {
    console.error('获取用户权益失败:', e);
  }
};

// 页面加载时读取配置
onMounted(() => {
  loadSavedConfig();
  void loadUserSubscription();
});
</script>

<style scoped>
/* 订阅卡片样式 */
.subscription-card {
  transition: all 0.3s ease;
}

.subscription-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* 价格容器样式 */
.price-container {
  position: relative;
}

.original-price {
  text-decoration: line-through;
  opacity: 0.7;
}

.current-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

/* 优惠标签样式 */
.discount-tag {
  display: inline-block;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(255, 107, 107, 0.3);
  position: relative;
  overflow: hidden;
}

.discount-tag::before {
  content: '🎫';
  margin-right: 4px;
}

.discount-tag::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

/* 套餐包优惠标签 */
.package-discount-tag {
  display: inline-block;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(255, 107, 107, 0.25);
}

.package-discount-tag::before {
  content: '🎫';
  margin-right: 3px;
}

/* 套餐包卡片样式 */
.package-card {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.package-card:hover {
  border-color: #1976d2;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15);
  transform: translateX(4px);
}

.package-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #1976d2 0%, #42a5f5 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.package-card:hover::before {
  opacity: 1;
}

/* 支付摘要样式 */
.payment-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.summary-row.discount-row {
  color: #21ba45;
  background: linear-gradient(90deg, rgba(33, 186, 69, 0.05) 0%, transparent 100%);
  padding: 8px 12px;
  border-radius: 6px;
  margin: 4px 0;
}

.summary-row.total {
  border-top: 1px solid #e0e0e0;
  margin-top: 8px;
  padding-top: 12px;
  font-weight: bold;
}

/* 支付按钮特殊样式 */
.payment-confirm-btn {
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
  transition: all 0.3s ease;
}

.payment-confirm-btn:hover {
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
  transform: translateY(-1px);
}

/* 协议复选框样式 */
.agreement-section {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.agreement-link {
  color: #1976d2;
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
}

.agreement-link:hover {
  text-decoration: underline;
}
</style>

<style lang="scss">
body.body--dark {
  // 支付摘要区域暗色适配
  .payment-summary {
    background: var(--app-elevated-bg) !important;
  }

  .summary-row.total {
    border-top-color: var(--app-border-default) !important;
  }

  .summary-row.discount-row {
    background: linear-gradient(90deg, rgba(33, 186, 69, 0.15) 0%, transparent 100%) !important;
  }

  // 协议和支付相关暗色适配
  .agreement-section {
    background: var(--app-elevated-bg) !important;
  }

  .agreement-link {
    color: var(--q-primary) !important;
  }

  // 套餐包卡片 hover
  .package-card:hover {
    border-color: var(--q-primary) !important;
    box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3) !important;
  }
}
</style>
