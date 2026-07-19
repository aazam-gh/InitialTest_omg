const express = require('express');
const fs = require('fs');
const path = require('path');
const net = require('net');
const config = require('./config');
const logger = require('./utils/logger');
const corsMiddleware = require('./middleware/cors.middleware');
const requestLogger = require('./middleware/logger.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const { createApiRoutes } = require('./routes');
const { createHealthRoutes } = require('./routes/health.routes');
const { BlockchainService } = require('./services/blockchain.service');

const createApp = ({ blockchainService = new BlockchainService(config.blockchain) } = {}) => {
  const app = express();
  app.disable('x-powered-by');
  app.use(corsMiddleware);
  app.use(express.json({ limit: '32kb' }));
  app.use(express.urlencoded({ extended: false, limit: '32kb' }));
  app.use(requestLogger);
  app.use('/health', createHealthRoutes(blockchainService));
  app.use('/api', apiLimiter, createApiRoutes(blockchainService));
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(__dirname, 'build', 'index.html'), (error) => { if (error) next(error); });
  });
  app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found' }));
  app.use(errorHandler);
  return app;
};

const getAvailablePort = (startPort) => new Promise((resolve, reject) => {
  const tester = net.createServer();
  tester.once('error', (error) => error.code === 'EADDRINUSE' ? resolve(getAvailablePort(startPort + 1)) : reject(error));
  tester.once('listening', () => { const { port } = tester.address(); tester.close(() => resolve(port)); });
  tester.listen(startPort, '127.0.0.1');
});

const startServer = async () => {
  const service = new BlockchainService(config.blockchain);
  await service.ready;
  const port = await getAvailablePort(config.port);
  fs.writeFileSync(path.join(__dirname, '.server-port'), String(port), 'utf8');
  return createApp({ blockchainService: service }).listen(port, () => {
    logger.info(`Server: http://localhost:${port}`);
    logger.info(`API: http://localhost:${port}/api`);
  });
};

if (require.main === module) {
  startServer().catch((error) => { logger.error(`Unable to start server: ${error.message}`); process.exit(1); });
}

module.exports = { createApp, startServer };
