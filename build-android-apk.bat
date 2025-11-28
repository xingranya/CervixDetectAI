@echo off
chcp 65001 >nul
echo ========================================
echo    CervixDetectAI Android APK 构建脚本
echo    (自动配置生产环境API地址)
echo ========================================
echo.

:: 设置环境变量 - 这个会被 Quasar 构建过程读取
set VITE_API_BASE_URL=http://182.140.180.9:26140/api
set VITE_MAX_FILE_SIZE=10485760
set VITE_SUPPORTED_IMAGE_FORMATS=.jpg,.jpeg,.png,.tiff

echo [1/6] 环境配置
echo     API地址: %VITE_API_BASE_URL%
echo.

echo [2/6] 清理旧的构建文件...
if exist dist\capacitor rmdir /s /q dist\capacitor
echo.

echo [3/6] 构建Web应用(SPA模式)...
echo     这可能需要几分钟时间,请耐心等待...
call quasar build
if errorlevel 1 (
    echo.
    echo ❌ 构建失败!请检查错误信息
    pause
    exit /b 1
)
echo.

echo [4/6] 准备Capacitor目录...
if not exist dist\capacitor mkdir dist\capacitor
echo     正在复制Web资源到Capacitor目录...
xcopy /s /e /y /i dist\spa\* dist\capacitor\
if errorlevel 1 (
    echo     ❌ 文件复制失败
    pause
    exit /b 1
)
echo     ✅ Web资源准备完成
echo.

echo [5/6] 同步到Android项目...
cd src-capacitor
if not exist android (
    echo     首次构建,添加Android平台...
    call npx cap add android
    if errorlevel 1 (
        echo     ❌ 添加Android平台失败
        cd ..
        pause
        exit /b 1
    )
)

echo     正在同步文件到Android项目...
call npx cap sync android
if errorlevel 1 (
    echo     ❌ 同步失败
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo [6/6] 使用Gradle构建APK...
echo     正在编译Android APK,这可能需要几分钟...
cd src-capacitor\android
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo.
    echo ❌ APK构建失败!
    echo.
    echo 💡 如果您没有配置Android SDK,请使用Android Studio:
    echo    1. 打开Android Studio
    echo    2. Open项目: %CD%
    echo    3. Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
    cd ..\..
    pause
    exit /b 1
)
cd ..\..
echo.

echo ========================================
echo    🎉 构建完成!
echo ========================================
echo.
echo 📦 APK文件位置:
echo    src-capacitor\android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo 📱 安装到设备:
echo    1. 使用USB连接手机
echo    2. 开启USB调试
echo    3. 运行: adb install -r src-capacitor\android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo 或者直接将APK文件传输到手机安装
echo.
pause
