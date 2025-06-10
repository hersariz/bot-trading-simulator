/**
 * Service for interacting with Binance Testnet API
 */
const axios = require('axios');
const crypto = require('crypto');

// Base URLs for Binance Testnet
const BINANCE_SPOT_TESTNET_URL = 'https://testnet.binance.vision';
const BINANCE_FUTURES_TESTNET_URL = 'https://testnet.binancefuture.com/fapi';

// Endpoint paths
const SPOT_TIME_ENDPOINT = '/api/v3/time';
const SPOT_ACCOUNT_ENDPOINT = '/api/v3/account';
const FUTURES_PING_ENDPOINT = '/v1/ping';
const FUTURES_ACCOUNT_ENDPOINT = '/v1/account';

// Default values
const DEFAULT_RECV_WINDOW = 60000; // 60 seconds
const DEFAULT_TIMEOUT = 10000; // 10 seconds

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
 * Get detailed error message from axios error
 * @param {Error} error - Axios error
 * @returns {string} Detailed error message
 */
const getErrorMessage = (error) => {
  if (error.response) {
    // Respons diterima tapi status code di luar range 2xx
    return `Error ${error.response.status}: ${JSON.stringify(error.response.data || {})}`;
  } else if (error.request) {
    // Request dibuat tapi tidak ada respons
    return 'No response received (possible network issue)';
  } else {
    // Error dalam setup request
    return error.message || 'Unknown error';
  }
};

/**
 * Test connection to Binance Testnet API
 * @param {string} apiKey - API key
 * @param {string} apiSecret - API secret
 * @param {string} type - 'spot' or 'futures'
 * @returns {Promise<Object>} Connection test result
 */
const testConnection = async (apiKey, apiSecret, type = 'futures') => {
  console.log(`Testing connection to Binance ${type.toUpperCase()} Testnet`);
  console.log(`API Key: ${apiKey.substring(0, 10)}...`);
  
  try {
    // Untuk futures, gunakan ping endpoint
    if (type === 'futures') {
      const pingUrl = `${BINANCE_FUTURES_TESTNET_URL}${FUTURES_PING_ENDPOINT}`;
      const response = await axios({
        method: 'GET',
        url: pingUrl,
        headers: { 'X-MBX-APIKEY': apiKey }
      });
      
      // Jika ping berhasil, coba dapatkan server time untuk test signed request
      if (response.status === 200) {
        const timestamp = Date.now();
        const queryString = `timestamp=${timestamp}&recvWindow=${DEFAULT_RECV_WINDOW}`;
        const signature = createSignature(queryString, apiSecret);
        
        // Construct the URL with query parameters instead of using axios params
        const fullUrl = `${BINANCE_FUTURES_TESTNET_URL}${FUTURES_ACCOUNT_ENDPOINT}?${queryString}&signature=${signature}`;
        
        const accountResponse = await axios({
          method: 'GET',
          url: fullUrl,
          headers: { 'X-MBX-APIKEY': apiKey },
          timeout: DEFAULT_TIMEOUT
        });
        
        return {
          success: true,
          type: 'futures',
          data: {
            ping: response.data,
            timestamp: timestamp,
            serverTime: accountResponse.data.updateTime
          }
        };
      }
    } 
    // Untuk spot, gunakan server time endpoint
    else {
      const timeUrl = `${BINANCE_SPOT_TESTNET_URL}${SPOT_TIME_ENDPOINT}`;
      const response = await axios({
        method: 'GET',
        url: timeUrl
      });
      
      const localTime = Date.now();
      const serverTime = response.data.serverTime;
      const diff = Math.abs(localTime - serverTime);
      
      // Jika waktu server sangat berbeda, tampilkan peringatan
      if (diff > 5000) {
        console.warn(`Binance server time: ${serverTime}, Local time: ${localTime}, Difference: ${diff}ms`);
        console.warn(`Warning: Time difference with Binance server is ${diff}ms, might cause issues with signed requests`);
      }
      
      // Test signed request untuk memastikan API key & secret valid
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}&recvWindow=${DEFAULT_RECV_WINDOW}`;
      const signature = createSignature(queryString, apiSecret);
      
      // Construct the URL with query parameters instead of using axios params
      const fullUrl = `${BINANCE_SPOT_TESTNET_URL}${SPOT_ACCOUNT_ENDPOINT}?${queryString}&signature=${signature}`;
      
      const accountResponse = await axios({
        method: 'GET',
        url: fullUrl,
        headers: { 'X-MBX-APIKEY': apiKey },
        timeout: DEFAULT_TIMEOUT
      });
      
      return {
        success: true,
        type: 'spot',
        data: {
          serverTime: serverTime,
          localTime: localTime,
          timeDifference: diff,
          accountData: {
            makerCommission: accountResponse.data.makerCommission,
            takerCommission: accountResponse.data.takerCommission,
            canTrade: accountResponse.data.canTrade
          }
        }
      };
    }
  } catch (error) {
    console.error('Error testing connection to Binance:', error);
    throw new Error(`Failed to connect to Binance Testnet: ${getErrorMessage(error)}`);
  }
};

/**
 * Get account balance from Testnet
 * @param {string} apiKey - Binance API key
 * @param {string} apiSecret - Binance API secret
 * @param {string} type - 'spot' or 'futures'
 * @returns {Promise<Object>} Account balance
 */
const getAccountBalance = async (apiKey, apiSecret, type = 'futures') => {
  try {
    const baseUrl = type === 'spot' ? BINANCE_SPOT_TESTNET_URL : BINANCE_FUTURES_TESTNET_URL;
    const endpoint = type === 'spot' ? SPOT_ACCOUNT_ENDPOINT : FUTURES_ACCOUNT_ENDPOINT;
    
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}&recvWindow=${DEFAULT_RECV_WINDOW}`;
    const signature = createSignature(queryString, apiSecret);
    
    console.log(`Getting account balance from ${baseUrl}${endpoint}`);
    console.log(`Type: ${type}`);
    console.log(`API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`RecvWindow: ${DEFAULT_RECV_WINDOW}`);
    
    // Construct the URL with query parameters instead of using axios params
    const fullUrl = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;
    
    const response = await axios({
      method: 'GET',
      url: fullUrl,
      headers: {
        'X-MBX-APIKEY': apiKey
      },
      timeout: DEFAULT_TIMEOUT
    });
    
    if (type === 'futures') {
      return {
        balances: response.data.assets,
        positions: response.data.positions
      };
    } else {
      return {
        balances: response.data.balances
      };
    }
  } catch (error) {
    console.error('Error getting account balance:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Request URL:', error.config.url);
      throw new Error(`Failed to get account balance (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('Failed to get account balance: No response received');
    } else {
      console.error('Error setting up request:', error.message);
      throw new Error('Failed to get account balance: ' + error.message);
    }
  }
};

/**
 * Place a market order on Binance Testnet
 * @param {Object} params - Order parameters
 * @param {string} params.symbol - Trading pair (e.g., 'BTCUSDT')
 * @param {string} params.side - 'BUY' or 'SELL'
 * @param {number} params.quantity - Order quantity
 * @param {number} params.leverage - Leverage (for futures only)
 * @param {string} params.apiKey - Binance API key
 * @param {string} params.apiSecret - Binance API secret
 * @param {string} params.type - 'spot' or 'futures'
 * @returns {Promise<Object>} Order response
 */
const placeMarketOrder = async ({ symbol, side, quantity, leverage, apiKey, apiSecret, type = 'futures' }) => {
  try {
    console.log(`Placing ${side} market order for ${quantity} of ${symbol}`);
    
    // Jika futures dan leverage ditentukan, atur leverage terlebih dahulu
    if (type === 'futures' && leverage && leverage > 1) {
      await setLeverage({ symbol, leverage, apiKey, apiSecret });
    }
    
    const baseUrl = type === 'spot' ? BINANCE_SPOT_TESTNET_URL : BINANCE_FUTURES_TESTNET_URL;
    const endpoint = type === 'spot' ? '/api/v3/order' : '/v1/order';
    
    const timestamp = Date.now();
    let params = {
      symbol,
      side,
      type: 'MARKET',
      timestamp,
      recvWindow: DEFAULT_RECV_WINDOW
    };
    
    // Spot uses quantity, futures can use quantity
    if (type === 'spot') {
      params.quantity = quantity;
    } else {
      params.quantity = quantity;
    }
    
    // Dibutuhkan "newOrderRespType" hanya untuk spot
    if (type === 'spot') {
      params.newOrderRespType = 'FULL';
    }
    
    // Susun query string untuk signature
    const queryString = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const signature = createSignature(queryString, apiSecret);
    
    // Construct the URL with query parameters instead of using axios params
    const fullUrl = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;
    
    console.log(`Placing order via: ${baseUrl}${endpoint}`);
    console.log(`Type: ${type}`);
    console.log(`Symbol: ${symbol}`);
    console.log(`Side: ${side}`);
    console.log(`Quantity: ${quantity}`);
    
    const response = await axios({
      method: 'POST',
      url: fullUrl,
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: DEFAULT_TIMEOUT
    });
    
    console.log('Order placed successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error placing market order:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Request URL:', error.config.url);
      throw new Error(`Failed to place market order (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('Failed to place market order: No response received');
    } else {
      console.error('Error setting up request:', error.message);
      throw new Error('Failed to place market order: ' + error.message);
    }
  }
};

/**
 * Set leverage for a symbol (futures only)
 * @param {Object} params - Leverage parameters
 * @param {string} params.symbol - Trading pair (e.g., 'BTCUSDT')
 * @param {number} params.leverage - Leverage value (1-125)
 * @param {string} params.apiKey - Binance API key
 * @param {string} params.apiSecret - Binance API secret
 * @returns {Promise<Object>} Leverage response
 */
const setLeverage = async ({ symbol, leverage, apiKey, apiSecret }) => {
  try {
    const timestamp = Date.now();
    const queryString = `symbol=${symbol}&leverage=${leverage}&timestamp=${timestamp}&recvWindow=${DEFAULT_RECV_WINDOW}`;
    const signature = createSignature(queryString, apiSecret);
    
    console.log(`Setting leverage for ${symbol} to ${leverage}x`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`RecvWindow: ${DEFAULT_RECV_WINDOW}`);
    console.log(`API Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'Not provided'}`);
    
    // Construct the URL with query parameters instead of using axios params
    const fullUrl = `${BINANCE_FUTURES_TESTNET_URL}/v1/leverage?${queryString}&signature=${signature}`;
    
    const response = await axios({
      method: 'POST',
      url: fullUrl,
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: DEFAULT_TIMEOUT
    });
    
    console.log('Leverage set successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error setting leverage:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Request URL:', error.config.url);
      throw new Error(`Failed to set leverage (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('Failed to set leverage: No response received');
    } else {
      console.error('Error setting up request:', error.message);
      throw new Error('Failed to set leverage: ' + error.message);
    }
  }
};

/**
 * Place take profit and stop loss orders (futures only)
 * @param {Object} params - Order parameters
 * @param {string} params.symbol - Trading pair (e.g., 'BTCUSDT')
 * @param {string} params.side - 'BUY' or 'SELL'
 * @param {number} params.quantity - Order quantity
 * @param {number} params.takeProfitPrice - Take profit price
 * @param {number} params.stopLossPrice - Stop loss price
 * @param {string} params.apiKey - Binance API key
 * @param {string} params.apiSecret - Binance API secret
 * @param {string} params.type - 'spot' or 'futures'
 * @returns {Promise<Object>} Order responses
 */
const placeTakeProfitStopLossOrders = async ({ 
  symbol, side, quantity, takeProfitPrice, stopLossPrice, apiKey, apiSecret, type = 'futures' 
}) => {
  try {
    console.log(`Placing TP/SL orders for ${symbol}`);
    console.log(`Side: ${side}, Quantity: ${quantity}`);
    console.log(`Take Profit: ${takeProfitPrice}, Stop Loss: ${stopLossPrice}`);
    
    if (type !== 'futures') {
      throw new Error('TP/SL orders are only supported for futures');
    }
    
    const timestamp = Date.now();
    const baseUrl = BINANCE_FUTURES_TESTNET_URL;
    const endpoint = '/v1/order';
    
    // Place take profit order
    const tpQueryString = `symbol=${symbol}&side=${side === 'BUY' ? 'SELL' : 'BUY'}&type=TAKE_PROFIT_MARKET&stopPrice=${takeProfitPrice}&quantity=${quantity}&reduceOnly=true&timestamp=${timestamp}&recvWindow=${DEFAULT_RECV_WINDOW}`;
    const tpSignature = createSignature(tpQueryString, apiSecret);
    
    // Construct the URL with query parameters instead of using axios params
    const tpFullUrl = `${baseUrl}${endpoint}?${tpQueryString}&signature=${tpSignature}`;
    
    console.log(`Placing take profit order at ${takeProfitPrice}`);
    
    const tpResponse = await axios({
      method: 'POST',
      url: tpFullUrl,
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: DEFAULT_TIMEOUT
    });
    
    // Place stop loss order
    const slQueryString = `symbol=${symbol}&side=${side === 'BUY' ? 'SELL' : 'BUY'}&type=STOP_MARKET&stopPrice=${stopLossPrice}&quantity=${quantity}&reduceOnly=true&timestamp=${timestamp}&recvWindow=${DEFAULT_RECV_WINDOW}`;
    const slSignature = createSignature(slQueryString, apiSecret);
    
    // Construct the URL with query parameters instead of using axios params
    const slFullUrl = `${baseUrl}${endpoint}?${slQueryString}&signature=${slSignature}`;
    
    console.log(`Placing stop loss order at ${stopLossPrice}`);
    
    const slResponse = await axios({
      method: 'POST',
      url: slFullUrl,
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: DEFAULT_TIMEOUT
    });
    
    console.log('TP/SL orders placed successfully');
    
    return {
      takeProfitOrder: tpResponse.data,
      stopLossOrder: slResponse.data
    };
  } catch (error) {
    console.error('Error placing TP/SL orders:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Request URL:', error.config.url);
      throw new Error(`Failed to place TP/SL orders (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('Failed to place TP/SL orders: No response received');
    } else {
      console.error('Error setting up request:', error.message);
      throw new Error('Failed to place TP/SL orders: ' + error.message);
    }
  }
};

/**
 * Get open orders for a symbol
 * @param {string} symbol - Trading pair (e.g., 'BTCUSDT')
 * @param {string} apiKey - Binance API key
 * @param {string} apiSecret - Binance API secret
 * @param {string} type - 'spot' or 'futures'
 * @returns {Promise<Array>} List of open orders
 */
const getOpenOrders = async (symbol, apiKey, apiSecret, type = 'futures') => {
  try {
    const baseUrl = type === 'spot' ? BINANCE_SPOT_TESTNET_URL : BINANCE_FUTURES_TESTNET_URL;
    const endpoint = type === 'spot' ? '/api/v3/openOrders' : '/v1/openOrders';
    
    const timestamp = Date.now();
    let queryString = `timestamp=${timestamp}&recvWindow=${DEFAULT_RECV_WINDOW}`;
    
    // Add symbol to queryString if provided
    if (symbol) {
      queryString = `symbol=${symbol}&${queryString}`;
    }
    
    const signature = createSignature(queryString, apiSecret);
    
    console.log(`Getting open orders for ${symbol || 'all symbols'}`);
    console.log(`Using endpoint: ${baseUrl}${endpoint}`);
    console.log(`Type: ${type}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`RecvWindow: ${DEFAULT_RECV_WINDOW}`);
    console.log(`API Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'Not provided'}`);
    
    // Construct the URL with query parameters instead of using axios params
    const fullUrl = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;
    
    const response = await axios({
      method: 'GET',
      url: fullUrl,
      headers: {
        'X-MBX-APIKEY': apiKey
      },
      timeout: DEFAULT_TIMEOUT
    });
    
    console.log(`Retrieved ${response.data.length} orders`);
    return response.data;
  } catch (error) {
    console.error('Error getting open orders:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Request URL:', error.config.url);
      throw new Error(`Failed to get open orders (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('No response received. Request details:');
      console.error('Request URL:', error.config?.url);
      throw new Error('Failed to get open orders: No response received');
    } else {
      console.error('Error setting up request:', error.message);
      throw new Error('Failed to get open orders: ' + error.message);
    }
  }
};

/**
 * Get order history for a symbol
 * @param {string} symbol - Trading pair (e.g., 'BTCUSDT')
 * @param {string} apiKey - Binance API key
 * @param {string} apiSecret - Binance API secret
 * @param {string} type - 'spot' or 'futures'
 * @returns {Promise<Array>} List of orders
 */
const getOrderHistory = async (symbol, apiKey, apiSecret, type = 'futures') => {
  try {
    const baseUrl = type === 'spot' ? BINANCE_SPOT_TESTNET_URL : BINANCE_FUTURES_TESTNET_URL;
    const endpoint = type === 'spot' ? '/api/v3/allOrders' : '/v1/allOrders';
    
    const timestamp = Date.now();
    const queryString = `symbol=${symbol}&timestamp=${timestamp}&recvWindow=${DEFAULT_RECV_WINDOW}`;
    const signature = createSignature(queryString, apiSecret);
    
    console.log(`Getting order history for ${symbol}`);
    console.log(`Using endpoint: ${baseUrl}${endpoint}`);
    console.log(`Type: ${type}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`RecvWindow: ${DEFAULT_RECV_WINDOW}`);
    console.log(`API Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'Not provided'}`);
    
    // Construct the URL with query parameters instead of using axios params
    const fullUrl = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;
    
    const response = await axios({
      method: 'GET',
      url: fullUrl,
      headers: {
        'X-MBX-APIKEY': apiKey
      },
      timeout: DEFAULT_TIMEOUT
    });
    
    console.log(`Retrieved ${response.data.length} orders in history`);
    return response.data;
  } catch (error) {
    console.error('Error getting order history:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Request URL:', error.config.url);
      throw new Error(`Failed to get order history (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('Failed to get order history: No response received');
    } else {
      console.error('Error setting up request:', error.message);
      throw new Error('Failed to get order history: ' + error.message);
    }
  }
};

/**
 * Get positions for a symbol (futures only)
 * @param {string} symbol - Trading pair (e.g., 'BTCUSDT')
 * @param {string} apiKey - Binance API key
 * @param {string} apiSecret - Binance API secret
 * @returns {Promise<Array>} List of positions
 */
const getPositions = async (symbol, apiKey, apiSecret) => {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}&recvWindow=${DEFAULT_RECV_WINDOW}`;
    const signature = createSignature(queryString, apiSecret);
    
    console.log(`Getting positions${symbol ? ` for ${symbol}` : ''}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`RecvWindow: ${DEFAULT_RECV_WINDOW}`);
    
    // Construct the URL with query parameters instead of using axios params
    const fullUrl = `${BINANCE_FUTURES_TESTNET_URL}/v2/positionRisk?${queryString}&signature=${signature}`;
    
    const response = await axios({
      method: 'GET',
      url: fullUrl,
      headers: {
        'X-MBX-APIKEY': apiKey
      },
      timeout: DEFAULT_TIMEOUT
    });
    
    // Filter positions by symbol if provided
    const positions = symbol 
      ? response.data.filter(pos => pos.symbol === symbol) 
      : response.data;
    
    return positions;
  } catch (error) {
    console.error('Error getting positions:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      throw new Error(`Failed to get positions (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('Failed to get positions: No response received');
    } else {
      console.error('Error setting up request:', error.message);
      throw new Error('Failed to get positions: ' + error.message);
    }
  }
};

/**
 * Get order status from Testnet
 * @param {string} symbol - Trading pair symbol
 * @param {string} orderId - Order ID
 * @param {string} apiKey - Binance API key (optional, jika tidak disediakan, akan diambil dari konfigurasi)
 * @param {string} apiSecret - Binance API secret (optional, jika tidak disediakan, akan diambil dari konfigurasi)
 * @param {string} type - 'spot' or 'futures'
 * @returns {Promise<Object>} Order details
 */
const getOrderStatus = async (symbol, orderId, apiKey = null, apiSecret = null, type = 'futures') => {
  try {
    // Use provided API keys or load from config
    const config = await loadConfig();
    const useApiKey = apiKey || config.apiKey;
    const useApiSecret = apiSecret || config.apiSecret;
    
    // Validate API keys
    if (!useApiKey || !useApiSecret) {
      throw new Error('API key and secret are required');
    }
    
    const baseUrl = type === 'spot' 
      ? BINANCE_SPOT_TESTNET_URL 
      : BINANCE_FUTURES_TESTNET_URL;
    
    const endpoint = type === 'spot' 
      ? '/api/v3/order' 
      : '/v1/order';
    
    const timestamp = Date.now();
    const queryString = `symbol=${symbol.toUpperCase()}&orderId=${orderId}&timestamp=${timestamp}&recvWindow=${DEFAULT_RECV_WINDOW}`;
    const signature = createSignature(queryString, useApiSecret);
    
    console.log(`Getting order status for ${symbol} order ${orderId}`);
    
    // Construct the URL with query parameters
    const fullUrl = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;
    
    const response = await axios({
      method: 'GET',
      url: fullUrl,
      headers: {
        'X-MBX-APIKEY': useApiKey
      },
      timeout: DEFAULT_TIMEOUT
    });
    
    if (response.data) {
      console.log(`Order status for ${symbol} ${orderId}: ${response.data.status}`);
      return response.data;
    }
    
    throw new Error('Empty response data');
  } catch (error) {
    console.error(`Error getting order status for ${orderId}:`, getErrorMessage(error));
    if (error.response && error.response.status === 404) {
      console.log(`Order ${orderId} not found, possibly already filled or cancelled`);
      return null;
    }
    throw new Error(`Failed to get order status: ${getErrorMessage(error)}`);
  }
};

/**
 * Get position information for a specific symbol
 * @param {string} symbol - Trading pair symbol
 * @param {string} apiKey - Binance API key (optional, jika tidak disediakan, akan diambil dari konfigurasi)
 * @param {string} apiSecret - Binance API secret (optional, jika tidak disediakan, akan diambil dari konfigurasi)
 * @returns {Promise<Object>} Position details
 */
const getPositionInfo = async (symbol, apiKey = null, apiSecret = null) => {
  try {
    // Use provided API keys or load from config
    const config = await loadConfig();
    const useApiKey = apiKey || config.apiKey;
    const useApiSecret = apiSecret || config.apiSecret;
    
    // Validate API keys
    if (!useApiKey || !useApiSecret) {
      throw new Error('API key and secret are required');
    }
    
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}&recvWindow=${DEFAULT_RECV_WINDOW}`;
    const signature = createSignature(queryString, useApiSecret);
    
    console.log(`Getting position info for ${symbol}`);
    
    // Construct the URL with query parameters
    const fullUrl = `${BINANCE_FUTURES_TESTNET_URL}/v2/positionRisk?${queryString}&signature=${signature}`;
    
    const response = await axios({
      method: 'GET',
      url: fullUrl,
      headers: {
        'X-MBX-APIKEY': useApiKey
      },
      timeout: DEFAULT_TIMEOUT
    });
    
    if (response.data && Array.isArray(response.data)) {
      // Find position for the specific symbol
      const position = response.data.find(pos => 
        pos.symbol.toUpperCase() === symbol.toUpperCase() && 
        parseFloat(pos.positionAmt) !== 0
      );
      
      if (position) {
        console.log(`Found position for ${symbol}: Entry price ${position.entryPrice}, Amount: ${position.positionAmt}`);
        return position;
      } else {
        console.log(`No active position found for ${symbol}`);
        return null;
      }
    }
    
    throw new Error('Invalid response data format');
  } catch (error) {
    console.error(`Error getting position info for ${symbol}:`, getErrorMessage(error));
    throw new Error(`Failed to get position info: ${getErrorMessage(error)}`);
  }
};

module.exports = {
  testConnection,
  getAccountBalance,
  placeMarketOrder,
  setLeverage,
  placeTakeProfitStopLossOrders,
  getOpenOrders,
  getOrderHistory,
  getPositions,
  getOrderStatus,
  getPositionInfo
}; 