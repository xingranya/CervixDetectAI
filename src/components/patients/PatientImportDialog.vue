<template>
  <q-dialog
    v-model="dialogVisible"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="import-dialog-card">
      <!-- 标题栏 -->
      <q-card-section class="row items-center q-pb-none dialog-header">
        <div class="text-h6">
          <q-icon name="upload_file" class="q-mr-sm" />
          批量导入患者
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="handleClose" />
      </q-card-section>

      <q-separator />

      <!-- 步骤导航 -->
      <q-card-section class="q-pa-none">
        <q-stepper v-model="step" ref="stepperRef" color="primary" animated flat>
          <!-- 步骤一：文件上传 -->
          <q-step :name="1" title="上传文件" icon="cloud_upload" :done="step > 1">
            <div class="upload-step">
              <!-- 下载模板 -->
              <div class="q-mb-lg text-center">
                <q-btn
                  flat
                  no-caps
                  color="primary"
                  icon="download"
                  label="下载导入模板"
                  :loading="downloadingTemplate"
                  @click="handleDownloadTemplate"
                />
                <div class="text-caption text-grey-6 q-mt-xs">
                  请按照模板格式填写数据，支持 .csv / .xlsx / .xls 文件
                </div>
              </div>

              <!-- 拖拽上传区域 -->
              <div
                class="upload-dropzone"
                :class="{ 'dropzone-active': isDragging }"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleDrop"
                @click="triggerFileInput"
              >
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  class="hidden"
                  @change="handleFileChange"
                />
                <q-icon name="cloud_upload" size="64px" color="primary" class="q-mb-md" />
                <div class="text-h6 text-grey-8">拖拽文件到此处</div>
                <div class="text-body2 text-grey-6 q-mt-xs">或点击选择文件</div>
                <div class="text-caption text-grey-5 q-mt-sm">支持 CSV、Excel 文件，最大 10MB</div>
              </div>

              <!-- 已选文件 -->
              <div v-if="selectedFile" class="selected-file q-mt-md">
                <q-chip
                  removable
                  color="primary"
                  text-color="white"
                  icon="description"
                  @remove="selectedFile = null"
                >
                  {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
                </q-chip>
              </div>
            </div>

            <q-stepper-navigation class="q-mt-lg">
              <q-btn
                color="primary"
                label="上传并预览"
                icon="visibility"
                no-caps
                :loading="uploading"
                :disable="!selectedFile"
                @click="handleUpload"
              />
            </q-stepper-navigation>
          </q-step>

          <!-- 步骤二：数据预览 -->
          <q-step :name="2" title="数据预览" icon="table_chart" :done="step > 2">
            <!-- 统计摘要 -->
            <div v-if="previewData" class="preview-stats q-mb-md">
              <div class="row q-gutter-md">
                <div class="col-auto">
                  <q-chip color="blue-1" text-color="blue-9" icon="list">
                    总计 {{ previewData.total }} 条
                  </q-chip>
                </div>
                <div class="col-auto">
                  <q-chip color="green-1" text-color="green-9" icon="check_circle">
                    有效 {{ previewData.valid }} 条
                  </q-chip>
                </div>
                <div v-if="previewData.invalid > 0" class="col-auto">
                  <q-chip color="red-1" text-color="red-9" icon="error">
                    错误 {{ previewData.invalid }} 条
                  </q-chip>
                </div>
                <div v-if="previewData.duplicate > 0" class="col-auto">
                  <q-chip color="orange-1" text-color="orange-9" icon="content_copy">
                    重复 {{ previewData.duplicate }} 条
                  </q-chip>
                </div>
              </div>
            </div>

            <!-- 数据表格 -->
            <q-table
              v-if="previewData"
              :rows="previewData.rows"
              :columns="previewColumns"
              row-key="_rowIndex"
              selection="multiple"
              v-model:selected="selectedRows"
              flat
              bordered
              dense
              :rows-per-page-options="[10, 20, 50, 0]"
              class="preview-table"
            >
              <!-- 行样式：错误行红色、重复行黄色 -->
              <template v-slot:body="props">
                <q-tr :props="props" :class="getRowClass(props.row)">
                  <q-td auto-width>
                    <q-checkbox v-model="props.selected" dense :disable="hasErrors(props.row)" />
                  </q-td>
                  <q-td v-for="col in props.cols" :key="col.name" :props="props">
                    <template v-if="col.name === 'status'">
                      <q-badge v-if="hasErrors(props.row)" color="red" :label="'错误'" />
                      <q-badge v-else-if="props.row._duplicate" color="orange" :label="'重复'" />
                      <q-badge v-else color="green" :label="'有效'" />
                    </template>
                    <template v-else-if="col.name === 'issues'">
                      <div v-if="hasErrors(props.row)" class="text-red text-caption">
                        {{ props.row._errors?.join('；') }}
                      </div>
                      <div v-else-if="props.row._duplicate" class="text-orange text-caption">
                        {{ props.row._duplicateReason }}
                        <template v-if="props.row._existingPatient">
                          （已有患者：{{ props.row._existingPatient.name }}）
                        </template>
                      </div>
                      <span v-else class="text-green text-caption">通过</span>
                    </template>
                    <template v-else-if="col.name === 'gender'">
                      {{ formatGender(props.row.gender) }}
                    </template>
                    <template v-else>
                      {{ col.value }}
                    </template>
                  </q-td>
                </q-tr>
              </template>
            </q-table>

            <q-stepper-navigation class="q-mt-lg">
              <q-btn
                color="primary"
                label="确认导入"
                icon="check"
                no-caps
                :loading="importing"
                :disable="selectedRows.length === 0"
                @click="handleConfirmImport"
              />
              <q-btn
                flat
                no-caps
                color="grey"
                label="返回上一步"
                class="q-ml-sm"
                @click="step = 1"
              />
              <span class="text-caption text-grey-6 q-ml-md">
                已选择 {{ selectedRows.length }} 条数据
              </span>
            </q-stepper-navigation>
          </q-step>

          <!-- 步骤三：导入结果 -->
          <q-step :name="3" title="导入结果" icon="done_all">
            <div v-if="importResult" class="result-section text-center q-py-lg">
              <q-icon
                :name="importResult.imported > 0 ? 'check_circle' : 'warning'"
                :color="importResult.imported > 0 ? 'positive' : 'warning'"
                size="80px"
                class="q-mb-md"
              />
              <div class="text-h5 q-mb-md">
                {{ importResult.imported > 0 ? '导入完成' : '导入失败' }}
              </div>

              <div class="row justify-center q-gutter-lg q-mb-lg">
                <div class="text-center">
                  <div class="text-h4 text-positive">{{ importResult.imported }}</div>
                  <div class="text-caption text-grey-6">成功导入</div>
                </div>
                <div class="text-center">
                  <div class="text-h4 text-grey">{{ importResult.skipped }}</div>
                  <div class="text-caption text-grey-6">跳过</div>
                </div>
              </div>

              <div v-if="importResult.errors.length > 0" class="q-mb-md">
                <q-banner rounded class="bg-red-1 text-red-9">
                  <template v-slot:avatar>
                    <q-icon name="error" color="red" />
                  </template>
                  <div v-for="(err, i) in importResult.errors" :key="i">{{ err }}</div>
                </q-banner>
              </div>
            </div>

            <q-stepper-navigation>
              <q-btn color="primary" label="关闭" no-caps @click="handleClose" />
            </q-stepper-navigation>
          </q-step>
        </q-stepper>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import {
  importAPI,
  type ImportPreviewData,
  type ImportPreviewRow,
  type ImportConfirmData,
} from 'src/services/api';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'imported'): void;
}>();

const $q = useQuasar();

// 对话框可见性双向绑定
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

// 步骤状态
const step = ref(1);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const importing = ref(false);
const downloadingTemplate = ref(false);

// 预览数据
const previewData = ref<ImportPreviewData | null>(null);
const selectedRows = ref<ImportPreviewRow[]>([]);
const importResult = ref<ImportConfirmData | null>(null);

// 预览表格列定义
const previewColumns = [
  {
    name: 'status',
    label: '状态',
    field: '_rowIndex',
    align: 'center' as const,
    style: 'width: 60px',
  },
  {
    name: '_rowIndex',
    label: '行号',
    field: '_rowIndex',
    align: 'center' as const,
    style: 'width: 50px',
  },
  { name: 'name', label: '姓名', field: 'name', align: 'left' as const },
  { name: 'gender', label: '性别', field: 'gender', align: 'center' as const },
  { name: 'birth_date', label: '出生日期', field: 'birth_date', align: 'left' as const },
  { name: 'phone', label: '手机号', field: 'phone', align: 'left' as const },
  { name: 'id_card', label: '身份证号', field: 'id_card', align: 'left' as const },
  {
    name: 'issues',
    label: '问题',
    field: '_errors',
    align: 'left' as const,
    style: 'min-width: 150px',
  },
];

// 对话框打开时重置状态
watch(dialogVisible, (val) => {
  if (val) resetState();
});

/** 重置所有状态 */
function resetState() {
  step.value = 1;
  selectedFile.value = null;
  previewData.value = null;
  selectedRows.value = [];
  importResult.value = null;
  uploading.value = false;
  importing.value = false;
  isDragging.value = false;
}

/** 关闭对话框 */
function handleClose() {
  dialogVisible.value = false;
}

/** 触发文件选择 */
function triggerFileInput() {
  fileInputRef.value?.click();
}

/** 文件选择事件 */
function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) selectedFile.value = file;
  // 清空 input 以支持重复选择同一文件
  target.value = '';
}

/** 拖拽放置事件 */
function handleDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
    $q.notify({ type: 'warning', message: '仅支持 CSV 和 Excel 文件', position: 'top' });
    return;
  }
  selectedFile.value = file;
}

/** 格式化文件大小 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 格式化性别 */
function formatGender(gender: string): string {
  const map: Record<string, string> = { male: '男', female: '女', other: '其他' };
  return map[gender] || gender;
}

/** 判断行是否有错误 */
function hasErrors(row: ImportPreviewRow): boolean {
  return !!row._errors && row._errors.length > 0;
}

/** 获取行样式类 */
function getRowClass(row: ImportPreviewRow): string {
  if (hasErrors(row)) return 'row-error';
  if (row._duplicate) return 'row-duplicate';
  return '';
}

/** 下载导入模板 */
async function handleDownloadTemplate() {
  downloadingTemplate.value = true;
  try {
    const blob = await importAPI.downloadTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patient_import_template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    $q.notify({ type: 'negative', message: '下载模板失败', position: 'top' });
  } finally {
    downloadingTemplate.value = false;
  }
}

/** 上传文件并获取预览 */
async function handleUpload() {
  if (!selectedFile.value) return;

  uploading.value = true;
  try {
    const res = await importAPI.previewPatients(selectedFile.value);
    if (res.success && res.data) {
      previewData.value = res.data;
      // 默认选中所有有效且非重复的行
      selectedRows.value = res.data.rows.filter((r) => !hasErrors(r) && !r._duplicate);
      step.value = 2;
    } else {
      $q.notify({ type: 'negative', message: res.message || '解析失败', position: 'top' });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '上传失败，请重试';
    $q.notify({ type: 'negative', message: msg, position: 'top' });
  } finally {
    uploading.value = false;
  }
}

/** 确认导入 */
async function handleConfirmImport() {
  if (!previewData.value || selectedRows.value.length === 0) return;

  importing.value = true;
  try {
    // 计算选中行在 rows 数组中的索引
    const allRows = previewData.value.rows;
    const selectedIndices = selectedRows.value
      .map((r) => allRows.findIndex((ar) => ar._rowIndex === r._rowIndex))
      .filter((i) => i >= 0);

    const res = await importAPI.confirmImport({
      previewId: previewData.value.previewId,
      selectedIndices,
    });

    if (res.success && res.data) {
      importResult.value = res.data;
      step.value = 3;
      // 通知父组件刷新列表
      if (res.data.imported > 0) {
        emit('imported');
      }
    } else {
      $q.notify({ type: 'negative', message: res.message || '导入失败', position: 'top' });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '导入失败，请重试';
    $q.notify({ type: 'negative', message: msg, position: 'top' });
  } finally {
    importing.value = false;
  }
}
</script>

<style scoped lang="scss">
.import-dialog-card {
  max-width: 1200px;
  margin: 24px auto;
  height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
}

.upload-dropzone {
  border: 2px dashed var(--app-border-default);
  border-radius: var(--app-radius-lg, 16px);
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover,
  &.dropzone-active {
    border-color: var(--q-primary);
    background: rgba(25, 118, 210, 0.04);
  }
}

.preview-table {
  max-height: calc(100vh - 380px);

  // 错误行高亮
  :deep(.row-error) {
    background: rgba(244, 67, 54, 0.06) !important;
  }

  // 重复行高亮
  :deep(.row-duplicate) {
    background: rgba(255, 152, 0, 0.06) !important;
  }
}

.result-section {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>

<!-- 暗色模式适配 -->
<style lang="scss">
body.body--dark {
  .import-dialog-card {
    .dialog-header {
      background: var(--app-elevated-bg);
      border-bottom: 1px solid var(--app-border-default);
      color: var(--app-text-primary);
    }

    .upload-dropzone {
      border-color: var(--app-border-default);

      &:hover,
      &.dropzone-active {
        border-color: var(--q-primary);
        background: rgba(25, 118, 210, 0.08);
      }
    }

    .preview-table {
      :deep(.row-error) {
        background: rgba(244, 67, 54, 0.12) !important;
      }

      :deep(.row-duplicate) {
        background: rgba(255, 152, 0, 0.12) !important;
      }
    }
  }
}
</style>
