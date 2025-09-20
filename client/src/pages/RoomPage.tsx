// client/src/pages/RoomPage.tsx (Chat props 수정)
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { Room, UserInfo, Role } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Chat from '../components/room/Chat';
import RoleAssignmentSection from '../components/room/RoleAssignmentSection';
import toast from 'react-hot-toast';
import styles from './RoomPage.module.css';

const RoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { userData?: any } | null;

  // Socket 훅 사용
  const {
    room,
    userInfo,
    isLoading,
    isConnected,
    error,
    chatMessages,
    joinRoom,
    leaveRoom,
    toggleReady,
    sendChatMessage,
    assignRole,
    autoAssignRoles,
    startDraft,
    clearError
  } = useSocket();

  // 레프 관리
  const hasJoinedRef = useRef(false);
  const isLeavingRef = useRef(false);

  // 로컬 상태
  const [isRoleAssigning, setIsRoleAssigning] = useState(false);

  // 방 입장 처리
  useEffect(() => {
    console.log('🔍 RoomPage 마운트:', {
      roomCode,
      hasUserData: !!state?.userData,
      hasRoom: !!room,
      hasJoined: hasJoinedRef.current
    });

    if (!roomCode) {
      navigate('/');
      return;
    }

    // 이미 입장했거나 방이 있으면 스킵
    if (hasJoinedRef.current || room) {
      return;
    }

    // 사용자 데이터가 없으면 리다이렉트
    if (!state?.userData) {
      console.log('❌ 사용자 데이터가 없습니다.');
      toast.error('사용자 정보가 없습니다. 다시 입장해주세요.');
      navigate('/join');
      return;
    }

    // 방 입장 시도
    console.log('🏠 방 입장 시도:', { roomCode, userData: state.userData });
    hasJoinedRef.current = true;
    joinRoom(roomCode, state.userData);

  }, [roomCode, state?.userData, room, joinRoom, navigate]);

  // 에러 처리
  useEffect(() => {
    if (error) {
      console.log('❌ 에러 발생:', error);
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // 방 입장 성공 시 hasJoinedRef 업데이트
  useEffect(() => {
    if (room && userInfo) {
      console.log('✅ 방 입장 완료 확인');
      hasJoinedRef.current = true;
    }
  }, [room, userInfo]);

  // 페이지 언마운트 시에만 방 퇴장
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (room && userInfo && !isLeavingRef.current) {
        console.log('🌐 브라우저 종료 감지 - 방 퇴장');
        isLeavingRef.current = true;
        leaveRoom();
      }
    };

    const handlePopState = () => {
      if (room && userInfo && !isLeavingRef.current) {
        console.log('🔙 뒤로가기 감지 - 방 퇴장');
        isLeavingRef.current = true;
        leaveRoom();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      
      // 컴포넌트 언마운트 시에만 방 퇴장
      if (room && userInfo && !isLeavingRef.current) {
        console.log('🗑️ 컴포넌트 언마운트 - 방 퇴장');
        isLeavingRef.current = true;
        leaveRoom();
      }
    };
  }, []); // 빈 의존성 배열로 한 번만 등록

  // 현재 사용자 정보 가져오기
  const getCurrentUser = () => {
    if (!room || !userInfo) return null;
    return room.participants.find(p => p.userId === userInfo.userId);
  };

  const currentUser = getCurrentUser();

  // 준비 상태 토글 핸들러
  const handleReadyToggle = () => {
    if (!currentUser?.isHost) {
      toggleReady();
    }
  };

  // 방 나가기 핸들러
  const handleLeaveRoom = () => {
    if (window.confirm('정말로 방을 나가시겠습니까?')) {
      isLeavingRef.current = true;
      leaveRoom();
      navigate('/');
    }
  };

  // 역할 배정 핸들러
  const handleAssignRole = async (userId: string, role: Role) => {
    if (!room || !userInfo?.isHost) {
      toast.error('방장만 역할을 배정할 수 있습니다.');
      return;
    }

    setIsRoleAssigning(true);
    try {
      await assignRole(room.code, userId, role);
      toast.success('역할이 배정되었습니다.');
    } catch (error) {
      console.error('역할 배정 실패:', error);
      toast.error('역할 배정에 실패했습니다.');
    } finally {
      setIsRoleAssigning(false);
    }
  };

  // 자동 역할 배정 핸들러
  const handleAutoAssignRoles = async () => {
    if (!room || !userInfo?.isHost) {
      toast.error('방장만 자동 역할 배정을 할 수 있습니다.');
      return;
    }

    setIsRoleAssigning(true);
    try {
      await autoAssignRoles(room.code);
      toast.success('자동 역할 배정이 완료되었습니다!');
    } catch (error) {
      console.error('자동 역할 배정 실패:', error);
      toast.error('자동 역할 배정에 실패했습니다.');
    } finally {
      setIsRoleAssigning(false);
    }
  };

  // 드래프트 시작 핸들러
  const handleStartDraft = async () => {
    if (!room || !userInfo?.isHost) {
      toast.error('방장만 드래프트를 시작할 수 있습니다.');
      return;
    }

    if (!room.canStartDraft) {
      toast.error('드래프트 시작 조건을 확인해주세요.');
      return;
    }

    if (window.confirm('드래프트를 시작하시겠습니까?')) {
      try {
        await startDraft(room.code);
        toast.success('드래프트가 시작되었습니다!');
      } catch (error) {
        console.error('드래프트 시작 실패:', error);
        toast.error('드래프트 시작에 실패했습니다.');
      }
    }
  };

  // 채팅 메시지 전송 핸들러
  const handleSendMessage = (message: string) => {
    sendChatMessage(message);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <LoadingSpinner size="lg" />
          <p className="mt-4">방에 입장 중...</p>
          <div className="mt-4 text-sm text-gray-600">
            <p>서버 연결 상태: {isConnected ? '연결됨' : '연결 안됨'}</p>
            <p>방 코드: {roomCode}</p>
            <p>사용자 데이터: {state?.userData ? '있음' : '없음'}</p>
          </div>
        </div>
      </div>
    );
  }

  // 방 정보가 없는 경우
  if (!room || !userInfo) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <i className="fas fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
          <h3>방을 찾을 수 없습니다</h3>
          <p className="text-gray-600 mb-4">
            방 코드를 확인하거나 다시 시도해주세요.
          </p>
          <Button onClick={() => navigate('/')}>
            메인으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // 드래프트가 시작된 경우
  if (room.status === 'drafting') {
    return (
      <div className={styles.container}>
        <div className={styles.draftingCard}>
          <i className="fas fa-users text-green-500 text-3xl mb-4"></i>
          <h3>🎯 드래프트 진행 중</h3>
          <p className="text-gray-600 mb-4">
            드래프트 시스템이 곧 추가될 예정입니다!
          </p>
          <div className={styles.draftInfo}>
            <p>감독: {room.managerCount || 0}명</p>
            <p>선수: {room.playerCount || 0}명</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 방 헤더 */}
      <div className={styles.roomHeader}>
        <div className={styles.roomMeta}>
          <div>
            <h1 className={styles.roomTitle}>
              <i className="fas fa-users mr-2"></i>
              {room.title}
              <span className={styles.roomCode}>#{room.code}</span>
            </h1>
            <div className={styles.roomInfo}>
              <span className={styles.hostInfo}>
                <i className="fas fa-crown mr-1"></i>
                방장: {room.host.nickname}
              </span>
              <span className={styles.participantCount}>
                <i className="fas fa-user-friends mr-1"></i>
                {room.participantCount}명
              </span>
              <span className={`${styles.connectionStatus} ${isConnected ? 
                styles.connected : styles.disconnected}`}>
                {isConnected ? '실시간 연결됨' : '연결 끊김'}
              </span>
            </div>
          </div>
        </div>
        
        <div className={styles.roomActions}>
          {userInfo?.isHost && (
            <Button variant="outline" size="sm">
              <i className="fas fa-cog mr-2"></i>
              방 설정
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleLeaveRoom}>
            <i className="fas fa-sign-out-alt mr-2"></i>
            방 나가기
          </Button>
        </div>
      </div>

      <div className={styles.roomContent}>
        {/* 역할 배정 섹션 */}
        <RoleAssignmentSection
          participants={room.participants}
          userInfo={userInfo}
          managerCount={room.managerCount || 0}
          playerCount={room.playerCount || 0}
          canStartDraft={room.canStartDraft || false}
          onAssignRole={handleAssignRole}
          onAutoAssignRoles={handleAutoAssignRoles}
          onStartDraft={handleStartDraft}
          isLoading={isRoleAssigning}
        />

        {/* 채팅 섹션 */}
        <div className={styles.chatSection}>
          <Chat 
            messages={chatMessages || []}
            onSendMessage={handleSendMessage}
            currentUserId={userInfo.userId}
            isConnected={isConnected}
          />
        </div>
      </div>
    </div>
  );
};

export default RoomPage;