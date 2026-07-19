const { sendCreated, sendSuccess } = require('../utils/response');

/**
 * Build transaction handlers around the injected ledger service.
 *
 * @param {import('../services/blockchain.service').BlockchainService} blockchainService
 * @returns {{addTransaction: Function, getPendingTransactions: Function, getAllTransactions: Function}}
 */
const createTransactionController = (blockchainService) => ({
  addTransaction: async (req, res) => {
    const transaction = await blockchainService.addTransaction(req.body);
    sendCreated(res, {
      message: 'Signed transaction added to the pending pool',
      transaction: transaction.toJSON(),
    });
  },
  getPendingTransactions: async (req, res) => {
    const pendingTransactions = await blockchainService.getPendingTransactions();
    sendSuccess(res, { pendingTransactions, count: pendingTransactions.length });
  },
  getAllTransactions: async (req, res) => {
    const transactions = await blockchainService.getAllTransactions();
    sendSuccess(res, { transactions, count: transactions.length });
  },
});

module.exports = { createTransactionController };
