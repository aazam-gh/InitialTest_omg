const { isAddress } = require('../models/blockchain');
const { sendSuccess } = require('../utils/response');

const validatedAddress = (value) => {
  if (!isAddress(value)) {
    const error = new Error('Address must be a compressed secp256k1 public key');
    error.status = 400;
    throw error;
  }
  return value.toLowerCase();
};

/**
 * Build account and balance handlers around the injected ledger service.
 *
 * @param {import('../services/blockchain.service').BlockchainService} blockchainService
 * @returns {{getAccount: Function, getBalance: Function}}
 */
const createBalanceController = (blockchainService) => ({
  getAccount: async (req, res) => {
    sendSuccess(res, await blockchainService.getAccount(validatedAddress(req.params.address)));
  },
  getBalance: async (req, res) => {
    const account = await blockchainService.getAccount(validatedAddress(req.params.address));
    sendSuccess(res, { address: account.address, balance: account.confirmedBalance });
  },
});

module.exports = { createBalanceController, validatedAddress };
