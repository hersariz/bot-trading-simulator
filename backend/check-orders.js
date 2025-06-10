/**
 * Script untuk menjalankan simulasi market dan memperbarui status order secara otomatis
 * 
 * Perintah:
 * - npm run check-orders
 * - node check-orders.js
 * 
 * Opsi:
 * - --update-once: Hanya mengupdate satu kali, tidak menjalankan dalam loop
 * - --interval=N: Interval dalam milidetik (default: 60000 / 1 menit)
 */

// Import required modules
const marketSimulator = require('./src/services/market-simulator.service');
const orderModel = require('./src/models/order.model');

// Parse command line arguments
const args = process.argv.slice(2);
const updateOnce = args.includes('--update-once');
const intervalArg = args.find(arg => arg.startsWith('--interval='));
const interval = intervalArg 
  ? parseInt(intervalArg.split('=')[1]) 
  : 60000; // Default 1 minute

console.log(`
Bot Trading Simulator - Order Status Checker
-------------------------------------------
Mode: ${updateOnce ? 'Single update' : 'Continuous updates'}
${!updateOnce ? `Interval: ${interval}ms (${interval / 1000} seconds)` : ''}
`);

// Function to count orders by status
async function getOrderStats() {
  try {
    const allOrders = orderModel.getAllOrders();
    const openOrders = allOrders.filter(order => order.status === 'OPEN').length;
    const closedOrders = allOrders.filter(order => order.status === 'CLOSED').length;
    const filledOrders = allOrders.filter(order => order.status === 'FILLED').length;
    const cancelledOrders = allOrders.filter(order => order.status === 'CANCELLED').length;
    
    return {
      total: allOrders.length,
      open: openOrders,
      closed: closedOrders,
      filled: filledOrders,
      cancelled: cancelledOrders
    };
  } catch (error) {
    console.error('Error getting order stats:', error.message);
    return { total: 0, open: 0, closed: 0, filled: 0, cancelled: 0 };
  }
}

// Main function
async function main() {
  try {
    // Get initial order stats
    const initialStats = await getOrderStats();
    console.log('Initial order stats:', initialStats);
    
    if (updateOnce) {
      // Single update mode
      console.log('Updating orders (single run)...');
      await marketSimulator.forceUpdate();
      
      // Get updated stats
      const updatedStats = await getOrderStats();
      console.log('Updated order stats:', updatedStats);
      
      console.log('Done!');
      process.exit(0);
    } else {
      // Continuous mode
      console.log(`Starting market simulator with ${interval}ms interval...`);
      marketSimulator.startSimulator();
      
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