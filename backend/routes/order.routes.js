/**
 * Routes for order endpoints
 */
const express = require('express');
const orderController = require('../src/controllers/order.controller');

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