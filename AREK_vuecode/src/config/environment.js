export const CURRENT_ENV = process.env.NODE_ENV || 'development';

export const ENV_CONFIG = {
  development: {
    API_BASE_URL: '/api',
    PUBLIC_BASE_URL: 'http://localhost:8081/public',
    DEBUG: true
  },
  staging: {
    API_BASE_URL: 'https://rh-luo.cn/AREK/api',
    PUBLIC_BASE_URL: 'https://rh-luo.cn/AREK/public',
    DEBUG: false
  },
  production: {
    API_BASE_URL: 'https://rh-luo.cn/AREK/api',
    PUBLIC_BASE_URL: 'https://rh-luo.cn/AREK/public',
    DEBUG: false
  }
};

export const getCurrentConfig = () => {
  return ENV_CONFIG[CURRENT_ENV] || ENV_CONFIG.development;
};

export default getCurrentConfig();

