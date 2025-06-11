/**
 * Routes for order endpoints
 */
const express = require('express');
let orderController;

// Coba impor dari kedua lokasi untuk mendukung struktur direktori yang berbeda
try {
  orderController = require('../src/controllers/order.controller');
} catch (error) {
  try {
    orderController = require('../controllers/order.controller');
  } catch (innerError) {
    console.error('Failed to import order controller:', innerError);
    // Fallback controller kosong untuk mencegah crash
    orderController = {
      getAllOrders: (req, res) => res.status(500).json({ success: false, error: 'Controller not loaded correctly' }),
      getOrderById: (req, res) => res.status(500).json({ success: false, error: 'Controller not loaded correctly' }),
      updateOrderStatus: (req, res) => res.status(500).json({ success: false, error: 'Controller not loaded correctly' }),
      deleteOrder: (req, res) => res.status(500).json({ success: false, error: 'Controller not loaded correctly' })
    };
  }
}

const router = express.Router();

// GET /orders - Get all orders
// Optional query parameters: symbol, status
router.get('/', orderController.getAllOrders);

// GET /orders/:orderId - Get order by ID
router.get('/:orderId', orderController.getOrderById);

// PUT /orders/:orderId/status - Update order status
router.put('/:orderId/status', orderController.updateOrderStatus);

// DELETE /orders/:orderId - Delete order
router.delete('/:orderId', orderController.deleteOrder);

module.exports = router; 