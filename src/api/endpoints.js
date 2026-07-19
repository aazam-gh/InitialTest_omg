const BASE = '/api';

const ENDPOINTS = {
  CHAIN: `${BASE}/chain`,
  CHAIN_VALID: `${BASE}/chain/valid`,
  TRANSACTIONS: `${BASE}/transactions`,
  TRANSACTIONS_PENDING: `${BASE}/transactions/pending`,
  TRANSACTIONS_ALL: `${BASE}/transactions/all`,
  MINE: `${BASE}/mine`,
  STATS: `${BASE}/stats`,
  account: (address) => `${BASE}/accounts/${encodeURIComponent(address)}`,
  balance: (address) => `${BASE}/balance/${encodeURIComponent(address)}`,
  wallet: (address) => `${BASE}/wallets/${encodeURIComponent(address)}`,
};

export default ENDPOINTS;
