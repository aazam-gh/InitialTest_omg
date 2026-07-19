const crypto = require('crypto');
const { secp256k1 } = require('@noble/curves/secp256k1');

const ADDRESS_PATTERN = /^[0-9a-f]{66}$/i;
const SIGNATURE_PATTERN = /^[0-9a-f]{128}$/i;
const AMOUNT_PATTERN = /^[1-9][0-9]*$/;

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const isAddress = (value) => {
  if (typeof value !== 'string' || !ADDRESS_PATTERN.test(value)) return false;
  try {
    secp256k1.ProjectivePoint.fromHex(value);
    return true;
  } catch {
    return false;
  }
};

const isAmount = (value) => typeof value === 'string' && AMOUNT_PATTERN.test(value);

const canonicalTransaction = ({ fromAddress, toAddress, amount, nonce }) =>
  JSON.stringify({ version: 1, fromAddress, toAddress, amount, nonce });

class Transaction {
  constructor({ fromAddress, toAddress, amount, nonce, signature }) {
    this.version = 1;
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.nonce = nonce;
    this.signature = signature;
    this.id = sha256(canonicalTransaction(this));
  }

  static createReward(toAddress, amount, blockIndex) {
    const reward = Object.create(Transaction.prototype);
    reward.version = 1;
    reward.fromAddress = null;
    reward.toAddress = toAddress;
    reward.amount = amount;
    reward.nonce = blockIndex;
    reward.signature = null;
    reward.id = sha256(JSON.stringify({ version: 1, type: 'reward', toAddress, amount, blockIndex }));
    return reward;
  }

  static fromJSON(data) {
    if (!data || typeof data.id !== 'string' || !/^[0-9a-f]{64}$/i.test(data.id)) {
      throw new Error('Transaction ID is required and must be a SHA-256 hash');
    }
    const tx = data.fromAddress === null
      ? Transaction.createReward(data.toAddress, data.amount, data.nonce)
      : new Transaction(data);
    if (data.id !== tx.id) throw new Error('Transaction ID does not match its payload');
    return tx;
  }

  signingPayload() {
    return canonicalTransaction(this);
  }

  signingHash() {
    return sha256(this.signingPayload());
  }

  isReward() {
    return this.fromAddress === null;
  }

  validateShape() {
    if (this.version !== 1 || !isAddress(this.toAddress) || this.toAddress !== this.toAddress.toLowerCase() || !isAmount(this.amount)) return false;
    if (this.isReward()) return Number.isSafeInteger(this.nonce) && this.nonce >= 1;
    return isAddress(this.fromAddress) && this.fromAddress === this.fromAddress.toLowerCase() && Number.isSafeInteger(this.nonce) && this.nonce >= 0 &&
      typeof this.signature === 'string' && SIGNATURE_PATTERN.test(this.signature);
  }

  verifySignature() {
    if (this.isReward()) return true;
    if (!this.validateShape()) return false;
    try {
      return secp256k1.verify(this.signature, this.signingHash(), this.fromAddress, { lowS: true });
    } catch {
      return false;
    }
  }

  toJSON() {
    return {
      version: this.version,
      id: this.id,
      fromAddress: this.fromAddress,
      toAddress: this.toAddress,
      amount: this.amount,
      nonce: this.nonce,
      signature: this.signature,
    };
  }
}

class Block {
  constructor({ index, timestamp, transactions, previousHash, nonce = 0, hash } = {}) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = nonce;
    this.hash = hash || this.calculateHash();
  }

  calculateHash() {
    return sha256(JSON.stringify({
      version: 1,
      index: this.index,
      timestamp: this.timestamp,
      transactionIds: this.transactions.map((transaction) => transaction.id),
      previousHash: this.previousHash,
      nonce: this.nonce,
    }));
  }

  mine(difficulty) {
    const target = '0'.repeat(difficulty);
    while (!this.hash.startsWith(target)) {
      this.nonce += 1;
      this.hash = this.calculateHash();
    }
  }

  hasValidProof(difficulty) {
    return this.hash.startsWith('0'.repeat(difficulty));
  }

  toJSON() {
    return {
      index: this.index,
      timestamp: this.timestamp,
      transactions: this.transactions.map((transaction) => transaction.toJSON()),
      previousHash: this.previousHash,
      nonce: this.nonce,
      hash: this.hash,
    };
  }
}

class Blockchain {
  constructor({ difficulty = 2, miningReward = '100' } = {}) {
    if (!Number.isSafeInteger(difficulty) || difficulty < 1 || difficulty > 5) {
      throw new Error('Difficulty must be an integer between 1 and 5');
    }
    if (!isAmount(miningReward)) throw new Error('Mining reward must be a positive integer amount');
    this.version = 1;
    this.difficulty = difficulty;
    this.miningReward = miningReward;
    this.chain = [new Block({ index: 0, timestamp: 0, transactions: [], previousHash: '0' })];
    this.pendingTransactions = [];
  }

  static fromJSON(data) {
    if (!data || data.version !== 1 || !Array.isArray(data.chain) || !Array.isArray(data.pendingTransactions)) {
      throw new Error('Unsupported blockchain state format');
    }
    const blockchain = new Blockchain({ difficulty: data.difficulty, miningReward: data.miningReward });
    blockchain.chain = data.chain.map((block) => new Block({
      ...block,
      transactions: block.transactions.map((transaction) => Transaction.fromJSON(transaction)),
    }));
    blockchain.pendingTransactions = data.pendingTransactions.map((transaction) => Transaction.fromJSON(transaction));
    if (!blockchain.isChainValid()) throw new Error('Persisted blockchain state failed validation');
    return blockchain;
  }

  getLatestBlock() { return this.chain[this.chain.length - 1]; }

  getConfirmedBalance(address) {
    let balance = 0n;
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.fromAddress === address) balance -= BigInt(transaction.amount);
        if (transaction.toAddress === address) balance += BigInt(transaction.amount);
      }
    }
    return balance;
  }

  getAvailableBalance(address) {
    let balance = this.getConfirmedBalance(address);
    for (const transaction of this.pendingTransactions) {
      if (transaction.fromAddress === address) balance -= BigInt(transaction.amount);
    }
    return balance;
  }

  getNextNonce(address) {
    let nextNonce = 0;
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.fromAddress === address) nextNonce = Math.max(nextNonce, transaction.nonce + 1);
      }
    }
    for (const transaction of this.pendingTransactions) {
      if (transaction.fromAddress === address) nextNonce = Math.max(nextNonce, transaction.nonce + 1);
    }
    return nextNonce;
  }

  getAccount(address) {
    if (!isAddress(address)) throw new Error('Invalid compressed secp256k1 address');
    return {
      address: address.toLowerCase(),
      confirmedBalance: this.getConfirmedBalance(address).toString(),
      availableBalance: this.getAvailableBalance(address).toString(),
      nextNonce: this.getNextNonce(address),
    };
  }

  hasTransaction(id) {
    return this.pendingTransactions.some((transaction) => transaction.id === id) ||
      this.chain.some((block) => block.transactions.some((transaction) => transaction.id === id));
  }

  addTransaction(transaction) {
    if (!(transaction instanceof Transaction) || transaction.isReward()) throw new Error('Only signed user transactions may enter the pending pool');
    if (!transaction.validateShape()) throw new Error('Transaction payload is malformed');
    if (!transaction.verifySignature()) throw new Error('Transaction signature is invalid');
    if (this.hasTransaction(transaction.id)) throw new Error('Transaction has already been submitted');
    if (transaction.nonce !== this.getNextNonce(transaction.fromAddress)) throw new Error('Transaction nonce is not the next expected nonce');
    if (BigInt(transaction.amount) > this.getAvailableBalance(transaction.fromAddress)) {
      throw new Error('Transaction exceeds the available balance');
    }
    this.pendingTransactions.push(transaction);
    return transaction;
  }

  minePendingTransactions(miningRewardAddress) {
    if (!isAddress(miningRewardAddress)) throw new Error('Invalid mining reward address');
    const index = this.chain.length;
    const reward = Transaction.createReward(miningRewardAddress.toLowerCase(), this.miningReward, index);
    const block = new Block({
      index,
      timestamp: Date.now(),
      transactions: [...this.pendingTransactions, reward],
      previousHash: this.getLatestBlock().hash,
    });
    block.mine(this.difficulty);
    this.chain.push(block);
    this.pendingTransactions = [];
    return block;
  }

  isChainValid() {
    if (!Array.isArray(this.chain) || this.chain.length === 0) return false;
    const genesis = this.chain[0];
    if (genesis.index !== 0 || genesis.previousHash !== '0' || genesis.hash !== genesis.calculateHash()) return false;
    const confirmedNonces = new Map();
    const balances = new Map();
    const addBalance = (address, amount) => balances.set(address, (balances.get(address) || 0n) + amount);
    const seen = new Set();

    for (let i = 1; i < this.chain.length; i += 1) {
      const block = this.chain[i];
      const previous = this.chain[i - 1];
      if (block.index !== i || block.previousHash !== previous.hash || block.hash !== block.calculateHash() || !block.hasValidProof(this.difficulty)) return false;
      const rewards = block.transactions.filter((transaction) => transaction.isReward());
      if (rewards.length !== 1 || rewards[0].amount !== this.miningReward || rewards[0].nonce !== i || !rewards[0].validateShape()) return false;
      for (const transaction of block.transactions) {
        if (seen.has(transaction.id) || !transaction.validateShape() || (!transaction.isReward() && !transaction.verifySignature())) return false;
        seen.add(transaction.id);
        if (!transaction.isReward()) {
          const expectedNonce = confirmedNonces.get(transaction.fromAddress) || 0;
          const balance = balances.get(transaction.fromAddress) || 0n;
          if (transaction.nonce !== expectedNonce || BigInt(transaction.amount) > balance) return false;
          confirmedNonces.set(transaction.fromAddress, expectedNonce + 1);
          addBalance(transaction.fromAddress, -BigInt(transaction.amount));
        }
        addBalance(transaction.toAddress, BigInt(transaction.amount));
      }
    }
    for (const transaction of this.pendingTransactions) {
      if (seen.has(transaction.id) || !transaction.validateShape() || !transaction.verifySignature()) return false;
      const expectedNonce = confirmedNonces.get(transaction.fromAddress) || 0;
      const balance = balances.get(transaction.fromAddress) || 0n;
      if (transaction.nonce !== expectedNonce || BigInt(transaction.amount) > balance) return false;
      seen.add(transaction.id);
      confirmedNonces.set(transaction.fromAddress, expectedNonce + 1);
      addBalance(transaction.fromAddress, -BigInt(transaction.amount));
      addBalance(transaction.toAddress, BigInt(transaction.amount));
    }
    return true;
  }

  toJSON() {
    return {
      version: this.version,
      difficulty: this.difficulty,
      miningReward: this.miningReward,
      chain: this.chain.map((block) => block.toJSON()),
      pendingTransactions: this.pendingTransactions.map((transaction) => transaction.toJSON()),
    };
  }
}

module.exports = { Blockchain, Block, Transaction, isAddress, isAmount, sha256, canonicalTransaction };
