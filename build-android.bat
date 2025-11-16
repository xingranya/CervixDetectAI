@echo off
chcp 65001 >nul
echo ========================================
echo    CervixDetectAI Android APK 构建脚本
echo ========================================
echo.

echo [1/6] 清理旧的构建文件...
if exist dist\capacitor rmdir /s /q dist\capacitor

echo [2/6] 构建Web应用...
call quasar build
if errorlevel 1 (
    echo ❌ 构建失败!
    pause
    exit /b 1
)

echo [3/6] 创建Capacitor目录结构...
if not exist dist\capacitor mkdir dist\capacitor
xcopy /s /e /y dist\spa\* dist\capacitor\

echo [4/6] 安装Capacitor依赖...
cd src-capacitor
if not exist node_modules (
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败!
        cd ..
        pause
        exit /b 1
    )
)

echo [5/6] 添加Android平台...
if not exist android (
    call npx cap add android
    if errorlevel 1 (
        echo ❌ Android平台添加失败!
        cd ..
        pause
        exit /b 1
    )
) else (
    echo    Android平台已存在,跳过添加
)

echo [6/6] 同步代码到Android项目...
call npx cap sync android
if errorlevel 1 (
    echo ❌ 同步失败!
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo    ✅ 构建准备完成!
echo ========================================
echo.
echo 📱 接下来有两种方式构建APK:
echo.
echo 【方式1】 使用Android Studio (推荐,首次构建)
echo    1. 用Android Studio打开: %CD%\src-capacitor\android
echo    2. 等待Gradle同步完成
echo    3. Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
echo    4. APK位置: src-capacitor\android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo 【方式2】 使用Gradle命令行 (快速,已安装SDK)
echo    运行: cd src-capacitor\android ^&^& gradlew assembleDebug
echo.
pause
