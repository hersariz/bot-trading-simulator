// Vercel serverless function entry point
const app = require('./server');

// Log incoming requests in serverless environment
app.use((req, res, next) => {
  console.log(`[Vercel] ${req.method} ${req.originalUrl}`);
  next();
});

// Export the Express app as a serverless function
module.exports = app; 