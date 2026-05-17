# 2026-05-17 报告文件接入 EdgeOne Blob

## 背景

医疗报告原先默认落在后端本地磁盘，下载与分享都依赖 `file_path` 指向的本地文件路径。随着项目准备迁移更多静态与文件能力到 EdgeOne Pages，报告文件链路需要先完成一次稳定的对象存储改造。

## 本次变更

### 1. 报告文件存储切换为“本地 + EdgeOne Blob”双后端

- 后端新增 `server/services/reportStorage.service.js`
- 支持 `REPORT_STORAGE_PROVIDER=local | edgeone-blob`
- 当 provider 为 `edgeone-blob` 时，Node 后端直接使用官方 `@edgeone/pages-blob` SDK 写入与读取 Blob
- 不再依赖本地 Edge Functions 作为正式上传/下载主链路

### 2. 报告生成链路增加存储元数据

`medical_reports` 表新增以下字段：

- `storage_provider`
- `storage_key`
- `storage_namespace`
- `storage_url`
- `storage_status`

新生成的 Word / Excel / PDF 报告在 Blob 模式下会先上传对象存储，再写入数据库记录，并在写库成功后清理本地临时文件。

### 3. 下载与分享统一回到后端受控接口

- `GET /api/reports/:id/download`
  - 先校验报告权限
  - Blob 模式下由后端直接从 EdgeOne Blob 读取文件内容并返回
- `GET /api/reports/shared/:token`
  - 继续使用 `ReportShareLink` 进行过期与访问次数控制
  - Blob 模式下由后端直接读取对象并输出，不再绕行本地 Edge Functions 分发

### 4. 批量导出兼容 Blob 模式

- `POST /api/reports/batch-export`
  - 临时导出的报告文件也可先上传到 Blob 再打包入 ZIP
  - ZIP 生成完成后，会尽量清理这些临时对象，避免残留无用文件

## 新增环境变量

```env
REPORT_STORAGE_PROVIDER=edgeone-blob
EDGEONE_BLOB_STORE=reports-poc
EDGEONE_PROJECT_ID=pages-heyujty4ymg1
EDGEONE_API_TOKEN=your_edgeone_pages_api_token
EDGEONE_BLOB_CONSISTENCY=strong
EDGEONE_REQUEST_TIMEOUT_MS=15000
```

## 设计取舍

- 本轮只覆盖报告文件，不迁移病例影像与头像
- Edge Functions 目录仍可保留为实验性边缘分发原型，但不作为正式主链路
- 历史报告不做批量回迁，继续按 `storage_provider` 区分新旧下载逻辑

## 已验证结果

- 使用官方 SDK 外部模式已成功跑通 `list / set / get / getMetadata / delete`
- 强一致读取模式下，写后即读可用
- 1MB 二进制对象可正常回环

## 已知注意事项

- Blob 对同一个 key 的覆盖保护不应依赖 `onlyIfNew`
- 正式实现通过“高随机性唯一 key + 写后元信息校验 + 失败回收”降低覆盖与脏对象风险

返回：[更新日志](更新日志)
