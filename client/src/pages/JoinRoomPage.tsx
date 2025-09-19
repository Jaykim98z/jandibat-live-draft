// client/src/pages/JoinRoomPage.tsx (API 연결 버전)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import { JoinRoomForm } from '../types';
import { RoomService } from '../services/roomService';
import { useSoopProfile } from '../hooks/useSoopProfile';
import styles from './JoinRoomPage.module.css';

const JoinRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { profile, loading: profileLoading, validateAndLoad } = useSoopProfile();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<JoinRoomForm>();

  const watchSoopId = watch('soopId');

  // SOOP ID 검증
  const handleSoopIdBlur = async () => {
    if (watchSoopId && watchSoopId.trim()) {
      await validateAndLoad(watchSoopId.trim());
    }
  };

  const onSubmit = async (data: JoinRoomForm) => {
    setIsLoading(true);
    try {
      // SOOP ID 먼저 검증
      if (!profile) {
        const isValid = await validateAndLoad(data.soopId);
        if (!isValid) {
          setIsLoading(false);
          return;
        }
      }

      // profile이 여전히 null이면 에러
      if (!profile) {
        toast.error('SOOP 프로필을 불러올 수 없습니다.');
        setIsLoading(false);
        return;
      }

      // 방 입장 API 호출
      const response = await RoomService.joinRoom(data.roomCode.toUpperCase(), data, profile);
      
      if (response.success) {
        toast.success('방에 성공적으로 입장했습니다!');
        
        // 방 페이지로 이동
        navigate(`/room/${data.roomCode.toUpperCase()}`, {
          state: {
            userInfo: response.userInfo,
            room: response.room
          }
        });
      } else {
        throw new Error('방 입장에 실패했습니다.');
      }
      
    } catch (error: any) {
      console.error('방 입장 실패:', error);
      const errorMessage = error.response?.data?.error || '방 입장에 실패했습니다. 방 코드를 확인해주세요.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>방 입장하기</h1>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fas fa-key"></i>
              방 코드
            </label>
            <input
              type="text"
              {...register('roomCode', {
                required: '방 코드를 입력해주세요',
                minLength: { value: 6, message: '방 코드는 6자리입니다' },
                maxLength: { value: 6, message: '방 코드는 6자리입니다' },
                pattern: { value: /^[A-Z0-9]+$/, message: '영문 대문자와 숫자만 입력해주세요' }
              })}
              className={`${styles.input} ${styles.roomCodeInput}`}
              placeholder="ABC123"
              maxLength={6}
              style={{ textTransform: 'uppercase' }}
            />
            {errors.roomCode && (
              <p className={styles.error}>{errors.roomCode.message}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fas fa-user"></i>
              내 SOOP ID
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                {...register('soopId', {
                  required: 'SOOP ID를 입력해주세요',
                  minLength: { value: 2, message: '최소 2자 이상 입력해주세요' }
                })}
                className={styles.input}
                placeholder="예: woowakgood"
                onBlur={handleSoopIdBlur}
              />
              {profileLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="spinner-sm"></div>
                </div>
              )}
            </div>
            {errors.soopId && (
              <p className={styles.error}>{errors.soopId.message}</p>
            )}
            
            {/* SOOP 프로필 미리보기 */}
            {profile && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
                <img 
                  src={profile.profileImage} 
                  alt={profile.nickname}
                  className="w-6 h-6 rounded-full"
                />
                <i className="fas fa-check-circle text-green-500 text-sm"></i>
                <span className="text-sm text-green-700">프로필 확인됨</span>
                {profile.isLive && (
                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded ml-auto">LIVE</span>
                )}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fas fa-lock"></i>
              비밀번호 (있는 경우만)
            </label>
            <input
              type="password"
              {...register('password')}
              className={styles.input}
              placeholder="비밀번호가 없으면 비워두세요"
            />
          </div>

          <div className={styles.buttonGroup}>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              className={styles.button}
            >
              <i className="fas fa-arrow-left"></i>
              <span>취소</span>
            </Button>
            <Button
              type="submit"
              loading={isLoading || profileLoading}
              disabled={!profile}
              className={styles.button}
            >
              {!isLoading && <i className="fas fa-sign-in-alt"></i>}
              <span>입장하기</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinRoomPage;