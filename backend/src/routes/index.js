const express = require('express');
const router = express.Router();

// Impor routes
const tradingRoutes = require('./trading.routes');
const userRoutes = require('./user.routes');
const strategyRoutes = require('./strategy.routes');
const simulationRoutes = require('./simulation.routes');
const testnetRoutes = require('./testnet.routes');

// Mendaftarkan routes
router.use('/trading', tradingRoutes);
router.use('/user', userRoutes);
router.use('/strategy', strategyRoutes);
router.use('/simulation', simulationRoutes);
router.use('/testnet', testnetRoutes);

module.exports = router; 