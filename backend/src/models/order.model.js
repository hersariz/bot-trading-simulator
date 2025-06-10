/**
 * Order model for storing and retrieving order data
 */
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Path to store orders
const ORDERS_DIR = path.join(__dirname, '../../data/orders');

// Ensure orders directory exists
if (!fs.existsSync(ORDERS_DIR)) {
  fs.mkdirSync(ORDERS_DIR, { recursive: true });
}

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @returns {Object} Created order with ID
 */
const createOrder = (orderData) => {
  try {
    const orderId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Standardize order format for frontend compatibility
    const standardizedData = standardizeOrderFormat(orderData);
    
    const order = {
      id: orderId,
      ...standardizedData,
      timestamp,
      status: 'OPEN',
      profit: null,
      profitPercent: null,
      closeTime: null
    };
    
    const filePath = path.join(ORDERS_DIR, `${orderId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(order, null, 2));
    
    return order;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order');
  }
};

/**
 * Standardize order format to ensure frontend compatibility
 * @param {Object} orderData - Raw order data
 * @returns {Object} Standardized order data
 */
const standardizeOrderFormat = (orderData) => {
  const standardized = { ...orderData };
  
  // Convert 'action' to 'side' if needed
  if (standardized.action && !standardized.side) {
    standardized.side = standardized.action;
  }
  
  // Convert 'price_entry' to 'price' if needed
  if (standardized.price_entry !== undefined && standardized.price === undefined) {
    standardized.price = standardized.price_entry;
  }
  
  // Set timestamp as entryTime if needed
  if (!standardized.entryTime) {
    standardized.entryTime = new Date().toISOString();
  }
  
  // Ensure quantity is set
  if (!standardized.quantity && standardized.quantity !== 0) {
    // Try to get quantity from config if not provided
    try {
      const configModel = require('./config.model');
      const config = configModel.getConfig();
      standardized.quantity = parseFloat(config.quantity) || 0.001;
    } catch (e) {
      standardized.quantity = 0.001; // Default fallback
    }
  }
  
  // Ensure type is set
  if (!standardized.type) {
    standardized.type = 'MARKET';
  }
  
  // Ensure profit and profitPercent are numbers or null
  if (standardized.profit !== undefined) {
    standardized.profit = standardized.profit === null ? null : parseFloat(standardized.profit);
  }
  
  if (standardized.profitPercent !== undefined) {
    standardized.profitPercent = standardized.profitPercent === null ? null : parseFloat(standardized.profitPercent);
  }
  
  return standardized;
};

/**
 * Get all orders
 * @returns {Array} Array of orders
 */
const getAllOrders = () => {
  try {
    const files = fs.readdirSync(ORDERS_DIR);
    
    const orders = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(ORDERS_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by timestamp (newest first)
    
    return orders;
  } catch (error) {
    console.error('Error getting orders:', error);
    return [];
  }
};

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 * @returns {Object|null} Order data or null if not found
 */
const getOrderById = (orderId) => {
  try {
    const filePath = path.join(ORDERS_DIR, `${orderId}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error getting order ${orderId}:`, error);
    return null;
  }
};

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @param {Object} additionalData - Additional data to update (price, profit, etc.)
 * @returns {Object|null} Updated order or null if not found
 */
const updateOrderStatus = (orderId, status, additionalData = {}) => {
  try {
    const order = getOrderById(orderId);
    
    if (!order) {
      return null;
    }
    
    const updatedOrder = {
      ...order,
      status,
      updatedAt: new Date().toISOString(),
      ...additionalData
    };
    
    // If status is CLOSED or FILLED, set the closeTime
    if (status === 'CLOSED' || status === 'FILLED') {
      updatedOrder.closeTime = updatedOrder.closeTime || new Date().toISOString();
    }
    
    const filePath = path.join(ORDERS_DIR, `${orderId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(updatedOrder, null, 2));
    
    return updatedOrder;
  } catch (error) {
    console.error(`Error updating order ${orderId}:`, error);
    throw new Error(`Failed to update order ${orderId}`);
  }
};

/**
 * Find orders by symbol
 * @param {string} symbol - Symbol to search for
 * @returns {Array} Array of matching orders
 */
const findOrdersBySymbol = (symbol) => {
  try {
    const orders = getAllOrders();
    return orders.filter(order => order.symbol === symbol);
  } catch (error) {
    console.error(`Error finding orders for symbol ${symbol}:`, error);
    return [];
  }
};

/**
 * Find orders by status
 * @param {string} status - Status to search for
 * @returns {Array} Array of matching orders
 */
const findOrdersByStatus = (status) => {
  try {
    const orders = getAllOrders();
    return orders.filter(order => order.status === status);
  } catch (error) {
    console.error(`Error finding orders with status ${status}:`, error);
    return [];
  }
};

/**
 * Delete order by ID
 * @param {string} orderId - Order ID
 * @returns {boolean} True if deleted, false otherwise
 */
const deleteOrder = (orderId) => {
  try {
    const filePath = path.join(ORDERS_DIR, `${orderId}.json`);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error(`Error deleting order ${orderId}:`, error);
    return false;
  }
};

/**
 * Calculate profit for an order based on current price
 * @param {string} orderId - Order ID
 * @param {number} currentPrice - Current price of the symbol
 * @returns {Object|null} Updated order with profit calculation or null if not found
 */
const calculateOrderProfit = (orderId, currentPrice) => {
  try {
    const order = getOrderById(orderId);
    
    if (!order) {
      return null;
    }
    
    // Skip if the order is already closed
    if (order.status === 'CLOSED' || order.status === 'FILLED') {
      return order;
    }
    
    // Calculate profit based on entry price and current price
    let profit = 0;
    let profitPercent = 0;
    
    if (order.action === 'BUY') {
      profit = (currentPrice - order.price_entry) * (order.quantity || 1);
      profitPercent = ((currentPrice - order.price_entry) / order.price_entry) * 100;
      
      // Apply leverage if specified
      if (order.leverage) {
        profit *= order.leverage;
        profitPercent *= order.leverage;
      }
    } else if (order.action === 'SELL') {
      profit = (order.price_entry - currentPrice) * (order.quantity || 1);
      profitPercent = ((order.price_entry - currentPrice) / order.price_entry) * 100;
      
      // Apply leverage if specified
      if (order.leverage) {
        profit *= order.leverage;
        profitPercent *= order.leverage;
      }
    }
    
    // Round to 2 decimal places
    profit = parseFloat(profit.toFixed(2));
    profitPercent = parseFloat(profitPercent.toFixed(2));
    
    // Check if take profit or stop loss has been hit
    let newStatus = order.status;
    let additionalData = { profit, profitPercent };
    
    if (order.action === 'BUY') {
      if (currentPrice >= order.tp_price) {
        newStatus = 'FILLED';
        additionalData.closeTime = new Date().toISOString();
        additionalData.closeReason = 'TP hit';
      } else if (currentPrice <= order.sl_price) {
        newStatus = 'CLOSED';
        additionalData.closeTime = new Date().toISOString();
        additionalData.closeReason = 'SL hit';
      }
    } else if (order.action === 'SELL') {
      if (currentPrice <= order.tp_price) {
        newStatus = 'FILLED';
        additionalData.closeTime = new Date().toISOString();
        additionalData.closeReason = 'TP hit';
      } else if (currentPrice >= order.sl_price) {
        newStatus = 'CLOSED';
        additionalData.closeTime = new Date().toISOString();
        additionalData.closeReason = 'SL hit';
      }
    }
    
    // Update the order if status has changed or every time with the latest profit calculation
    if (newStatus !== order.status || true) {
      return updateOrderStatus(orderId, newStatus, additionalData);
    }
    
    return order;
  } catch (error) {
    console.error(`Error calculating profit for order ${orderId}:`, error);
    return null;
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  findOrdersBySymbol,
  findOrdersByStatus,
  deleteOrder,
  calculateOrderProfit,
  standardizeOrderFormat
}; 