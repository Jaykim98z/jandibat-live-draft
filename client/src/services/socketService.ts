// client/src/services/socketService.ts (완전한 버전)
import { io, Socket } from 'socket.io-client';
import { User } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  // Socket 연결
  connect(): void {
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3000';
    
    if (this.socket) {
      console.log('🔌 Socket이 이미 연결되어 있습니다.');
      return;
    }

    console.log('🔌 Socket 연결 중...', serverUrl);

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      forceNew: true
    });

    this.setupListeners();
  }

  // Socket 연결 상태 확인
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Socket 이벤트 리스너 설정
  private setupListeners(): void {
    if (!this.socket) return;

    // 연결 관련 이벤트
    this.socket.on('connect', () => {
      console.log('✅ Socket 연결 성공:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.emit('connected', { socketId: this.socket?.id });
    });

    this.socket.on('connected', (data) => {
      console.log('✅ 서버 연결 확인:', data);
      this.emit('connected', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket 연결 해제:', reason);
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket 연결 오류:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ 최대 재연결 시도 횟수 초과');
        this.emit('error', { message: '서버 연결에 실패했습니다. 페이지를 새로고침해주세요.' });
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket 재연결 성공:', attemptNumber);
      this.reconnectAttempts = 0;
      this.emit('reconnected', { attemptNumber });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket 재연결 실패');
      this.emit('error', { message: '서버 재연결에 실패했습니다.' });
    });

    // 방 관련 이벤트
    this.socket.on('room-joined', (data) => {
      console.log('🏠 방 입장 완료:', data);
      this.emit('room-joined', data);
    });

    this.socket.on('room-updated', (data) => {
      console.log('🔄 방 업데이트:', data);
      this.emit('room-updated', data);
    });

    this.socket.on('participant-joined', (data) => {
      console.log('👥 참가자 입장:', data);
      this.emit('participant-joined', data);
    });

    this.socket.on('participant-left', (data) => {
      console.log('👋 참가자 퇴장:', data);
      this.emit('participant-left', data);
    });

    // 채팅 관련 이벤트
    this.socket.on('chat-message', (data) => {
      console.log('💬 채팅 메시지:', data);
      this.emit('chat-message', data);
    });

    // 역할 배정 관련 이벤트
    this.socket.on('role-assigned', (data) => {
      console.log('👥 역할 배정 완료:', data);
      this.emit('role-assigned', data);
    });

    this.socket.on('roles-auto-assigned', (data) => {
      console.log('🎲 자동 역할 배정 완료:', data);
      this.emit('roles-auto-assigned', data);
    });

    // 드래프트 관련 이벤트
    this.socket.on('draft-started', (data) => {
      console.log('🎯 드래프트 시작됨:', data);
      this.emit('draft-started', data);
    });

    this.socket.on('turn-changed', (data) => {
      console.log('🔄 턴 변경:', data);
      this.emit('turn-changed', data);
    });

    this.socket.on('player-selected', (data) => {
      console.log('⚽ 선수 선택됨:', data);
      this.emit('player-selected', data);
    });

    this.socket.on('draft-completed', (data) => {
      console.log('🏆 드래프트 완료:', data);
      this.emit('draft-completed', data);
    });

    // 에러 이벤트
    this.socket.on('error', (data) => {
      console.log('❌ Socket 에러:', data);
      this.emit('error', data);
    });
  }

  // 방 입장
  joinRoom(roomCode: string, userData: User): void {
    if (!this.isConnected()) {
      this.emit('error', { message: 'Socket이 연결되지 않았습니다.' });
      return;
    }

    if (!roomCode || !userData) {
      this.emit('error', { message: '방 코드와 사용자 데이터가 필요합니다.' });
      return;
    }

    console.log('🏠 방 입장 요청:', { roomCode, userData });
    this.socket?.emit('join-room', { roomCode: roomCode.toUpperCase(), userData });
  }

  // 방 퇴장
  leaveRoom(roomCode: string, userId: string): void {
    if (!this.isConnected()) {
      this.emit('error', { message: 'Socket이 연결되지 않았습니다.' });
      return;
    }

    if (!roomCode || !userId) {
      this.emit('error', { message: '방 코드와 사용자 ID가 필요합니다.' });
      return;
    }

    console.log('🚪 방 퇴장 요청:', { roomCode, userId });
    this.socket?.emit('leave-room', { roomCode, userId });
  }

  // 채팅 메시지 전송
  sendChatMessage(roomCode: string, message: string, userId: string): void {
    if (!this.isConnected()) {
      this.emit('error', { message: 'Socket이 연결되지 않았습니다.' });
      return;
    }

    if (!roomCode || !userId) {
      this.emit('error', { message: '방 코드와 사용자 ID가 필요합니다.' });
      return;
    }

    if (!message.trim()) {
      this.emit('error', { message: '메시지를 입력해주세요.' });
      return;
    }

    console.log('💬 채팅 전송:', { roomCode, message, userId });
    this.socket?.emit('send-chat-message', { roomCode, message: message.trim(), userId });
  }

  // 준비 상태 토글
  toggleReady(roomCode: string, userId: string): void {
    if (!this.isConnected()) {
      this.emit('error', { message: 'Socket이 연결되지 않았습니다.' });
      return;
    }

    if (!roomCode || !userId) {
      this.emit('error', { message: '방 코드와 사용자 ID가 필요합니다.' });
      return;
    }

    console.log('✅ 준비 상태 토글:', { roomCode, userId });
    this.socket?.emit('ready-toggle', { roomCode, userId });
  }

  // 방 설정 업데이트 (방장만)
  updateRoomSettings(roomCode: string, settings: any, userId: string): void {
    if (!this.isConnected()) {
      this.emit('error', { message: 'Socket이 연결되지 않았습니다.' });
      return;
    }

    if (!roomCode || !userId) {
      this.emit('error', { message: '방 코드와 사용자 ID가 필요합니다.' });
      return;
    }

    console.log('⚙️ 방 설정 업데이트:', { roomCode, settings, userId });
    this.socket?.emit('update-room-settings', { roomCode, settings, userId });
  }

  // 역할 배정 (방장만)
  assignRole(roomCode: string, userId: string, role: 'manager' | 'player'): void {
    if (!this.isConnected()) {
      this.emit('error', { message: 'Socket이 연결되지 않았습니다.' });
      return;
    }

    if (!roomCode || !userId || !role) {
      this.emit('error', { message: '방 코드, 사용자 ID, 역할이 필요합니다.' });
      return;
    }

    if (!['manager', 'player'].includes(role)) {
      this.emit('error', { message: '올바른 역할을 선택해주세요.' });
      return;
    }

    console.log('👥 역할 배정:', { roomCode, userId, role });
    this.socket?.emit('assign-role', { roomCode, userId, role });
  }

  // 자동 역할 배정 (방장만)
  autoAssignRoles(roomCode: string): void {
    if (!this.isConnected()) {
      this.emit('error', { message: 'Socket이 연결되지 않았습니다.' });
      return;
    }

    if (!roomCode) {
      this.emit('error', { message: '방 코드가 필요합니다.' });
      return;
    }

    console.log('🎲 자동 역할 배정:', { roomCode });
    this.socket?.emit('auto-assign-roles', { roomCode });
  }

  // 드래프트 시작 (방장만)
  startDraft(roomCode: string): void {
    if (!this.isConnected()) {
      this.emit('error', { message: 'Socket이 연결되지 않았습니다.' });
      return;
    }

    if (!roomCode) {
      this.emit('error', { message: '방 코드가 필요합니다.' });
      return;
    }

    console.log('🎯 드래프트 시작:', { roomCode });
    this.socket?.emit('start-draft', { roomCode });
  }

  // 선수 선택 (감독만, 드래프트 중)
  selectPlayer(roomCode: string, managerId: string, playerId: string): void {
    if (!this.isConnected()) {
      this.emit('error', { message: 'Socket이 연결되지 않았습니다.' });
      return;
    }

    if (!roomCode || !managerId || !playerId) {
      this.emit('error', { message: '방 코드, 감독 ID, 선수 ID가 필요합니다.' });
      return;
    }

    console.log('⚽ 선수 선택:', { roomCode, managerId, playerId });
    this.socket?.emit('select-player', { roomCode, managerId, playerId });
  }

  // 드래프트 턴 패스 (감독만)
  passTurn(roomCode: string, managerId: string): void {
    if (!this.isConnected()) {
      this.emit('error', { message: 'Socket이 연결되지 않았습니다.' });
      return;
    }

    if (!roomCode || !managerId) {
      this.emit('error', { message: '방 코드와 감독 ID가 필요합니다.' });
      return;
    }

    console.log('⏭️ 턴 패스:', { roomCode, managerId });
    this.socket?.emit('pass-turn', { roomCode, managerId });
  }

  // 이벤트 리스너 등록
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  // 이벤트 리스너 제거
  off(event: string, callback?: Function): void {
    if (!callback) {
      this.eventListeners.delete(event);
      return;
    }

    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 이벤트 발생
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ 이벤트 리스너 에러 [${event}]:`, error);
        }
      });
    }
  }

  // 연결 해제
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Socket 연결 해제');
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventListeners.clear();
    this.reconnectAttempts = 0;
  }

  // 강제 재연결
  forceReconnect(): void {
    console.log('🔄 Socket 강제 재연결');
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  // 디버깅용 - 현재 상태 조회
  getStatus() {
    return {
      connected: this.isConnected(),
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
      activeListeners: Array.from(this.eventListeners.keys()),
      maxReconnectAttempts: this.maxReconnectAttempts,
      serverUrl: process.env.REACT_APP_SERVER_URL || 'http://localhost:3000'
    };
  }

  // 디버깅용 - 이벤트 리스너 목록 조회
  getEventListeners() {
    const listeners: { [key: string]: number } = {};
    this.eventListeners.forEach((value, key) => {
      listeners[key] = value.length;
    });
    return listeners;
  }

  // 연결 테스트
  testConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.isConnected()) {
        resolve(false);
        return;
      }

      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);

      this.socket?.emit('ping', { timestamp: Date.now() }, (response: any) => {
        clearTimeout(timeout);
        resolve(!!response);
      });
    });
  }
}

// 싱글톤 인스턴스
const socketService = new SocketService();

export default socketService;