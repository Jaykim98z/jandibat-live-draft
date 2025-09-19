// client/src/pages/CreateRoomPage.tsx (API 연결 버전)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import { CreateRoomForm } from '../types';
import { RoomService } from '../services/roomService';
import { useSoopProfile } from '../hooks/useSoopProfile';
import styles from './CreateRoomPage.module.css';

const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { profile, loading: profileLoading, validateAndLoad } = useSoopProfile();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<CreateRoomForm>();

  const watchSoopId = watch('hostSoopId');

  // SOOP ID 검증
  const handleSoopIdBlur = async () => {
    if (watchSoopId && watchSoopId.trim()) {
      await validateAndLoad(watchSoopId.trim());
    }
  };

  const onSubmit = async (data: CreateRoomForm) => {
    setIsLoading(true);
    try {
      // SOOP ID 먼저 검증
      if (!profile) {
        const isValid = await validateAndLoad(data.hostSoopId);
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

      // 방 생성 API 호출
      const response = await RoomService.createRoom(data, profile);
      
      if (response.success) {
        toast.success(`방이 생성되었습니다! 방 코드: ${response.room.code}`);
        
        // 방 페이지로 이동 (호스트 정보 전달)
        navigate(`/room/${response.room.code}`, {
          state: {
            userInfo: response.userInfo,
            room: response.room
          }
        });
      } else {
        throw new Error('방 생성에 실패했습니다.');
      }
      
    } catch (error: any) {
      console.error('방 생성 실패:', error);
      const errorMessage = error.response?.data?.error || '방 생성에 실패했습니다. 다시 시도해주세요.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>새 드래프트 방 만들기</h1>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>방장 정보</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <i className="fas fa-user"></i>
                SOOP ID
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  {...register('hostSoopId', {
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
              {errors.hostSoopId && (
                <p className={styles.error}>{errors.hostSoopId.message}</p>
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
          </div>

          <div>
            <h2 className={styles.sectionTitle}>방 설정</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <i className="fas fa-home"></i>
                방 제목
              </label>
              <input
                type="text"
                {...register('title', {
                  required: '방 제목을 입력해주세요',
                  maxLength: { value: 50, message: '최대 50자까지 입력 가능합니다' }
                })}
                className={styles.input}
                placeholder="예: 감드컵 스타일 드래프트"
              />
              {errors.title && (
                <p className={styles.error}>{errors.title.message}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <i className="fas fa-lock"></i>
                비밀번호 (선택사항)
              </label>
              <input
                type="password"
                {...register('password')}
                className={styles.input}
                placeholder="비어두면 공개방이 됩니다"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <i className="fas fa-random"></i>
                드래프트 방식
              </label>
              <select
                {...register('draftType')}
                className={styles.select}
              >
                <option value="shuffle">셔플픽 (추천) - 공정한 순서 보장</option>
                <option value="snake">스네이크 드래프트 - 전통적 방식</option>
                <option value="manual">방장 지정 순서 - 수동 설정</option>
              </select>
            </div>
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
              {!isLoading && <i className="fas fa-plus-circle"></i>}
              <span>방 생성하기</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomPage;