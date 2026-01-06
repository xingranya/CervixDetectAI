---
description: PDF 操作工具包。文本/表格提取、创建 PDF、合并/拆分、填写表单，用于程序化文档处理和分析。
---

# PDF 处理指南

## 概述

使用 Python 库和命令行工具提取文本/表格、创建 PDF、合并/拆分文件、填写表单。适用于程序化文档处理和分析。高级功能或表单填写请参阅参考文档。

---

## 快速开始

```python
from pypdf import PdfReader, PdfWriter

# 读取 PDF
reader = PdfReader("document.pdf")
print(f"页数: {len(reader.pages)}")

# 提取文本
text = ""
for page in reader.pages:
    text += page.extract_text()
```

---

## Python 库

### pypdf - 基础操作

#### 合并 PDF

```python
from pypdf import PdfWriter, PdfReader

writer = PdfWriter()
for pdf_file in ["doc1.pdf", "doc2.pdf", "doc3.pdf"]:
    reader = PdfReader(pdf_file)
    for page in reader.pages:
        writer.add_page(page)

with open("merged.pdf", "wb") as output:
    writer.write(output)
```

#### 拆分 PDF

```python
reader = PdfReader("input.pdf")
for i, page in enumerate(reader.pages):
    writer = PdfWriter()
    writer.add_page(page)
    with open(f"page_{i+1}.pdf", "wb") as output:
        writer.write(output)
```

#### 提取元数据

```python
reader = PdfReader("document.pdf")
meta = reader.metadata
print(f"标题: {meta.title}")
print(f"作者: {meta.author}")
```

#### 旋转页面

```python
reader = PdfReader("input.pdf")
writer = PdfWriter()

page = reader.pages[0]
page.rotate(90)  # 顺时针旋转 90 度
writer.add_page(page)

with open("rotated.pdf", "wb") as output:
    writer.write(output)
```

### pdfplumber - 文本和表格提取

#### 带布局文本提取

```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        print(text)
```

#### 提取表格

```python
with pdfplumber.open("document.pdf") as pdf:
    for i, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        for j, table in enumerate(tables):
            print(f"第 {i+1} 页表格 {j+1}:")
            for row in table:
                print(row)
```

#### 高级表格提取

```python
import pandas as pd

with pdfplumber.open("document.pdf") as pdf:
    all_tables = []
    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            if table:
                df = pd.DataFrame(table[1:], columns=table[0])
                all_tables.append(df)

if all_tables:
    combined_df = pd.concat(all_tables, ignore_index=True)
    combined_df.to_excel("extracted_tables.xlsx", index=False)
```

### reportlab - 创建 PDF

#### 基础 PDF 创建

```python
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

c = canvas.Canvas("hello.pdf", pagesize=letter)
width, height = letter

c.drawString(100, height - 100, "Hello World!")
c.drawString(100, height - 120, "使用 reportlab 创建的 PDF")
c.line(100, height - 140, 400, height - 140)
c.save()
```

---

## 命令行工具

### pdftotext (poppler-utils)

```bash
# 提取文本
pdftotext input.pdf output.txt

# 保留布局提取文本
pdftotext -layout input.pdf output.txt

# 提取特定页面
pdftotext -f 1 -l 5 input.pdf output.txt  # 第 1-5 页
```

### qpdf

```bash
# 合并 PDF
qpdf --empty --pages file1.pdf file2.pdf -- merged.pdf

# 拆分页面
qpdf input.pdf --pages . 1-5 -- pages1-5.pdf

# 旋转页面
qpdf input.pdf output.pdf --rotate=+90:1

# 移除密码
qpdf --password=mypassword --decrypt encrypted.pdf decrypted.pdf
```

---

## 常见任务

### 扫描 PDF 提取文本 (OCR)

```python
# 需要: pip install pytesseract pdf2image
import pytesseract
from pdf2image import convert_from_path

images = convert_from_path('scanned.pdf')
text = ""
for i, image in enumerate(images):
    text += f"第 {i+1} 页:\n"
    text += pytesseract.image_to_string(image)
    text += "\n\n"
print(text)
```

### 添加水印

```python
from pypdf import PdfReader, PdfWriter

watermark = PdfReader("watermark.pdf").pages[0]
reader = PdfReader("document.pdf")
writer = PdfWriter()

for page in reader.pages:
    page.merge_page(watermark)
    writer.add_page(page)

with open("watermarked.pdf", "wb") as output:
    writer.write(output)
```

### 提取图片

```bash
# 使用 pdfimages (poppler-utils)
pdfimages -j input.pdf output_prefix
```

### 密码保护

```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("input.pdf")
writer = PdfWriter()

for page in reader.pages:
    writer.add_page(page)

writer.encrypt("userpassword", "ownerpassword")

with open("encrypted.pdf", "wb") as output:
    writer.write(output)
```

---

## 快速参考

| 任务          | 最佳工具         | 命令/代码                  |
| ------------- | ---------------- | -------------------------- |
| 合并 PDF      | pypdf            | `writer.add_page(page)`    |
| 拆分 PDF      | pypdf            | 每页一个文件               |
| 提取文本      | pdfplumber       | `page.extract_text()`      |
| 提取表格      | pdfplumber       | `page.extract_tables()`    |
| 创建 PDF      | reportlab        | Canvas 或 Platypus         |
| 命令行合并    | qpdf             | `qpdf --empty --pages ...` |
| OCR 扫描 PDF  | pytesseract      | 先转为图片                 |
| 填写 PDF 表单 | pdf-lib 或 pypdf | 参见 forms.md              |

---

## 后续步骤

- 高级 pypdfium2 用法请使用 `view_file` 读取：`{工作区根目录}/.agent/resources/pdf/references/reference.md`
- 如需填写 PDF 表单请使用 `view_file` 读取：`{工作区根目录}/.agent/resources/pdf/references/forms.md`
