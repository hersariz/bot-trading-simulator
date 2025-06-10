/**
 * Routes for configuration endpoints
 */
const express = require('express');
const configController = require('../controllers/config.controller');

const router = express.Router();

// GET /config - Get current configuration
router.get('/', configController.getConfig);

// POST /config - Update configuration
router.post('/', configController.updateConfig);

module.exports = router; 