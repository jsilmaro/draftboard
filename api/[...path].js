const app = require('../server/index.js');

// Export the Express app as a serverless function
module.exports = app;

// Handle Vercel serverless function requirements
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
}
