const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const { SERVER_CONFIG, PATHS } = require('./constants');
const {
  globalErrorHandler,
  requestIdMiddleware,
  requestLoggingMiddleware,
  notFoundHandler
} = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');
const db = require('./db');
const router = require('./router');

const app = express();

const initializeDatabase = async () => {
  try {
    await db.initialize();
    logger.info('Database connection pool initialized successfully', {
      operation: 'database_init',
      category: 'database'
    });
    return true;
  } catch (error) {
    logger.error('Failed to initialize database connection pool', {
      operation: 'database_init_error',
      category: 'database_error',
      error: { message: error.message, stack: error.stack }
    });
    console.error('Database initialization failed:', error.message);
    return false;
  }
};

const startServer = async () => {
  const dbReady = await initializeDatabase();

  if (!dbReady) {
    logger.warn('Starting server without database connection', {
      operation: 'database_init_skip',
      category: 'database'
    });
  }

  return app.listen(SERVER_CONFIG.PORT, () => {
    logger.info('Server started successfully', {
      operation: 'server_start',
      port: SERVER_CONFIG.PORT,
      environment: SERVER_CONFIG.ENVIRONMENT,
      publicUrl: SERVER_CONFIG.PUBLIC_URL
    });
    console.log(`AREK backend listening on port ${SERVER_CONFIG.PORT}`);
  });
};

const gracefulShutdown = async (signal, server) => {
  logger.info(`${signal} received, shutting down gracefully`, {
    operation: 'server_shutdown',
    signal
  });

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await db.gracefulShutdown();
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', {
      operation: 'shutdown_error',
      signal,
      error: { message: error.message, stack: error.stack }
    });
    process.exit(1);
  }
};

app.use('/public', express.static(PATHS.PUBLIC_DIR, {
  dotfiles: 'ignore',
  etag: false,
  index: false,
  maxAge: '1d',
  redirect: false
}));

app.use(requestIdMiddleware);
app.use(requestLoggingMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(router);
app.use(notFoundHandler);
app.use(globalErrorHandler);

let serverInstance;
startServer().then((server) => {
  serverInstance = server;
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM', serverInstance));
  process.on('SIGINT', () => gracefulShutdown('SIGINT', serverInstance));
}).catch((error) => {
  logger.error('Failed to start server', {
    operation: 'server_start_error',
    category: 'system_error',
    error: { message: error.message, stack: error.stack }
  });
  process.exit(1);
});

