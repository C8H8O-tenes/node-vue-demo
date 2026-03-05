const { AsyncLocalStorage } = require('async_hooks');
const { HTTP_STATUS, UTILS } = require('../constants');
const { logger, requestContext } = require('../utils/logger');

const als = requestContext || new AsyncLocalStorage();

const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || UTILS.generateRequestId('req');
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  als.run({ requestId }, () => next());
};

const requestLoggingMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('HTTP request completed', {
      operation: 'http_request',
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: Date.now() - start
    });
  });
  next();
};

const notFoundHandler = (req, res) => {
  UTILS.sendError(res, 'Route not found', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
};

const globalErrorHandler = (err, req, res, next) => {
  logger.error('Unhandled route error', {
    operation: 'http_error',
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    error: { message: err.message, stack: err.stack }
  });

  if (res.headersSent) {
    return next(err);
  }
  return UTILS.sendError(res, err.message || 'Internal server error', err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR);
};

module.exports = {
  globalErrorHandler,
  requestIdMiddleware,
  requestLoggingMiddleware,
  notFoundHandler
};

