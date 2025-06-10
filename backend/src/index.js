const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { initializeDataDirectory } = require('./utils/init');
const { startSimulator } = require('./scripts/start-simulator');
const testnetSyncService = require('./services/testnet-sync.service');

// Load environment variables
dotenv.config();

// Initialize data directory and configuration file
initializeDataDirectory();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define port
const PORT = process.env.PORT || 5000;

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Bot Trading Simulator API' });
});

// Import routes
const configRoutes = require('./routes/config.routes');
const marketRoutes = require('./routes/market.routes');
const webhookRoutes = require('./routes/webhook.routes');
const orderRoutes = require('./routes/order.routes');
const testnetRoutes = require('./routes/testnet.routes');
const testnetSyncRoutes = require('./routes/testnet-sync.routes');

// Use routes with /api prefix
app.use('/api/config', configRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/testnet', testnetRoutes);
app.use('/api/testnet-sync', testnetSyncRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Start market simulator
  const AUTO_START_SIMULATOR = process.env.AUTO_START_SIMULATOR !== 'false';
  if (AUTO_START_SIMULATOR) {
    console.log('Auto-starting market simulator...');
    startSimulator();
  } else {
    console.log('Market simulator auto-start disabled');
  }
  
  // Start testnet sync service
  const AUTO_START_TESTNET_SYNC = process.env.AUTO_START_TESTNET_SYNC !== 'false';
  if (AUTO_START_TESTNET_SYNC) {
    console.log('Auto-starting testnet sync service...');
    testnetSyncService.startSyncService();
  } else {
    console.log('Testnet sync service auto-start disabled');
  }
});

module.exports = app; 