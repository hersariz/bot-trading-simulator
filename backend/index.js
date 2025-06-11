// Vercel serverless function entry point
const app = require('./server');

// Expose the app as a serverless function
module.exports = (req, res) => {
  console.log(`[Vercel Serverless] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'N/A'}`);
  
  // Add CORS headers for all responses to ensure they are accessible
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS requests explicitly
  if (req.method === 'OPTIONS') {
    console.log('[Vercel Serverless] Handling OPTIONS request');
    res.status(200).end();
    return;
  }
  
  // Log request details for debugging
  console.log('[Vercel Serverless] Request details:', { 
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body || 'no body'
  });
  
  // Fix for testnet/config route - handle direct access
  if (req.url === '/api/testnet/config' && req.method === 'POST') {
    console.log('[Vercel Serverless] Handling special case for testnet config POST');
    
    const testnetController = require('./controllers/testnet.controller');
    if (testnetController && typeof testnetController.updateConfig === 'function') {
      return testnetController.updateConfig(req, res);
    }
  }
  
  // Handle all other requests normally
  return app(req, res);
}; 