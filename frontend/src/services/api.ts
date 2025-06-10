import axios from 'axios';
import { MarketDataType, OrderType, PositionType, ConfigType } from '../types';

// Define API URL
const API_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : '');
console.log('Using API URL:', API_URL); // Debug log

// Create axios instance with baseURL that correctly handles API paths
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000 // 15 second timeout
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
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

// Export config service
export const configService = {
  getConfig: async (): Promise<ConfigType> => {
    try {
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
    const response = await api.post(`/api/config?createOrderNow=${createOrderNow}`, config);
    return response.data;
  }
};

// Export webhook service
export const webhookService = {
  getWebhookUrl: async (): Promise<{ url: string; token: string }> => {
    const response = await api.get('/api/webhook/info');
    return response.data;
  }
};

// Export market data service
export const marketService = {
  getMarketData: async (symbol: string): Promise<MarketDataType> => {
    const response = await api.get(`/api/market/data?symbol=${symbol}`);
    return response.data;
  },
  
  getCurrentPrice: async (symbol: string): Promise<{ symbol: string; price: number; source: string }> => {
    const response = await api.get(`/api/market/price/${symbol}`);
    return response.data;
  },
  
  getHistoricalPrices: async (
    symbol: string, 
    interval: string, 
    limit?: number
  ): Promise<{ symbol: string; interval: string; candles: any[]; source: string }> => {
    const response = await api.get(`/api/market/historical`, {
      params: { symbol, interval, limit }
    });
    return response.data;
  },
  
  getApiKeyStatus: async (): Promise<{ 
    apiKey: string; 
    apiSecret: string; 
    isValid: boolean;
    useDummyData: boolean;
    createdAt: string | null;
  }> => {
    console.log('Fetching API key status from:', `${API_URL}/api/market/api-key`); // Debug log
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
    const response = await api.post('/api/market/generate-api-key');
    return response.data;
  },
  
  deleteApiKey: async (): Promise<{ message: string }> => {
    const response = await api.delete('/api/market/api-key');
    return response.data;
  },
  
  toggleDummyData: async (useDummyData: boolean): Promise<{ 
    message: string; 
    useDummyData: boolean 
  }> => {
    const response = await api.post('/api/market/toggle-dummy-data', { useDummyData });
    return response.data;
  },
  
  testConnection: async (source: string = 'binance'): Promise<{ 
    success: boolean; 
    source: string; 
    message: string;
    useDummyData: boolean;
  }> => {
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
      const response = await api.get('/api/orders');
      if (!response.data || typeof response.data === 'string') {
        console.error('Invalid orders response format:', response.data);
        throw new Error('Invalid order data received: ' + (typeof response.data === 'string' ? response.data.substring(0, 100) + '...' : JSON.stringify(response.data)));
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },
  
  createOrder: async (order: Partial<OrderType>): Promise<OrderType> => {
    const response = await api.post('/api/orders', order);
    return response.data;
  },
  
  updateOrder: async (id: string, order: Partial<OrderType>): Promise<OrderType> => {
    const response = await api.put(`/api/orders/${id}`, order);
    return response.data;
  },
  
  deleteOrder: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/orders/${id}`);
    return response.data;
  }
};

// Export positions service
export const positionsService = {
  getPositions: async (): Promise<PositionType[]> => {
    const response = await api.get('/api/positions');
    return response.data;
  },
  
  createPosition: async (position: Partial<PositionType>): Promise<PositionType> => {
    const response = await api.post('/api/positions', position);
    return response.data;
  },
  
  updatePosition: async (id: string, position: Partial<PositionType>): Promise<PositionType> => {
    const response = await api.put(`/api/positions/${id}`, position);
    return response.data;
  },
  
  closePosition: async (id: string): Promise<PositionType> => {
    const response = await api.post(`/api/positions/${id}/close`);
    return response.data;
  }
};

export default api; 