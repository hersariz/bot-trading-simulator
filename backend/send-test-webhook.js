/**
 * Script untuk mengirim test webhook untuk simulasi signal dari TradingView
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Path ke config file
const CONFIG_FILE = path.join(__dirname, 'data', 'config.json');

// Baca token dari .env file atau gunakan default
require('dotenv').config();
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || 'trd_wh_8f2a7b3d9c4e5f6g7h8i9j0k1l2m3n4o5p';

// Default config jika file tidak ada
let config = {
  plusDIThreshold: 30,
  minusDIThreshold: 5,
  adxMinimum: 25
};

// Load konfigurasi
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const configFileContent = fs.readFileSync(CONFIG_FILE, 'utf8');
      const loadedConfig = JSON.parse(configFileContent);
      
      // Merge dengan default config
      config = { ...config, ...loadedConfig };
      
      // Konversi ke angka
      config.plusDIThreshold = parseFloat(config.plusDIThreshold || config.plusDiThreshold);
      config.minusDIThreshold = parseFloat(config.minusDIThreshold || config.minusDiThreshold);
      config.adxMinimum = parseFloat(config.adxMinimum);
      
      console.log('Konfigurasi berhasil dimuat');
    } else {
      console.warn('File konfigurasi tidak ditemukan, menggunakan nilai default');
    }
  } catch (error) {
    console.error('Error membaca file konfigurasi:', error.message);
  }
  
  return config;
}

// Load config
const tradingConfig = loadConfig();

// Helper untuk membuat signal
function createSignal(type) {
  // Dapatkan nama properti threshold yang benar
  const plusDIThresholdValue = tradingConfig.plusDIThreshold || tradingConfig.plusDiThreshold || 30;
  const minusDIThresholdValue = tradingConfig.minusDIThreshold || tradingConfig.minusDiThreshold || 5;
  const adxMinimumValue = parseFloat(tradingConfig.adxMinimum || 25);
  
  if (type === 'BUY') {
    return {
      symbol: "BTCUSDT",
      plusDI: plusDIThresholdValue + 5,  // Lebih tinggi
      minusDI: minusDIThresholdValue - 2, // Lebih rendah
      adx: adxMinimumValue + 5,  // Lebih tinggi
      timeframe: "5m"
    };
  } else {
    return {
      symbol: "BTCUSDT",
      plusDI: minusDIThresholdValue - 1,  // Lebih rendah
      minusDI: plusDIThresholdValue + 5,  // Lebih tinggi
      adx: adxMinimumValue + 5,  // Lebih tinggi
      timeframe: "5m"
    };
  }
}

// Endpoint webhook - menggunakan port dari env atau default 5000
const PORT = process.env.PORT || 5000;
const WEBHOOK_URL = `http://localhost:${PORT}/api/webhook`;

// Kirim signal ke webhook
async function sendSignal(signal) {
  try {
    // Pastikan nilai signal adalah angka
    signal.plusDI = parseFloat(signal.plusDI);
    signal.minusDI = parseFloat(signal.minusDI);
    signal.adx = parseFloat(signal.adx);
    
    console.log('Mengirim signal:', JSON.stringify(signal, null, 2));
    console.log('Tipe data:');
    console.log(`- plusDI: ${typeof signal.plusDI} (${signal.plusDI})`);
    console.log(`- minusDI: ${typeof signal.minusDI} (${signal.minusDI})`);
    console.log(`- adx: ${typeof signal.adx} (${signal.adx})`);
    
    const response = await axios.post(WEBHOOK_URL, signal, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': WEBHOOK_TOKEN
      }
    });
    
    console.log('Respon dari server:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error mengirim signal:', error.response?.data || error.message);
    return null;
  }
}

// CLI interface
function parseArgs() {
  const args = process.argv.slice(2);
  let signalType = 'BUY'; // Default
  
  if (args.includes('--sell') || args.includes('-s')) {
    signalType = 'SELL';
  }
  
  return signalType;
}

// Main function
async function main() {
  const signalType = parseArgs();
  const signal = createSignal(signalType);
  
  console.log(`===== TEST WEBHOOK SIGNAL (${signalType}) =====`);
  try {
    await sendSignal(signal);
    console.log('Signal telah terkirim');
  } catch (err) {
    console.error('Gagal mengirim signal:', err.message);
  }
}

// Jalankan program
main(); 