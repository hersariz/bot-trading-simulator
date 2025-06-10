/**
 * Service for interacting with CoinGecko API
 */
const axios = require('axios');

// Base URL for CoinGecko API
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// Mapping of common Binance symbols to CoinGecko IDs
const symbolToCoinId = {
  'BTCUSDT': 'bitcoin',
  'ETHUSDT': 'ethereum',
  'BNBUSDT': 'binancecoin',
  'ADAUSDT': 'cardano',
  'SOLUSDT': 'solana',
  'DOGEUSDT': 'dogecoin',
  'XRPUSDT': 'ripple',
  'DOTUSDT': 'polkadot',
  'AVAXUSDT': 'avalanche-2',
  'MATICUSDT': 'matic-network'
};

/**
 * Convert Binance symbol to CoinGecko coin ID
 * @param {string} symbol - Binance symbol (e.g., BTCUSDT)
 * @returns {string} CoinGecko coin ID
 */
const getCoinIdFromSymbol = (symbol) => {
  // Strip USDT, USD, etc. from the symbol to get the base currency
  const baseCurrency = symbol.replace(/USDT$|USD$|BUSD$/, '').toLowerCase();
  
  // Check our mapping first
  if (symbolToCoinId[symbol]) {
    return symbolToCoinId[symbol];
  }
  
  // If not in our mapping, try a basic approach (this may not always work)
  return baseCurrency;
};

/**
 * Get current price for a symbol
 * @param {string} symbol - Trading pair symbol (e.g., BTCUSDT)
 * @returns {Promise<number>} Current price as a number
 */
const getCurrentPrice = async (symbol) => {
  try {
    const coinId = getCoinIdFromSymbol(symbol);
    
    const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
      params: {
        ids: coinId,
        vs_currencies: 'usd'
      }
    });
    
    if (response.data && response.data[coinId] && response.data[coinId].usd) {
      return response.data[coinId].usd;
    }
    
    throw new Error('Invalid response from CoinGecko API');
  } catch (error) {
    console.error(`Error getting price for ${symbol} from CoinGecko:`, error.message);
    throw error;
  }
};

/**
 * Get 24hr ticker price change statistics
 * @param {string} symbol - Trading pair symbol (e.g., BTCUSDT)
 * @returns {Promise<Object>} Ticker statistics
 */
const get24hTickerStats = async (symbol) => {
  try {
    const coinId = getCoinIdFromSymbol(symbol);
    
    const response = await axios.get(`${COINGECKO_API_URL}/coins/${coinId}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: 1
      }
    });
    
    if (!response.data || !response.data.prices || response.data.prices.length < 2) {
      throw new Error('Invalid response from CoinGecko API');
    }
    
    // Get the first and last price points to calculate price change
    const firstPrice = response.data.prices[0][1];
    const lastPrice = response.data.prices[response.data.prices.length - 1][1];
    
    // Calculate price change and percentage
    const priceChange = lastPrice - firstPrice;
    const priceChangePercent = (priceChange / firstPrice) * 100;
    
    // Get volume data
    const volume = response.data.total_volumes[response.data.total_volumes.length - 1][1];
    
    return {
      symbol: symbol,
      priceChange: priceChange.toFixed(2),
      priceChangePercent: priceChangePercent.toFixed(2),
      weightedAvgPrice: lastPrice.toFixed(2),
      lastPrice: lastPrice.toFixed(2),
      volume: volume.toFixed(2),
      quoteVolume: (volume * lastPrice).toFixed(2),
      openTime: new Date(response.data.prices[0][0]).getTime(),
      closeTime: new Date(response.data.prices[response.data.prices.length - 1][0]).getTime(),
      firstId: 0,
      lastId: response.data.prices.length - 1,
      count: response.data.prices.length
    };
  } catch (error) {
    console.error(`Error getting 24hr stats for ${symbol} from CoinGecko:`, error.message);
    throw error;
  }
};

/**
 * Get exchange information for a symbol
 * @param {string} symbol - Trading pair symbol (e.g., BTCUSDT)
 * @returns {Promise<Object>} Exchange information
 */
const getExchangeInfo = async (symbol) => {
  try {
    const coinId = getCoinIdFromSymbol(symbol);
    
    // Check if the coin exists by fetching its data
    const response = await axios.get(`${COINGECKO_API_URL}/coins/${coinId}`);
    
    if (response.data && response.data.id) {
      return {
        symbols: [{
          symbol: symbol,
          status: 'TRADING',
          baseAsset: coinId,
          quoteAsset: 'USDT'
        }]
      };
    }
    
    throw new Error('Invalid response from CoinGecko API');
  } catch (error) {
    console.error(`Error getting exchange info for ${symbol} from CoinGecko:`, error.message);
    throw error;
  }
};

/**
 * Calculate take profit and stop loss prices based on current price
 * @param {string} action - 'BUY' or 'SELL'
 * @param {number} currentPrice - Current price of the symbol
 * @param {number} takeProfitPercent - Take profit percentage
 * @param {number} stopLossPercent - Stop loss percentage
 * @returns {Object} Object containing take profit and stop loss prices
 */
const calculateTPSL = (action, currentPrice, takeProfitPercent, stopLossPercent) => {
  if (action === 'BUY') {
    const tpPrice = currentPrice * (1 + takeProfitPercent / 100);
    const slPrice = currentPrice * (1 - stopLossPercent / 100);
    return { tpPrice, slPrice };
  } else if (action === 'SELL') {
    const tpPrice = currentPrice * (1 - takeProfitPercent / 100);
    const slPrice = currentPrice * (1 + stopLossPercent / 100);
    return { tpPrice, slPrice };
  }
  
  throw new Error('Invalid action. Must be BUY or SELL');
};

module.exports = {
  getCurrentPrice,
  get24hTickerStats,
  getExchangeInfo,
  calculateTPSL
}; 