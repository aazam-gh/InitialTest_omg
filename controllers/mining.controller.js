const { sendSuccess } = require('../utils/response');

/**
 * Build the mining handler around the injected ledger service.
 *
 * @param {import('../services/blockchain.service').BlockchainService} blockchainService
 * @returns {{mineBlock: Function}}
 */
const createMiningController = (blockchainService) => ({
  mineBlock: async (req, res) => {
    const { miningRewardAddress } = req.body || {};
    const block = await blockchainService.mine(miningRewardAddress);
    sendSuccess(res, {
      message: 'Block mined successfully',
      latestBlock: block.toJSON(),
      chainLength: block.index + 1,
    });
  },
});

module.exports = { createMiningController };
