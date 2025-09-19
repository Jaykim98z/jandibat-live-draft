// client/src/hooks/useApi.ts
import { useState } from 'react';
import toast from 'react-hot-toast';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  showToast = true
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = async (...args: any[]): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiFunction(...args);
      setState(prev => ({ ...prev, data: result, loading: false }));
      return result;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || '알 수 없는 오류가 발생했습니다.';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      
      if (showToast) {
        toast.error(errorMessage);
      }
      
      return null;
    }
  };

  const reset = () => {
    setState({
      data: null,
      loading: false,
      error: null
    });
  };

  return {
    ...state,
    execute,
    reset
  };
}