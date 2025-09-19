// server/routes/roomRoutes.js
const express = require('express');
const router = express.Router();
const {
  createRoom,
  getRoomByCode,
  joinRoom,
  getActiveRooms
} = require('../controllers/roomController');

// 방 생성
router.post('/', createRoom);

// 활성화된 방 목록 조회 (개발용)
router.get('/', getActiveRooms);

// 방 조회 (코드로)
router.get('/:code', getRoomByCode);

// 방 입장
router.post('/:code/join', joinRoom);

module.exports = router;