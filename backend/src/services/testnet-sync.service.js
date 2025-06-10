/**
 * Testnet Sync Service
 * Service untuk sinkronisasi status order dengan Binance Testnet
 */
const binanceTestnetService = require('./binance-testnet.service');
const orderModel = require('../models/order.model');

// Interval untuk sinkronisasi (dalam ms)
const SYNC_INTERVAL = 30000; // 30 detik

let isRunning = false;
let intervalId = null;

/**
 * Memetakan status order dari Binance ke format lokal
 * @param {string} binanceStatus - Status dari Binance API
 * @returns {string} - Status dalam format lokal
 */
const mapBinanceStatus = (binanceStatus) => {
  const statusMap = {
    'NEW': 'OPEN',
    'FILLED': 'FILLED',
    'PARTIALLY_FILLED': 'OPEN',
    'CANCELED': 'CANCELLED',
    'REJECTED': 'CANCELLED',
    'EXPIRED': 'CANCELLED',
    'TRADE_CLOSED': 'CLOSED'
  };

  return statusMap[binanceStatus] || 'OPEN';
};

/**
 * Sinkronisasi satu order dengan testnet
 * @param {Object} order - Order lokal
 * @returns {Object|null} - Order yang diperbarui atau null jika gagal
 */
const syncOrderWithTestnet = async (order) => {
  try {
    // Jika tidak ada testnet_order_id, tidak bisa disinkronkan
    if (!order.testnet_order_id) {
      console.log(`Order ${order.id} tidak memiliki testnet_order_id, melewati sinkronisasi`);
      return null;
    }

    // Ambil detail order dari testnet
    const testnetOrderDetails = await binanceTestnetService.getOrderStatus(
      order.symbol,
      order.testnet_order_id
    );

    if (!testnetOrderDetails) {
      console.log(`Tidak dapat mendapatkan detail order ${order.testnet_order_id} dari testnet`);
      return null;
    }

    // Ambil posisi dari testnet jika order sudah FILLED
    let positionDetails = null;
    if (testnetOrderDetails.status === 'FILLED') {
      try {
        positionDetails = await binanceTestnetService.getPositionInfo(order.symbol);
      } catch (error) {
        console.error(`Error mendapatkan posisi untuk ${order.symbol}:`, error.message);
      }
    }

    // Hitung profit jika ada data posisi
    let profit = null;
    let profitPercent = null;
    let closeTime = null;
    let closePrice = null;
    
    if (positionDetails) {
      const entryPrice = parseFloat(positionDetails.entryPrice);
      const markPrice = parseFloat(positionDetails.markPrice);
      const positionAmt = parseFloat(positionDetails.positionAmt);
      
      // Profit absolut
      profit = positionDetails.unRealizedProfit 
        ? parseFloat(positionDetails.unRealizedProfit)
        : null;

      // Profit percentage
      if (profit !== null && entryPrice > 0) {
        // Persentase profit berbasis ROE (Return on Equity)
        profitPercent = (profit / (entryPrice * Math.abs(positionAmt) / parseFloat(order.leverage))) * 100;
      }

      if (testnetOrderDetails.status === 'FILLED' && testnetOrderDetails.updateTime) {
        closeTime = new Date(testnetOrderDetails.updateTime).toISOString();
        closePrice = testnetOrderDetails.price ? parseFloat(testnetOrderDetails.price) : markPrice;
      }
    }

    // Perbarui order lokal
    const localStatus = mapBinanceStatus(testnetOrderDetails.status);
    
    const additionalData = {
      testnet_status: testnetOrderDetails.status,
      testnet_updated_at: new Date().toISOString()
    };

    // Tambahkan data tambahan jika tersedia
    if (profit !== null) additionalData.profit = profit;
    if (profitPercent !== null) additionalData.profitPercent = profitPercent;
    if (closeTime) additionalData.closeTime = closeTime;
    if (closePrice) additionalData.closePrice = closePrice;
    
    // Perbarui order lokal
    const updatedOrder = orderModel.updateOrderStatus(order.id, localStatus, additionalData);
    
    console.log(`Order ${order.id} disinkronisasi dengan testnet_order_id ${order.testnet_order_id}, status: ${localStatus}`);
    
    return updatedOrder;
  } catch (error) {
    console.error(`Error sinkronisasi order ${order.id} dengan testnet:`, error.message);
    return null;
  }
};

/**
 * Sinkronisasi semua order dengan testnet
 * @returns {Promise<number>} - Jumlah order yang berhasil disinkronisasi
 */
const syncAllOrders = async () => {
  try {
    // Ambil semua order yang memiliki testnet_order_id
    const allOrders = orderModel.getAllOrders();
    
    // Filter order dengan testnet_order_id dan belum closed
    const testnetOrders = allOrders.filter(order => 
      order.testnet_order_id && 
      order.status !== 'CLOSED' && 
      order.status !== 'CANCELLED'
    );
    
    console.log(`Ditemukan ${testnetOrders.length} order untuk disinkronisasi dengan testnet`);
    
    // Sinkronisasi setiap order
    const syncPromises = testnetOrders.map(syncOrderWithTestnet);
    
    // Tunggu semua sinkronisasi selesai
    const results = await Promise.allSettled(syncPromises);
    
    // Hitung yang berhasil
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value !== null
    ).length;
    
    console.log(`Berhasil menyinkronisasi ${successCount} dari ${testnetOrders.length} order`);
    
    return successCount;
  } catch (error) {
    console.error('Error sinkronisasi testnet:', error.message);
    return 0;
  }
};

/**
 * Mulai sinkronisasi otomatis dengan testnet
 * @returns {boolean} - true jika berhasil dimulai
 */
const startSyncService = () => {
  if (isRunning) {
    console.log('Testnet sync service sudah berjalan');
    return false;
  }
  
  console.log('Memulai testnet sync service...');
  
  // Jalankan sinkronisasi pertama
  syncAllOrders();
  
  // Set interval untuk sinkronisasi berkala
  intervalId = setInterval(syncAllOrders, SYNC_INTERVAL);
  isRunning = true;
  
  console.log(`Testnet sync service dimulai dengan interval ${SYNC_INTERVAL}ms`);
  return true;
};

/**
 * Hentikan sinkronisasi otomatis
 * @returns {boolean} - true jika berhasil dihentikan
 */
const stopSyncService = () => {
  if (!isRunning) {
    console.log('Testnet sync service tidak berjalan');
    return false;
  }
  
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  
  console.log('Testnet sync service dihentikan');
  return true;
};

/**
 * Cek status sinkronisasi
 * @returns {boolean} - true jika sedang berjalan
 */
const isSyncRunning = () => {
  return isRunning;
};

/**
 * Paksa sinkronisasi satu kali
 * @returns {Promise<number>} - Jumlah order yang berhasil disinkronisasi
 */
const forceSyncOnce = async () => {
  console.log('Memaksa sinkronisasi testnet...');
  return await syncAllOrders();
};

module.exports = {
  syncOrderWithTestnet,
  syncAllOrders,
  startSyncService,
  stopSyncService,
  isSyncRunning,
  forceSyncOnce
}; 