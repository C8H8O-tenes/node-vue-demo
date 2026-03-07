const express = require('express');
const router = express.Router();

const queryApi = require('./API/query');
const { SERVER_CONFIG, UTILS } = require('./constants');

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

router.get('/query/summary-filter-options', queryApi.getSummaryFilterOptions);
router.get('/query/summary-detail-table', queryApi.getSummaryDetailTable);

module.exports = router;
