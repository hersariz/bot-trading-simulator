/**
 * Market Simulator Service
 * Service untuk mensimulasikan pergerakan harga market dan memperbarui status order
 */
const marketService = require('./market.service');
const orderModel = require('../models/order.model');

// Interval untuk update (dalam ms)
const UPDATE_INTERVAL = 60000; // 1 menit

// Price movement simulation settings
const VOLATILITY = 0.002; // 0.2% volatility per update
const MAX_PRICE_MOVE = 0.005; // 0.5% max price move

let isRunning = false;
let intervalId = null;

/**
 * Menghasilkan perubahan harga acak berdasarkan volatilitas
 * @param {number} basePrice - Harga dasar
 * @returns {number} - Harga baru setelah perubahan acak
 */
const generateRandomPriceChange = (basePrice) => {
  // Random number between -VOLATILITY and +VOLATILITY
  const changePercent = (Math.random() * 2 - 1) * VOLATILITY;
  
  // Limit the change to MAX_PRICE_MOVE
  const clampedChange = Math.max(Math.min(changePercent, MAX_PRICE_MOVE), -MAX_PRICE_MOVE);
  
  // Apply the change to the base price
  return basePrice * (1 + clampedChange);
};

/**
 * Memperbarui status semua order berdasarkan harga terkini
 */
const updateAllOrders = async () => {
  try {
    // Get all OPEN orders
    const openOrders = orderModel.findOrdersByStatus('OPEN');
    
    // Group orders by symbol to minimize API calls
    const symbolsMap = new Map();
    
    openOrders.forEach(order => {
      if (!symbolsMap.has(order.symbol)) {
        symbolsMap.set(order.symbol, []);
      }
      symbolsMap.get(order.symbol).push(order);
    });
    
    // Update orders for each symbol
    for (const [symbol, orders] of symbolsMap.entries()) {
      try {
        // Get current price for the symbol
        const currentPrice = await marketService.getCurrentPrice(symbol);
        
        // Apply some random variation to simulate market movement
        const simulatedPrice = generateRandomPriceChange(currentPrice);
        
        console.log(`[Market Simulator] Symbol: ${symbol}, Real Price: ${currentPrice}, Simulated: ${simulatedPrice}`);
        
        // Update each order for this symbol
        for (const order of orders) {
          try {
            orderModel.calculateOrderProfit(order.id, simulatedPrice);
          } catch (orderError) {
            console.error(`Error updating order ${order.id}:`, orderError.message);
          }
        }
      } catch (symbolError) {
        console.error(`Error getting price for symbol ${symbol}:`, symbolError.message);
      }
    }
    
    console.log(`[Market Simulator] Updated ${openOrders.length} orders`);
  } catch (error) {
    console.error('Error updating orders:', error.message);
  }
};

/**
 * Start the market simulator service
 * @returns {boolean} - True if started successfully
 */
const startSimulator = () => {
  if (isRunning) {
    console.log('[Market Simulator] Already running');
    return false;
  }
  
  console.log('[Market Simulator] Starting...');
  
  // Run initial update
  updateAllOrders();
  
  // Set up interval for regular updates
  intervalId = setInterval(updateAllOrders, UPDATE_INTERVAL);
  isRunning = true;
  
  console.log(`[Market Simulator] Started with update interval: ${UPDATE_INTERVAL}ms`);
  return true;
};

/**
 * Stop the market simulator service
 * @returns {boolean} - True if stopped successfully
 */
const stopSimulator = () => {
  if (!isRunning) {
    console.log('[Market Simulator] Not running');
    return false;
  }
  
  clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  
  console.log('[Market Simulator] Stopped');
  return true;
};

/**
 * Check if simulator is running
 * @returns {boolean} - True if running
 */
const isSimulatorRunning = () => {
  return isRunning;
};

/**
 * Manually trigger an update of all orders
 * @returns {Promise<number>} - Number of orders updated
 */
const forceUpdate = async () => {
  await updateAllOrders();
  return orderModel.findOrdersByStatus('OPEN').length;
};

module.exports = {
  startSimulator,
  stopSimulator,
  isSimulatorRunning,
  forceUpdate
}; 