<template>
  <q-page class="q-pa-md">
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
        <q-card flat bordered class="ai-result-card">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">
              <q-icon name="psychology" class="q-mr-sm" />
              AI诊断结果
            </div>
          </q-card-section>
          <q-card-section>
            <div class="row q-col-gutter-md">
              <!-- 诊断结论 -->
              <div class="col-md-4 col-12">
                <div class="text-subtitle2 text-grey-7 q-mb-xs">诊断结论</div>
                <div class="text-h6 text-primary text-weight-bold">
                  {{ analysisResult.diagnosis }}
                </div>
                <div class="q-mt-sm">
                  <q-badge
                    :color="getConfidenceBadgeColor(analysisResult.confidence)"
                    :label="`置信度: ${Math.round(analysisResult.confidence * 100)}%`"
                  />
                </div>
              </div>

              <!-- 生物标志物 -->
              <div v-if="analysisResult.biomarkers" class="col-md-4 col-12">
                <div class="text-subtitle2 text-grey-7 q-mb-xs">生物标志物</div>
                <div class="q-gutter-xs">
                  <div class="text-body2">
                    <strong>HPV:</strong> {{ analysisResult.biomarkers.HPV }}
                  </div>
                  <div class="text-body2">
                    <strong>p16:</strong> {{ analysisResult.biomarkers.p16 }}
                  </div>
                  <div class="text-body2">
                    <strong>Ki67:</strong> {{ analysisResult.biomarkers.Ki67 }}
                  </div>
                </div>
              </div>

              <!-- 可疑区域统计 -->
              <div class="col-md-4 col-12">
                <div class="text-subtitle2 text-grey-7 q-mb-xs">可疑区域</div>
                <div class="text-h6 text-negative text-weight-bold">
                  {{ analysisResult.suspiciousAreas?.length || 0 }} 个
                </div>
                <div v-if="analysisResult.suspiciousAreas" class="q-mt-sm text-caption">
                  <div v-for="(area, idx) in analysisResult.suspiciousAreas.slice(0, 3)" :key="idx">
                    {{ idx + 1 }}. {{ area.description }}
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>

          <!-- 建议 -->
          <q-card-section v-if="analysisResult.recommendations?.length">
            <div class="text-subtitle2 text-grey-7 q-mb-sm">临床建议</div>
            <q-list dense bordered separator>
              <q-item v-for="(rec, idx) in analysisResult.recommendations" :key="idx">
                <q-item-section avatar>
                  <q-icon name="check_circle" color="positive" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ rec }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>

          <!-- 详细报告 -->
          <q-card-section v-if="analysisResult.detailedReport">
            <q-expansion-item
              default-opened
              dense
              expand-separator
              icon="description"
              label="查看详细报告"
              header-class="text-primary text-weight-medium"
            >
              <q-card>
                <q-card-section class="bg-grey-1">
                  <div class="text-body2" style="white-space: pre-wrap">
                    {{ analysisResult.detailedReport }}
                  </div>
                </q-card-section>
              </q-card>
            </q-expansion-item>
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
              <div class="text-caption text-grey-5 q-mt-sm">支持 JPG, PNG, DICOM 格式</div>
            </div>
            <input
              type="file"
              ref="fileInput"
              class="hidden"
              accept=".jpg,.jpeg,.png,.dcm"
              @change="handleFileUpload"
            />
          </q-card-section>
        </q-card>

        <!-- Image Preview Section -->
        <q-card
          class="full-height shadow-3 rounded-borders"
          v-else
          style="border-radius: 16px"
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
                      :src="study.imageUrl"
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
                      v-if="study.imageUrl"
                      :src="study.imageUrl"
                      :initial-annotations="aiAnnotations"
                      @zoom="handleAiZoom"
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
        <transition name="slide-down">
          <div v-if="isAnalyzing" class="analysis-progress-overlay">
            <q-card class="analysis-progress-card">
              <q-card-section class="q-pa-lg">
                <!-- 标题区域 -->
                <div class="row items-center q-mb-md">
                  <div class="analysis-icon-container q-mr-md">
                    <q-spinner-orbit color="white" size="28px" />
                  </div>
                  <div class="col">
                    <div class="text-h6 text-white text-weight-bold">AI 智能分析中</div>
                    <div class="text-caption text-light-blue-2">{{ progressStatus }}</div>
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
        <q-card class="q-mb-md shadow-3 rounded-borders" style="border-radius: 16px">
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
                <!-- Vessel Enhancement -->
                <div class="col-4">
                  <div
                    class="q-pa-sm rounded-borders cursor-pointer transition-all text-center border-light relative-position overflow-hidden"
                    :class="
                      advancedOptions.vesselEnhancement
                        ? 'bg-primary text-white shadow-2'
                        : 'bg-white text-grey-7 hover-bg-grey-2'
                    "
                    @click="advancedOptions.vesselEnhancement = !advancedOptions.vesselEnhancement"
                    v-ripple
                  >
                    <q-icon name="bloodtype" size="sm" class="q-mb-xs" />
                    <div class="text-caption text-weight-bold" style="font-size: 11px">
                      血管增强
                    </div>
                    <q-icon
                      name="check_circle"
                      class="absolute-top-right q-ma-xs"
                      size="14px"
                      v-if="advancedOptions.vesselEnhancement"
                    />
                  </div>
                </div>

                <!-- Multi-Spectral -->
                <div class="col-4">
                  <div
                    class="q-pa-sm rounded-borders cursor-pointer transition-all text-center border-light relative-position overflow-hidden"
                    :class="
                      advancedOptions.multiSpectral
                        ? 'bg-primary text-white shadow-2'
                        : 'bg-white text-grey-7 hover-bg-grey-2'
                    "
                    @click="advancedOptions.multiSpectral = !advancedOptions.multiSpectral"
                    v-ripple
                  >
                    <q-icon name="gradient" size="sm" class="q-mb-xs" />
                    <div class="text-caption text-weight-bold" style="font-size: 11px">
                      多光谱融合
                    </div>
                    <q-icon
                      name="check_circle"
                      class="absolute-top-right q-ma-xs"
                      size="14px"
                      v-if="advancedOptions.multiSpectral"
                    />
                  </div>
                </div>

                <!-- Boundary Smoothing -->
                <div class="col-4">
                  <div
                    class="q-pa-sm rounded-borders cursor-pointer transition-all text-center border-light relative-position overflow-hidden"
                    :class="
                      advancedOptions.boundarySmoothing
                        ? 'bg-primary text-white shadow-2'
                        : 'bg-white text-grey-7 hover-bg-grey-2'
                    "
                    @click="advancedOptions.boundarySmoothing = !advancedOptions.boundarySmoothing"
                    v-ripple
                  >
                    <q-icon name="blur_on" size="sm" class="q-mb-xs" />
                    <div class="text-caption text-weight-bold" style="font-size: 11px">
                      边界平滑
                    </div>
                    <q-icon
                      name="check_circle"
                      class="absolute-top-right q-ma-xs"
                      size="14px"
                      v-if="advancedOptions.boundarySmoothing"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="q-mt-md">
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
        <q-card class="q-mb-md shadow-3 rounded-borders" style="border-radius: 16px">
          <q-card-section
            class="row items-center justify-between q-px-md q-py-sm bg-white border-bottom-light"
          >
            <div class="text-subtitle1 text-weight-bold flex items-center text-grey-9">
              <q-icon name="scanner" class="q-mr-sm text-primary" size="20px" />
              病变特征识别结果
            </div>
            <q-btn flat round dense icon="download" color="grey-7" size="sm">
              <q-tooltip>导出图表</q-tooltip>
            </q-btn>
          </q-card-section>

          <q-card-section class="q-pa-md bg-grey-1">
            <div class="bg-white q-pa-sm rounded-borders shadow-1 q-mb-md">
              <div ref="chartRef" style="height: 200px"></div>
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
                <div
                  class="q-mr-sm bg-negative rounded-circle"
                  style="width: 8px; height: 8px"
                ></div>
                <span class="text-brown-9 text-weight-bold">HSIL - 高置信度</span>
              </div>
              <div class="flex items-center q-mb-xs">
                <div
                  class="q-mr-sm bg-warning rounded-circle"
                  style="width: 8px; height: 8px"
                ></div>
                <span class="text-brown-9">LSIL - 中置信度</span>
              </div>
              <div class="flex items-center">
                <div
                  class="q-mr-sm bg-primary rounded-circle"
                  style="width: 8px; height: 8px"
                ></div>
                <span class="text-brown-9">醋酸白上皮 - 已识别</span>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Analysis Log -->
        <!-- Analysis Log -->
        <q-card class="shadow-3 rounded-borders" style="border-radius: 16px">
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
            <q-scroll-area style="height: 200px" class="bg-white">
              <q-list separator class="q-py-xs">
                <q-item v-for="(log, index) in logs" :key="index" class="q-py-sm hover-bg-grey-1">
                  <q-item-section avatar style="min-width: 40px">
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
                  class="text-center text-grey-5 q-pa-md flex flex-center"
                  style="height: 100%"
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
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import * as echarts from 'echarts';
import { useStudyStore } from 'stores/studyStore';
import { useAnalysisStore } from 'stores/analysisStore';
import { type SuspiciousArea } from 'stores/analysisStore';
import ImageAnalyzer from 'components/studies/ImageAnalyzer.vue';

const $q = useQuasar();
const route = useRoute();
const studyStore = useStudyStore();
const analysisStore = useAnalysisStore();

// State
const selectedPatient = ref(null);
const imageType = ref('细胞学涂片 (Cytology)');
const zoomLevel = ref(1);
const isAnalyzing = ref(false);
const progress = ref(0);
const progressStatus = ref('等待开始');
const selectedModel = ref('宫颈病变分割模型 v3.2 (高精度)');
const sensitivity = ref(65);
const confidenceThreshold = ref(85);
const advancedOptions = ref({
  vesselEnhancement: true,
  multiSpectral: false,
  boundarySmoothing: true,
});
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);

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
let pollingIntervalId: NodeJS.Timeout | null = null;
const currentTaskId = ref<string | null>(null);
const lastFailedTask = ref<{ id: string; error?: string } | null>(null);
// 用于跟踪当前进度阶段，避免重复添加日志
let lastProgressPhase = '';
const aiZoomLevel = ref(1);

// Mock Data
const patientOptions = ['张丽 (ID: P20251212001)', '王芳 (ID: P20251211045)'];
const imageTypeOptions = ['细胞学涂片', '阴道镜图像', '组织病理切片'];

// Computed
const study = computed(() => studyStore.currentStudy);

const analysisResult = computed(() => studyStore.currentStudy?.analysisResult || null);

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

// Annotations from AI result
interface Annotation {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

const aiAnnotations = computed<Annotation[]>(() => {
  const result = analysisResult.value;
  if (!result?.suspiciousAreas) return [];

  return result.suspiciousAreas
    .map((area: SuspiciousArea): Annotation | null => {
      // 如果有 box_2d 坐标,使用它
      if (area.box_2d && area.box_2d.length === 4) {
        // 假设 box_2d 是 [ymin, xmin, ymax, xmax] 归一化坐标 (0-1000)
        // 需要转换为 ImageAnalyzer 需要的像素坐标或百分比
        // 这里简化处理,假设 ImageAnalyzer 内部处理缩放
        // 注意:ImageAnalyzer 目前接收的是像素坐标,这里需要知道图片尺寸才能转换
        // 暂时使用模拟数据或后续在 ImageAnalyzer 中支持归一化坐标
        const box = area.box_2d;
        const x = box[1];
        const y = box[0];
        const width = box[3] !== undefined && box[1] !== undefined ? box[3] - box[1] : 0;
        const height = box[2] !== undefined && box[0] !== undefined ? box[2] - box[0] : 0;

        // 确保所有值都不为 undefined
        if (x === undefined || y === undefined) return null;

        return {
          type: 'rect' as const,
          x,
          y,
          width,
          height,
          label: area.description || '异常区域',
          confidence: result.confidence || 0.85,
        };
      }
      return null;
    })
    .filter((item): item is Annotation => item !== null);
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

const startAnalysis = async () => {
  if (!study.value?.id) {
    $q.notify({
      type: 'warning',
      message: '无法启动分析：病例数据未加载',
      position: 'top',
    });
    return;
  }

  // 清除失败状态
  lastFailedTask.value = null;
  isAnalyzing.value = true;
  progress.value = 0;
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
      addLog(`任务已创建: ${taskId}`, 95);

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

const stopAnalysis = () => {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }
  isAnalyzing.value = false;
  progressStatus.value = '已停止';
  addLog('分析已手动停止');
};

// 轮询任务状态
const startPollingTaskStatus = (taskId: string) => {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
  }

  const poll = async () => {
    try {
      const task = await analysisStore.getTaskStatus(taskId);

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
      } else if (task.status === 'SUCCESS') {
        clearInterval(pollingIntervalId!);
        pollingIntervalId = null;
        progressStatus.value = '分析完成';
        addLog('分析完成，正在加载结果...', 99);

        // 平滑过渡到100%
        const animateToComplete = async () => {
          while (progress.value < 100) {
            progress.value = Math.min(progress.value + 2, 100);
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        };

        await animateToComplete();

        // 短暂延迟后关闭进度条
        await new Promise((resolve) => setTimeout(resolve, 800));
        isAnalyzing.value = false;

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
      } else if (task.status === 'FAILED') {
        clearInterval(pollingIntervalId!);
        pollingIntervalId = null;
        isAnalyzing.value = false;
        progressStatus.value = '分析失败';
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
      console.error('轮询任务状态失败:', error);
      addLog('轮询任务状态失败，稍后重试...', 0);
    }
  };

  // 立即执行一次
  void poll();
  // 每2秒轮询一次
  pollingIntervalId = setInterval(() => void poll(), 2000);
};

// 刷新病例数据
const refreshStudyData = async () => {
  const studyId = route.params.id;
  if (studyId) {
    try {
      console.log('🔄 刷新病例数据...');
      // 强制从服务器重新加载
      const updatedStudy = await studyStore.loadStudyById(parseInt(studyId as string), true);
      console.log('✅ 病例数据已刷新', updatedStudy);

      // 检查是否有正在进行的任务，如果有则自动开始轮询
      if (updatedStudy?.status === 'processing' && updatedStudy.taskId) {
        console.log('🔄 检测到正在进行的任务，恢复轮询:', updatedStudy.taskId);
        isAnalyzing.value = true;
        currentTaskId.value = updatedStudy.taskId;
        startPollingTaskStatus(updatedStudy.taskId);
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

onMounted(async () => {
  await refreshStudyData();
});

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

const updateChart = () => {
  if (!chartInstance) return;

  // 使用真实的AI分析结果数据
  const result = analysisResult.value;
  let chartData: { value: number; itemStyle: { color: string } }[] = [];
  let categories: string[] = [];

  if (result?.suspiciousAreas && result.suspiciousAreas.length > 0) {
    chartData = result.suspiciousAreas.slice(0, 5).map(() => {
      const confidence = (result.confidence || 0.85) * 100;
      // 根据置信度设置颜色
      let color = '#375A64';
      if (confidence >= 90) color = '#ef4444';
      else if (confidence >= 75) color = '#f59e0b';

      return {
        value: Math.round(confidence),
        itemStyle: { color },
      };
    });
    categories = result.suspiciousAreas.slice(0, 5).map((_, i) => `区域${i + 1}`);
  } else {
    // 默认模拟数据
    chartData = [
      { value: 92, itemStyle: { color: '#ef4444' } },
      { value: 78, itemStyle: { color: '#f59e0b' } },
      { value: 85, itemStyle: { color: '#375A64' } },
    ];
    categories = ['区域1', '区域2', '区域3'];
  }

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { top: '10%', left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#ccc' } },
    },
    yAxis: { type: 'value', max: 100, splitLine: { lineStyle: { type: 'dashed' } } },
    series: [
      {
        data: chartData,
        type: 'bar',
        barWidth: '40%',
      },
    ],
  };
  chartInstance.setOption(option);
};

// 监听分析结果变化，自动更新图表
watch(
  () => analysisResult.value,
  () => {
    console.log('📊 分析结果变化，更新图表');
    updateChart();
  },
  { deep: true },
);

// 监听study变化，确保数据同步
watch(
  () => study.value,
  (newStudy) => {
    if (newStudy) {
      console.log('📊 病例数据变化，更新UI');
      updateChart();
    }
  },
  { deep: true },
);

onMounted(async () => {
  console.log('🚀 StudyDetailPage 开始加载...');

  // 加载病例数据
  const studyId = route.params.id;
  console.log('🎯 病例ID:', studyId);

  if (studyId) {
    try {
      // 先强制刷新加载最新数据
      console.log('🔄 开始加载病例数据...');
      await studyStore.loadStudyById(parseInt(studyId as string), true);

      console.log('📊 病例状态:', study.value?.status);
      console.log('📊 分析结果:', analysisResult.value);
      console.log('📊 完整病例数据:', study.value);

      // 检查是否有进行中的分析任务
      if (study.value?.status === 'processing') {
        console.log('🔍 检测到病例状态为 processing，查找分析任务...');

        try {
          // 从后端获取最新的分析任务列表
          console.log('📡 调用 fetchTasks, study_id:', study.value.id);
          const tasks = await analysisStore.fetchTasks({ study_id: study.value.id });
          console.log('✅ 获取到任务列表:', tasks);

          // 优先查找进行中的任务
          const activeTask = analysisStore.getActiveTaskByStudyId(study.value.id.toString());
          console.log('🔍 进行中的任务:', activeTask);

          if (activeTask) {
            console.log('✅ 找到进行中的任务:', activeTask);
            currentTaskId.value = activeTask.id;
            isAnalyzing.value = true;
            progress.value = activeTask.progress;
            progressStatus.value = '分析中...';
            startPollingTaskStatus(activeTask.id);
          } else {
            // 没有进行中的任务，查找最新任务（包括刚刚创建的 PENDING 任务）
            const latestTask = analysisStore.getTaskByStudyId(study.value.id.toString());
            console.log('🔍 最新任务:', latestTask);

            if (latestTask) {
              if (latestTask.status === 'PENDING' || latestTask.status === 'PROCESSING') {
                // 找到 PENDING 或 PROCESSING 状态的任务，开始轮询（可能是刚从 UploadPage 跳转过来）
                console.log('✅ 找到待处理/处理中的任务，开始轮询:', latestTask);
                currentTaskId.value = latestTask.id;
                isAnalyzing.value = true;
                progress.value = latestTask.progress;
                progressStatus.value =
                  latestTask.status === 'PENDING' ? '等待开始...' : '分析中...';
                startPollingTaskStatus(latestTask.id);
              } else if (latestTask.status === 'FAILED') {
                // 任务失败，显示失败信息
                console.log('❌ 最新任务已失败:', latestTask);
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
                console.log('✅ 任务成功但状态未同步，刷新数据...');
                await refreshStudyData();
              }
            } else {
              // 没有任何任务，提示用户手动启动
              console.log('⚠️ 未找到任何分析任务');
              $q.notify({
                type: 'info',
                message: '未找到分析任务，请点击"启动"按钮开始分析',
                position: 'top',
                timeout: 3000,
              });
            }
          }
        } catch (fetchError) {
          console.error('🐞 获取任务列表失败:', fetchError);

          // 如果获取任务失败，尝试直接从本地查找
          const activeTask = analysisStore.getActiveTaskByStudyId(study.value.id.toString());
          if (activeTask) {
            console.log('✅ 从本地找到进行中任务:', activeTask);
            currentTaskId.value = activeTask.id;
            isAnalyzing.value = true;
            progress.value = activeTask.progress;
            progressStatus.value = '分析中...';
            startPollingTaskStatus(activeTask.id);
          } else {
            console.log('❌ 本地也没有找到进行中的任务');
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
        console.log('🔄 状态已完成但缺少结果，重新加载...');
        await studyStore.loadStudyById(parseInt(studyId as string), true);
      } else {
        console.log('📊 病例不是 processing 状态，无需轮询');
      }
    } catch (error) {
      console.error('❌ 加载病例数据失败:', error);
      console.error(
        '   - 错误类型:',
        error instanceof Error ? error.constructor.name : typeof error,
      );
      console.error('   - 错误消息:', error instanceof Error ? error.message : String(error));

      $q.notify({
        type: 'negative',
        message: '加载病例数据失败',
        position: 'top',
      });
    }
  }

  console.log('🎯 初始化图表...');
  setTimeout(initChart, 100);
  window.addEventListener('resize', () => chartInstance?.resize());

  console.log('✅ StudyDetailPage 加载完成');
});

onUnmounted(() => {
  // 清理轮询定时器
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }
  window.removeEventListener('resize', () => chartInstance?.resize());
  chartInstance?.dispose();
});
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}
.border-bottom-light {
  border-bottom: 1px solid #f5f5f5;
}
.border-top-light {
  border-top: 1px solid #f5f5f5;
}
.border-light {
  border: 1px solid #e0e0e0;
}
.border-dashed {
  border: 2px dashed #e0e0e0;
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
  background-color: #e0f2f1;
  border-color: #375a64;
}

/* 现代化影像预览样式 */
.image-panel-wrapper {
  transition:
    box-shadow 0.3s ease,
    transform 0.2s ease;
}

.image-panel-wrapper:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
  transform: translateY(-2px);
}

/* 优化图像容器样式 */
.image-container {
  border-radius: 8px;
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
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
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
  border-radius: 20px !important;
  background: linear-gradient(135deg, #1565c0 0%, #0d47a1 50%, #01579b 100%) !important;
  box-shadow:
    0 20px 60px rgba(21, 101, 192, 0.4),
    0 0 40px rgba(33, 150, 243, 0.2);
  pointer-events: auto;
  animation: slideDown 0.4s ease-out;
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

.slide-down-enter-active {
  animation: slideDown 0.4s ease-out;
}

.slide-down-leave-active {
  animation: slideDown 0.3s ease-in reverse;
}

.analysis-icon-container {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
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
  border-radius: 10px;
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
  border-radius: 10px;
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
  box-shadow: 0 0 20px 8px rgba(129, 212, 250, 0.6);
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
