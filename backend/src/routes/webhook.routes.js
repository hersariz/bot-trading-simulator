/**
 * Routes for webhook endpoints
 */
const express = require('express');
const webhookController = require('../controllers/webhook.controller');

const router = express.Router();

// POST /webhook - Process webhook from TradingView
router.post('/', webhookController.processWebhook);

module.exports = router; 