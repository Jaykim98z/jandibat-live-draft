// client/src/pages/JoinRoomPage.tsx (완전한 버전)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { SoopService } from '../services/soopService';
import { RoomService } from '../services/roomService';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import styles from './JoinRoomPage.module.css';

interface JoinRoomForm {
  roomCode: string;
  soopId: string;
  password?: string;
}

const JoinRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [soopProfile, setSoopProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<JoinRoomForm>();

  const watchedSoopId = watch('soopId');
  const watchedRoomCode = watch('roomCode');

  // SOOP ID 검증 및 프로필 로드
  const validateSoopId = async (soopId: string) => {
    if (!soopId.trim()) {
      setSoopProfile(null);
      return;
    }

    setProfileLoading(true);
    try {
      const response = await SoopService.validateSoopId(soopId.trim());
      if (response.success && response.isValid && response.profile) {
        setSoopProfile(response.profile);
        toast.success(`프로필 확인: ${response.profile.nickname}`);
      } else {
        setSoopProfile(null);
        toast.error(response.error || '존재하지 않는 SOOP ID입니다.');
      }
    } catch (error: any) {
      console.error('SOOP ID 검증 실패:', error);
      setSoopProfile(null);
      toast.error('프로필을 불러올 수 없습니다.');
    } finally {
      setProfileLoading(false);
    }
  };

  // SOOP ID 입력 디바운스 처리
  React.useEffect(() => {
    if (!watchedSoopId) {
      setSoopProfile(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      validateSoopId(watchedSoopId);
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [watchedSoopId]);

  // 방 코드 자동 포맷팅 (대문자 변환)
  React.useEffect(() => {
    if (watchedRoomCode) {
      setValue('roomCode', watchedRoomCode.toUpperCase());
    }
  }, [watchedRoomCode, setValue]);

  // 방 입장 처리
  const onSubmit = async (data: JoinRoomForm) => {
    if (!soopProfile) {
      toast.error('올바른 SOOP ID를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    
    try {
      // 방 입장 API 호출
      const response = await RoomService.joinRoom(
        data.roomCode.trim().toUpperCase(),
        {
          soopId: data.soopId.trim(),
          nickname: soopProfile.nickname,
          profileImage: soopProfile.profileImage
        },
        data.password?.trim()
      );

      if (response.success) {
        toast.success('방에 성공적으로 입장했습니다!');
        
        // 사용자 데이터와 함께 방 페이지로 이동
        navigate(`/room/${response.room.code}`, {
          state: {
            userData: {
              userId: response.userInfo.userId,
              soopId: data.soopId.trim(),
              nickname: soopProfile.nickname,
              profileImage: soopProfile.profileImage,
              isHost: response.userInfo.isHost
            },
            roomCode: response.room.code
          }
        });
      } else {
        toast.error(response.error || '방 입장에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('방 입장 실패:', error);
      const errorMessage = error.response?.data?.error || '방 입장 중 오류가 발생했습니다.';
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
            <i className="fas fa-sign-in-alt"></i>
            방 입장하기
          </h1>
          <p className={styles.subtitle}>
            방 코드를 입력하여 실시간 드래프트에 참여하세요
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* 방 코드 입력 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fas fa-key mr-2"></i>
              방 코드
            </label>
            <input
              {...register('roomCode', {
                required: '방 코드를 입력해주세요.',
                pattern: {
                  value: /^[A-Z0-9]{6}$/,
                  message: '방 코드는 6자리 영숫자입니다.'
                }
              })}
              type="text"
              placeholder="ABC123"
              maxLength={6}
              className={`${styles.input} ${errors.roomCode ? styles.error : ''}`}
            />
            {errors.roomCode && (
              <p className={styles.errorMessage}>{errors.roomCode.message}</p>
            )}
            <p className={styles.helpText}>
              방장에게 받은 6자리 방 코드를 입력하세요
            </p>
          </div>

          {/* SOOP ID 입력 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fas fa-user mr-2"></i>
              본인의 SOOP ID
            </label>
            <div className={styles.inputWrapper}>
              <input
                {...register('soopId', {
                  required: 'SOOP ID를 입력해주세요.',
                  pattern: {
                    value: /^[a-zA-Z0-9_]{4,20}$/,
                    message: 'SOOP ID는 4-20자의 영문, 숫자, 언더스코어만 가능합니다.'
                  }
                })}
                type="text"
                placeholder="당신의 SOOP ID"
                className={`${styles.input} ${errors.soopId ? styles.error : ''}`}
              />
              {profileLoading && (
                <div className={styles.loadingIcon}>
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
            {errors.soopId && (
              <p className={styles.errorMessage}>{errors.soopId.message}</p>
            )}
            <p className={styles.helpText}>
              아프리카TV/SOOP에서 사용하는 본인의 ID를 입력하세요
            </p>
          </div>

          {/* SOOP 프로필 미리보기 */}
          {soopProfile && (
            <div className={styles.profilePreview}>
              <div className={styles.profileHeader}>
                <i className="fas fa-check-circle text-green-500 mr-2"></i>
                프로필 확인됨
              </div>
              <div className={styles.profileContent}>
                <img 
                  src={soopProfile.profileImage || '/default-avatar.png'}
                  alt={soopProfile.nickname}
                  className={styles.profileImage}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default-avatar.png';
                  }}
                />
                <div className={styles.profileInfo}>
                  <p className={styles.profileNickname}>{soopProfile.nickname}</p>
                  <p className={styles.profileId}>@{soopProfile.soopId}</p>
                </div>
              </div>
            </div>
          )}

          {/* 비밀번호 입력 (선택사항) */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <i className="fas fa-lock mr-2"></i>
              비밀번호 (선택사항)
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="방에 비밀번호가 있다면 입력하세요"
              className={styles.input}
            />
            <p className={styles.helpText}>
              공개방인 경우 비워두세요
            </p>
          </div>

          {/* 제출 버튼 */}
          <div className={styles.buttonGroup}>
            <Button
              type="submit"
              size="lg"
              disabled={isLoading || !soopProfile}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">입장 중...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  방 입장하기
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

        {/* 도움말 섹션 */}
        <div className={styles.helpSection}>
          <h3 className={styles.helpTitle}>
            <i className="fas fa-question-circle mr-2"></i>
            도움말
          </h3>
          <div className={styles.helpContent}>
            <div className={styles.helpItem}>
              <i className="fas fa-info-circle"></i>
              <div>
                <strong>방 코드는 어디서 받나요?</strong>
                <p>방장이 방을 만든 후 생성되는 6자리 코드입니다. 방장에게 직접 받으세요.</p>
              </div>
            </div>
            <div className={styles.helpItem}>
              <i className="fas fa-user-check"></i>
              <div>
                <strong>SOOP ID 확인</strong>
                <p>입력한 ID가 올바르면 프로필 정보가 자동으로 표시됩니다.</p>
              </div>
            </div>
            <div className={styles.helpItem}>
              <i className="fas fa-users"></i>
              <div>
                <strong>실시간 참여</strong>
                <p>방에 입장하면 다른 참가자들과 실시간으로 소통할 수 있습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomPage;