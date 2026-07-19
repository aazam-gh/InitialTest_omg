require('@nomicfoundation/hardhat-ethers');

const accounts = process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [];

module.exports = {
  solidity: {
    version: '0.8.24',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  paths: { tests: './contract-tests' },
  networks: process.env.RPC_URL ? { external: { url: process.env.RPC_URL, accounts } } : {},
};
