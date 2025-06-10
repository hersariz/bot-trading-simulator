const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');
const configRoutes = require('./routes/configRoutes');
const orderRoutes = require('./routes/orderRoutes');
const marketDataRoutes = require('./routes/marketDataRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const testnetRoutes = require('./routes/testnet.routes');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for frontend application
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://bot-trading-simulator-6fic.vercel.app',
  'https://bot-trading-simulator.vercel.app',
  'https://bot-trading-simulator-6fic-hersariz.vercel.app',
  // Allow requests with no origin (like mobile apps or curl requests)
  undefined,
  'null'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Check if the origin is allowed
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log unauthorized origin attempts in production but allow them for now
    console.warn(`CORS blocked for origin: ${origin}`);
    return callback(null, true); // Allow anyway for now to troubleshoot
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Log all requests for debugging in production
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Origin: ${req.get('origin') || 'N/A'}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Pre-flight OPTIONS handling
app.options('*', cors());

// API routes
app.use('/api/config', configRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/market-data', marketDataRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/testnet', testnetRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404,
      path: req.originalUrl
    }
  });
});

// For Vercel serverless deployment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app; 