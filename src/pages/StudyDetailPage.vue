<template>
  <q-page class="q-pa-md app-gradient-page">
    <!-- Page Header -->
    <div class="row items-center q-mb-md border-bottom q-pb-md">
      <div class="col">
        <div class="text-h5 flex items-center text-weight-bold text-dark">
          <q-icon name="image_search" color="primary" class="q-mr-sm" />
          影像分析
        </div>
      </div>
    </div>

    <!-- AI分析结果卡片 - 优先显示 -->
    <div v-if="analysisResult" class="row q-mb-md">
      <div class="col-12">
        <q-card class="ai-result-card shadow-3 rounded-borders study-surface-card">
          <q-card-section
            class="row items-center justify-between q-px-md q-py-sm bg-white border-bottom-light"
          >
            <div class="text-subtitle1 text-weight-bold flex items-center text-grey-9">
              <q-icon name="psychology" class="q-mr-sm text-primary" size="20px" />
              AI诊断结果
            </div>
            <q-badge color="primary" rounded label="已完成" v-if="analysisResult" />
          </q-card-section>

          <q-card-section class="q-pa-md bg-grey-1">
            <div class="row q-col-gutter-md">
              <!-- Diagnosis Conclusion -->
              <div class="col-md-4 col-12">
                <div
                  class="bg-white q-pa-md rounded-borders shadow-1 h-full relative-position overflow-hidden"
                >
                  <div class="text-subtitle2 text-grey-7 q-mb-sm flex items-center">
                    <q-icon name="health_and_safety" class="q-mr-xs" />
                    诊断结论
                  </div>
                  <div
                    class="text-h4 text-weight-bold q-mb-sm"
                    :class="getRiskColorClass(analysisResult.diagnosis)"
                  >
                    {{ analysisResult.diagnosis }}
                  </div>
                  <q-badge
                    :color="getConfidenceBadgeColor(analysisResult.confidence)"
                    rounded
                    class="q-py-xs q-px-sm"
                  >
                    置信度: {{ Math.round(analysisResult.confidence * 100) }}%
                  </q-badge>
                  <!-- Decorative Background Icon -->
                  <q-icon
                    name="medical_services"
                    class="absolute-bottom-right text-grey-2 ai-diagnosis-bg-icon"
                  />
                </div>
              </div>

              <!-- Biomarkers -->
              <div class="col-md-4 col-12" v-if="analysisResult.biomarkers">
                <div class="bg-white q-pa-md rounded-borders shadow-1 h-full">
                  <div class="text-subtitle2 text-grey-7 q-mb-md flex items-center">
                    <q-icon name="biotech" class="q-mr-xs" />
                    生物标志物
                  </div>
                  <div class="q-gutter-y-sm">
                    <div
                      class="row items-center justify-between bg-grey-1 q-px-sm q-py-xs rounded-borders"
                    >
                      <span class="text-weight-medium text-grey-8">HPV</span>
                      <q-badge
                        :color="analysisResult.biomarkers.HPV === '阳性' ? 'negative' : 'positive'"
                        rounded
                        outline
                        :label="analysisResult.biomarkers.HPV"
                      />
                    </div>
                    <div
                      class="row items-center justify-between bg-grey-1 q-px-sm q-py-xs rounded-borders"
                    >
                      <span class="text-weight-medium text-grey-8">p16</span>
                      <span class="text-grey-7">{{ analysisResult.biomarkers.p16 }}</span>
                    </div>
                    <div
                      class="row items-center justify-between bg-grey-1 q-px-sm q-py-xs rounded-borders"
                    >
                      <span class="text-weight-medium text-grey-8">Ki67</span>
                      <span class="text-grey-7">{{ analysisResult.biomarkers.Ki67 }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Suspicious Areas -->
              <div class="col-md-4 col-12">
                <div class="bg-white q-pa-md rounded-borders shadow-1 h-full">
                  <div class="text-subtitle2 text-grey-7 q-mb-sm flex items-center">
                    <q-icon name="warning_amber" class="q-mr-xs" />
                    可疑区域
                  </div>
                  <div class="row items-baseline q-mb-sm">
                    <div class="text-h4 text-negative text-weight-bold q-mr-sm">
                      {{ analysisResult.suspiciousAreas?.length || 0 }}
                    </div>
                    <div class="text-grey-7">个高风险区域</div>
                  </div>
                  <q-scroll-area
                    class="suspicious-areas-scroll"
                    v-if="analysisResult.suspiciousAreas"
                  >
                    <div
                      v-for="(area, idx) in analysisResult.suspiciousAreas"
                      :key="idx"
                      class="text-caption text-grey-8 q-mb-xs"
                    >
                      <q-icon
                        name="fiber_manual_record"
                        size="6px"
                        color="negative"
                        class="q-mr-xs"
                      />
                      {{ idx + 1 }}. {{ area.description }}
                    </div>
                  </q-scroll-area>
                </div>
              </div>
            </div>
          </q-card-section>

          <!-- Recommendations -->
          <q-card-section
            v-if="analysisResult.recommendations?.length"
            class="bg-white border-top-light"
          >
            <div class="text-subtitle1 text-weight-bold text-grey-9 q-mb-md flex items-center">
              <q-icon name="recommend" class="q-mr-sm text-primary" />
              临床建议
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-12" v-for="(rec, idx) in analysisResult.recommendations" :key="idx">
                <div class="bg-blue-50 q-pa-sm rounded-borders flex items-center text-blue-10">
                  <q-icon name="check_circle" color="primary" class="q-mr-sm" size="sm" />
                  {{ rec }}
                </div>
              </div>
            </div>
          </q-card-section>

          <!-- Detailed Report -->
          <q-card-section
            v-if="analysisResult.detailedReport"
            class="bg-grey-1 border-top-light q-pa-none"
          >
            <q-expansion-item
              dense
              default-opened
              expand-separator
              icon="description"
              label="查看详细病理报告"
              header-class="text-grey-8 bg-white"
              class="bg-white"
            >
              <q-card flat class="bg-grey-1">
                <q-card-section class="q-pa-sm">
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <div
                    class="text-body2 text-grey-9 bg-white q-pa-md rounded-borders shadow-1 report-text-block detailed-report-markdown"
                    v-html="renderedDetailedReportHtml"
                  />
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </q-card-section>

          <!-- 生成报告操作栏 -->
          <q-card-section class="bg-white border-top-light">
            <div class="row items-center justify-between">
              <div class="text-subtitle2 text-grey-7 flex items-center">
                <q-icon name="file_download" class="q-mr-xs text-primary" />
                导出报告
              </div>
              <div class="row q-gutter-sm">
                <q-btn
                  unelevated
                  size="sm"
                  color="red"
                  icon="picture_as_pdf"
                  label="PDF"
                  @click="generateReport('pdf')"
                  :loading="generatingFormat === 'pdf'"
                  :disable="!!generatingFormat"
                />
                <q-btn
                  unelevated
                  size="sm"
                  color="blue"
                  icon="article"
                  label="Word"
                  @click="generateReport('word')"
                  :loading="generatingFormat === 'word'"
                  :disable="!!generatingFormat"
                />
                <q-btn
                  unelevated
                  size="sm"
                  color="green"
                  icon="table_chart"
                  label="Excel"
                  @click="generateReport('excel')"
                  :loading="generatingFormat === 'excel'"
                  :disable="!!generatingFormat"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Left Column: Image Upload & Preview -->
      <div class="col-lg-8 col-md-12">
        <!-- Image Upload Section (Hidden if image exists) -->
        <q-card flat bordered class="q-mb-md" v-if="!study?.imageUrl">
          <q-card-section class="row items-center justify-between q-pb-sm border-bottom-light">
            <div class="text-subtitle1 text-weight-bold flex items-center">
              <q-icon name="upload" class="q-mr-sm text-grey-7" />
              影像上传
            </div>
            <q-badge color="grey-3" text-color="grey-8" label="等待中" />
          </q-card-section>
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-md-6 col-12">
                <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">选择患者</div>
                <q-select
                  outlined
                  dense
                  v-model="selectedPatient"
                  :options="patientOptions"
                  label="请选择患者..."
                />
              </div>
              <div class="col-md-6 col-12">
                <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">影像类型</div>
                <q-select outlined dense v-model="imageType" :options="imageTypeOptions" />
              </div>
            </div>
            <div
              class="upload-area q-mt-md flex flex-center column cursor-pointer bg-grey-1 rounded-borders border-dashed"
              @click="triggerFileUpload"
            >
              <q-icon name="cloud_upload" size="xl" color="grey-5" class="q-mb-sm" />
              <div class="text-weight-bold text-grey-8">拖放影像文件至此</div>
              <div class="text-caption text-grey-6">或点击选择文件</div>
              <div class="text-caption text-grey-5 q-mt-sm">支持 JPG, PNG, TIFF, BMP 格式</div>
            </div>
            <input
              type="file"
              ref="fileInput"
              class="hidden"
              accept=".jpg,.jpeg,.png,.tif,.tiff,.bmp"
              @change="handleFileUpload"
            />
          </q-card-section>
        </q-card>

        <!-- Image Preview Section -->
        <q-card
          class="full-height shadow-3 rounded-borders study-surface-card"
          v-else
          ref="previewCardRef"
        >
          <!-- Header -->
          <q-card-section
            class="row items-center justify-between q-px-md q-py-sm bg-white border-bottom-light"
          >
            <div class="text-subtitle1 text-weight-bold flex items-center text-grey-9">
              <q-icon name="photo_library" class="q-mr-sm text-primary" size="20px" />
              影像预览与对比
            </div>
            <div class="row items-center q-gutter-xs">
              <q-btn
                flat
                dense
                round
                color="grey-7"
                icon="zoom_in"
                @click="zoomIn"
                class="hover-bg-grey-2"
              >
                <q-tooltip>放大原始影像</q-tooltip>
              </q-btn>
              <q-btn
                flat
                dense
                round
                color="grey-7"
                icon="zoom_out"
                @click="zoomOut"
                class="hover-bg-grey-2"
              >
                <q-tooltip>缩小原始影像</q-tooltip>
              </q-btn>
              <q-separator vertical inset class="q-mx-sm" />
              <q-btn
                flat
                dense
                round
                color="grey-7"
                icon="fullscreen"
                @click="toggleFullscreen"
                class="hover-bg-grey-2"
              >
                <q-tooltip>全屏模式</q-tooltip>
              </q-btn>
            </div>
          </q-card-section>

          <!-- Content -->
          <q-card-section class="q-pa-md bg-grey-1">
            <div class="row q-col-gutter-md">
              <!-- Original Image Panel -->
              <div class="col-md-6 col-12">
                <div class="image-panel-wrapper bg-white shadow-1 rounded-borders overflow-hidden">
                  <div
                    class="q-px-md q-py-sm text-caption text-weight-bold text-grey-8 border-bottom-light flex items-center bg-grey-1"
                  >
                    <q-icon name="image" class="q-mr-xs text-primary" />
                    原始影像
                  </div>
                  <div
                    class="image-container bg-grey-2 relative-position overflow-hidden"
                    :style="{ height: $q.fullscreen.isActive ? 'calc(100vh - 160px)' : '420px' }"
                  >
                    <img
                      :src="displayImageUrl"
                      class="fit object-contain"
                      :style="{
                        transform: `scale(${zoomLevel})`,
                        transition: 'transform 0.2s ease',
                      }"
                    />
                  </div>
                </div>
              </div>

              <!-- AI View Panel -->
              <div class="col-md-6 col-12">
                <div class="image-panel-wrapper bg-white shadow-1 rounded-borders overflow-hidden">
                  <div
                    class="q-px-md q-py-sm text-caption text-weight-bold text-grey-8 border-bottom-light flex items-center justify-between bg-grey-1"
                  >
                    <div class="flex items-center">
                      <q-icon name="auto_fix_high" class="q-mr-xs text-secondary" />
                      AI增强与标注视图
                    </div>
                    <q-badge color="secondary" label="实时分析" rounded outline class="q-px-sm" />
                  </div>
                  <div
                    class="annotated-view-container relative-position bg-grey-2"
                    :style="{ height: $q.fullscreen.isActive ? 'calc(100vh - 160px)' : '420px' }"
                  >
                    <ImageAnalyzer
                      v-if="displayImageUrl"
                      :src="displayImageUrl"
                      :initial-annotations="aiAnnotations"
                      @zoom="handleAiZoom"
                      @image-load="handleAnalyzerImageLoad"
                    />
                    <div v-else class="text-center q-pa-md text-grey flex flex-center full-height">
                      <div class="column flex-center">
                        <q-icon name="image_not_supported" size="40px" color="grey-4" />
                        <div class="q-mt-sm text-grey-6">暂无图像数据</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer Info Bar -->
            <div
              class="row justify-between items-center q-mt-md q-px-md q-py-sm bg-white shadow-1 rounded-borders text-caption text-grey-8"
            >
              <div class="flex items-center">
                <q-chip
                  dense
                  color="red-1"
                  text-color="negative"
                  icon="warning"
                  class="text-weight-bold q-ma-none"
                >
                  CIN2+ 疑似区域
                </q-chip>
              </div>

              <div class="flex items-center q-gutter-x-lg">
                <div class="flex items-center text-grey-7">
                  <q-icon name="straighten" class="q-mr-xs" /> 1cm = 240px
                </div>
                <div class="flex items-center text-grey-7">
                  <q-icon name="palette" class="q-mr-xs" /> sRGB (Enhanced)
                </div>

                <q-separator vertical inset />

                <div class="flex items-center q-gutter-x-md">
                  <div
                    class="flex items-center text-grey-9 bg-grey-2 q-px-sm q-py-xs rounded-borders"
                  >
                    <q-icon name="image" class="q-mr-xs text-primary" />
                    原始:
                    <span class="text-weight-bold q-ml-xs">{{ Math.round(zoomLevel * 100) }}%</span>
                  </div>
                  <div
                    class="flex items-center text-grey-9 bg-grey-2 q-px-sm q-py-xs rounded-borders"
                  >
                    <q-icon name="auto_fix_high" class="q-mr-xs text-secondary" />
                    AI:
                    <span class="text-weight-bold q-ml-xs"
                      >{{ Math.round(aiZoomLevel * 100) }}%</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Right Column: Controls & Stats -->
      <div class="col-lg-4 col-md-12">
        <!-- AI分析失败卡片 -->
        <q-card v-if="lastFailedTask && !isAnalyzing" flat bordered class="q-mb-md bg-red-1">
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold q-mb-sm text-negative">
              <q-icon name="error" class="q-mr-sm" color="negative" />
              AI分析失败
            </div>
            <div class="text-body2 text-grey-8 q-mb-md">
              {{ lastFailedTask.error || '未知错误，请重试' }}
            </div>
            <q-btn
              color="primary"
              icon="refresh"
              label="重新分析"
              @click="startAnalysis"
              :loading="isAnalyzing"
            />
          </q-card-section>
        </q-card>

        <!-- AI分析进度卡片（分析中时显示） - 置顶固定显示 -->
        <transition name="progress-card">
          <div v-if="isAnalyzing" class="analysis-progress-overlay">
            <q-card class="analysis-progress-card" :class="{ 'is-complete': isAnalyzingComplete }">
              <q-card-section class="q-pa-lg">
                <!-- 标题区域 -->
                <div class="row items-center q-mb-md">
                  <div
                    class="analysis-icon-container q-mr-md"
                    :class="{ 'complete-icon': isAnalyzingComplete }"
                  >
                    <transition name="icon-swap" mode="out-in">
                      <q-spinner-orbit
                        v-if="!isAnalyzingComplete"
                        color="white"
                        size="28px"
                        key="spin"
                      />
                      <q-icon v-else name="check_circle" color="white" size="28px" key="check" />
                    </transition>
                  </div>
                  <div class="col">
                    <div class="text-h6 text-white text-weight-bold">
                      {{ isAnalyzingComplete ? '分析完成！' : 'AI 智能分析中' }}
                    </div>
                    <div
                      class="text-caption"
                      :class="isAnalyzingComplete ? 'text-green-2' : 'text-light-blue-2'"
                    >
                      {{ progressStatus }}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="progress-percentage">
                      {{ Math.round(progress) }}<span class="percent-sign">%</span>
                    </div>
                  </div>
                </div>

                <!-- 进度条 -->
                <div class="progress-bar-container">
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" :style="{ width: `${progress}%` }"></div>
                    <div class="progress-bar-glow" :style="{ left: `${progress}%` }"></div>
                  </div>
                  <!-- 进度阶段指示器 -->
                  <div class="progress-stages">
                    <div
                      class="stage"
                      :class="{ active: progress >= 0, completed: progress >= 20 }"
                    >
                      <q-icon :name="progress >= 20 ? 'check_circle' : 'upload_file'" size="18px" />
                      <span>上传</span>
                    </div>
                    <div
                      class="stage"
                      :class="{ active: progress >= 20, completed: progress >= 50 }"
                    >
                      <q-icon
                        :name="progress >= 50 ? 'check_circle' : 'image_search'"
                        size="18px"
                      />
                      <span>预处理</span>
                    </div>
                    <div
                      class="stage"
                      :class="{ active: progress >= 50, completed: progress >= 80 }"
                    >
                      <q-icon :name="progress >= 80 ? 'check_circle' : 'psychology'" size="18px" />
                      <span>AI分析</span>
                    </div>
                    <div
                      class="stage"
                      :class="{ active: progress >= 80, completed: progress >= 100 }"
                    >
                      <q-icon :name="progress >= 100 ? 'check_circle' : 'summarize'" size="18px" />
                      <span>生成报告</span>
                    </div>
                  </div>
                </div>

                <!-- 预计时间 -->
                <div
                  class="row justify-between items-center q-mt-md text-light-blue-2 text-caption"
                >
                  <div>
                    <q-icon name="schedule" size="16px" class="q-mr-xs" />
                    预计剩余时间: {{ estimatedTimeRemaining }}
                  </div>
                  <q-btn
                    flat
                    dense
                    color="white"
                    label="取消"
                    icon="close"
                    size="sm"
                    @click="stopAnalysis"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </transition>

        <!-- 分析日志（移到右侧列） -->

        <!-- AI Control Panel -->
        <q-card class="q-mb-md shadow-3 rounded-borders study-surface-card analysis-progress">
          <q-card-section
            class="row items-center justify-between q-px-md q-py-sm bg-white border-bottom-light"
          >
            <div class="text-subtitle1 text-weight-bold flex items-center text-grey-9">
              <q-icon name="tune" class="q-mr-sm text-primary" size="20px" />
              分析参数配置
            </div>
            <q-btn
              unelevated
              rounded
              color="primary"
              icon="play_arrow"
              label="开始分析"
              @click="startAnalysis"
              :disable="isAnalyzing"
              class="q-px-md"
            />
          </q-card-section>

          <q-card-section class="q-pa-md bg-grey-1">
            <!-- Model Selection -->
            <div class="q-mb-md">
              <div class="text-caption text-weight-bold text-grey-8 q-mb-sm flex items-center">
                <q-icon name="psychology" class="q-mr-xs text-secondary" />
                分析模型
              </div>
              <q-select
                v-model="selectedModel"
                :options="[
                  '宫颈病变分割模型 v3.2 (高精度)',
                  '宫颈病变分割模型 v2.1 (快速)',
                  '细胞学分类模型 v4.0',
                ]"
                outlined
                dense
                bg-color="white"
                class="rounded-borders"
                behavior="menu"
              >
                <template v-slot:prepend>
                  <q-icon name="model_training" color="primary" />
                </template>
              </q-select>
            </div>

            <!-- Sliders -->
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-12 col-md-6">
                <div class="bg-white q-pa-sm rounded-borders shadow-1">
                  <div class="row justify-between items-center q-mb-xs">
                    <div class="text-caption text-grey-8">分割敏感度</div>
                    <q-badge color="primary" rounded :label="sensitivity" />
                  </div>
                  <q-slider
                    v-model="sensitivity"
                    :min="0"
                    :max="100"
                    color="primary"
                    label
                    dense
                    class="q-mt-xs"
                  />
                </div>
              </div>
              <div class="col-12 col-md-6">
                <div class="bg-white q-pa-sm rounded-borders shadow-1">
                  <div class="row justify-between items-center q-mb-xs">
                    <div class="text-caption text-grey-8">置信度阈值</div>
                    <q-badge color="secondary" rounded :label="confidenceThreshold + '%'" />
                  </div>
                  <q-slider
                    v-model="confidenceThreshold"
                    :min="0"
                    :max="100"
                    color="secondary"
                    label
                    dense
                    class="q-mt-xs"
                  />
                </div>
              </div>
            </div>

            <!-- Advanced Options (Toggle Cards) -->
            <div>
              <div class="text-caption text-weight-bold text-grey-8 q-mb-sm flex items-center">
                <q-icon name="settings_suggest" class="q-mr-xs text-orange" />
                高级增强选项
              </div>
              <div class="row q-col-gutter-sm">
                <!-- Nucleus Enhancement -->
                <div class="col-4">
                  <div
                    class="q-pa-sm rounded-borders cursor-pointer transition-all text-center border-light relative-position overflow-hidden"
                    :class="
                      advancedOptions.nucleusEnhancement
                        ? 'bg-primary text-white shadow-2'
                        : 'bg-white text-grey-7 hover-bg-grey-2'
                    "
                    @click="
                      advancedOptions.nucleusEnhancement = !advancedOptions.nucleusEnhancement
                    "
                    v-ripple
                  >
                    <q-icon name="grain" size="sm" class="q-mb-xs" />
                    <div class="text-caption text-weight-bold advanced-option-label">核质增强</div>
                    <q-icon
                      name="check_circle"
                      class="absolute-top-right q-ma-xs"
                      size="14px"
                      v-if="advancedOptions.nucleusEnhancement"
                    />
                  </div>
                </div>

                <!-- Overlap Separation -->
                <div class="col-4">
                  <div
                    class="q-pa-sm rounded-borders cursor-pointer transition-all text-center border-light relative-position overflow-hidden"
                    :class="
                      advancedOptions.overlapSeparation
                        ? 'bg-primary text-white shadow-2'
                        : 'bg-white text-grey-7 hover-bg-grey-2'
                    "
                    @click="advancedOptions.overlapSeparation = !advancedOptions.overlapSeparation"
                    v-ripple
                  >
                    <q-icon name="layers_clear" size="sm" class="q-mb-xs" />
                    <div class="text-caption text-weight-bold advanced-option-label">重叠分离</div>
                    <q-icon
                      name="check_circle"
                      class="absolute-top-right q-ma-xs"
                      size="14px"
                      v-if="advancedOptions.overlapSeparation"
                    />
                  </div>
                </div>

                <!-- Debris Filter -->
                <div class="col-4">
                  <div
                    class="q-pa-sm rounded-borders cursor-pointer transition-all text-center border-light relative-position overflow-hidden"
                    :class="
                      advancedOptions.debrisFilter
                        ? 'bg-primary text-white shadow-2'
                        : 'bg-white text-grey-7 hover-bg-grey-2'
                    "
                    @click="advancedOptions.debrisFilter = !advancedOptions.debrisFilter"
                    v-ripple
                  >
                    <q-icon name="filter_alt_off" size="sm" class="q-mb-xs" />
                    <div class="text-caption text-weight-bold advanced-option-label">杂质过滤</div>
                    <q-icon
                      name="check_circle"
                      class="absolute-top-right q-ma-xs"
                      size="14px"
                      v-if="advancedOptions.debrisFilter"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="q-mt-md analysis-progress-inline">
              <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">进度</div>
              <q-linear-progress
                :value="progress / 100"
                color="primary"
                class="q-mb-xs"
                size="8px"
                rounded
              />
              <div class="row justify-between text-caption text-grey-6">
                <span class="text-weight-bold">{{ Math.round(progress) }}%</span>
                <span>{{ progressStatus }}</span>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Lesion Visualization -->
        <!-- Lesion Visualization -->
        <q-card class="q-mb-md shadow-3 rounded-borders study-surface-card">
          <q-card-section
            class="row items-center justify-between q-px-md q-py-sm bg-white border-bottom-light"
          >
            <div class="text-subtitle1 text-weight-bold flex items-center text-grey-9">
              <q-icon name="scanner" class="q-mr-sm text-primary" size="20px" />
              病变特征识别结果
            </div>
            <q-btn flat round dense icon="download" color="grey-7" size="sm" aria-label="导出图表">
              <q-tooltip>导出图表</q-tooltip>
            </q-btn>
          </q-card-section>

          <q-card-section class="q-pa-md bg-grey-1">
            <div class="bg-white q-pa-sm rounded-borders shadow-1 q-mb-md">
              <div ref="chartRef" class="lesion-chart"></div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-4">
                <div
                  class="text-center bg-white q-pa-sm rounded-borders shadow-1 h-full flex column flex-center"
                >
                  <div class="text-h5 text-primary text-weight-bold q-mb-xs">
                    {{ analysisResult?.suspiciousAreas?.length || 0 }}
                  </div>
                  <div class="text-caption text-grey-7">疑似区域</div>
                </div>
              </div>
              <div class="col-4">
                <div
                  class="text-center bg-white q-pa-sm rounded-borders shadow-1 h-full flex column flex-center"
                >
                  <div class="text-h5 text-secondary text-weight-bold q-mb-xs">
                    {{ analysisResult?.confidence ? Math.round(analysisResult.confidence * 100) : 0
                    }}<span class="text-caption">%</span>
                  </div>
                  <div class="text-caption text-grey-7">置信度</div>
                </div>
              </div>
              <div class="col-4">
                <div
                  class="text-center bg-white q-pa-sm rounded-borders shadow-1 h-full flex column flex-center"
                >
                  <div
                    class="text-h6 text-weight-bold q-mb-xs"
                    :class="getRiskColorClass(analysisResult?.diagnosis)"
                  >
                    {{ analysisResult ? getRiskLevelText(analysisResult.diagnosis) : '-' }}
                  </div>
                  <div class="text-caption text-grey-7">风险等级</div>
                </div>
              </div>
            </div>

            <div
              class="bg-orange-1 q-pa-sm rounded-borders border-warning q-mt-md text-caption shadow-1"
            >
              <div class="flex items-center q-mb-xs">
                <div class="q-mr-sm bg-negative rounded-circle legend-dot"></div>
                <span class="text-brown-9 text-weight-bold">HSIL - 高置信度</span>
              </div>
              <div class="flex items-center q-mb-xs">
                <div class="q-mr-sm bg-warning rounded-circle legend-dot"></div>
                <span class="text-brown-9">LSIL - 中置信度</span>
              </div>
              <div class="flex items-center">
                <div class="q-mr-sm bg-primary rounded-circle legend-dot"></div>
                <span class="text-brown-9">醋酸白上皮 - 已识别</span>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Analysis Log -->
        <!-- Analysis Log -->
        <q-card class="shadow-3 rounded-borders study-surface-card">
          <q-card-section
            class="row items-center justify-between q-px-md q-py-sm bg-white border-bottom-light"
          >
            <div class="text-subtitle1 text-weight-bold flex items-center text-grey-9">
              <q-icon name="assignment" class="q-mr-sm text-primary" size="20px" />
              分析日志
            </div>
            <q-btn
              flat
              round
              dense
              icon="delete_outline"
              color="grey-7"
              size="sm"
              @click="logs = []"
            >
              <q-tooltip>清空日志</q-tooltip>
            </q-btn>
          </q-card-section>

          <q-card-section class="q-pa-none bg-grey-1">
            <q-scroll-area class="bg-white analysis-log-scroll-area">
              <q-list separator class="q-py-xs">
                <q-item v-for="(log, index) in logs" :key="index" class="q-py-sm hover-bg-grey-1">
                  <q-item-section avatar class="analysis-log-avatar">
                    <q-icon
                      :name="log.message.includes('完成') ? 'check_circle' : 'info'"
                      :color="log.message.includes('完成') ? 'positive' : 'primary'"
                      size="sm"
                    />
                  </q-item-section>
                  <q-item-section>
                    <div class="row items-center justify-between">
                      <div
                        class="text-caption text-grey-5 font-mono bg-grey-1 q-px-xs rounded-borders"
                      >
                        {{ log.time }}
                      </div>
                      <q-badge
                        :color="getConfidenceColor(log.confidence)"
                        :label="log.confidence + '%'"
                        rounded
                        size="sm"
                      />
                    </div>
                    <div class="text-body2 text-grey-9 q-mt-xs">{{ log.message }}</div>
                  </q-item-section>
                </q-item>
                <div
                  v-if="logs.length === 0"
                  class="text-center text-grey-5 q-pa-md flex flex-center analysis-log-empty"
                >
                  <div class="column flex-center">
                    <q-icon name="history" size="md" class="q-mb-sm" />
                    暂无日志记录
                  </div>
                </div>
              </q-list>
            </q-scroll-area>
          </q-card-section>

          <q-card-section
            class="row justify-between items-center text-caption border-top-light bg-white q-px-md q-py-sm"
          >
            <div class="text-grey-6 flex items-center">
              <q-icon name="update" class="q-mr-xs" />
              最后更新: {{ lastUpdated }}
            </div>
            <q-badge
              :color="isAnalyzing ? 'primary' : 'grey-5'"
              :label="isAnalyzing ? '进行中' : '已停止'"
              rounded
              outline
            >
              <q-icon
                :name="isAnalyzing ? 'sync' : 'stop'"
                class="q-ml-xs"
                :class="{ 'fa-spin': isAnalyzing }"
              />
            </q-badge>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <!-- AI 追问对话 FAB -->
    <q-page-sticky v-if="analysisResult" position="bottom-right" :offset="[24, 24]">
      <q-btn
        fab
        icon="smart_toy"
        color="primary"
        @click="chatOpen = !chatOpen"
        class="chat-fab"
        aria-label="打开AI追问助手"
      >
        <q-badge v-if="!chatOpen" color="positive" floating rounded label="AI" />
        <q-tooltip>AI 追问助手</q-tooltip>
      </q-btn>
    </q-page-sticky>

    <!-- AI 聊天浮窗 -->
    <AIChatPanel v-model="chatOpen" :study-id="study?.id ?? null" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useThemeStore } from 'stores/themeStore';
import * as echarts from 'echarts';
import { useStudyStore } from 'stores/studyStore';
import { useAnalysisStore } from 'stores/analysisStore';
import { type SuspiciousArea } from 'stores/analysisStore';
import ImageAnalyzer from 'components/studies/ImageAnalyzer.vue';
import type { Annotation as AnalyzerAnnotation } from 'components/studies/analyzer/types';
import AIChatPanel from 'components/chat/AIChatPanel.vue';
import { getImageUrl } from 'src/utils/mappers';
import { reportAPI } from 'src/services/api';
import { downloadStudyReport } from 'src/composables/useStudyReportDownload';

/** 报告生成格式 */
type ReportFormat = 'pdf' | 'word' | 'excel';

const $q = useQuasar();
const route = useRoute();
const studyStore = useStudyStore();
const analysisStore = useAnalysisStore();
const themeStore = useThemeStore();

// State
const selectedPatient = ref(null);
const imageType = ref('细胞学涂片 (Cytology)');
const zoomLevel = ref(1);
const isAnalyzing = ref(false);
const isAnalyzingComplete = ref(false);
const progress = ref(0);
const progressStatus = ref('等待开始');
const selectedModel = ref('宫颈病变分割模型 v3.2 (高精度)');
const sensitivity = ref(65);
const confidenceThreshold = ref(85);
const advancedOptions = ref({
  nucleusEnhancement: true,
  overlapSeparation: false,
  debrisFilter: true,
});
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const chatOpen = ref(false);
const generatingFormat = ref<ReportFormat | null>(null);

interface LogEntry {
  time: string;
  message: string;
  confidence: number;
}

const logs = ref<LogEntry[]>([]);
const lastUpdated = ref(new Date().toLocaleString());
const chartRef = ref<HTMLElement | null>(null);
const previewCardRef = ref<{ $el: HTMLElement } | null>(null);
let chartInstance: echarts.ECharts | null = null;
let pollingTimeoutId: ReturnType<typeof setTimeout> | null = null;
let pollingSessionToken = 0;
let pollingRequestInFlight = false;
let pollingFailureCount = 0;
let stalledProgressPollCount = 0;
let lastServerProgress = 0;
const currentTaskId = ref<string | null>(null);
const lastFailedTask = ref<{ id: string; error?: string } | null>(null);
// 用于跟踪当前进度阶段，避免重复添加日志
let lastProgressPhase = '';
const aiZoomLevel = ref(1);
const analyzerImageSize = ref({ width: 0, height: 0 });
const POLLING_INTERVAL_MS = 2000;
const MAX_POLLING_FAILURES = 3;
const STALLED_PROGRESS_MIN = 90;
const MAX_STALLED_PROGRESS_POLLS = 90;

marked.setOptions({ breaks: true, gfm: true });

// Mock Data
const patientOptions = ['张丽 (ID: P20251212001)', '王芳 (ID: P20251211045)'];
const imageTypeOptions = ['细胞学涂片', '阴道镜图像', '组织病理切片'];

// Computed
const study = computed(() => studyStore.currentStudy);
const displayImageUrl = computed(
  () => getImageUrl(study.value?.imageUrl || study.value?.images?.[0]?.file_path) || '',
);

const analysisResult = computed(() => studyStore.currentStudy?.analysisResult || null);

function hasStructuredMarkdown(text: string) {
  return /(^|\n)\s*(#{1,6}\s|[-*+]\s|\d+\.\s|>\s)/m.test(text);
}

function splitReportSentences(text: string) {
  return text
    .split(/(?<=[。；])/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildMarkdownSection(title: string, content: string) {
  const sentences = splitReportSentences(content);
  if (sentences.length === 0) {
    return `### ${title}`;
  }
  return `### ${title}\n${sentences.map((sentence) => `- ${sentence}`).join('\n')}`;
}

function normalizeDetailedReportToMarkdown(text?: string) {
  const normalized = String(text || '')
    .replace(/\r\n/g, '\n')
    .trim();

  if (!normalized) return '';
  if (hasStructuredMarkdown(normalized)) {
    return normalized;
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const sections = paragraphs.map((paragraph, index) => {
    const sectionMatch = paragraph.match(/^([^：:\n]{2,30})[：:]\s*(.+)$/s);
    if (sectionMatch?.[1] && sectionMatch?.[2]) {
      const title = sectionMatch[1];
      const content = sectionMatch[2];
      return buildMarkdownSection(title.trim(), content.trim());
    }

    const fallbackTitle = index === 0 ? '病理观察' : `补充说明 ${index}`;
    return buildMarkdownSection(fallbackTitle, paragraph);
  });

  return sections.join('\n\n');
}

const detailedReportMarkdown = computed(() =>
  normalizeDetailedReportToMarkdown(analysisResult.value?.detailedReport),
);

const renderedDetailedReportHtml = computed(() => {
  if (!detailedReportMarkdown.value) return '';
  return DOMPurify.sanitize(marked.parse(detailedReportMarkdown.value) as string);
});

// 预计剩余时间计算
const estimatedTimeRemaining = computed(() => {
  if (progress.value >= 100) return '完成';
  if (progress.value <= 0) return '计算中...';
  // 假设总时间约40秒
  const totalSeconds = 40;
  const remainingSeconds = Math.round((totalSeconds * (100 - progress.value)) / 100);
  if (remainingSeconds > 60) {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}分${seconds}秒`;
  }
  return `约${remainingSeconds}秒`;
});

function clampNormalizedCoordinate(value: number) {
  return Math.max(0, Math.min(value, 999));
}

function toPixelCoordinate(value: number, size: number) {
  return (clampNormalizedCoordinate(value) / 1000) * size;
}

function resolveSuspiciousAreaBox(
  area: SuspiciousArea,
): { x1: number; y1: number; x2: number; y2: number } | null {
  const officialBox = Array.isArray(area.bbox_2d) ? area.bbox_2d : null;
  if (officialBox && officialBox.length === 4) {
    const x1 = officialBox[0];
    const y1 = officialBox[1];
    const x2 = officialBox[2];
    const y2 = officialBox[3];
    if ([x1, y1, x2, y2].some((value) => typeof value !== 'number' || !Number.isFinite(value))) {
      return null;
    }
    return {
      x1: Number(x1),
      y1: Number(y1),
      x2: Number(x2),
      y2: Number(y2),
    };
  }

  const projectBox = Array.isArray(area.box_2d) ? area.box_2d : null;
  if (projectBox && projectBox.length === 4) {
    const ymin = projectBox[0];
    const xmin = projectBox[1];
    const ymax = projectBox[2];
    const xmax = projectBox[3];
    if (
      [ymin, xmin, ymax, xmax].some((value) => typeof value !== 'number' || !Number.isFinite(value))
    ) {
      return null;
    }
    return {
      x1: Number(xmin),
      y1: Number(ymin),
      x2: Number(xmax),
      y2: Number(ymax),
    };
  }

  return null;
}

// Annotations from AI result
const aiAnnotations = computed<AnalyzerAnnotation[]>(() => {
  const result = analysisResult.value;
  const { width: imageWidth, height: imageHeight } = analyzerImageSize.value;
  if (!result?.suspiciousAreas || !imageWidth || !imageHeight) return [];

  return result.suspiciousAreas
    .map((area: SuspiciousArea): AnalyzerAnnotation | null => {
      const normalizedBox = resolveSuspiciousAreaBox(area);
      if (!normalizedBox) return null;

      const minX = Math.min(normalizedBox.x1, normalizedBox.x2);
      const minY = Math.min(normalizedBox.y1, normalizedBox.y2);
      const maxX = Math.max(normalizedBox.x1, normalizedBox.x2);
      const maxY = Math.max(normalizedBox.y1, normalizedBox.y2);

      const x = toPixelCoordinate(minX, imageWidth);
      const y = toPixelCoordinate(minY, imageHeight);
      const width = toPixelCoordinate(maxX, imageWidth) - x;
      const height = toPixelCoordinate(maxY, imageHeight) - y;

      if (!Number.isFinite(x) || !Number.isFinite(y) || width <= 0 || height <= 0) return null;

      return {
        type: 'rect',
        x,
        y,
        width,
        height,
        label: area.description || '异常区域',
        confidence: result.confidence || 0.85,
        source: 'ai',
        description: area.location || area.features?.join('、') || area.description || 'AI识别区域',
      };
    })
    .filter((item): item is AnalyzerAnnotation => item !== null);
});

watch(displayImageUrl, () => {
  analyzerImageSize.value = { width: 0, height: 0 };
});

// Methods
const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  if (!study.value?.id) {
    $q.notify({
      type: 'warning',
      message: '无法上传：病例数据未加载',
      position: 'top',
    });
    return;
  }

  isUploading.value = true;
  try {
    const success = await studyStore.uploadImage(study.value.id, file);
    if (success) {
      $q.notify({
        type: 'positive',
        message: '影像上传成功',
        position: 'top',
      });
      // Clear input
      if (fileInput.value) fileInput.value.value = '';
    }
  } catch (error) {
    console.error('上传失败:', error);
    $q.notify({
      type: 'negative',
      message: '上传失败，请重试',
      position: 'top',
    });
  } finally {
    isUploading.value = false;
  }
};

const zoomIn = () => {
  if (zoomLevel.value < 3) {
    zoomLevel.value += 0.2;
  }
};
const zoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value -= 0.2;
  }
};
const toggleFullscreen = () => {
  if (!$q.fullscreen.isCapable) {
    $q.notify({ type: 'warning', message: '您的浏览器不支持全屏模式' });
    return;
  }
  const target = previewCardRef.value?.$el || undefined;
  $q.fullscreen.toggle(target).catch((err) => {
    console.error('Fullscreen toggle failed:', err);
    $q.notify({ type: 'negative', message: '切换全屏失败' });
  });
};

const handleAiZoom = (scale: number) => {
  aiZoomLevel.value = scale;
};

const handleAnalyzerImageLoad = (width: number, height: number) => {
  analyzerImageSize.value = { width, height };
};

// 生成报告
const generateReport = async (format: ReportFormat) => {
  if (!study.value?.id) {
    $q.notify({ type: 'warning', message: '病例数据未加载，无法生成报告', position: 'top' });
    return;
  }

  // PDF 格式使用前端生成（已验证中文字体支持更好）
  if (format === 'pdf') {
    try {
      generatingFormat.value = 'pdf';
      await downloadStudyReport({ id: study.value.id, $q });
    } catch (error) {
      console.error('前端生成 PDF 失败:', error);
    } finally {
      generatingFormat.value = null;
    }
    return;
  }

  generatingFormat.value = format;
  try {
    const { data } = await reportAPI.generate({ study_id: study.value.id, format });
    const resp = data as { success: boolean; message?: string; data?: { report?: { id: number } } };
    if (resp.success) {
      $q.notify({
        type: 'positive',
        message: `${format.toUpperCase()} 报告生成成功！`,
        position: 'top',
        icon: 'check_circle',
      });
      // 自动下载
      const reportId = resp.data?.report?.id;
      if (reportId) {
        try {
          const dlResp = await reportAPI.download(reportId);
          const blob = new Blob([dlResp.data as BlobPart]);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          // 此处 format 只可能是 'word' 或 'excel'，因为 'pdf' 已提前 return
          const suffix = format === 'word' ? 'docx' : 'xlsx';
          a.download = `report_${study.value.id}.${suffix}`;
          a.click();
          window.URL.revokeObjectURL(url);
        } catch (downloadError: unknown) {
          const downloadMessage =
            (downloadError as { response?: { data?: { message?: string } } })?.response?.data
              ?.message || '报告已生成，但自动下载失败';
          $q.notify({ type: 'warning', message: downloadMessage, position: 'top' });
        }
      }
    } else {
      $q.notify({ type: 'negative', message: resp.message || '生成失败', position: 'top' });
    }
  } catch (error: unknown) {
    const msg =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      '生成报告失败';
    $q.notify({ type: 'negative', message: msg, position: 'top' });
  } finally {
    generatingFormat.value = null;
  }
};

const startAnalysis = async () => {
  if (!study.value?.id) {
    $q.notify({
      type: 'warning',
      message: '无法启动分析：病例数据未加载',
      position: 'top',
    });
    return;
  }

  clearPollingTaskStatus();
  // 清除失败状态
  lastFailedTask.value = null;
  isAnalyzing.value = true;
  isAnalyzingComplete.value = false;
  progress.value = 0;
  progressStatus.value = '等待开始...';
  logs.value = [];
  lastProgressPhase = ''; // 重置进度阶段
  addLog('分析任务已启动...');

  try {
    // 调用后端API创建分析任务
    const { analysisTaskAPI } = await import('src/services/api');
    const response = await analysisTaskAPI.createTask({ study_id: study.value.id });

    if (response.success && response.data.task) {
      const taskId = response.data.task.task_id;
      currentTaskId.value = taskId;
      // addLog(`任务已创建: ${taskId}`, 95);

      // 开始轮询任务状态
      startPollingTaskStatus(taskId);

      $q.notify({
        type: 'positive',
        message: '🚀 AI分析已启动，预计30-60秒完成',
        position: 'top',
        icon: 'psychology',
      });
    }
  } catch (error) {
    console.error('启动分析失败:', error);
    isAnalyzing.value = false;
    addLog('启动分析失败', 0);
    $q.notify({
      type: 'negative',
      message: '启动分析失败，请重试',
      position: 'top',
    });
  }
};

const resetPollingState = () => {
  pollingRequestInFlight = false;
  pollingFailureCount = 0;
  stalledProgressPollCount = 0;
  lastServerProgress = 0;
};

const clearPollingTaskStatus = () => {
  pollingSessionToken += 1;
  if (pollingTimeoutId) {
    clearTimeout(pollingTimeoutId);
    pollingTimeoutId = null;
  }
  resetPollingState();
};

const completeAnalysisFromResult = (message?: string) => {
  clearPollingTaskStatus();
  currentTaskId.value = null;
  isAnalyzing.value = false;
  progress.value = 100;
  progressStatus.value = '分析完成';
  lastFailedTask.value = null;
  if (message) {
    addLog(message, 100);
  }
};

const stopAnalysis = () => {
  clearPollingTaskStatus();
  currentTaskId.value = null;
  isAnalyzing.value = false;
  progressStatus.value = '已停止';
  addLog('分析已手动停止');
};

const scheduleNextTaskPoll = (taskId: string, sessionId: number, delay = POLLING_INTERVAL_MS) => {
  if (pollingTimeoutId) {
    clearTimeout(pollingTimeoutId);
  }
  if (sessionId !== pollingSessionToken || currentTaskId.value !== taskId) {
    return;
  }
  pollingTimeoutId = setTimeout(() => {
    void pollTaskStatusOnce(taskId, sessionId);
  }, delay);
};

const stopPollingAndRefresh = async ({
  statusText,
  logMessage,
  notifyType = 'warning',
  notifyMessage,
}: {
  statusText: string;
  logMessage: string;
  notifyType?: 'warning' | 'negative';
  notifyMessage: string;
}) => {
  clearPollingTaskStatus();
  currentTaskId.value = null;
  isAnalyzing.value = false;
  progressStatus.value = statusText;
  addLog(logMessage, progress.value);

  await refreshStudyData({ allowResumePolling: false });
  if (studyStore.currentStudy?.analysisResult) {
    completeAnalysisFromResult('检测到分析结果，已同步完成状态');
    return;
  }

  $q.notify({
    type: notifyType,
    message: notifyMessage,
    position: 'top',
    timeout: 6000,
  });
};

const pollTaskStatusOnce = async (taskId: string, sessionId: number) => {
  if (
    sessionId !== pollingSessionToken ||
    currentTaskId.value !== taskId ||
    pollingRequestInFlight
  ) {
    return;
  }

  pollingRequestInFlight = true;

  try {
    const task = await analysisStore.getTaskStatus(taskId);
    if (sessionId !== pollingSessionToken || currentTaskId.value !== taskId) {
      return;
    }

    pollingFailureCount = 0;

    // 平滑更新进度：如果后端进度大于当前进度，逐步增加
    const targetProgress = task.progress;
    if (targetProgress > progress.value) {
      // 计算每次增加的步长（目标进度 - 当前进度）/ 4，实现平滑过渡
      const step = Math.ceil((targetProgress - progress.value) / 4);
      progress.value = Math.min(progress.value + step, targetProgress);
    } else if (targetProgress < progress.value) {
      // 如果后端进度小于当前进度，直接设置（避免回退）
      progress.value = targetProgress;
    }

    if (task.progress > lastServerProgress) {
      lastServerProgress = task.progress;
      stalledProgressPollCount = 0;
    } else if (task.status === 'PROCESSING' && task.progress >= STALLED_PROGRESS_MIN) {
      stalledProgressPollCount += 1;
    } else {
      lastServerProgress = task.progress;
      stalledProgressPollCount = 0;
    }

    if (task.status === 'PENDING') {
      progressStatus.value = '等待开始...';
      scheduleNextTaskPoll(taskId, sessionId);
      return;
    }

    if (task.status === 'PROCESSING') {
      progressStatus.value = '分析中...';
      // 根据进度阶段添加日志，与蓝色进度条同步
      let currentPhase = '';
      if (task.progress >= 35 && task.progress < 65) {
        progressStatus.value = '图像预处理中...';
        currentPhase = 'preprocessing';
      } else if (task.progress >= 65 && task.progress < 80) {
        progressStatus.value = 'AI模型推理中...';
        currentPhase = 'feature_extraction';
      } else if (task.progress >= 80 && task.progress < 92) {
        progressStatus.value = '生成分析报告...';
        currentPhase = 'risk_assessment';
      } else if (task.progress >= 92) {
        progressStatus.value = '报告生成中...';
        currentPhase = 'report_generation';
      }
      // 只有阶段变化时才添加日志
      if (currentPhase && currentPhase !== lastProgressPhase) {
        lastProgressPhase = currentPhase;
        if (currentPhase === 'preprocessing') {
          addLog('图像预处理进行中', 35);
        } else if (currentPhase === 'feature_extraction') {
          addLog('特征提取中...', 65);
        } else if (currentPhase === 'risk_assessment') {
          addLog('风险评估中...', 80);
        } else if (currentPhase === 'report_generation') {
          addLog('正在生成诊断报告...', 92);
        }
      }

      if (stalledProgressPollCount >= MAX_STALLED_PROGRESS_POLLS) {
        await stopPollingAndRefresh({
          statusText: '任务可能卡住',
          logMessage: '分析进度长时间无变化，已停止自动轮询',
          notifyMessage: '分析进度长时间停留未变化，已停止自动轮询，请稍后重试',
        });
        return;
      }

      scheduleNextTaskPoll(taskId, sessionId);
      return;
    }

    if (task.status === 'SUCCESS') {
      clearPollingTaskStatus();
      currentTaskId.value = null;
      progressStatus.value = '分析完成';
      lastFailedTask.value = null;
      addLog('分析完成，正在加载结果...', 99);

      // 平滑过渡到100%
      const animateToComplete = async () => {
        while (progress.value < 100) {
          progress.value = Math.min(progress.value + 2, 100);
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      };

      await animateToComplete();

      // 切换为完成态（绿色卡片 + 对勾图标）
      isAnalyzingComplete.value = true;

      // 展示完成态 1.2s 后触发离场动画
      await new Promise((resolve) => setTimeout(resolve, 1200));
      isAnalyzing.value = false;

      // 等离场动画播完后重置完成态
      setTimeout(() => {
        isAnalyzingComplete.value = false;
      }, 600);

      // 重新加载病例数据以获取最新的分析结果
      await refreshStudyData();

      // 显示完成通知
      $q.notify({
        type: 'positive',
        message: '🎉 AI分析完成！诊断结果已更新',
        position: 'top',
        timeout: 5000,
        icon: 'check_circle',
      });

      // 等待500ms后自动滚动到诊断结果区域
      setTimeout(() => {
        const resultCard = document.querySelector('.ai-result-card');
        if (resultCard) {
          resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
      return;
    }

    if (task.status === 'FAILED') {
      clearPollingTaskStatus();
      currentTaskId.value = null;
      isAnalyzing.value = false;
      progressStatus.value = '分析失败';
      lastFailedTask.value = {
        id: task.taskId,
        ...(task.error && { error: task.error }),
      };
      addLog(`分析失败: ${task.error || '未知错误'}`, 0);

      $q.notify({
        type: 'negative',
        message: `❌ 分析失败: ${task.error || '未知错误'}`,
        position: 'top',
        actions: [
          {
            label: '重试',
            color: 'white',
            handler: () => {
              void startAnalysis();
            },
          },
        ],
      });
    }
  } catch (error) {
    if (sessionId !== pollingSessionToken || currentTaskId.value !== taskId) {
      return;
    }

    pollingFailureCount += 1;
    console.error('轮询任务状态失败:', error);
    addLog('轮询任务状态失败，稍后重试...', 0);

    if (pollingFailureCount >= MAX_POLLING_FAILURES) {
      await stopPollingAndRefresh({
        statusText: '状态同步失败',
        logMessage: '分析状态请求连续失败，已停止自动轮询',
        notifyMessage: '分析状态同步连续失败，已停止自动轮询，请稍后重试',
      });
      return;
    }

    scheduleNextTaskPoll(taskId, sessionId);
  } finally {
    pollingRequestInFlight = false;
  }
};

// 轮询任务状态
const startPollingTaskStatus = (taskId: string) => {
  clearPollingTaskStatus();
  const sessionId = pollingSessionToken;
  lastServerProgress = progress.value;
  void pollTaskStatusOnce(taskId, sessionId);
};

// 刷新病例数据
const refreshStudyData = async (options?: { allowResumePolling?: boolean }) => {
  const studyId = route.params.id;
  const allowResumePolling = options?.allowResumePolling ?? true;
  if (studyId) {
    try {
      // 强制从服务器重新加载
      const updatedStudy = await studyStore.loadStudyById(parseInt(studyId as string), true);

      // 优先级：已有分析结果时，直接视为完成，避免被历史任务状态覆盖
      if (updatedStudy?.analysisResult && !currentTaskId.value) {
        completeAnalysisFromResult();
      } else if (
        allowResumePolling &&
        updatedStudy?.status === 'processing' &&
        updatedStudy.taskId
      ) {
        // 检查是否有正在进行的任务，如果有则自动开始轮询
        isAnalyzing.value = true;
        currentTaskId.value = updatedStudy.taskId;
        startPollingTaskStatus(updatedStudy.taskId);
      } else {
        clearPollingTaskStatus();
        currentTaskId.value = null;
        isAnalyzing.value = false;
        if (!updatedStudy?.analysisResult && updatedStudy?.status === 'processing') {
          progressStatus.value = allowResumePolling ? '分析中...' : '任务状态待确认';
        }
      }

      // 强制更新图表
      setTimeout(() => {
        updateChart();
      }, 100);
    } catch (error) {
      console.error('刷新病例数据失败:', error);
    }
  }
};

const addLog = (message: string, confidence?: number) => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message,
    confidence: confidence || 0,
  });
  lastUpdated.value = new Date().toLocaleString();
};

const getConfidenceColor = (conf: number) => {
  if (conf >= 90) return 'positive';
  if (conf >= 70) return 'warning';
  return 'grey';
};

const getConfidenceBadgeColor = (confidence: number) => {
  const percent = confidence * 100;
  if (percent >= 90) return 'positive';
  if (percent >= 75) return 'primary';
  if (percent >= 60) return 'warning';
  return 'orange';
};

const getRiskLevelText = (diagnosis: string | undefined | null) => {
  if (!diagnosis) return '-';
  if (diagnosis.includes('浸润性癌') || diagnosis.includes('HSIL')) return '高风险';
  if (diagnosis.includes('LSIL') || diagnosis.includes('ASC-H')) return '中风险';
  if (diagnosis.includes('ASC-US')) return '低风险';
  return '正常';
};

const getRiskColorClass = (diagnosis: string | undefined | null) => {
  if (!diagnosis) return 'text-grey';
  if (diagnosis.includes('浸润性癌') || diagnosis.includes('HSIL')) return 'text-negative';
  if (diagnosis.includes('LSIL') || diagnosis.includes('ASC-H')) return 'text-warning';
  if (diagnosis.includes('ASC-US')) return 'text-info';
  return 'text-positive';
};

const initChart = () => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value);
    updateChart();
  }
};

// 根据暗色模式创建图表配置
const createChartOption = () => {
  const isDark = themeStore.isDark;

  // 使用真实的AI分析结果数据
  const result = analysisResult.value;
  let chartData: { value: number; itemStyle: { color: string } }[] = [];
  let categories: string[] = [];

  if (result?.suspiciousAreas && result.suspiciousAreas.length > 0) {
    chartData = result.suspiciousAreas.slice(0, 5).map(() => {
      const confidence = (result.confidence || 0.85) * 100;
      let color = '#375A64';
      if (confidence >= 90) color = '#ef4444';
      else if (confidence >= 75) color = '#f59e0b';
      return { value: Math.round(confidence), itemStyle: { color } };
    });
    categories = result.suspiciousAreas.slice(0, 5).map((_, i) => `区域${i + 1}`);
  } else {
    chartData = [
      { value: 92, itemStyle: { color: '#ef4444' } },
      { value: 78, itemStyle: { color: '#f59e0b' } },
      { value: 85, itemStyle: { color: '#375A64' } },
    ];
    categories = ['区域1', '区域2', '区域3'];
  }

  return {
    tooltip: { trigger: 'axis' },
    grid: { top: '10%', left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: isDark ? '#475569' : '#ccc' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#333' },
    },
    yAxis: {
      type: 'value',
      max: 100,
      splitLine: { lineStyle: { color: isDark ? '#334155' : '#e0e0e0', type: 'dashed' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#666' },
    },
    series: [{ data: chartData, type: 'bar', barWidth: '40%' }],
  };
};

// 更新图表
const updateChart = () => {
  if (!chartInstance) return;
  const option = createChartOption();
  chartInstance.setOption(option);
};

// 监听分析结果变化，自动更新图表
watch(
  () => analysisResult.value,
  (result) => {
    updateChart();

    // 只要有结果就结束“分析中”态，避免显示与数据不一致
    if (result && isAnalyzing.value && !currentTaskId.value) {
      completeAnalysisFromResult('检测到分析结果，已同步完成状态');
    }
  },
  { deep: true },
);

// 监听暗色模式变化，重新渲染图表
watch(
  () => themeStore.isDark,
  () => {
    if (chartInstance) {
      const option = createChartOption();
      chartInstance.setOption(option);
    }
  },
);

// 监听study变化，确保数据同步
watch(
  () => study.value,
  (newStudy) => {
    if (newStudy) {
      updateChart();
    }
  },
  { deep: true },
);

onMounted(async () => {
  // 加载病例数据
  const studyId = route.params.id;

  if (studyId) {
    try {
      // 先强制刷新加载最新数据
      await studyStore.loadStudyById(parseInt(studyId as string), true);

      // 已有结果时优先结束分析态，避免旧任务状态造成误判
      if (analysisResult.value) {
        completeAnalysisFromResult();
      } else if (study.value?.status === 'processing') {
        // 检查是否有进行中的分析任务
        try {
          // 从后端获取最新的分析任务列表
          await analysisStore.fetchTasks({ study_id: study.value.id });

          // 优先查找进行中的任务
          const activeTask = analysisStore.getActiveTaskByStudyId(study.value.id.toString());

          if (activeTask) {
            currentTaskId.value = activeTask.id;
            isAnalyzing.value = true;
            progress.value = activeTask.progress;
            progressStatus.value = '分析中...';
            startPollingTaskStatus(activeTask.id);
          } else {
            // 没有进行中的任务，查找最新任务（包括刚刚创建的 PENDING 任务）
            const latestTask = analysisStore.getTaskByStudyId(study.value.id.toString());

            if (latestTask) {
              if (latestTask.status === 'PENDING' || latestTask.status === 'PROCESSING') {
                // 找到 PENDING 或 PROCESSING 状态的任务，开始轮询（可能是刚从 UploadPage 跳转过来）
                currentTaskId.value = latestTask.id;
                isAnalyzing.value = true;
                progress.value = latestTask.progress;
                progressStatus.value =
                  latestTask.status === 'PENDING' ? '等待开始...' : '分析中...';
                startPollingTaskStatus(latestTask.id);
              } else if (latestTask.status === 'FAILED') {
                // 任务失败，显示失败信息
                lastFailedTask.value = {
                  id: latestTask.id,
                  ...(latestTask.error && { error: latestTask.error }),
                };
                progress.value = latestTask.progress;
                progressStatus.value = '分析失败';
                addLog(`分析失败: ${latestTask.error || '未知错误'}`, 0);

                $q.notify({
                  type: 'negative',
                  message: `❌ 上次分析失败: ${latestTask.error || '未知错误'}`,
                  position: 'top',
                  timeout: 5000,
                  actions: [
                    {
                      label: '重试',
                      color: 'white',
                      handler: () => {
                        void startAnalysis();
                      },
                    },
                  ],
                });
              } else if (latestTask.status === 'SUCCESS') {
                // 任务成功但病例状态未更新，刷新数据
                await refreshStudyData();
              }
            } else {
              // 没有任何任务，提示用户手动启动
              $q.notify({
                type: 'info',
                message: '未找到分析任务，请点击"启动"按钮开始分析',
                position: 'top',
                timeout: 3000,
              });
            }
          }
        } catch {
          // 如果获取任务失败，尝试直接从本地查找
          const activeTask = analysisStore.getActiveTaskByStudyId(study.value.id.toString());
          if (activeTask) {
            currentTaskId.value = activeTask.id;
            isAnalyzing.value = true;
            progress.value = activeTask.progress;
            progressStatus.value = '分析中...';
            startPollingTaskStatus(activeTask.id);
          } else {
            // 显示错误提示，让用户手动重试
            $q.notify({
              type: 'warning',
              message: '无法获取分析状态，请点击"启动"按钮开始分析',
              position: 'top',
              timeout: 5000,
            });
          }
        }
      } else if (study.value?.status === 'completed' && !analysisResult.value) {
        // 如果状态是完成但没有结果，再次刷新
        await studyStore.loadStudyById(parseInt(studyId as string), true);
      }
    } catch (error) {
      console.error('加载病例数据失败:', error);

      $q.notify({
        type: 'negative',
        message: '加载病例数据失败',
        position: 'top',
      });
    }
  }

  setTimeout(initChart, 100);
  window.addEventListener('resize', () => chartInstance?.resize());
});

onUnmounted(() => {
  // 清理轮询定时器
  clearPollingTaskStatus();
  window.removeEventListener('resize', () => chartInstance?.resize());
  chartInstance?.dispose();
});
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid var(--app-border-default);
}
.border-bottom-light {
  border-bottom: 1px solid var(--app-border-light);
}
.border-top-light {
  border-top: 1px solid var(--app-border-light);
}
.border-light {
  border: 1px solid var(--app-border-default);
}
.border-dashed {
  border: 2px dashed var(--app-border-dashed);
}
.border-negative {
  border: 2px solid #ef4444;
}
.border-warning {
  border: 2px solid #f59e0b;
}
.font-mono {
  font-family: monospace;
}
.upload-area:hover {
  background-color: var(--app-upload-accent-hover-bg);
  border-color: var(--app-upload-accent-hover-border);
}

.study-surface-card {
  border-radius: var(--app-radius-lg) !important;
}

.report-text-block {
  line-height: 1.5;
}

.ai-diagnosis-bg-icon {
  font-size: 80px;
  margin: -10px -10px;
}

.suspicious-areas-scroll {
  height: 80px;
}

.advanced-option-label {
  font-size: 11px;
}

.lesion-chart {
  height: 200px;
}

.legend-dot {
  width: 8px;
  height: 8px;
}

.analysis-log-scroll-area {
  height: 200px;
}

.analysis-log-avatar {
  min-width: 40px;
}

.analysis-log-empty {
  height: 100%;
}

/* 右侧分析面板：增强玻璃质感与层次 */
.analysis-progress {
  position: relative;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--app-border-default) 72%, #1976d2 28%);
  background:
    radial-gradient(110% 80% at 0% -10%, rgba(25, 118, 210, 0.14), transparent 60%),
    radial-gradient(120% 90% at 100% 0%, rgba(56, 189, 248, 0.12), transparent 62%),
    var(--app-glass-bg);
  backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-sm));
  -webkit-backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-sm));
  box-shadow:
    0 10px 28px rgba(15, 23, 42, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.44);
}

.analysis-progress::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.02) 48%,
    rgba(15, 23, 42, 0.04) 100%
  );
}

.analysis-progress :deep(.q-card__section) {
  position: relative;
  z-index: 1;
}

.analysis-progress .bg-white {
  background-color: rgba(255, 255, 255, 0.64) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.analysis-progress .bg-grey-1 {
  background-color: rgba(248, 250, 252, 0.66) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.analysis-progress-inline {
  padding: 10px 12px;
  border: 1px solid var(--app-border-light);
  border-radius: var(--app-radius-md);
  background: rgba(255, 255, 255, 0.36);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* 现代化影像预览样式 */
.image-panel-wrapper {
  transition:
    box-shadow 0.3s ease,
    transform 0.2s ease;
}

.image-panel-wrapper:hover {
  box-shadow: var(--app-image-panel-hover-shadow) !important;
  transform: translateY(-2px);
}

/* 优化图像容器样式 */
.image-container {
  border-radius: var(--app-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.2s ease;
}

/* AI标注视图容器 */
.annotated-view-container {
  border-radius: var(--app-radius-md);
  overflow: hidden;
  border: 1px solid var(--app-border-default);
}

/* 进度条置顶样式 */
.analysis-progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 16px;
  padding-top: 80px; /* 给顶部导航栏留空间 */
  pointer-events: none;
}

.analysis-progress-card {
  max-width: 700px;
  margin: 0 auto;
  border-radius: var(--app-radius-xl) !important;
  background: linear-gradient(135deg, #1565c0 0%, #0d47a1 50%, #01579b 100%) !important;
  box-shadow: var(--app-shadow-lg);
  pointer-events: auto;
  transition: background 0.4s ease;
}

/* 完成态：切换为绿色渐变 */
.analysis-progress-card.is-complete {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 50%, #388e3c 100%) !important;
  animation: successCardPulse 0.45s ease-out;
}

/* 完成入场脉冲效果 */
@keyframes successCardPulse {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.015);
  }
  100% {
    transform: scale(1);
  }
}

/* 完成态进度条颜色 */
.is-complete .progress-bar-fill {
  background: linear-gradient(90deg, #66bb6a, #a5d6a7, #c8e6c9);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 进度卡片入场动画 */
.progress-card-enter-active {
  animation: progressCardEnter 0.4s ease-out;
}

/* 进度卡片离场动画：往上收起 + 淡出 + 微缩放 */
.progress-card-leave-active {
  animation: progressCardLeave 0.5s cubic-bezier(0.4, 0, 1, 1) forwards;
}

@keyframes progressCardEnter {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes progressCardLeave {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  25% {
    opacity: 1;
    transform: translateY(-6px) scale(1.01);
  }
  100% {
    opacity: 0;
    transform: translateY(-24px) scale(0.93);
  }
}

.analysis-icon-container {
  width: 50px;
  height: 50px;
  border-radius: var(--app-radius-md);
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-md));
  -webkit-backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-md));
  transition: background 0.3s ease;
}

/* 图标切换动画 */
.icon-swap-enter-active {
  animation: iconIn 0.3s ease-out;
}

.icon-swap-leave-active {
  animation: iconOut 0.15s ease-in;
}

@keyframes iconIn {
  from {
    opacity: 0;
    transform: scale(0.4) rotate(-90deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes iconOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.4);
  }
}

.progress-percentage {
  font-size: 42px;
  font-weight: 700;
  color: white;
  line-height: 1;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.percent-sign {
  font-size: 20px;
  font-weight: 400;
  opacity: 0.8;
  margin-left: 2px;
}

.progress-bar-container {
  margin-top: 8px;
  position: relative;
  padding: 8px 0;
}

.progress-bar-bg {
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--app-radius-md);
  position: relative;
  overflow: visible;
}

/* 标注视图容器背景 */
.annotated-view-container {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4fc3f7, #81d4fa, #b3e5fc);
  border-radius: var(--app-radius-md);
  transition: width 0.5s ease-out;
  position: relative;
}

.progress-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-bar-glow {
  position: absolute;
  top: -4px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  box-shadow: var(--app-shadow-lg);
  transform: translateX(-50%);
  transition: left 0.5s ease-out;
}

.progress-stages {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.4);
  transition: all 0.3s ease;
}

.stage span {
  font-size: 11px;
  font-weight: 500;
}

.stage.active {
  color: rgba(255, 255, 255, 0.7);
}

.stage.completed {
  color: #b3e5fc;
}

.stage.completed .q-icon {
  animation: checkBounce 0.4s ease-out;
}

@keyframes checkBounce {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}
</style>

<style lang="scss">
body.body--dark {
  // 以下规则为 StudyDetailPage 页面特有，全局 app.scss 未覆盖
  .annotated-view-container {
    border-color: var(--app-border-default) !important;
  }

  .analysis-progress {
    border-color: color-mix(in srgb, var(--app-border-default) 75%, #4da3ff 25%);
    background:
      radial-gradient(120% 92% at 0% -12%, rgba(25, 118, 210, 0.22), transparent 62%),
      radial-gradient(120% 90% at 100% 0%, rgba(56, 189, 248, 0.18), transparent 64%),
      rgba(15, 23, 42, 0.42);
    backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-md));
    -webkit-backdrop-filter: saturate(var(--app-glass-saturate)) blur(var(--app-glass-blur-md));
    box-shadow:
      0 14px 30px rgba(2, 8, 23, 0.52),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .analysis-progress::before {
    background: linear-gradient(
      145deg,
      rgba(148, 163, 184, 0.2) 0%,
      rgba(148, 163, 184, 0.02) 48%,
      rgba(15, 23, 42, 0.16) 100%
    );
  }

  .analysis-progress .bg-white {
    background-color: rgba(15, 23, 42, 0.48) !important;
    border-bottom-color: var(--app-border-default) !important;
  }

  .analysis-progress .bg-grey-1 {
    background-color: rgba(15, 23, 42, 0.34) !important;
  }

  .analysis-progress-inline {
    background: rgba(15, 23, 42, 0.34);
    border-color: var(--app-border-default);
  }

  .upload-area:hover {
    background-color: var(--app-upload-accent-hover-bg) !important;
    border-color: var(--app-upload-accent-hover-border) !important;
  }

  .image-panel-wrapper:hover {
    box-shadow: var(--app-image-panel-hover-shadow) !important;
  }
}

.detailed-report-markdown {
  h1, h2, h3, h4 {
    color: #24324a !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
    margin-top: 12px !important;
    margin-bottom: 6px !important;
  }

  h1:first-child,
  h2:first-child,
  h3:first-child,
  h4:first-child {
    margin-top: 0 !important;
  }

  h1 { font-size: 1.15rem !important; }
  h2 { font-size: 1.05rem !important; }
  h3 { font-size: 0.95rem !important; }
  h4 { font-size: 0.9rem !important; }

  p {
    margin: 3px 0 !important;
    line-height: 1.4 !important;
  }

  ul, ol {
    margin: 2px 0 0 !important;
    padding-left: 20px !important;
  }

  li {
    margin: 2px 0 !important;
    color: #3d4b63 !important;
    line-height: 1.4 !important;
  }

  strong {
    color: #1f2a44 !important;
    font-weight: 700 !important;
  }
}

body.body--dark .detailed-report-markdown {
  h1, h2, h3, h4 {
    color: #e2e8f0 !important;
  }
  li {
    color: #cbd5e1 !important;
  }
  strong {
    color: #f1f5f9 !important;
  }
}
</style>
