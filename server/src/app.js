const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const auth = require('./middleware/auth');
const { getFilePath } = require('./services/storage');
const fs = require('fs');

const authRoutes = require('./routes/auth.routes');
const jobRoutes = require('./routes/job.routes');
const applicationRoutes = require('./routes/application.routes');

const app = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

// Authorized file download route (not public static)
app.get('/api/uploads/:filename', auth, (req, res) => {
  const filePath = getFilePath(req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  res.sendFile(filePath);
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Central error handler
app.use(errorHandler);

module.exports = app;
