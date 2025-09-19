// server/utils/database.js
const mongoose = require('mongoose');

// MongoDB 연결 함수
const connectDB = async () => {
  try {
    console.log('🔄 MongoDB 연결 중...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // 최신 MongoDB 드라이버 호환 옵션만 사용
      maxPoolSize: 10, // 연결 풀 최대 크기
      serverSelectionTimeoutMS: 5000, // 서버 선택 타임아웃
      socketTimeoutMS: 45000, // 소켓 타임아웃
    });

    console.log('✅ MongoDB 연결 성공!');
    console.log(`📍 호스트: ${conn.connection.host}`);
    console.log(`🗄️  데이터베이스: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error.message);
    console.error('🔍 상세 에러:', error);
    process.exit(1);
  }
};

// MongoDB 연결 해제 함수
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB 연결이 안전하게 종료되었습니다.');
  } catch (error) {
    console.error('❌ MongoDB 연결 종료 중 오류:', error);
  }
};

// 연결 상태 모니터링
mongoose.connection.on('connected', () => {
  console.log('🟢 MongoDB 연결됨');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 MongoDB 연결 오류:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 MongoDB 연결 해제됨');
});

// 프로세스 종료 시 DB 연결 정리
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = { connectDB, disconnectDB };