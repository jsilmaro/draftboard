// Vercel serverless function for Stripe webhook
const app = require('../../server/index.js');

module.exports = (req, res) => {
  // Handle the webhook request
  app(req, res);
};
