const { Router } = require('express');
const { createBlockchainController } = require('../controllers/blockchain.controller');
const asyncRoute = require('../middleware/asyncRoute.middleware');

const createBlockchainRoutes = (blockchainService) => {
  const router = Router();
  const controller = createBlockchainController(blockchainService);
  router.get('/', asyncRoute(controller.getChain));
  router.get('/valid', asyncRoute(controller.validateChain));
  return router;
};

module.exports = { createBlockchainRoutes };
