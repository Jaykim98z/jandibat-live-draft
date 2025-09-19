// client/src/services/api.ts
import axios from 'axios';

// API 기본 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 (로깅용)
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API 요청: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('❌ API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (에러 처리)
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API 응답: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API 응답 오류:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;