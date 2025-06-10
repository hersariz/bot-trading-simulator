/**
 * Script untuk menghasilkan order simulasi untuk pengujian
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Path untuk menyimpan order
const ORDER_FILE_PATH = path.join(__dirname, '../../data/orders.json');

// Pastikan direktori data ada
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Buat order simulasi
const createTestOrder = () => {
  const currentPrice = 109000; // Harga BTC yang disimulasikan
  const takeProfitPercent = 2;
  const stopLossPercent = 1;
  const action = 'BUY';
  
  // Hitung take profit dan stop loss
  const tpPrice = action === 'BUY'
    ? currentPrice * (1 + takeProfitPercent / 100)
    : currentPrice * (1 - takeProfitPercent / 100);
    
  const slPrice = action === 'BUY'
    ? currentPrice * (1 - stopLossPercent / 100)
    : currentPrice * (1 + stopLossPercent / 100);
  
  // Order simulasi
  const order = {
    id: crypto.randomUUID(),
    symbol: 'BTCUSDT',
    action: action,
    price_entry: currentPrice,
    tp_price: tpPrice,
    sl_price: slPrice,
    quantity: 0.001,
    leverage: 10,
    timeframe: '5m',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    source: 'BOT'
  };
  
  return order;
};

// Simpan order ke file
const saveOrder = (order) => {
  let orders = [];
  
  // Baca file jika ada
  if (fs.existsSync(ORDER_FILE_PATH)) {
    try {
      const fileContents = fs.readFileSync(ORDER_FILE_PATH, 'utf8');
      orders = JSON.parse(fileContents);
    } catch (error) {
      console.error('Error membaca file orders:', error);
      orders = [];
    }
  }
  
  // Tambahkan order baru
  orders.push(order);
  
  // Simpan kembali ke file
  fs.writeFileSync(ORDER_FILE_PATH, JSON.stringify(orders, null, 2), 'utf8');
  
  return order;
};

// Jalankan script
const order = createTestOrder();
const savedOrder = saveOrder(order);

console.log('Order simulasi berhasil dibuat:', savedOrder);
console.log('Order disimpan di:', ORDER_FILE_PATH); 