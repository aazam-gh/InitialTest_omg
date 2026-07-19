const { Router } = require('express');
const config = require('../config');

const createHealthRoutes = (blockchainService) => {
  const router = Router();
  router.get('/', async (req, res) => {
    try {
      await blockchainService.ready;
      res.status(200).json({ status: 'ok', env: config.env, uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: 'unavailable', timestamp: new Date().toISOString() });
    }
  });
  return router;
};

module.exports = { createHealthRoutes };
