const { Router } = require('express');
const { createBalanceController } = require('../controllers/balance.controller');
const asyncRoute = require('../middleware/asyncRoute.middleware');

const createBalanceRoutes = (blockchainService) => {
  const router = Router();
  const controller = createBalanceController(blockchainService);
  router.get('/:address', asyncRoute(controller.getBalance));
  return router;
};

const createAccountRoutes = (blockchainService) => {
  const router = Router();
  const controller = createBalanceController(blockchainService);
  router.get('/:address', asyncRoute(controller.getAccount));
  return router;
};

module.exports = { createBalanceRoutes, createAccountRoutes };
