/**
 * Controller for handling configuration endpoints
 */
const configModel = require('../models/config.model');
const marketService = require('../services/market.service');
const tradingService = require('../services/trading.service');

/**
 * Get current configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getConfig = (req, res) => {
  try {
    const config = configModel.getConfig();
    res.status(200).json(config);
  } catch (error) {
    console.error('Error getting configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get configuration'
    });
  }
};

/**
 * Validate configuration data
 * @param {Object} config - Configuration object to validate
 * @returns {Object} Validation result with isValid and errors properties
 */
const validateConfig = (config) => {
  const errors = [];

  // Check required fields
  const requiredFields = ['symbol', 'timeframe', 'plusDiThreshold', 'minusDiThreshold', 
                         'adxMinimum', 'takeProfitPercent', 'stopLossPercent', 'leverage'];
  
  const missingFields = requiredFields.filter(field => config[field] === undefined);
  
  if (missingFields.length > 0) {
    errors.push(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate numeric fields
  const numericFields = ['plusDiThreshold', 'minusDiThreshold', 'adxMinimum', 
                        'takeProfitPercent', 'stopLossPercent', 'leverage'];
  
  numericFields.forEach(field => {
    if (config[field] !== undefined && (isNaN(config[field]) || config[field] <= 0)) {
      errors.push(`${field} must be a positive number`);
    }
  });

  // Validate symbol format
  if (config.symbol && !/^[A-Z]+$/.test(config.symbol)) {
    errors.push('Symbol must be in uppercase format (e.g., BTCUSDT)');
  }

  // Validate timeframe
  const validTimeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
  if (config.timeframe && !validTimeframes.includes(config.timeframe)) {
    errors.push(`Timeframe must be one of: ${validTimeframes.join(', ')}`);
  }
  
  // Validate marketDataSource
  const validDataSources = ['binance', 'coingecko'];
  if (config.marketDataSource && !validDataSources.includes(config.marketDataSource.toLowerCase())) {
    errors.push(`Market data source must be one of: ${validDataSources.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Update configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateConfig = async (req, res) => {
  try {
    const configData = req.body;
    const { createOrderNow } = req.query;
    
    // Validate required fields - Fix field names according to frontend
    const requiredFields = ['symbol', 'timeframe', 'adxMinimum', 'plusDiThreshold', 'minusDiThreshold'];
    const missingFields = requiredFields.filter(field => {
      // Handle both possible naming conventions for DI thresholds
      if (field === 'plusDiThreshold' && (configData[field] || configData['plusDIThreshold'])) {
        return false;
      }
      if (field === 'minusDiThreshold' && (configData[field] || configData['minusDIThreshold'])) {
        return false;
      }
      return !configData[field];
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Normalize data to ensure consistent field names
    if (configData.plusDIThreshold && !configData.plusDiThreshold) {
      configData.plusDiThreshold = configData.plusDIThreshold;
    }
    
    if (configData.minusDIThreshold && !configData.minusDiThreshold) {
      configData.minusDiThreshold = configData.minusDIThreshold;
    }
    
    // Update configuration
    const updatedConfig = configModel.updateConfig(configData);
    
    // Check if we should create an order immediately
    if (createOrderNow === 'true') {
      try {
        // Get current market data for the symbol
        const symbol = configData.symbol;
        const currentPrice = await marketService.getCurrentPrice(symbol);
        
        // Get current ADX, +DI, -DI values from market
        const indicatorValues = await marketService.getIndicatorValues(symbol, configData.timeframe);
        
        if (!indicatorValues) {
          return res.status(200).json({
            success: true,
            message: 'Configuration updated successfully, but could not create order due to missing indicator values',
            config: updatedConfig
          });
        }
        
        // Create signal from current market data
        const signal = {
          symbol: symbol,
          plusDI: indicatorValues.plusDI,
          minusDI: indicatorValues.minusDI,
          adx: indicatorValues.adx,
          timeframe: configData.timeframe
        };
        
        // Check if testnet should be used
        const useTestnet = configData.useTestnet === true || configData.useTestnet === 'true';
        
        // Process signal to create order
        const orderResult = await tradingService.processSignal(signal, useTestnet);
        
        if (orderResult.success) {
          return res.status(200).json({
            success: true,
            message: 'Configuration updated and order created successfully',
            config: updatedConfig,
            order: orderResult.order,
            orderCreated: true,
            signal: signal
          });
        } else {
          return res.status(200).json({
            success: true,
            message: `Configuration updated successfully, but could not create order: ${orderResult.message}`,
            config: updatedConfig,
            orderCreated: false,
            signal: signal
          });
        }
      } catch (orderError) {
        console.error('Error creating order after config update:', orderError);
        return res.status(200).json({
          success: true,
          message: `Configuration updated successfully, but error creating order: ${orderError.message}`,
          config: updatedConfig,
          orderCreated: false
        });
      }
    }
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
      config: updatedConfig
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update configuration'
    });
  }
};

module.exports = {
  getConfig,
  updateConfig
}; 