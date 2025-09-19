// client/src/pages/RoomPage.tsx (무한 루프 해결)
import React, { useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { User } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Chat from '../components/room/Chat';
import toast from 'react-hot-toast';
import styles from './RoomPage.module.css';

interface LocationState {
  userInfo?: {
    userId: string;
    isHost: boolean;
  };
  userData?: User;
  roomCode?: string;
}

const RoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  const [roomState, roomActions] = useRoom();
  const { room, messages, isConnected, isLoading, error, userInfo } = roomState;
  const { joinRoom, leaveRoom, sendMessage, toggleReady, clearError } = roomActions;

  // 중복 실행 방지를 위한 ref들
  const hasJoinedRef = useRef(false);
  const isLeavingRef = useRef(false);

  // 방 입장 처리 (한 번만 실행)
  useEffect(() => {
    console.log('🔍 방 입장 useEffect 실행:', { 
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

  // 페이지 언마운트 시에만 방 퇴장 (브라우저 닫기, 다른 페이지 이동)
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
          
          <div className="mt-6 space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/join')}
            >
              방 입장 페이지로 돌아가기
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              페이지 새로고침
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 방이 없는 경우
  if (!room) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <h2 className="text-xl font-bold mb-2">방을 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-4">방이 존재하지 않거나 이미 종료되었습니다.</p>
          
          <div className="space-x-2">
            <Button onClick={() => navigate('/')}>
              <i className="fas fa-home mr-2"></i>
              홈으로 돌아가기
            </Button>
            <Button variant="outline" onClick={() => navigate('/join')}>
              다시 입장하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 연결 상태 표시 */}
      {!isConnected && (
        <div className={styles.connectionAlert}>
          <i className="fas fa-wifi mr-2"></i>
          연결이 끊어졌습니다. 재연결 중...
        </div>
      )}

      <div className={styles.roomHeader}>
        <div className={styles.roomInfo}>
          <h1 className={styles.roomTitle}>
            {room.title}
            <span className={styles.roomCode}>#{room.code}</span>
          </h1>
          <div className={styles.roomMeta}>
            <span>방장: {room.host?.nickname || 'Unknown'}</span>
            <span>참가자: {room.participantCount}명</span>
            <span>상태: {room.status}</span>
            <span className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.disconnected}`}>
              {isConnected ? '실시간 연결됨' : '연결 끊김'}
            </span>
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
        {/* 참가자 섹션 */}
        <div className={styles.participantsSection}>
          <div className={styles.sectionHeader}>
            <h3>참가자 ({room.participantCount}명)</h3>
          </div>
          
          <div className={styles.participantsList}>
            {room.participants && room.participants.map((participant) => (
              <div 
                key={participant.userId} 
                className={`${styles.participantCard} ${participant.userId === userInfo?.userId ? styles.currentUser : ''}`}
              >
                <div className={styles.participantAvatar}>
                  <img 
                    src={participant.profileImage || '/default-avatar.png'}
                    alt={participant.nickname || 'Unknown User'}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default-avatar.png';
                    }}
                  />
                  {participant.isHost && (
                    <div className={styles.hostBadge}>
                      <i className="fas fa-crown"></i>
                    </div>
                  )}
                </div>
                
                <div className={styles.participantInfo}>
                  <p className={styles.participantName}>
                    {participant.nickname || 'Unknown'}
                    {participant.userId === userInfo?.userId && (
                      <span className={styles.youBadge}>(나)</span>
                    )}
                  </p>
                  <p className={styles.participantId}>
                    @{participant.soopId || 'unknown'} 
                    <span className={styles.positionBadge}>
                      {participant.position || 'ST'}
                    </span>
                  </p>
                </div>
                
                <div className={styles.participantStatus}>
                  {participant.isHost ? (
                    <span className={styles.hostStatus}>방장</span>
                  ) : (
                    <button
                      className={`${styles.readyButton} ${participant.isReady ? styles.ready : styles.notReady}`}
                      onClick={participant.userId === userInfo?.userId ? handleReadyToggle : undefined}
                      disabled={participant.userId !== userInfo?.userId}
                    >
                      {participant.isReady ? (
                        <>
                          <i className="fas fa-check mr-1"></i>
                          준비완료
                        </>
                      ) : (
                        <>
                          <i className="fas fa-clock mr-1"></i>
                          준비중
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 준비 상태 요약 */}
          {room.participants && room.participants.length > 1 && (
            <div className={styles.readySummary}>
              {(() => {
                const nonHostParticipants = room.participants.filter(p => !p.isHost);
                const readyCount = nonHostParticipants.filter(p => p.isReady).length;
                const totalCount = nonHostParticipants.length;
                
                return (
                  <p>
                    준비 완료: {readyCount}/{totalCount}명
                    {readyCount === totalCount && totalCount > 0 && (
                      <span className={styles.allReady}>
                        <i className="fas fa-check-circle ml-2"></i>
                        모든 참가자 준비 완료!
                      </span>
                    )}
                  </p>
                );
              })()}
            </div>
          )}
        </div>

        {/* 채팅 섹션 */}
        <div className={styles.chatSection}>
          <Chat
            messages={messages}
            onSendMessage={sendMessage}
            currentUserId={userInfo?.userId}
            isConnected={isConnected}
          />
        </div>
      </div>

      {/* 성공 메시지 */}
      <div className={styles.comingSoon}>
        <h3 className={styles.comingSoonTitle}>
          <i className="fas fa-check-circle mr-2 text-green-500"></i>
          실시간 기능 작동 중!
        </h3>
        <div className={styles.featureGrid}>
          <div className={styles.featureItem}>
            <i className="fas fa-users text-green-500"></i>
            <span>실시간 참가자 관리</span>
          </div>
          <div className={styles.featureItem}>
            <i className="fas fa-comments text-green-500"></i>
            <span>실시간 채팅</span>
          </div>
          <div className={styles.featureItem}>
            <i className="fas fa-check text-green-500"></i>
            <span>준비 상태 동기화</span>
          </div>
          <div className={styles.featureItem}>
            <i className="fas fa-wifi text-green-500"></i>
            <span>Socket 연결</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;