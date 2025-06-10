const fs = require('fs');
const path = require('path');
const { Spot } = require('@binance/connector');
const { FuturesClient } = require('binance');

// Path untuk menyimpan konfigurasi testnet
const configPath = path.join(__dirname, '../data/testnet-config.json');

// Fungsi untuk memastikan folder data ada
const ensureDataDir = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Fungsi untuk membaca konfigurasi testnet
const readConfig = () => {
  ensureDataDir();
  if (!fs.existsSync(configPath)) {
    // Jika file config belum ada, buat file kosong
    const defaultConfig = {
      apiKey: '',
      apiSecret: '',
      type: 'futures',
      isConfigured: false
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }

  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error reading testnet config:', error);
    return {
      apiKey: '',
      apiSecret: '',
      type: 'futures',
      isConfigured: false
    };
  }
};

// Fungsi untuk menyimpan konfigurasi testnet
const writeConfig = (config) => {
  ensureDataDir();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
};

// Fungsi untuk membuat client Binance berdasarkan konfigurasi
const createClient = (config) => {
  if (!config.apiKey || !config.apiSecret) {
    throw new Error('API key and secret are required');
  }

  if (config.type === 'futures') {
    return new FuturesClient({
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      testnet: true
    });
  } else {
    return new Spot(config.apiKey, config.apiSecret, {
      baseURL: 'https://testnet.binance.vision'
    });
  }
};

// Controller untuk mendapatkan konfigurasi testnet
exports.getConfig = (req, res) => {
  try {
    const config = readConfig();
    // Menghapus sebagian karakter API secret untuk keamanan
    if (config.apiSecret) {
      config.apiSecret = config.apiSecret.substring(0, 4) + '****' + config.apiSecret.substring(config.apiSecret.length - 4);
    }
    res.json(config);
  } catch (error) {
    console.error('Error getting testnet config:', error);
    res.status(500).json({
      success: false,
      error: `Failed to get testnet config: ${error.message}`
    });
  }
};

// Controller untuk memperbarui konfigurasi testnet
exports.updateConfig = (req, res) => {
  try {
    const { apiKey, apiSecret, type } = req.body;

    if (!apiKey || !apiSecret) {
      return res.status(400).json({
        success: false,
        error: 'API key and secret are required'
      });
    }

    const config = {
      apiKey,
      apiSecret,
      type: type || 'futures',
      isConfigured: true
    };

    writeConfig(config);
    
    // Menghapus sebagian karakter API secret untuk keamanan dalam respons
    const safeConfig = { ...config };
    safeConfig.apiSecret = safeConfig.apiSecret.substring(0, 4) + '****' + safeConfig.apiSecret.substring(safeConfig.apiSecret.length - 4);
    
    res.json({
      success: true,
      message: 'Testnet configuration updated successfully',
      config: safeConfig
    });
  } catch (error) {
    console.error('Error updating testnet config:', error);
    res.status(500).json({
      success: false,
      error: `Failed to update testnet config: ${error.message}`
    });
  }
};

// Controller untuk menguji koneksi ke Binance testnet
exports.testConnection = async (req, res) => {
  try {
    const config = readConfig();
    
    if (!config.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Testnet is not configured'
      });
    }
    
    const client = createClient(config);
    
    // Cek koneksi berdasarkan tipe akun
    if (config.type === 'futures') {
      const result = await client.accountInfo();
      res.json({
        success: true,
        message: 'Successfully connected to Binance Futures Testnet',
        data: {
          type: 'futures',
          timestamp: new Date().toISOString()
        }
      });
    } else {
      const result = await client.accountStatus();
      res.json({
        success: true,
        message: 'Successfully connected to Binance Spot Testnet',
        data: {
          type: 'spot',
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error testing testnet connection:', error);
    res.status(500).json({
      success: false,
      message: `Failed to connect to Binance Testnet: ${error.message}`
    });
  }
};

// Controller untuk mendapatkan saldo akun dari testnet
exports.getBalance = async (req, res) => {
  try {
    const config = readConfig();
    
    if (!config.isConfigured) {
      return res.status(400).json({
        success: false,
        error: 'Testnet is not configured'
      });
    }
    
    const client = createClient(config);
    
    // Dapatkan saldo berdasarkan tipe akun
    if (config.type === 'futures') {
      const result = await client.accountInfo();
      res.json({
        success: true,
        message: 'Successfully retrieved futures account balance',
        data: {
          type: 'futures',
          balances: result.assets,
          positions: result.positions
        }
      });
    } else {
      const result = await client.accountInfo();
      res.json({
        success: true,
        message: 'Successfully retrieved spot account balance',
        data: {
          type: 'spot',
          balances: result.data.balances
        }
      });
    }
  } catch (error) {
    console.error('Error getting testnet balance:', error);
    res.status(500).json({
      success: false,
      error: `Failed to get account balance: ${error.message}`
    });
  }
};

// Controller untuk menguji sinyal trading secara manual
exports.manualTestSignal = async (req, res) => {
  try {
    // Implementasi pengujian sinyal trading secara manual
    res.json({
      success: true,
      message: 'Manual test signal processed successfully'
    });
  } catch (error) {
    console.error('Error processing manual test signal:', error);
    res.status(500).json({
      success: false,
      error: `Failed to process manual test signal: ${error.message}`
    });
  }
}; 