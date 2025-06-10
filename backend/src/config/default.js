/**
 * Default configuration for trading strategy
 */
const defaultConfig = {
  symbol: 'BTCUSDT',
  timeframe: '5m',
  plusDIThreshold: 25,
  minusDIThreshold: 20,
  adxMinimum: 20,
  takeProfitPercent: 2, // percentage
  stopLossPercent: 1, // percentage
  leverage: 10,
  marketDataSource: 'binance' // options: 'binance', 'coingecko'
};

module.exports = defaultConfig; 