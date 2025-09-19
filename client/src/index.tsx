// client/src/index.tsx (Strict Mode 제거)
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// React.StrictMode 제거 (개발 중 이벤트 중복 실행 방지)
root.render(<App />);