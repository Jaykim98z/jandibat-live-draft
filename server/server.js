// server/server.js
const { server, connectDB } = require('./app');

const PORT = process.env.PORT || 3000;

// 그레이스풀 셧다운 처리
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM 시그널을 받았습니다. 서버를 안전하게 종료합니다...');
  server.close(() => {
    console.log('✅ HTTP 서버가 안전하게 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT 시그널을 받았습니다. 서버를 안전하게 종료합니다...');
  server.close(() => {
    console.log('✅ HTTP 서버가 안전하게 종료되었습니다.');
    process.exit(0);
  });
});

// 처리되지 않은 Promise 거부 처리
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 처리되지 않은 Promise 거부:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

// 처리되지 않은 예외 처리
process.on('uncaughtException', (error) => {
  console.error('❌ 처리되지 않은 예외:', error);
  process.exit(1);
});

// 서버 시작
const startServer = async () => {
  try {
    // MongoDB 연결
    await connectDB();
    
    // 서버 시작
    server.listen(PORT, () => {
      console.log('🚀================================🚀');
      console.log('🎯 JandiBat Live Draft Server');
      console.log(`📡 포트: ${PORT}`);
      console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ 시작 시간: ${new Date().toISOString()}`);
      console.log('🚀================================🚀');
      console.log(`🔗 서버 주소: http://localhost:${PORT}`);
      console.log(`❤️  헬스체크: http://localhost:${PORT}/health`);
      console.log(`📊 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

startServer();