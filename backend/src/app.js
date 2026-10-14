const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const { testConnection } = require('./config/database');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Khởi tạo Express app
const app = express();

// ==================== GLOBAL MIDDLEWARES ====================

// Bảo mật HTTP headers
app.use(helmet());

// Cho phép CORS (Cross-Origin Resource Sharing)
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON body
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded body
app.use(express.urlencoded({ extended: true }));

// ==================== ROUTES ====================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HomeFix API đang hoạt động! 🏠🔧',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// ==================== ERROR HANDLING ====================

// Route không tồn tại (404)
app.use(notFound);

// Error handler tập trung
app.use(errorHandler);

// ==================== START SERVER ====================

const startServer = async () => {
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.warn('⚠️  Không thể kết nối database. Server vẫn khởi động nhưng API sẽ lỗi.');
  }

  const PORT = config.port;
  app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║       🏠 HomeFix Backend API Server 🔧        ║');
    console.log('╠═══════════════════════════════════════════════╣');
    console.log(`║  🌐 Server:  http://localhost:${PORT}             ║`);
    console.log(`║  📦 Env:     ${config.nodeEnv.padEnd(32)}║`);
    console.log(`║  🗄️  DB:      ${dbConnected ? 'Connected ✅' : 'Disconnected ❌'}                   ║`);
    console.log('╠═══════════════════════════════════════════════╣');
    console.log('║  📋 API Endpoints:                            ║');
    console.log('║  POST   /api/auth/register                   ║');
    console.log('║  POST   /api/auth/login                      ║');
    console.log('║  GET    /api/auth/me                         ║');
    console.log('║  PUT    /api/auth/me                         ║');
    console.log('║  POST   /api/auth/change-password            ║');
    console.log('║  GET    /api/admin/users                     ║');
    console.log('║  GET    /api/admin/users/:id                 ║');
    console.log('║  PUT    /api/admin/users/:id/verify          ║');
    console.log('╚═══════════════════════════════════════════════╝');
    console.log('');
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;
