const { Router } = require('express');
const { createWalletController } = require('../controllers/wallet.controller');
const asyncRoute = require('../middleware/asyncRoute.middleware');

const createWalletRoutes = (blockchainService) => {
  const router = Router();
  const controller = createWalletController(blockchainService);
  router.get('/:address', asyncRoute(controller.getWallet));
  return router;
};

module.exports = { createWalletRoutes };
