const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import route modules
const stripeRoutes = require('./stripe');
const rewardsRoutes = require('./rewards');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/stripe', stripeRoutes);
app.use('/api/rewards', rewardsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  });
});

module.exports = app;

