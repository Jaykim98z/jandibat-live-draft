// client/src/components/common/Header.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <img 
              src="/logo.png" 
              alt="JandiBat Logo" 
              className={styles.logoImage}
            />
            <div className={styles.logoText}>
              <h1 className={styles.logoTitle}>JandiBat Live Draft</h1>
              <p className={styles.logoSubtitle}>실시간 멀티유저 드래프트</p>
            </div>
          </Link>

          <nav className={`${styles.nav} ${styles.desktop}`}>
            <Link 
              to="/"
              className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}
            >
              <i className="fas fa-home"></i>
              <span>홈</span>
            </Link>
            <Link 
              to="/create"
              className={`${styles.navLink} ${isActive('/create') ? styles.active : ''}`}
            >
              <i className="fas fa-plus-circle"></i>
              <span>방 만들기</span>
            </Link>
            <Link 
              to="/join"
              className={`${styles.navLink} ${isActive('/join') ? styles.active : ''}`}
            >
              <i className="fas fa-sign-in-alt"></i>
              <span>방 입장</span>
            </Link>
          </nav>

          <button className={styles.mobileMenuButton}>
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
