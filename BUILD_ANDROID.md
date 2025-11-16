# Android APK 构建指南

## 前提条件

1. **安装 Android Studio**: https://developer.android.com/studio
2. **安装 JDK 17**: https://adoptium.net/
3. **配置环境变量**:
   - `ANDROID_HOME` = Android SDK 路径
   - `JAVA_HOME` = JDK 路径

## 快速构建步骤

### 方式1: 使用自动化脚本(推荐)

直接运行项目根目录的 `build-android.bat` 脚本:

```bash
build-android.bat
```

### 方式2: 手动构建

#### 步骤1: 构建Web应用

```bash
# 构建Capacitor版本
quasar build -m capacitor -T android
```

#### 步骤2: 初始化Capacitor

```bash
cd src-capacitor
npm install
npx cap add android
npx cap sync android
```

#### 步骤3: 在Android Studio中构建APK

1. 用Android Studio打开 `src-capacitor/android` 目录
2. 等待Gradle同步完成(首次可能需要10-20分钟)
3. 菜单: `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`
4. 构建完成后,APK位置:
   ```
   src-capacitor/android/app/build/outputs/apk/debug/app-debug.apk
   ```

### 方式3: 使用Gradle命令行构建(无需Android Studio)

```bash
cd src-capacitor/android
./gradlew assembleDebug
```

APK位置: `app/build/outputs/apk/debug/app-debug.apk`

## 配置说明

### API地址配置

已配置服务器地址: `http://36.50.226.32:26140`

- Web访问: `http://36.50.226.32:26140`
- API地址: `http://36.50.226.32:26140/api`

### App信息

- **App ID**: com.cervixdetectai.app
- **App名称**: CervixDetectAI
- **版本**: 0.0.1

## 常见问题

### 1. Gradle下载慢

编辑 `src-capacitor/android/gradle/wrapper/gradle-wrapper.properties`,
使用国内镜像:

```properties
distributionUrl=https://mirrors.cloud.tencent.com/gradle/gradle-8.0-bin.zip
```

### 2. SDK下载失败

在Android Studio中:
1. File > Settings > Appearance & Behavior > System Settings > Android SDK
2. 选择需要的SDK版本(推荐API 33)
3. Apply下载

### 3. 签名APK(发布版本)

```bash
cd src-capacitor/android
./gradlew assembleRelease
```

需要先配置签名密钥,参考: https://developer.android.com/studio/publish/app-signing

## 输出文件

- **Debug版APK**: `src-capacitor/android/app/build/outputs/apk/debug/app-debug.apk`
- **Release版APK**: `src-capacitor/android/app/build/outputs/apk/release/app-release.apk`

## 测试安装

```bash
# 通过ADB安装到已连接的设备
adb install app-debug.apk
```
