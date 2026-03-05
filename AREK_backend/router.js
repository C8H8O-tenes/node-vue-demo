const express = require('express');
const router = express.Router();

const db = require('./db');
const queryApi = require('./API/query');
const { SERVER_CONFIG, DATABASE_CONFIG, DB_TABLES, UTILS, HTTP_STATUS } = require('./constants');

router.get('/', (req, res) => {
  UTILS.sendSuccess(res, {
    service: 'AREK backend',
    version: '0.1.0',
    docs: 'Add API modules under ./API and register routes here.'
  }, 'AREK backend is running');
});

router.get('/test_ping', (req, res) => {
  UTILS.sendSuccess(res, {
    status: 'ok',
    time: new Date().toISOString(),
    port: SERVER_CONFIG.PORT
  }, 'Ping test passed');
});

router.get('/test-db', (req, res) => {
  db.query('SELECT 1 as test', (err) => {
    if (err) {
      return UTILS.sendError(res, `Database connection failed: ${err.message}`, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    db.query(`SELECT COUNT(*) as count FROM ${DB_TABLES.GENE_SUMMARY} LIMIT 1`, (err2, results2) => {
      const response = {
        connection: 'successful',
        database: DATABASE_CONFIG.DATABASE,
        host: DATABASE_CONFIG.HOST,
        user: DATABASE_CONFIG.USER,
        timestamp: new Date().toISOString()
      };

      if (err2) {
        response.tableTest = `Table check skipped/failed on ${DB_TABLES.GENE_SUMMARY}: ${err2.message}`;
      } else {
        response.tableTest = `Successfully queried ${DB_TABLES.GENE_SUMMARY} - ${results2[0].count} records`;
      }

      return UTILS.sendSuccess(res, response, 'Database connection test completed');
    });
  });
});

router.get('/query/summary-filter-options', queryApi.getSummaryFilterOptions);
router.get('/query/summary-detail-table', queryApi.getSummaryDetailTable);

module.exports = router;
