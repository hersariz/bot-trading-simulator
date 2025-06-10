/**
 * Testnet routes untuk Binance Testnet API
 */
const express = require('express');
const router = express.Router();
const binanceTestnetService = require('../services/binance-testnet.service');
const fs = require('fs');
const path = require('path');

// Path for testnet API key configuration
const TESTNET_CONFIG_FILE = path.join(__dirname, '../../data/testnet_config.json');

// Default testnet config
const DEFAULT_TESTNET_CONFIG = {
  apiKey: '',
  apiSecret: '',
  type: 'spot', // 'spot' or 'futures'
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
 * @route GET /api/testnet/config
 * @desc Get Testnet configuration
 * @access Public
 */
router.get('/config', (req, res) => {
  try {
    const config = loadTestnetConfig();
    
    // Don't return the full secret
    const responseData = {
      ...config,
      apiSecret: config.apiSecret ? `${config.apiSecret.substring(0, 8)}...` : ''
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching testnet config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route POST /api/testnet/config
 * @desc Update Testnet configuration
 * @access Public
 */
router.post('/config', async (req, res) => {
  try {
    // Log seluruh request body untuk debugging
    console.log('============ REQUEST BODY ============');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('=====================================');
    
    // Menerima apiSecret ATAU secretKey dari frontend (untuk kompatibilitas)
    const apiKey = req.body.apiKey;
    const apiSecret = req.body.apiSecret || req.body.secretKey; // Terima kedua format
    const type = req.body.type || 'spot';
    
    console.log('Processed parameters:');
    console.log(`- API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'undefined'}`);
    console.log(`- Secret: ${apiSecret ? apiSecret.substring(0, 8) + '...' : 'undefined'}`);
    console.log(`- Type: ${type}`);
    
    if (!apiKey || !apiSecret) {
      console.error('Error: Missing API Key or Secret Key');
      return res.status(400).json({ 
        success: false, 
        error: 'API Key dan Secret Key diperlukan' 
      });
    }
    
    try {
      // Validate API key by testing connection
      console.log('Validating API key...');
      await binanceTestnetService.testConnection(apiKey, apiSecret, type);
      console.log('API key validation successful');
      
      // Save config to file
      const config = {
        apiKey,
        apiSecret,
        type,
        isConfigured: true
      };
      
      if (saveTestnetConfig(config)) {
        console.log('Testnet config saved successfully to file');
        res.json({
          success: true,
          message: 'Testnet configuration updated successfully'
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
      // Save config anyway, but mark as not validated
      const config = {
        apiKey,
        apiSecret,
        type,
        isConfigured: true
      };
      
      if (saveTestnetConfig(config)) {
        console.log('Testnet config saved but validation failed');
      }
      
      return res.status(400).json({ 
        success: false, 
        error: `Failed to validate API key: ${error.message}` 
      });
    }
  } catch (error) {
    console.error('Error updating testnet config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/testnet/balance
 * @desc Get account balance from Binance Testnet
 * @access Public
 */
router.get('/balance', async (req, res) => {
  try {
    const config = loadTestnetConfig();
    
    if (!config.isConfigured || !config.apiKey || !config.apiSecret) {
      return res.status(400).json({ 
        success: false, 
        error: 'API Key dan Secret Key belum dikonfigurasi' 
      });
    }
    
    const balance = await binanceTestnetService.getAccountBalance(
      config.apiKey,
      config.apiSecret,
      config.type
    );
    
    res.json({ success: true, data: balance });
  } catch (error) {
    console.error('Error fetching testnet balance:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * @route POST /api/testnet/market-order
 * @desc Place a market order on Binance Testnet
 * @access Public
 */
router.post('/market-order', async (req, res) => {
  try {
    const { symbol, side, quantity, leverage } = req.body;
    const config = loadTestnetConfig();
    const apiKey = config.apiKey;
    const apiSecret = config.apiSecret;
    const type = config.type || 'spot';
    
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ success: false, error: 'API Key dan Secret Key belum dikonfigurasi' });
    }
    
    if (!symbol || !side || !quantity) {
      return res.status(400).json({ success: false, error: 'Symbol, side, dan quantity diperlukan' });
    }
    
    const orderResult = await binanceTestnetService.placeMarketOrder({
      symbol,
      side: side.toUpperCase(),
      quantity,
      leverage: leverage || 1,
      apiKey,
      apiSecret,
      type
    });
    
    res.json({ success: true, data: orderResult });
  } catch (error) {
    console.error('Error placing market order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route POST /api/testnet/tpsl-order
 * @desc Place a market order with take profit and stop loss on Binance Testnet (futures only)
 * @access Public
 */
router.post('/tpsl-order', async (req, res) => {
  try {
    const { symbol, side, quantity, takeProfitPrice, stopLossPrice } = req.body;
    const config = loadTestnetConfig();
    const apiKey = config.apiKey;
    const apiSecret = config.apiSecret;
    const type = config.type || 'spot';
    
    if (type !== 'futures') {
      return res.status(400).json({ success: false, error: 'TP/SL orders hanya tersedia untuk futures trading' });
    }
    
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ success: false, error: 'API Key dan Secret Key belum dikonfigurasi' });
    }
    
    if (!symbol || !side || !quantity || !takeProfitPrice || !stopLossPrice) {
      return res.status(400).json({ 
        success: false, 
        error: 'Symbol, side, quantity, takeProfitPrice, dan stopLossPrice diperlukan' 
      });
    }
    
    // Pertama, tempatkan market order
    const mainOrder = await binanceTestnetService.placeMarketOrder({
      symbol,
      side: side.toUpperCase(),
      quantity,
      leverage: req.body.leverage || 5,
      apiKey,
      apiSecret,
      type: 'futures'
    });
    
    // Kemudian tempatkan take profit dan stop loss
    const oppositeSide = side.toUpperCase() === 'BUY' ? 'SELL' : 'BUY';
    
    const tpslResult = await binanceTestnetService.placeTakeProfitStopLossOrders({
      symbol,
      side: oppositeSide,
      quantity,
      takeProfitPrice,
      stopLossPrice,
      apiKey,
      apiSecret,
      type: 'futures'
    });
    
    res.json({ 
      success: true, 
      data: { 
        mainOrder: mainOrder, 
        tpsl: tpslResult 
      } 
    });
  } catch (error) {
    console.error('Error placing TP/SL order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/testnet/positions
 * @desc Get positions from Binance Testnet (futures only)
 * @access Public
 */
router.get('/positions', async (req, res) => {
  try {
    const config = loadTestnetConfig();
    const apiKey = config.apiKey;
    const apiSecret = config.apiSecret;
    const type = config.type || 'spot';
    const symbol = req.query.symbol;
    
    if (type !== 'futures') {
      return res.status(400).json({ success: false, error: 'Positions hanya tersedia untuk futures trading' });
    }
    
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ success: false, error: 'API Key dan Secret Key belum dikonfigurasi' });
    }
    
    const positions = await binanceTestnetService.getPositions(symbol, apiKey, apiSecret);
    res.json({ success: true, data: positions });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/testnet/open-orders
 * @desc Get open orders from Binance Testnet
 * @access Public
 */
router.get('/open-orders', async (req, res) => {
  try {
    const config = loadTestnetConfig();
    const apiKey = config.apiKey;
    const apiSecret = config.apiSecret;
    const type = config.type || 'spot';
    const symbol = req.query.symbol || 'BTCUSDT';
    
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ success: false, error: 'API Key dan Secret Key belum dikonfigurasi' });
    }
    
    const orders = await binanceTestnetService.getOpenOrders(symbol, apiKey, apiSecret, type);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching open orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/testnet/order-history
 * @desc Get order history from Binance Testnet
 * @access Public
 */
router.get('/order-history', async (req, res) => {
  try {
    const config = loadTestnetConfig();
    const apiKey = config.apiKey;
    const apiSecret = config.apiSecret;
    const type = config.type || 'spot';
    const symbol = req.query.symbol || 'BTCUSDT';
    
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ success: false, error: 'API Key dan Secret Key belum dikonfigurasi' });
    }
    
    const orders = await binanceTestnetService.getOrderHistory(symbol, apiKey, apiSecret, type);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/testnet/test-connection
 * @desc Test connection to Binance Testnet
 * @access Public
 */
router.get('/test-connection', async (req, res) => {
  try {
    const config = loadTestnetConfig();
    
    if (!config.isConfigured || !config.apiKey || !config.apiSecret) {
      return res.status(400).json({ 
        success: false, 
        message: 'Testnet is not configured. Please set up API key first.'
      });
    }
    
    // Mencoba koneksi ke Binance Testnet
    const result = await binanceTestnetService.testConnection(
      config.apiKey, 
      config.apiSecret, 
      config.type
    );
    
    res.json({ 
      success: true, 
      message: 'Koneksi ke Binance Testnet berhasil',
      data: result
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(400).json({ 
      success: false, 
      message: `Failed to connect to Binance Testnet: ${error.message}`
    });
  }
});

/**
 * @route POST /api/testnet/run-simulation
 * @desc Run various testnet simulations based on action parameter
 * @access Public
 */
router.post('/run-simulation', async (req, res) => {
  try {
    console.log('Received run-simulation request:', req.body);
    const { action, symbol, side, quantity, leverage } = req.body;
    
    // Load config from file instead of environment variables
    const config = loadTestnetConfig();
    const apiKey = config.apiKey;
    const apiSecret = config.apiSecret;
    const type = config.type || 'futures';
    
    // Log configuration for debugging
    console.log('Using configuration:');
    console.log('- API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'Not configured');
    console.log('- Secret:', apiSecret ? 'Configured (hidden)' : 'Not configured');
    console.log('- Type:', type);
    
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ 
        success: false, 
        error: 'API Key dan Secret Key belum dikonfigurasi' 
      });
    }
    
    // Handle different actions based on the request
    switch (action) {
      case 'market_order':
        if (!symbol || !side || !quantity) {
          return res.status(400).json({ success: false, error: 'Symbol, side, dan quantity diperlukan' });
        }
        
        console.log(`Placing ${side} market order for ${quantity} ${symbol}`);
        const orderResult = await binanceTestnetService.placeMarketOrder({
          symbol,
          side: side.toUpperCase(),
          quantity: Number(quantity),
          leverage: Number(leverage || 1),
          apiKey,
          apiSecret,
          type
        });
        
        // Import order model to save order to local system
        const orderModel = require('../models/order.model');
        
        // Save the order to local system
        const orderData = {
          symbol: symbol,
          side: side.toUpperCase(),
          quantity: Number(quantity),
          price: parseFloat(orderResult.price || orderResult.avgPrice || 0),
          status: orderResult.status || 'FILLED',
          entryTime: new Date().toISOString(),
          type: 'MARKET',
          leverage: Number(leverage || 1)
        };
        
        // Create order in local system
        const savedOrder = orderModel.createOrder(orderData);
        console.log('Order saved to local system:', savedOrder);
        
        console.log('Order result:', orderResult);
        res.json({ success: true, data: orderResult });
        break;
        
      case 'check_orders':
        console.log(`Checking orders for ${symbol || 'all symbols'}`);
        try {
          const orders = await binanceTestnetService.getOpenOrders(symbol || null, apiKey, apiSecret, type);
          console.log(`Retrieved ${orders.length} orders`);
          res.json({ success: true, data: { orders } });
        } catch (error) {
          console.error('Error checking orders:', error);
          res.status(400).json({ success: false, error: `Error checking orders: ${error.message}` });
        }
        break;
        
      case 'check_positions':
        if (type !== 'futures') {
          return res.status(400).json({ success: false, error: 'Positions hanya tersedia untuk futures trading' });
        }
        
        console.log(`Checking positions for ${symbol || 'all symbols'}`);
        try {
          const positions = await binanceTestnetService.getPositions(symbol || null, apiKey, apiSecret);
          console.log(`Retrieved ${positions.length} positions`);
          res.json({ success: true, data: { positions } });
        } catch (error) {
          console.error('Error checking positions:', error);
          res.status(400).json({ success: false, error: `Error checking positions: ${error.message}` });
        }
        break;
        
      default:
        return res.status(400).json({ success: false, error: `Action tidak valid: ${action}` });
    }
  } catch (error) {
    console.error('Error running simulation:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route GET /api/testnet/debug-config
 * @desc Debug endpoint to check the current state of the testnet config
 * @access Public
 */
router.get('/debug-config', (req, res) => {
  try {
    console.log('DEBUG: Checking testnet config file');
    console.log('Config file path:', TESTNET_CONFIG_FILE);
    
    let fileExists = fs.existsSync(TESTNET_CONFIG_FILE);
    console.log('File exists:', fileExists);
    
    let fileData = null;
    let parsedConfig = null;
    let filePermissions = null;
    
    if (fileExists) {
      try {
        fileData = fs.readFileSync(TESTNET_CONFIG_FILE, 'utf8');
        parsedConfig = JSON.parse(fileData);
        
        const stats = fs.statSync(TESTNET_CONFIG_FILE);
        filePermissions = stats.mode.toString(8).slice(-3);
      } catch (err) {
        console.error('Error reading/parsing file:', err);
      }
    }
    
    // Check parent directory
    const parentDir = path.dirname(TESTNET_CONFIG_FILE);
    const parentExists = fs.existsSync(parentDir);
    
    // Check environment variables
    const envVars = {
      TESTNET_API_KEY: process.env.TESTNET_API_KEY ? 'Set' : 'Not set',
      TESTNET_SECRET_KEY: process.env.TESTNET_SECRET_KEY ? 'Set' : 'Not set',
      TESTNET_TYPE: process.env.TESTNET_TYPE || 'Not set',
      API_KEY: process.env.API_KEY ? 'Set' : 'Not set',
      SECRET_KEY: process.env.SECRET_KEY ? 'Set' : 'Not set'
    };
    
    res.json({
      configFilePath: TESTNET_CONFIG_FILE,
      fileExists,
      fileSize: fileExists ? fileData.length : null,
      filePermissions,
      parsedConfig: parsedConfig ? {
        apiKeyLength: parsedConfig.apiKey ? parsedConfig.apiKey.length : 0,
        apiSecretLength: parsedConfig.apiSecret ? parsedConfig.apiSecret.length : 0,
        type: parsedConfig.type,
        isConfigured: parsedConfig.isConfigured
      } : null,
      parentDirectory: {
        path: parentDir,
        exists: parentExists
      },
      environmentVariables: envVars,
      loadedConfig: loadTestnetConfig()
    });
  } catch (error) {
    console.error('Error in debug-config endpoint:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 