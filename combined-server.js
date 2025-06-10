/**
 * Combined server for Bot Trading Simulator
 * Serves both the backend API and frontend static files
 */
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const fs = require('fs');

// Import route handlers
const configRoutes = require('./backend/routes/configRoutes');
const orderRoutes = require('./backend/routes/orderRoutes');
const marketDataRoutes = require('./backend/routes/marketDataRoutes');
const webhookRoutes = require('./backend/routes/webhookRoutes');
const testnetRoutes = require('./backend/routes/testnet.routes');

// Create Express app
const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({ origin: '*' }));

// Custom logging for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Special logging for testnet routes
app.use('/api/testnet/*', (req, res, next) => {
  console.log('Testnet Route:', {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: req.headers
  });
  next();
});

// API Routes
app.use('/api/config', configRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/market-data', marketDataRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/testnet', testnetRoutes);

// Handle OPTIONS pre-flight requests for all routes
app.options('*', cors());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Special handling for POST /api/testnet/config
app.post('/api/testnet/config', (req, res) => {
  console.log('Direct POST handler for /api/testnet/config', {
    body: req.body,
    headers: req.headers
  });
  
  // Check if testnet controller exists
  const testnetController = require('./backend/controllers/testnet.controller');
  if (testnetController && typeof testnetController.updateConfig === 'function') {
    return testnetController.updateConfig(req, res);
  } else {
    return res.status(500).json({
      success: false,
      error: 'Testnet controller not found or updateConfig not implemented'
    });
  }
});

// Serve static files from frontend build
const frontendBuildPath = path.join(__dirname, 'frontend', 'build');
if (fs.existsSync(frontendBuildPath)) {
  console.log('Serving static files from:', frontendBuildPath);
  app.use(express.static(frontendBuildPath));
  
  // Send index.html for all non-API routes (for React Router)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
} else {
  console.log('Frontend build directory not found at:', frontendBuildPath);
  console.log('Only API routes will be available');
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: {
      message: 'API Route not found',
      status: 404,
      path: req.originalUrl
    }
  });
});

// Start server for development or export for serverless
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Combined server running on port ${PORT}`);
    console.log(`API available at: http://localhost:${PORT}/api`);
    console.log(`Frontend available at: http://localhost:${PORT}`);
  });
}

module.exports = app; 