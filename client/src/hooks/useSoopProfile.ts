// client/src/hooks/useSoopProfile.ts (수정된 버전)
import { useState, useCallback } from 'react';
import { SoopService, SoopProfile } from '../services/soopService';

interface UseSoopProfileReturn {
  profile: SoopProfile | null;
  loading: boolean;
  error: string | null;
  loadProfile: (soopId: string) => Promise<SoopProfile | null>;
  clearProfile: () => void;
  clearError: () => void;
}

export const useSoopProfile = (): UseSoopProfileReturn => {
  const [profile, setProfile] = useState<SoopProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (soopId: string): Promise<SoopProfile | null> => {
    if (!soopId.trim()) {
      setProfile(null);
      setError(null);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await SoopService.getProfile(soopId.trim());
      
      if (response.success && response.profile) {
        setProfile(response.profile);
        return response.profile;
      } else {
        const errorMessage = response.error || 'SOOP 프로필을 불러올 수 없습니다.';
        setError(errorMessage);
        setProfile(null);
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'SOOP 프로필을 불러올 수 없습니다.';
      setError(errorMessage);
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    profile,
    loading,
    error,
    loadProfile,
    clearProfile,
    clearError
  };
};

export default useSoopProfile;