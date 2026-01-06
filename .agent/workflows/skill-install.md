---
description: 从 GitHub 仓库安装 Claude skills 并进行自动安全扫描。当用户想从 GitHub URL 安装 skills、浏览仓库中的可用 skills 或安全添加新 skills 时触发。
---

# Skill 安装器

## 概述

从 GitHub 仓库安装 Claude skills，内置安全扫描以防止恶意代码、后门和漏洞。

## 使用场景

当用户出现以下情况时触发此 Skill：

- 提供 GitHub 仓库 URL 并想安装 skills
- 请求"从 GitHub 安装 skills"
- 想浏览并选择仓库中的 skills
- 需要向 Claude 环境添加新 skills

---

## 工作流

### 步骤 1：解析 GitHub URL

接受用户提供的 GitHub 仓库 URL。URL 应指向包含 `skills/` 目录的仓库。

支持的 URL 格式：

- `https://github.com/user/repo`
- `https://github.com/user/repo/tree/main/skills`
- `https://github.com/user/repo/tree/branch-name/skills`

提取：

- 仓库所有者
- 仓库名称
- 分支（未指定时默认为 `main`）

### 步骤 2：获取 Skills 列表

使用 `read_url_content` 或 `browser_subagent` 从 GitHub 检索 skills 目录列表。

GitHub API 端点格式：

```
https://api.github.com/repos/{owner}/{repo}/contents/skills?ref={branch}
```

解析响应提取：

- Skill 目录名称
- 每个 skill 应是包含 SKILL.md 文件的子目录

### 步骤 3：向用户展示 Skills

使用 `notify_user` 让用户选择要安装的 skills。

展示每个 skill 的：

- Skill 名称（目录名）
- 简要描述（如果 SKILL.md frontmatter 中有）

### 步骤 4：获取 Skill 内容

对于每个选中的 skill，获取 skill 目录中的所有文件：

1. 获取 skill 目录的文件树
2. 下载所有文件（SKILL.md、scripts/、references/、assets/）
3. 存储完整 skill 内容用于安全分析

### 步骤 5：安全扫描

**关键**：安装前对每个 skill 进行彻底的安全分析。

请使用 `view_file` 读取安全扫描提示词模板：`{工作区根目录}/.agent/resources/skill-install/references/security_scan_prompt.md`

检查项目：

1. **恶意命令执行** - eval、exec、subprocess 带 shell=True
2. **后门检测** - 混淆代码、可疑网络请求
3. **凭证窃取** - 访问 ~/.ssh、~/.aws、环境变量
4. **未授权网络访问** - 向可疑域名发出外部请求
5. **文件系统滥用** - 破坏性操作、未授权写入
6. **权限提升** - sudo 尝试、系统修改
7. **供应链攻击** - 可疑包安装

输出安全分析：

- 安全状态：SAFE / WARNING / DANGEROUS
- 风险级别：LOW / MEDIUM / HIGH / CRITICAL
- 详细发现及文件位置和严重性
- 建议：APPROVE / APPROVE_WITH_WARNINGS / REJECT

### 步骤 6：用户决策

根据安全扫描结果：

**如果 SAFE（APPROVE）**：

- 直接进行安装

**如果 WARNING（APPROVE_WITH_WARNINGS）**：

- 向用户显示安全警告
- 确认："检测到安全警告。是否继续安装？"
- 选项："是，仍然安装" / "否，跳过此 skill"

**如果 DANGEROUS（REJECT）**：

- 显示关键安全问题
- 拒绝安装
- 解释为何 skill 危险
- **不要**为 CRITICAL 严重性问题提供覆盖选项

### 步骤 7：安装 Skills

对于批准的 skills，安装到 `~/.claude/skills/`：

1. 创建 skill 目录：`~/.claude/skills/{skill_name}/`
2. 写入所有 skill 文件保持目录结构
3. 确保正确的文件权限（脚本可执行）
4. 验证 SKILL.md 存在且有有效 frontmatter

### 步骤 8：确认

安装后，提供摘要：

- 成功安装的 skills 列表
- 跳过的 skills 列表（如有）及原因
- 位置：`~/.claude/skills/`
- 后续步骤："Skills 现在可用。重启 Claude 或直接使用。"

---

## 示例用法

**用户**："从 https://github.com/example/claude-skills 安装 skills"

**助手**：

1. 从仓库获取 skills 列表
2. 展示可用 skills："skill-a"、"skill-b"、"skill-c"
3. 用户选择"skill-a"和"skill-b"
4. 对每个 skill 进行安全扫描
5. skill-a：SAFE - 继续安装
6. skill-b：WARNING（发出 HTTP 请求）- 询问用户确认
7. 将批准的 skills 安装到 ~/.claude/skills/
8. 确认："成功安装：skill-a, skill-b"

---

## 安全注意事项

- **永不跳过安全扫描** - 安装前始终分析 skills
- **保守处理** - 如有疑问，标记为 WARNING 让用户决定
- **关键问题阻塞** - CRITICAL 严重性发现不能被覆盖
- **透明度** - 始终向用户展示安全扫描发现
- **沙箱提醒** - 提醒用户 skills 以 Claude 权限运行
