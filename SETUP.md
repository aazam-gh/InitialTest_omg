# Setup and interview walkthrough

This guide is the shortest path to a reproducible local demonstration. For the full API, configuration, contract, and limitation reference, see [README.md](README.md).

## Start the application

Use Node.js 20 or later.

```bash
npm install
cp .env.example .env
```

In terminal one, start the API and wait for its URL:

```bash
npm run dev
```

In terminal two, start the React development server:

```bash
npm start
```

Visit [http://localhost:3000](http://localhost:3000). The API prefers `http://localhost:3002`, but records the chosen port in `.server-port` if it has to use another port. The React proxy reads that file.

## Demonstrate the core flow

1. Create a password-protected browser wallet (minimum 12-character passphrase) and optionally export its encrypted keystore.
2. Mine a block using that public address to receive the configured mining reward.
3. Create or import another wallet; use its address as the recipient.
4. Unlock the funded wallet and submit an integer-base-unit transfer. Explain that its signature and canonical transaction ID are created in the browser.
5. Inspect the pending transaction and available balance, then mine a second block to make the transfer confirmed.
6. Refresh the page to show that the wallet is locked and that private-key custody remains browser-local.

## What to explain

- A block commits to its predecessor hash, timestamp, index, nonce, and transactions. Proof of work requires the configured leading-zero prefix.
- Signed transfers use a fixed-order payload, SHA-256 transaction ID, per-address nonce, signature verification, ID de-duplication, and spendable-balance checks.
- Pending outgoing transfers reserve confirmed funds; only mining changes them into confirmed transfers.
- The backend validates a saved snapshot before restoring model instances. Atomic writes and invalid-state backups make local recovery inspectable.
- The Solidity artifact is a separate fixed-supply ERC-20. It demonstrates standard ERC-20 behavior but is not coupled to the educational JavaScript ledger.

## Environment reference

| Variable | Default | Valid values / role |
|---|---:|---|
| `PORT` | `3002` | Integer 1–65535; preferred API port. |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed browser origin. |
| `BLOCKCHAIN_DIFFICULTY` | `2` | Integer 1–5. |
| `BLOCKCHAIN_MINING_REWARD` | `100` | Positive integer base units. |
| `BLOCKCHAIN_STATE_PATH` | `./blockchain.json` | Snapshot file; `.env.example` chooses `./data/blockchain.json`. |
| `RPC_URL` | unset | External Solidity network endpoint. |
| `DEPLOYER_PRIVATE_KEY` | unset | External deployment account; keep secret. |
| `INITIAL_TOKEN_SUPPLY` | `1000000` | Whole AST tokens minted at deployment. |

## Verification before handing off

```bash
npm test
npm run test:frontend
npm run lint
npm run build
npm run contract:compile
npm run contract:test
```

For an external contract deployment, set `RPC_URL` and `DEPLOYER_PRIVATE_KEY` in the untracked `.env` file, then run:

```bash
npx hardhat run scripts/deploy-contract.js --network external
```

Never commit `.env`, a state snapshot containing demo activity, or an exported keystore.
