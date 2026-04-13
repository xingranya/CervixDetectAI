<template>
  <q-page class="reports-page app-gradient-page">
    <!-- 页面标题 -->
    <div class="page-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="col">
          <div class="text-h5 text-weight-bold q-mb-xs">
            <q-icon name="description" class="q-mr-sm text-primary" />
            报告中心
          </div>
          <div class="text-subtitle2 text-grey-7">管理与下载检测报告，支持 PDF / Word / Excel 多格式导出</div>
        </div>
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="生成报告"
          @click="showGenerateDialog = true"
        />
      </div>
    </div>

    <!-- 筛选栏 -->
    <q-card flat bordered class="modern-card q-mb-md">
      <q-card-section class="q-py-sm">
        <div class="row q-col-gutter-sm items-center">
          <div class="col-md-3 col-sm-6 col-12">
            <q-select
              v-model="filterStatus"
              :options="statusOptions"
              label="状态筛选"
              outlined
              dense
              clearable
              emit-value
              map-options
            />
          </div>
          <div class="col-md-3 col-sm-6 col-12">
            <q-btn flat color="primary" icon="refresh" label="刷新" @click="loadReports" :loading="loading" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- 报告列表 -->
    <q-card flat bordered class="modern-card">
      <q-card-section class="card-header">
        <div class="text-h6 text-weight-bold">
          <q-icon name="history" class="q-mr-sm text-primary" />
          报告列表
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section class="q-pa-none">
        <q-table
          :rows="reports"
          :columns="reportColumns"
          row-key="id"
          :loading="loading"
          :pagination="tablePagination"
          @request="onTableRequest"
          flat
        >
          <!-- 状态列 -->
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="statusColor(props.row.status)"
                :label="statusLabel(props.row.status)"
                rounded
              />
            </q-td>
          </template>

          <!-- 格式列 -->
          <template v-slot:body-cell-format="props">
            <q-td :props="props">
              <q-chip
                dense
                :icon="formatIcon(props.row.file_path)"
                :label="formatLabel(props.row.file_path)"
                :color="formatColor(props.row.file_path)"
                text-color="white"
                size="sm"
              />
            </q-td>
          </template>

          <!-- 患者列 -->
          <template v-slot:body-cell-patient="props">
            <q-td :props="props">
              {{ props.row.patient?.name || '-' }}
              <div class="text-caption text-grey">{{ props.row.patient?.patient_id || '' }}</div>
            </q-td>
          </template>

          <!-- 病例列 -->
          <template v-slot:body-cell-study="props">
            <q-td :props="props">
              {{ props.row.study?.study_id || '-' }}
            </q-td>
          </template>

          <!-- 创建时间 -->
          <template v-slot:body-cell-created_at="props">
            <q-td :props="props">
              {{ formatDate(props.row.created_at) }}
            </q-td>
          </template>

          <!-- 操作列 -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props" class="report-actions-cell">
              <q-btn flat size="sm" no-caps icon="file_download" label="下载" color="teal" @click="downloadReport(props.row)" :loading="downloadingId === props.row.id">
                <q-tooltip>下载报告文件</q-tooltip>
              </q-btn>
              <q-btn flat size="sm" no-caps icon="share" label="分享" color="secondary" @click="openShareDialog(props.row)">
                <q-tooltip>生成分享链接</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- 生成报告对话框 -->
    <q-dialog v-model="showGenerateDialog" persistent>
      <q-card style="min-width: 420px">
        <q-card-section>
          <div class="text-h6">
            <q-icon name="note_add" class="q-mr-sm text-primary" />
            生成报告
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-gutter-md">
          <q-input
            v-model.number="generateForm.study_id"
            label="病例ID（study 主键）"
            type="number"
            outlined
            dense
            stack-label
          />
          <q-select
            v-model="generateForm.format"
            :options="formatOptions"
            label="导出格式"
            outlined
            dense
            emit-value
            map-options
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" color="grey" v-close-popup />
          <q-btn unelevated label="生成" color="primary" icon="play_arrow" @click="generateReport" :loading="generating" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 分享链接对话框 -->
    <q-dialog v-model="showShareDialog">
      <q-card style="min-width: 440px">
        <q-card-section>
          <div class="text-h6">
            <q-icon name="share" class="q-mr-sm text-secondary" />
            分享报告
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section v-if="!shareResult" class="q-gutter-md">
          <q-input
            v-model.number="shareForm.expires_hours"
            label="有效时长（小时）"
            type="number"
            outlined
            dense
            stack-label
          />
          <q-input
            v-model.number="shareForm.max_access_count"
            label="最大访问次数（0=无限制）"
            type="number"
            outlined
            dense
            stack-label
          />
        </q-card-section>
        <q-card-section v-else>
          <div class="text-body2 q-mb-sm text-grey-8">分享链接已生成：</div>
          <q-input
            :model-value="String(shareResult.share_url || '')"
            readonly
            outlined
            dense
          >
            <template v-slot:append>
              <q-btn flat dense icon="content_copy" @click="copyShareUrl">
                <q-tooltip>复制链接</q-tooltip>
              </q-btn>
            </template>
          </q-input>
          <div class="text-caption text-grey q-mt-sm">
            有效期至：{{ formatDate(String(shareResult.expires_at)) }}
            <span v-if="Number(shareResult.max_access_count) > 0">
              · 最多 {{ shareResult.max_access_count }} 次访问
            </span>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="关闭" color="grey" v-close-popup @click="shareResult = null" />
          <q-btn v-if="!shareResult" unelevated label="生成链接" color="secondary" icon="link" @click="createShareLink" :loading="sharing" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { reportAPI } from 'src/services/api';
import { copyToClipboard } from 'quasar';

/** 报告行数据 */
interface ReportRow {
  id: number;
  report_id: string;
  report_title: string;
  file_path: string;
  status: string;
  download_count: number;
  created_at: string;
  patient?: { id: number; patient_id: string; name: string; gender: string };
  study?: { id: number; study_id: string; study_type: string; study_date: string; status: string };
}

/** 分享链接数据 */
interface ShareLinkResult {
  id: number;
  share_url: string;
  share_token: string;
  expires_at: string;
  max_access_count: number;
}

const $q = useQuasar();

// 状态
const loading = ref(false);
const generating = ref(false);
const sharing = ref(false);
const downloadingId = ref<number | null>(null);
const reports = ref<ReportRow[]>([]);
const showGenerateDialog = ref(false);
const showShareDialog = ref(false);
const shareReportId = ref<number | null>(null);
const shareResult = ref<ShareLinkResult | null>(null);

// 筛选
const filterStatus = ref<string | null>(null);
const statusOptions = [
  { label: '全部', value: null },
  { label: '草稿', value: 'draft' },
  { label: '待审核', value: 'pending_review' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
];

// 分页
const tablePagination = ref({
  page: 1,
  rowsPerPage: 15,
  rowsNumber: 0,
  sortBy: 'created_at',
  descending: true,
});

// 生成表单
const generateForm = ref({ study_id: null as number | null, format: 'pdf' });
const formatOptions = [
  { label: 'PDF 文档', value: 'pdf' },
  { label: 'Word 文档', value: 'word' },
  { label: 'Excel 数据表', value: 'excel' },
];

// 分享表单
const shareForm = ref({ expires_hours: 24, max_access_count: 0 });

// 表格列定义
const reportColumns = [
  { name: 'report_id', label: '报告编号', field: 'report_id', align: 'left' as const, sortable: true },
  { name: 'patient', label: '患者', field: 'patient', align: 'left' as const },
  { name: 'study', label: '病例编号', field: 'study', align: 'left' as const },
  { name: 'format', label: '格式', field: 'file_path', align: 'center' as const },
  { name: 'status', label: '状态', field: 'status', align: 'center' as const },
  { name: 'download_count', label: '下载次数', field: 'download_count', align: 'center' as const, sortable: true },
  { name: 'created_at', label: '生成时间', field: 'created_at', align: 'left' as const, sortable: true },
  { name: 'actions', label: '操作', field: 'actions', align: 'center' as const },
];

// 工具函数
function statusColor(s: string) {
  const map: Record<string, string> = { draft: 'grey', pending_review: 'warning', approved: 'positive', rejected: 'negative' };
  return map[s] || 'grey';
}
function statusLabel(s: string) {
  const map: Record<string, string> = { draft: '草稿', pending_review: '待审核', approved: '已通过', rejected: '已拒绝' };
  return map[s] || s;
}
function formatIcon(fp: string) {
  if (!fp) return 'insert_drive_file';
  if (fp.endsWith('.pdf')) return 'picture_as_pdf';
  if (fp.endsWith('.docx')) return 'article';
  if (fp.endsWith('.xlsx')) return 'table_chart';
  return 'insert_drive_file';
}
function formatLabel(fp: string) {
  if (!fp) return '未知';
  if (fp.endsWith('.pdf')) return 'PDF';
  if (fp.endsWith('.docx')) return 'Word';
  if (fp.endsWith('.xlsx')) return 'Excel';
  return '文件';
}
function formatColor(fp: string) {
  if (!fp) return 'grey';
  if (fp.endsWith('.pdf')) return 'red';
  if (fp.endsWith('.docx')) return 'blue';
  if (fp.endsWith('.xlsx')) return 'green';
  return 'grey';
}
function formatDate(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleString('zh-CN');
}

// 加载报告列表
async function loadReports() {
  loading.value = true;
  try {
    const params: Record<string, unknown> = {
      page: tablePagination.value.page,
      limit: tablePagination.value.rowsPerPage,
    };
    if (filterStatus.value) params.status = filterStatus.value;

    const { data } = await reportAPI.list(params);
    const resp = data as { success: boolean; data: { reports: ReportRow[]; pagination?: { total: number } } };
    if (resp.success) {
      reports.value = resp.data.reports;
      tablePagination.value.rowsNumber = resp.data.pagination?.total || 0;
    }
  } catch (error) {
    console.error('加载报告列表失败:', error);
    $q.notify({ type: 'negative', message: '加载报告列表失败', position: 'top' });
  } finally {
    loading.value = false;
  }
}

// 表格分页请求
function onTableRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
  tablePagination.value.page = props.pagination.page;
  tablePagination.value.rowsPerPage = props.pagination.rowsPerPage;
  void loadReports();
}

// 生成报告
async function generateReport() {
  if (!generateForm.value.study_id) {
    $q.notify({ type: 'warning', message: '请输入病例ID', position: 'top' });
    return;
  }
  generating.value = true;
  try {
    const { data } = await reportAPI.generate({
      study_id: generateForm.value.study_id,
      format: generateForm.value.format as 'pdf' | 'word' | 'excel',
    });
    const resp = data as { success: boolean; message?: string };
    if (resp.success) {
      $q.notify({ type: 'positive', message: '报告生成成功！', position: 'top', icon: 'check_circle' });
      showGenerateDialog.value = false;
      void loadReports();
    } else {
      $q.notify({ type: 'negative', message: resp.message || '生成失败', position: 'top' });
    }
  } catch (error: unknown) {
    const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '生成报告失败';
    $q.notify({ type: 'negative', message: msg, position: 'top' });
  } finally {
    generating.value = false;
  }
}

// 下载报告
async function downloadReport(row: ReportRow) {
  downloadingId.value = row.id;
  try {
    const response = await reportAPI.download(row.id);
    const blob = new Blob([response.data as BlobPart]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = row.file_path ? (String(row.file_path).split('/').pop() ?? `report_${row.report_id}`) : `report_${row.report_id}`;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    $q.notify({ type: 'positive', message: '下载成功', position: 'top' });
  } catch {
    $q.notify({ type: 'negative', message: '下载失败', position: 'top' });
  } finally {
    downloadingId.value = null;
  }
}

// 分享
function openShareDialog(row: ReportRow) {
  shareReportId.value = row.id;
  shareResult.value = null;
  shareForm.value = { expires_hours: 24, max_access_count: 0 };
  showShareDialog.value = true;
}

async function createShareLink() {
  if (!shareReportId.value) return;
  sharing.value = true;
  try {
    const { data } = await reportAPI.share(shareReportId.value, shareForm.value);
    const resp = data as { success: boolean; message?: string; data: { share_link: ShareLinkResult } };
    if (resp.success) {
      shareResult.value = resp.data.share_link;
    } else {
      $q.notify({ type: 'negative', message: resp.message || '生成分享链接失败', position: 'top' });
    }
  } catch {
    $q.notify({ type: 'negative', message: '生成分享链接失败', position: 'top' });
  } finally {
    sharing.value = false;
  }
}

function copyShareUrl() {
  if (shareResult.value?.share_url) {
    void copyToClipboard(String(shareResult.value.share_url)).then(() => {
      $q.notify({ type: 'positive', message: '链接已复制到剪贴板', position: 'top' });
    });
  }
}

// 筛选变化时重新加载
watch(filterStatus, () => {
  tablePagination.value.page = 1;
  void loadReports();
});

onMounted(() => {
  void loadReports();
});
</script>

<style scoped lang="scss">
.reports-page {
  padding: 24px 32px;
  min-height: calc(100vh - 64px);
}

.page-header {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--app-border-default);
}

// 操作按钮间距
.report-actions-cell {
  .q-btn + .q-btn {
    margin-left: 4px;
  }
}
</style>

<!-- 暗色模式适配 -->
<style lang="scss">
body.body--dark {
  .reports-page {
    .page-header {
      border-bottom-color: var(--app-border-default);
    }

    .q-table {
      background: var(--app-table-bg);
      color: var(--app-text-primary);
      border-color: var(--app-border-default);

      th {
        color: var(--app-table-header-color);
      }

      tbody tr:hover {
        background: var(--app-table-hover-bg);
      }
    }
  }
}
</style>
