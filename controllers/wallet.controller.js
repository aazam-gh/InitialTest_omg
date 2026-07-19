const { sendSuccess } = require('../utils/response');
const { validatedAddress } = require('./balance.controller');

/**
 * Build safe wallet metadata handlers. Wallet creation and private-key custody
 * intentionally stay in the browser; this API never creates or receives keys.
 *
 * @param {import('../services/blockchain.service').BlockchainService} blockchainService
 * @returns {{getWallet: Function}}
 */
const createWalletController = (blockchainService) => ({
  getWallet: async (req, res) => {
    const account = await blockchainService.getAccount(validatedAddress(req.params.address));
    sendSuccess(res, { wallet: account, custody: 'browser-local' });
  },
});

module.exports = { createWalletController };
