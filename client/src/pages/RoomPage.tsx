// client/src/pages/RoomPage.tsx (API 연결 버전)
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Room } from '../types';
import { RoomService } from '../services/roomService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import styles from './RoomPage.module.css';

interface LocationState {
  userInfo?: {
    userId: string;
    isHost: boolean;
  };
  room?: Room;
}

const RoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  const [room, setRoom] = useState<Room | null>(state?.room || null);
  const [loading, setLoading] = useState(!state?.room);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomCode) {
      navigate('/');
      return;
    }

    // 이미 room 데이터가 있으면 스킵
    if (state?.room) {
      return;
    }

    // 방 정보 로드
    const loadRoom = async () => {
      try {
        setLoading(true);
        const response = await RoomService.getRoomByCode(roomCode);
        if (response.success) {
          console.log('방 정보 로드 성공:', response.room); // 디버깅용
          setRoom(response.room);
        } else {
          setError('방을 찾을 수 없습니다.');
        }
      } catch (error: any) {
        console.error('방 정보 로드 실패:', error);
        const errorMessage = error.response?.data?.error || '방 정보를 불러올 수 없습니다.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [roomCode, state?.room, navigate]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4">방 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className="text-center">
            <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <h2 className="text-xl font-bold mb-2">오류가 발생했습니다</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/')}>
              <i className="fas fa-home mr-2"></i>
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className="text-center">
            <p>방 정보를 찾을 수 없습니다.</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={styles.title}>
              {room.title}
              <span className="ml-2 text-sm bg-primary-100 text-primary-700 px-2 py-1 rounded">
                {room.code}
              </span>
            </h1>
            <p className="text-gray-600">
              방장: {room.host?.nickname || 'Unknown'} | 참가자: {room.participantCount}명 | 상태: {room.status}
            </p>
          </div>
          {state?.userInfo?.isHost && (
            <Button variant="outline" size="sm">
              <i className="fas fa-cog mr-2"></i>
              방 설정
            </Button>
          )}
        </div>

        {/* 참가자 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {room.participants && room.participants.map((participant) => (
            <div key={participant.userId} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <img 
                  src={participant.profileImage || '/default-avatar.png'}
                  alt={participant.nickname || 'Unknown User'}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{participant.nickname || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">@{participant.soopId || 'unknown'}</p>
                </div>
                {participant.isHost && (
                  <span className="ml-auto bg-primary-600 text-white text-xs px-2 py-1 rounded">
                    방장
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.comingSoon}>
          <h3 className={styles.comingSoonTitle}>구현 예정 기능:</h3>
          <ul className={styles.featureList}>
            <li className={styles.featureItem}>실시간 채팅</li>
            <li className={styles.featureItem}>선수 풀 관리</li>
            <li className={styles.featureItem}>드래프트 진행</li>
            <li className={styles.featureItem}>최종 팀 구성 결과</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;