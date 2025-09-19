// client/src/pages/CreateRoomPage.tsx (간소화된 버전)
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
  hostPosition: 'ST' | 'WF' | 'CM' | 'CDM' | 'FB' | 'CB' | 'GK';
  password?: string;
  draftType: 'shuffle' | 'snake' | 'manual';
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
      hostPosition: 'ST'
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
      const response = await RoomService.createRoom({
        title: data.title.trim(),
        host: {
          soopId: data.hostSoopId.trim(),
          nickname: profile.nickname,
          profileImage: profile.profileImage,
          position: data.hostPosition
        },
        settings: {
          password: data.password?.trim() || undefined,
          draftType: data.draftType
        }
      });

      if (response.success) {
        toast.success(`방이 생성되었습니다! 방 코드: ${response.room.code}`);
        
        navigate(`/room/${response.room.code}`, {
          state: {
            userData: {
              userId: response.userInfo.userId,
              soopId: data.hostSoopId.trim(),
              nickname: profile.nickname,
              profileImage: profile.profileImage,
              position: data.hostPosition,
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

          {/* 포지션 선택 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fas fa-tshirt mr-2"></i>
              본인의 포지션
            </label>
            <select
              {...register('hostPosition')}
              className={styles.select}
            >
              <option value="ST">ST (스트라이커)</option>
              <option value="WF">WF (윙포워드)</option>
              <option value="CM">CM (센터미드필더)</option>
              <option value="CDM">CDM (수비형미드필더)</option>
              <option value="FB">FB (풀백)</option>
              <option value="CB">CB (센터백)</option>
              <option value="GK">GK (골키퍼)</option>
            </select>
          </div>

          {/* SOOP 프로필 미리보기 */}
          {profile && (
            <div className={styles.profilePreview}>
              <div className={styles.profileHeader}>
                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                프로필 확인됨
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
                  <span className={styles.radioDescription}>공정한 순서 보장 (추천)</span>
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

        {/* 설정 안내 */}
        <div className={styles.infoSection}>
          <h3 className={styles.infoTitle}>
            <i className="fas fa-info-circle mr-2"></i>
            방 설정 안내
          </h3>
          <div className={styles.infoContent}>
            <div className={styles.infoItem}>
              <strong>최대 참가자:</strong> 100명까지 자동으로 입장 가능
            </div>
            <div className={styles.infoItem}>
              <strong>드래프트 방식:</strong> 공정한 선수 선택을 위한 알고리즘
            </div>
            <div className={styles.infoItem}>
              <strong>포지션:</strong> 드래프트에서 본인의 선호 포지션
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomPage;