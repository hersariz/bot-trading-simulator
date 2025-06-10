/**
 * Routes for market data endpoints
 */
const express = require('express');
const marketController = require('../controllers/market.controller');
const marketService = require('../services/market.service');

const router = express.Router();

// GET /market/data - Get market data for dashboard
router.get('/data', marketController.getMarketData);

// GET /market/price/:symbol - Get current price for a symbol
router.get('/price/:symbol', marketController.getCurrentPrice);

// GET /market/stats/:symbol - Get 24hr ticker stats for a symbol
router.get('/stats/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const stats = await marketService.get24hTickerStats(symbol);
    
    res.status(200).json(stats);
  } catch (error) {
    console.error(`Error getting stats for ${req.params.symbol}:`, error);
    res.status(500).json({ error: `Failed to get stats: ${error.message}` });
  }
});

// GET /market/test/:source - Test connection to market data source
router.get('/test-source', marketController.testMarketDataSource);

// POST /market/test-api-key - Test Binance API key
router.post('/test-api-key', marketController.testApiKey);

// Get historical price data
router.get('/historical', marketController.getHistoricalPrices);

// API Key management endpoints
router.get('/api-key', marketController.getApiKey);
router.post('/generate-api-key', marketController.generateApiKey);
router.delete('/api-key', marketController.deleteApiKey);
router.post('/toggle-dummy-data', marketController.toggleDummyData);

/**
 * Market API Routes
 */

/**
 * @route   GET /api/market/price
 * @desc    Get current price for a symbol
 * @access  Public
 */
router.get('/price', marketController.getCurrentPrice);

/**
 * @route   GET /api/market/stats
 * @desc    Get 24h ticker statistics for a symbol
 * @access  Public
 */
router.get('/stats', marketController.get24hStats);

/**
 * @route   GET /api/market/historical
 * @desc    Get historical price data for a symbol
 * @access  Public
 */
router.get('/historical', marketController.getHistoricalPrices);

/**
 * @route   POST /api/market/simulator/start
 * @desc    Start the market simulator
 * @access  Public
 */
router.post('/simulator/start', marketController.startSimulator);

/**
 * @route   POST /api/market/simulator/stop
 * @desc    Stop the market simulator
 * @access  Public
 */
router.post('/simulator/stop', marketController.stopSimulator);

/**
 * @route   GET /api/market/simulator/status
 * @desc    Get the status of the market simulator
 * @access  Public
 */
router.get('/simulator/status', marketController.getSimulatorStatus);

/**
 * @route   POST /api/market/simulator/update
 * @desc    Force an update of all orders
 * @access  Public
 */
router.post('/simulator/update', marketController.forceSimulatorUpdate);

/**
 * @route   POST /api/market/orders/:orderId/update-profit
 * @desc    Update profit for a specific order
 * @access  Public
 */
router.post('/orders/:orderId/update-profit', marketController.updateOrderProfit);

module.exports = router; 