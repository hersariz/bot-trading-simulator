/**
 * Config model for storing and retrieving strategy configuration
 */
const fs = require('fs');
const path = require('path');
const defaultConfig = require('../config/default');

// Path to store configuration
const CONFIG_FILE_PATH = path.join(__dirname, '../../data/config.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize config file with default values if it doesn't exist
if (!fs.existsSync(CONFIG_FILE_PATH)) {
  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(defaultConfig, null, 2));
}

/**
 * Get current configuration
 * @returns {Object} Current configuration
 */
const getConfig = () => {
  try {
    const configData = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error reading config file:', error);
    return defaultConfig;
  }
};

/**
 * Update configuration
 * @param {Object} newConfig - New configuration object
 * @returns {Object} Updated configuration
 */
const updateConfig = (newConfig) => {
  try {
    // Merge with existing config to ensure all fields are present
    const currentConfig = getConfig();
    const updatedConfig = { ...currentConfig, ...newConfig };
    
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(updatedConfig, null, 2));
    return updatedConfig;
  } catch (error) {
    console.error('Error updating config file:', error);
    throw new Error('Failed to update configuration');
  }
};

module.exports = {
  getConfig,
  updateConfig
}; 