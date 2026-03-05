import axios from 'axios';
import { API_BASE_URL } from '@/constants';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const apiRequest = {
  get: async (endpoint, params = {}) => {
    const response = await apiClient.get(endpoint, { params });
    return response.data;
  },
  post: async (endpoint, data = {}) => {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  }
};

export default apiRequest;

