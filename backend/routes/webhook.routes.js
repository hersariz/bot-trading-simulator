/**
 * Routes for webhook endpoints
 */
const express = require('express');
const webhookController = require('../controllers/webhook.controller');
const tradingService = require('../services/trading.service');

const router = express.Router();

// POST /webhook - Process webhook from TradingView
router.post('/', webhookController.processWebhook);

// POST /webhook/test - Generate test order (skips validation)
router.post('/test', async (req, res) => {
  try {
    console.log('Test webhook received - generating order without validation');
    
    // Create manual order data with BUY signal
    const orderData = {
      symbol: 'BTCUSDT',
      action: 'BUY',
      price: 0, // will be fetched from market
      quantity: 0.001,
      leverage: 10,
      takeProfitPercent: 2,
      stopLossPercent: 1,
      timeframe: '5m',
      timestamp: new Date().toISOString()
    };
    
    // Process order
    const result = await tradingService.createSimulatedOrder(orderData);
    
    res.status(200).json({ 
      success: true, 
      message: 'Test order created successfully', 
      data: result 
    });
  } catch (error) {
    console.error('Error creating test order:', error);
    res.status(500).json({ 
      success: false, 
      message: `Error creating test order: ${error.message}` 
    });
  }
});

module.exports = router; 