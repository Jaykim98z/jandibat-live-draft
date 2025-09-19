// client/src/pages/JoinRoomPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import { JoinRoomForm } from '../types';
import styles from './JoinRoomPage.module.css';

const JoinRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<JoinRoomForm>();

  const onSubmit = async (data: JoinRoomForm) => {
    setIsLoading(true);
    try {
      console.log('방 입장 데이터:', data);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('방에 성공적으로 입장했습니다!');
      navigate(`/room/${data.roomCode.toUpperCase()}`);
      
    } catch (error) {
      console.error('방 입장 실패:', error);
      toast.error('방 입장에 실패했습니다. 방 코드를 확인해주세요.');
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
            <input
              type="text"
              {...register('soopId', {
                required: 'SOOP ID를 입력해주세요',
                minLength: { value: 2, message: '최소 2자 이상 입력해주세요' }
              })}
              className={styles.input}
              placeholder="예: woowakgood"
            />
            {errors.soopId && (
              <p className={styles.error}>{errors.soopId.message}</p>
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
              loading={isLoading}
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