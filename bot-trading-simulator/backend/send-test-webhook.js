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

// Load konfigurasi
let config = {
  // Default values
  plusDIThreshold: 30,
  minusDIThreshold: 5,
  adxMinimum: 25
};

try {
  const configFileContent = fs.readFileSync(CONFIG_FILE, 'utf8');
  config = { ...config, ...JSON.parse(configFileContent) };
  console.log('Konfigurasi berhasil dimuat');
} catch (error) {
  console.error('Error membaca file konfigurasi:', error.message);
}

// Contoh sinyal valid - BUY
const buySignal = {
  symbol: "BTCUSDT",
  plusDI: config.plusDIThreshold + 5, // Nilai lebih tinggi dari threshold
  minusDI: config.minusDIThreshold - 2, // Nilai lebih rendah dari threshold
  adx: config.adxMinimum + 3, // Nilai lebih tinggi dari minimum
  timeframe: "5m"
};

// Contoh sinyal valid - SELL
const sellSignal = {
  symbol: "BTCUSDT",
  plusDI: config.minusDIThreshold - 1, // Nilai lebih rendah dari threshold
  minusDI: config.plusDIThreshold + 5, // Nilai lebih tinggi dari threshold
  adx: config.adxMinimum + 3, // Nilai lebih tinggi dari minimum
  timeframe: "5m"
};

// Endpoint webhook - perbaiki URL ke endpoint yang benar
const WEBHOOK_URL = 'http://localhost:3000/api/webhooks';

async function sendSignal(signal) {
  try {
    console.log('Mengirim signal:', JSON.stringify(signal, null, 2));
    
    const response = await axios.post(WEBHOOK_URL, signal, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': WEBHOOK_TOKEN
      }
    });
    
    console.log('Respon dari server:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error mengirim signal:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Pilih sinyal untuk dikirim (bisa ubah ke sellSignal jika ingin tes sinyal SELL)
const signalToSend = buySignal;

// Kirim signal
console.log('===== TEST WEBHOOK SIGNAL =====');
sendSignal(signalToSend)
  .then(() => console.log('Signal telah terkirim'))
  .catch(err => console.error('Error:', err)); 