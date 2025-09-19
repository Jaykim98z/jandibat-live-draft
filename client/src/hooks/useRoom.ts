// client/src/hooks/useRoom.ts (최종 수정 버전)
import { useState, useEffect, useCallback, useRef } from 'react';
import { Room, User } from '../types';
import socketService from '../services/socketService';

interface ChatMessage {
  id: string;
  userId: string;
  nickname: string;
  message: string;
  timestamp: string;
  type: 'user' | 'system' | 'notification';
}

interface UseRoomState {
  room: Room | null;
  messages: ChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  userInfo: { userId: string; isHost: boolean } | null;
}

interface UseRoomActions {
  joinRoom: (roomCode: string, userData: User) => void;
  leaveRoom: () => void;
  sendMessage: (message: string) => void;
  toggleReady: () => void;
  updateRoomSettings: (settings: any) => void;
  clearError: () => void;
  clearMessages: () => void;
}

export function useRoom(): [UseRoomState, UseRoomActions] {
  const [state, setState] = useState<UseRoomState>({
    room: null,
    messages: [],
    isConnected: false,
    isLoading: false,
    error: null,
    userInfo: null
  });

  const mountedRef = useRef(true);
  const currentRoomCode = useRef<string | null>(null);
  const joinAttemptRef = useRef<boolean>(false);
  const listenersRegistered = useRef<boolean>(false);

  // 안전한 상태 업데이트 함수
  const safeSetState = useCallback((updater: (prev: UseRoomState) => UseRoomState) => {
    if (mountedRef.current) {
      setState(updater);
    }
  }, []);

  // Socket 이벤트 핸들러들 (useCallback으로 안정화)
  const handleConnectionStatus = useCallback((data: { connected: boolean; error?: string; reason?: string }) => {
    console.log('🔌 연결 상태 변경:', data);
    safeSetState(prev => ({
      ...prev,
      isConnected: data.connected,
      error: data.connected ? null : (data.error || data.reason || '연결이 끊어졌습니다.')
    }));
  }, [safeSetState]);

  const handleRoomJoined = useCallback((data: { room: Room; userInfo: { userId: string; isHost: boolean } }) => {
    console.log('🏠 방 입장 성공 - 상태 업데이트:', data);
    
    if (!mountedRef.current) {
      console.log('❌ 컴포넌트가 언마운트됨, 상태 업데이트 취소');
      return;
    }
    
    currentRoomCode.current = data.room.code;
    joinAttemptRef.current = false;
    
    setState(prev => {
      const newState = {
        ...prev,
        room: data.room,
        userInfo: data.userInfo,
        isLoading: false,
        error: null
      };
      console.log('✅ 상태 업데이트 완료:', { 
        roomCode: newState.room?.code, 
        userId: newState.userInfo?.userId 
      });
      return newState;
    });
  }, []);

  const handleRoomUpdated = useCallback((data: { room: Room; message?: string }) => {
    console.log('🔄 방 정보 업데이트:', data);
    
    if (!mountedRef.current) return;
    
    setState(prev => ({
      ...prev,
      room: data.room,
      error: null
    }));

    // room-updated에서는 시스템 메시지를 추가하지 않음 (중복 방지)
    // 시스템 메시지는 chat-message 이벤트에서만 처리
  }, []);

  const handleParticipantLeft = useCallback((data: { userId: string; nickname: string; message?: string }) => {
    console.log('👋 참가자 퇴장:', data);
    
    if (!mountedRef.current) return;
    
    // participant-left에서는 시스템 메시지를 추가하지 않음 (중복 방지)
    // 시스템 메시지는 chat-message 이벤트에서만 처리
  }, []);

  const handleChatMessage = useCallback((message: ChatMessage) => {
    console.log('💬 채팅 메시지 수신:', message);
    
    if (!mountedRef.current) return;
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));
  }, []);

  const handleError = useCallback((error: { message: string; code?: string }) => {
    console.error('❌ Socket 에러:', error);
    
    if (!mountedRef.current) return;
    
    setState(prev => ({
      ...prev,
      error: error.message,
      isLoading: false
    }));
  }, []);

  // Socket 이벤트 등록 (한 번만 실행)
  useEffect(() => {
    if (listenersRegistered.current) {
      console.log('⚠️ 이벤트 리스너가 이미 등록되어 있습니다.');
      return;
    }

    console.log('📡 Socket 이벤트 리스너 등록');
    listenersRegistered.current = true;
    
    socketService.on('connection-status', handleConnectionStatus);
    socketService.on('room-joined', handleRoomJoined);
    socketService.on('room-updated', handleRoomUpdated);
    socketService.on('participant-left', handleParticipantLeft);
    socketService.on('chat-message', handleChatMessage);
    socketService.on('error', handleError);

    // 초기 연결 상태 설정
    setState(prev => ({
      ...prev,
      isConnected: socketService.isConnected()
    }));

    return () => {
      console.log('📡 Socket 이벤트 리스너 정리');
      listenersRegistered.current = false;
      socketService.off('connection-status', handleConnectionStatus);
      socketService.off('room-joined', handleRoomJoined);
      socketService.off('room-updated', handleRoomUpdated);
      socketService.off('participant-left', handleParticipantLeft);
      socketService.off('chat-message', handleChatMessage);
      socketService.off('error', handleError);
    };
  }, []); // 빈 의존성 배열로 한 번만 실행

  // 컴포넌트 언마운트 처리
  useEffect(() => {
    return () => {
      console.log('🗑️ useRoom 컴포넌트 언마운트');
      mountedRef.current = false;
    };
  }, []);

  // Actions
  const joinRoom = useCallback((roomCode: string, userData: User) => {
    console.log('🏠 방 입장 요청:', { roomCode, userData });
    
    // 중복 입장 방지
    if (joinAttemptRef.current) {
      console.log('⚠️ 이미 방 입장 시도 중입니다.');
      return;
    }
    
    joinAttemptRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    // Socket이 연결될 때까지 대기
    const tryJoin = () => {
      if (socketService.isConnected()) {
        console.log('🚀 Socket 연결됨, 방 입장 시도');
        socketService.joinRoom(roomCode, userData);
      } else {
        console.log('🔄 Socket 연결 대기 중...');
        setTimeout(tryJoin, 500);
      }
    };
    
    tryJoin();
  }, []);

  const leaveRoom = useCallback(() => {
    if (currentRoomCode.current && state.userInfo?.userId) {
      console.log('👋 방 퇴장 요청');
      socketService.leaveRoom(currentRoomCode.current, state.userInfo.userId);
      currentRoomCode.current = null;
      joinAttemptRef.current = false;
      setState(prev => ({
        ...prev,
        room: null,
        userInfo: null,
        messages: [],
        error: null,
        isLoading: false
      }));
    }
  }, [state.userInfo?.userId]);

  const sendMessage = useCallback((message: string) => {
    if (currentRoomCode.current && state.userInfo?.userId) {
      socketService.sendChatMessage(currentRoomCode.current, message, state.userInfo.userId);
    }
  }, [state.userInfo?.userId]);

  const toggleReady = useCallback(() => {
    if (currentRoomCode.current && state.userInfo?.userId) {
      socketService.toggleReady(currentRoomCode.current, state.userInfo.userId);
    }
  }, [state.userInfo?.userId]);

  const updateRoomSettings = useCallback((settings: any) => {
    if (currentRoomCode.current && state.userInfo?.userId && state.userInfo?.isHost) {
      socketService.updateRoomSettings(currentRoomCode.current, settings, state.userInfo.userId);
    }
  }, [state.userInfo?.userId, state.userInfo?.isHost]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
  }, []);

  const actions: UseRoomActions = {
    joinRoom,
    leaveRoom,
    sendMessage,
    toggleReady,
    updateRoomSettings,
    clearError,
    clearMessages
  };

  return [state, actions];
}

export default useRoom;