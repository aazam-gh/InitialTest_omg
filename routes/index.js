const { Router } = require('express');
const { createBlockchainRoutes } = require('./blockchain.routes');
const { createTransactionRoutes } = require('./transaction.routes');
const { createMiningRoutes } = require('./mining.routes');
const { createBalanceRoutes, createAccountRoutes } = require('./balance.routes');
const { createStatsRoutes } = require('./stats.routes');
const { createWalletRoutes } = require('./wallet.routes');

const createApiRoutes = (blockchainService) => {
  const router = Router();

  router.use('/chain', createBlockchainRoutes(blockchainService));
  router.use('/transactions', createTransactionRoutes(blockchainService));
  router.use('/mine', createMiningRoutes(blockchainService));
  router.use('/accounts', createAccountRoutes(blockchainService));
  router.use('/balance', createBalanceRoutes(blockchainService));
  router.use('/stats', createStatsRoutes(blockchainService));
  router.use('/wallets', createWalletRoutes(blockchainService));
  return router;
};

module.exports = { createApiRoutes };
