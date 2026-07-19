require('dotenv').config();

const parseInteger = (name, fallback, min, max) => {
  const value = process.env[name] === undefined ? fallback : Number.parseInt(process.env[name], 10);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
};

const parseAmount = (name, fallback) => {
  const value = process.env[name] || fallback;
  if (!/^[1-9][0-9]*$/.test(value)) throw new Error(`${name} must be a positive integer base-unit amount`);
  return value;
};

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInteger('PORT', 3002, 1, 65535),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  blockchain: {
    difficulty: parseInteger('BLOCKCHAIN_DIFFICULTY', 2, 1, 5),
    miningReward: parseAmount('BLOCKCHAIN_MINING_REWARD', '100'),
    statePath: process.env.BLOCKCHAIN_STATE_PATH,
  },
};
