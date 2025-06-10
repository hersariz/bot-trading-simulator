/**
 * Controller for handling testnet synchronization
 */
const testnetSyncService = require('../services/testnet-sync.service');
const orderModel = require('../models/order.model');

/**
 * Start testnet synchronization service
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const startSync = (req, res) => {
  try {
    const result = testnetSyncService.startSyncService();
    
    if (result) {
      return res.status(200).json({
        success: true,
        message: 'Testnet synchronization service started'
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'Testnet synchronization service is already running'
      });
    }
  } catch (error) {
    console.error('Error starting testnet sync:', error);
    return res.status(500).json({
      success: false,
      message: `Error starting testnet sync: ${error.message}`
    });
  }
};

/**
 * Stop testnet synchronization service
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const stopSync = (req, res) => {
  try {
    const result = testnetSyncService.stopSyncService();
    
    if (result) {
      return res.status(200).json({
        success: true,
        message: 'Testnet synchronization service stopped'
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'Testnet synchronization service is not running'
      });
    }
  } catch (error) {
    console.error('Error stopping testnet sync:', error);
    return res.status(500).json({
      success: false,
      message: `Error stopping testnet sync: ${error.message}`
    });
  }
};

/**
 * Get testnet synchronization status
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getSyncStatus = (req, res) => {
  try {
    const isRunning = testnetSyncService.isSyncRunning();
    
    return res.status(200).json({
      success: true,
      isRunning
    });
  } catch (error) {
    console.error('Error getting testnet sync status:', error);
    return res.status(500).json({
      success: false,
      message: `Error getting testnet sync status: ${error.message}`
    });
  }
};

/**
 * Sync all orders with testnet
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const syncAllOrders = async (req, res) => {
  try {
    const syncCount = await testnetSyncService.forceSyncOnce();
    
    return res.status(200).json({
      success: true,
      message: `Successfully synchronized ${syncCount} orders with testnet`,
      syncCount
    });
  } catch (error) {
    console.error('Error syncing orders with testnet:', error);
    return res.status(500).json({
      success: false,
      message: `Error syncing orders with testnet: ${error.message}`
    });
  }
};

/**
 * Sync a specific order with testnet
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const syncOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }
    
    // Get order from model
    const order = orderModel.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order with ID ${orderId} not found`
      });
    }
    
    if (!order.testnet_order_id) {
      return res.status(400).json({
        success: false,
        message: `Order with ID ${orderId} does not have a testnet order ID`
      });
    }
    
    // Sync order with testnet
    const updatedOrder = await testnetSyncService.syncOrderWithTestnet(order);
    
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: `Could not sync order ${orderId} with testnet`
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `Successfully synchronized order ${orderId} with testnet`,
      order: updatedOrder
    });
  } catch (error) {
    console.error(`Error syncing order with testnet:`, error);
    return res.status(500).json({
      success: false,
      message: `Error syncing order with testnet: ${error.message}`
    });
  }
};

module.exports = {
  startSync,
  stopSync,
  getSyncStatus,
  syncAllOrders,
  syncOrderById
}; 