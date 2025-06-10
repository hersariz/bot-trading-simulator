/**
 * Service for processing trading logic
 */
const marketService = require('./market.service');
const configModel = require('../models/config.model');
const orderModel = require('../models/order.model');
const testnetController = require('../controllers/testnet.controller');
const fs = require('fs');
const path = require('path');

// Path for testnet API key configuration
const TESTNET_CONFIG_FILE = path.join(__dirname, '../../data/testnet_config.json');

// Cache untuk config testnet
let testnetConfigCache = null;
let testnetConfigLastRead = 0;
const CONFIG_CACHE_TTL = 60000; // 1 menit cache

/**
 * Load testnet config dengan caching
 * @returns {Object} Testnet configuration
 */
const loadTestnetConfig = () => {
  const now = Date.now();
  
  // Gunakan cache jika masih valid
  if (testnetConfigCache && (now - testnetConfigLastRead < CONFIG_CACHE_TTL)) {
    return testnetConfigCache;
  }
  
  try {
    if (fs.existsSync(TESTNET_CONFIG_FILE)) {
      const data = fs.readFileSync(TESTNET_CONFIG_FILE, 'utf8');
      testnetConfigCache = JSON.parse(data);
      testnetConfigLastRead = now;
      return testnetConfigCache;
    }
  } catch (error) {
    console.error('Error loading testnet config:', error.message);
  }
  
  // Default config
  const defaultConfig = {
    apiKey: '',
    apiSecret: '',
    type: 'futures',
    isConfigured: false
  };
  
  testnetConfigCache = defaultConfig;
  testnetConfigLastRead = now;
  return defaultConfig;
};

/**
 * Validate trading signal based on configuration
 * @param {Object} signal - Trading signal from TradingView
 * @returns {Object} Validation result with action and isValid properties
 */
const validateSignal = (signal) => {
  try {
    const config = configModel.getConfig();
    
    // Extract values from signal
    const { plusDI, minusDI, adx } = signal;
    
    // Validate required fields
    if (plusDI === undefined || minusDI === undefined || adx === undefined) {
      return {
        isValid: false,
        action: null,
        reason: 'Missing required signal data (plusDI, minusDI, or adx)'
      };
    }
    
    // Convert config values to numbers (in case they're stored as strings)
    const adxMinimum = parseFloat(config.adxMinimum);
    const plusDIThreshold = parseFloat(config.plusDIThreshold);
    const minusDIThreshold = parseFloat(config.minusDIThreshold);
    
    // Log hanya saat mode development
    if (process.env.NODE_ENV === 'development') {
      console.log('Validating signal with thresholds:', {
        adxMinimum,
        plusDIThreshold,
        minusDIThreshold,
        signalPlusDI: plusDI,
        signalMinusDI: minusDI,
        signalADX: adx
      });
    }
    
    // Check if ADX is above minimum
    if (adx < adxMinimum) {
      return {
        isValid: false,
        action: null,
        reason: `ADX (${adx}) is below minimum threshold (${adxMinimum})`
      };
    }
    
    // Determine action based on DI values
    // BUY signal: +DI > threshold and -DI < threshold
    if (plusDI > plusDIThreshold && minusDI < minusDIThreshold) {
      return {
        isValid: true,
        action: 'BUY'
      };
    }
    
    // SELL signal: -DI > threshold and +DI < threshold
    if (minusDI > plusDIThreshold && plusDI < minusDIThreshold) {
      return {
        isValid: true,
        action: 'SELL'
      };
    }
    
    // Jika tidak memenuhi salah satu kriteria
    return {
      isValid: false,
      action: null,
      reason: `Signal does not meet criteria for BUY or SELL. Values: +DI=${plusDI}, -DI=${minusDI}, ADX=${adx}, Thresholds: +DI=${plusDIThreshold}, -DI=${minusDIThreshold}, ADX=${adxMinimum}`
    };
  } catch (error) {
    console.error('Error validating signal:', error.message);
    return {
      isValid: false,
      action: null,
      reason: `Error validating signal: ${error.message}`
    };
  }
};

/**
 * Execute order on Binance Testnet
 * @param {Object} orderData - Order data
 * @returns {Object} Result with testnet order information
 */
const executeTestnetOrder = async (orderData) => {
  try {
    // Load testnet configuration
    const testnetConfig = loadTestnetConfig();
    
    if (!testnetConfig.isConfigured) {
      return {
        success: false,
        message: 'Testnet is not configured'
      };
    }
    
    // Prepare order data for testnet
    const testnetOrderData = {
      symbol: orderData.symbol,
      action: orderData.action,
      quantity: configModel.getConfig().quantity || configModel.getConfig().orderSize,
      leverage: orderData.leverage,
      takeProfitPercent: configModel.getConfig().takeProfitPercent,
      stopLossPercent: configModel.getConfig().stopLossPercent
    };
    
    // Execute testnet order using the controller
    const req = { body: testnetOrderData };
    const res = {
      status: function() { return this; },
      json: function(data) { return data; }
    };
    
    // Call the testnet controller to place the order
    return await testnetController.placeTradingSignalOrder(req, res);
  } catch (error) {
    console.error('Error executing testnet order:', error.message);
    return {
      success: false,
      message: `Error executing testnet order: ${error.message}`
    };
  }
};

/**
 * Process trading signal and create order if valid
 * @param {Object} signal - Trading signal from TradingView
 * @param {boolean} useTestnet - Whether to use testnet for real order execution
 * @returns {Object} Processing result with order data if successful
 */
const processSignal = async (signal, useTestnet = false) => {
  try {
    // Get configuration
    const config = configModel.getConfig();
    
    // Use symbol from signal or default from config
    const symbol = signal.symbol || config.symbol;
    
    // Validate signal
    const validation = validateSignal(signal);
    
    if (!validation.isValid) {
      return {
        success: false,
        message: `Invalid signal: ${validation.reason}`
      };
    }
    
    // Get current price from market service
    const price = await marketService.getCurrentPrice(symbol);
    
    // Calculate take profit and stop loss prices
    const { tpPrice, slPrice } = marketService.calculateTPSL(
      validation.action,
      price,
      config.takeProfitPercent,
      config.stopLossPercent
    );
    
    // Create order data
    const orderData = {
      symbol,
      action: validation.action,
      price_entry: price,
      tp_price: parseFloat(tpPrice.toFixed(8)),
      sl_price: parseFloat(slPrice.toFixed(8)),
      leverage: config.leverage,
      timeframe: signal.timeframe || config.timeframe,
      signal: {
        plusDI: signal.plusDI,
        minusDI: signal.minusDI,
        adx: signal.adx
      }
    };
    
    // Create simulation order
    const order = orderModel.createOrder(orderData);
    
    // Execute real order on testnet if enabled
    let testnetResult = null;
    if (useTestnet) {
      testnetResult = await executeTestnetOrder(orderData);
      
      // Add testnet order info to the response
      if (testnetResult && testnetResult.success) {
        // Update order with testnet information
        const testnetOrderId = testnetResult.order?.id;
        const testnetStatus = testnetResult.order?.status;
        
        // Update order in database with testnet information
        if (testnetOrderId) {
          const updatedOrder = orderModel.updateOrderStatus(order.id, order.status, {
            testnet_order_id: testnetOrderId,
            testnet_status: testnetStatus,
            testnet_created_at: new Date().toISOString()
          });
          
          // Replace order reference with updated version
          if (updatedOrder) {
            Object.assign(order, updatedOrder);
          }
          
          console.log(`Order ${order.id} linked with testnet order ${testnetOrderId}`);
        }
      } else {
        console.warn(`Failed to create testnet order: ${testnetResult?.message || 'Unknown error'}`);
      }
    }
    
    const response = {
      success: true,
      message: `Successfully created ${validation.action} order`,
      order
    };
    
    // Add testnet information if applicable
    if (useTestnet) {
      response.testnet = {
        used: true,
        success: testnetResult?.success || false,
        message: testnetResult?.message || 'No testnet result',
        order: testnetResult?.order
      };
    }
    
    return response;
  } catch (error) {
    console.error('Error processing signal:', error.message);
    return {
      success: false,
      message: `Error processing signal: ${error.message}`
    };
  }
};

module.exports = {
  validateSignal,
  processSignal
}; 