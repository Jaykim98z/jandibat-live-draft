// client/src/pages/RoomPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

const RoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-bold mb-4">드래프트 방: {roomCode}</h1>
        <p className="text-gray-600">이 페이지는 아직 구현 중입니다.</p>
        
        {/* TODO: 방 상세 페이지 구현 */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">구현 예정 기능:</h3>
          <ul className="list-disc list-inside text-yellow-700 space-y-1">
            <li>참가자 목록 및 상태</li>
            <li>실시간 채팅</li>
            <li>선수 풀 관리</li>
            <li>드래프트 진행</li>
            <li>최종 팀 구성 결과</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;