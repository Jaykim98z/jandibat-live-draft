// server/models/ChatMessage.js
const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  roomCode: { type: String, required: true },
  userId: { type: String, required: true },
  nickname: { type: String, required: true },
  message: { type: String, required: true, maxlength: 500 },
  type: { 
    type: String, 
    enum: ['user', 'system', 'notification'], 
    default: 'user' 
  },
  timestamp: { type: Date, default: Date.now },
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 후
  }
});

// TTL 인덱스 (24시간 후 자동 삭제)
ChatMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 방별 메시지 조회 인덱스
ChatMessageSchema.index({ roomCode: 1, timestamp: -1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
