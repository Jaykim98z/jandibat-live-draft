// client/src/services/socketService.ts
import { io, Socket } from 'socket.io-client';
import { Room, User } from '../types';

interface ChatMessage {
  id: string;
  userId: string;
  nickname: string;
  message: string;
  timestamp: string;
  type: 'user' | 'system' | 'notification';
}

interface SocketEvents {
  // 서버에서 클라이언트로
  'connected': (data: { message: string; socketId: string; timestamp: string }) => void;
  'room-joined': (data: { room: Room; userInfo: { userId: string; isHost: boolean } }) => void;
  'room-updated': (data: { room: Room; message?: string }) => void;
  'participant-left': (data: { userId: string; nickname: string; message: string }) => void;
  'chat-message': (message: ChatMessage) => void;
  'error': (error: { message: string; code?: string }) => void;
}

interface EmitEvents {
  // 클라이언트에서 서버로
  'join-room': (data: { roomCode: string; userData: User }) => void;
  'leave-room': (data: { roomCode: string; userId: string }) => void;
  'send-chat-message': (data: { roomCode: string; message: string; userId: string }) => void;
  'ready-toggle': (data: { roomCode: string; userId: string }) => void;
  'update-room-settings': (data: { roomCode: string; settings: any; userId: string }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  
  // 이벤트 리스너들
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.connect();
  }

  // 서버 연결
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || this.isConnected()) {
        resolve();
        return;
      }

      this.isConnecting = true;
      
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3000';
      
      console.log('🔌 Socket 서버 연결 중...', serverUrl);
      
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      // 연결 성공
      this.socket.on('connect', () => {
        console.log('✅ Socket 서버 연결 성공:', this.socket?.id);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connection-status', { connected: true, socketId: this.socket?.id });
        resolve();
      });

      // 연결 실패
      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket 연결 실패:', error);
        this.isConnecting = false;
        this.emit('connection-status', { connected: false, error: error.message });
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
        } else {
          reject(new Error('최대 재연결 시도 횟수를 초과했습니다.'));
        }
      });

      // 연결 해제
      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket 연결 해제:', reason);
        this.emit('connection-status', { connected: false, reason });
        
        // 자동 재연결 (서버에서 끊은 경우가 아니라면)
        if (reason === 'io server disconnect') {
          // 서버에서 연결을 끊은 경우 수동으로 재연결
          this.connect();
        }
      });

      // 서버 이벤트 리스너 등록
      this.registerServerEvents();
    });
  }

  // 서버 이벤트 리스너 등록
  private registerServerEvents() {
    if (!this.socket) return;

    // 연결 확인
    this.socket.on('connected', (data) => {
      console.log('📡 서버 연결 확인:', data.message);
      this.emit('connected', data);
    });

    // 방 입장 성공
    this.socket.on('room-joined', (data) => {
      console.log('🏠 방 입장 성공:', data);
      this.emit('room-joined', data);
    });

    // 방 정보 업데이트
    this.socket.on('room-updated', (data) => {
      console.log('🔄 방 정보 업데이트:', data);
      this.emit('room-updated', data);
    });

    // 참가자 퇴장
    this.socket.on('participant-left', (data) => {
      console.log('👋 참가자 퇴장:', data);
      this.emit('participant-left', data);
    });

    // 채팅 메시지
    this.socket.on('chat-message', (message) => {
      console.log('💬 채팅 메시지:', message);
      this.emit('chat-message', message);
    });

    // 에러
    this.socket.on('error', (error) => {
      console.error('❌ Socket 에러:', error);
      this.emit('error', error);
    });
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // 방 입장
  joinRoom(roomCode: string, userData: User): void {
    if (!this.isConnected()) {
      console.error('❌ Socket이 연결되지 않았습니다.');
      this.emit('error', { message: 'Socket이 연결되지 않았습니다.' });
      return;
    }

    console.log('🏠 방 입장 시도:', { roomCode, userData });
    this.socket?.emit('join-room', { roomCode, userData });
  }

  // 방 퇴장
  leaveRoom(roomCode: string, userId: string): void {
    if (!this.isConnected()) return;

    console.log('👋 방 퇴장:', { roomCode, userId });
    this.socket?.emit('leave-room', { roomCode, userId });
  }

  // 채팅 메시지 전송
  sendChatMessage(roomCode: string, message: string, userId: string): void {
    if (!this.isConnected()) {
      this.emit('error', { message: 'Socket이 연결되지 않았습니다.' });
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

    console.log('✅ 준비 상태 토글:', { roomCode, userId });
    this.socket?.emit('ready-toggle', { roomCode, userId });
  }

  // 방 설정 업데이트 (방장만)
  updateRoomSettings(roomCode: string, settings: any, userId: string): void {
    if (!this.isConnected()) {
      this.emit('error', { message: 'Socket이 연결되지 않았습니다.' });
      return;
    }

    console.log('⚙️ 방 설정 업데이트:', { roomCode, settings, userId });
    this.socket?.emit('update-room-settings', { roomCode, settings, userId });
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
  }

  // 디버깅용 - 현재 상태 조회
  getStatus() {
    return {
      connected: this.isConnected(),
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
      activeListeners: Array.from(this.eventListeners.keys())
    };
  }
}

// 싱글톤 인스턴스
const socketService = new SocketService();

export default socketService;