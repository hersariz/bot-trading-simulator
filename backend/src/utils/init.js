/**
 * Initialization utilities for the application
 */
const fs = require('fs');
const path = require('path');
const defaultConfig = require('../config/default');

/**
 * Initialize data directory and configuration file
 */
const initializeDataDirectory = () => {
  // Create data directory if it doesn't exist
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    console.log('Creating data directory...');
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Create config file with default values if it doesn't exist
  const configFilePath = path.join(dataDir, 'config.json');
  if (!fs.existsSync(configFilePath)) {
    console.log('Creating default configuration file...');
    fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));
  }

  // Create default testnet config file if it doesn't exist
  const testnetConfigFilePath = path.join(dataDir, 'testnet_config.json');
  if (!fs.existsSync(testnetConfigFilePath)) {
    console.log('Creating default testnet configuration file...');
    const defaultTestnetConfig = {
      apiKey: '',
      apiSecret: '',
      type: 'spot', // default to spot, could be 'futures' as well
      isConfigured: false
    };
    fs.writeFileSync(testnetConfigFilePath, JSON.stringify(defaultTestnetConfig, null, 2));
  }

  // Create orders directory if it doesn't exist
  const ordersDir = path.join(dataDir, 'orders');
  if (!fs.existsSync(ordersDir)) {
    console.log('Creating orders directory...');
    fs.mkdirSync(ordersDir, { recursive: true });
  }

  console.log('Initialization completed successfully.');
};

module.exports = {
  initializeDataDirectory
}; 