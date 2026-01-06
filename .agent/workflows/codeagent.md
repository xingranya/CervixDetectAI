---
description: 执行 codeagent-wrapper 进行多后端 AI 代码任务。支持 Codex、Claude 和 Gemini 后端，使用 @语法 引用文件和结构化输出。
---

# Codeagent Wrapper 集成

## 概述

执行 codeagent-wrapper 命令，支持可插拔 AI 后端（Codex、Claude、Gemini）。支持通过 `@` 语法引用文件、并行任务执行和后端选择、可配置安全控制。

## 使用场景

- 需要深度理解的复杂代码分析
- 跨多文件的大规模重构
- 带后端选择的自动代码生成

## 使用方法

**HEREDOC 语法**（推荐）：

```bash
codeagent-wrapper - [working_dir] <<'EOF'
<任务内容>
EOF
```

**指定后端**：

```bash
codeagent-wrapper --backend claude - <<'EOF'
<任务内容>
EOF
```

**简单任务**：

```bash
codeagent-wrapper "简单任务" [working_dir]
codeagent-wrapper --backend gemini "简单任务"
```

## 后端说明

| 后端   | 命令               | 描述                 | 最适用于               |
| ------ | ------------------ | -------------------- | ---------------------- |
| codex  | `--backend codex`  | OpenAI Codex（默认） | 代码分析、复杂开发     |
| claude | `--backend claude` | Anthropic Claude     | 简单任务、文档、提示词 |
| gemini | `--backend gemini` | Google Gemini        | UI/UX 原型设计         |

### 后端选择指南

**Codex**（默认）：

- 深度代码理解和复杂逻辑实现
- 精确依赖跟踪的大规模重构
- 算法优化和性能调优
- 示例："分析 @src/core 的调用图并重构模块依赖结构"

**Claude**：

- 需求清晰的快速功能实现
- 技术文档、API 规范、README 生成
- 专业提示词工程（如产品需求、设计规范）
- 示例："为 @package.json 生成包含安装、使用和 API 文档的综合 README"

**Gemini**：

- UI 组件脚手架和布局原型
- 设计系统实现与风格一致性
- 带无障碍支持的交互元素生成
- 示例："创建带侧边导航和数据可视化卡片的响应式仪表板布局"

**后端切换**：

- 从 Codex 开始分析，切换到 Claude 处理文档，再用 Gemini 实现 UI
- 在并行模式下按任务选择后端以优化各自优势

## 参数说明

- `task`（必需）：任务描述，支持 `@file` 引用
- `working_dir`（可选）：工作目录（默认：当前目录）
- `--backend`（可选）：选择 AI 后端（codex/claude/gemini，默认：codex）
  - **注意**：Claude 后端仅在明确启用时添加 `--dangerously-skip-permissions`

## 返回格式

```
Agent 响应文本...

---
SESSION_ID: 019a7247-ac9d-71f3-89e2-a823dbd8fd14
```

## 恢复会话

```bash
# 使用默认后端恢复
codeagent-wrapper resume <session_id> - <<'EOF'
<后续任务>
EOF

# 使用指定后端恢复
codeagent-wrapper --backend claude resume <session_id> - <<'EOF'
<后续任务>
EOF
```

## 并行执行

**默认（摘要模式 - 上下文高效）：**

```bash
codeagent-wrapper --parallel <<'EOF'
---TASK---
id: task1
backend: codex
workdir: /path/to/dir
---CONTENT---
任务内容
---TASK---
id: task2
dependencies: task1
---CONTENT---
依赖任务
EOF
```

**完整输出模式（调试用）：**

```bash
codeagent-wrapper --parallel --full-output <<'EOF'
...
EOF
```

**输出模式**：

- **摘要**（默认）：包含变更、输出、验证和审查摘要的结构化报告
- **完整**（`--full-output`）：完整任务消息。仅在调试特定失败时使用

**按任务指定后端**：

```bash
codeagent-wrapper --parallel <<'EOF'
---TASK---
id: task1
backend: codex
workdir: /path/to/dir
---CONTENT---
分析代码结构
---TASK---
id: task2
backend: claude
dependencies: task1
---CONTENT---
根据分析设计架构
---TASK---
id: task3
backend: gemini
dependencies: task2
---CONTENT---
生成实现代码
EOF
```

**并发控制**：
设置 `CODEAGENT_MAX_PARALLEL_WORKERS` 限制并发任务（默认：无限制）。

## 环境变量

- `CODEX_TIMEOUT`：覆盖超时（毫秒，默认：7200000 = 2小时）
- `CODEAGENT_SKIP_PERMISSIONS`：控制 Claude CLI 权限检查
  - **Claude** 后端：设为 `true`/`1` 添加 `--dangerously-skip-permissions`（默认：禁用）
  - **Codex/Gemini** 后端：当前无效果
- `CODEAGENT_MAX_PARALLEL_WORKERS`：限制并行模式下的并发任务（默认：无限制，建议：8）

## 调用模式

**单任务**：

```
Bash 工具参数：
- command: codeagent-wrapper --backend <backend> - [working_dir] <<'EOF'
  <任务内容>
  EOF
- timeout: 7200000
- description: <简要描述>
```

**并行任务**：

```
Bash 工具参数：
- command: codeagent-wrapper --parallel --backend <backend> <<'EOF'
  ---TASK---
  id: task_id
  backend: <backend>  # 可选，覆盖全局设置
  workdir: /path
  dependencies: dep1, dep2
  ---CONTENT---
  任务内容
  EOF
- timeout: 7200000
- description: <简要描述>
```

## 安全最佳实践

- **Claude 后端**：默认启用权限检查
  - 跳过检查：设置 `CODEAGENT_SKIP_PERMISSIONS=true` 或传递 `--skip-permissions`
- **并发限制**：生产环境设置 `CODEAGENT_MAX_PARALLEL_WORKERS` 防止资源耗尽
- **自动化上下文**：此包装器专为 AI 驱动自动化设计，权限提示会阻塞执行
