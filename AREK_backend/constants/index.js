const path = require('path');

const BASE_PATHS = {
  DATA_ROOT: process.env.DATA_ROOT || (process.env.NODE_ENV === 'production' ? '/data/AREK_DATA' : '.'),
  get PUBLIC_ROOT() {
    return path.join(this.DATA_ROOT, 'public');
  }
};

const SERVER_CONFIG = {
  PORT: process.env.PORT || 8081,
  HOST: process.env.HOST || 'localhost',
  PUBLIC_URL: process.env.PUBLIC_URL || 'https://rh-luo.cn/AREK',
  ENVIRONMENT: process.env.NODE_ENV || 'development'
};

const DATABASE_CONFIG = {
  HOST: process.env.DB_HOST || 'localhost',
  USER: process.env.DB_USER || 'AREKdb',
  PASSWORD: process.env.DB_PASSWORD || 'Arek@123456',
  DATABASE: process.env.DB_NAME || 'AREKdb',
  CONNECTION_LIMIT: process.env.DB_CONNECTION_LIMIT || 10
};

const PATHS = {
  PUBLIC_DIR: BASE_PATHS.PUBLIC_ROOT,
  DATASET_DIR: path.join(BASE_PATHS.PUBLIC_ROOT, 'dataset'),
  DEGS_DIR: path.join(BASE_PATHS.PUBLIC_ROOT, 'degs'),
  SUMMARY_TABLE_CSV: process.env.SUMMARY_TABLE_CSV || path.resolve(process.cwd(), '..', 'summarytable.csv')
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

const MESSAGES = {
  SUCCESS: {
    DATA_RETRIEVED: 'Data retrieved successfully'
  },
  ERROR: {
    DATABASE_ERROR: 'Database operation failed',
    SERVER_ERROR: 'Internal server error',
    NOT_FOUND: 'Resource not found'
  }
};

// Keep table names aligned with RMzyme by default to minimize code changes later.
const DB_TABLES = {
  RMP_SC_MYSQL: 'rmp_sc_mysql',
  RMP_BULK_MYSQL: 'rmp_bulk_mysql',
  RMP_TARGET_MYSQL: 'rmp_target_mysql',
  RBP_PTM_MYSQL: 'rbp_ptm_mysql',
  DATASETS_INFO: 'datasets_info',
  GENE_SUMMARY: 'gene_summary',
  DRUG_SUMMARY: 'drug_summary',
  CPTAC_SUMMARY: 'cptac_summary',
  PTM_TABLE23: 'ptm_table23',
  RBP_SITE: 'rbp_site',
  MERGE_SUMMARY: 'merge_summary',
  TARGET_SUMMARY: 'target_summary',
  LRH_RMP_MUTATION: 'lrh_rmp_mutaion',
  TARGET_LOC_SUMMARY: 'target_loc_summary',
  SCOMATIC_MAF_SUMMARY: 'SComatic_maf_summary'
};

const UTILS = {
  generateRequestId(prefix = 'req') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  },

  sendSuccess(res, data, message = MESSAGES.SUCCESS.DATA_RETRIEVED) {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId: UTILS.generateRequestId('ok')
    });
  },

  sendError(res, message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, code = 'ERROR') {
    res.status(statusCode).json({
      success: false,
      error: { message, code },
      timestamp: new Date().toISOString(),
      requestId: UTILS.generateRequestId('err')
    });
  }
};

module.exports = {
  BASE_PATHS,
  SERVER_CONFIG,
  DATABASE_CONFIG,
  PATHS,
  HTTP_STATUS,
  MESSAGES,
  DB_TABLES,
  UTILS
};
