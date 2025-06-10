/**
 * Binance Testnet API routes
 */
const express = require('express');
const router = express.Router();
const testnetController = require('../controllers/testnet.controller');

// Testnet configuration
router.post('/config', testnetController.updateTestnetConfig);
router.get('/config', testnetController.getTestnetConfig);
router.get('/test-connection', testnetController.testConnection);

// Account information
router.get('/balance', testnetController.getAccountBalance);
router.get('/positions', testnetController.getPositions);

// Orders
router.post('/order', testnetController.placeMarketOrder);
router.post('/signal-order', testnetController.placeTradingSignalOrder);
router.get('/open-orders', testnetController.getOpenOrders);
router.get('/order-history', testnetController.getOrderHistory);
router.get('/saved-orders', testnetController.getSavedOrders);

module.exports = router; 