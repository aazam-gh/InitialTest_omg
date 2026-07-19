const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const request = require('supertest');
const { secp256k1 } = require('@noble/curves/secp256k1');
const { bytesToHex } = require('@noble/hashes/utils');
const { createApp } = require('../server');
const { BlockchainService } = require('../services/blockchain.service');
const { sha256, canonicalTransaction } = require('../models/blockchain');

const signedPayload = (privateKey, toAddress, amount, nonce) => {
  const fromAddress = bytesToHex(secp256k1.getPublicKey(privateKey, true));
  const base = { fromAddress, toAddress, amount, nonce };
  return { version: 1, ...base, id: sha256(canonicalTransaction(base)), signature: bytesToHex(secp256k1.sign(sha256(canonicalTransaction(base)), privateKey).toCompactRawBytes()) };
};

test('mines to a wallet and accepts only its locally signed transfer', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'chainscope-api-'));
  const statePath = path.join(directory, 'state.json');
  const service = new BlockchainService({ difficulty: 1, miningReward: '100', statePath });
  await service.ready;
  const app = createApp({ blockchainService: service });
  const health = await request(app).get('/health').expect(200);
  assert.equal(health.body.status, 'ok');
  const first = secp256k1.utils.randomPrivateKey();
  const second = secp256k1.utils.randomPrivateKey();
  const firstAddress = bytesToHex(secp256k1.getPublicKey(first, true));
  const secondAddress = bytesToHex(secp256k1.getPublicKey(second, true));
  const initialChain = await request(app).get('/api/chain').expect(200);
  assert.equal(initialChain.body.length, 1);
  await request(app).post('/api/mine').send({ miningRewardAddress: firstAddress }).expect(200);
  const payload = signedPayload(first, secondAddress, '25', 0);
  await request(app).post('/api/transactions').send(payload).expect(201);
  const pending = await request(app).get('/api/transactions/pending').expect(200);
  assert.equal(pending.body.count, 1);
  const account = await request(app).get(`/api/accounts/${firstAddress}`).expect(200);
  assert.equal(account.body.availableBalance, '75');
  const balance = await request(app).get(`/api/balance/${firstAddress}`).expect(200);
  assert.equal(balance.body.balance, '100');
  const wallet = await request(app).get(`/api/wallets/${firstAddress}`).expect(200);
  assert.equal(wallet.body.wallet.availableBalance, '75');
  assert.equal(wallet.body.custody, 'browser-local');
  await request(app).post('/api/mine').send({ miningRewardAddress: secondAddress }).expect(200);
  const recipient = await request(app).get(`/api/accounts/${secondAddress}`).expect(200);
  assert.equal(recipient.body.confirmedBalance, '125');
  const transactions = await request(app).get('/api/transactions/all').expect(200);
  assert.equal(transactions.body.count, 3);
  const stats = await request(app).get('/api/stats').expect(200);
  assert.equal(stats.body.isValid, true);
  const validity = await request(app).get('/api/chain/valid').expect(200);
  assert.equal(validity.body.isValid, true);

  const restoredService = new BlockchainService({ difficulty: 1, miningReward: '100', statePath });
  await restoredService.ready;
  assert.equal((await restoredService.getAccount(secondAddress)).confirmedBalance, '125');
  await fs.rm(directory, { recursive: true, force: true });
});

test('returns consistent client errors for invalid API input', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'chainscope-api-errors-'));
  const statePath = path.join(directory, 'state.json');
  const service = new BlockchainService({ difficulty: 1, miningReward: '100', statePath });
  await service.ready;
  const app = createApp({ blockchainService: service });

  for (const response of [
    await request(app).post('/api/transactions').send({}),
    await request(app).post('/api/mine').send({ miningRewardAddress: 'not-an-address' }),
    await request(app).get('/api/accounts/not-an-address'),
    await request(app).get('/api/wallets/not-an-address'),
  ]) {
    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.equal(typeof response.body.error, 'string');
  }

  await request(app).get('/api/not-a-route').expect(404, { success: false, error: 'Route not found' });
  await fs.rm(directory, { recursive: true, force: true });
});
