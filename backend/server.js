const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const generateRoutes = require('./routes/generate');
const historyRoutes = require('./routes/history');
const validateRoutes = require('./routes/validate');
const devOpsDocRoutes = require('./routes/devOpsDoc');
const adminRoutes = require('./routes/admin');
const terraformTemplateRoutes = require('./routes/terraformTemplate');
const resourceRoutes = require('./routes/resources');
const githubRoutes = require('./routes/github');
const visionRoutes = require('./routes/vision');
const deploymentRoutes = require('./routes/deployment');
const dockerHubRoutes = require('./routes/dockerHub');
const deploymentManagementRoutes = require('./routes/deploymentManagement');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - Allow multiple origins
const allowedOrigins = [
  'https://cmcloud.online',
  'https://www.cmcloud.online',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'https://api.cmcloud.online'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      // For development, you can uncomment the line below to allow all origins
      // callback(null, true);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Accept',
    'Authorization',
    'Cache-Control',
    'Content-Type',
    'DNT',
    'If-Modified-Since',
    'Keep-Alive',
    'Origin',
    'User-Agent',
    'X-Requested-With',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['Content-Length', 'X-Kuma-Revision']
}));

// Handle preflight requests
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/mernapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/validate', validateRoutes);
app.use('/api/devops-docs', devOpsDocRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/terraform-templates', terraformTemplateRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/deployment', deploymentRoutes);
app.use('/api/dockerhub', dockerHubRoutes);
app.use('/api/deployments', deploymentManagementRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'DevOps Pipeline Generator API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});