/**
 * Validate trading signal based on configuration
 * @param {Object} signal - Trading signal from TradingView
 * @returns {Object} Validation result with action and isValid properties
 */
const validateSignal = (signal) => {
  try {
    const config = configModel.getConfig();

    // Convert config values to numbers (in case they're stored as strings)
    const plusDIThreshold = Number(config.plusDIThreshold);
    const minusDIThreshold = Number(config.minusDIThreshold);
    const adxMinimum = Number(config.adxMinimum);

    // Extract values from signal
    const { plusDI, minusDI, adx } = signal;
    
    console.log('DEBUG - Signal received:', signal);
    console.log('DEBUG - Config values (parsed):', { 
      plusDIThreshold, 
      minusDIThreshold, 
      adxMinimum 
    });

    // Validate required fields
    if (plusDI === undefined || minusDI === undefined || adx === undefined) {
      return {
        isValid: false,
        action: null,
        reason: 'Missing required signal data (plusDI, minusDI, or adx)'
      };
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
    let action = null;

    // BUY signal: +DI > threshold and -DI < threshold
    if (plusDI > plusDIThreshold && minusDI < minusDIThreshold) {
      action = 'BUY';
      console.log('DEBUG - BUY signal validated');
    }
    // SELL signal: -DI > threshold and +DI < threshold
    else if (minusDI > plusDIThreshold && plusDI < minusDIThreshold) {
      action = 'SELL';
      console.log('DEBUG - SELL signal validated');
    } else {
      console.log('DEBUG - Signal validation failed:', {
        buyCondition: `plusDI (${plusDI}) > plusDIThreshold (${plusDIThreshold}) && minusDI (${minusDI}) < minusDIThreshold (${minusDIThreshold})`,
        sellCondition: `minusDI (${minusDI}) > plusDIThreshold (${plusDIThreshold}) && plusDI (${plusDI}) < minusDIThreshold (${minusDIThreshold})`
      });
    }

    // If no action determined, signal is not valid
    if (!action) {
      return {
        isValid: false,
        action: null,
        reason: 'Signal does not meet criteria for BUY or SELL'
      };
    }

    return {
      isValid: true,
      action
    };
  } catch (error) {
    console.error('Error validating signal:', error);
    return {
      isValid: false,
      action: null,
      reason: 'Error validating signal'
    };
  }
};

/**
 * Create simulated order
 * @param {Object} orderData - Order data
 * @returns {Object} Simulated order
 */
const createSimulatedOrder = async (orderData) => {
  try {
    console.log('Creating simulated order:', orderData);
    
    // Get current price if not provided
    if (!orderData.price || orderData.price === 0) {
      try {
        orderData.price = await marketService.getCurrentPrice(orderData.symbol);
        console.log('Fetched current price:', orderData.price);
      } catch (error) {
        console.error('Error fetching price, using dummy price:', error);
        orderData.price = 30000; // Dummy price for BTC
      }
    }
    
    // Add timestamp if not provided
    if (!orderData.timestamp) {
      orderData.timestamp = new Date().toISOString();
    }
    
    // Calculate take profit and stop loss
    const tpsl = marketService.calculateTPSL(
      orderData.action,
      orderData.price,
      orderData.takeProfitPercent || 2,
      orderData.stopLossPercent || 1
    );
    
    // Create order with full details
    const order = {
      id: require('crypto').randomUUID(),
      symbol: orderData.symbol,
      action: orderData.action,
      price_entry: orderData.price,
      tp_price: tpsl.tpPrice,
      sl_price: tpsl.slPrice,
      quantity: orderData.quantity,
      leverage: orderData.leverage,
      timeframe: orderData.timeframe,
      status: 'OPEN',
      createdAt: orderData.timestamp
    };
    
    // Save order
    const savedOrder = await orderModel.addOrder(order);
    console.log('Simulated order created:', savedOrder);
    
    return savedOrder;
  } catch (error) {
    console.error('Error creating simulated order:', error);
    throw error;
  }
};

// Export module
module.exports = {
  validateSignal,
  processSignal,
  createSimulatedOrder
}; 