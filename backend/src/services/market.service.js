/**
 * Market Service Factory
 * Selects the appropriate market data service based on configuration
 */
const binanceService = require('./binance.service');
const coingeckoService = require('./coingecko.service');
const configModel = require('../models/config.model');

/**
 * Get the appropriate market data service based on configuration
 * @returns {Object} Market data service instance
 */
const getMarketService = () => {
  const config = configModel.getConfig();
  const marketDataSource = config.marketDataSource || 'binance';
  
  switch (marketDataSource.toLowerCase()) {
    case 'coingecko':
      console.log('Using CoinGecko as market data source');
      return coingeckoService;
    case 'binance':
    default:
      console.log('Using Binance as market data source');
      return binanceService;
  }
};

// Export direct methods to make it easier to use
module.exports = {
  getCurrentPrice: async (symbol) => {
    const service = getMarketService();
    return service.getCurrentPrice(symbol);
  },
  
  get24hTickerStats: async (symbol) => {
    const service = getMarketService();
    return service.get24hTickerStats(symbol);
  },
  
  getExchangeInfo: async (symbol) => {
    const service = getMarketService();
    return service.getExchangeInfo(symbol);
  },
  
  calculateTPSL: (action, currentPrice, takeProfitPercent, stopLossPercent) => {
    const service = getMarketService();
    return service.calculateTPSL(action, currentPrice, takeProfitPercent, stopLossPercent);
  },
  
  /**
   * Get current indicator values (ADX, +DI, -DI)
   * @param {string} symbol - Trading pair symbol
   * @param {string} timeframe - Timeframe (e.g., '5m', '1h')
   * @returns {Promise<Object|null>} Indicator values or null if not available
   */
  getIndicatorValues: async (symbol, timeframe) => {
    try {
      // In a real implementation, this would fetch data from a technical analysis API
      // or calculate indicators from historical price data
      
      // For now, we'll generate simulated indicator values based on configuration
      const config = configModel.getConfig();
      
      // Generate random values that are likely to trigger an order based on config
      // This is just for demonstration - in production you'd use real indicator values
      const adxBase = parseFloat(config.adxMinimum) + 5; // Above minimum
      const plusDIBase = parseFloat(config.plusDIThreshold) + 5; // Above threshold
      const minusDIBase = parseFloat(config.minusDIThreshold) - 5; // Below threshold
      
      // Add some randomness
      const randomFactor = 0.2; // 20% variance
      const adx = adxBase * (1 + (Math.random() * randomFactor - randomFactor/2));
      const plusDI = plusDIBase * (1 + (Math.random() * randomFactor - randomFactor/2));
      const minusDI = minusDIBase * (1 + (Math.random() * randomFactor - randomFactor/2));
      
      console.log(`Generated indicator values for ${symbol} (${timeframe}):`, {
        adx: adx.toFixed(2),
        plusDI: plusDI.toFixed(2),
        minusDI: minusDI.toFixed(2)
      });
      
      return {
        adx,
        plusDI,
        minusDI,
        timeframe
      };
    } catch (error) {
      console.error(`Error getting indicator values for ${symbol}:`, error.message);
      return null;
    }
  }
}; 