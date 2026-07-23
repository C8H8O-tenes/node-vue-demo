import { getCurrentConfig } from '@/config/environment';

const config = getCurrentConfig();

export const API_BASE_URL = config.API_BASE_URL;
export const PUBLIC_BASE_URL = config.PUBLIC_BASE_URL;

export const API_ENDPOINTS = {
  TEST_PING: '/test_ping',
  SUMMARY_FILTER_OPTIONS: '/query/summary-filter-options',
  SUMMARY_DETAIL_TABLE: '/query/summary-detail-table',
  DATASET_INFO: '/query/dataset-info',
  RESULT_TABLE_FILES: '/query/result-table-files',
  RESULT_TABLE_PREVIEW: '/query/result-table-preview',
  RESULT_TABLE_PAGE: '/query/result-table-page',
  RESULT_TABLES: '/query/result-tables',
  RESULT_FIGURES: '/query/result-figures'
};

export const buildApiUrl = (endpoint, params = {}) => {
  const baseUrl = API_BASE_URL.startsWith('http')
    ? API_BASE_URL
    : `${window.location.origin}${API_BASE_URL}`;

  const url = new URL(baseUrl + endpoint);
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
};

export default {
  API_BASE_URL,
  PUBLIC_BASE_URL,
  API_ENDPOINTS,
  buildApiUrl
};
