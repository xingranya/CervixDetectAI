/**
 * 患者管理 API 服务
 * 提供患者 CRUD 操作的 API 接口
 */
import apiClient from './apiClient';

/**
 * 性生活习惯选项
 */
export const sexualHistoryOptions = [
  { value: 'none', label: '无性生活' },
  { value: 'regular', label: '规律性生活' },
  { value: 'irregular', label: '不规律性生活' },
  { value: 'multiple_partners', label: '多个性伴侣' },
  { value: 'early_sexual_activity', label: '过早开始性生活（<18岁）' },
  { value: 'other', label: '其他' },
];

/**
 * 性别选项
 */
export const genderOptions = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
];

/**
 * 患者信息接口（后端蛇形命名转驼峰）
 */
export interface Patient {
  id: number;
  patientId: string;
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  phone: string;
  sexualHistory:
    | 'none'
    | 'regular'
    | 'irregular'
    | 'multiple_partners'
    | 'early_sexual_activity'
    | 'other';
  idCard?: string;
  medicalCardNo?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  allergyHistory?: string;
  medicalHistory?: string;
  familyHistory?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 后端返回的原始患者数据（蛇形命名）
 */
interface PatientRaw {
  id: number;
  patient_id: string;
  name: string;
  gender: 'male' | 'female';
  birth_date: string;
  phone: string;
  sexual_history: string;
  id_card?: string;
  medical_card_no?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  emergency_relation?: string;
  allergy_history?: string;
  medical_history?: string;
  family_history?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 创建患者请求
 */
export interface CreatePatientRequest {
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  phone: string;
  sexualHistory: string;
  idCard?: string;
  medicalCardNo?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  allergyHistory?: string;
  medicalHistory?: string;
  familyHistory?: string;
  notes?: string;
}

/**
 * 患者列表响应
 */
export interface PatientListResponse {
  patients: Patient[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 蛇形命名转驼峰命名
 */
function transformPatient(raw: PatientRaw): Patient {
  const patient: Patient = {
    id: raw.id,
    patientId: raw.patient_id,
    name: raw.name,
    gender: raw.gender,
    birthDate: raw.birth_date || '',
    phone: raw.phone || '',
    sexualHistory: (raw.sexual_history as Patient['sexualHistory']) || 'none',
  };

  // 条件赋值可选属性（避免 undefined 类型问题）
  if (raw.id_card) patient.idCard = raw.id_card;
  if (raw.medical_card_no) patient.medicalCardNo = raw.medical_card_no;
  if (raw.address) patient.address = raw.address;
  if (raw.emergency_contact) patient.emergencyContact = raw.emergency_contact;
  if (raw.emergency_phone) patient.emergencyPhone = raw.emergency_phone;
  if (raw.emergency_relation) patient.emergencyRelation = raw.emergency_relation;
  if (raw.allergy_history) patient.allergyHistory = raw.allergy_history;
  if (raw.medical_history) patient.medicalHistory = raw.medical_history;
  if (raw.family_history) patient.familyHistory = raw.family_history;
  if (raw.notes) patient.notes = raw.notes;
  if (raw.created_at) patient.createdAt = raw.created_at;
  if (raw.updated_at) patient.updatedAt = raw.updated_at;

  return patient;
}

/**
 * 驼峰命名转蛇形命名（用于请求）
 */
function transformRequest(data: CreatePatientRequest): Record<string, unknown> {
  return {
    name: data.name,
    gender: data.gender,
    birth_date: data.birthDate,
    phone: data.phone,
    sexual_history: data.sexualHistory,
    id_card: data.idCard,
    medical_card_no: data.medicalCardNo,
    address: data.address,
    emergency_contact: data.emergencyContact,
    emergency_phone: data.emergencyPhone,
    emergency_relation: data.emergencyRelation,
    allergy_history: data.allergyHistory,
    medical_history: data.medicalHistory,
    family_history: data.familyHistory,
    notes: data.notes,
  };
}

/**
 * 获取患者列表
 * @param params 查询参数
 */
export async function getPatients(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PatientListResponse> {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      patients: PatientRaw[];
      pagination: { total: number; page: number; limit: number };
    };
  }>('/patients', { params });

  const { patients, pagination } = response.data.data;
  return {
    patients: patients.map(transformPatient),
    total: pagination.total,
    page: pagination.page,
    limit: pagination.limit,
  };
}

/**
 * 获取单个患者详情
 * @param id 患者 ID
 */
export async function getPatient(id: number): Promise<Patient> {
  const response = await apiClient.get<{
    success: boolean;
    data: { patient: PatientRaw };
  }>(`/patients/${id}`);
  return transformPatient(response.data.data.patient);
}

/**
 * 创建患者
 * @param data 患者信息
 */
export async function createPatient(data: CreatePatientRequest): Promise<Patient> {
  const response = await apiClient.post<{
    success: boolean;
    data: { patient: PatientRaw };
  }>('/patients', transformRequest(data));
  return transformPatient(response.data.data.patient);
}

/**
 * 更新患者信息
 * @param id 患者 ID
 * @param data 更新数据
 */
export async function updatePatient(
  id: number,
  data: Partial<CreatePatientRequest>,
): Promise<Patient> {
  const response = await apiClient.put<{
    success: boolean;
    data: { patient: PatientRaw };
  }>(`/patients/${id}`, transformRequest(data as CreatePatientRequest));
  return transformPatient(response.data.data.patient);
}

/**
 * 删除患者
 * @param id 患者 ID
 */
export async function deletePatient(id: number): Promise<void> {
  await apiClient.delete(`/patients/${id}`);
}

/**
 * 获取患者的所有病例
 * @param id 患者 ID
 */
export async function getPatientStudies(id: number): Promise<unknown[]> {
  const response = await apiClient.get<{
    success: boolean;
    data: { studies: unknown[] };
  }>(`/patients/${id}/studies`);
  return response.data.data.studies;
}

/**
 * 搜索患者（用于下拉选择）
 * @param keyword 搜索关键词
 */
export async function searchPatients(keyword: string): Promise<Patient[]> {
  const response = await getPatients({ search: keyword, limit: 20 });
  return response.patients;
}

export default {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientStudies,
  searchPatients,
  sexualHistoryOptions,
  genderOptions,
};
