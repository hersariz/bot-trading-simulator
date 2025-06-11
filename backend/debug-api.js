/**
 * Debug API Script
 * Alat untuk menguji endpoint API di lingkungan produksi
 */
const axios = require('axios');

const vercelUrl = 'https://bot-trading-simulator-6fic.vercel.app';

// Konfigurasi Axios
const api = axios.create({
  baseURL: vercelUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Fungsi helper untuk menampilkan respons dengan format
function displayResponse(response) {
  console.log('\n===== RESPONSE INFO =====');
  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log('Headers:', response.headers);
  console.log('\n===== RESPONSE DATA =====');
  
  if (typeof response.data === 'string') {
    console.log('String response (first 500 chars):');
    console.log(response.data.substring(0, 500));
    
    // Cek apakah ini HTML
    if (response.data.includes('<!DOCTYPE html>') || response.data.includes('<html>')) {
      console.log('\n[WARNING] Response appears to be HTML instead of JSON!');
    }
  } else {
    console.log('JSON response:');
    console.log(JSON.stringify(response.data, null, 2));
  }
  
  console.log('\n=======================');
}

// Fungsi untuk menguji endpoint API
async function testEndpoint(method, url, data = null) {
  console.log(`\n>>> Testing ${method.toUpperCase()} ${url}`);
  
  try {
    let response;
    
    switch (method.toLowerCase()) {
      case 'get':
        response = await api.get(url);
        break;
      case 'post':
        response = await api.post(url, data);
        break;
      case 'put':
        response = await api.put(url, data);
        break;
      case 'delete':
        response = await api.delete(url);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    displayResponse(response);
    return response;
  } catch (error) {
    console.error('\n===== ERROR =====');
    console.error(`Status: ${error.response?.status || 'N/A'}`);
    console.error(`Message: ${error.message}`);
    
    if (error.response) {
      console.error('\n===== ERROR RESPONSE =====');
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    }
    
    console.error('\n==================');
    throw error;
  }
}

// Jalankan tes
async function runTests() {
  try {
    // Test health check
    await testEndpoint('get', '/api/health');
    
    // Test orders
    await testEndpoint('get', '/api/orders');
    
    // Test config
    await testEndpoint('get', '/api/config');
    
    // Test testnet config
    await testEndpoint('get', '/api/testnet/config');
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Tests failed!');
  }
}

// Jalankan script
runTests(); 