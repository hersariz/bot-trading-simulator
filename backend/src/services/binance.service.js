/**
 * Service for interacting with Binance API
 */
const axios = require('axios');
const crypto = require('crypto');

// Base URL from environment variable or default (menggunakan testnet)
const BINANCE_API_URL = process.env.BINANCE_API_URL || 'https://testnet.binance.vision';

// Flag to use dummy data when API is not available
const USE_DUMMY_DATA = process.env.USE_DUMMY_DATA === 'true' || false;

/**
 * Dummy data for testing when API is not available
 */
const dummyData = {
  BTCUSDT: {
    price: 27123.45,
    tickerStats: {
      symbol: 'BTCUSDT',
      priceChange: '345.67',
      priceChangePercent: '1.25',
      weightedAvgPrice: '27100.12',
      lastPrice: '27123.45',
      volume: '12345.67',
      quoteVolume: '334567890.12',
      openTime: 1654321098765,
      closeTime: 1654407498765,
      firstId: 123456789,
      lastId: 123457789,
      count: 1000
    }
  },
  ETHUSDT: {
    price: 1845.67,
    tickerStats: {
      symbol: 'ETHUSDT',
      priceChange: '23.45',
      priceChangePercent: '1.15',
      weightedAvgPrice: '1840.23',
      lastPrice: '1845.67',
      volume: '45678.90',
      quoteVolume: '84123456.78',
      openTime: 1654321098765,
      closeTime: 1654407498765,
      firstId: 234567890,
      lastId: 234568890,
      count: 1000
    }
  }
};

/**
 * Create signature for Binance API request
 * @param {string} queryString - Query string to sign
 * @param {string} apiSecret - API secret key
 * @returns {string} HMAC SHA256 signature
 */
const createSignature = (queryString, apiSecret) => {
  return crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex');
};

/**
 * Test connection to Binance API
 * @param {string} [apiKey] - Optional Binance API key
 * @param {string} [apiSecret] - Optional Binance API secret
 * @returns {Promise<boolean>} - Returns true if connection is successful
 */
const testConnection = async (apiKey, apiSecret) => {
  try {
    // Untuk menghindari masalah timestamp, kita menggunakan endpoint publik
    // yang tidak memerlukan API key atau timestamp (menggunakan testnet)
    const response = await axios({
      method: 'GET',
      url: 'https://testnet.binance.vision/api/v3/ping',
      timeout: 5000 // Timeout 5 detik
    });
    
    // Jika berhasil ping, coba dapatkan server time untuk validasi lebih lanjut
    if (response.status === 200) {
      const timeResponse = await axios({
        method: 'GET',
        url: 'https://testnet.binance.vision/api/v3/time',
        timeout: 5000
      });
      
      if (timeResponse.status === 200 && timeResponse.data.serverTime) {
        // Hitung perbedaan waktu dengan server Binance
        const serverTime = timeResponse.data.serverTime;
        const localTime = Date.now();
        const timeDiff = Math.abs(serverTime - localTime);
        
        console.log(`Binance server time: ${serverTime}, Local time: ${localTime}, Difference: ${timeDiff}ms`);
        
        // Peringatan jika perbedaan waktu lebih dari 1000ms
        if (timeDiff > 1000) {
          console.warn(`Warning: Time difference with Binance server is ${timeDiff}ms, might cause issues with signed requests`);
        }
        
        return {
          connected: true,
          serverTime,
          localTime,
          timeDiff
        };
      }
    }
    
    throw new Error('Invalid response from Binance API');
  } catch (error) {
    console.error('Error testing Binance connection:', error.response ? error.response.data : error.message);
    throw new Error('Failed to connect to Binance API: ' + (error.response ? error.response.data.msg : error.message));
  }
};

/**
 * Get current price for a symbol from Binance
 * @param {string} symbol - Trading pair symbol (e.g., 'BTCUSDT')
 * @param {string} [apiKey] - Optional Binance API key
 * @param {string} [apiSecret] - Optional Binance API secret
 * @returns {Promise<number>} - Current price
 */
const getCurrentPrice = async (symbol) => {
  try {
    // Ensure symbol is in correct format for Binance
    const formattedSymbol = symbol.toUpperCase();
    
    // Make API request to get ticker price - this is a public endpoint, no API key needed
    const response = await axios({
      method: 'GET',
      url: 'https://testnet.binance.vision/api/v3/ticker/price',
      params: {
        symbol: formattedSymbol
      }
    });
    
    return parseFloat(response.data.price);
  } catch (error) {
    console.error('Error getting current price from Binance:', error.response ? error.response.data : error.message);
    throw new Error('Failed to get current price: ' + (error.response ? error.response.data.msg : error.message));
  }
};

/**
 * Get historical price data from Binance
 * @param {string} symbol - Trading pair symbol (e.g., 'BTCUSDT')
 * @param {string} interval - Kline/candlestick interval (e.g., '1m', '1h', '1d')
 * @param {number} limit - Number of candles to retrieve (max 1000)
 * @returns {Promise<Array>} - Array of candles
 */
const getHistoricalPrices = async (symbol, interval, limit = 100) => {
  try {
    // Ensure symbol is in correct format for Binance
    const formattedSymbol = symbol.toUpperCase();
    
    // Make API request to get klines (candlestick) data - this is a public endpoint
    const response = await axios({
      method: 'GET',
      url: 'https://testnet.binance.vision/api/v3/klines',
      params: {
        symbol: formattedSymbol,
        interval,
        limit: Math.min(limit, 1000) // Binance has a max limit of 1000
      }
    });
    
    // Format response data
    return response.data.map(candle => ({
      openTime: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
      closeTime: candle[6],
      quoteAssetVolume: candle[7],
      trades: candle[8],
      takerBuyBaseAssetVolume: candle[9],
      takerBuyQuoteAssetVolume: candle[10]
    }));
  } catch (error) {
    console.error('Error getting historical prices from Binance:', error.response ? error.response.data : error.message);
    throw new Error('Failed to get historical prices: ' + (error.response ? error.response.data.msg : error.message));
  }
};

/**
 * Get 24hr ticker price change statistics
 * @param {string} symbol - Trading pair symbol (e.g., BTCUSDT)
 * @returns {Promise<Object>} Ticker statistics
 */
const get24hTickerStats = async (symbol) => {
  try {
    // Use dummy data if flag is set
    if (USE_DUMMY_DATA) {
      console.log(`[DUMMY DATA] Using dummy ticker stats for ${symbol}`);
      // Default to BTCUSDT if symbol not found in dummy data
      const data = dummyData[symbol] || dummyData.BTCUSDT;
      return data.tickerStats;
    }
    
    const response = await axios.get(`${BINANCE_API_URL}/api/v3/ticker/24hr`, {
      params: { symbol }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error getting 24hr stats for ${symbol}:`, error.message);
    
    // Fallback to dummy data if API call fails
    console.log(`[FALLBACK] Using dummy ticker stats for ${symbol}`);
    // Default to BTCUSDT if symbol not found in dummy data
    const data = dummyData[symbol] || dummyData.BTCUSDT;
    return data.tickerStats;
  }
};

/**
 * Get exchange information for a symbol
 * @param {string} symbol - Trading pair symbol (e.g., BTCUSDT)
 * @returns {Promise<Object>} Exchange information
 */
const getExchangeInfo = async (symbol) => {
  try {
    // Use dummy data if flag is set
    if (USE_DUMMY_DATA) {
      console.log(`[DUMMY DATA] Using dummy exchange info for ${symbol}`);
      return { symbols: [{ symbol, status: 'TRADING' }] };
    }
    
    const response = await axios.get(`${BINANCE_API_URL}/api/v3/exchangeInfo`, {
      params: { symbol }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error getting exchange info for ${symbol}:`, error.message);
    
    // Fallback to dummy data if API call fails
    console.log(`[FALLBACK] Using dummy exchange info for ${symbol}`);
    return { symbols: [{ symbol, status: 'TRADING' }] };
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
  calculateTPSL,
  testConnection,
  getHistoricalPrices
}; 