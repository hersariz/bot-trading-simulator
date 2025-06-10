const express = require('express');
const router = express.Router();
const testnetController = require('../controllers/testnet.controller');

// Log all requests to testnet routes
router.use((req, res, next) => {
  console.log(`[Testnet Route] ${req.method} ${req.path}`);
  next();
});

// Handle OPTIONS request for CORS preflight
router.options('/config', (req, res) => {
  console.log('Handling OPTIONS request for /config');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.status(200).send();
});

/**
 * @route GET /api/testnet/config
 * @desc Get testnet configuration
 * @access Public
 */
router.get('/config', testnetController.getConfig);

/**
 * @route POST /api/testnet/config
 * @desc Update testnet configuration
 * @access Public
 */
router.post('/config', (req, res, next) => {
  console.log('POST /config request received', {
    body: req.body,
    headers: req.headers,
    method: req.method
  });
  testnetController.updateConfig(req, res);
});

/**
 * @route GET /api/testnet/test-connection
 * @desc Test connection to Binance testnet
 * @access Public
 */
router.get('/test-connection', testnetController.testConnection);

/**
 * @route GET /api/testnet/balance
 * @desc Get account balance from testnet
 * @access Public
 */
router.get('/balance', testnetController.getBalance);

/**
 * @route GET /api/testnet/manual-test
 * @desc Manual test for trading signal
 * @access Public
 */
router.get('/manual-test', testnetController.manualTestSignal);

module.exports = router; 