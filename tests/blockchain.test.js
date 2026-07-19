const test = require('node:test');
const assert = require('node:assert/strict');
const { secp256k1 } = require('@noble/curves/secp256k1');
const { bytesToHex } = require('@noble/hashes/utils');
const { Blockchain, Transaction, sha256, canonicalTransaction } = require('../models/blockchain');
const { PersistenceService } = require('../services/persistence.service');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');

const createSignedTransaction = ({ privateKey, toAddress, amount, nonce }) => {
  const fromAddress = bytesToHex(secp256k1.getPublicKey(privateKey, true));
  const payload = { fromAddress, toAddress, amount, nonce };
  return new Transaction({ ...payload, signature: bytesToHex(secp256k1.sign(sha256(canonicalTransaction(payload)), privateKey).toCompactRawBytes()) });
};

const wallet = () => ({ privateKey: secp256k1.utils.randomPrivateKey() });

test('only accepts valid locally signed transactions', () => {
  const sender = wallet(); const recipient = wallet();
  const senderAddress = bytesToHex(secp256k1.getPublicKey(sender.privateKey, true));
  const recipientAddress = bytesToHex(secp256k1.getPublicKey(recipient.privateKey, true));
  const chain = new Blockchain({ difficulty: 1, miningReward: '100' });
  chain.minePendingTransactions(senderAddress);
  const transaction = createSignedTransaction({ privateKey: sender.privateKey, toAddress: recipientAddress, amount: '40', nonce: 0 });
  chain.addTransaction(transaction);
  assert.equal(chain.pendingTransactions.length, 1);
  assert.throws(() => chain.addTransaction(new Transaction({ ...transaction.toJSON(), amount: '41' })), /signature|payload/i);
});

test('rejects replayed, non-sequential, and overspending transactions', () => {
  const sender = wallet(); const recipient = wallet();
  const senderAddress = bytesToHex(secp256k1.getPublicKey(sender.privateKey, true));
  const recipientAddress = bytesToHex(secp256k1.getPublicKey(recipient.privateKey, true));
  const chain = new Blockchain({ difficulty: 1, miningReward: '100' });
  chain.minePendingTransactions(senderAddress);
  const transaction = createSignedTransaction({ privateKey: sender.privateKey, toAddress: recipientAddress, amount: '80', nonce: 0 });
  chain.addTransaction(transaction);
  assert.throws(() => chain.addTransaction(transaction), /already/i);
  assert.throws(() => chain.addTransaction(createSignedTransaction({ privateKey: sender.privateKey, toAddress: recipientAddress, amount: '1', nonce: 2 })), /nonce/i);
  assert.throws(() => chain.addTransaction(createSignedTransaction({ privateKey: sender.privateKey, toAddress: recipientAddress, amount: '21', nonce: 1 })), /available/i);
});

test('preserves balances, nonces, and integrity after serialization', () => {
  const sender = wallet(); const recipient = wallet();
  const senderAddress = bytesToHex(secp256k1.getPublicKey(sender.privateKey, true));
  const recipientAddress = bytesToHex(secp256k1.getPublicKey(recipient.privateKey, true));
  const chain = new Blockchain({ difficulty: 1, miningReward: '100' });
  chain.minePendingTransactions(senderAddress);
  chain.addTransaction(createSignedTransaction({ privateKey: sender.privateKey, toAddress: recipientAddress, amount: '45', nonce: 0 }));
  chain.minePendingTransactions(recipientAddress);
  const restored = Blockchain.fromJSON(chain.toJSON());
  assert.equal(restored.getAccount(senderAddress).confirmedBalance, '55');
  assert.equal(restored.getAccount(recipientAddress).confirmedBalance, '145');
  assert.equal(restored.getAccount(senderAddress).nextNonce, 1);
  assert.equal(restored.isChainValid(), true);
  restored.chain[1].transactions[0].amount = '999';
  assert.equal(restored.isChainValid(), false);
});

test('writes atomically and rejects an invalid persisted state', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'chainscope-persistence-'));
  const statePath = path.join(directory, 'state.json');
  const persistence = new PersistenceService(statePath);
  const chain = new Blockchain({ difficulty: 1, miningReward: '100' });
  await persistence.save(chain);
  assert.equal((await persistence.load()).isChainValid(), true);
  await fs.writeFile(statePath, '{not-json}', 'utf8');
  await assert.rejects(() => persistence.load(), /could not be restored/i);
  const names = await fs.readdir(directory);
  assert.ok(names.some((name) => name.startsWith('state.json.invalid-')));
  await fs.rm(directory, { recursive: true, force: true });
});
