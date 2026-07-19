const { sendSuccess } = require('../utils/response');

/**
 * Build the ledger statistics handler around the injected service.
 *
 * @param {import('../services/blockchain.service').BlockchainService} blockchainService
 * @returns {{getStats: Function}}
 */
const createStatsController = (blockchainService) => ({
  getStats: async (req, res) => sendSuccess(res, await blockchainService.getStats()),
});

module.exports = { createStatsController };
