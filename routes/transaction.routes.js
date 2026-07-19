const { Router } = require('express');
const { createTransactionController } = require('../controllers/transaction.controller');
const { writeLimiter } = require('../middleware/rateLimit.middleware');
const asyncRoute = require('../middleware/asyncRoute.middleware');

const createTransactionRoutes = (blockchainService) => {
  const router = Router();
  const controller = createTransactionController(blockchainService);
  router.post('/', writeLimiter, asyncRoute(controller.addTransaction));
  router.get('/pending', asyncRoute(controller.getPendingTransactions));
  router.get('/all', asyncRoute(controller.getAllTransactions));
  return router;
};

module.exports = { createTransactionRoutes };
