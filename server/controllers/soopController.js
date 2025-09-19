// server/controllers/soopController.js
const soopService = require('../services/soopService');

// 개별 SOOP 프로필 조회
const getProfile = async (req, res) => {
  try {
    const { soopId } = req.params;

    if (!soopId || soopId.trim().length === 0) {
      return res.status(400).json({
        error: 'SOOP ID가 필요합니다.',
        message: 'URL에 SOOP ID를 포함해주세요.'
      });
    }

    const profile = await soopService.loadProfile(soopId.trim());

    res.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('❌ SOOP 프로필 조회 오류:', error);
    res.status(500).json({
      error: 'SOOP 프로필 조회 중 오류가 발생했습니다.',
      message: process.env.NODE_ENV === 'development' ? error.message : '서버 오류'
    });
  }
};

// 여러 SOOP 프로필 배치 조회
const getMultipleProfiles = async (req, res) => {
  try {
    const { soopIds } = req.body;

    if (!soopIds || !Array.isArray(soopIds) || soopIds.length === 0) {
      return res.status(400).json({
        error: 'SOOP ID 배열이 필요합니다.',
        message: 'soopIds 필드에 배열 형태로 SOOP ID들을 전달해주세요.',
        example: { soopIds: ['user1', 'user2', 'user3'] }
      });
    }

    if (soopIds.length > 50) {
      return res.status(400).json({
        error: '한 번에 최대 50개까지 조회 가능합니다.',
        requested: soopIds.length,
        maximum: 50
      });
    }

    // 중복 제거 및 정리
    const cleanIds = [...new Set(soopIds.map(id => String(id).trim()).filter(id => id.length > 0))];

    console.log(`📊 다중 프로필 조회 요청: ${cleanIds.length}개`);

    const profiles = await soopService.loadMultipleProfiles(cleanIds);

    res.json({
      success: true,
      count: profiles.length,
      profiles,
      stats: {
        requested: cleanIds.length,
        successful: profiles.filter(p => !p.error).length,
        failed: profiles.filter(p => p.error).length
      }
    });

  } catch (error) {
    console.error('❌ SOOP 다중 프로필 조회 오류:', error);
    res.status(500).json({
      error: '다중 프로필 조회 중 오류가 발생했습니다.',
      message: process.env.NODE_ENV === 'development' ? error.message : '서버 오류'
    });
  }
};

// SOOP ID 유효성 검증
const validateSoopId = async (req, res) => {
  try {
    const { soopId } = req.params;

    if (!soopId || soopId.trim().length === 0) {
      return res.status(400).json({
        error: 'SOOP ID가 필요합니다.'
      });
    }

    const validation = await soopService.validateSoopId(soopId.trim());

    res.json({
      success: true,
      soopId: soopId.trim(),
      isValid: validation.isValid,
      profile: validation.profile,
      error: validation.error || null
    });

  } catch (error) {
    console.error('❌ SOOP ID 검증 오류:', error);
    res.status(500).json({
      error: 'SOOP ID 검증 중 오류가 발생했습니다.',
      message: process.env.NODE_ENV === 'development' ? error.message : '서버 오류'
    });
  }
};

// 캐시 통계 조회 (개발용)
const getCacheStats = async (req, res) => {
  try {
    const stats = soopService.getCacheStats();
    
    res.json({
      success: true,
      cache: stats,
      message: '캐시 통계 조회 완료'
    });

  } catch (error) {
    console.error('❌ 캐시 통계 조회 오류:', error);
    res.status(500).json({
      error: '캐시 통계 조회 중 오류가 발생했습니다.'
    });
  }
};

// 캐시 정리 (개발용)
const clearCache = async (req, res) => {
  try {
    soopService.clearCache();
    
    res.json({
      success: true,
      message: '캐시가 정리되었습니다.'
    });

  } catch (error) {
    console.error('❌ 캐시 정리 오류:', error);
    res.status(500).json({
      error: '캐시 정리 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  getProfile,
  getMultipleProfiles,
  validateSoopId,
  getCacheStats,
  clearCache
};