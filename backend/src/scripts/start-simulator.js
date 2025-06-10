/**
 * Script untuk menjalankan market simulator
 * Script ini dapat dijalankan secara terpisah atau diimpor dari index.js
 */
const marketSimulator = require('../services/market-simulator.service');

/**
 * Start the market simulator
 */
const startSimulator = () => {
  console.log('Starting market simulator...');
  
  try {
    const result = marketSimulator.startSimulator();
    if (result) {
      console.log('Market simulator started successfully');
    } else {
      console.log('Market simulator is already running');
    }
  } catch (error) {
    console.error('Error starting market simulator:', error.message);
  }
};

// If this script is run directly (node start-simulator.js)
if (require.main === module) {
  startSimulator();
}

module.exports = {
  startSimulator
}; 