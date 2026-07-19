const { sendSuccess } = require('../utils/response');

/**
 * Build chain read handlers around the injected ledger service.
 *
 * @param {import('../services/blockchain.service').BlockchainService} blockchainService
 * @returns {{getChain: Function, validateChain: Function}}
 */
const createBlockchainController = (blockchainService) => ({
  getChain: async (req, res) => {
    const chain = await blockchainService.getChain();
    sendSuccess(res, { chain, length: chain.length });
  },
  validateChain: async (req, res) => {
    const stats = await blockchainService.getStats();
    sendSuccess(res, { isValid: stats.isValid });
  },
});

module.exports = { createBlockchainController };
