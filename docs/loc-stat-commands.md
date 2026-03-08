# 代码行数统计命令

## 1) 统计代码 + 文档（包含 Markdown 与 wiki）

```powershell
cloc . --exclude-dir=node_modules,dist,build,.git,.quasar,coverage --include-ext=ts,tsx,js,jsx,vue,css,scss,html,sql,py,java,go,rs,sh,yml,yaml,json,md
```

## 2) 仅统计代码（不含 Markdown，且排除 wiki）

```powershell
cloc . --exclude-dir=wiki,node_modules,dist,build,.git,.quasar,coverage --include-ext=ts,tsx,js,jsx,vue,css,scss,html,sql,py,java,go,rs,sh,yml,yaml,json
```
