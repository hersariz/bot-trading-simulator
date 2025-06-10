const express = require('express');
const router = express.Router();
const testnetController = require('../controllers/testnet.controller');

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
router.post('/config', testnetController.updateConfig);

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