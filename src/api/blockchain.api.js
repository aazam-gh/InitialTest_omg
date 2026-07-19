import client from './client';
import ENDPOINTS from './endpoints';

/** Retrieve serialized blocks and the chain length. */
export const fetchChain = () => client.get(ENDPOINTS.CHAIN);

/** Retrieve the server's current chain-integrity result. */
export const fetchChainValidity = () => client.get(ENDPOINTS.CHAIN_VALID);

/** Retrieve dashboard ledger metrics. */
export const fetchStats = () => client.get(ENDPOINTS.STATS);

/** Retrieve signed transactions that have not yet been mined. */
export const fetchPendingTransactions = () =>
  client.get(ENDPOINTS.TRANSACTIONS_PENDING);

/** Retrieve every transaction already included in the chain. */
export const fetchAllTransactions = () =>
  client.get(ENDPOINTS.TRANSACTIONS_ALL);

/** @param {object} transaction canonical browser-signed transaction to queue */
export const addTransaction = (transaction) => client.post(ENDPOINTS.TRANSACTIONS, transaction);

/** @param {string} miningRewardAddress address that receives the block reward */
export const mineBlock = (miningRewardAddress) =>
  client.post(ENDPOINTS.MINE, { miningRewardAddress });

/** @param {string} address account to retrieve, including pending balance effects */
export const fetchAccount = (address) => client.get(ENDPOINTS.account(address));
/** @param {string} address account whose confirmed balance is requested */
export const fetchBalance = (address) =>
  client.get(ENDPOINTS.balance(address));
/** @param {string} address public wallet metadata to retrieve */
export const fetchWallet = (address) => client.get(ENDPOINTS.wallet(address));

/** Retrieve the two datasets needed for the initial explorer dashboard. */
export const fetchDashboard = () =>
  Promise.all([fetchChain(), fetchStats()]).then(([chainData, statsData]) => ({
    chainData,
    statsData,
  }));
