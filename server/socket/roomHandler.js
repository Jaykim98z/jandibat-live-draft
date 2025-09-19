// server/socket/roomHandler.js
const { Room, ChatMessage } = require('../models');

class RoomHandler {
  constructor(io) {
    this.io = io;
    this.activeUsers = new Map(); // socketId -> { userId, roomCode, nickname }
  }

  // Socket 연결 시 이벤트 등록
  handleConnection(socket) {
    console.log(`🔌 사용자 연결됨: ${socket.id}`);

    // 방 입장
    socket.on('join-room', (data) => this.handleJoinRoom(socket, data));
    
    // 방 퇴장
    socket.on('leave-room', (data) => this.handleLeaveRoom(socket, data));
    
    // 채팅 메시지
    socket.on('send-chat-message', (data) => this.handleChatMessage(socket, data));
    
    // 준비 상태 토글
    socket.on('ready-toggle', (data) => this.handleReadyToggle(socket, data));
    
    // 방 설정 업데이트 (방장만)
    socket.on('update-room-settings', (data) => this.handleUpdateRoomSettings(socket, data));
    
    // 연결 해제
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
        // message 제거 - 중복 방지
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
      
      if (!currentUser) return;

      // Socket을 방에서 제거
      socket.leave(roomCode);
      
      // 활성 사용자에서 제거
      this.activeUsers.delete(socket.id);

      console.log(`👋 방 퇴장: ${currentUser.nickname} ← ${roomCode}`);

      // 방에 남은 사람들에게 퇴장 알림
      this.io.to(roomCode).emit('participant-left', {
        userId: userId,
        nickname: currentUser.nickname
        // message 제거 - 중복 방지
      });

      // 시스템 메시지는 한 번만 전송
      await this.sendSystemMessage(roomCode, `${currentUser.nickname}님이 퇴장했습니다.`);

      // 방이 비었는지 확인 (필요시 방 삭제)
      await this.checkEmptyRoom(roomCode);

    } catch (error) {
      console.error('❌ 방 퇴장 오류:', error);
    }
  }

  // 채팅 메시지 처리
  async handleChatMessage(socket, data) {
    try {
      const { roomCode, message, userId } = data;
      const currentUser = this.activeUsers.get(socket.id);
      
      if (!currentUser || !message?.trim()) {
        socket.emit('error', { message: '잘못된 메시지입니다.' });
        return;
      }

      // 메시지 길이 제한
      if (message.length > 500) {
        socket.emit('error', { message: '메시지가 너무 깁니다. (최대 500자)' });
        return;
      }

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

      console.log(`💬 채팅 [${roomCode}] ${currentUser.nickname}: ${message.trim()}`);

    } catch (error) {
      console.error('❌ 채팅 메시지 오류:', error);
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
          // message 제거 - 준비 상태 변경은 조용히 처리
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
      playerPool: room.playerPool || [],
      managers: room.managers || [],
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