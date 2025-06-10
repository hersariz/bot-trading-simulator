const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const configRoutes = require('./routes/configRoutes');
const orderRoutes = require('./routes/orderRoutes');
const marketDataRoutes = require('./routes/marketDataRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const testnetRoutes = require('./src/routes/testnet.routes');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for frontend application
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// API routes
app.use('/api/config', configRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/market-data', marketDataRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/testnet', testnetRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

module.exports = app; 