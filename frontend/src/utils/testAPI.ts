import api, { configService, marketService } from '../services/api';

/**
 * Utility untuk menguji koneksi API ke endpoint config
 */
export const testAPIConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Tes koneksi ke API dengan memanggil endpoint config
    const config = await configService.getConfig();
    
    if (config) {
      console.log('API Connection successful:', config);
      return {
        success: true,
        message: 'Connection to API successful'
      };
    } else {
      console.error('API Connection failed: No data returned');
      return {
        success: false,
        message: 'Connection to API failed: No data returned'
      };
    }
  } catch (error) {
    console.error('API Connection error:', error);
    return {
      success: false,
      message: `Connection to API failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Utility untuk menguji koneksi API ke endpoint market data
 */
export const testMarketDataAPI = async (symbol: string = 'BTCUSDT'): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // Tes koneksi ke API dengan memanggil endpoint market data
    const data = await marketService.getCurrentPrice(symbol);
    
    if (data) {
      console.log('Market Data API Connection successful:', data);
      return {
        success: true,
        message: 'Connection to Market Data API successful',
        data
      };
    } else {
      console.error('Market Data API Connection failed: No data returned');
      return {
        success: false,
        message: 'Connection to Market Data API failed: No data returned'
      };
    }
  } catch (error) {
    console.error('Market Data API Connection error:', error);
    return {
      success: false,
      message: `Connection to Market Data API failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Utility untuk menguji koneksi API ke endpoint orders
 */
export const testOrdersAPI = async (): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // Tes koneksi ke API dengan memanggil endpoint orders
    const response = await api.get('/api/orders');
    
    if (response.status === 200) {
      console.log('Orders API Connection successful:', response.data);
      return {
        success: true,
        message: 'Connection to Orders API successful',
        data: response.data
      };
    } else {
      console.error('Orders API Connection failed with status:', response.status);
      return {
        success: false,
        message: `Connection to Orders API failed with status ${response.status}`
      };
    }
  } catch (error) {
    console.error('Orders API Connection error:', error);
    return {
      success: false,
      message: `Connection to Orders API failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}; 