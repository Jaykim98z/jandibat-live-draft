// client/src/pages/CreateRoomPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import { CreateRoomForm } from '../types';
import styles from './CreateRoomPage.module.css';

const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CreateRoomForm>();

  const onSubmit = async (data: CreateRoomForm) => {
    setIsLoading(true);
    try {
      console.log('방 생성 데이터:', data);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('방이 성공적으로 생성되었습니다!');
      navigate('/room/TEST123');
      
    } catch (error) {
      console.error('방 생성 실패:', error);
      toast.error('방 생성에 실패했습니다. 다시 시도해주세요.');
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
              <input
                type="text"
                {...register('hostSoopId', {
                  required: 'SOOP ID를 입력해주세요',
                  minLength: { value: 2, message: '최소 2자 이상 입력해주세요' }
                })}
                className={styles.input}
                placeholder="예: woowakgood"
              />
              {errors.hostSoopId && (
                <p className={styles.error}>{errors.hostSoopId.message}</p>
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
                <option value="shuffle">셔플픽 (추천)</option>
                <option value="snake">스네이크 드래프트</option>
                <option value="manual">방장 지정 순서</option>
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
              loading={isLoading}
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