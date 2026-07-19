const { Router } = require('express');
const { createStatsController } = require('../controllers/stats.controller');
const asyncRoute = require('../middleware/asyncRoute.middleware');

const createStatsRoutes = (blockchainService) => {
  const router = Router();
  const controller = createStatsController(blockchainService);
  router.get('/', asyncRoute(controller.getStats));
  return router;
};

module.exports = { createStatsRoutes };
