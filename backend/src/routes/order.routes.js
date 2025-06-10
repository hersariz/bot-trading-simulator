/**
 * Routes for order endpoints
 */
const express = require('express');
const orderController = require('../controllers/order.controller');

const router = express.Router();

// GET /orders - Get all orders
// Optional query parameters: symbol, status, updateProfits
router.get('/', orderController.getAllOrders);

// GET /orders/:orderId - Get order by ID
// Optional query parameter: updateProfit
router.get('/:orderId', orderController.getOrderById);

// PUT /orders/:orderId/status - Update order status
router.put('/:orderId/status', orderController.updateOrderStatus);

// POST /orders/:orderId/calculate-profit - Calculate and update profit for an order
router.post('/:orderId/calculate-profit', orderController.calculateOrderProfit);

// POST /orders/:orderId/link-testnet - Link order with testnet order
router.post('/:orderId/link-testnet', orderController.linkOrderWithTestnet);

// DELETE /orders/:orderId - Delete order
router.delete('/:orderId', orderController.deleteOrder);

module.exports = router; 