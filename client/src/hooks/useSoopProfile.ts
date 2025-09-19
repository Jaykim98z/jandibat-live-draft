// client/src/hooks/useSoopProfile.ts
import { useState, useCallback } from 'react';
import { SoopService } from '../services/soopService';
import { SoopProfile } from '../types';
import toast from 'react-hot-toast';

interface UseSoopProfileReturn {
  profile: SoopProfile | null;
  loading: boolean;
  error: string | null;
  loadProfile: (soopId: string) => Promise<SoopProfile | null>;
  validateAndLoad: (soopId: string) => Promise<boolean>;
  reset: () => void;
}

export function useSoopProfile(): UseSoopProfileReturn {
  const [profile, setProfile] = useState<SoopProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (soopId: string): Promise<SoopProfile | null> => {
    if (!soopId.trim()) {
      setError('SOOP ID를 입력해주세요.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const profileData = await SoopService.getProfile(soopId.trim());
      setProfile(profileData);
      return profileData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'SOOP 프로필을 불러올 수 없습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const validateAndLoad = useCallback(async (soopId: string): Promise<boolean> => {
    if (!soopId.trim()) {
      setError('SOOP ID를 입력해주세요.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const validation = await SoopService.validateSoopId(soopId.trim());
      if (validation.isValid && validation.profile) {
        setProfile(validation.profile);
        return true;
      } else {
        const errorMessage = '존재하지 않는 SOOP ID입니다.';
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'SOOP ID 검증에 실패했습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProfile(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    profile,
    loading,
    error,
    loadProfile,
    validateAndLoad,
    reset
  };
}