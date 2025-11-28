@echo off
chcp 65001 >nul
echo ========================================
echo    验证构建后的API地址配置
echo ========================================
echo.

echo 正在检查构建后的文件中的API地址...
echo.

if exist dist\capacitor\assets (
    echo 📂 检查 dist\capacitor\assets 目录下的 JS 文件:
    findstr /s /i "182.140.180.9" dist\capacitor\assets\*.js
    if errorlevel 1 (
        echo ⚠️ 未找到生产环境API地址
        echo.
        echo 正在查找所有API地址配置:
        findstr /s /i "VITE_API_BASE_URL\|localhost:3000\|/api" dist\capacitor\assets\*.js | findstr /v "sourceMappingURL"
    ) else (
        echo.
        echo ✅ 找到生产环境API地址配置!
    )
) else (
    echo ❌ 错误: 找不到构建输出目录
    echo 请先运行构建命令
)

echo.
pause
