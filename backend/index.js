// Vercel serverless function entry point
const app = require('./server');

// Expose the app as a serverless function
module.exports = (req, res) => {
  console.log(`[Vercel Serverless] ${req.method} ${req.url}`);
  
  // Fix untuk masalah testnet config route
  if (req.url === '/api/testnet/config' && req.method === 'POST') {
    console.log('Handling special case for testnet config POST');
    return app._router.handle(req, res);
  }
  
  // Handle all other requests normally
  return app(req, res);
}; 