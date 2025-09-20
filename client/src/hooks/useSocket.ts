// client/src/hooks/useSocket.ts (타이밍 문제 해결)
import { useState, useEffect, useCallback, useRef } from 'react';
import socketService from '../services/socketService';
import { Room, UserInfo, User, Role } from '../types';

interface ChatMessage {
  id: string;
  userId: string;
  nickname: string;
  message: string;
  timestamp: string;
  type: 'user' | 'system' | 'notification';
}

export const useSocket = () => {
  // 상태들
  const [room, setRoom] = useState<Room | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // 중복 실행 방지용 ref
  const connectionInitialized = useRef(false);
  const listenersRegistered = useRef(false);
  const pendingJoinRequest = useRef<{ roomCode: string; userData: User } | null>(null);

  // Socket 연결 대기 함수
  const waitForConnection = useCallback((maxWaitTime = 5000): Promise<boolean> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkConnection = () => {
        if (socketService.isConnected()) {
          console.log('✅ Socket 연결 확인됨');
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime > maxWaitTime) {
          console.log('❌ Socket 연결 대기 시간 초과');
          resolve(false);
          return;
        }
        
        setTimeout(checkConnection, 100);
      };
      
      checkConnection();
    });
  }, []);

  // Socket 초기화 및 연결
  useEffect(() => {
    if (connectionInitialized.current) {
      return;
    }

    console.log('🔌 Socket 서비스 초기화 시작');
    connectionInitialized.current = true;

    // Socket 연결 시작
    socketService.connect();

    // 초기 연결 상태 설정
    const initialConnected = socketService.isConnected();
    setIsConnected(initialConnected);
    
    console.log('🔌 초기 연결 상태:', initialConnected);

    // 연결 상태 주기적 체크
    const checkConnection = () => {
      const connected = socketService.isConnected();
      setIsConnected(prevConnected => {
        if (prevConnected !== connected) {
          console.log('🔌 연결 상태 변경:', connected);
        }
        return connected;
      });
    };

    const interval = setInterval(checkConnection, 500);

    return () => {
      clearInterval(interval);
      connectionInitialized.current = false;
    };
  }, []);

  // Socket 이벤트 리스너 등록
  useEffect(() => {
    if (listenersRegistered.current) {
      return;
    }

    console.log('📡 Socket 이벤트 리스너 등록');
    listenersRegistered.current = true;

    // 연결 관련 이벤트
    socketService.on('connected', (data: any) => {
      console.log('✅ Socket 연결됨:', data);
      setIsConnected(true);
      setError(null);
      
      // 대기 중인 방 입장 요청이 있으면 실행
      if (pendingJoinRequest.current) {
        const { roomCode, userData } = pendingJoinRequest.current;
        console.log('🔄 대기 중이던 방 입장 요청 실행:', { roomCode });
        pendingJoinRequest.current = null;
        
        setTimeout(() => {
          socketService.joinRoom(roomCode, userData);
        }, 500); // 잠깐 대기 후 실행
      }
    });

    socketService.on('disconnected', (data: any) => {
      console.log('🔌 Socket 연결 해제:', data);
      setIsConnected(false);
      setError('서버 연결이 끊어졌습니다.');
    });

    // 방 관련 이벤트
    socketService.on('room-joined', (data: any) => {
      console.log('🏠 방 입장 완료:', data);
      setRoom(data.room);
      setUserInfo(data.userInfo);
      setIsLoading(false);
      setError(null);
      pendingJoinRequest.current = null; // 성공 시 대기 요청 클리어
    });

    socketService.on('room-updated', (data: any) => {
      console.log('🔄 방 업데이트:', data);
      setRoom(data.room);
    });

    socketService.on('participant-joined', (data: any) => {
      console.log('👥 참가자 입장:', data);
    });

    socketService.on('participant-left', (data: any) => {
      console.log('👋 참가자 퇴장:', data);
    });

    // 채팅 관련 이벤트
    socketService.on('chat-message', (data: ChatMessage) => {
      console.log('💬 채팅 메시지:', data);
      setChatMessages(prev => [...prev, data]);
    });

    // 역할 배정 관련 이벤트
    socketService.on('role-assigned', (data: any) => {
      console.log('👥 역할 배정 완료:', data);
      setRoom(data.room);
      setIsLoading(false);
    });

    socketService.on('roles-auto-assigned', (data: any) => {
      console.log('🎲 자동 역할 배정 완료:', data);
      setRoom(data.room);
      setIsLoading(false);
    });

    socketService.on('draft-started', (data: any) => {
      console.log('🎯 드래프트 시작됨:', data);
      setRoom(data.room);
      setIsLoading(false);
    });

    // 에러 이벤트
    socketService.on('error', (data: any) => {
      console.log('❌ Socket 에러:', data);
      setError(data.message);
      setIsLoading(false);
      pendingJoinRequest.current = null; // 에러 시 대기 요청 클리어
    });

    return () => {
      console.log('📡 Socket 이벤트 리스너 정리');
      listenersRegistered.current = false;
      
      // 이벤트 리스너 정리
      socketService.off('connected');
      socketService.off('disconnected');
      socketService.off('room-joined');
      socketService.off('room-updated');
      socketService.off('participant-joined');
      socketService.off('participant-left');
      socketService.off('chat-message');
      socketService.off('role-assigned');
      socketService.off('roles-auto-assigned');
      socketService.off('draft-started');
      socketService.off('error');
    };
  }, []);

  // 메서드들
  const connect = useCallback(() => {
    console.log('🔌 수동 Socket 연결 요청');
    socketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    console.log('🔌 Socket 연결 해제 요청');
    socketService.disconnect();
    setRoom(null);
    setUserInfo(null);
    setIsConnected(false);
    setChatMessages([]);
    pendingJoinRequest.current = null;
  }, []);

  const joinRoom = useCallback(async (roomCode: string, userData: User) => {
    console.log('🏠 방 입장 요청:', { roomCode, userData, isConnected });
    
    setIsLoading(true);
    setError(null);

    // Socket이 연결되어 있으면 바로 실행
    if (socketService.isConnected()) {
      console.log('🚀 Socket 연결됨, 즉시 방 입장 실행');
      socketService.joinRoom(roomCode, userData);
      return;
    }

    // Socket이 연결되지 않았으면 연결 대기 후 실행
    console.log('⏳ Socket 연결 대기 중...');
    pendingJoinRequest.current = { roomCode, userData };

    // 연결 재시도
    socketService.connect();

    // 최대 5초 대기
    const connected = await waitForConnection(5000);
    
    if (connected && pendingJoinRequest.current) {
      console.log('✅ Socket 연결 완료, 방 입장 실행');
      socketService.joinRoom(roomCode, userData);
    } else {
      console.log('❌ Socket 연결 실패');
      setError('서버에 연결할 수 없습니다. 페이지를 새로고침해주세요.');
      setIsLoading(false);
      pendingJoinRequest.current = null;
    }
  }, [waitForConnection]);

  const leaveRoom = useCallback(() => {
    if (room && userInfo) {
      console.log('👋 방 퇴장 요청');
      socketService.leaveRoom(room.code, userInfo.userId);
      setRoom(null);
      setUserInfo(null);
      setChatMessages([]);
    }
    pendingJoinRequest.current = null;
  }, [room, userInfo]);

  const toggleReady = useCallback(() => {
    if (room && userInfo) {
      console.log('✅ 준비 상태 토글');
      socketService.toggleReady(room.code, userInfo.userId);
    }
  }, [room, userInfo]);

  const sendChatMessage = useCallback((message: string) => {
    if (room && userInfo) {
      console.log('💬 채팅 메시지 전송:', message);
      socketService.sendChatMessage(room.code, message, userInfo.userId);
    }
  }, [room, userInfo]);

  // 역할 배정 메서드들
  const assignRole = useCallback(async (roomCode: string, userId: string, role: Role) => {
    try {
      console.log('👥 역할 배정 요청:', { roomCode, userId, role });
      setIsLoading(true);
      socketService.assignRole(roomCode, userId, role);
    } catch (error) {
      console.error('역할 배정 실패:', error);
      setError('역할 배정에 실패했습니다.');
      setIsLoading(false);
      throw error;
    }
  }, []);

  const autoAssignRoles = useCallback(async (roomCode: string) => {
    try {
      console.log('🎲 자동 역할 배정 요청:', roomCode);
      setIsLoading(true);
      socketService.autoAssignRoles(roomCode);
    } catch (error) {
      console.error('자동 역할 배정 실패:', error);
      setError('자동 역할 배정에 실패했습니다.');
      setIsLoading(false);
      throw error;
    }
  }, []);

  const startDraft = useCallback(async (roomCode: string) => {
    try {
      console.log('🎯 드래프트 시작 요청:', roomCode);
      setIsLoading(true);
      socketService.startDraft(roomCode);
    } catch (error) {
      console.error('드래프트 시작 실패:', error);
      setError('드래프트 시작에 실패했습니다.');
      setIsLoading(false);
      throw error;
    }
  }, []);

  const updateRoomSettings = useCallback((settings: any) => {
    if (room && userInfo) {
      console.log('⚙️ 방 설정 업데이트:', settings);
      socketService.updateRoomSettings(room.code, settings, userInfo.userId);
    }
  }, [room, userInfo]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const forceReconnect = useCallback(() => {
    console.log('🔄 강제 재연결');
    pendingJoinRequest.current = null;
    socketService.forceReconnect();
  }, []);

  return {
    // 상태들
    room,
    userInfo,
    isLoading,
    isConnected,
    error,
    chatMessages,
    
    // 기본 메서드들
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    toggleReady,
    sendChatMessage,
    updateRoomSettings,
    clearError,
    forceReconnect,
    
    // 역할 배정 메서드들
    assignRole,
    autoAssignRoles,
    startDraft
  };
};