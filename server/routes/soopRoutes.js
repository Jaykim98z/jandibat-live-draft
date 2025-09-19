// server/routes/soopRoutes.js
const express = require('express');
const router = express.Router();
const {
  getProfile,
  getMultipleProfiles,
  validateSoopId,
  getCacheStats,
  clearCache
} = require('../controllers/soopController');

// 개별 프로필 조회
router.get('/profile/:soopId', getProfile);

// SOOP ID 유효성 검증
router.get('/validate/:soopId', validateSoopId);

// 여러 프로필 배치 조회
router.post('/profiles', getMultipleProfiles);

// 캐시 통계 (개발용)
router.get('/cache/stats', getCacheStats);

// 캐시 정리 (개발용)
router.delete('/cache', clearCache);

module.exports = router;