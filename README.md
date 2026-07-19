# ChainScope

ChainScope is an educational, single-node blockchain explorer. It demonstrates proof-of-work blocks, signed secp256k1 transfers, pending-versus-confirmed balances, validated local persistence, and a separate Solidity ERC-20 artifact. It is deliberately not a cryptocurrency, decentralized network, or production wallet.

## Features

- An Express API with routes, controllers, a ledger service, and a persistence service.
- A React dashboard that creates or imports a browser-local encrypted wallet, signs transfers, mines blocks, and explores the chain.
- A JSON state snapshot that is restored and validated before use; writes are serialized and atomic.
- An OpenZeppelin fixed-supply ERC-20 contract with Hardhat compile, test, and deployment commands.

## Architecture

```text
React UI -> src/api helpers -> Express routes -> controllers -> BlockchainService -> blockchain model
                                                                    |
                                                              PersistenceService
```

Routes only map HTTP requests. Controllers shape responses, `BlockchainService` coordinates ledger operations and durable snapshots, and `models/blockchain.js` owns validation, transaction, mining, and chain invariants. Frontend wallet cryptography lives in `src/utils/wallet.js`; the API never creates, receives, or stores a private key.

## Prerequisites

- Node.js 20 or later
- npm

Install the dependencies and create local configuration:

```bash
npm install
cp .env.example .env
```

## Run locally

Start the API in one terminal:

```bash
npm run dev
```

Start the React development server in another:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000). The API prefers port `3002`, writes its actual port to `.server-port`, and the development proxy reads that file. If the preferred port is occupied, the server selects the next available port.

For a production-style local run, build the UI and serve it from Express:

```bash
npm run serve
```

## Demo flow

1. Create a wallet with a passphrase of at least 12 characters. Download its encrypted backup if it must survive browser storage being cleared.
2. Mine a block to pay the wallet a reward.
3. Create or import a second wallet and copy its public address.
4. Unlock the funded wallet, submit an integer-base-unit transfer, and confirm it enters the pending pool.
5. Mine again to confirm the transfer, then inspect the new block and both balances.

Refreshing the page locks the wallet. The private key is decrypted only in the browser while signing.

## API reference

Successful API responses use `{ "success": true, "data": ... }`; failures use `{ "success": false, "error": "..." }`. Write endpoints are rate-limited and accept JSON bodies up to 32 KB.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Process readiness, environment, uptime, and timestamp. |
| GET | `/api/chain` | Serialized blocks and chain length. |
| GET | `/api/chain/valid` | Whether the current chain passes validation. |
| GET | `/api/stats` | Block, transaction, difficulty, reward, and validity summary. |
| GET | `/api/transactions/pending` | Pending signed transfers. |
| GET | `/api/transactions/all` | Confirmed transactions across all blocks. |
| POST | `/api/transactions` | Queue a valid signed transfer. |
| POST | `/api/mine` | Mine pending transfers and issue a reward. |
| GET | `/api/accounts/:address` | Confirmed, pending, available balances and next nonce. |
| GET | `/api/balance/:address` | Confirmed balance only. |
| GET | `/api/wallets/:address` | Public account metadata and custody declaration. |

Addresses are lowercase compressed secp256k1 public keys. Transaction amounts are positive integer base units, never floating-point values. A transaction submitted to `POST /api/transactions` must include `version`, `id`, `fromAddress`, `toAddress`, `amount`, `nonce`, and `signature`; use the UI or `signedTransaction` helper to produce its canonical payload and signature. Mining requires:

```json
{ "miningRewardAddress": "<compressed-secp256k1-public-key>" }
```

## Configuration

Copy `.env.example` to `.env`. The defaults are suitable for the local demo.

| Variable | Default | Meaning |
|---|---:|---|
| `PORT` | `3002` | Preferred API port; the server finds the next free port when needed. |
| `CORS_ORIGIN` | `http://localhost:3000` | Browser origin allowed by CORS. |
| `BLOCKCHAIN_DIFFICULTY` | `2` | Proof-of-work difficulty, an integer from 1 to 5. |
| `BLOCKCHAIN_MINING_REWARD` | `100` | Positive integer base units paid when a block is mined. |
| `BLOCKCHAIN_STATE_PATH` | `./blockchain.json` | State snapshot path. `.env.example` sets `./data/blockchain.json`. |
| `RPC_URL` | unset | Optional external RPC endpoint for Solidity deployment. |
| `DEPLOYER_PRIVATE_KEY` | unset | Optional deployment account private key; never commit it. |
| `INITIAL_TOKEN_SUPPLY` | `1000000` | Whole `AST` tokens minted to the deployer. |

If persisted state is malformed or fails validation, startup moves it to an `.invalid-<timestamp>.json` diagnostic backup and fails rather than replacing it silently. Remove or repair that backup only after inspection.

## Smart contract

[`contracts/AssessmentToken.sol`](contracts/AssessmentToken.sol) is a fixed-supply OpenZeppelin ERC-20 named `Assessment Token` (`AST`). Its constructor mints `initialSupply * 10 ** decimals()` to the deployer. Standard `Transfer` and `Approval` events, balances, allowances, and transfer behavior come from OpenZeppelin's `ERC20` implementation.

The contract is intentionally independent of the JavaScript ledger: mining ChainScope blocks does not mint AST, and AST transfers do not appear in the explorer.

```bash
npm run contract:compile
npm run contract:test

# Ephemeral in-process Hardhat deployment
npm run contract:deploy

# External deployment after setting RPC_URL and DEPLOYER_PRIVATE_KEY in .env
npx hardhat run scripts/deploy-contract.js --network external
```

## Verification

Run the following from the repository root:

```bash
npm test
npm run test:frontend
npm run lint
npm run build
npm run contract:compile
npm run contract:test
```

## Deliberate boundaries

- One local node only: there are no peers, consensus, forks, networking, or real settlement.
- Mining is synchronous with intentionally low difficulty so the demo remains responsive.
- The browser wallet and encrypted backup are learning tools, not production key custody.
- JSON snapshots provide a recoverable local demo store, not a multi-user database or audit system.
