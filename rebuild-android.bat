@echo off
chcp 65001 >nul
echo ========================================
echo    重新构建 Android APK
echo ========================================
echo.

:: 确保使用正确的API地址
set VITE_API_BASE_URL=http://182.140.180.9:26140/api

echo [1/5] 清理旧文件...
if exist dist\capacitor\android rmdir /s /q dist\capacitor\android
if exist dist\capacitor\assets rmdir /s /q dist\capacitor\assets
if exist dist\capacitor\icons rmdir /s /q dist\capacitor\icons
if exist dist\capacitor\fonts rmdir /s /q dist\capacitor\fonts
del /q dist\capacitor\*.* 2>nul
echo     ✅ 清理完成
echo.

echo [2/5] 检查 dist\spa 构建...
if not exist dist\spa\index.html (
    echo     未找到已构建的SPA,开始构建...
    call quasar build
    if errorlevel 1 (
        echo     ❌ 构建失败
        pause
        exit /b 1
    )
) else (
    echo     ✅ 发现已有构建,跳过
)
echo.

echo [3/5] 复制Web资源到Capacitor目录...
if not exist dist\capacitor mkdir dist\capacitor
xcopy /s /e /y /q dist\spa\* dist\capacitor\
if errorlevel 1 (
    echo     ❌ 复制失败
    pause
    exit /b 1
)
echo     ✅ 复制完成
echo.

echo [4/5] 验证文件...
if exist dist\capacitor\index.html (
    echo     ✅ index.html 存在
) else (
    echo     ❌ index.html 不存在!
    pause
    exit /b 1
)

if exist dist\capacitor\assets (
    echo     ✅ assets 目录存在
) else (
    echo     ⚠️ assets 目录不存在
)
echo.

echo [5/5] 同步到Android项目...
cd src-capacitor
call npx cap sync android
if errorlevel 1 (
    echo     ❌ 同步失败
    cd ..
    pause
    exit /b 1
)
cd ..
echo     ✅ 同步完成
echo.

echo ========================================
echo    ✅ Android项目已准备完成!
echo ========================================
echo.
echo 接下来请:
echo 1. 使用Android Studio打开: %CD%\src-capacitor\android
echo 2. 等待Gradle同步完成
echo 3. 点击 Run 'app' 或 Build APK
echo.
echo 或者使用命令行:
echo    cd src-capacitor\android
echo    gradlew.bat assembleDebug
echo.
pause
