本文档详细阐述 CervixDetectAI 项目的 Sequelize ORM 架构设计，涵盖 13 个核心数据模型、实体间关联关系、以及业务逻辑钩子的实现模式。该系统采用典型的医疗影像分析领域模型设计，以用户-患者-病例-分析为核心业务链条，辅以订单、随访、通知等支撑模块。

## 技术选型与配置架构

CervixDetectAI 后端选择 **Sequelize** 作为 ORM 层，选择背后有三点考量：与 Node.js 技术栈的天然亲和性、对 MySQL/MariaDB 的完善支持、以及对关联查询与事务处理的能力。该项目使用 MySQL 5.7+ 作为数据库引擎，通过 `utf8mb4` 字符集和 `utf8mb4_unicode_ci` 排序规则支持完整的 Unicode 字符存储，包括 emoji 和多语言医疗术语。

数据库配置文件位于 `server/config/database.js`，实现了开发与生产环境的差异化配置。两套环境共享相同的表结构定义策略，但在连接池参数和日志输出策略上有所区分。

| 配置项 | 开发环境 | 生产环境 |
|--------|----------|----------|
| 连接池最大连接数 | 20 | 20 |
| 连接池最小连接数 | 5 | 5 |
| 获取连接超时 | 30秒 | 30秒 |
| 空闲连接超时 | 10秒 | 10秒 |
| SQL日志输出 | 控制台打印 | 关闭 |
| 软删除策略 | 启用 | 启用 |
| 时区设置 | +08:00 | +08:00 |

Sources: [database.js](server/config/database.js#L1-L64)

Sequelize 实例初始化位于 `server/config/sequelize.js`，实现了自定义日志函数用于性能监控。当查询执行时间超过 100 毫秒时，开发环境下会输出 `[DB Slow Query]` 标记，便于识别性能瓶颈。数据库监控服务（`dbMonitorService`）通过延迟导入避免循环依赖问题。

Sources: [sequelize.js](server/config/sequelize.js#L1-L73)

## 数据模型全景图

项目定义了 13 个数据模型，形成以用户为中心的发散式关联结构。核心业务实体包括：**User**（系统用户）、**Patient**（患者）、**Study**（病例检查）、**AnalysisTask**（分析任务）、**AnalysisResult**（分析结果）、**MedicalReport**（医疗报告）。支撑实体包括：**Order**（订单）、**FollowUp**（随访计划）、**Notification**（通知）、**StudyImage**（检查影像）、**UserAvatar**（用户头像）、**EmailCode**（邮箱验证码）、**SmsCode**（短信验证码）。

```mermaid
erDiagram
    User {
        bigint id PK
        string username UK
        string email UK
        string password_hash
        enum role "admin/doctor/user"
        enum status "active/disabled"
        enum subscription_type
        int remaining_credits
    }
    UserAvatar {
        bigint id PK
        bigint user_id FK
        string original_url
        boolean is_current
    }
    Patient {
        bigint id PK
        string patient_id UK
        string name
        enum gender
        date birth_date
        text sexual_history
        text medical_history
        bigint created_by FK
    }
    Study {
        bigint id PK
        string study_id UK
        bigint patient_id FK
        bigint user_id FK
        date study_date
        enum status "pending/uploaded/processing/completed/failed"
    }
    StudyImage {
        bigint id PK
        bigint study_id FK
        string file_path
        json dicom_metadata
        boolean is_primary
    }
    AnalysisTask {
        bigint id PK
        string task_id UK
        bigint study_id FK
        enum status "PENDING/PROCESSING/SUCCESS/FAILED"
        int progress
    }
    AnalysisResult {
        bigint id PK
        bigint task_id FK UK
        string diagnosis
        decimal confidence
        enum risk_level "low/medium/high/critical"
        json recommendations
        json biomarkers
    }
    MedicalReport {
        bigint id PK
        string report_id UK
        bigint study_id FK
        bigint analysis_result_id FK
        bigint patient_id FK
        enum report_type "preliminary/final/supplementary"
        enum status "draft/pending_review/approved/rejected"
    }
    Order {
        bigint id PK
        string out_trade_no UK
        bigint user_id FK
        decimal money
        enum status "pending/paid/failed/expired"
    }
    FollowUp {
        bigint id PK
        string follow_up_id UK
        bigint patient_id FK
        bigint study_id FK
        date planned_date
        enum status "pending/overdue/completed/cancelled"
    }
    Notification {
        bigint id PK
        bigint user_id FK
        enum type
        boolean is_read
    }
    EmailCode {
        int id PK
        string email
        string code
        enum type "register/reset_password/change_email"
        date expires_at
    }
    SmsCode {
        bigint id PK
        string phone
        string code
        enum type "login/register/reset_password"
    }

    User ||--o{ UserAvatar : "has"
    User ||--o{ Order : "places"
    User ||--o{ Patient : "creates"
    User ||--o{ Study : "uploads"
    User ||--o{ AnalysisTask : "initiates"
    User ||--o{ MedicalReport : "generates/signs"
    User ||--o{ FollowUp : "creates/assigned"
    User ||--o{ Notification : "receives"
    Patient ||--o{ Study : "undergoes"
    Patient ||--o{ MedicalReport : "generates"
    Patient ||--o{ FollowUp : "scheduled"
    Study ||--o{ StudyImage : "contains"
    Study ||--o{ AnalysisTask : "triggers"
    Study ||--o{ FollowUp : "originates"
    AnalysisTask ||--|| AnalysisResult : "produces"
    AnalysisResult ||--o{ MedicalReport : "documents"
```

## 核心业务实体详解

### User 模型

User 模型是整个系统的身份认证基础，采用 `bcrypt` 进行密码哈希存储，支持三种角色分层：**admin**（管理员）、**doctor**（医生）、**user**（普通用户）。模型内置了密码验证和密码设置两个实例方法，通过 `beforeSave` 钩子自动完成密码加密，确保明文密码不会进入数据库。

用户订阅机制通过 `subscription_type` 字段实现，支持按月订阅（monthly）、按年订阅（yearly）、按次数购买（package）三种模式。剩余分析次数由 `remaining_credits` 字段管理，支持在购买套餐后获得积分或直接按月/年自动续费。

Sources: [User.js](server/models/User.js#L1-L130)

```javascript
// 密码验证实例方法
User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password_hash);
};

// 创建前自动生成用户名钩子
User.beforeCreate(async (user) => {
  if (!user.username) {
    user.username = `user_${Date.now()}`;
  }
});
```

### Patient 模型

Patient 模型承载患者个人信息和医疗背景数据。在设计上遵循医疗数据敏感性原则，身份证号（`id_card`）和医保卡号（`medical_card_no`）字段虽然在模型中定义，但根据注释属于加密存储字段。`sexual_history` 字段采用枚举类型记录性生活史，这是宫颈癌筛查场景下的重要风险因素之一。

患者 ID（`patient_id`）通过 `beforeValidate` 钩子自动生成，采用 `P{timestamp}{random}` 格式，确保全局唯一性且具有一定的人类可读性。

Sources: [Patient.js](server/models/Patient.js#L1-L136)

### Study 模型

Study 模型代表一次医学影像检查，是 AI 分析的触发入口。模型包含丰富的临床元数据字段，如检查类型（`study_type`）、科室（`department`）、医生姓名（`doctor_name`）、临床诊断（`clinical_diagnosis`）、症状描述（`symptoms`），这些字段为 AI 分析提供上下文信息。

病例状态流转遵循五态模型：**pending**（待处理）、**uploaded**（已上传）、**processing**（分析中）、**completed**（已完成）、**failed**（失败）。状态机设计确保影像上传后才能触发 AI 分析，分析完成后状态才能变为已完成。

Study ID 生成逻辑采用日期前缀加序列号的方式：`S{YYYYMMDD}{6位序号}`，例如 `S20260326000001`。通过查询当天已有记录数量来计算序号，确保同一日期内的 ID 连续且不冲突。

Sources: [Study.js](server/models/Study.js#L1-L132)

### AnalysisTask 与 AnalysisResult 模型

这两个模型共同构成 AI 分析的核心数据流。**AnalysisTask** 负责追踪分析任务的生命周期，记录任务状态（`PENDING/PROCESSING/SUCCESS/FAILED`）、执行进度（`progress` 0-100）、处理耗时（`processing_time`）、重试次数（`retry_count`）。任务 ID 采用 `TASK{timestamp}{6位随机字符}` 格式生成。

**AnalysisResult** 存储 AI 分析的结构化输出，包括诊断结论（`diagnosis`）、置信度（`confidence`，0-1 范围四位小数精度）、风险等级（`risk_level`）、医疗建议（`recommendations`，JSON数组格式）。扩展字段涵盖生物标志物数据（`biomarkers`，如 HPV、p16、Ki67 等）、可疑区域坐标（`suspicious_areas`）、热力图与标注图像路径。

AnalysisTask 与 AnalysisResult 保持 **1:1** 关联关系，每个任务必然产生且仅产生一个分析结果。该关系通过 `AnalysisTask.hasOne(AnalysisResult)` 和 `AnalysisResult.belongsTo(AnalysisTask)` 双向绑定实现，外键约束设置为 `ON DELETE CASCADE`，确保任务删除时自动清理关联结果。

Sources: [AnalysisTask.js](server/models/AnalysisTask.js#L1-L109)
Sources: [AnalysisResult.js](server/models/AnalysisResult.js#L1-L127)

### MedicalReport 模型

MedicalReport 模型将分析结果文档化，生成可供下载的医疗报告 PDF。报告状态机包含四态：**draft**（草稿）、**pending_review**（待审核）、**approved**（已批准）、**rejected**（已驳回）。模型支持报告签发流程，`generated_by` 字段记录报告生成者，`signed_by` 字段记录签发医生，`signature_data` 字段存储电子签名数据。

报告类型（`report_type`）区分为初报（preliminary）、终报（final）、补充报告（supplementary），支持根据临床需要补充或修正报告内容。下载计数（`download_count`）和最后下载时间（`last_downloaded_at`）用于审计追踪。

报告 ID 生成逻辑与 Study 类似，采用 `R{YYYYMMDD}{6位序号}` 格式，保证报告编号与日期的关联性便于归档管理。

Sources: [MedicalReport.js](server/models/MedicalReport.js#L1-L170)

## 支撑业务实体

### Order 模型

Order 模型实现订阅购买的支付流程追踪，支持支付宝和微信支付两种渠道。订单状态包括：**pending**（待支付）、**paid**（已支付）、**failed**（支付失败）、**expired**（已过期）。模型记录商户订单号（`out_trade_no`）和平台交易号（`trade_no`），以及支付成功后的支付时间（`pay_time`）。

订单与用户保持 **N:1** 关联关系，订单创建后用户 ID 不可变更。`notify_data` 字段存储支付平台回调的原始数据，便于事后对账和争议处理。

Sources: [Order.js](server/models/Order.js#L1-L80)

### FollowUp 模型

FollowUp 模型实现智能随访管理，是 AI 辅助临床决策的重要体现。模型支持根据风险等级自动标记高关注随访（`ai_flagged_high_attention`），结合 `doctor_marked_high_attention` 字段实现人机协同的风险评估。

随访状态包括：**pending**（待执行）、**overdue**（已逾期）、**completed**（已完成）、**cancelled**（已取消）。`planned_date` 字段记录计划随访日期，`recommended_interval_months` 字段记录建议随访间隔（1-24个月），支持根据上次分析结果自动计算下次随访时间。

随访可关联到特定患者（必须）和特定病例（可选），同时支持指定负责医生（`assigned_doctor_id`），实现随访任务的分配和追踪。

Sources: [FollowUp.js](server/models/FollowUp.js#L1-L153)

### Notification 模型

Notification 模型实现站内通知系统，支持四种通知类型：**followup_due**（随访到期提醒）、**followup_overdue**（随访逾期提醒）、**followup_high_attention**（高关注随访提醒）、**system**（系统通知）。通知通过 `related_type` 和 `related_id` 字段关联到具体业务对象，支持点击跳转。

已读状态（`is_read`）和已读时间（`read_at`）用于追踪用户查看情况。复合索引 `(user_id, is_read, created_at)` 确保通知列表查询的高效性，支持按用户筛选未读通知并按时间倒序排列。

Sources: [Notification.js](server/models/Notification.js#L1-L68)

### StudyImage 模型

StudyImage 模型管理检查病例中的影像文件，支持 DICOM、JPEG、PNG 等多种格式。模型不仅存储文件路径和基本信息，还保留 DICOM 元数据（`dicom_metadata`）用于医学影像的序列管理和实例管理。

`is_primary` 字段标识主要影像，`upload_status` 字段追踪上传进度。复合索引 `(study_id, series_number, instance_number)` 优化 DICOM 序列的查询性能。

Sources: [StudyImage.js](server/models/StudyImage.js#L1-L104)

### EmailCode 与 SmsCode 模型

这两个模型实现多因素认证的验证码功能。**EmailCode** 支持注册（register）、密码重置（reset_password）、邮箱变更（change_email）三种业务场景；**SmsCode** 支持登录（login）、注册（register）、密码重置（reset_password）三种场景。

验证码有效期统一设置为 5 分钟，通过 `expires_at` 字段控制。EmailCode 提供了丰富的静态方法：`findValidCode` 查询有效验证码、`invalidatePreviousCodes` 使同一邮箱同类验证码失效、`cleanupExpiredCodes` 清理过期记录（建议定时任务调用）。

Sources: [EmailCode.js](server/models/EmailCode.js#L1-L160)
Sources: [SmsCode.js](server/models/SmsCode.js#L1-L74)

### UserAvatar 模型

UserAvatar 模型实现用户头像的多规格管理，存储原始图及多种尺寸版本（thumbnail、small、medium、large）的 URL。`is_current` 字段标识当前使用的头像，复合索引 `(user_id, is_current)` 优化当前头像查询。

Sources: [UserAvatar.js](server/models/UserAvatar.js#L1-L82)

## 关联关系配置

关联关系统一在 `server/models/index.js` 中定义，采用声明式 API 描述实体间的导航属性。所有关系配置遵循以下原则：外键约束设置合理的级联策略、关联别名（`as`）用于后续查询的 include 语法。

Sources: [index.js](server/models/index.js#L1-L105)

| 关系类型 | 关联配置 | 级联策略 |
|----------|----------|----------|
| User → UserAvatar | hasMany | CASCADE |
| User → Order | hasMany | CASCADE |
| User → Patient | hasMany | SET NULL |
| User → Study | hasMany | SET NULL |
| User → AnalysisTask | hasMany | SET NULL |
| User → FollowUp | hasMany (created/assigned) | SET NULL |
| User → Notification | hasMany | CASCADE |
| Patient → Study | hasMany | RESTRICT |
| Study → StudyImage | hasMany | CASCADE |
| Study → AnalysisTask | hasMany | RESTRICT |
| Study → AnalysisResult | hasMany | RESTRICT |
| AnalysisTask → AnalysisResult | hasOne | CASCADE |
| AnalysisResult → MedicalReport | hasMany | RESTRICT |

**级联策略说明**：CASCADE 表示主表删除时级联删除从表记录；RESTRICT 阻止删除有关联记录的主表；SET NULL 在主表记录删除后将外键设为 NULL，适用于用户删除场景但保留业务数据完整性。

## 业务逻辑钩子体系

模型钩子（Hooks）封装了业务规则，实现数据验证、自增 ID 生成、自动化操作等逻辑。该项目共实现了 6 种自动 ID 生成钩子和 2 种密码处理钩子。

| 钩子类型 | 模型 | 触发时机 | 功能 |
|----------|------|----------|------|
| beforeValidate | Patient | 验证前 | 自动生成 `patient_id` |
| beforeValidate | FollowUp | 验证前 | 自动生成 `follow_up_id` |
| beforeCreate | Study | 创建前 | 自动生成 `study_id` |
| beforeCreate | AnalysisTask | 创建前 | 自动生成 `task_id` |
| beforeCreate | MedicalReport | 创建前 | 自动生成 `report_id` |
| beforeCreate | EmailCode | 创建前 | 设置 5 分钟后过期 |
| beforeCreate | User | 创建前 | 用户名兜底生成 |
| beforeSave | User | 保存前 | 密码加密（防重复加密） |

```javascript
// EmailCode 自动过期设置示例
hooks: {
  beforeCreate: (emailCode) => {
    emailCode.expires_at = new Date(Date.now() + 5 * 60 * 1000);
  },
}

// Study ID 生成逻辑示例
Study.beforeCreate(async (study) => {
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Study.count({
    where: { study_id: { [Op.like]: `S${dateStr}%` } }
  });
  study.study_id = `S${dateStr}${(count + 1).toString().padStart(6, '0')}`;
});
```

## 数据库初始化与迁移

数据库初始化脚本位于 `server/scripts/init-database.js`，实现了完整的数据库创建和初始化流程。脚本执行以下步骤：连接 MySQL 服务器 → 创建数据库（如不存在）→ 同步模型定义 → 修复历史数据 → 创建默认管理员账号。

Sources: [init-database.js](server/scripts/init-database.js#L1-L165)

初始化采用 `sequelize.sync({ force: false, alter: true })` 策略：`force: false` 防止覆盖已有数据，`alter: true` 自动将模型变更同步到数据库结构（添加新列、索引等）。该策略适用于开发迭代阶段，生产环境建议使用正式的迁移工具。

软删除（Paranoid Delete）通过 `deletedAt` 字段实现，所有模型继承此特性。调用 `Model.destroy()` 时数据不会物理删除，仅设置 `deletedAt` 时间戳，查询默认排除已删除记录。如需查询包含已删除记录，需使用 `paranoid: false` 选项。

## 查询实践指南

关联查询是该系统最常用的数据获取模式。以下是典型业务场景的查询示例：

```javascript
// 获取患者完整档案（含所有病例和最新分析结果）
const patient = await Patient.findByPk(patientId, {
  include: [{
    model: Study,
    as: 'studies',
    include: [{
      model: AnalysisResult,
      as: 'analysis_results',
      order: [['created_at', 'DESC']],
      limit: 1
    }]
  }]
});

// 获取用户通知列表（未读优先）
const notifications = await Notification.findAll({
  where: { user_id },
  order: [['is_read', 'ASC'], ['created_at', 'DESC']],
  limit: 20
});

// 获取分析任务统计
const stats = await AnalysisTask.findAndCountAll({
  where: { 
    user_id,
    status: 'SUCCESS',
    created_at: { [Op.gte]: startDate }
  }
});
```

## 下一步阅读建议

- 业务逻辑层文档中有关于 [分析服务设计](后端架构/业务逻辑层) 的详细说明，阐述 AnalysisTask 如何与通义千问 API 交互
- [数据库设计/关系图](数据库设计/关系图) 提供实体关系的图形化展示
- [后端服务架构](后端架构/后端服务架构) 讲解服务层如何调用这些数据模型