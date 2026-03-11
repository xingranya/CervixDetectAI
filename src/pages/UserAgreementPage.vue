<template>
  <q-page class="agreement-page bg-grey-1">
    <!-- 页面头部 -->
    <div class="agreement-header bg-primary text-white q-pa-lg">
      <div class="container">
        <div class="row items-center">
          <div class="col-auto">
            <q-btn flat round icon="arrow_back" color="white" @click="goBack" />
          </div>
          <div class="col">
            <div class="text-h5 text-weight-medium">用户服务协议</div>
            <div class="text-caption text-white-7">CervixDetect AI 宫颈癌AI辅助筛查系统</div>
          </div>
          <div class="col-auto">
            <q-chip color="white" text-color="primary" dense>
              <q-icon name="update" size="xs" class="q-mr-xs" />
              更新于 2026年3月11日
            </q-chip>
          </div>
        </div>
      </div>
    </div>

    <!-- 协议内容 -->
    <div class="container q-py-lg">
      <q-card flat bordered class="agreement-content">
        <q-card-section>
          <!-- 协议导航 -->
          <div class="agreement-nav q-mb-lg">
            <div class="text-subtitle2 text-grey-7 q-mb-sm">快速导航</div>
            <div class="row q-gutter-sm">
              <q-chip
                v-for="section in sections"
                :key="section.id"
                clickable
                outline
                color="primary"
                size="sm"
                @click="scrollToSection(section.id)"
              >
                {{ section.title }}
              </q-chip>
            </div>
          </div>

          <q-separator class="q-mb-lg" />

          <!-- 协议正文 -->
          <div class="agreement-body text-body1">
            <!-- 引言 -->
            <div class="agreement-intro q-mb-xl">
              <p class="text-grey-8">
                欢迎使用 CervixDetect AI 宫颈癌AI辅助筛查系统（以下简称"本系统"或"本服务"）。
                本协议是您（以下简称"用户"）与云端智诊团队（以下简称"我们"或"服务提供方"）之间关于使用本系统服务的法律协议。
              </p>
              <q-banner class="bg-blue-1 text-primary q-mt-md" rounded>
                <template v-slot:avatar>
                  <q-icon name="info" color="primary" />
                </template>
                <span class="text-body2">
                  请您在使用本服务前仔细阅读并充分理解本协议的全部内容。
                  如您不同意本协议的任何条款，请勿注册或使用本服务。
                  您的注册、登录、使用等行为将视为对本协议的接受。
                </span>
              </q-banner>
            </div>

            <section id="section-1" class="agreement-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">一</span>
                服务概述
              </h3>
              <div class="section-content">
                <p><strong>1.1 服务性质</strong></p>
                <p>
                  CervixDetect AI 是一款基于人工智能技术的宫颈癌筛查辅助诊断系统，
                  通过对宫颈细胞学图像进行智能分析，为医疗专业人员提供辅助诊断参考意见。
                </p>

                <p><strong>1.2 服务范围</strong></p>
                <ul>
                  <li>宫颈细胞学图像的AI分析与识别</li>
                  <li>病变区域的自动标注与分类</li>
                  <li>诊断置信度评估与风险分级</li>
                  <li>结构化分析报告的生成与导出</li>
                  <li>病例数据的安全存储与管理</li>
                </ul>

                <p><strong>1.3 服务模式</strong></p>
                <p>
                  本系统采用"互联网+医疗"的SaaS云服务模式，用户可通过网页端访问和使用服务，
                  无需安装额外软件。我们提供“基础套餐 / 顶级套餐”两级方案，订阅页支持套餐选择、支付交互与状态联动展示。
                </p>

                <q-banner class="bg-orange-1 text-orange-9 q-mt-md" rounded>
                  <template v-slot:avatar>
                    <q-icon name="warning" color="orange" />
                  </template>
                  <span class="text-body2">
                    <strong>重要声明：</strong>
                    本系统仅作为医疗辅助工具，其分析结果仅供参考，不构成临床诊断。
                    最终诊断必须由具有执业资格的医疗专业人员做出。
                  </span>
                </q-banner>
              </div>
            </section>

            <section id="section-2" class="agreement-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">二</span>
                账户管理
              </h3>
              <div class="section-content">
                <p><strong>2.1 账户注册</strong></p>
                <ul>
                  <li>用户应提供真实、准确、完整的注册信息</li>
                  <li>支持通过电子邮箱或手机号码进行注册</li>
                  <li>每个用户仅可注册一个账户，禁止重复注册</li>
                  <li>注册信息发生变更时，应及时更新</li>
                </ul>

                <p><strong>2.2 账户安全</strong></p>
                <ul>
                  <li>用户应妥善保管账户密码，不得将账户转让、出借给他人使用</li>
                  <li>因用户保管不善导致账户被盗用的，责任由用户自行承担</li>
                  <li>发现账户异常应立即联系我们进行处理</li>
                  <li>我们采用JWT双Token认证机制保障账户安全</li>
                </ul>

                <p><strong>2.3 账户冻结与注销</strong></p>
                <ul>
                  <li>用户违反本协议的，我们有权冻结或注销其账户</li>
                  <li>用户可申请自主注销账户，注销后数据将按规定处理</li>
                  <li>账户注销不影响已发生费用的结算</li>
                </ul>
              </div>
            </section>

            <section id="section-3" class="agreement-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">三</span>
                订阅与付费
              </h3>
              <div class="section-content">
                <p><strong>3.1 服务计划</strong></p>
                <q-markup-table flat bordered class="q-my-md">
                  <thead>
                    <tr>
                      <th class="text-left">套餐层级</th>
                      <th class="text-left">套餐档位（示例）</th>
                      <th class="text-left">主要权益</th>
                      <th class="text-left">说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>基础套餐</td>
                      <td>按天数：连续包月 / 一月 / 半年 / 一年；按次数：试用一次 / 单次版</td>
                      <td>
                        三种检测方式（巴氏染色涂片、液基细胞学、宫颈活检切片）、AI 医疗助手、完整 PDF 报告
                      </td>
                      <td>用于说明订阅闭环与状态联动，不影响真实账号权益</td>
                    </tr>
                    <tr>
                      <td>顶级套餐</td>
                      <td>按天数：连续包月 / 一月 / 半年 / 一年</td>
                      <td>
                        随访管理、五种检测方式（基础三种 + HPV 分型检测图像 + p16/Ki67 双染图像）、
                        给患者使用的小程序（即将开放 / 可定制接入）、多格式完整报告、自定义水印
                      </td>
                      <td>连续包月展示“自动扣费提示”（仅文案展示）</td>
                    </tr>
                  </tbody>
                </q-markup-table>

                <p class="text-grey-7">
                  订阅页展示的价格、档位与权益信息用于页面说明，不构成对外要约。正式计费与权益发放规则以届时签约、支付页面或补充协议说明为准。
                </p>

                <p><strong>3.2 支付方式说明</strong></p>
                <p>订阅页可能展示以下支付方式选项（页面交互用途）：</p>
                <ul>
                  <li>支付宝</li>
                  <li>微信支付</li>
                  <li>银行卡（Visa、Mastercard等）</li>
                </ul>
                <p class="text-grey-7">
                  订阅页内的“支付流程”为页面内状态同步流程，用于说明交互与状态联动效果，不代表已发生真实交易或扣费。
                </p>

                <p><strong>3.3 自动续费说明</strong></p>
                <ul>
                  <li>连续包月档位会在页面中展示“自动扣费提示”</li>
                  <li>当前页面不触发真实自动扣费与续费逻辑</li>
                  <li>如未来启用真实续费功能，将以届时签约、支付页面或补充协议说明为准</li>
                </ul>

                <p><strong>3.4 支付与退款说明</strong></p>
                <ul>
                  <li>订阅页内的支付流程为页面内状态同步流程，不产生真实交易记录</li>
                  <li>当前页面不提供真实退款、对账、开票等规则承诺</li>
                  <li>如未来启用真实支付与订阅，将在支付页面、合同或补充协议中另行说明对应规则</li>
                </ul>

                <p><strong>3.5 价格说明</strong></p>
                <p>
                  订阅页展示的价格与优惠信息可能随页面版本迭代而调整。若未来启用正式计费，相关价格与变更机制以届时签约、支付页面或补充协议说明为准。
                </p>
              </div>
            </section>

            <section id="section-4" class="agreement-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">四</span>
                医疗免责声明
              </h3>
              <div class="section-content">
                <q-banner class="bg-red-1 text-red-9 q-mb-md" rounded>
                  <template v-slot:avatar>
                    <q-icon name="medical_services" color="red" />
                  </template>
                  <span class="text-body2">
                    <strong>医疗责任声明</strong><br />
                    本系统为医疗辅助工具，所有分析结果仅供医疗专业人员参考，
                    不能替代临床诊断、病理诊断或其他医学检查。
                  </span>
                </q-banner>

                <p><strong>4.1 辅助诊断性质</strong></p>
                <ul>
                  <li>本系统基于深度学习算法对医学影像进行分析，属于计算机辅助诊断（CAD）范畴</li>
                  <li>AI分析结果的准确率虽经临床验证，但不能达到100%</li>
                  <li>分析结果应结合患者临床症状、病史及其他检查结果综合判断</li>
                </ul>

                <p><strong>4.2 使用限制</strong></p>
                <ul>
                  <li>本系统仅限具有相应执业资格的医疗专业人员使用</li>
                  <li>禁止将分析结果直接作为确诊依据告知患者</li>
                  <li>禁止将本系统用于法定医学鉴定或司法鉴定</li>
                </ul>

                <p><strong>4.3 免责范围</strong></p>
                <p>对于以下情况，我们不承担相关责任：</p>
                <ul>
                  <li>因用户误操作或上传不符合要求的图像导致的分析偏差</li>
                  <li>因临床医生对分析结果的误解或误用导致的医疗事故</li>
                  <li>因网络中断、系统故障等不可抗力导致的服务中断</li>
                  <li>因第三方原因导致的数据泄露或损失</li>
                </ul>

                <p><strong>4.4 责任上限</strong></p>
                <p>
                  在法律允许的最大范围内，我们对因使用本服务产生的任何直接、间接、
                  附带、特殊或惩罚性损害的赔偿责任，不超过用户实际支付的服务费用总额。
                </p>
              </div>
            </section>

            <section id="section-5" class="agreement-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">五</span>
                用户行为规范
              </h3>
              <div class="section-content">
                <p><strong>5.1 合法使用</strong></p>
                <ul>
                  <li>用户应遵守中华人民共和国相关法律法规及医疗行业规范</li>
                  <li>用户应确保获得患者知情同意后方可上传其医学影像</li>
                  <li>用户应对上传数据的合法性、真实性负责</li>
                </ul>

                <p><strong>5.2 禁止行为</strong></p>
                <p>用户不得进行以下行为：</p>
                <ul>
                  <li>上传虚假、伪造或与患者无关的医学影像</li>
                  <li>尝试破解、逆向工程或干扰系统正常运行</li>
                  <li>未经授权访问、复制或传播系统数据</li>
                  <li>利用系统从事非法活动或损害他人利益</li>
                  <li>规避或破坏系统的安全措施</li>
                </ul>

                <p><strong>5.3 违规处理</strong></p>
                <p>
                  对于违反上述规范的用户，我们有权采取警告、限制功能、冻结账户、
                  终止服务等措施，并保留追究法律责任的权利。
                </p>
              </div>
            </section>

            <section id="section-6" class="agreement-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">六</span>
                知识产权
              </h3>
              <div class="section-content">
                <p><strong>6.1 系统权利</strong></p>
                <p>
                  本系统的所有权利（包括但不限于软件著作权、专利权、商标权、商业秘密等）
                  均归云端智诊团队所有。未经书面授权，任何人不得复制、修改、传播或用于商业目的。
                </p>

                <p><strong>6.2 用户数据权利</strong></p>
                <ul>
                  <li>用户对其上传的原始医学影像拥有所有权</li>
                  <li>用户授权我们为提供服务而处理、分析其上传的数据</li>
                  <li>我们有权对脱敏后的数据进行统计分析，用于改进模型和服务</li>
                </ul>

                <p><strong>6.3 分析报告</strong></p>
                <p>
                  本系统生成的分析报告，用户可在授权范围内用于临床工作。
                  报告中的AI分析方法和算法描述属于我们的知识产权。
                </p>
              </div>
            </section>

            <section id="section-7" class="agreement-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">七</span>
                隐私保护
              </h3>
              <div class="section-content">
                <p>
                  我们高度重视用户隐私和数据安全。关于信息收集、使用、存储和保护的详细说明，
                  请参阅我们的
                  <router-link to="/privacy-policy" class="text-primary"> 《隐私政策》 </router-link
                  >。
                </p>
                <p>主要保护措施包括：</p>
                <ul>
                  <li>采用SSL/TLS加密传输所有数据</li>
                  <li>使用bcrypt算法加密存储用户密码</li>
                  <li>实施严格的访问控制和权限管理</li>
                  <li>定期进行安全审计和漏洞扫描</li>
                  <li>符合医疗数据保护相关法规要求</li>
                </ul>
              </div>
            </section>

            <section id="section-8" class="agreement-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">八</span>
                服务变更与终止
              </h3>
              <div class="section-content">
                <p><strong>8.1 服务变更</strong></p>
                <ul>
                  <li>我们有权根据业务发展调整服务内容和功能</li>
                  <li>重大变更将提前<strong>15日</strong>通过系统公告或邮件通知用户</li>
                  <li>用户如不接受变更，可选择停止使用服务</li>
                </ul>

                <p><strong>8.2 服务终止</strong></p>
                <p>以下情况下，我们可以终止对用户的服务：</p>
                <ul>
                  <li>用户严重违反本协议或相关法律法规</li>
                  <li>用户主动申请注销账户</li>
                  <li>因不可抗力导致服务无法继续提供</li>
                  <li>法律法规要求或政府机关指令</li>
                </ul>

                <p><strong>8.3 数据处理</strong></p>
                <p>
                  服务终止后，我们将根据法律法规要求和隐私政策处理用户数据。
                  用户可在终止前申请导出个人数据。
                </p>
              </div>
            </section>

            <section id="section-9" class="agreement-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">九</span>
                协议更新
              </h3>
              <div class="section-content">
                <p>
                  我们可能根据法律法规变化或业务发展需要更新本协议。
                  更新后的协议将在本页面发布，并通过以下方式通知用户：
                </p>
                <ul>
                  <li>系统内公告通知</li>
                  <li>注册邮箱或手机短信通知</li>
                  <li>登录时弹窗提示</li>
                </ul>
                <p>
                  用户继续使用本服务即视为接受更新后的协议。
                  如不同意更新内容，用户应停止使用本服务。
                </p>
              </div>
            </section>

            <section id="section-10" class="agreement-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">十</span>
                争议解决
              </h3>
              <div class="section-content">
                <p><strong>10.1 适用法律</strong></p>
                <p>
                  本协议的订立、执行、解释及争议解决均适用中华人民共和国法律（不含冲突法规范）。
                </p>

                <p><strong>10.2 争议处理</strong></p>
                <p>
                  因本协议产生的争议，双方应首先友好协商解决。
                  协商不成的，任何一方均可向服务提供方所在地有管辖权的人民法院提起诉讼。
                </p>

                <p><strong>10.3 可分割性</strong></p>
                <p>
                  如本协议任何条款被认定为无效或不可执行，
                  该条款应在最小必要范围内进行调整以使其有效， 其余条款继续有效。
                </p>
              </div>
            </section>

            <!-- 联系方式 -->
            <section id="section-contact" class="agreement-section">
              <h3 class="section-title">
                <span class="section-number">附</span>
                联系方式
              </h3>
              <div class="section-content">
                <p>如您对本协议有任何疑问或建议，请通过以下方式联系我们：</p>
                <q-card flat bordered class="q-pa-md q-mt-md">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6">
                      <div class="text-subtitle2 text-grey-7">服务提供方</div>
                      <div class="text-body1">云端智诊团队</div>
                    </div>
                    <div class="col-12 col-md-6">
                      <div class="text-subtitle2 text-grey-7">客服邮箱</div>
                      <div class="text-body1">
                        <a href="mailto:support@hpvsc.icu" class="text-primary">
                          support@hpvsc.icu
                        </a>
                      </div>
                    </div>
                    <div class="col-12 col-md-6">
                      <div class="text-subtitle2 text-grey-7">工作时间</div>
                      <div class="text-body1">周一至周五 9:00-18:00</div>
                    </div>
                    <div class="col-12 col-md-6">
                      <div class="text-subtitle2 text-grey-7">协议版本</div>
                      <div class="text-body1">v1.0.0（2026年3月11日）</div>
                    </div>
                  </div>
                </q-card>
              </div>
            </section>
          </div>
        </q-card-section>
      </q-card>

      <!-- 底部操作 -->
      <div class="text-center q-mt-lg">
        <q-btn
          unelevated
          color="primary"
          label="返回"
          icon="arrow_back"
          @click="goBack"
          class="q-px-xl"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

// 章节导航数据
const sections = [
  { id: 'section-1', title: '服务概述' },
  { id: 'section-2', title: '账户管理' },
  { id: 'section-3', title: '订阅付费' },
  { id: 'section-4', title: '医疗免责' },
  { id: 'section-5', title: '行为规范' },
  { id: 'section-6', title: '知识产权' },
  { id: 'section-7', title: '隐私保护' },
  { id: 'section-8', title: '服务变更' },
  { id: 'section-9', title: '协议更新' },
  { id: 'section-10', title: '争议解决' },
];

/**
 * 滚动到指定章节
 */
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

/**
 * 返回上一页或关闭标签页
 */
const goBack = () => {
  // 检查是否是从新标签页打开的（通过 window.open 打开的页面 opener 不为 null）
  if (window.opener) {
    // 新标签页打开的，直接关闭
    window.close();
  } else if (window.history.length > 2) {
    // 有足够的历史记录，可以返回
    router.back();
  } else {
    // 没有历史记录，跳转到登录页
    void router.push('/login');
  }
};
</script>

<style scoped>
.agreement-page {
  min-height: 100vh;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
}

.agreement-header {
  position: sticky;
  top: 0;
  z-index: 100;
}

.agreement-content {
  border-radius: 12px;
}

.agreement-nav {
  position: sticky;
  top: 80px;
  background: white;
  padding: 12px 0;
  z-index: 10;
}

.agreement-body {
  line-height: 1.8;
  color: #333;
}

.agreement-section {
  scroll-margin-top: 100px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1976d2;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e3f2fd;
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-number {
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
  color: white;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

.section-content {
  padding-left: 8px;
}

.section-content p {
  margin-bottom: 12px;
}

.section-content ul {
  margin: 12px 0;
  padding-left: 24px;
}

.section-content li {
  margin-bottom: 8px;
}

.section-content strong {
  color: #1976d2;
}

/* 响应式调整 */
@media (max-width: 599px) {
  .agreement-nav .q-chip {
    font-size: 11px;
  }

  .section-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
