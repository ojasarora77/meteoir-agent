
import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const get = useCallback(async <T>(endpoint: string): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/${endpoint}`);
      setLoading(false);
      return response.data.data;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, []);

  const post = useCallback(async <T>(endpoint: string, data: any): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/${endpoint}`, data);
      setLoading(false);
      return response.data.data;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, []);

  return { get, post, loading, error };
};
