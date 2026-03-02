// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const videosRouter = require('./routes/videos');
const userRouter = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE ============

// CORS - allow requests from frontend (adjust origin as needed)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:8000', 'http://127.0.0.1:3000', '*'],
  credentials: true
}));

// Parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ ROUTES ============

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running!', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/videos', videosRouter);
app.use('/api/user', userRouter);

// Serve static files (if needed)
app.use(express.static(path.join(__dirname, '../')));

// Fallback: serve index.html for SPA (optional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   YouTube Clone Backend Server         ║
  ║   Running on http://localhost:${PORT}  ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}    ║
  ║   Press CTRL+C to stop                 ║
  ╚════════════════════════════════════════╝
  `);
  console.log(`API endpoints available at http://localhost:${PORT}/api/videos`);
});
