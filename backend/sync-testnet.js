/**
 * Script untuk menjalankan sinkronisasi testnet
 * 
 * Perintah:
 * - npm run sync-testnet
 * - node sync-testnet.js
 * 
 * Opsi:
 * - --once: Hanya menjalankan sekali, tidak sebagai service
 * - --interval=N: Interval dalam milidetik (default: 30000 / 30 detik)
 */

// Import required modules
const testnetSyncService = require('./src/services/testnet-sync.service');
const orderModel = require('./src/models/order.model');

// Parse command line arguments
const args = process.argv.slice(2);
const runOnce = args.includes('--once');
const intervalArg = args.find(arg => arg.startsWith('--interval='));
const interval = intervalArg 
  ? parseInt(intervalArg.split('=')[1]) 
  : 30000; // Default 30 seconds

console.log(`
Bot Trading Simulator - Testnet Sync
-------------------------------------------
Mode: ${runOnce ? 'Single sync' : 'Continuous sync'}
${!runOnce ? `Interval: ${interval}ms (${interval / 1000} seconds)` : ''}
`);

// Function to count orders with testnet IDs
async function getOrderStats() {
  try {
    const allOrders = orderModel.getAllOrders();
    const ordersWithTestnetId = allOrders.filter(order => order.testnet_order_id).length;
    const openOrders = allOrders.filter(order => 
      order.testnet_order_id && order.status === 'OPEN'
    ).length;
    
    return {
      total: allOrders.length,
      withTestnetId: ordersWithTestnetId,
      openWithTestnetId: openOrders
    };
  } catch (error) {
    console.error('Error getting order stats:', error.message);
    return { total: 0, withTestnetId: 0, openWithTestnetId: 0 };
  }
}

// Main function
async function main() {
  try {
    // Get initial order stats
    const initialStats = await getOrderStats();
    console.log('Initial order stats:', initialStats);
    
    if (runOnce) {
      // Single sync mode
      console.log('Syncing testnet orders (single run)...');
      const syncCount = await testnetSyncService.forceSyncOnce();
      
      // Get updated stats
      const updatedStats = await getOrderStats();
      console.log('Synced', syncCount, 'orders. Updated order stats:', updatedStats);
      
      console.log('Done!');
      process.exit(0);
    } else {
      // Continuous mode
      console.log(`Starting testnet sync service with ${interval}ms interval...`);
      testnetSyncService.startSyncService();
      
      // Keep process running
      console.log('Press Ctrl+C to stop');
      
      // Setup interval to print stats periodically
      setInterval(async () => {
        const stats = await getOrderStats();
        console.log(`[${new Date().toLocaleString()}] Order stats:`, stats);
      }, interval);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Start the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 