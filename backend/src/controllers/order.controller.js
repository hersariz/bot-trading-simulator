/**
 * Controller for handling order endpoints
 */
const orderModel = require('../models/order.model');
const marketService = require('../services/market.service');
const testnetSyncService = require('../services/testnet-sync.service');

/**
 * Get all orders
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllOrders = async (req, res) => {
  try {
    console.log('[Order Controller] getAllOrders called');
    
    // Set content type header to ensure JSON response
    res.setHeader('Content-Type', 'application/json');
    
    // Check if there are query parameters for filtering
    const { symbol, status, updateProfits } = req.query;
    
    let orders;
    
    if (symbol) {
      orders = orderModel.findOrdersBySymbol(symbol);
    } else if (status) {
      orders = orderModel.findOrdersByStatus(status);
    } else {
      orders = orderModel.getAllOrders();
    }
    
    // If updateProfits=true and there are OPEN orders, update their profits
    if (updateProfits === 'true') {
      // Group orders by symbol for efficiency
      const openOrders = orders.filter(order => order.status === 'OPEN');
      const symbolMap = new Map();
      
      openOrders.forEach(order => {
        if (!symbolMap.has(order.symbol)) {
          symbolMap.set(order.symbol, []);
        }
        symbolMap.get(order.symbol).push(order);
      });
      
      // Update profits for each symbol's orders
      const updatedOrderIds = new Set();
      
      for (const [symbol, symbolOrders] of symbolMap.entries()) {
        try {
          const currentPrice = await marketService.getCurrentPrice(symbol);
          
          for (const order of symbolOrders) {
            const updatedOrder = orderModel.calculateOrderProfit(order.id, currentPrice);
            if (updatedOrder) {
              updatedOrderIds.add(order.id);
            }
          }
        } catch (error) {
          console.error(`Error updating profits for ${symbol}:`, error.message);
        }
      }
      
      // Refresh orders after updates
      if (updatedOrderIds.size > 0) {
        if (symbol) {
          orders = orderModel.findOrdersBySymbol(symbol);
        } else if (status) {
          orders = orderModel.findOrdersByStatus(status);
        } else {
          orders = orderModel.getAllOrders();
        }
      }
    }
    
    // Standardize all orders for frontend compatibility
    orders = orders.map(order => {
      // Make sure all required fields for the frontend exist
      const standardizedOrder = { ...order };
      
      // Ensure side is set (convert from action if needed)
      if (!standardizedOrder.side && standardizedOrder.action) {
        standardizedOrder.side = standardizedOrder.action;
      }
      
      // Ensure price is set (convert from price_entry if needed)
      if (standardizedOrder.price_entry !== undefined && standardizedOrder.price === undefined) {
        standardizedOrder.price = standardizedOrder.price_entry;
      }
      
      // Ensure entryTime is set
      if (!standardizedOrder.entryTime && standardizedOrder.timestamp) {
        standardizedOrder.entryTime = standardizedOrder.timestamp;
      }
      
      // Ensure profit is a number or null
      if (standardizedOrder.profit !== undefined) {
        standardizedOrder.profit = standardizedOrder.profit === null ? null : parseFloat(standardizedOrder.profit);
      } else {
        standardizedOrder.profit = null;
      }
      
      // Ensure profitPercent is a number or null
      if (standardizedOrder.profitPercent !== undefined) {
        standardizedOrder.profitPercent = standardizedOrder.profitPercent === null ? null : parseFloat(standardizedOrder.profitPercent);
      } else {
        standardizedOrder.profitPercent = null;
      }
      
      return standardizedOrder;
    });
    
    // Log response for debugging
    console.log(`[Order Controller] Returning ${orders.length} orders`);
    
    // Format response - wrap orders in object with success flag for consistency
    return res.status(200).json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error('Error in getAllOrders controller:', error);
    // Set content type header to ensure JSON response even for errors
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve orders' 
    });
  }
};

/**
 * Get order by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { updateProfit } = req.query;
    
    if (!orderId) {
      return res.status(400).json({ 
        success: false,
        error: 'Order ID is required' 
      });
    }
    
    let order = orderModel.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: `Order with ID ${orderId} not found` 
      });
    }
    
    // If updateProfit=true and order is OPEN, update its profit
    if (updateProfit === 'true' && order.status === 'OPEN') {
      try {
        const currentPrice = await marketService.getCurrentPrice(order.symbol);
        order = orderModel.calculateOrderProfit(orderId, currentPrice);
      } catch (error) {
        console.error(`Error updating profit for order ${orderId}:`, error.message);
      }
    }
    
    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error in getOrderById controller:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve order' 
    });
  }
};

/**
 * Update order status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateOrderStatus = (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, closeTime, profit, profitPercent } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ 
        success: false,
        error: 'Order ID is required' 
      });
    }
    
    if (!status) {
      return res.status(400).json({ 
        success: false,
        error: 'Status is required' 
      });
    }
    
    // Validate status
    const validStatuses = ['OPEN', 'CLOSED', 'CANCELLED', 'FILLED', 'TP_TRIGGERED', 'SL_TRIGGERED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    // Additional data to update
    const additionalData = {};
    
    if (closeTime) additionalData.closeTime = closeTime;
    if (profit !== undefined) additionalData.profit = parseFloat(profit);
    if (profitPercent !== undefined) additionalData.profitPercent = parseFloat(profitPercent);
    
    const updatedOrder = orderModel.updateOrderStatus(orderId, status, additionalData);
    
    if (!updatedOrder) {
      return res.status(404).json({ 
        success: false,
        error: `Order with ID ${orderId} not found` 
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error in updateOrderStatus controller:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update order status' 
    });
  }
};

/**
 * Delete order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteOrder = (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ 
        success: false,
        error: 'Order ID is required' 
      });
    }
    
    const result = orderModel.deleteOrder(orderId);
    
    if (!result) {
      return res.status(404).json({ 
        success: false,
        error: `Order with ID ${orderId} not found` 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: `Order with ID ${orderId} deleted successfully` 
    });
  } catch (error) {
    console.error('Error in deleteOrder controller:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete order' 
    });
  }
};

/**
 * Calculate and update profit for an order
 * @param {Object} req - Express request object 
 * @param {Object} res - Express response object
 */
const calculateOrderProfit = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { currentPrice } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }
    
    const order = orderModel.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: `Order with ID ${orderId} not found`
      });
    }
    
    let price;
    
    if (currentPrice) {
      // Use provided price
      price = parseFloat(currentPrice);
    } else {
      // Fetch current price
      try {
        price = await marketService.getCurrentPrice(order.symbol);
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: `Could not get current price: ${error.message}`
        });
      }
    }
    
    // Calculate and update profit
    const updatedOrder = orderModel.calculateOrderProfit(orderId, price);
    
    return res.status(200).json({
      success: true,
      message: 'Profit calculated and updated',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error calculating order profit:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate profit'
    });
  }
};

/**
 * Link order with testnet order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const linkOrderWithTestnet = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { testnetOrderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }
    
    if (!testnetOrderId) {
      return res.status(400).json({
        success: false,
        error: 'Testnet order ID is required'
      });
    }
    
    // Get local order
    const order = orderModel.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: `Order with ID ${orderId} not found`
      });
    }
    
    // Update order with testnet information
    const updatedOrder = orderModel.updateOrderStatus(orderId, order.status, {
      testnet_order_id: testnetOrderId,
      testnet_status: 'LINKED',
      testnet_created_at: new Date().toISOString()
    });
    
    if (!updatedOrder) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update order with testnet information'
      });
    }
    
    // Force sync with testnet to get latest status
    try {
      const syncedOrder = await testnetSyncService.syncOrderWithTestnet(updatedOrder);
      
      if (syncedOrder) {
        return res.status(200).json({
          success: true,
          message: `Order ${orderId} successfully linked with testnet order ${testnetOrderId} and synced`,
          order: syncedOrder
        });
      }
    } catch (syncError) {
      console.error('Error syncing with testnet after linking:', syncError);
      // Continue with the response even if sync fails
    }
    
    return res.status(200).json({
      success: true,
      message: `Order ${orderId} successfully linked with testnet order ${testnetOrderId}`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error linking order with testnet:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to link order with testnet'
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  calculateOrderProfit,
  linkOrderWithTestnet
}; 