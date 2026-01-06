---
description: 演示文稿工具包（.pptx）。创建/编辑幻灯片、布局、内容、演讲者注释、批注，用于程序化演示文稿创建和修改。
---

# PPTX 创建、编辑和分析

## 概述

.pptx 文件是包含 XML 文件和资源的 ZIP 归档。使用文本提取、原始 XML 访问或 html2pptx 工作流创建、编辑或分析 PowerPoint 演示文稿。

---

## 读取和分析内容

### 文本提取

```bash
# 转换文档为 markdown
python -m markitdown path-to-file.pptx
```

### 原始 XML 访问

原始 XML 访问用于：批注、演讲者注释、幻灯片布局、动画、设计元素和复杂格式。

#### 解压文件

使用 `run_command` 执行：

```bash
python {工作区根目录}/.agent/resources/pptx/scripts/ooxml/unpack.py <office_file> <output_dir>
```

#### 关键文件结构

- `ppt/presentation.xml` - 主演示文稿元数据和幻灯片引用
- `ppt/slides/slide{N}.xml` - 各幻灯片内容
- `ppt/notesSlides/notesSlide{N}.xml` - 各幻灯片演讲者注释
- `ppt/comments/modernComment_*.xml` - 特定幻灯片的批注
- `ppt/slideLayouts/` - 幻灯片布局模板
- `ppt/slideMasters/` - 主幻灯片模板
- `ppt/theme/` - 主题和样式信息
- `ppt/media/` - 图片和其他媒体文件

---

## 创建新演示文稿（无模板）

使用 **html2pptx** 工作流将 HTML 幻灯片转换为 PowerPoint。

### 设计原则

**关键**：创建任何演示文稿前，分析内容并选择适当的设计元素：

1. **考虑主题**：演示文稿关于什么？暗示什么语气、行业或情绪？
2. **检查品牌**：如果用户提到公司/组织，考虑其品牌颜色和标识
3. **匹配调色板与内容**：选择反映主题的颜色
4. **说明方法**：在编写代码前解释设计选择

**要求**：

- ✅ 编写代码前说明内容驱动的设计方法
- ✅ 仅使用网页安全字体：Arial, Helvetica, Times New Roman, Georgia, Courier New, Verdana, Tahoma, Trebuchet MS, Impact
- ✅ 通过大小、粗细和颜色创建清晰的视觉层次
- ✅ 确保可读性：强对比度、适当大小的文字、整洁对齐
- ✅ 保持一致：在幻灯片间重复模式、间距和视觉语言

### 工作流

1. **必须 - 阅读完整文件**：请使用 `view_file` 读取：`{工作区根目录}/.agent/resources/pptx/references/html2pptx.md`
2. 为每张幻灯片创建具有适当尺寸的 HTML 文件（如 16:9 为 720pt × 405pt）
3. 创建并运行使用 html2pptx.js 库的 JavaScript 文件
4. **视觉验证**：生成缩略图并检查布局问题
   ```bash
   python {工作区根目录}/.agent/resources/pptx/scripts/thumbnail.py output.pptx workspace/thumbnails --cols 4
   ```

---

## 编辑现有演示文稿

### 工作流

1. **必须 - 阅读完整文件**：请使用 `view_file` 读取：`{工作区根目录}/.agent/resources/pptx/references/ooxml.md`
2. 解压演示文稿：
   ```bash
   python {工作区根目录}/.agent/resources/pptx/scripts/ooxml/unpack.py <office_file> <output_dir>
   ```
3. 编辑 XML 文件（主要是 `ppt/slides/slide{N}.xml`）
4. **关键**：每次编辑后立即验证：
   ```bash
   python {工作区根目录}/.agent/resources/pptx/scripts/ooxml/validate.py <dir> --original <file>
   ```
5. 打包最终演示文稿：
   ```bash
   python {工作区根目录}/.agent/resources/pptx/scripts/ooxml/pack.py <input_directory> <office_file>
   ```

---

## 使用模板创建演示文稿

### 工作流

1. **提取模板文本并创建缩略图网格**：

   ```bash
   python -m markitdown template.pptx > template-content.md
   python {工作区根目录}/.agent/resources/pptx/scripts/thumbnail.py template.pptx
   ```

2. **分析模板并保存清单**：
   创建 `template-inventory.md` 包含幻灯片索引和布局描述
3. **基于模板清单创建演示文稿大纲**：
   选择各内容部分的最佳布局，保存 `outline.md`

4. **使用 rearrange.py 复制、重排和删除幻灯片**：

   ```bash
   python {工作区根目录}/.agent/resources/pptx/scripts/rearrange.py template.pptx working.pptx 0,34,34,50,52
   ```

5. **使用 inventory.py 脚本提取所有文本**：

   ```bash
   python {工作区根目录}/.agent/resources/pptx/scripts/inventory.py working.pptx text-inventory.json
   ```

6. **生成替换文本并保存为 JSON**

7. **使用 replace.py 脚本应用替换**：
   ```bash
   python {工作区根目录}/.agent/resources/pptx/scripts/replace.py working.pptx replacement-text.json output.pptx
   ```

---

## 创建缩略图网格

```bash
python {工作区根目录}/.agent/resources/pptx/scripts/thumbnail.py template.pptx [output_prefix]
```

**功能**：

- 创建：`thumbnails.jpg`（或大型演示文稿的 `thumbnails-1.jpg`, `thumbnails-2.jpg` 等）
- 默认：5 列，每网格最多 30 张幻灯片
- 调整列数：`--cols 4`

---

## 幻灯片转图片

```bash
# 1. PPTX 转 PDF
soffice --headless --convert-to pdf template.pptx

# 2. PDF 转 JPEG
pdftoppm -jpeg -r 150 template.pdf slide
```

---

## 依赖

所需依赖：

- **markitdown**：`pip install "markitdown[pptx]"`（用于从演示文稿提取文本）
- **pptxgenjs**：`npm install -g pptxgenjs`（用于通过 html2pptx 创建演示文稿）
- **playwright**：`npm install -g playwright`（用于 html2pptx 中的 HTML 渲染）
- **sharp**：`npm install -g sharp`（用于 SVG 光栅化和图像处理）
- **LibreOffice**：`sudo apt-get install libreoffice`（用于 PDF 转换）
- **Poppler**：`sudo apt-get install poppler-utils`（用于 pdftoppm）
- **defusedxml**：`pip install defusedxml`（用于安全 XML 解析）
