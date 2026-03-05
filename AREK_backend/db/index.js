const mysql = require('mysql2/promise');
const { DATABASE_CONFIG } = require('../constants');

const pool = mysql.createPool({
  host: DATABASE_CONFIG.HOST,
  user: DATABASE_CONFIG.USER,
  password: DATABASE_CONFIG.PASSWORD,
  database: DATABASE_CONFIG.DATABASE,
  waitForConnections: true,
  connectionLimit: parseInt(DATABASE_CONFIG.CONNECTION_LIMIT, 10) || 10,
  queueLimit: 0,
  idleTimeout: 300000,
  maxIdle: 5,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  timezone: '+00:00',
  supportBigNumbers: true,
  bigNumberStrings: true
});

let healthCheckInterval;
let isShuttingDown = false;

const checkConnection = async () => {
  if (isShuttingDown) return false;
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('[AREK DB] Health check failed:', error.message);
    return false;
  }
};

const startHealthMonitoring = () => {
  if (healthCheckInterval) return;
  healthCheckInterval = setInterval(async () => {
    if (!isShuttingDown) await checkConnection();
  }, 4 * 60 * 60 * 1000);
};

const stopHealthMonitoring = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
};

const queryPromise = async (sql, params = []) => {
  if (isShuttingDown) {
    throw new Error('Database is shutting down');
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.execute(sql, params);
    return results;
  } finally {
    if (connection) connection.release();
  }
};

const queryCallback = (sql, params, callback) => {
  if (typeof params === 'function') {
    callback = params;
    params = [];
  }
  queryPromise(sql, params)
    .then((results) => callback(null, results))
    .catch((error) => callback(error));
};

const gracefulShutdown = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  stopHealthMonitoring();
  try {
    await pool.end();
  } catch (error) {
    console.error('[AREK DB] Shutdown error:', error.message);
  }
};

const initialize = async () => {
  const ok = await checkConnection();
  if (!ok) throw new Error('Initial connection health check failed');
  startHealthMonitoring();
};

const legacyConnection = {
  query: queryCallback,
  end: gracefulShutdown,
  destroy: gracefulShutdown
};

module.exports = legacyConnection;
module.exports.pool = pool;
module.exports.queryPromise = queryPromise;
module.exports.checkConnection = checkConnection;
module.exports.gracefulShutdown = gracefulShutdown;
module.exports.initialize = initialize;
module.exports.isShuttingDown = () => isShuttingDown;
module.exports.startHealthMonitoring = startHealthMonitoring;
module.exports.stopHealthMonitoring = stopHealthMonitoring;

