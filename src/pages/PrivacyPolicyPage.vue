<template>
  <q-page class="privacy-page bg-grey-1">
    <!-- 页面头部 -->
    <div class="privacy-header bg-positive text-white q-pa-lg">
      <div class="container">
        <div class="row items-center">
          <div class="col-auto">
            <q-btn flat round icon="arrow_back" color="white" @click="goBack" />
          </div>
          <div class="col">
            <div class="text-h5 text-weight-medium">隐私政策</div>
            <div class="text-caption text-white-7">CervixDetect AI 宫颈癌AI辅助筛查系统</div>
          </div>
          <div class="col-auto">
            <q-chip color="white" text-color="positive" dense>
              <q-icon name="update" size="xs" class="q-mr-xs" />
              更新于 2026年3月11日
            </q-chip>
          </div>
        </div>
      </div>
    </div>

    <!-- 隐私政策内容 -->
    <div class="container q-py-lg">
      <q-card flat bordered class="privacy-content">
        <q-card-section>
          <!-- 政策导航 -->
          <div class="privacy-nav q-mb-lg">
            <div class="text-subtitle2 text-grey-7 q-mb-sm">快速导航</div>
            <div class="row q-gutter-sm">
              <q-chip
                v-for="section in sections"
                :key="section.id"
                clickable
                outline
                color="positive"
                size="sm"
                @click="scrollToSection(section.id)"
              >
                {{ section.title }}
              </q-chip>
            </div>
          </div>

          <q-separator class="q-mb-lg" />

          <!-- 政策正文 -->
          <div class="privacy-body text-body1">
            <!-- 引言 -->
            <div class="privacy-intro q-mb-xl">
              <p class="text-grey-8">
                云端智诊团队（以下简称"我们"）深知个人信息对您的重要性，
                并会尽全力保护您的个人信息安全可靠。我们致力于维持您对我们的信任，
                恪守以下原则，保护您的个人信息：权责一致原则、目的明确原则、
                选择同意原则、最少够用原则、确保安全原则、主体参与原则、公开透明原则等。
              </p>
              <q-banner class="bg-green-1 text-positive q-mt-md" rounded>
                <template v-slot:avatar>
                  <q-icon name="security" color="positive" />
                </template>
                <span class="text-body2">
                  本隐私政策适用于CervixDetect AI宫颈癌AI辅助筛查系统的所有服务。
                  在使用我们的服务前，请您务必仔细阅读并透彻理解本政策，
                  特别是以<strong>加粗/加粗下划线</strong>方式标识的条款。
                </span>
              </q-banner>
            </div>

            <!-- 第一部分：信息收集 -->
            <section id="section-1" class="privacy-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">一</span>
                我们如何收集您的信息
              </h3>
              <div class="section-content">
                <p>在您使用我们的服务过程中，我们会按照如下方式收集信息：</p>

                <p><strong>1.1 账户注册信息</strong></p>
                <p>当您注册账户时，我们会收集：</p>
                <q-list bordered separator class="rounded-borders q-my-md">
                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="email" color="primary" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>电子邮箱</q-item-label>
                      <q-item-label caption>用于账户登录、身份验证和重要通知</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge color="primary" label="必填" />
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="phone" color="primary" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>手机号码</q-item-label>
                      <q-item-label caption>用于短信验证登录和安全验证</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge color="grey" label="可选" />
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="lock" color="primary" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>登录密码</q-item-label>
                      <q-item-label caption
                        >使用bcrypt算法加密存储，我们无法获取原始密码</q-item-label
                      >
                    </q-item-section>
                    <q-item-section side>
                      <q-badge color="primary" label="必填" />
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="person" color="primary" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>真实姓名</q-item-label>
                      <q-item-label caption>用于个人资料展示</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge color="grey" label="可选" />
                    </q-item-section>
                  </q-item>
                </q-list>

                <p><strong>1.2 患者医疗信息</strong></p>
                <p>当您使用AI分析服务时，我们会收集：</p>
                <q-list bordered separator class="rounded-borders q-my-md">
                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="badge" color="orange" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>患者基本信息</q-item-label>
                      <q-item-label caption>姓名、性别、出生日期、联系方式、地址等</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="image" color="orange" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>宫颈医学影像</q-item-label>
                      <q-item-label caption>用于AI分析的宫颈细胞学图像</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section avatar>
                      <q-icon name="history_edu" color="orange" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>病史记录</q-item-label>
                      <q-item-label caption>既往病史、检查记录等辅助诊断信息</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>

                <q-banner class="bg-orange-1 text-orange-9 q-my-md" rounded>
                  <template v-slot:avatar>
                    <q-icon name="warning" color="orange" />
                  </template>
                  <span class="text-body2">
                    <strong>重要提示：</strong>
                    患者医疗信息属于敏感个人信息。您在上传前应确保已获得患者的明确知情同意，
                    并遵守《个人信息保护法》及相关医疗法规的要求。
                  </span>
                </q-banner>

                <p><strong>1.3 自动收集的信息</strong></p>
                <p>在您使用服务过程中，我们会自动收集：</p>
                <ul>
                  <li><strong>设备信息：</strong>设备型号、操作系统版本、浏览器类型</li>
                  <li><strong>网络信息：</strong>IP地址、网络类型、运营商信息</li>
                  <li><strong>使用日志：</strong>访问时间、操作记录、功能使用情况</li>
                  <li><strong>登录信息：</strong>最后登录时间、登录IP地址（用于安全防护）</li>
                </ul>
              </div>
            </section>

            <!-- 第二部分：信息使用 -->
            <section id="section-2" class="privacy-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">二</span>
                我们如何使用您的信息
              </h3>
              <div class="section-content">
                <p>我们收集的信息将用于以下目的：</p>

                <p><strong>2.1 提供核心服务</strong></p>
                <ul>
                  <li>处理您的账户注册、登录和身份验证</li>
                  <li>对上传的医学影像进行AI分析处理</li>
                  <li>生成并存储分析报告</li>
                  <li>记录或处理您的套餐选择与订阅页交互（如套餐档位、支付方式偏好）</li>
                </ul>

                <p><strong>2.2 服务优化与改进</strong></p>
                <ul>
                  <li>分析服务使用情况，优化用户体验</li>
                  <li>使用<strong>脱敏后的数据</strong>训练和改进AI模型</li>
                  <li>进行系统性能分析和故障诊断</li>
                </ul>

                <p><strong>2.3 安全保障</strong></p>
                <ul>
                  <li>验证用户身份，防止账户被盗用</li>
                  <li>检测并防范欺诈、滥用等安全风险</li>
                  <li>记录安全日志，支持安全审计</li>
                </ul>

                <p><strong>2.4 通知与沟通</strong></p>
                <ul>
                  <li>发送服务相关的重要通知（如权益到期提醒、系统维护）</li>
                  <li>回复您的咨询和反馈</li>
                  <li>发送产品更新和优惠信息（可随时取消订阅）</li>
                </ul>

                <q-banner class="bg-blue-1 text-primary q-my-md" rounded>
                  <template v-slot:avatar>
                    <q-icon name="info" color="primary" />
                  </template>
                  <span class="text-body2">
                    我们承诺：在使用您的信息改进AI模型前，会对数据进行严格的脱敏处理，
                    确保无法识别到具体个人或患者。
                  </span>
                </q-banner>
              </div>
            </section>

            <!-- 第三部分：信息存储 -->
            <section id="section-3" class="privacy-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">三</span>
                我们如何存储您的信息
              </h3>
              <div class="section-content">
                <p><strong>3.1 存储位置</strong></p>
                <p>
                  您的个人信息将存储于中华人民共和国境内的服务器。
                  如需跨境传输，我们会严格遵守法律法规，并另行获取您的授权同意。
                </p>

                <p><strong>3.2 存储期限</strong></p>
                <q-markup-table flat bordered class="q-my-md">
                  <thead>
                    <tr>
                      <th class="text-left">信息类型</th>
                      <th class="text-left">存储期限</th>
                      <th class="text-left">说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>账户信息</td>
                      <td>账户存续期间 + 3年</td>
                      <td>账户注销后保留3年以满足法规要求</td>
                    </tr>
                    <tr>
                      <td>医学影像（单次体验流程）</td>
                      <td>7天</td>
                      <td>分析完成后自动删除</td>
                    </tr>
                    <tr>
                      <td>医学影像（套餐开通流程）</td>
                      <td>权益期间</td>
                      <td>权益结束后保留90天</td>
                    </tr>
                    <tr>
                      <td>分析报告</td>
                      <td>与医学影像相同</td>
                      <td>可提前申请导出或删除</td>
                    </tr>
                    <tr>
                      <td>交易记录</td>
                      <td>5年</td>
                      <td>根据财务法规要求保存</td>
                    </tr>
                    <tr>
                      <td>安全日志</td>
                      <td>180天</td>
                      <td>用于安全审计和问题排查</td>
                    </tr>
                  </tbody>
                </q-markup-table>

                <p><strong>3.3 存储安全</strong></p>
                <ul>
                  <li>采用MySQL数据库存储，配置主从复制和定期备份</li>
                  <li>文件存储于独立的安全存储系统</li>
                  <li>所有存储均设置访问控制和加密保护</li>
                </ul>
              </div>
            </section>

            <!-- 第四部分：信息安全 -->
            <section id="section-4" class="privacy-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">四</span>
                我们如何保护您的信息
              </h3>
              <div class="section-content">
                <p>我们采用业界领先的技术和管理措施保护您的信息安全：</p>

                <div class="row q-col-gutter-md q-my-md">
                  <div class="col-12 col-md-6">
                    <q-card flat bordered class="security-card">
                      <q-card-section>
                        <div class="row items-center q-mb-sm">
                          <q-icon name="https" color="positive" size="md" class="q-mr-sm" />
                          <div class="text-subtitle1 text-weight-medium">传输加密</div>
                        </div>
                        <p class="text-body2 text-grey-7 q-mb-none">
                          全站启用HTTPS/TLS加密，确保数据传输过程中不被窃听或篡改
                        </p>
                      </q-card-section>
                    </q-card>
                  </div>
                  <div class="col-12 col-md-6">
                    <q-card flat bordered class="security-card">
                      <q-card-section>
                        <div class="row items-center q-mb-sm">
                          <q-icon
                            name="enhanced_encryption"
                            color="positive"
                            size="md"
                            class="q-mr-sm"
                          />
                          <div class="text-subtitle1 text-weight-medium">密码加密</div>
                        </div>
                        <p class="text-body2 text-grey-7 q-mb-none">
                          使用bcrypt算法对密码进行不可逆加密，即使数据库泄露也无法还原
                        </p>
                      </q-card-section>
                    </q-card>
                  </div>
                  <div class="col-12 col-md-6">
                    <q-card flat bordered class="security-card">
                      <q-card-section>
                        <div class="row items-center q-mb-sm">
                          <q-icon name="token" color="positive" size="md" class="q-mr-sm" />
                          <div class="text-subtitle1 text-weight-medium">JWT认证</div>
                        </div>
                        <p class="text-body2 text-grey-7 q-mb-none">
                          采用双Token机制，accessToken有效期1小时，确保会话安全
                        </p>
                      </q-card-section>
                    </q-card>
                  </div>
                  <div class="col-12 col-md-6">
                    <q-card flat bordered class="security-card">
                      <q-card-section>
                        <div class="row items-center q-mb-sm">
                          <q-icon
                            name="admin_panel_settings"
                            color="positive"
                            size="md"
                            class="q-mr-sm"
                          />
                          <div class="text-subtitle1 text-weight-medium">权限控制</div>
                        </div>
                        <p class="text-body2 text-grey-7 q-mb-none">
                          基于角色的访问控制(RBAC)，确保用户只能访问授权的数据
                        </p>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>

                <p><strong>管理措施：</strong></p>
                <ul>
                  <li>建立专门的数据安全团队，负责信息安全管理</li>
                  <li>定期进行安全培训和意识教育</li>
                  <li>实施安全审计和漏洞扫描</li>
                  <li>制定并演练数据泄露应急预案</li>
                </ul>

                <q-banner class="bg-red-1 text-red-9 q-my-md" rounded>
                  <template v-slot:avatar>
                    <q-icon name="report_problem" color="red" />
                  </template>
                  <span class="text-body2">
                    <strong>安全事件响应：</strong>
                    如发生个人信息安全事件，我们将在<strong>72小时内</strong>通知您，
                    并向有关主管部门报告，同时采取措施减轻损害。
                  </span>
                </q-banner>
              </div>
            </section>

            <!-- 第五部分：信息共享 -->
            <section id="section-5" class="privacy-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">五</span>
                我们如何共享您的信息
              </h3>
              <div class="section-content">
                <p><strong>5.1 我们不会共享的情形</strong></p>
                <p>除以下情形外，我们<strong>不会</strong>与任何第三方共享您的个人信息：</p>

                <p><strong>5.2 必要的第三方服务</strong></p>
                <p>为提供完整服务，我们与以下可信赖的第三方合作：</p>
                <q-list bordered separator class="rounded-borders q-my-md">
                  <q-item>
                    <q-item-section avatar>
                      <q-avatar color="blue-1">
                        <q-icon name="sms" color="blue" />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>阿里云短信服务</q-item-label>
                      <q-item-label caption>
                        用途：发送验证码和通知短信<br />
                        共享信息：手机号码<br />
                        隐私政策：<a
                          href="https://terms.aliyun.com/legal-agreement/terms/suit_bu1_ali_cloud/suit_bu1_ali_cloud201902141711_54837.html"
                          target="_blank"
                          class="text-primary"
                          >阿里云隐私政策</a
                        >
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section avatar>
                      <q-avatar color="green-1">
                        <q-icon name="psychology" color="green" />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>通义千问AI服务</q-item-label>
                      <q-item-label caption>
                        用途：医学影像AI分析<br />
                        共享信息：脱敏后的医学影像<br />
                        隐私政策：<a
                          href="https://terms.alicdn.com/legal-agreement/terms/suit_bu1_alibaba/suit_bu1_alibaba202107141851_79841.html"
                          target="_blank"
                          class="text-primary"
                          >阿里云AI服务协议</a
                        >
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section avatar>
                      <q-avatar color="orange-1">
                        <q-icon name="payment" color="orange" />
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>支付相关服务</q-item-label>
                      <q-item-label caption>
                        用途：订阅页可能展示支付方式选项或记录支付方式偏好（页面交互用途）<br />
                        共享信息：可能包含所选档位、金额展示与交互状态（不含完整支付信息）<br />
                        说明：若未来启用真实支付，将以实际接入的第三方服务为准
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>

                <p><strong>5.3 法定披露情形</strong></p>
                <p>在以下情况下，我们可能会披露您的信息：</p>
                <ul>
                  <li>根据法律法规的强制性要求</li>
                  <li>根据司法机关或行政机关的合法要求</li>
                  <li>为保护我们、用户或公众的权利、财产或安全</li>
                </ul>
              </div>
            </section>

            <!-- 第六部分：您的权利 -->
            <section id="section-6" class="privacy-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">六</span>
                您的权利
              </h3>
              <div class="section-content">
                <p>根据相关法律法规，您对个人信息享有以下权利：</p>

                <div class="row q-col-gutter-md q-my-md">
                  <div class="col-12 col-md-6 col-lg-4">
                    <q-card flat bordered class="rights-card full-height">
                      <q-card-section class="text-center">
                        <q-icon name="visibility" color="primary" size="xl" class="q-mb-sm" />
                        <div class="text-subtitle1 text-weight-medium">访问权</div>
                        <p class="text-body2 text-grey-7">您有权访问和查阅我们持有的您的个人信息</p>
                      </q-card-section>
                    </q-card>
                  </div>
                  <div class="col-12 col-md-6 col-lg-4">
                    <q-card flat bordered class="rights-card full-height">
                      <q-card-section class="text-center">
                        <q-icon name="edit" color="primary" size="xl" class="q-mb-sm" />
                        <div class="text-subtitle1 text-weight-medium">更正权</div>
                        <p class="text-body2 text-grey-7">您有权要求我们更正不准确的个人信息</p>
                      </q-card-section>
                    </q-card>
                  </div>
                  <div class="col-12 col-md-6 col-lg-4">
                    <q-card flat bordered class="rights-card full-height">
                      <q-card-section class="text-center">
                        <q-icon name="delete" color="primary" size="xl" class="q-mb-sm" />
                        <div class="text-subtitle1 text-weight-medium">删除权</div>
                        <p class="text-body2 text-grey-7">您有权要求我们删除您的个人信息</p>
                      </q-card-section>
                    </q-card>
                  </div>
                  <div class="col-12 col-md-6 col-lg-4">
                    <q-card flat bordered class="rights-card full-height">
                      <q-card-section class="text-center">
                        <q-icon name="file_download" color="primary" size="xl" class="q-mb-sm" />
                        <div class="text-subtitle1 text-weight-medium">可携带权</div>
                        <p class="text-body2 text-grey-7">
                          您有权获取个人信息副本并转移给其他服务商
                        </p>
                      </q-card-section>
                    </q-card>
                  </div>
                  <div class="col-12 col-md-6 col-lg-4">
                    <q-card flat bordered class="rights-card full-height">
                      <q-card-section class="text-center">
                        <q-icon name="block" color="primary" size="xl" class="q-mb-sm" />
                        <div class="text-subtitle1 text-weight-medium">撤回同意</div>
                        <p class="text-body2 text-grey-7">您有权撤回之前给予的信息处理同意</p>
                      </q-card-section>
                    </q-card>
                  </div>
                  <div class="col-12 col-md-6 col-lg-4">
                    <q-card flat bordered class="rights-card full-height">
                      <q-card-section class="text-center">
                        <q-icon name="person_off" color="primary" size="xl" class="q-mb-sm" />
                        <div class="text-subtitle1 text-weight-medium">注销账户</div>
                        <p class="text-body2 text-grey-7">您有权注销账户并要求删除相关数据</p>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>

                <p><strong>行使权利的方式：</strong></p>
                <p>
                  您可以通过系统设置页面自助操作，或通过
                  <a href="mailto:support@hpvsc.icu" class="text-primary"
                    >support@hpvsc.icu</a
                  >
                  联系我们行使上述权利。我们将在<strong>15个工作日</strong>内响应您的请求。
                </p>
              </div>
            </section>

            <!-- 第七部分：Cookie政策 -->
            <section id="section-7" class="privacy-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">七</span>
                Cookie政策
              </h3>
              <div class="section-content">
                <p><strong>7.1 什么是Cookie</strong></p>
                <p>Cookie是存储在您设备上的小型数据文件，用于记录您的偏好设置和使用习惯。</p>

                <p><strong>7.2 我们使用的Cookie类型</strong></p>
                <ul>
                  <li><strong>必要Cookie：</strong>维持登录状态和会话安全，无法禁用</li>
                  <li><strong>功能Cookie：</strong>记住您的偏好设置（如语言、主题）</li>
                  <li><strong>分析Cookie：</strong>帮助我们了解服务使用情况</li>
                </ul>

                <p><strong>7.3 管理Cookie</strong></p>
                <p>
                  您可以通过浏览器设置管理或删除Cookie。请注意，禁用必要Cookie可能影响服务正常使用。
                </p>
              </div>
            </section>

            <!-- 第八部分：未成年人保护 -->
            <section id="section-8" class="privacy-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">八</span>
                未成年人信息保护
              </h3>
              <div class="section-content">
                <q-banner class="bg-purple-1 text-purple-9 q-mb-md" rounded>
                  <template v-slot:avatar>
                    <q-icon name="child_care" color="purple" />
                  </template>
                  <span class="text-body2">
                    本服务面向医疗专业人员，我们不主动收集未成年人的个人信息。
                  </span>
                </q-banner>
                <ul>
                  <li>如您是未满18周岁的未成年人，请在监护人陪同下阅读本政策</li>
                  <li>我们不会在明知对方是未成年人的情况下收集其个人信息</li>
                  <li>如发现意外收集了未成年人信息，我们将立即删除</li>
                  <li>监护人如发现未成年人信息被收集，可联系我们处理</li>
                </ul>
              </div>
            </section>

            <!-- 第九部分：政策更新 -->
            <section id="section-9" class="privacy-section q-mb-xl">
              <h3 class="section-title">
                <span class="section-number">九</span>
                隐私政策的更新
              </h3>
              <div class="section-content">
                <p>
                  我们可能会适时修订本隐私政策。更新后的政策将在本页面发布，并通过以下方式通知您：
                </p>
                <ul>
                  <li>系统内弹窗提示</li>
                  <li>电子邮件或短信通知</li>
                  <li>网站公告</li>
                </ul>
                <p>
                  对于重大变更（如个人信息共享、转让方式的调整），
                  我们会在变更生效前<strong>30日</strong>通过显著方式告知，并重新获取您的同意。
                </p>
              </div>
            </section>

            <!-- 第十部分：联系我们 -->
            <section id="section-10" class="privacy-section">
              <h3 class="section-title">
                <span class="section-number">十</span>
                如何联系我们
              </h3>
              <div class="section-content">
                <p>如您对本隐私政策有任何疑问、意见或建议，请通过以下方式联系我们：</p>
                <q-card flat bordered class="q-pa-md q-mt-md">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6">
                      <div class="text-subtitle2 text-grey-7">数据保护负责人</div>
                      <div class="text-body1">云端智诊团队 隐私保护办公室</div>
                    </div>
                    <div class="col-12 col-md-6">
                      <div class="text-subtitle2 text-grey-7">联系邮箱</div>
                      <div class="text-body1">
                        <a href="mailto:privacy@cervixdetect.ai" class="text-primary">
                          privacy@cervixdetect.ai
                        </a>
                      </div>
                    </div>
                    <div class="col-12 col-md-6">
                      <div class="text-subtitle2 text-grey-7">响应时间</div>
                      <div class="text-body1">15个工作日内</div>
                    </div>
                    <div class="col-12 col-md-6">
                      <div class="text-subtitle2 text-grey-7">政策版本</div>
                      <div class="text-body1">v1.0.0（2026年3月11日）</div>
                    </div>
                  </div>
                </q-card>

                <p class="q-mt-lg text-grey-7">
                  如果您对我们的答复不满意，您可以向网信部门或其他有权机关投诉举报。
                </p>
              </div>
            </section>
          </div>
        </q-card-section>
      </q-card>

      <!-- 底部操作 -->
      <div class="text-center q-mt-lg">
        <q-btn
          unelevated
          color="positive"
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
  { id: 'section-1', title: '信息收集' },
  { id: 'section-2', title: '信息使用' },
  { id: 'section-3', title: '信息存储' },
  { id: 'section-4', title: '信息安全' },
  { id: 'section-5', title: '信息共享' },
  { id: 'section-6', title: '您的权利' },
  { id: 'section-7', title: 'Cookie' },
  { id: 'section-8', title: '未成年人' },
  { id: 'section-9', title: '政策更新' },
  { id: 'section-10', title: '联系我们' },
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
.privacy-page {
  min-height: 100vh;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
}

.privacy-header {
  position: sticky;
  top: 0;
  z-index: 100;
}

.privacy-content {
  border-radius: 12px;
}

.privacy-nav {
  position: sticky;
  top: 80px;
  background: white;
  padding: 12px 0;
  z-index: 10;
}

.privacy-body {
  line-height: 1.8;
  color: #333;
}

.privacy-section {
  scroll-margin-top: 100px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #21ba45;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e8f5e9;
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-number {
  background: linear-gradient(135deg, #21ba45 0%, #4caf50 100%);
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
  box-shadow: 0 2px 8px rgba(33, 186, 69, 0.3);
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
  color: #21ba45;
}

.security-card,
.rights-card {
  transition: all 0.3s ease;
}

.security-card:hover,
.rights-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.full-height {
  height: 100%;
}

/* 响应式调整 */
@media (max-width: 599px) {
  .privacy-nav .q-chip {
    font-size: 11px;
  }

  .section-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
