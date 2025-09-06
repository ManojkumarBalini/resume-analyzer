const express = require('express');
const cors = require('cors');
const { createResumeTable } = require('./models/Resume');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/resumes', require('./routes/resumes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is running', port: PORT });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await createResumeTable();
    console.log('Database table initialized');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();