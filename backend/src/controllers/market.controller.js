/**
 * Controller for handling market data endpoints
 */
const binanceService = require('../services/binance.service');
const configModel = require('../models/config.model');
const crypto = require('crypto');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const marketService = require('../services/market.service');
const marketSimulator = require('../services/market-simulator.service');
const orderModel = require('../models/order.model');

dotenv.config();

// Path to store API key data
const API_KEY_FILE = path.join(__dirname, '../../data/api_key.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load API key data from file or initialize with defaults
const loadApiKeyData = () => {
  try {
    if (fs.existsSync(API_KEY_FILE)) {
      const data = fs.readFileSync(API_KEY_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading API key data:', error);
  }
  
  // Default data - use system-generated keys
  const { apiKey, apiSecret } = generateRandomApiKey();
  const apiKeyData = {
    apiKey,
    apiSecret,
    isValid: true,
    useDummyData: false, // Default to real data
    createdAt: new Date().toISOString()
  };
  
  // Save the generated key
  saveApiKeyData(apiKeyData);
  
  return apiKeyData;
};

// Save API key data to file
const saveApiKeyData = (data) => {
  try {
    fs.writeFileSync(API_KEY_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving API key data:', error);
    return false;
  }
};

// Generate a random API key and secret
const generateRandomApiKey = () => {
  const apiKey = 'BTSim' + crypto.randomBytes(16).toString('hex');
  const apiSecret = crypto.randomBytes(32).toString('hex');
  
  return { apiKey, apiSecret };
};

/**
 * Get current price for a symbol
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCurrentPrice = async (req, res) => {
  try {
    const { symbol } = req.query;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Symbol is required'
      });
    }
    
    const price = await marketService.getCurrentPrice(symbol);
    
    return res.json({
      success: true,
      symbol,
      price
    });
  } catch (error) {
    console.error('Error getting current price:', error);
    return res.status(500).json({
      success: false,
      message: `Error getting current price: ${error.message}`
    });
  }
};

/**
 * Get market data for dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMarketData = async (req, res) => {
  try {
    const { symbol } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }
    
    // Try to use real data from Binance
    try {
      // Use Binance API - public endpoint doesn't need key
      const price = await binanceService.getCurrentPrice(symbol);
      
      return res.json({
        symbol,
        price,
        timestamp: Date.now(),
        source: 'binance'
      });
    } catch (error) {
      console.warn(`Failed to get market data from Binance for ${symbol}:`, error.message);
      
      // Fall back to dummy data
      const basePrice = symbol.includes('BTC') ? 40000 : symbol.includes('ETH') ? 2000 : 1;
      const randomFactor = 0.995 + Math.random() * 0.01;
      const price = basePrice * randomFactor;
      
      return res.json({
        symbol,
        price: price.toFixed(2),
        timestamp: Date.now(),
        source: 'dummy',
        reason: error.message
      });
    }
  } catch (error) {
    console.error('Error getting market data:', error);
    res.status(500).json({ error: error.message || 'Error getting market data' });
  }
};

/**
 * Test Binance API connection with provided API key and secret
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const testApiKey = async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.body;
    
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: 'API key and secret are required' });
    }
    
    // Test connection to Binance API
    const result = await binanceService.testConnection(apiKey, apiSecret);
    
    res.json({ 
      success: true, 
      message: 'API key is valid and connected to Binance successfully',
      result
    });
  } catch (error) {
    console.error('Error testing API key:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to connect to Binance API'
    });
  }
};

/**
 * Test market data source connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const testMarketDataSource = async (req, res) => {
  try {
    // Get source from request query or default
    const source = req.query.source || 'binance';
    
    // Untuk testing, kita akan coba gunakan API sesuai dengan source yang dipilih
    // tanpa selalu default ke dummy data
    if (source.toLowerCase() === 'binance') {
      try {
        // Test connection to Binance API using public endpoints
        const testResult = await binanceService.testConnection();
        
        res.json({
          success: true,
          source: 'binance',
          message: 'Successfully connected to Binance API',
          useDummyData: false,
          testResult
        });
      } catch (error) {
        // Fall back to dummy data if connection fails
        console.warn('Failed to connect to Binance, using dummy data:', error.message);
        res.json({
          success: true,
          source: 'dummy',
          message: `Using dummy data for Binance (${error.message})`,
          useDummyData: true
        });
      }
    } else if (source.toLowerCase() === 'coingecko') {
      try {
        // Test connection to CoinGecko API
        const response = await axios.get('https://api.coingecko.com/api/v3/ping');
        
        if (response.status === 200) {
          res.json({
            success: true,
            source: 'coingecko',
            message: 'Successfully connected to CoinGecko API',
            useDummyData: false
          });
        } else {
          throw new Error(`CoinGecko API returned status: ${response.status}`);
        }
      } catch (error) {
        console.warn('Failed to connect to CoinGecko, using dummy data:', error.message);
        res.json({
          success: true,
          source: 'dummy',
          message: `Using dummy data for CoinGecko (${error.message})`,
          useDummyData: true
        });
      }
    } else {
      // Unknown source, use dummy
      res.json({
        success: true,
        source: 'dummy',
        message: `Unknown source "${source}", using dummy data`,
        useDummyData: true
      });
    }
  } catch (error) {
    console.error('Error testing market data source:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to test market data source',
      useDummyData: true
    });
  }
};

// Get API key data
const getApiKey = (req, res) => {
  try {
    const apiKeyData = loadApiKeyData();
    
    // Return data without exposing full secret
    const responseData = {
      apiKey: apiKeyData.apiKey,
      apiSecret: apiKeyData.apiSecret ? `${apiKeyData.apiSecret.substring(0, 8)}...` : '',
      isValid: apiKeyData.isValid,
      useDummyData: apiKeyData.useDummyData,
      createdAt: apiKeyData.createdAt
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Error getting API key data:', error);
    res.status(500).json({ error: 'Failed to get API key data' });
  }
};

// Generate new API key
const generateApiKey = async (req, res) => {
  try {
    // Generate new API key and secret
    const { apiKey, apiSecret } = generateRandomApiKey();
    
    // For system-generated keys, assume they are valid
    let isValid = true;
    
    // Save API key data
    const apiKeyData = {
      apiKey,
      apiSecret,
      isValid,
      useDummyData: false, // Default to real data
      createdAt: new Date().toISOString()
    };
    
    if (saveApiKeyData(apiKeyData)) {
      // Return data without exposing full secret in logs
      const responseData = {
        apiKey,
        apiSecret,
        isValid,
        useDummyData: apiKeyData.useDummyData,
        createdAt: apiKeyData.createdAt
      };
      
      res.json(responseData);
    } else {
      res.status(500).json({ error: 'Failed to save API key data' });
    }
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
};

// Delete API key
const deleteApiKey = (req, res) => {
  try {
    // Save empty API key data
    const apiKeyData = {
      apiKey: '',
      apiSecret: '',
      isValid: false,
      useDummyData: true,
      createdAt: null
    };
    
    if (saveApiKeyData(apiKeyData)) {
      res.json({ message: 'API key deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete API key' });
    }
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
};

// Toggle dummy data usage
const toggleDummyData = (req, res) => {
  try {
    const { useDummyData } = req.body;
    
    if (useDummyData === undefined) {
      return res.status(400).json({ error: 'useDummyData parameter is required' });
    }
    
    // Load current API key data
    const apiKeyData = loadApiKeyData();
    
    // Update dummy data flag
    apiKeyData.useDummyData = useDummyData;
    
    if (saveApiKeyData(apiKeyData)) {
      res.json({ 
        message: useDummyData ? 'Using dummy data enabled' : 'Using Binance API enabled',
        useDummyData
      });
    } else {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  } catch (error) {
    console.error('Error toggling dummy data:', error);
    res.status(500).json({ error: 'Failed to toggle dummy data' });
  }
};

// Get historical price data
const getHistoricalPrices = async (req, res) => {
  try {
    const { symbol, interval, limit } = req.query;
    
    if (!symbol || !interval) {
      return res.status(400).json({ error: 'Symbol and interval parameters are required' });
    }
    
    // Try to use real Binance API data
    try {
      // Get data from Binance - public endpoint doesn't require API key
      const candles = await binanceService.getHistoricalPrices(
        symbol, 
        interval, 
        limit || 100
      );
      
      return res.json({
        symbol,
        interval,
        candles,
        source: 'binance'
      });
    } catch (error) {
      console.warn(`Failed to get historical data from Binance for ${symbol}:`, error.message);
      
      // Fall back to dummy data
      const basePrice = symbol.includes('BTC') ? 40000 : symbol.includes('ETH') ? 2000 : 1;
      const candles = [];
      const now = Date.now();
      const intervalMs = interval.includes('m') ? parseInt(interval) * 60 * 1000 : 
                        interval.includes('h') ? parseInt(interval) * 60 * 60 * 1000 : 
                        interval.includes('d') ? parseInt(interval) * 24 * 60 * 60 * 1000 : 60000;
      
      for (let i = 0; i < (limit || 100); i++) {
        const time = now - (intervalMs * (limit - i));
        const openPrice = basePrice * (0.99 + Math.random() * 0.02);
        const closePrice = openPrice * (0.995 + Math.random() * 0.01);
        const highPrice = Math.max(openPrice, closePrice) * (1 + Math.random() * 0.005);
        const lowPrice = Math.min(openPrice, closePrice) * (1 - Math.random() * 0.005);
        const volume = Math.random() * 100;
        
        candles.push({
          openTime: time,
          open: openPrice.toFixed(2),
          high: highPrice.toFixed(2),
          low: lowPrice.toFixed(2),
          close: closePrice.toFixed(2),
          volume: volume.toFixed(2),
          closeTime: time + intervalMs - 1
        });
      }
      
      return res.json({
        symbol,
        interval,
        candles,
        source: 'dummy',
        reason: error.message
      });
    }
  } catch (error) {
    console.error('Error getting historical prices:', error);
    res.status(500).json({ error: error.message || 'Error getting historical prices' });
  }
};

/**
 * Get 24h ticker statistics for a symbol
 * @param {Object} req - Request object with symbol in query params
 * @param {Object} res - Response object
 */
const get24hStats = async (req, res) => {
  try {
    const { symbol } = req.query;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Symbol is required'
      });
    }
    
    const stats = await marketService.get24hTickerStats(symbol);
    
    return res.json({
      success: true,
      symbol,
      stats
    });
  } catch (error) {
    console.error('Error getting 24h stats:', error);
    return res.status(500).json({
      success: false,
      message: `Error getting 24h stats: ${error.message}`
    });
  }
};

/**
 * Start the market simulator
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const startSimulator = (req, res) => {
  try {
    const result = marketSimulator.startSimulator();
    
    if (result) {
      return res.json({
        success: true,
        message: 'Market simulator started successfully'
      });
    } else {
      return res.json({
        success: false,
        message: 'Market simulator is already running'
      });
    }
  } catch (error) {
    console.error('Error starting market simulator:', error);
    return res.status(500).json({
      success: false,
      message: `Error starting market simulator: ${error.message}`
    });
  }
};

/**
 * Stop the market simulator
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const stopSimulator = (req, res) => {
  try {
    const result = marketSimulator.stopSimulator();
    
    if (result) {
      return res.json({
        success: true,
        message: 'Market simulator stopped successfully'
      });
    } else {
      return res.json({
        success: false,
        message: 'Market simulator is not running'
      });
    }
  } catch (error) {
    console.error('Error stopping market simulator:', error);
    return res.status(500).json({
      success: false,
      message: `Error stopping market simulator: ${error.message}`
    });
  }
};

/**
 * Get the status of the market simulator
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getSimulatorStatus = (req, res) => {
  try {
    const isRunning = marketSimulator.isSimulatorRunning();
    
    return res.json({
      success: true,
      isRunning
    });
  } catch (error) {
    console.error('Error getting simulator status:', error);
    return res.status(500).json({
      success: false,
      message: `Error getting simulator status: ${error.message}`
    });
  }
};

/**
 * Force an update of all orders
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const forceSimulatorUpdate = async (req, res) => {
  try {
    const updatedCount = await marketSimulator.forceUpdate();
    
    return res.json({
      success: true,
      message: `Updated ${updatedCount} orders`,
      updatedCount
    });
  } catch (error) {
    console.error('Error forcing simulator update:', error);
    return res.status(500).json({
      success: false,
      message: `Error forcing simulator update: ${error.message}`
    });
  }
};

/**
 * Manually update an order's profit calculation
 * @param {Object} req - Request object with orderId in params and price in body
 * @param {Object} res - Response object
 */
const updateOrderProfit = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { price } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }
    
    if (!price || isNaN(parseFloat(price))) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }
    
    const updatedOrder = orderModel.calculateOrderProfit(orderId, parseFloat(price));
    
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    return res.json({
      success: true,
      message: 'Order profit updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order profit:', error);
    return res.status(500).json({
      success: false,
      message: `Error updating order profit: ${error.message}`
    });
  }
};

module.exports = {
  getCurrentPrice,
  getMarketData,
  testApiKey,
  testMarketDataSource,
  getApiKey,
  generateApiKey,
  deleteApiKey,
  toggleDummyData,
  getHistoricalPrices,
  get24hStats,
  startSimulator,
  stopSimulator,
  getSimulatorStatus,
  forceSimulatorUpdate,
  updateOrderProfit
}; 