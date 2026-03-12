import type { LocationQuery, LocationQueryValue } from 'vue-router';

export interface StudiesQueryState {
  status: 'all' | 'completed' | 'processing' | 'failed';
  patientId: number | null;
  keyword: string;
  page: number;
  rowsPerPage: number;
}

export const DEFAULT_STUDIES_QUERY_STATE: StudiesQueryState = {
  status: 'all',
  patientId: null,
  keyword: '',
  page: 1,
  rowsPerPage: 10,
};

const VALID_STATUSES = new Set<StudiesQueryState['status']>([
  'all',
  'completed',
  'processing',
  'failed',
]);

function getSingleQueryValue(value: LocationQueryValue | LocationQueryValue[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0] ?? undefined;
  }

  return value ?? undefined;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;

  return parsed;
}

export function parseStudiesQuery(query: LocationQuery): StudiesQueryState {
  const rawStatus = getSingleQueryValue(query.status);
  const rawPatientId = getSingleQueryValue(query.patient_id);
  const rawKeyword = getSingleQueryValue(query.keyword);
  const rawPage = getSingleQueryValue(query.page);
  const rawRowsPerPage = getSingleQueryValue(query.rowsPerPage);

  return {
    status: rawStatus && VALID_STATUSES.has(rawStatus as StudiesQueryState['status'])
      ? (rawStatus as StudiesQueryState['status'])
      : DEFAULT_STUDIES_QUERY_STATE.status,
    patientId: rawPatientId ? parsePositiveInteger(rawPatientId, 0) || null : null,
    keyword: rawKeyword?.trim() || '',
    page: parsePositiveInteger(rawPage, DEFAULT_STUDIES_QUERY_STATE.page),
    rowsPerPage: parsePositiveInteger(rawRowsPerPage, DEFAULT_STUDIES_QUERY_STATE.rowsPerPage),
  };
}

export function buildStudiesQuery(state: StudiesQueryState): Record<string, string | undefined> {
  return {
    status: state.status !== DEFAULT_STUDIES_QUERY_STATE.status ? state.status : undefined,
    patient_id: state.patientId ? String(state.patientId) : undefined,
    keyword: state.keyword.trim() || undefined,
    page: state.page !== DEFAULT_STUDIES_QUERY_STATE.page ? String(state.page) : undefined,
    rowsPerPage:
      state.rowsPerPage !== DEFAULT_STUDIES_QUERY_STATE.rowsPerPage
        ? String(state.rowsPerPage)
        : undefined,
  };
}
