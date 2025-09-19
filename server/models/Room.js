// server/models/Room.js (수정된 버전)
const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  soopId: { type: String, required: true },
  nickname: { type: String, required: true },
  profileImage: { type: String, default: '' },
  position: { type: String, required: true }, // 포지션 필수로 변경
  joinedAt: { type: Date, default: Date.now },
  isHost: { type: Boolean, default: false },
  isReady: { type: Boolean, default: false },
  isManager: { type: Boolean, default: false }
});

const PlayerSchema = new mongoose.Schema({
  soopId: { type: String, required: true },
  nickname: { type: String, required: true },
  profileImage: { type: String, default: '' },
  position: { type: String, required: true }, // ST, WF, CM, CDM, FB, CB, GK
  addedBy: { type: String, required: true }, // userId
  isSelected: { type: Boolean, default: false },
  selectedBy: { type: String, default: null }, // managerId
  selectedAt: { type: Date, default: null }
});

const RoomSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true,
    minlength: 6,
    maxlength: 6 
  },
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 100 
  },
  host: {
    userId: { type: String, required: true },
    soopId: { type: String, required: true },
    nickname: { type: String, required: true },
    profileImage: { type: String, default: '' },
    position: { type: String, required: true } // 방장도 포지션 필수
  },
  settings: {
    password: { type: String, default: null },
    draftType: { 
      type: String, 
      enum: ['shuffle', 'snake', 'manual'], 
      default: 'shuffle' 
    },
    // timePerTurn과 maxParticipants 제거 또는 고정값으로 변경
    maxParticipants: { type: Number, default: 100, max: 100 } // 100명 고정
  },
  participants: [ParticipantSchema],
  playerPool: [PlayerSchema],
  managers: [{ 
    userId: String,
    soopId: String,
    nickname: String,
    profileImage: String,
    position: String, // 감독도 포지션 있음
    assignedAt: { type: Date, default: Date.now }
  }],
  status: { 
    type: String, 
    enum: ['waiting', 'drafting', 'completed', 'abandoned'], 
    default: 'waiting' 
  },
  currentTurn: { type: String, default: null }, // userId
  currentRound: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 후
  }
});

// TTL 인덱스 (24시간 후 자동 삭제)
RoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 방 코드 인덱스
RoomSchema.index({ code: 1 });

// 상태별 인덱스
RoomSchema.index({ status: 1 });

// updatedAt 자동 업데이트
RoomSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Room', RoomSchema);