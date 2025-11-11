<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-md">
      <div class="col-12">
        <q-breadcrumbs class="q-mb-md">
          <q-breadcrumbs-el label="仪表盘" to="/app" />
          <q-breadcrumbs-el label="病例管理" to="/app/studies" />
          <q-breadcrumbs-el :label="`病例 ${study?.id}`" />
        </q-breadcrumbs>
        
        <div class="flex items-center justify-between">
          <div>
            <div class="text-h5">{{ study?.patientName }}</div>
            <div class="text-subtitle2">ID: {{ study?.patientId }} | {{ formatDate(study?.studyDate) }}</div>
          </div>
          <div>
            <q-chip
              v-if="study"
              :color="getStatusColor(study.status)"
              text-color="white"
              icon="fiber_manual_record"
            >
              {{ study.status }}
            </q-chip>
          </div>
        </div>
      </div>
    </div>

    <div v-if="studyStore.loading" class="row flex-center q-my-xl">
      <q-spinner size="3em" color="primary" />
    </div>

    <div v-else-if="study" class="row q-col-gutter-md">
      <!-- Image and Analysis Panel -->
      <div class="col-lg-8 col-md-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center">
              <div class="col">
                <div class="text-h6">宫颈图像分析</div>
              </div>
              <div class="col-auto">
                <q-btn 
                  v-if="study.status === 'completed'" 
                  color="primary" 
                  icon="download" 
                  label="下载报告" 
                  no-caps
                  @click="downloadReport"
                />
              </div>
            </div>
          </q-card-section>
          
          <q-separator />
          
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-md-6 col-12">
                <q-img 
                  :src="study.imageUrl" 
                  spinner-color="primary" 
                  style="max-width: 100%;"
                  class="rounded-borders"
                />
              </div>
              
              <div class="col-md-6 col-12">
                <q-card flat bordered v-if="analysisResult">
                  <q-card-section>
                    <div class="text-h6">AI分析结果</div>
                    
                    <q-separator class="q-my-sm" />
                    
                    <div class="q-pa-sm">
                      <div class="row items-center q-mb-md">
                        <div class="col-4">诊断:</div>
                        <div class="col-8">
                          <q-chip 
                            :color="getDiagnosisColor(analysisResult.diagnosis)" 
                            text-color="white"
                            class="text-bold"
                          >
                            {{ analysisResult.diagnosis }}
                          </q-chip>
                        </div>
                      </div>
                      
                      <div class="row items-center q-mb-md">
                        <div class="col-4">置信度:</div>
                        <div class="col-8">
                          <q-linear-progress 
                            :value="analysisResult.confidence" 
                            color="positive" 
                            class="q-mt-sm"
                          />
                          <div class="text-caption text-right">
                            {{ Math.round(analysisResult.confidence * 100) }}%
                          </div>
                        </div>
                      </div>
                      
                      <div class="row items-center q-mb-md">
                        <div class="col-4">生物标志物:</div>
                        <div class="col-8">
                          <q-chip size="sm" color="blue" text-color="white" v-if="analysisResult.biomarkers?.HPV">
                            HPV: {{ analysisResult.biomarkers?.HPV }}
                          </q-chip>
                          <q-chip size="sm" color="blue" text-color="white" v-if="analysisResult.biomarkers?.p16">
                            p16: {{ analysisResult.biomarkers?.p16 }}
                          </q-chip>
                          <q-chip size="sm" color="blue" text-color="white" v-if="analysisResult.biomarkers?.Ki67">
                            Ki67: {{ analysisResult.biomarkers?.Ki67 }}
                          </q-chip>
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
                
                <!-- Task Status for Processing Studies -->
                <q-card flat bordered v-else-if="study.status === 'processing' && currentTask">
                  <q-card-section>
                    <div class="text-h6">分析中</div>
                    <q-linear-progress 
                      :value="currentTask.progress / 100" 
                      color="primary" 
                      class="q-mt-sm"
                    />
                    <div class="text-caption text-right q-mt-sm">
                      {{ currentTask.progress }}% 完成
                    </div>
                    
                    <div class="q-mt-md">
                      <q-spinner color="primary" size="2em" class="on-left" />
                      我们的AI模型正在分析宫颈图像。这可能需要一些时间...
                    </div>
                  </q-card-section>
                </q-card>
                
                <!-- Placeholder when no analysis is available yet -->
                <q-card flat bordered v-else>
                  <q-card-section>
                    <div class="text-h6">等待分析</div>
                    <div class="text-caption">
                      AI分析尚未完成。
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      
      <!-- Recommendations and Details -->
      <div class="col-lg-4 col-md-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">临床建议</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-list v-if="analysisResult?.recommendations">
              <q-item 
                v-for="(rec, index) in analysisResult.recommendations" 
                :key="index"
                class="q-mb-sm"
              >
                <q-item-section avatar>
                  <q-icon color="positive" name="check_circle" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ rec }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-caption text-grey">
              分析完成后将显示建议。
            </div>
            
            <q-separator class="q-my-md" />
            
            <div class="text-subtitle2 q-mb-sm">病例详情</div>
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label caption>检查方式</q-item-label>
                  <q-item-label>{{ study.modality }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>检查部位</q-item-label>
                  <q-item-label>{{ study.bodyPart }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>描述</q-item-label>
                  <q-item-label>{{ study.description || '无描述' }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
        
        <!-- Detailed Report -->
        <q-card flat bordered class="q-mt-md" v-if="analysisResult?.detailedReport">
          <q-card-section>
            <div class="text-h6">详细报告</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pb-none">
            <div class="text-body2" style="white-space: pre-line;">
              {{ analysisResult.detailedReport }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    
    <div v-else class="row flex-center q-my-xl">
      <div class="text-center">
        <q-icon name="warning" size="4rem" class="text-grey" />
        <div class="text-h6 text-grey q-mt-md">未找到病例</div>
        <q-btn color="primary" to="/app/studies" label="返回病例管理" class="q-mt-md" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStudyStore } from 'stores/studyStore';
import { useAnalysisStore } from 'stores/analysisStore';

const route = useRoute();
const studyStore = useStudyStore();
const analysisStore = useAnalysisStore();

// Get study ID from route
const studyId = computed(() => route.params.id as string);

// Get current study
const study = computed(() => studyStore.currentStudy);

// Get current analysis task
const currentTask = computed(() => analysisStore.currentTask);

// Get analysis result
const analysisResult = computed(() => {
  if (currentTask.value?.result) {
    return currentTask.value.result;
  } else if (study.value?.analysisResult) {
    return study.value.analysisResult;
  }
  return undefined;
});

// Function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'green';
    case 'processing': return 'orange';
    case 'failed': return 'red';
    default: return 'grey';
  }
};

// Function to get diagnosis color
const getDiagnosisColor = (diagnosis: string) => {
  switch (diagnosis) {
    case '正常': return 'green';
    case 'ASC-US': return 'orange';
    case 'LSIL': return 'warning';
    case 'HSIL': return 'negative';
    case '浸润性癌': return 'red';
    default: return 'grey';
  }
};

// Function to format date
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};

// Function to download report
const downloadReport = () => {
  // In a real app, this would download the actual report
  console.log('下载病例', studyId.value, '的报告');
  alert(`下载功能将在实际应用中实现，病例 ${studyId.value}`);
};

// Load study when component mounts
onMounted(async () => {
  if (studyId.value) {
    try {
      await studyStore.getStudyById(studyId.value);
      
      // If the study exists and has a completed status, fetch analysis
      if (studyStore.currentStudy?.status === 'completed') {
        await analysisStore.getAnalysisResult(studyId.value);
      }
      // If the study is processing, create an analysis task if needed
      else if (studyStore.currentStudy?.status === 'processing') {
        await analysisStore.getAnalysisResult(studyId.value);
      }
    } catch (error) {
      console.error('加载病例时出错:', error);
      // Optionally redirect to an error page
    }
  }
});
</script>