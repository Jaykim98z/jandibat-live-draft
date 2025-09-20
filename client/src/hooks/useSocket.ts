// client/src/hooks/useSocket.ts에 추가할 부분들

import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';
import { Room, UserInfo, User, Role } from '../types';

export const useSocket = () => {
  // 기존 상태들...
  const [room, setRoom] = useState<Room | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // 역할 배정 메서드들 추가
  const assignRole = useCallback(async (roomCode: string, userId: string, role: Role) => {
    try {
      setIsLoading(true);
      socketService.assignRole(roomCode, userId, role);
      // 응답은 Socket 이벤트로 처리됨
    } catch (error) {
      console.error('역할 배정 실패:', error);
      setError('역할 배정에 실패했습니다.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const autoAssignRoles = useCallback(async (roomCode: string) => {
    try {
      setIsLoading(true);
      socketService.autoAssignRoles(roomCode);
      // 응답은 Socket 이벤트로 처리됨
    } catch (error) {
      console.error('자동 역할 배정 실패:', error);
      setError('자동 역할 배정에 실패했습니다.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startDraft = useCallback(async (roomCode: string) => {
    try {
      setIsLoading(true);
      socketService.startDraft(roomCode);
      // 응답은 Socket 이벤트로 처리됨
    } catch (error) {
      console.error('드래프트 시작 실패:', error);
      setError('드래프트 시작에 실패했습니다.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Socket 이벤트 리스너 설정
  useEffect(() => {
    // 기존 이벤트 리스너들...
    socketService.on('connected', () => {
      setIsConnected(true);
    });

    socketService.on('room-joined', (data: any) => {
      setRoom(data.room);
      setUserInfo(data.userInfo);
      setIsLoading(false);
    });

    socketService.on('room-updated', (data: any) => {
      setRoom(data.room);
    });

    // 새로운 역할 배정 이벤트 리스너들
    socketService.on('role-assigned', (data: any) => {
      console.log('✅ 역할 배정 완료:', data);
      setRoom(data.room);
      setIsLoading(false);
      // 성공 메시지는 컴포넌트에서 처리
    });

    socketService.on('roles-auto-assigned', (data: any) => {
      console.log('✅ 자동 역할 배정 완료:', data);
      setRoom(data.room);
      setIsLoading(false);
      // 성공 메시지는 컴포넌트에서 처리
    });

    socketService.on('draft-started', (data: any) => {
      console.log('✅ 드래프트 시작됨:', data);
      setRoom(data.room);
      setIsLoading(false);
      // 성공 메시지는 컴포넌트에서 처리
    });

    socketService.on('chat-message', (data: any) => {
      setChatMessages(prev => [...prev, data]);
    });

    socketService.on('error', (data: any) => {
      setError(data.message);
      setIsLoading(false);
    });

    socketService.on('disconnected', () => {
      setIsConnected(false);
    });

    // 연결 상태 체크
    const checkConnection = () => {
      setIsConnected(socketService.isConnected());
    };

    const interval = setInterval(checkConnection, 1000);

    return () => {
      clearInterval(interval);
      // 이벤트 리스너 정리는 Socket 서비스에서 처리
    };
  }, []);

  // 기존 메서드들...
  const connect = useCallback(() => {
    socketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setRoom(null);
    setUserInfo(null);
    setIsConnected(false);
  }, []);

  const joinRoom = useCallback((roomCode: string, userData: User) => {
    setIsLoading(true);
    setError(null);
    socketService.joinRoom(roomCode, userData);
  }, []);

  const leaveRoom = useCallback(() => {
    if (room && userInfo) {
      socketService.leaveRoom(room.code, userInfo.userId);
      setRoom(null);
      setUserInfo(null);
    }
  }, [room, userInfo]);

  const toggleReady = useCallback(() => {
    if (room && userInfo) {
      socketService.toggleReady(room.code, userInfo.userId);
    }
  }, [room, userInfo]);

  const sendChatMessage = useCallback((message: string) => {
    if (room && userInfo) {
      socketService.sendChatMessage(room.code, message, userInfo.userId);
    }
  }, [room, userInfo]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // 상태들
    room,
    userInfo,
    isLoading,
    isConnected,
    error,
    chatMessages,
    
    // 기존 메서드들
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    toggleReady,
    sendChatMessage,
    clearError,
    
    // 새로운 역할 배정 메서드들
    assignRole,
    autoAssignRoles,
    startDraft
  };
};