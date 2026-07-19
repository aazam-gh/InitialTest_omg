const logger = require('../utils/logger');
const { sendError } = require('../utils/response');

// Express requires the 4-argument signature to recognise an error handler
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const clientErrors = [
    'Transaction payload is malformed',
    'Transaction signature is invalid',
    'Transaction nonce is not the next expected nonce',
    'Transaction exceeds the available balance',
    'Invalid compressed secp256k1 address',
    'Invalid mining reward address',
    'Address must be a compressed secp256k1 public key',
  ];
  const status = err.status || err.statusCode || (clientErrors.includes(err.message) ? 400 : err.message === 'Transaction has already been submitted' ? 409 : 500);
  const message =
    status < 500 ? err.message : 'An unexpected error occurred';

  logger.error(`[${req.method}] ${req.originalUrl} → ${status}: ${err.message}`);

  sendError(res, message, status);
};

module.exports = errorHandler;
