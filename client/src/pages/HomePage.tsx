// client/src/pages/HomePage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import styles from './HomePage.module.css';

const HomePage: React.FC = () => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoSection}>
          <img 
            src="/logo.png" 
            alt="JandiBat Live Draft" 
            className={styles.logoImage}
          />
          <h1 className={styles.title}>JandiBat Live Draft</h1>
          <div className={styles.subtitleContainer}>
            <p className={styles.subtitle}>실시간 멀티유저 드래프트</p>
            <button
              className={styles.infoButton}
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
            >
              <i className="fas fa-info-circle"></i>
              {showInfo && (
                <div className={styles.tooltip}>
                  SOOP 스트리머들을 위한 공정하고 재미있는 실시간 드래프트 시스템입니다.
                  셔플픽 알고리즘으로 공정한 순서를 보장하며, 실시간으로 모든 참가자가 함께 참여할 수 있습니다.
                </div>
              )}
            </button>
          </div>
        </div>

        <div className={styles.buttonContainer}>
          <Link to="/create" className={styles.mainButton}>
            <Button size="lg" className="w-full">
              <i className={`fas fa-plus-circle ${styles.buttonIcon}`}></i>
              <span>새 방 만들기</span>
            </Button>
          </Link>
          <Link to="/join" className={styles.mainButton}>
            <Button variant="outline" size="lg" className="w-full">
              <i className={`fas fa-sign-in-alt ${styles.buttonIcon}`}></i>
              <span>방 입장하기</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;