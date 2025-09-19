// server/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// MongoDB 연결
const { connectDB } = require('./utils/database');

const app = express();
const server = createServer(app);

// Socket.io 설정
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// 미들웨어 설정
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3001",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100개 요청
  message: {
    error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 헬스체크 엔드포인트
app.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  
  res.status(200).json({
    status: 'healthy',
    message: 'JandiBat Live Draft Server is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      name: mongoose.connection.name || 'not_connected'
    }
  });
});

// 라우트 설정
const roomRoutes = require('./routes/roomRoutes');
const soopRoutes = require('./routes/soopRoutes');

app.use('/api/rooms', roomRoutes);
app.use('/api/soop', soopRoutes);

// 기본 API 라우트
app.get('/api', (req, res) => {
  res.json({
    message: '🎯 JandiBat Live Draft API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      health: '/health',
      api: '/api',
      rooms: '/api/rooms',
      'rooms-create': 'POST /api/rooms',
      'rooms-list': 'GET /api/rooms',
      'rooms-get': 'GET /api/rooms/:code',
      'rooms-join': 'POST /api/rooms/:code/join',
      soop: '/api/soop',
      'soop-profile': 'GET /api/soop/profile/:soopId',
      'soop-validate': 'GET /api/soop/validate/:soopId',
      'soop-multiple': 'POST /api/soop/profiles',
      'soop-cache': 'GET /api/soop/cache/stats'
    }
  });
});

// Socket.io 이벤트 처리
io.on('connection', (socket) => {
  console.log(`🔌 사용자 연결됨: ${socket.id}`);
  
  // 연결 확인 이벤트
  socket.emit('connected', {
    message: '실시간 드래프트 서버에 연결되었습니다!',
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });

  // 연결 해제
  socket.on('disconnect', (reason) => {
    console.log(`🔌 사용자 연결 해제: ${socket.id} - ${reason}`);
  });

  // 에러 처리
  socket.on('error', (error) => {
    console.error(`❌ Socket 에러 [${socket.id}]:`, error);
  });
});

// 404 에러 처리 (모든 정의되지 않은 라우트 처리)
app.use((req, res, next) => {
  res.status(404).json({
    error: '요청한 경로를 찾을 수 없습니다.',
    path: req.originalUrl,
    method: req.method
  });
});

// 글로벌 에러 처리
app.use((error, req, res, next) => {
  console.error('❌ 서버 에러:', error);
  res.status(500).json({
    error: '서버 내부 오류가 발생했습니다.',
    message: process.env.NODE_ENV === 'development' ? error.message : '서버 오류'
  });
});

module.exports = { app, server, io, connectDB };