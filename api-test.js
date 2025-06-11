/**
 * Script pengujian API - untuk mengidentifikasi masalah deployment di Vercel
 * 
 * Jalankan dengan: node api-test.js
 */

const axios = require('axios');

// Konfigurasi
const API_URL = 'https://bot-trading-simulator-6fic.vercel.app';
const endpoints = [
  { method: 'GET', url: '/api/health', name: 'Health Check' },
  { method: 'GET', url: '/api/orders', name: 'Get Orders' },
  { method: 'GET', url: '/api/config', name: 'Get Config' },
  { method: 'GET', url: '/api/market/data?symbol=BTCUSDT', name: 'Get Market Data' },
  { method: 'GET', url: '/api/testnet/config', name: 'Get Testnet Config' },
  { method: 'OPTIONS', url: '/api/testnet/config', name: 'OPTIONS Testnet Config' },
];

// Konfigurasi Axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Warna untuk output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Fungsi untuk menguji endpoint API
async function testEndpoint(method, url, name) {
  console.log(`\n${colors.bright}${colors.cyan}Testing: ${name}${colors.reset}`);
  console.log(`${colors.magenta}${method} ${url}${colors.reset}`);
  
  try {
    const startTime = Date.now();
    let response;
    
    switch (method.toLowerCase()) {
      case 'get':
        response = await api.get(url);
        break;
      case 'post':
        response = await api.post(url);
        break;
      case 'options':
        response = await api.options(url);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`${colors.green}✓ Status: ${response.status} ${response.statusText} (${duration}ms)${colors.reset}`);
    console.log(`${colors.blue}Response Headers:${colors.reset}`);
    Object.keys(response.headers).forEach(key => {
      console.log(`  ${key}: ${response.headers[key]}`);
    });
    
    console.log(`${colors.blue}Response Data:${colors.reset}`);
    if (typeof response.data === 'string') {
      if (response.data.length > 500) {
        console.log(`  ${response.data.substring(0, 500)}...`);
      } else {
        console.log(`  ${response.data}`);
      }
      
      // Cek apakah respons berisi HTML
      if (response.data.includes('<!DOCTYPE html>') || response.data.includes('<html>')) {
        console.log(`${colors.red}⚠️ Warning: Response appears to be HTML instead of JSON!${colors.reset}`);
      }
    } else {
      console.log(`  ${JSON.stringify(response.data, null, 2)}`);
    }
    
    return { success: true, status: response.status };
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    
    if (error.response) {
      console.log(`${colors.red}Status: ${error.response.status} ${error.response.statusText}${colors.reset}`);
      console.log(`${colors.blue}Response Headers:${colors.reset}`);
      Object.keys(error.response.headers).forEach(key => {
        console.log(`  ${key}: ${error.response.headers[key]}`);
      });
      
      console.log(`${colors.blue}Response Data:${colors.reset}`);
      console.log(`  ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.log(`${colors.red}No response received${colors.reset}`);
    }
    
    return { success: false, status: error.response?.status || 'N/A' };
  }
}

// Jalankan semua pengujian
async function runTests() {
  console.log(`${colors.bright}${colors.yellow}==================================${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}API Test for ${API_URL}${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}==================================${colors.reset}`);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const result = await testEndpoint(endpoint.method, endpoint.url, endpoint.name);
      results.push({
        ...endpoint,
        ...result
      });
    } catch (error) {
      console.error(`Failed to test ${endpoint.name}:`, error);
      results.push({
        ...endpoint,
        success: false,
        status: 'Error'
      });
    }
  }
  
  // Tampilkan ringkasan hasil
  console.log(`\n${colors.bright}${colors.yellow}==================================${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}Test Results Summary${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}==================================${colors.reset}`);
  
  results.forEach(result => {
    const statusColor = result.success ? colors.green : colors.red;
    const statusSymbol = result.success ? '✓' : '✗';
    console.log(`${statusColor}${statusSymbol} ${result.name}: ${result.status}${colors.reset}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const successRate = Math.round((successCount / totalCount) * 100);
  
  console.log(`\n${colors.bright}${successRate >= 80 ? colors.green : colors.yellow}Success Rate: ${successCount}/${totalCount} (${successRate}%)${colors.reset}`);
}

// Jalankan semua tes
runTests().catch(error => {
  console.error('Error running tests:', error);
}); 