// server/routes/roomRoutes.js (역할 배정 라우트 추가)
const express = require('express');
const router = express.Router();
const {
  createRoom,
  getRoomByCode,
  joinRoom,
  getActiveRooms,
  assignRole,
  autoAssignRoles,
  getRoleStats,
  startDraft
} = require('../controllers/roomController');

// 기존 라우트들
router.post('/', createRoom);                    // 방 생성
router.get('/', getActiveRooms);                 // 활성화된 방 목록 조회 (개발용)
router.get('/:code', getRoomByCode);             // 방 조회 (코드로)
router.post('/:code/join', joinRoom);            // 방 입장

// 새로 추가된 역할 배정 관련 라우트들
router.post('/:code/assign-role', assignRole);   // 역할 배정 (방장만)
router.post('/:code/auto-assign', autoAssignRoles); // 자동 역할 배정 (방장만)
router.get('/:code/role-stats', getRoleStats);   // 역할 통계 조회
router.post('/:code/start-draft', startDraft);   // 드래프트 시작 (방장만)

module.exports = router;