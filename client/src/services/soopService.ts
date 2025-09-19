// client/src/services/soopService.ts
import api from './api';
import { SoopProfile, SoopProfileResponse, SoopMultipleResponse } from '../types';

export class SoopService {
  // 개별 SOOP 프로필 조회
  static async getProfile(soopId: string): Promise<SoopProfile> {
    const response = await api.get<SoopProfileResponse>(`/api/soop/profile/${soopId}`);
    return response.data.profile;
  }

  // SOOP ID 검증
  static async validateSoopId(soopId: string): Promise<{ isValid: boolean; profile: SoopProfile | null }> {
    const response = await api.get(`/api/soop/validate/${soopId}`);
    return {
      isValid: response.data.isValid,
      profile: response.data.profile
    };
  }

  // 여러 SOOP 프로필 조회
  static async getMultipleProfiles(soopIds: string[]): Promise<SoopProfile[]> {
    const response = await api.post<SoopMultipleResponse>('/api/soop/profiles', {
      soopIds
    });
    return response.data.profiles;
  }

  // 캐시 통계 조회 (개발용)
  static async getCacheStats() {
    const response = await api.get('/api/soop/cache/stats');
    return response.data;
  }
}