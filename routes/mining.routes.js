const { Router } = require('express');
const { createMiningController } = require('../controllers/mining.controller');
const { writeLimiter } = require('../middleware/rateLimit.middleware');
const asyncRoute = require('../middleware/asyncRoute.middleware');

const createMiningRoutes = (blockchainService) => {
  const router = Router();
  const controller = createMiningController(blockchainService);
  router.post('/', writeLimiter, asyncRoute(controller.mineBlock));
  return router;
};

module.exports = { createMiningRoutes };
