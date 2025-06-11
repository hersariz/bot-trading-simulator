import axios from 'axios';
import { MarketDataType, OrderType, PositionType, ConfigType } from '../types';

// Define API URL untuk produksi dan development
const isLocalhost = window.location.hostname === 'localhost';
const vercelUrl = 'https://bot-trading-simulator-6fic.vercel.app';
const API_URL = process.env.REACT_APP_API_URL || 
  (isLocalhost ? 'http://localhost:5000' : vercelUrl);

console.log('Using API URL:', API_URL); // Debug log

// Create axios instance with baseURL that correctly handles API paths
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 20000, // 20 second timeout
  withCredentials: false
});

// Add request interceptor untuk menambahkan timestamp (mencegah cache) dan memperbaiki URL
api.interceptors.request.use(
  config => {
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now() // tambahkan timestamp untuk mencegah caching
      };
    }
    
    // Pastikan URL benar untuk produksi dan testing
    if (!isLocalhost && !config.url?.startsWith('http')) {
      // Log untuk debugging
      console.log(`[API URL Correction] Using ${API_URL} for ${config.url}`);
      
      // Pastikan selalu ada baseURL
      if (!config.baseURL) {
        config.baseURL = API_URL;
      }
    }
    
    // Koreksi otomatis path market-data yang berubah jadi market
    if (config.url?.includes('/api/market-data')) {
      config.url = config.url.replace('/api/market-data', '/api/market');
      console.log(`[API URL Correction] Fixed market data URL: ${config.url}`);
    }
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  error => {
    console.error('API Error:', error);
    
    // Cek jika error adalah timeout
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout. Server might be down or unreachable.');
    }
    
    // Cek jika error adalah network error
    if (!error.response) {
      console.error('Network Error Details:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      });
    }
    
    return Promise.reject(error);
  }
);

// Utility function untuk debug request sebelum kirim
const debugRequest = (url: string, method: string, data?: any) => {
  console.log(`[Debug] ${method} ${url}`, data ? { data } : '');
};

// Export config service
export const configService = {
  getConfig: async (): Promise<ConfigType> => {
    try {
      debugRequest('/api/config', 'GET');
      const response = await api.get('/api/config');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch config:', error);
      // Return default config as fallback
      return {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        quantity: 0.001,
        leverage: 10,
        stopLossPercent: 1,
        takeProfitPercent: 2,
        adxMinimum: 20,
        plusDiThreshold: 25,
        minusDiThreshold: 20,
        trailingStop: false,
        trailingStopPercent: 0.5,
        marketDataSource: 'binance'
      };
    }
  },
  
  updateConfig: async (config: Partial<ConfigType>, createOrderNow: boolean = false): Promise<any> => {
    try {
      debugRequest(`/api/config?createOrderNow=${createOrderNow}`, 'POST', config);
      const response = await api.post(`/api/config?createOrderNow=${createOrderNow}`, config);
      return response.data;
    } catch (error) {
      console.error('Error updating config:', error);
      throw error;
    }
  }
};

// Export webhook service
export const webhookService = {
  getWebhookUrl: async (): Promise<{ url: string; token: string }> => {
    debugRequest('/api/webhook/info', 'GET');
    const response = await api.get('/api/webhook/info');
    return response.data;
  }
};

// Export market data service
export const marketService = {
  getMarketData: async (symbol: string): Promise<MarketDataType> => {
    debugRequest(`/api/market/data?symbol=${symbol}`, 'GET');
    const response = await api.get(`/api/market/data?symbol=${symbol}`);
    return response.data;
  },
  
  getCurrentPrice: async (symbol: string): Promise<{ symbol: string; price: number; source: string }> => {
    debugRequest(`/api/market/price/${symbol}`, 'GET');
    const response = await api.get(`/api/market/price/${symbol}`);
    return response.data;
  },
  
  getHistoricalPrices: async (
    symbol: string, 
    interval: string, 
    limit?: number
  ): Promise<{ symbol: string; interval: string; candles: any[]; source: string }> => {
    const params = { symbol, interval, limit };
    debugRequest('/api/market/historical', 'GET', params);
    const response = await api.get(`/api/market/historical`, { params });
    return response.data;
  },
  
  getApiKeyStatus: async (): Promise<{ 
    apiKey: string; 
    apiSecret: string; 
    isValid: boolean;
    useDummyData: boolean;
    createdAt: string | null;
  }> => {
    debugRequest('/api/market/api-key', 'GET');
    const response = await api.get('/api/market/api-key');
    return response.data;
  },
  
  generateApiKey: async (): Promise<{
    apiKey: string;
    apiSecret: string;
    isValid: boolean;
    useDummyData: boolean;
    createdAt: string;
  }> => {
    debugRequest('/api/market/generate-api-key', 'POST');
    const response = await api.post('/api/market/generate-api-key');
    return response.data;
  },
  
  deleteApiKey: async (): Promise<{ message: string }> => {
    debugRequest('/api/market/api-key', 'DELETE');
    const response = await api.delete('/api/market/api-key');
    return response.data;
  },
  
  toggleDummyData: async (useDummyData: boolean): Promise<{ 
    message: string; 
    useDummyData: boolean 
  }> => {
    debugRequest('/api/market/toggle-dummy-data', 'POST', { useDummyData });
    const response = await api.post('/api/market/toggle-dummy-data', { useDummyData });
    return response.data;
  },
  
  testConnection: async (source: string = 'binance'): Promise<{ 
    success: boolean; 
    source: string; 
    message: string;
    useDummyData: boolean;
  }> => {
    debugRequest('/api/market/test-source', 'GET', { source });
    const response = await api.get('/api/market/test-source', {
      params: { source }
    });
    return response.data;
  }
};

// Export orders service
export const ordersService = {
  getOrders: async (): Promise<OrderType[]> => {
    try {
      debugRequest('/api/orders', 'GET');
      const response = await api.get('/api/orders');
      
      // Validasi format respons
      if (!response.data) {
        console.error('Empty response data');
        return [];
      }
      
      // Periksa jika respons adalah string (HTML)
      if (typeof response.data === 'string') {
        console.error('Invalid orders response format:', 
          response.data.substring(0, 100) + '...'
        );
        return [];
      }
      
      // Format baru: response.data.orders (objek dengan success flag)
      if (response.data.success && Array.isArray(response.data.orders)) {
        console.log('Using new response format with success flag');
        return response.data.orders;
      }
      
      // Format lama: response.data (array langsung)
      if (Array.isArray(response.data)) {
        console.log('Using legacy direct array response format');
        return response.data;
      }
      
      // Format tidak dikenal
      console.error('Unknown response format:', typeof response.data, JSON.stringify(response.data).substring(0, 100) + '...');
      return [];
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      return [];
    }
  },
  
  createOrder: async (order: Partial<OrderType>): Promise<OrderType> => {
    debugRequest('/api/orders', 'POST', order);
    const response = await api.post('/api/orders', order);
    return response.data;
  },
  
  updateOrder: async (id: string, order: Partial<OrderType>): Promise<OrderType> => {
    debugRequest(`/api/orders/${id}`, 'PUT', order);
    const response = await api.put(`/api/orders/${id}`, order);
    return response.data;
  },
  
  deleteOrder: async (id: string): Promise<{ message: string }> => {
    debugRequest(`/api/orders/${id}`, 'DELETE');
    const response = await api.delete(`/api/orders/${id}`);
    return response.data;
  }
};

// Export positions service
export const positionsService = {
  getPositions: async (): Promise<PositionType[]> => {
    try {
      debugRequest('/api/positions', 'GET');
      const response = await api.get('/api/positions');
      
      // Validasi format respons
      if (!response.data) {
        return [];
      }
      
      // Periksa jika respons adalah string (HTML)
      if (typeof response.data === 'string') {
        console.error('Invalid positions response format:', 
          response.data.substring(0, 100) + '...'
        );
        return [];
      }
      
      // Format baru: response.data.positions (objek dengan success flag)
      if (response.data.success && Array.isArray(response.data.positions)) {
        return response.data.positions;
      }
      
      // Format lama: langsung array (untuk kompatibilitas dengan versi lama)
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      console.error('Invalid positions response format:', 
        JSON.stringify(response.data).substring(0, 100) + '...'
      );
      return [];
    } catch (error) {
      console.error('Error fetching positions:', error);
      return []; // Return empty array instead of throwing
    }
  },
  
  createPosition: async (position: Partial<PositionType>): Promise<PositionType> => {
    debugRequest('/api/positions', 'POST', position);
    const response = await api.post('/api/positions', position);
    return response.data;
  },
  
  updatePosition: async (id: string, position: Partial<PositionType>): Promise<PositionType> => {
    debugRequest(`/api/positions/${id}`, 'PUT', position);
    const response = await api.put(`/api/positions/${id}`, position);
    return response.data;
  },
  
  closePosition: async (id: string): Promise<PositionType> => {
    debugRequest(`/api/positions/${id}/close`, 'POST');
    const response = await api.post(`/api/positions/${id}/close`);
    return response.data;
  }
};

// Add testnet service
export const testnetService = {
  getConfig: async () => {
    try {
      debugRequest('/api/testnet/config', 'GET');
      const response = await api.get('/api/testnet/config');
      return response.data;
    } catch (error) {
      console.error('Error fetching testnet config:', error);
      throw error;
    }
  },
  
  updateConfig: async (config: any) => {
    try {
      debugRequest('/api/testnet/config', 'POST', config);
      
      // Gunakan API instance yang dibuat di atas
      const response = await api.post('/api/testnet/config', config);
      return response.data;
    } catch (error) {
      console.error('Error updating testnet config:', error);
      throw error;
    }
  },
  
  testConnection: async () => {
    try {
      debugRequest('/api/testnet/test-connection', 'GET');
      const response = await api.get('/api/testnet/test-connection');
      return response.data;
    } catch (error) {
      console.error('Error testing testnet connection:', error);
      throw error;
    }
  },
  
  getBalance: async () => {
    try {
      debugRequest('/api/testnet/balance', 'GET');
      const response = await api.get('/api/testnet/balance');
      return response.data;
    } catch (error) {
      console.error('Error fetching testnet balance:', error);
      throw error;
    }
  }
};

export default api; 