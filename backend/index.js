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
    
    // Menggunakan path yang benar berdasarkan struktur direktori
    let testnetController;
    try {
      // Coba import dari path /src/controllers (struktur lokal)
      testnetController = require('./src/controllers/testnet.controller');
    } catch (err) {
      try {
        // Jika gagal, coba import dari /controllers (struktur GitHub)
        testnetController = require('./controllers/testnet.controller');
      } catch (err2) {
        console.error('[Vercel Serverless] Failed to import testnet controller:', err2);
      }
    }
    
    if (testnetController && typeof testnetController.updateConfig === 'function') {
      return testnetController.updateConfig(req, res);
    } else {
      console.error('[Vercel Serverless] testnetController not found or updateConfig not a function');
      return res.status(500).json({
        success: false,
        error: 'Internal server error: Controller not found'
      });
    }
  }
  
  // Handle all other requests normally
  return app(req, res);
}; 