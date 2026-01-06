---
description: 文档工具包（.docx）。创建/编辑文档、跟踪修改、批注、格式保留、文本提取，用于专业文档处理。
---

# DOCX 创建、编辑和分析

## 概述

.docx 文件是包含 XML 文件和资源的 ZIP 归档。使用文本提取、原始 XML 访问或红线标记工作流创建、编辑或分析 Word 文档。适用于专业文档处理、跟踪修改和内容操作。

---

## 工作流决策树

### 读取/分析内容

使用下方"文本提取"或"原始 XML 访问"部分

### 创建新文档

使用"创建新 Word 文档"工作流

### 编辑现有文档

- **自己的文档 + 简单修改**
  使用"基础 OOXML 编辑"工作流

- **他人的文档**
  使用 **"红线标记工作流"**（推荐默认）

- **法律、学术、商业或政府文档**
  使用 **"红线标记工作流"**（必需）

---

## 读取和分析内容

### 文本提取

使用 pandoc 将文档转换为 markdown 读取文本内容：

```bash
# 转换文档为 markdown 并保留跟踪修改
pandoc --track-changes=all path-to-file.docx -o output.md
# 选项：--track-changes=accept/reject/all
```

### 原始 XML 访问

原始 XML 访问用于：批注、复杂格式、文档结构、嵌入媒体和元数据。对于这些功能，解压文档并读取原始 XML 内容。

#### 解压文件

使用 `run_command` 执行以下命令：

```bash
python {工作区根目录}/.agent/resources/docx/scripts/ooxml/unpack.py <office_file> <output_directory>
```

#### 关键文件结构

- `word/document.xml` - 主文档内容
- `word/comments.xml` - 在 document.xml 中引用的批注
- `word/media/` - 嵌入的图片和媒体文件
- 跟踪修改使用 `<w:ins>`（插入）和 `<w:del>`（删除）标签

---

## 创建新 Word 文档

从头创建新 Word 文档时，使用 **docx-js**（通过 JavaScript/TypeScript 创建 Word 文档的库）。

### 工作流

1. **必须 - 阅读完整文件**：请使用 `view_file` 读取：`{工作区根目录}/.agent/resources/docx/references/docx-js.md`（约 500 行）。了解详细语法、关键格式规则和最佳实践。
2. 使用 Document、Paragraph、TextRun 组件创建 JavaScript/TypeScript 文件（假设所有依赖已安装，如未安装参考下方依赖部分）
3. 使用 Packer.toBuffer() 导出为 .docx

---

## 编辑现有 Word 文档

编辑现有 Word 文档时，使用 **Document 库**（用于 OOXML 操作的 Python 库）。

### 工作流

1. **必须 - 阅读完整文件**：请使用 `view_file` 读取：`{工作区根目录}/.agent/resources/docx/references/ooxml.md`（约 600 行）。了解 Document 库 API 和直接编辑文档文件的 XML 模式。
2. 解压文档（使用 `run_command`）：
   ```bash
   python {工作区根目录}/.agent/resources/docx/scripts/ooxml/unpack.py <office_file> <output_directory>
   ```
3. 创建并运行使用 Document 库的 Python 脚本
4. 打包最终文档：
   ```bash
   python {工作区根目录}/.agent/resources/docx/scripts/ooxml/pack.py <input_directory> <office_file>
   ```

---

## 红线标记工作流

此工作流允许在实施 OOXML 之前使用 markdown 规划全面的跟踪修改。

**批处理策略**：将相关修改分组为 3-10 个修改的批次。这使调试可控同时保持效率。在进入下一批次前测试每个批次。

**原则：最小化、精确编辑**
实施跟踪修改时，只标记实际改变的文本。重复未改变的文本会使编辑难以审阅且显得不专业。将替换分解为：[未改变文本] + [删除] + [插入] + [未改变文本]。

示例 - 将句子中的"30 days"改为"60 days"：

```python
# 差 - 替换整个句子
'<w:del><w:r><w:delText>The term is 30 days.</w:delText></w:r></w:del><w:ins><w:r><w:t>The term is 60 days.</w:t></w:r></w:ins>'

# 好 - 只标记变化的部分
'<w:r w:rsidR="00AB12CD"><w:t>The term is </w:t></w:r><w:del><w:r><w:delText>30</w:delText></w:r></w:del><w:ins><w:r><w:t>60</w:t></w:r></w:ins><w:r w:rsidR="00AB12CD"><w:t> days.</w:t></w:r>'
```

### 跟踪修改工作流

1. **获取 markdown 表示**：

   ```bash
   pandoc --track-changes=all path-to-file.docx -o current.md
   ```

2. **识别并分组修改**：审阅文档并识别所有需要的修改，按逻辑批次组织

3. **阅读文档并解压**：
   - 请使用 `view_file` 读取：`{工作区根目录}/.agent/resources/docx/references/ooxml.md`
   - 解压文档：
     ```bash
     python {工作区根目录}/.agent/resources/docx/scripts/ooxml/unpack.py <file.docx> <dir>
     ```

4. **分批实施修改**：使用 `get_node` 查找节点，实施修改，然后 `doc.save()`

5. **打包文档**：

   ```bash
   python {工作区根目录}/.agent/resources/docx/scripts/ooxml/pack.py unpacked reviewed-document.docx
   ```

6. **最终验证**：
   ```bash
   pandoc --track-changes=all reviewed-document.docx -o verification.md
   grep "original phrase" verification.md  # 不应找到
   grep "replacement phrase" verification.md  # 应找到
   ```

---

## 文档转图片

```bash
# 1. DOCX 转 PDF
soffice --headless --convert-to pdf document.docx

# 2. PDF 转 JPEG
pdftoppm -jpeg -r 150 document.pdf page
```

---

## 依赖

所需依赖（如未安装请安装）：

- **pandoc**：`sudo apt-get install pandoc`（用于文本提取）
- **docx**：`npm install -g docx`（用于创建新文档）
- **LibreOffice**：`sudo apt-get install libreoffice`（用于 PDF 转换）
- **Poppler**：`sudo apt-get install poppler-utils`（用于 pdftoppm 转换 PDF 为图片）
- **defusedxml**：`pip install defusedxml`（用于安全 XML 解析）
