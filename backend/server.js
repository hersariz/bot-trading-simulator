const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

let app;
let serverInitializationError = null;

try {
  // All require statements that might fail are inside this block
  const configRoutes = require('./routes/config.routes');
  const orderRoutes = require('./routes/order.routes');
  const marketDataRoutes = require('./routes/market.routes');
  const webhookRoutes = require('./routes/webhook.routes');
  const testnetRoutes = require('./routes/testnet.routes');

  app = express();

  // Middleware
  app.use(morgan('dev'));
  app.use(cors({ origin: '*' })); // Simplified CORS
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint that works even if routes fail
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/config', configRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/market', marketDataRoutes); // Corrected path
  app.use('/api/webhook', webhookRoutes);
  app.use('/api/testnet', testnetRoutes);
  
} catch (error) {
  console.error('!!! SERVER INITIALIZATION FAILED !!!', error);
  serverInitializationError = error;
}

// Export a single handler function for Vercel
module.exports = (req, res) => {
  if (serverInitializationError) {
    return res.status(500).json({
      error: 'SERVER_INITIALIZATION_FAILED',
      message: serverInitializationError.message,
      stack: serverInitializationError.stack
    });
  }
  // If app is initialized, let it handle the request
  return app(req, res);
};