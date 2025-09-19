// client/src/pages/CreateRoomPage.tsx (수정된 버전)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { RoomService } from '../services/roomService';
import { useSoopProfile } from '../hooks/useSoopProfile';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import styles from './CreateRoomPage.module.css';

interface CreateRoomForm {
  title: string;
  hostSoopId: string;
  password?: string;
  draftType: 'shuffle' | 'snake' | 'manual';
  timePerTurn: number;
  maxParticipants: number;
}

const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { profile, loading: profileLoading, loadProfile, clearProfile } = useSoopProfile();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<CreateRoomForm>({
    defaultValues: {
      draftType: 'shuffle',
      timePerTurn: 30,
      maxParticipants: 6
    }
  });

  const watchedSoopId = watch('hostSoopId');

  // SOOP ID 입력 디바운스 처리
  React.useEffect(() => {
    if (!watchedSoopId) {
      clearProfile();
      return;
    }

    const timeoutId = setTimeout(() => {
      loadProfile(watchedSoopId);
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [watchedSoopId, loadProfile, clearProfile]);

  // 방 생성 처리
  const onSubmit = async (data: CreateRoomForm) => {
    if (!profile) {
      toast.error('올바른 SOOP ID를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    
    try {
      // 방 생성 API 호출
      const response = await RoomService.createRoom({
        title: data.title.trim(),
        host: {
          soopId: data.hostSoopId.trim(),
          nickname: profile.nickname,
          profileImage: profile.profileImage
        },
        settings: {
          password: data.password?.trim() || undefined,
          draftType: data.draftType,
          timePerTurn: data.timePerTurn,
          maxParticipants: data.maxParticipants
        }
      });

      if (response.success) {
        toast.success(`방이 생성되었습니다! 방 코드: ${response.room.code}`);
        
        // 사용자 데이터와 함께 방 페이지로 이동
        navigate(`/room/${response.room.code}`, {
          state: {
            userData: {
              userId: response.userInfo.userId,
              soopId: data.hostSoopId.trim(),
              nickname: profile.nickname,
              profileImage: profile.profileImage,
              isHost: response.userInfo.isHost
            },
            roomCode: response.room.code
          }
        });
      } else {
        toast.error(response.error || '방 생성에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('방 생성 실패:', error);
      const errorMessage = error.response?.data?.error || '방 생성 중 오류가 발생했습니다.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <i className="fas fa-plus-circle"></i>
            새 방 만들기
          </h1>
          <p className={styles.subtitle}>
            실시간 멀티유저 드래프트 방을 생성하세요
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* 방 제목 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fas fa-home mr-2"></i>
              방 제목
            </label>
            <input
              {...register('title', {
                required: '방 제목을 입력해주세요.',
                minLength: {
                  value: 2,
                  message: '방 제목은 최소 2자 이상이어야 합니다.'
                },
                maxLength: {
                  value: 50,
                  message: '방 제목은 최대 50자까지 가능합니다.'
                }
              })}
              type="text"
              placeholder="감드컵 스타일 드래프트"
              className={`${styles.input} ${errors.title ? styles.error : ''}`}
            />
            {errors.title && (
              <p className={styles.errorMessage}>{errors.title.message}</p>
            )}
          </div>

          {/* 호스트 SOOP ID */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fas fa-user-crown mr-2"></i>
              본인의 SOOP ID
            </label>
            <div className={styles.inputWrapper}>
              <input
                {...register('hostSoopId', {
                  required: 'SOOP ID를 입력해주세요.',
                  pattern: {
                    value: /^[a-zA-Z0-9_]{4,20}$/,
                    message: 'SOOP ID는 4-20자의 영문, 숫자, 언더스코어만 가능합니다.'
                  }
                })}
                type="text"
                placeholder="당신의 SOOP ID"
                className={`${styles.input} ${errors.hostSoopId ? styles.error : ''}`}
              />
              {profileLoading && (
                <div className={styles.loadingIcon}>
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
            {errors.hostSoopId && (
              <p className={styles.errorMessage}>{errors.hostSoopId.message}</p>
            )}
          </div>

          {/* SOOP 프로필 미리보기 */}
          {profile && (
            <div className={styles.profilePreview}>
              <div className={styles.profileHeader}>
                <i className="fas fa-check-circle text-green-500 text-sm"></i>
                <span className="text-sm text-green-700">프로필 확인됨</span>
              </div>
              <div className={styles.profileContent}>
                <img 
                  src={profile.profileImage || '/default-avatar.png'}
                  alt={profile.nickname}
                  className={styles.profileImage}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default-avatar.png';
                  }}
                />
                <div className={styles.profileInfo}>
                  <p className={styles.profileNickname}>{profile.nickname}</p>
                  <p className={styles.profileId}>@{profile.soopId}</p>
                </div>
              </div>
            </div>
          )}

          {/* 드래프트 방식 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fas fa-random mr-2"></i>
              드래프트 방식
            </label>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  {...register('draftType')}
                  type="radio"
                  value="shuffle"
                  className={styles.radioInput}
                />
                <div className={styles.radioContent}>
                  <span className={styles.radioTitle}>셔플픽 🌟</span>
                  <span className={styles.radioDescription}>공정한 순서 보장 (3인 이상 추천)</span>
                </div>
              </label>

              <label className={styles.radioOption}>
                <input
                  {...register('draftType')}
                  type="radio"
                  value="snake"
                  className={styles.radioInput}
                />
                <div className={styles.radioContent}>
                  <span className={styles.radioTitle}>스네이크 드래프트</span>
                  <span className={styles.radioDescription}>전통적인 뱀 드래프트 방식</span>
                </div>
              </label>

              <label className={styles.radioOption}>
                <input
                  {...register('draftType')}
                  type="radio"
                  value="manual"
                  className={styles.radioInput}
                />
                <div className={styles.radioContent}>
                  <span className={styles.radioTitle}>수동 순서</span>
                  <span className={styles.radioDescription}>방장이 직접 순서 설정</span>
                </div>
              </label>
            </div>
          </div>

          {/* 시간 설정 */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <i className="fas fa-clock mr-2"></i>
                턴당 시간
              </label>
              <select
                {...register('timePerTurn', { valueAsNumber: true })}
                className={styles.select}
              >
                <option value={15}>15초</option>
                <option value={30}>30초</option>
                <option value={60}>1분</option>
                <option value={120}>2분</option>
                <option value={180}>3분</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <i className="fas fa-users mr-2"></i>
                최대 참가자
              </label>
              <select
                {...register('maxParticipants', { valueAsNumber: true })}
                className={styles.select}
              >
                <option value={2}>2명</option>
                <option value={3}>3명</option>
                <option value={4}>4명</option>
                <option value={5}>5명</option>
                <option value={6}>6명</option>
                <option value={8}>8명</option>
                <option value={10}>10명</option>
              </select>
            </div>
          </div>

          {/* 비밀번호 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fas fa-lock mr-2"></i>
              비밀번호 (선택사항)
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="비워두면 공개방으로 생성됩니다"
              className={styles.input}
            />
            <p className={styles.helpText}>
              비밀번호를 설정하면 해당 비밀번호를 아는 사람만 입장할 수 있습니다
            </p>
          </div>

          {/* 제출 버튼 */}
          <div className={styles.buttonGroup}>
            <Button
              type="submit"
              size="lg"
              disabled={isLoading || !profile}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">방 생성 중...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-plus-circle mr-2"></i>
                  방 생성하기
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate('/')}
              className="w-full"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              뒤로 가기
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomPage;