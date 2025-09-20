// server/socket/roomHandler.js (완전한 버전)
const { Room, ChatMessage } = require('../models');

class RoomHandler {
  constructor(io) {
    this.io = io;
    this.activeUsers = new Map(); // socketId -> { userId, roomCode, nickname }
  }

  // Socket 연결 시 이벤트 등록
  handleConnection(socket) {
    console.log(`🔌 사용자 연결됨: ${socket.id}`);

    // 기존 이벤트들
    socket.on('join-room', (data) => this.handleJoinRoom(socket, data));
    socket.on('leave-room', (data) => this.handleLeaveRoom(socket, data));
    socket.on('send-chat-message', (data) => this.handleChatMessage(socket, data));
    socket.on('ready-toggle', (data) => this.handleReadyToggle(socket, data));
    socket.on('update-room-settings', (data) => this.handleUpdateRoomSettings(socket, data));
    
    // 새로 추가된 역할 배정 이벤트들
    socket.on('assign-role', (data) => this.handleAssignRole(socket, data));
    socket.on('auto-assign-roles', (data) => this.handleAutoAssignRoles(socket, data));
    socket.on('start-draft', (data) => this.handleStartDraft(socket, data));
    
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  // 방 입장 처리
  async handleJoinRoom(socket, data) {
    try {
      const { roomCode, userData } = data;
      
      if (!roomCode || !userData) {
        socket.emit('error', { message: '잘못된 방 입장 데이터입니다.' });
        return;
      }

      // 방 존재 확인
      const room = await Room.findOne({ code: roomCode.toUpperCase() });
      if (!room) {
        socket.emit('error', { message: '존재하지 않는 방입니다.' });
        return;
      }

      // 이미 다른 방에 있는 경우 퇴장 처리
      const currentUser = this.activeUsers.get(socket.id);
      if (currentUser && currentUser.roomCode !== roomCode) {
        await this.handleLeaveRoom(socket, { 
          roomCode: currentUser.roomCode, 
          userId: currentUser.userId 
        });
      }

      // Socket을 방에 추가
      socket.join(roomCode);
      
      // 활성 사용자 등록
      this.activeUsers.set(socket.id, {
        userId: userData.userId,
        roomCode: roomCode,
        nickname: userData.nickname,
        soopId: userData.soopId
      });

      console.log(`👥 방 입장: ${userData.nickname} → ${roomCode}`);

      // 방 정보 업데이트된 것을 모든 참가자에게 전송
      const updatedRoom = await Room.findOne({ code: roomCode });
      this.io.to(roomCode).emit('room-updated', {
        room: this.formatRoomData(updatedRoom)
      });

      // 입장한 사용자에게 현재 방 상태 전송
      socket.emit('room-joined', {
        room: this.formatRoomData(updatedRoom),
        userInfo: {
          userId: userData.userId,
          isHost: room.host.userId === userData.userId
        }
      });

      // 시스템 메시지는 한 번만 전송
      await this.sendSystemMessage(roomCode, `${userData.nickname}님이 입장했습니다.`);

    } catch (error) {
      console.error('❌ 방 입장 오류:', error);
      socket.emit('error', { message: '방 입장 중 오류가 발생했습니다.' });
    }
  }

  // 방 퇴장 처리
  async handleLeaveRoom(socket, data) {
    try {
      const { roomCode, userId } = data;
      const currentUser = this.activeUsers.get(socket.id);
      
      if (!currentUser) {
        return; // 이미 퇴장한 사용자
      }

      console.log(`👋 방 퇴장: ${currentUser.nickname} (${currentUser.userId})`);

      // Socket을 방에서 제거
      socket.leave(roomCode || currentUser.roomCode);
      
      // 활성 사용자 목록에서 제거
      this.activeUsers.delete(socket.id);

      const finalRoomCode = roomCode || currentUser.roomCode;

      // 방의 다른 사용자들에게 퇴장 알림
      socket.to(finalRoomCode).emit('participant-left', {
        participantId: currentUser.userId,
        message: `${currentUser.nickname}님이 퇴장했습니다.`
      });

      // 시스템 메시지 전송
      await this.sendSystemMessage(finalRoomCode, `${currentUser.nickname}님이 퇴장했습니다.`);

      // 빈 방 확인 및 정리
      await this.checkEmptyRoom(finalRoomCode);

    } catch (error) {
      console.error('❌ 방 퇴장 오류:', error);
    }
  }

  // 채팅 메시지 처리
  async handleChatMessage(socket, data) {
    try {
      const { roomCode, message, userId } = data;
      const currentUser = this.activeUsers.get(socket.id);
      
      if (!currentUser) {
        socket.emit('error', { message: '방에 입장하지 않은 상태입니다.' });
        return;
      }

      if (!message.trim()) {
        socket.emit('error', { message: '메시지를 입력해주세요.' });
        return;
      }

      console.log('💬 채팅 전송:', { roomCode, message, userId });

      // 채팅 메시지 저장
      const chatMessage = new ChatMessage({
        roomCode: roomCode,
        userId: userId,
        nickname: currentUser.nickname,
        message: message.trim(),
        type: 'user'
      });

      await chatMessage.save();

      // 방의 모든 사용자에게 메시지 전송
      this.io.to(roomCode).emit('chat-message', {
        id: chatMessage._id,
        userId: userId,
        nickname: currentUser.nickname,
        message: message.trim(),
        timestamp: chatMessage.timestamp.toISOString(),
        type: 'user'
      });

    } catch (error) {
      console.error('❌ 채팅 전송 오류:', error);
      socket.emit('error', { message: '메시지 전송 중 오류가 발생했습니다.' });
    }
  }

  // 준비 상태 토글
  async handleReadyToggle(socket, data) {
    try {
      const { roomCode, userId } = data;
      const currentUser = this.activeUsers.get(socket.id);
      
      if (!currentUser) {
        socket.emit('error', { message: '방에 입장하지 않은 상태입니다.' });
        return;
      }

      // 방 정보 조회 및 참가자 상태 업데이트
      const room = await Room.findOne({ code: roomCode });
      if (!room) {
        socket.emit('error', { message: '방을 찾을 수 없습니다.' });
        return;
      }

      // 해당 참가자의 준비 상태 토글
      const participant = room.participants.find(p => p.userId === userId);
      if (participant) {
        participant.isReady = !participant.isReady;
        await room.save();

        console.log(`✅ 준비 상태 변경: ${currentUser.nickname} → ${participant.isReady}`);

        // 방의 모든 사용자에게 업데이트 전송 (메시지 없이)
        this.io.to(roomCode).emit('room-updated', {
          room: this.formatRoomData(room)
        });
      }

    } catch (error) {
      console.error('❌ 준비 상태 토글 오류:', error);
      socket.emit('error', { message: '준비 상태 변경 중 오류가 발생했습니다.' });
    }
  }

  // 방 설정 업데이트 (방장만)
  async handleUpdateRoomSettings(socket, data) {
    try {
      const { roomCode, settings, userId } = data;
      const currentUser = this.activeUsers.get(socket.id);
      
      if (!currentUser) {
        socket.emit('error', { message: '방에 입장하지 않은 상태입니다.' });
        return;
      }

      const room = await Room.findOne({ code: roomCode });
      if (!room) {
        socket.emit('error', { message: '방을 찾을 수 없습니다.' });
        return;
      }

      // 방장 권한 확인
      if (room.host.userId !== userId) {
        socket.emit('error', { message: '방장만 설정을 변경할 수 있습니다.' });
        return;
      }

      // 설정 업데이트
      if (settings.title) room.title = settings.title.trim();
      if (settings.draftType) room.settings.draftType = settings.draftType;
      if (settings.timePerTurn) room.settings.timePerTurn = settings.timePerTurn;
      if (settings.maxParticipants) room.settings.maxParticipants = settings.maxParticipants;

      await room.save();

      console.log(`⚙️ 방 설정 변경 [${roomCode}]: ${JSON.stringify(settings)}`);

      // 방의 모든 사용자에게 업데이트 전송
      this.io.to(roomCode).emit('room-updated', {
        room: this.formatRoomData(room),
        message: '방 설정이 업데이트되었습니다.'
      });

    } catch (error) {
      console.error('❌ 방 설정 업데이트 오류:', error);
      socket.emit('error', { message: '방 설정 변경 중 오류가 발생했습니다.' });
    }
  }

  // 역할 배정 처리 (방장만)
  async handleAssignRole(socket, data) {
    try {
      const { roomCode, userId, role } = data;
      const currentUser = this.activeUsers.get(socket.id);
      
      if (!currentUser) {
        socket.emit('error', { message: '방에 입장하지 않은 상태입니다.' });
        return;
      }

      const room = await Room.findOne({ code: roomCode });
      if (!room) {
        socket.emit('error', { message: '방을 찾을 수 없습니다.' });
        return;
      }

      // 방장 권한 확인
      if (room.host.userId !== currentUser.userId) {
        socket.emit('error', { message: '방장만 역할을 배정할 수 있습니다.' });
        return;
      }

      // 역할 유효성 검사
      if (!['manager', 'player'].includes(role)) {
        socket.emit('error', { message: '올바른 역할을 선택해주세요.' });
        return;
      }

      // 역할 배정 실행
      const success = room.assignRole(userId, role);
      if (!success) {
        socket.emit('error', { message: '해당 참가자를 찾을 수 없습니다.' });
        return;
      }

      await room.save();

      console.log(`👥 역할 배정: ${userId} → ${role} (방: ${roomCode})`);

      // 방의 모든 사용자에게 업데이트 전송
      this.io.to(roomCode).emit('role-assigned', {
        room: this.formatRoomData(room),
        assignedUser: { userId, role },
        message: `역할이 배정되었습니다.`
      });

    } catch (error) {
      console.error('❌ 역할 배정 오류:', error);
      socket.emit('error', { message: '역할 배정 중 오류가 발생했습니다.' });
    }
  }

  // 자동 역할 배정 처리 (방장만)
  async handleAutoAssignRoles(socket, data) {
    try {
      const { roomCode } = data;
      const currentUser = this.activeUsers.get(socket.id);
      
      if (!currentUser) {
        socket.emit('error', { message: '방에 입장하지 않은 상태입니다.' });
        return;
      }

      const room = await Room.findOne({ code: roomCode });
      if (!room) {
        socket.emit('error', { message: '방을 찾을 수 없습니다.' });
        return;
      }

      // 방장 권한 확인
      if (room.host.userId !== currentUser.userId) {
        socket.emit('error', { message: '방장만 자동 역할 배정을 할 수 있습니다.' });
        return;
      }

      // 자동 역할 배정 실행
      room.autoAssignRoles();
      await room.save();

      console.log(`🎲 자동 역할 배정 완료 (방: ${roomCode})`);

      // 방의 모든 사용자에게 업데이트 전송
      this.io.to(roomCode).emit('roles-auto-assigned', {
        room: this.formatRoomData(room),
        message: '자동 역할 배정이 완료되었습니다!'
      });

      // 시스템 메시지 전송
      await this.sendSystemMessage(roomCode, '🎲 자동 역할 배정이 완료되었습니다!');

    } catch (error) {
      console.error('❌ 자동 역할 배정 오류:', error);
      socket.emit('error', { message: '자동 역할 배정 중 오류가 발생했습니다.' });
    }
  }

  // 드래프트 시작 처리 (방장만)
  async handleStartDraft(socket, data) {
    try {
      const { roomCode } = data;
      const currentUser = this.activeUsers.get(socket.id);
      
      if (!currentUser) {
        socket.emit('error', { message: '방에 입장하지 않은 상태입니다.' });
        return;
      }

      const room = await Room.findOne({ code: roomCode });
      if (!room) {
        socket.emit('error', { message: '방을 찾을 수 없습니다.' });
        return;
      }

      // 방장 권한 확인
      if (room.host.userId !== currentUser.userId) {
        socket.emit('error', { message: '방장만 드래프트를 시작할 수 있습니다.' });
        return;
      }

      // 드래프트 시작 조건 확인
      const managerCount = room.participants.filter(p => p.role === 'manager').length;
      const playerCount = room.participants.filter(p => p.role === 'player').length;
      const allReady = room.participants.every(p => p.isReady);

      if (managerCount < 2) {
        socket.emit('error', { 
          message: `감독이 최소 2명 이상 필요합니다. (현재: ${managerCount}명)` 
        });
        return;
      }

      if (playerCount < 1) {
        socket.emit('error', { 
          message: `선수가 최소 1명 이상 필요합니다. (현재: ${playerCount}명)` 
        });
        return;
      }

      if (!allReady) {
        socket.emit('error', { message: '모든 참가자가 준비 상태여야 합니다.' });
        return;
      }

      // 드래프트 시작
      room.status = 'drafting';
      await room.save();

      console.log(`🎯 드래프트 시작 (방: ${roomCode}) - 감독: ${managerCount}명, 선수: ${playerCount}명`);

      // 방의 모든 사용자에게 드래프트 시작 알림
      this.io.to(roomCode).emit('draft-started', {
        room: this.formatRoomData(room),
        message: '🎯 드래프트가 시작되었습니다!'
      });

      // 시스템 메시지 전송
      await this.sendSystemMessage(roomCode, '🎯 드래프트가 시작되었습니다! 감독들은 순서대로 선수를 선택해주세요.');

    } catch (error) {
      console.error('❌ 드래프트 시작 오류:', error);
      socket.emit('error', { message: '드래프트 시작 중 오류가 발생했습니다.' });
    }
  }

  // 연결 해제 처리
  async handleDisconnect(socket) {
    try {
      const currentUser = this.activeUsers.get(socket.id);
      
      if (currentUser) {
        console.log(`🔌 연결 해제: ${currentUser.nickname} (${socket.id})`);
        
        // 방 퇴장 처리
        await this.handleLeaveRoom(socket, {
          roomCode: currentUser.roomCode,
          userId: currentUser.userId
        });
      }
    } catch (error) {
      console.error('❌ 연결 해제 처리 오류:', error);
    }
  }

  // 시스템 메시지 전송
  async sendSystemMessage(roomCode, message) {
    try {
      const chatMessage = new ChatMessage({
        roomCode: roomCode,
        userId: 'system',
        nickname: '시스템',
        message: message,
        type: 'system'
      });

      await chatMessage.save();

      this.io.to(roomCode).emit('chat-message', {
        id: chatMessage._id,
        userId: 'system',
        nickname: '시스템',
        message: message,
        timestamp: chatMessage.timestamp.toISOString(),
        type: 'system'
      });
    } catch (error) {
      console.error('❌ 시스템 메시지 전송 오류:', error);
    }
  }

  // 빈 방 확인 및 정리
  async checkEmptyRoom(roomCode) {
    try {
      // 해당 방에 남은 사용자가 있는지 확인
      const roomUsers = Array.from(this.activeUsers.values())
        .filter(user => user.roomCode === roomCode);

      if (roomUsers.length === 0) {
        console.log(`🗑️ 빈 방 정리: ${roomCode}`);
        
        // 방 상태를 abandoned로 변경 (즉시 삭제하지 않고 기록 보존)
        await Room.findOneAndUpdate(
          { code: roomCode },
          { status: 'abandoned', updatedAt: new Date() }
        );
      }
    } catch (error) {
      console.error('❌ 빈 방 정리 오류:', error);
    }
  }

  // 방 데이터 포맷팅
  formatRoomData(room) {
    if (!room) return null;

    return {
      id: room._id,
      code: room.code,
      title: room.title,
      host: room.host,
      settings: room.settings,
      status: room.status,
      participants: room.participants,
      participantCount: room.participants.length,
      managers: room.managers || [],
      playerPool: room.playerPool || [],
      managerCount: room.participants.filter(p => p.role === 'manager').length,
      playerCount: room.participants.filter(p => p.role === 'player').length,
      canStartDraft: room.canStartDraft,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString()
    };
  }

  // 활성 사용자 통계
  getActiveStats() {
    const roomCounts = {};
    Array.from(this.activeUsers.values()).forEach(user => {
      roomCounts[user.roomCode] = (roomCounts[user.roomCode] || 0) + 1;
    });

    return {
      totalUsers: this.activeUsers.size,
      activeRooms: Object.keys(roomCounts).length,
      roomCounts
    };
  }
}

module.exports = RoomHandler;