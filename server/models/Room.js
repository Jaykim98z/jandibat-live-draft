// server/models/Room.js (역할 배정 시스템 추가)
const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  soopId: { type: String, required: true },
  nickname: { type: String, required: true },
  profileImage: { type: String, default: '' },
  position: { type: String, required: true }, // ST, WF, CM, CDM, FB, CB, GK
  role: { 
    type: String, 
    enum: ['manager', 'player'], 
    default: 'player' // 기본값은 선수
  },
  joinedAt: { type: Date, default: Date.now },
  isHost: { type: Boolean, default: false },
  isReady: { type: Boolean, default: false }
});

const PlayerSchema = new mongoose.Schema({
  soopId: { type: String, required: true },
  nickname: { type: String, required: true },
  profileImage: { type: String, default: '' },
  position: { type: String, required: true },
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
    position: { type: String, required: true }
  },
  settings: {
    password: { type: String, default: null },
    draftType: { 
      type: String, 
      enum: ['shuffle', 'snake', 'manual'], 
      default: 'shuffle' 
    },
    maxParticipants: { type: Number, default: 100, max: 100 }
  },
  participants: [ParticipantSchema],
  playerPool: [PlayerSchema], // 드래프트 대상 (role: 'player'인 participants)
  managers: [{ // 감독으로 지정된 참가자들 (role: 'manager'인 participants)
    userId: String,
    soopId: String,
    nickname: String,
    profileImage: String,
    position: String,
    assignedAt: { type: Date, default: Date.now },
    team: [{ // 드래프트한 선수들
      userId: String,
      nickname: String,
      position: String,
      pickOrder: Number,
      round: Number,
      pickedAt: Date
    }]
  }],
  status: { 
    type: String, 
    enum: ['waiting', 'role-assignment', 'drafting', 'completed', 'abandoned'], 
    default: 'waiting' 
  },
  currentTurn: { type: String, default: null }, // userId (감독)
  currentRound: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
});

// TTL 인덱스
RoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RoomSchema.index({ code: 1 });
RoomSchema.index({ status: 1 });

// 가상 필드: 감독 수
RoomSchema.virtual('managerCount').get(function() {
  return this.participants.filter(p => p.role === 'manager').length;
});

// 가상 필드: 선수 수
RoomSchema.virtual('playerCount').get(function() {
  return this.participants.filter(p => p.role === 'player').length;
});

// 가상 필드: 드래프트 시작 가능 여부
RoomSchema.virtual('canStartDraft').get(function() {
  const managerCount = this.participants.filter(p => p.role === 'manager').length;
  const playerCount = this.participants.filter(p => p.role === 'player').length;
  const allReady = this.participants.every(p => p.isReady);
  
  return managerCount >= 2 && playerCount >= 1 && allReady;
});

// updatedAt 자동 업데이트
RoomSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // 참가자들의 역할이 변경되면 managers와 playerPool 자동 업데이트
  this.updateRoleBasedCollections();
  
  next();
});

// 역할 기반 컬렉션 업데이트 메서드
RoomSchema.methods.updateRoleBasedCollections = function() {
  // managers 배열 업데이트
  this.managers = this.participants
    .filter(p => p.role === 'manager')
    .map(p => ({
      userId: p.userId,
      soopId: p.soopId,
      nickname: p.nickname,
      profileImage: p.profileImage,
      position: p.position,
      assignedAt: new Date(),
      team: []
    }));

  // playerPool 업데이트 (선수 역할인 참가자들)
  this.playerPool = this.participants
    .filter(p => p.role === 'player')
    .map(p => ({
      soopId: p.soopId,
      nickname: p.nickname,
      profileImage: p.profileImage,
      position: p.position,
      addedBy: p.userId,
      isSelected: false,
      selectedBy: null,
      selectedAt: null
    }));
};

// 역할 배정 메서드
RoomSchema.methods.assignRole = function(userId, role) {
  const participant = this.participants.find(p => p.userId === userId);
  if (participant) {
    participant.role = role;
    this.updateRoleBasedCollections();
    return true;
  }
  return false;
};

// 자동 역할 배정 메서드
RoomSchema.methods.autoAssignRoles = function() {
  const participantCount = this.participants.length;
  let managerCount;
  
  // 참가자 수에 따른 감독 수 결정
  if (participantCount <= 4) {
    managerCount = 2;
  } else if (participantCount <= 8) {
    managerCount = 3;
  } else {
    managerCount = 4;
  }
  
  // 방장은 무조건 감독
  const host = this.participants.find(p => p.isHost);
  if (host) {
    host.role = 'manager';
  }
  
  // 나머지 참가자들 중에서 랜덤으로 감독 선택
  const nonHostParticipants = this.participants.filter(p => !p.isHost);
  const shuffled = nonHostParticipants.sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(managerCount - 1, shuffled.length); i++) {
    shuffled[i].role = 'manager';
  }
  
  this.updateRoleBasedCollections();
};

module.exports = mongoose.model('Room', RoomSchema);