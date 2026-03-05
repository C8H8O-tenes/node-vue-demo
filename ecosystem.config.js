module.exports = {
  apps: [{
    name: 'arek-backend',
    script: './app.js',
    cwd: '/data/vue_AREK/AREK_backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      DATA_ROOT: '/data/AREK_DATA',
      PORT: 8081,
      PUBLIC_URL: 'https://rh-luo.cn/AREK',
      DB_HOST: 'localhost',
      DB_USER: 'AREKdb',
      DB_PASSWORD: 'Arek@123456',
      DB_NAME: 'AREKdb',
      DB_CONNECTION_LIMIT: 10
    },
    error_file: '/data/AREK_META/logs/arek-backend-error.log',
    out_file: '/data/AREK_META/logs/arek-backend-out.log',
    log_file: '/data/AREK_META/logs/arek-backend-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    pmx: false
  }]
};
