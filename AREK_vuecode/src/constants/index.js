import { getCurrentConfig } from '@/config/environment';

const config = getCurrentConfig();

export const API_BASE_URL = config.API_BASE_URL;
export const PUBLIC_BASE_URL = config.PUBLIC_BASE_URL;

export const API_ENDPOINTS = {
  TEST_PING: '/test_ping',
  TEST_DB: '/test-db',
  SUMMARY_FILTER_OPTIONS: '/query/summary-filter-options',
  SUMMARY_DETAIL_TABLE: '/query/summary-detail-table'
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
