// server/services/soopService.js
const axios = require('axios');

class SoopService {
  constructor() {
    this.baseURL = process.env.SOOP_API_BASE || 'https://bjapi.afreecatv.com/api';
    this.cache = new Map(); // 간단한 메모리 캐시
    this.cacheTimeout = 5 * 60 * 1000; // 5분
  }

  // 개별 SOOP 프로필 로드
  async loadProfile(soopId) {
    try {
      // 캐시 확인
      const cacheKey = `profile_${soopId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`📦 캐시에서 프로필 로드: ${soopId}`);
        return cached.data;
      }

      console.log(`🔍 SOOP API 호출: ${soopId}`);

      const response = await axios.get(`${this.baseURL}/${soopId}/station`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const data = response.data;
      
      // 프로필 데이터 정규화
      const profile = {
        soopId,
        nickname: data.user_nick || data.station?.user_nick || soopId,
        profileImage: this.normalizeImageUrl(data.profile_image || data.station?.profile_image),
        isLive: data.broad?.broad_no ? true : false, // 방송 중인지 확인
        stationUrl: `https://bj.afreecatv.com/${soopId}`,
        lastUpdated: new Date().toISOString()
      };

      // 캐시 저장
      this.cache.set(cacheKey, {
        data: profile,
        timestamp: Date.now()
      });

      return profile;

    } catch (error) {
      console.error(`❌ SOOP 프로필 로드 실패 [${soopId}]:`, error.message);
      
      // 기본 프로필 반환
      return {
        soopId,
        nickname: soopId,
        profileImage: this.getDefaultAvatar(),
        isLive: false,
        stationUrl: `https://bj.afreecatv.com/${soopId}`,
        error: error.message,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // 여러 프로필 배치 로드 (Rate Limit 고려)
  async loadMultipleProfiles(soopIds) {
    console.log(`📊 배치 프로필 로드 시작: ${soopIds.length}개`);
    
    const results = [];
    const batchSize = 3; // 동시 요청 수 제한
    const delay = 500; // 요청 간격 (ms)

    for (let i = 0; i < soopIds.length; i += batchSize) {
      const batch = soopIds.slice(i, i + batchSize);
      console.log(`🔄 배치 처리 중: ${i + 1}-${Math.min(i + batchSize, soopIds.length)}/${soopIds.length}`);
      
      // 병렬 처리
      const batchPromises = batch.map(soopId => this.loadProfile(soopId));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);

      // Rate Limit 방지를 위한 지연
      if (i + batchSize < soopIds.length) {
        await this.sleep(delay);
      }
    }

    console.log(`✅ 배치 프로필 로드 완료: 성공 ${results.filter(r => !r.error).length}/${results.length}`);
    return results;
  }

  // 프로필 이미지 URL 정규화
  normalizeImageUrl(imageUrl) {
    if (!imageUrl) {
      return this.getDefaultAvatar();
    }

    // // 로 시작하는 URL 처리
    if (imageUrl.startsWith('//')) {
      return `https:${imageUrl}`;
    }

    // 상대 경로 처리
    if (imageUrl.startsWith('/')) {
      return `https://profile.img.afreecatv.com${imageUrl}`;
    }

    // 이미 완전한 URL인 경우
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // 기본 경로 추가
    return `https://profile.img.afreecatv.com${imageUrl}`;
  }

  // 기본 아바타 URL
  getDefaultAvatar() {
    return 'https://res.afreecatv.com/images/afmobile/broad/profile_200_200.png';
  }

  // 프로필 검증 (존재하는 SOOP ID인지 확인)
  async validateSoopId(soopId) {
    try {
      const profile = await this.loadProfile(soopId);
      return {
        isValid: !profile.error,
        profile: profile
      };
    } catch (error) {
      return {
        isValid: false,
        profile: null,
        error: error.message
      };
    }
  }

  // 캐시 정리
  clearCache() {
    this.cache.clear();
    console.log('🧹 SOOP 프로필 캐시 정리됨');
  }

  // 캐시 통계
  getCacheStats() {
    const now = Date.now();
    const validEntries = Array.from(this.cache.entries())
      .filter(([key, value]) => now - value.timestamp < this.cacheTimeout);
    
    return {
      totalEntries: this.cache.size,
      validEntries: validEntries.length,
      expiredEntries: this.cache.size - validEntries.length
    };
  }

  // 유틸리티: 지연 함수
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new SoopService();