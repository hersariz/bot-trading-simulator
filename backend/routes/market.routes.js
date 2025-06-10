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

module.exports = router; 