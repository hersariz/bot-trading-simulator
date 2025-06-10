/**
 * Controller for handling webhook endpoints
 */
const tradingService = require('../services/trading.service');
const fs = require('fs');
const path = require('path');

// Webhook token for authentication
// In production, use environment variable instead
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || 'trd_wh_8f2a7b3d9c4e5f6g7h8i9j0k1l2m3n4o5p';

// Path for testnet API key configuration
const TESTNET_CONFIG_FILE = path.join(__dirname, '../../data/testnet_config.json');

/**
 * Check if Testnet is configured and active
 * @returns {boolean} Is Testnet configured
 */
const isTestnetConfigured = () => {
  try {
    if (fs.existsSync(TESTNET_CONFIG_FILE)) {
      const data = fs.readFileSync(TESTNET_CONFIG_FILE, 'utf8');
      const config = JSON.parse(data);
      return config.isConfigured === true;
    }
  } catch (error) {
    console.error('Error checking testnet config:', error);
  }
  
  return false;
};

/**
 * Validate TradingView webhook payload
 * Expected format:
 * {
 *   "symbol": "BTCUSDT",
 *   "plusDI": 27.5,
 *   "minusDI": 15.0,
 *   "adx": 25.0,
 *   "timeframe": "5m"
 * }
 * 
 * @param {Object} payload - Webhook payload from TradingView
 * @returns {Object} Validation result with isValid and error properties
 */
const validateWebhookPayload = (payload) => {
  if (!payload) {
    return { isValid: false, error: 'Missing payload' };
  }

  // Check for required fields
  const requiredFields = ['symbol', 'plusDI', 'minusDI', 'adx', 'timeframe'];
  const missingFields = requiredFields.filter(field => payload[field] === undefined);
  
  if (missingFields.length > 0) {
    return { 
      isValid: false, 
      error: `Missing required fields: ${missingFields.join(', ')}` 
    };
  }
  
  // Validate data types
  if (typeof payload.symbol !== 'string') {
    return { isValid: false, error: 'Symbol must be a string' };
  }
  
  if (
    typeof payload.plusDI !== 'number' || 
    typeof payload.minusDI !== 'number' || 
    typeof payload.adx !== 'number'
  ) {
    return { isValid: false, error: 'plusDI, minusDI, and adx must be numbers' };
  }
  
  if (typeof payload.timeframe !== 'string') {
    return { isValid: false, error: 'Timeframe must be a string' };
  }
  
  return { isValid: true };
};

/**
 * Process webhook from TradingView
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const processWebhook = async (req, res) => {
  try {
    // Optional: Verify webhook token
    const token = req.headers['x-webhook-token'] || req.query.token;
    if (WEBHOOK_TOKEN && token !== WEBHOOK_TOKEN) {
      console.warn('Invalid webhook token received');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid webhook token'
      });
    }
    
    // Get signal data from request body
    const signal = req.body;
    
    // Validate webhook payload
    const validation = validateWebhookPayload(signal);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }
    
    // Log received signal
    console.log('Received signal:', JSON.stringify(signal, null, 2));
    
    // Check if testnet is configured for real order execution
    const useTestnet = isTestnetConfigured();
    
    // Process signal
    const result = await tradingService.processSignal(signal, useTestnet);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      message: `Error processing webhook: ${error.message}`
    });
  }
};

module.exports = {
  processWebhook
}; 