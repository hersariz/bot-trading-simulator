/**
 * Script untuk menghubungkan order lokal dengan order testnet
 * 
 * Perintah:
 * - node link-testnet-orders.js
 * 
 * Opsi:
 * - --auto: Mencoba menghubungkan secara otomatis berdasarkan symbol dan waktu
 * - --order-id=ID: Menghubungkan order lokal dengan ID tertentu
 * - --testnet-id=ID: Menghubungkan dengan order testnet dengan ID tertentu
 */

// Import required modules
const fs = require('fs');
const path = require('path');
const orderModel = require('./src/models/order.model');
const testnetSyncService = require('./src/services/testnet-sync.service');
const binanceTestnetService = require('./src/services/binance-testnet.service');

// Parse command line arguments
const args = process.argv.slice(2);
const autoLink = args.includes('--auto');
const orderIdArg = args.find(arg => arg.startsWith('--order-id='));
const testnetIdArg = args.find(arg => arg.startsWith('--testnet-id='));

const orderId = orderIdArg ? orderIdArg.split('=')[1] : null;
const testnetId = testnetIdArg ? testnetIdArg.split('=')[1] : null;

// Path for testnet orders
const TESTNET_ORDERS_FILE = path.join(__dirname, 'data/testnet_orders.json');

// Function to load testnet orders
const loadTestnetOrders = () => {
  try {
    if (fs.existsSync(TESTNET_ORDERS_FILE)) {
      const data = fs.readFileSync(TESTNET_ORDERS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading testnet orders:', error.message);
    return [];
  }
};

// Function to find matching testnet order for a local order
const findMatchingTestnetOrder = (localOrder, testnetOrders) => {
  // Filter by symbol
  const symbolMatches = testnetOrders.filter(to => to.symbol === localOrder.symbol);
  
  if (symbolMatches.length === 0) {
    return null;
  }
  
  // Convert local order timestamp to Date object
  const localOrderTime = new Date(localOrder.timestamp);
  
  // Find the closest match by time
  let closestMatch = null;
  let minTimeDiff = Infinity;
  
  for (const testnetOrder of symbolMatches) {
    const testnetTime = new Date(testnetOrder.timestamp);
    const timeDiff = Math.abs(testnetTime - localOrderTime);
    
    // If orders are within 5 minutes (300000ms) of each other and this is the closest match so far
    if (timeDiff < 300000 && timeDiff < minTimeDiff) {
      minTimeDiff = timeDiff;
      closestMatch = testnetOrder;
    }
  }
  
  return closestMatch;
};

// Function to link a local order with a testnet order
const linkOrder = async (localOrderId, testnetOrderId) => {
  try {
    // Get local order
    const localOrder = orderModel.getOrderById(localOrderId);
    if (!localOrder) {
      console.error(`Local order ${localOrderId} not found`);
      return false;
    }
    
    // Update order with testnet information
    const updatedOrder = orderModel.updateOrderStatus(localOrderId, localOrder.status, {
      testnet_order_id: testnetOrderId,
      testnet_status: 'LINKED',
      testnet_created_at: new Date().toISOString()
    });
    
    if (!updatedOrder) {
      console.error(`Failed to update order ${localOrderId}`);
      return false;
    }
    
    // Sync with testnet
    try {
      const syncedOrder = await testnetSyncService.syncOrderWithTestnet(updatedOrder);
      if (syncedOrder) {
        console.log(`Order ${localOrderId} successfully linked with testnet order ${testnetOrderId} and synced`);
        return true;
      }
    } catch (syncError) {
      console.error(`Error syncing with testnet after linking order ${localOrderId}:`, syncError.message);
    }
    
    console.log(`Order ${localOrderId} linked with testnet order ${testnetOrderId}`);
    return true;
  } catch (error) {
    console.error(`Error linking order ${localOrderId}:`, error.message);
    return false;
  }
};

// Main function
async function main() {
  try {
    console.log('\nBot Trading Simulator - Link Testnet Orders\n');
    
    // If specific order IDs are provided
    if (orderId && testnetId) {
      console.log(`Linking local order ${orderId} with testnet order ${testnetId}...`);
      const success = await linkOrder(orderId, testnetId);
      
      if (success) {
        console.log('Order linked successfully');
      } else {
        console.error('Failed to link order');
      }
      
      return;
    }
    
    // Auto-link mode
    if (autoLink) {
      console.log('Auto-linking orders...');
      
      // Get all local orders without testnet_order_id
      const localOrders = orderModel.getAllOrders()
        .filter(order => !order.testnet_order_id);
      
      console.log(`Found ${localOrders.length} local orders without testnet ID`);
      
      // Get all testnet orders
      const testnetOrders = loadTestnetOrders();
      console.log(`Found ${testnetOrders.length} testnet orders`);
      
      if (localOrders.length === 0 || testnetOrders.length === 0) {
        console.log('No orders to link');
        return;
      }
      
      // Try to match and link orders
      let linkedCount = 0;
      
      for (const localOrder of localOrders) {
        const matchingTestnetOrder = findMatchingTestnetOrder(localOrder, testnetOrders);
        
        if (matchingTestnetOrder) {
          console.log(`Found match for order ${localOrder.id}: testnet order ${matchingTestnetOrder.id}`);
          const success = await linkOrder(localOrder.id, matchingTestnetOrder.id);
          
          if (success) {
            linkedCount++;
          }
        }
      }
      
      console.log(`\nLinked ${linkedCount} orders successfully`);
    } else {
      // Show usage instructions
      console.log('Usage:');
      console.log('  node link-testnet-orders.js --auto');
      console.log('  node link-testnet-orders.js --order-id=LOCAL_ID --testnet-id=TESTNET_ID');
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