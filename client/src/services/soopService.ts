// client/src/services/soopService.ts (수정된 버전)
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export interface SoopProfile {
  soopId: string;
  nickname: string;
  profileImage: string;
  isLive?: boolean;  // 선택적 속성으로 추가
  stationUrl?: string;
  lastUpdated?: string;
  error?: string;
}

export interface SoopValidationResponse {
  success: boolean;
  soopId: string;
  isValid: boolean;
  profile: SoopProfile | null;
  error?: string | null;
}

export interface SoopProfileResponse {
  success: boolean;
  profile: SoopProfile;
  error?: string;
}

export class SoopService {
  // 단일 프로필 조회
  static async getProfile(soopId: string): Promise<SoopProfileResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/soop/profile/${soopId}`);
      return response.data;
    } catch (error: any) {
      console.error('SOOP 프로필 조회 실패:', error);
      throw error;
    }
  }

  // SOOP ID 검증
  static async validateSoopId(soopId: string): Promise<SoopValidationResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/soop/validate/${soopId}`);
      return response.data;
    } catch (error: any) {
      console.error('SOOP ID 검증 실패:', error);
      
      // 에러 응답 처리
      const errorMessage = error.response?.data?.error || 'SOOP ID 검증 중 오류가 발생했습니다.';
      return {
        success: false,
        soopId,
        isValid: false,
        profile: null,
        error: errorMessage
      };
    }
  }

  // 다중 프로필 조회
  static async getMultipleProfiles(soopIds: string[]): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/soop/profiles`, { soopIds });
      return response.data;
    } catch (error: any) {
      console.error('다중 프로필 조회 실패:', error);
      throw error;
    }
  }
}

export default SoopService;