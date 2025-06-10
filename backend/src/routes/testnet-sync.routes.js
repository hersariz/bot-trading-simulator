/**
 * Routes for testnet synchronization
 */
const express = require('express');
const testnetSyncController = require('../controllers/testnet-sync.controller');

const router = express.Router();

/**
 * @route   POST /api/testnet-sync/start
 * @desc    Start testnet synchronization service
 * @access  Public
 */
router.post('/start', testnetSyncController.startSync);

/**
 * @route   POST /api/testnet-sync/stop
 * @desc    Stop testnet synchronization service
 * @access  Public
 */
router.post('/stop', testnetSyncController.stopSync);

/**
 * @route   GET /api/testnet-sync/status
 * @desc    Get testnet synchronization status
 * @access  Public
 */
router.get('/status', testnetSyncController.getSyncStatus);

/**
 * @route   POST /api/testnet-sync/sync
 * @desc    Sync all orders with testnet
 * @access  Public
 */
router.post('/sync', testnetSyncController.syncAllOrders);

/**
 * @route   POST /api/testnet-sync/orders/:orderId
 * @desc    Sync specific order with testnet
 * @access  Public
 */
router.post('/orders/:orderId', testnetSyncController.syncOrderById);

module.exports = router; 