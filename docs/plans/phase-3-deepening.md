# 第三阶段：功能深化

> **周期**: 5-8 周  
> **目标**: 拓展核心业务功能深度，引入 Redis 基础设施，建立 CI/CD 流程  
> **前置条件**: 第二阶段核心体验升级完成  
> **验收标准**: 多维度功能可用，基础设施成熟，自动化流水线运转

---

## 任务总览

### 功能扩展

| 任务           | 编号 | 预估工时 | 依赖 |
| :------------- | :--: | :------: | :--: |
| 检测历史对比   |  F2  |   12h    |  F1  |
| 患者时间线     |  F8  |    8h    |  无  |
| 随访管理       | F10  |   16h    | F19  |
| 数据导入导出   | F11  |   10h    |  无  |
| 报告模板自定义 | F13  |   20h    | F14  |
| 多人协作/会诊  | F20  |   16h    |  无  |
| 操作日志审计   | F22  |    8h    |  无  |
| 数据大屏       | F23  |   16h    | F24  |

### 交互增强

| 任务           | 编号  | 预估工时 | 依赖 |
| :------------- | :---: | :------: | :--: |
| 页面/列表动画  | U5/U6 |    4h    |  无  |
| 图像查看器增强 |  U10  |    8h    |  无  |
| 高级搜索       |  U18  |    8h    |  无  |
| 空状态设计优化 |  U13  |    4h    |  无  |

### 基础设施

| 任务               | 编号 | 预估工时 | 依赖 |
| :----------------- | :--: | :------: | :--: |
| Redis 缓存         |  T5  |   12h    |  无  |
| 任务队列（BullMQ） |  T6  |   12h    |  T5  |
| CI/CD 流水线       | T16  |    8h    | T13  |
| Swagger 文档完善   | T17  |    6h    |  T1  |

**合计预估**: ~168h（约 21 个工作日）

---

## 详细执行方案

### 1. F2 — 检测历史对比

**设计方案**:

为同一患者的多次检测提供时间轴视图和结果趋势对比。

**数据查询**:

```sql
SELECT at.id, at.created_at, ar.risk_level, ar.confidence, ar.diagnosis
FROM analysis_tasks at
JOIN analysis_results ar ON at.id = ar.task_id
JOIN studies s ON at.study_id = s.id
WHERE s.patient_id = ?
ORDER BY at.created_at ASC;
```

**前端实现**:

1. 新建 `HistoryCompareView.vue` 组件：
   - 上半部分：ECharts 趋势折线图（X 轴=时间，Y 轴=置信度/风险等级）
   - 下半部分：时间轴卡片（每次检测的关键指标）

2. 在 `StudyDetailPage.vue` 中添加"历史对比"Tab 页

3. 支持选择两次检测进行并排对比

**验收条件**:

- [ ] 同一患者的多次检测结果按时间排列
- [ ] 趋势图正确展示风险变化
- [ ] 两次结果可并排对比

---

### 2. F8 — 患者时间线

**实现方式**: 聚合患者的所有关联数据（就诊、病例、检测、报告），使用 Quasar `q-timeline` 组件渲染。

**数据聚合接口**: `GET /api/patients/:id/timeline`

```javascript
// 返回结构
{
  timeline: [
    { type: 'study_created', date: '2026-01-15', title: '创建病例', detail: '...' },
    {
      type: 'analysis_complete',
      date: '2026-01-15',
      title: 'AI分析完成',
      detail: '...',
      riskLevel: 'low',
    },
    { type: 'report_generated', date: '2026-01-16', title: '报告生成', detail: '...' },
  ];
}
```

**验收条件**:

- [ ] 患者详情页展示完整时间线
- [ ] 时间线按时间倒序排列
- [ ] 不同事件类型有不同图标和颜色

---

### 3. F10 — 随访管理

**数据模型**:

```sql
CREATE TABLE follow_ups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  study_id INT,
  scheduled_date DATE NOT NULL,
  status ENUM('pending', 'completed', 'overdue', 'cancelled') DEFAULT 'pending',
  reminder_type ENUM('email', 'sms', 'in_app') DEFAULT 'in_app',
  notes TEXT,
  created_by INT NOT NULL,
  completed_at DATETIME,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

**执行步骤**:

1. 新建 `server/models/FollowUp.js`
2. 新建 `server/routes/follow-ups.js`（CRUD 接口）
3. 新建 `server/services/followUpScheduler.js`：
   - 使用 `node-cron` 每天检查到期随访
   - 到期前 1 天 + 当天 发送提醒
   - 复用 `email.service.js` 和 通知系统（F19）
4. 前端：在患者详情页添加"随访计划"面板
5. 前端：Dashboard 添加"即将到期随访"提醒卡片

**验收条件**:

- [ ] 可为患者创建随访计划
- [ ] 到期自动发送站内通知
- [ ] 到期自动发送邮件提醒（如选择邮件提醒）
- [ ] Dashboard 展示即将到期的随访

---

### 4. F11 — 数据导入导出

**依赖**: `xlsx`（npm 包）

**执行步骤**:

1. **导出功能**:
   - `GET /api/patients/export?format=xlsx` — 导出患者列表为 Excel
   - `GET /api/patients/export?format=csv` — 导出为 CSV
   - 导出数据需脱敏（身份证部分隐藏）

2. **导入功能**:
   - `POST /api/patients/import` — 上传 Excel/CSV 文件
   - 后端解析 + 校验 + 批量插入
   - 返回导入结果（成功数、失败数、失败行号和原因）
   - 提供导入模板下载

3. **前端**: 在 `PatientsPage.vue` 添加：
   - "导出"按钮（下拉选择格式）
   - "导入"按钮（上传文件 + 结果展示）
   - 下载导入模板

**验收条件**:

- [ ] 导出的 Excel 可被 WPS/Office 正常打开
- [ ] 导入模板包含表头说明和示例数据
- [ ] 导入失败行有具体错误说明
- [ ] 导出数据中敏感字段已脱敏

---

### 5. F13 — 报告模板自定义（含报告生成后端化）

> [!WARNING]
> 此任务是本阶段工作量最大的项，核心在于将报告生成从前端迁移到后端。

**前置工作**: 报告生成后端化

1. **安装 puppeteer**:

   ```bash
   cd server && npm install puppeteer
   ```

2. **新建 `server/services/reportGenerator.js`**:
   - 使用 Puppeteer 在后端渲染 HTML → PDF
   - 模板使用 EJS/Handlebars 模板引擎
   - 支持自定义 Logo、医院名称、签章位置

3. **模板系统设计**:

   ```
   server/templates/
   ├── default/          # 默认模板
   │   ├── report.ejs
   │   └── styles.css
   └── custom/           # 用户自定义模板
       └── {hospital_id}/
           ├── report.ejs
           ├── styles.css
           └── logo.png
   ```

4. **配置接口**:
   - `GET /api/report-templates` — 获取可用模板列表
   - `POST /api/report-templates` — 上传自定义模板
   - `GET /api/reports/:id/pdf` — 使用指定模板生成 PDF

**验收条件**:

- [ ] 后端可成功生成 PDF 报告
- [ ] 支持切换不同模板
- [ ] 自定义 Logo 正确嵌入
- [ ] Docker 环境中 Puppeteer 正常工作

---

### 6. F20 — 多人协作/会诊

**设计方案**:

新建关联表实现病例共享：

```sql
CREATE TABLE study_shares (
  id INT PRIMARY KEY AUTO_INCREMENT,
  study_id INT NOT NULL,
  shared_by INT NOT NULL,    -- 分享者
  shared_with INT NOT NULL,   -- 被分享者
  permission ENUM('view', 'comment', 'edit') DEFAULT 'view',
  message TEXT,               -- 转诊说明
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (study_id) REFERENCES studies(id),
  FOREIGN KEY (shared_by) REFERENCES users(id),
  FOREIGN KEY (shared_with) REFERENCES users(id)
);
```

**业务流程**:

1. 医生 A 在病例详情页点击"转诊/会诊"
2. 选择目标医生 B + 填写说明
3. 医生 B 收到通知，可接受/拒绝
4. 接受后，医生 B 可在自己的病例列表中看到该病例（只读/可评论）

**验收条件**:

- [ ] 可将病例分享给其他医生
- [ ] 被分享者收到通知
- [ ] 被分享者可查看但不可修改（根据权限）
- [ ] 分享者可撤回分享

---

### 7. F22 — 操作日志审计

**数据模型**:

```sql
CREATE TABLE audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(50) NOT NULL,    -- 'login', 'view_patient', 'export_report', ...
  resource_type VARCHAR(50),       -- 'patient', 'study', 'report'
  resource_id INT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSON,                   -- 额外信息
  created_at DATETIME DEFAULT NOW(),
  INDEX idx_user_action (user_id, action),
  INDEX idx_created_at (created_at)
);
```

**实现**: Express 审计中间件

```javascript
// server/middleware/audit.js
const auditLog = (action, resourceType) => async (req, res, next) => {
  // 记录请求
  res.on('finish', async () => {
    if (res.statusCode < 400) {
      await AuditLog.create({
        user_id: req.user?.id,
        action,
        resource_type: resourceType,
        resource_id: req.params.id,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
      });
    }
  });
  next();
};
```

**审计点**:
| 操作 | Action | 应用位置 |
|:---|:---|:---|
| 登录 | `login` | `auth.js` |
| 查看患者 | `view_patient` | `patients.js GET /:id` |
| 导出报告 | `export_report` | `files.js` |
| 创建分析 | `create_analysis` | `analysis-tasks.js POST` |
| 修改设置 | `update_settings` | `settings.js PUT` |

**验收条件**:

- [ ] 关键操作自动记录审计日志
- [ ] 管理员可查看审计日志列表
- [ ] 审计日志不影响接口响应性能（异步写入）

---

### 8. T5/T6 — Redis 缓存 + 任务队列

**Docker Compose 扩展**:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
```

**T5 — Redis 缓存**:

```bash
cd server && npm install ioredis
```

缓存策略:
| 数据 | TTL | 场景 |
|:---|:---:|:---|
| 用户信息 | 5min | 鉴权中间件高频查询 |
| Dashboard 统计 | 1min | 避免聚合查询频繁 |
| 系统配置 | 10min | 全局配置读多写少 |

**T6 — BullMQ 任务队列**:

```bash
cd server && npm install bullmq
```

重构分析流程：

```javascript
// server/services/analysisQueue.js
const { Queue, Worker } = require('bullmq');

const analysisQueue = new Queue('analysis', { connection: redisConfig });

// 生产者：创建任务时只入队
await analysisQueue.add('analyze', { taskId, imagePath, userId });

// 消费者：异步处理
const worker = new Worker(
  'analysis',
  async (job) => {
    const { taskId, imagePath, userId } = job.data;
    // 调用通义千问 API...
    // 更新数据库...
    // 推送 WebSocket 通知...
  },
  { connection: redisConfig, concurrency: 3 },
);
```

**验收条件**:

- [ ] Redis 服务在 Docker Compose 中正常启动
- [ ] 统计接口响应时间下降 > 50%（缓存命中时）
- [ ] 分析任务通过队列异步处理
- [ ] 支持并发控制（最多 3 个并发分析）
- [ ] 任务失败自动重试（最多 3 次）

---

### 9. T16 — CI/CD 流水线

**GitHub Actions 配置**:

```yaml
# .github/workflows/ci.yml
name: CI/CD
on:
  push:
    branches: [master, develop]
  pull_request:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_DATABASE: cervixdetect_test
          MYSQL_ROOT_PASSWORD: test123
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: cd server && npm ci
      - run: npm run lint
      - run: npm test
      - run: cd server && npm test
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/master'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t cervix-app:${{ github.sha }} .
      # 部署步骤根据实际服务器配置调整
```

**验收条件**:

- [ ] Push 自动触发 lint + test + build
- [ ] PR 必须通过 CI 才能合并
- [ ] master 分支自动构建 Docker 镜像

---

## 里程碑检查清单

- [ ] 患者时间线功能完整
- [ ] 检测历史可对比（趋势图 + 并排对比）
- [ ] 随访管理系统可用（创建、提醒、完成）
- [ ] 数据导入导出正常
- [ ] 报告生成迁移到后端，支持模板自定义
- [ ] 多人协作/会诊功能可用
- [ ] 审计日志记录关键操作
- [ ] 数据大屏基本可用
- [ ] Redis 缓存提升性能
- [ ] BullMQ 接管分析任务
- [ ] CI/CD 流水线运转
- [ ] 页面动画效果增强
- [ ] 所有功能在 Docker 环境正常工作
