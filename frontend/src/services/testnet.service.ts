import api from './api';

interface TestnetOrder {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  leverage?: number;
  takeProfitPercent?: number;
  stopLossPercent?: number;
}

const testnetService = {
  /**
   * Get testnet configuration
   * @returns {Promise<any>} Configuration
   */
  async getConfig() {
    const response = await api.get('/api/testnet/config');
    return response.data;
  },

  /**
   * Update testnet configuration
   * @param {string} apiKey - API key
   * @param {string} apiSecret - API secret
   * @param {'spot' | 'futures'} type - Account type
   * @returns {Promise<any>} Response
   */
  async updateConfig(apiKey: string, apiSecret: string, type: 'spot' | 'futures' = 'futures') {
    const response = await api.post('/api/testnet/config', {
      apiKey,
      apiSecret,
      type
    });
    return response.data;
  },

  /**
   * Test connection to Binance Testnet
   * @returns {Promise<any>} Test result
   */
  async testConnection() {
    const response = await api.get('/api/testnet/test-connection');
    return response.data;
  },

  /**
   * Get account balance
   * @returns {Promise<any>} Account balance
   */
  async getBalance() {
    const response = await api.get('/api/testnet/balance');
    return response.data;
  },

  /**
   * Get positions (futures only)
   * @param {string} symbol - Trading pair
   * @returns {Promise<any>} Positions
   */
  async getPositions(symbol?: string) {
    const params = symbol ? `?symbol=${symbol}` : '';
    const response = await api.get(`/api/testnet/positions${params}`);
    return response.data;
  },

  /**
   * Place market order
   * @param {string} symbol - Trading pair
   * @param {'BUY' | 'SELL'} side - Order side
   * @param {number} quantity - Order quantity
   * @param {number} leverage - Leverage (futures only)
   * @returns {Promise<any>} Order result
   */
  async placeMarketOrder(symbol: string, side: 'BUY' | 'SELL', quantity: number, leverage?: number) {
    const response = await api.post('/api/testnet/order', {
      symbol,
      side,
      quantity,
      leverage
    });
    return response.data;
  },

  /**
   * Place trading signal order
   * @param {TestnetOrder} order - Order details
   * @returns {Promise<any>} Order result
   */
  async placeTradingSignalOrder(order: TestnetOrder) {
    const response = await api.post('/api/testnet/signal-order', order);
    return response.data;
  },

  /**
   * Get open orders
   * @param {string} symbol - Trading pair
   * @returns {Promise<any>} Open orders
   */
  async getOpenOrders(symbol: string) {
    const response = await api.get(`/api/testnet/open-orders?symbol=${symbol}`);
    return response.data;
  },

  /**
   * Get order history
   * @param {string} symbol - Trading pair
   * @returns {Promise<any>} Order history
   */
  async getOrderHistory(symbol: string) {
    const response = await api.get(`/api/testnet/order-history?symbol=${symbol}`);
    return response.data;
  },

  /**
   * Get saved orders
   * @returns {Promise<any>} Saved orders
   */
  async getSavedOrders() {
    const response = await api.get('/api/testnet/saved-orders');
    return response.data;
  }
};

export default testnetService; 