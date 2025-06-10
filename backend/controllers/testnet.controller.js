/**
 * Manual test webhook (for debugging)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const manualTestSignal = async (req, res) => {
  try {
    const config = loadTestnetConfig();
    
    if (!config.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Testnet is not configured. Please set up API key first.'
      });
    }
    
    console.log('Creating manual test signal');
    // Create a manual BUY signal
    const signal = {
      symbol: 'BTCUSDT',
      action: 'BUY', // Directly set action
      quantity: 0.001,
      // Apply leverage from config
      leverage: 10,
      takeProfitPercent: 2,
      stopLossPercent: 1
    };
    
    console.log('Manual test signal:', signal);
    
    // Execute testnet order (similar to placeTradingSignalOrder but skip validation)
    const orderResult = await placeTradingSignalOrder({
      body: signal
    }, res);
    
    return res.status(200).json({
      success: true,
      message: 'Manual test signal executed',
      orderResult
    });
  } catch (error) {
    console.error('Error executing manual test signal:', error);
    return res.status(500).json({
      success: false,
      message: `Error: ${error.message}`
    });
  }
};

module.exports = {
  // existing exports
  placeTradingSignalOrder,
  manualTestSignal,
  // other exports
}; 