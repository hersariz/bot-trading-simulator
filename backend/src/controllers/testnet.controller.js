/**
 * Controller for handling Binance Testnet operations
 */
const binanceTestnetService = require('../services/binance-testnet.service');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Path for testnet API key configuration
const TESTNET_CONFIG_FILE = path.join(__dirname, '../../data/testnet_config.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Default testnet config
const DEFAULT_TESTNET_CONFIG = {
  apiKey: '',
  apiSecret: '',
  type: 'futures', // 'spot' or 'futures'
  isConfigured: false
};

/**
 * Load testnet config
 * @returns {Object} Testnet configuration
 */
const loadTestnetConfig = () => {
  try {
    if (fs.existsSync(TESTNET_CONFIG_FILE)) {
      const data = fs.readFileSync(TESTNET_CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading testnet config:', error);
  }
  
  return DEFAULT_TESTNET_CONFIG;
};

/**
 * Save testnet config
 * @param {Object} config - Configuration to save
 * @returns {boolean} Success status
 */
const saveTestnetConfig = (config) => {
  try {
    fs.writeFileSync(TESTNET_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving testnet config:', error);
    return false;
  }
};

/**
 * Update testnet API key configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateTestnetConfig = async (req, res) => {
  try {
    const { apiKey, apiSecret, type } = req.body;
    
    console.log('Received request to update testnet config:');
    console.log('- API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
    console.log('- Secret:', apiSecret ? `${apiSecret.substring(0, 8)}...` : 'undefined');
    console.log('- Type:', type || 'futures');
    
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: 'API key and secret are required' });
    }
    
    // Validate API key by testing connection
    try {
      console.log('Attempting to validate API key with Binance Testnet...');
      const result = await binanceTestnetService.testConnection(apiKey, apiSecret, type || 'futures');
      console.log('API key validation successful:', JSON.stringify(result.data).substring(0, 100) + '...');
      
      // Save config
      const config = {
        apiKey,
        apiSecret,
        type: type || 'futures',
        isConfigured: true
      };
      
      if (saveTestnetConfig(config)) {
        console.log('Testnet config saved successfully');
        res.json({
          success: true,
          message: 'Testnet configuration saved successfully'
        });
      } else {
        console.error('Failed to save testnet config file');
        res.status(500).json({
          success: false,
          message: 'Failed to save testnet configuration'
        });
      }
    } catch (error) {
      console.error('API key validation failed:', error.message);
      return res.status(400).json({ 
        success: false, 
        message: `Failed to connect to Binance Testnet: ${error.message}`
      });
    }
  } catch (error) {
    console.error('Error updating testnet config:', error);
    res.status(500).json({
      success: false,
      message: `Error updating testnet config: ${error.message}`
    });
  }
};

/**
 * Get testnet configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTestnetConfig = (req, res) => {
  try {
    const config = loadTestnetConfig();
    
    // Don't return the full secret
    const responseData = {
      ...config,
      apiSecret: config.apiSecret ? `${config.apiSecret.substring(0, 8)}...` : ''
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Error getting testnet config:', error);
    res.status(500).json({ error: `Error getting testnet config: ${error.message}` });
  }
};

/**
 * Test connection to Binance Testnet
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const testConnection = async (req, res) => {
  try {
    const config = loadTestnetConfig();
    
    if (!config.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Testnet is not configured. Please set up API key first.'
      });
    }
    
    const result = await binanceTestnetService.testConnection(
      config.apiKey,
      config.apiSecret,
      config.type
    );
    
    res.json({
      success: true,
      message: 'Successfully connected to Binance Testnet',
      data: result
    });
  } catch (error) {
    console.error('Error testing testnet connection:', error);
    res.status(400).json({
      success: false,
      message: `Failed to connect to Binance Testnet: ${error.message}`
    });
  }
};

/**
 * Get account balance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAccountBalance = async (req, res) => {
  try {
    const config = loadTestnetConfig();
    
    if (!config.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Testnet is not configured. Please set up API key first.'
      });
    }
    
    const balance = await binanceTestnetService.getAccountBalance(
      config.apiKey,
      config.apiSecret,
      config.type
    );
    
    res.json({
      success: true,
      ...balance
    });
  } catch (error) {
    console.error('Error getting account balance:', error);
    res.status(400).json({
      success: false,
      message: `Failed to get account balance: ${error.message}`
    });
  }
};

/**
 * Place market order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const placeMarketOrder = async (req, res) => {
  try {
    const { symbol, side, quantity, leverage } = req.body;
    const config = loadTestnetConfig();
    
    if (!config.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Testnet is not configured. Please set up API key first.'
      });
    }
    
    if (!symbol || !side || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Symbol, side, and quantity are required'
      });
    }
    
    // Place market order
    const result = await binanceTestnetService.placeMarketOrder({
      symbol,
      side,
      quantity: Number(quantity),
      leverage: Number(leverage || 1),
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      type: config.type
    });
    
    // Import order model to save order to local system
    const orderModel = require('../models/order.model');
    
    // Save the order to local system
    const orderData = {
      symbol: symbol,
      side: side,
      quantity: Number(quantity),
      price: parseFloat(result.price || result.avgPrice || 0),
      status: result.status || 'FILLED',
      entryTime: new Date().toISOString(),
      type: 'MARKET',
      leverage: Number(leverage || 1)
    };
    
    // Create order in local system
    const savedOrder = orderModel.createOrder(orderData);
    console.log('Order saved to local system:', savedOrder);
    
    res.json({
      success: true,
      message: `Market ${side} order placed successfully`,
      order: result
    });
  } catch (error) {
    console.error('Error placing market order:', error);
    res.status(400).json({
      success: false,
      message: `Failed to place market order: ${error.message}`
    });
  }
};

/**
 * Place order with take profit and stop loss
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const placeTradingSignalOrder = async (req, res) => {
  try {
    const { 
      symbol, 
      action, 
      quantity,
      leverage,
      takeProfitPercent,
      stopLossPercent
    } = req.body;
    
    const config = loadTestnetConfig();
    
    if (!config.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Testnet is not configured. Please set up API key first.'
      });
    }
    
    if (!symbol || !action || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Symbol, action, and quantity are required'
      });
    }
    
    // Set leverage if provided
    if (leverage && config.type === 'futures') {
      await binanceTestnetService.setLeverage({
        symbol,
        leverage: Number(leverage),
        apiKey: config.apiKey,
        apiSecret: config.apiSecret
      });
    }
    
    // Place market order
    const orderResult = await binanceTestnetService.placeMarketOrder({
      symbol,
      side: action, // BUY or SELL
      quantity: Number(quantity),
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      type: config.type
    });
    
    // If take profit and stop loss percentages provided, calculate prices
    let tpSlOrders = null;
    if (takeProfitPercent && stopLossPercent) {
      // Get current price from order result
      const currentPrice = parseFloat(orderResult.order.avgPrice);
      
      // Calculate TP/SL prices
      let takeProfitPrice, stopLossPrice;
      if (action === 'BUY') {
        takeProfitPrice = currentPrice * (1 + parseFloat(takeProfitPercent) / 100);
        stopLossPrice = currentPrice * (1 - parseFloat(stopLossPercent) / 100);
      } else { // SELL
        takeProfitPrice = currentPrice * (1 - parseFloat(takeProfitPercent) / 100);
        stopLossPrice = currentPrice * (1 + parseFloat(stopLossPercent) / 100);
      }
      
      // Place TP/SL orders
      tpSlOrders = await binanceTestnetService.placeTakeProfitStopLossOrders({
        symbol,
        side: action === 'BUY' ? 'SELL' : 'BUY', // Opposite side for closing
        quantity: Number(quantity),
        takeProfitPrice: takeProfitPrice.toFixed(2),
        stopLossPrice: stopLossPrice.toFixed(2),
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
        type: config.type
      });
    }
    
    // Save order to local storage
    const orderData = {
      id: orderResult.order.orderId,
      symbol,
      action,
      quantity: Number(quantity),
      price: parseFloat(orderResult.order.avgPrice),
      status: orderResult.order.status,
      leverage: Number(leverage || 1),
      takeProfitPrice: tpSlOrders?.takeProfit?.price,
      stopLossPrice: tpSlOrders?.stopLoss?.stopPrice,
      takeProfitId: tpSlOrders?.takeProfit?.orderId,
      stopLossId: tpSlOrders?.stopLoss?.orderId,
      timestamp: Date.now()
    };
    
    // Load existing orders
    const ordersFile = path.join(__dirname, '../../data/testnet_orders.json');
    let orders = [];
    if (fs.existsSync(ordersFile)) {
      try {
        const data = fs.readFileSync(ordersFile, 'utf8');
        orders = JSON.parse(data);
      } catch (error) {
        console.warn('Error loading orders file:', error);
      }
    }
    
    // Add new order and save
    orders.push(orderData);
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), 'utf8');
    
    res.json({
      success: true,
      message: `${action} order placed successfully with TP/SL`,
      order: orderData
    });
  } catch (error) {
    console.error('Error placing trading signal order:', error);
    res.status(400).json({
      success: false,
      message: `Failed to place order: ${error.message}`
    });
  }
};

/**
 * Get open orders
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOpenOrders = async (req, res) => {
  try {
    const { symbol } = req.query;
    const config = loadTestnetConfig();
    
    if (!config.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Testnet is not configured. Please set up API key first.'
      });
    }
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Symbol is required'
      });
    }
    
    const orders = await binanceTestnetService.getOpenOrders(
      symbol,
      config.apiKey,
      config.apiSecret,
      config.type
    );
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error getting open orders:', error);
    res.status(400).json({
      success: false,
      message: `Failed to get open orders: ${error.message}`
    });
  }
};

/**
 * Get order history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOrderHistory = async (req, res) => {
  try {
    const { symbol } = req.query;
    const config = loadTestnetConfig();
    
    if (!config.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Testnet is not configured. Please set up API key first.'
      });
    }
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Symbol is required'
      });
    }
    
    const orders = await binanceTestnetService.getOrderHistory(
      symbol,
      config.apiKey,
      config.apiSecret,
      config.type
    );
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error getting order history:', error);
    res.status(400).json({
      success: false,
      message: `Failed to get order history: ${error.message}`
    });
  }
};

/**
 * Get positions (futures only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPositions = async (req, res) => {
  try {
    const { symbol } = req.query;
    const config = loadTestnetConfig();
    
    if (!config.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Testnet is not configured. Please set up API key first.'
      });
    }
    
    if (config.type !== 'futures') {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is only available for futures testnet'
      });
    }
    
    const positions = await binanceTestnetService.getPositions(
      symbol,
      config.apiKey,
      config.apiSecret
    );
    
    res.json({
      success: true,
      positions
    });
  } catch (error) {
    console.error('Error getting positions:', error);
    res.status(400).json({
      success: false,
      message: `Failed to get positions: ${error.message}`
    });
  }
};

/**
 * Get saved testnet orders
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSavedOrders = (req, res) => {
  try {
    const ordersFile = path.join(__dirname, '../../data/testnet_orders.json');
    
    if (!fs.existsSync(ordersFile)) {
      return res.json({ orders: [] });
    }
    
    const data = fs.readFileSync(ordersFile, 'utf8');
    const orders = JSON.parse(data);
    
    res.json({ orders });
  } catch (error) {
    console.error('Error getting saved orders:', error);
    res.status(500).json({ error: `Error getting saved orders: ${error.message}` });
  }
};

module.exports = {
  updateTestnetConfig,
  getTestnetConfig,
  testConnection,
  getAccountBalance,
  placeMarketOrder,
  placeTradingSignalOrder,
  getOpenOrders,
  getOrderHistory,
  getPositions,
  getSavedOrders
}; 