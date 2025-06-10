/**
 * @route GET /api/testnet/manual-test
 * @desc Manual test for trading signal
 * @access Public
 */
router.get('/manual-test', testnetController.manualTestSignal); 