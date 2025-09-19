import React from 'react';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.copyright}>
            © 2024 JandiBat Live Draft. Made with ❤️ for SOOP streamers.
          </div>
          <div className={styles.links}>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.link}
            >
              GitHub
            </a>
            <a 
              href="mailto:support@jandibat.com"
              className={styles.link}
            >
              문의하기
            </a>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;