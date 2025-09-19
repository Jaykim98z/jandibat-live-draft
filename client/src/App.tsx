// client/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css';

// Pages
import HomePage from './pages/HomePage';
import CreateRoomPage from './pages/CreateRoomPage';
import JoinRoomPage from './pages/JoinRoomPage';
import RoomPage from './pages/RoomPage';

// Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        
        <main className="app-main">
          <div className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<CreateRoomPage />} />
              <Route path="/join" element={<JoinRoomPage />} />
              <Route path="/room/:roomCode" element={<RoomPage />} />
            </Routes>
          </div>
        </main>
        
        <Footer />
        
        {/* Toast 알림 */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#333333',
              fontSize: '14px',
              fontFamily: 'Noto Sans KR',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;