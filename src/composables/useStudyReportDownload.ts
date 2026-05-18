import { getStudyAnalysis } from 'src/services/apiService';
import {
  patientInsightsAPI,
  type PatientInsightDiseaseAlertData,
  type PatientInsightHistoryData,
  type PatientInsightRiskFactorsData,
  type PatientInsightRiskProfileData,
} from 'src/services/api';
import type { QVueGlobals } from 'quasar';

interface DownloadStudyReportParams {
  id: number;
  $q: QVueGlobals;
}

/**
 * 统一处理病例报告下载流程，页面只保留入口与反馈。
 */
export async function downloadStudyReport({
  id,
  $q,
}: DownloadStudyReportParams): Promise<void> {
  try {
    $q.loading.show({ message: '正在获取病例数据...', spinnerColor: 'primary' });

    const studyData = await getStudyAnalysis(String(id));
    if (!studyData.result) {
      $q.notify({
        type: 'warning',
        message: '该病例暂无分析结果，无法生成报告',
        position: 'top',
      });
      return;
    }

    let historyData: PatientInsightHistoryData | null = null;
    let riskProfileData: PatientInsightRiskProfileData | null = null;
    let riskFactorsData: PatientInsightRiskFactorsData | null = null;
    let diseaseAlertData: PatientInsightDiseaseAlertData | null = null;
    const patientDbId = studyData.studyInfo.patientDbId;

    if (patientDbId) {
      $q.loading.show({ message: '正在整理患者洞察...', spinnerColor: 'primary' });
      const settled = await Promise.allSettled([
        patientInsightsAPI.getHistory(patientDbId, { limit: 6 }),
        patientInsightsAPI.getRiskProfile(patientDbId),
        patientInsightsAPI.getRiskFactors(patientDbId),
        patientInsightsAPI.getDiseaseAlert(patientDbId),
      ]);

      historyData = settled[0].status === 'fulfilled' ? settled[0].value.data || null : null;
      riskProfileData = settled[1].status === 'fulfilled' ? settled[1].value.data || null : null;
      riskFactorsData = settled[2].status === 'fulfilled' ? settled[2].value.data || null : null;
      diseaseAlertData = settled[3].status === 'fulfilled' ? settled[3].value.data || null : null;
    }

    $q.loading.show({ message: '正在生成PDF报告...', spinnerColor: 'primary' });
    const { generatePDFReport } = await import('src/utils/pdfGenerator');

    await generatePDFReport({
      study: {
        id: String(id),
        patientName: studyData.studyInfo.patientName,
        patientId: studyData.studyInfo.patientId,
        studyDate: studyData.studyInfo.studyDate,
        modality: studyData.studyInfo.modality,
        description: studyData.studyInfo.description,
        imageUrl: studyData.studyInfo.imageUrl,
        ...(patientDbId ? { patientDbId } : {}),
      },
      result: studyData.result,
      history: historyData,
      riskProfile: riskProfileData,
      riskFactors: riskFactorsData,
      diseaseAlert: diseaseAlertData,
    });

    $q.notify({
      type: 'positive',
      message: '报告已成功下载！',
      position: 'top',
      icon: 'download',
    });
  } catch (error) {
    console.error('生成 PDF 报告失败:', error);
    $q.notify({
      type: 'negative',
      message: '生成报告失败，请稍后重试',
      position: 'top',
    });
  } finally {
    $q.loading.hide();
  }
}
