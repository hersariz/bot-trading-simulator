/**
 * Contoh script untuk melakukan simulasi order di Binance Testnet
 * 
 * Cara menggunakan:
 * 1. Pastikan .env sudah berisi API_KEY dan SECRET_KEY untuk Binance Testnet
 * 2. Jalankan dengan: node src/scripts/testnet-order-example.js
 */

require('dotenv').config();
const binanceTestnetService = require('../services/binance-testnet.service');

// Konfigurasi trading
const config = {
  apiKey: process.env.TESTNET_API_KEY || process.env.API_KEY,
  apiSecret: process.env.TESTNET_SECRET_KEY || process.env.SECRET_KEY,
  symbol: 'BTCUSDT', // Pasangan trading
  type: 'spot', // 'spot' atau 'futures'
  leverage: 5, // Hanya untuk futures
};

// Fungsi untuk menampilkan saldo akun
async function checkBalance() {
  try {
    console.log('Memeriksa saldo akun...');
    const balance = await binanceTestnetService.getAccountBalance(
      config.apiKey,
      config.apiSecret,
      config.type
    );
    
    console.log('Saldo Akun:');
    if (config.type === 'futures') {
      console.log('Assets:');
      balance.balances.forEach(asset => {
        if (parseFloat(asset.walletBalance) > 0) {
          console.log(`${asset.asset}: ${asset.walletBalance} (Available: ${asset.availableBalance})`);
        }
      });
    } else {
      console.log('Balances:');
      balance.balances.forEach(asset => {
        if (parseFloat(asset.free) > 0 || parseFloat(asset.locked) > 0) {
          console.log(`${asset.asset}: ${asset.free} (Locked: ${asset.locked})`);
        }
      });
    }
    return balance;
  } catch (error) {
    console.error('Error memeriksa saldo:', error.message);
  }
}

// Fungsi untuk melakukan market order
async function placeSimpleMarketOrder(side, quantity) {
  try {
    console.log(`Menempatkan ${side} market order untuk ${quantity} ${config.symbol}...`);
    
    const orderResult = await binanceTestnetService.placeMarketOrder({
      symbol: config.symbol,
      side: side.toUpperCase(), // 'BUY' atau 'SELL'
      quantity: quantity,
      leverage: config.leverage,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      type: config.type
    });
    
    console.log('Order berhasil:', orderResult);
    console.log(`ID Order: ${orderResult.order.orderId}`);
    console.log(`Status: ${orderResult.order.status}`);
    console.log(`Harga rata-rata: ${orderResult.order.price || orderResult.order.avgPrice}`);
    console.log(`Jumlah dieksekusi: ${orderResult.order.executedQty}`);
    
    return orderResult;
  } catch (error) {
    console.error('Error menempatkan market order:', error.message);
  }
}

// Fungsi untuk melakukan order dengan take profit dan stop loss (hanya futures)
async function placeOrderWithTPSL(side, quantity, entryPrice, takeProfitPrice, stopLossPrice) {
  try {
    if (config.type !== 'futures') {
      throw new Error('TP/SL orders hanya tersedia untuk futures trading');
    }
    
    // Tempatkan market order terlebih dahulu
    console.log(`Menempatkan ${side} market order dengan TP/SL...`);
    const mainOrder = await binanceTestnetService.placeMarketOrder({
      symbol: config.symbol,
      side: side.toUpperCase(),
      quantity: quantity,
      leverage: config.leverage,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      type: 'futures'
    });
    
    console.log('Order utama berhasil:', mainOrder);
    
    // Tempatkan take profit dan stop loss
    const oppositeSide = side.toUpperCase() === 'BUY' ? 'SELL' : 'BUY';
    
    const tpslResult = await binanceTestnetService.placeTakeProfitStopLossOrders({
      symbol: config.symbol,
      side: oppositeSide,
      quantity: quantity,
      takeProfitPrice: takeProfitPrice,
      stopLossPrice: stopLossPrice,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      type: 'futures'
    });
    
    console.log('TP/SL orders berhasil:');
    console.log('Take Profit:', tpslResult.takeProfit);
    console.log('Stop Loss:', tpslResult.stopLoss);
    
    return { mainOrder, tpsl: tpslResult };
  } catch (error) {
    console.error('Error menempatkan order dengan TP/SL:', error.message);
  }
}

// Fungsi untuk memeriksa posisi terbuka (hanya untuk futures)
async function checkPositions() {
  try {
    if (config.type !== 'futures') {
      throw new Error('Positions hanya tersedia untuk futures trading');
    }
    
    console.log('Memeriksa posisi terbuka...');
    const positions = await binanceTestnetService.getPositions(
      config.symbol,
      config.apiKey,
      config.apiSecret
    );
    
    console.log('Posisi saat ini:');
    positions.forEach(pos => {
      if (parseFloat(pos.positionAmt) !== 0) {
        console.log(`${pos.symbol}: ${pos.positionAmt} @ ${pos.entryPrice}`);
        console.log(`PnL: ${pos.unrealizedProfit} (${pos.leverage}x leverage)`);
        console.log(`Margin Type: ${pos.marginType}`);
        console.log(`---`);
      }
    });
    
    return positions;
  } catch (error) {
    console.error('Error memeriksa posisi:', error.message);
  }
}

// Fungsi untuk memeriksa order terbuka
async function checkOpenOrders() {
  try {
    console.log('Memeriksa order terbuka...');
    const orders = await binanceTestnetService.getOpenOrders(
      config.symbol,
      config.apiKey,
      config.apiSecret,
      config.type
    );
    
    console.log(`Order terbuka (${orders.length}):`);
    orders.forEach(order => {
      console.log(`ID: ${order.orderId}, Type: ${order.type}, Side: ${order.side}`);
      console.log(`Price: ${order.price}, Quantity: ${order.origQty}`);
      console.log(`Status: ${order.status}, Time: ${new Date(order.time).toLocaleString()}`);
      console.log(`---`);
    });
    
    return orders;
  } catch (error) {
    console.error('Error memeriksa order terbuka:', error.message);
  }
}

// Fungsi untuk menjalankan contoh simulasi trading
async function runSimulation() {
  try {
    console.log('Memulai simulasi trading di Binance Testnet...');
    console.log(`Mode: ${config.type.toUpperCase()}`);
    console.log(`Symbol: ${config.symbol}`);
    
    // Tes koneksi
    await binanceTestnetService.testConnection(
      config.apiKey,
      config.apiSecret,
      config.type
    );
    
    // Cek saldo
    await checkBalance();
    
    // CONTOH: Uncomment perintah-perintah berikut untuk menjalankan simulasi
    
    // 1. Spot Market Buy - beli 0.001 BTC
    // await placeSimpleMarketOrder('BUY', 0.001);
    
    // 2. Spot Market Sell - jual 0.001 BTC
    // await placeSimpleMarketOrder('SELL', 0.001);
    
    // 3. Futures Market Order dengan TP/SL - beli 0.01 BTC dengan TP +5% dan SL -2%
    // Dapatkan harga pasar saat ini (untuk contoh saja)
    // const currentPrice = 30000; // Anda perlu mendapatkan harga saat ini dari API
    // const takeProfitPrice = (currentPrice * 1.05).toFixed(2); // +5%
    // const stopLossPrice = (currentPrice * 0.98).toFixed(2);  // -2%
    // await placeOrderWithTPSL('BUY', 0.01, currentPrice, takeProfitPrice, stopLossPrice);
    
    // 4. Cek posisi futures (jika ada)
    // if (config.type === 'futures') {
    //   await checkPositions();
    // }
    
    // 5. Cek order terbuka
    // await checkOpenOrders();
    
    console.log('Simulasi selesai.');
  } catch (error) {
    console.error('Error dalam simulasi:', error.message);
  }
}

// Jalankan simulasi
runSimulation(); 