const path = require('path');
const { Blockchain, Transaction } = require('../models/blockchain');
const { PersistenceService } = require('./persistence.service');

class BlockchainService {
  /**
   * Own the canonical in-memory ledger and its durable persistence boundary.
   *
   * @param {{difficulty: number, miningReward: string, statePath?: string}} options
   */
  constructor({ difficulty, miningReward, statePath }) {
    this.options = { difficulty, miningReward };
    this.persistence = new PersistenceService(statePath || path.join(process.cwd(), 'blockchain.json'));
    this.blockchain = new Blockchain(this.options);
    this.ready = this.initialize();
  }

  /** Restore a persisted ledger before any public operation is served. */
  async initialize() {
    const restored = await this.persistence.load();
    if (restored) this.blockchain = restored;
  }

  /**
   * Validate, queue, and persist a signed transaction.
   *
   * @param {object} payload serialized transaction submitted by a client
   * @returns {Promise<Transaction>} queued canonical transaction
   */
  async addTransaction(payload) {
    await this.ready;
    let transaction;
    let added;
    try {
      transaction = Transaction.fromJSON(payload);
      added = this.blockchain.addTransaction(transaction);
    } catch (error) {
      error.status = error.message === 'Transaction has already been submitted' ? 409 : 400;
      throw error;
    }
    await this.persistence.save(this.blockchain);
    return added;
  }

  /**
   * Mine the pending pool and persist the resulting block.
   *
   * @param {string} miningRewardAddress compressed secp256k1 recipient address
   * @returns {Promise<import('../models/blockchain').Block>} mined block
   */
  async mine(miningRewardAddress) {
    await this.ready;
    let block;
    try {
      block = this.blockchain.minePendingTransactions(miningRewardAddress);
    } catch (error) {
      error.status = 400;
      throw error;
    }
    await this.persistence.save(this.blockchain);
    return block;
  }

  /** @param {string} address account address @returns {Promise<object>} account balances and nonce */
  async getAccount(address) { await this.ready; return this.blockchain.getAccount(address); }

  /** @returns {Promise<object[]>} serialized blocks in canonical order */
  async getChain() { await this.ready; return this.blockchain.toJSON().chain; }

  /** @returns {Promise<object[]>} serialized transactions awaiting confirmation */
  async getPendingTransactions() {
    await this.ready;
    return this.blockchain.pendingTransactions.map((transaction) => transaction.toJSON());
  }
  /** @returns {Promise<object[]>} all transactions already included in blocks */
  async getAllTransactions() {
    const chain = await this.getChain();
    return chain.flatMap((block) => block.transactions);
  }
  /** @returns {Promise<object>} current ledger metrics and integrity state */
  async getStats() {
    await this.ready;
    return {
      chainLength: this.blockchain.chain.length,
      pendingTransactions: this.blockchain.pendingTransactions.length,
      totalTransactions: this.blockchain.chain.reduce((count, block) => count + block.transactions.length, 0),
      difficulty: this.blockchain.difficulty,
      miningReward: this.blockchain.miningReward,
      isValid: this.blockchain.isChainValid(),
      latestBlockHash: this.blockchain.getLatestBlock().hash,
    };
  }
}

module.exports = { BlockchainService };
