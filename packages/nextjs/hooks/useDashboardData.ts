import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

interface DashboardData {
  overview: any;
  providers: any[];
  transactions: any[];
  analytics: any;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface DashboardActions {
  refresh: () => Promise<void>;
  testOptimization: (serviceType?: string, location?: string) => Promise<any>;
}

export function useDashboardData(): DashboardData & DashboardActions {
  const { get, post } = useApi();
  const [data, setData] = useState<DashboardData>({
    overview: null,
    providers: [],
    transactions: [],
    analytics: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const fetchAllData = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [overview, providers, transactions, analytics] = await Promise.all([
        get('health'),
        get('providers') as Promise<any[]>,
        get('service-requests?userId=test-user') as Promise<any[]>, // TODO: Replace with real user ID
        get('analytics/costs/test-user') // TODO: Replace with real user ID
      ]);

      setData({
        overview,
        providers,
        transactions,
        analytics,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data'
      }));
    }
  }, [get]);

  const refresh = useCallback(async () => {
    await fetchAllData();
  }, [fetchAllData]);

  const testOptimization = useCallback(async (serviceType?: string, location?: string) => {
    try {
      const result = await post('estimate-cost', { serviceType, parameters: { location } });
      return result;
    } catch (error) {
      console.error('Failed to test optimization:', error);
      throw error;
    }
  }, [post]);

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    ...data,
    refresh,
    testOptimization,
  };
}

export default useDashboardData;
