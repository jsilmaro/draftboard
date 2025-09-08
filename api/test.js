// Test endpoint to verify Vercel API routing
module.exports = (req, res) => {
  res.status(200).json({ 
    message: 'API routing is working!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
};
