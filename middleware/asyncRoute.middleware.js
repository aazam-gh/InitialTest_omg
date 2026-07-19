/**
 * Wrap an async Express handler and forward rejected promises to the shared
 * error middleware.
 *
 * @param {import('express').RequestHandler} handler asynchronous route handler
 * @returns {import('express').RequestHandler} Express-compatible handler
 */
const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = asyncRoute;
