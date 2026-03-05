const { AsyncLocalStorage } = require('async_hooks');

const requestContext = new AsyncLocalStorage();

const log = (level, message, meta = {}) => {
  const ctx = requestContext.getStore() || {};
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    requestId: ctx.requestId,
    ...meta
  };
  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
};

const logger = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta)
};

module.exports = {
  logger,
  requestContext
};

