// server/models/Draft.js
const mongoose = require('mongoose');

const PickHistorySchema = new mongoose.Schema({
  pickOrder: { type: Number, required: true },
  round: { type: Number, required: true },
  managerId: { type: String, required: true },
  managerNickname: { type: String, required: true },
  playerId: { type: String, required: true },
  playerNickname: { type: String, required: true },
  position: { type: String, required: true },
  pickTime: { type: Date, default: Date.now }
});

const DraftSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  roomCode: { type: String, required: true },
  title: { type: String, required: true },
  draftType: { type: String, enum: ['shuffle', 'snake', 'manual'], required: true },
  
  participants: [{
    userId: String,
    soopId: String,
    nickname: String,
    profileImage: String
  }],
  
  // 각 팀별 선택된 선수들
  teams: {
    type: Map,
    of: [{
      soopId: String,
      nickname: String,
      profileImage: String,
      position: String,
      pickOrder: Number,
      round: Number,
      pickTime: Date
    }]
  },
  
  pickHistory: [PickHistorySchema],
  
  // 셔플픽 전용 데이터
  shufflePickData: {
    algorithm: { type: String, default: 'softmax' },
    roundOrders: [[String]], // 각 라운드별 순서
    fairnessScore: { type: Number, min: 0, max: 1, default: 1 }
  },
  
  startedAt: { type: Date, required: true },
  completedAt: { type: Date, required: true },
  duration: { type: Number, required: true }, // 초
  createdAt: { type: Date, default: Date.now }
});

// 인덱스
DraftSchema.index({ roomCode: 1 });
DraftSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Draft', DraftSchema);