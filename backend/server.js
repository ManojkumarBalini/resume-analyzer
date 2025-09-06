const express = require('express');
const cors = require('cors');
const path = require('path');
const { createResumeTable } = require('./models/Resume');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration for production and development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://resume-analyzer-frontend-st49.onrender.com',
      'https://resume-analyzer-frontend.onrender.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/resumes', require('./routes/resumes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Resume Analyzer API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// API information endpoint for root path
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Resume Analyzer API Server',
    version: '1.0.0',
    documentation: 'https://github.com/ManojkumarBalini/resume-analyzer',
    endpoints: {
      health: '/health',
      status: '/api/status',
      upload: '/api/resumes/upload',
      getResumes: '/api/resumes',
      getResume: '/api/resumes/:id'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  // Handle CORS errors
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      error: 'CORS policy: Request not allowed' 
    });
  }
  
  // Handle file upload errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      error: 'File too large. Maximum size is 5MB.' 
    });
  }
  
  if (error.message.includes('File format not supported')) {
    return res.status(400).json({ 
      error: 'Only PDF files are supported.' 
    });
  }
  
  // Default error handler
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl 
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('Initializing database connection...');
    
    // Create database table
    await createResumeTable();
    console.log('Database table initialized successfully');
    
    // Create uploads directory if it doesn't exist
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Uploads directory created');
    }
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log('='.repeat(50));
      console.log('🚀 Resume Analyzer Server Started');
      console.log('='.repeat(50));
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
      console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
      console.log('='.repeat(50));
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app; // For testing purposes
