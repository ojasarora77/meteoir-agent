/**
 * API client for Agentic Stablecoin Backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
  requestId: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  qualityMetrics: {
    uptime: number;
    avgResponseTime: number;
    reliabilityScore: number;
    dataAccuracy: number;
  };
  reputationScore: {
    score: number;
    trend: string;
  };
}

export interface CostEstimation {
  serviceType: string;
  providers: Array<{
    providerId: string;
    providerName: string;
    estimatedCost: number;
    qualityScore: number;
    pros: string[];
    cons: string[];
    rank: number;
  }>;
  recommendation: {
    primary: string;
    confidenceLevel: number;
    expectedSavings: number;
    reasoning: string;
  };
  analysis: {
    costSavings: number;
    reliabilityScore: number;
    performanceScore: number;
    riskAssessment: string;
  };
}

export interface ServiceRequest {
  serviceRequestId: string;
  jobId: string;
  selectedProvider: {
    id: string;
    name: string;
  };
  estimatedCost: number;
  status: string;
  analysis: any;
}

export interface UserBudget {
  userId: string;
  dailyLimit: number;
  monthlyLimit: number;
  currentDailySpent: number;
  currentMonthlySpent: number;
  emergencyStopThreshold: number;
  isEmergencyStop: boolean;
}

export interface CostAnalytics {
  totalSpent: number;
  totalSavings: number;
  requestCount: number;
  averageCost: number;
  period: string;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'API request failed');
    }

    return data.data as T;
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await fetch(`${API_BASE.replace('/api/v1', '')}/health`);
    return response.json();
  }

  // Service Providers
  async getProviders(): Promise<ServiceProvider[]> {
    return this.request<ServiceProvider[]>('/providers');
  }

  async getProvidersByType(type: string): Promise<ServiceProvider[]> {
    return this.request<ServiceProvider[]>(`/providers/${type}`);
  }

  // Cost Estimation
  async estimateCost(
    serviceType: string,
    parameters: Record<string, any>,
    providers?: string[]
  ): Promise<CostEstimation> {
    return this.request<CostEstimation>('/estimate-cost', {
      method: 'POST',
      body: JSON.stringify({
        serviceType,
        parameters,
        providers,
      }),
    });
  }

  async compareProviders(
    serviceType: string,
    parameters: Record<string, any>
  ): Promise<any[]> {
    return this.request<any[]>('/compare-providers', {
      method: 'POST',
      body: JSON.stringify({
        serviceType,
        parameters,
      }),
    });
  }

  // Service Requests
  async createServiceRequest(requestData: {
    serviceType: string;
    endpoint: string;
    parameters: Record<string, any>;
    maxBudget: number;
    priority?: string;
    userId: string;
  }): Promise<ServiceRequest> {
    return this.request<ServiceRequest>('/service-request', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async getServiceRequest(id: string): Promise<any> {
    return this.request<any>(`/service-request/${id}`);
  }

  async getServiceRequests(userId: string, limit?: number): Promise<any[]> {
    const params = new URLSearchParams({ userId });
    if (limit) params.append('limit', limit.toString());
    
    return this.request<any[]>(`/service-requests?${params}`);
  }

  // Budget Management
  async getBudget(userId: string): Promise<UserBudget> {
    return this.request<UserBudget>(`/budget/${userId}`);
  }

  async updateBudget(userId: string, updates: any): Promise<UserBudget> {
    return this.request<UserBudget>(`/budget/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Analytics
  async getCostAnalytics(userId: string, days?: number): Promise<CostAnalytics> {
    const params = days ? `?days=${days}` : '';
    return this.request<CostAnalytics>(`/analytics/costs/${userId}${params}`);
  }

  async getProviderAnalytics(): Promise<any[]> {
    return this.request<any[]>('/analytics/providers');
  }

  // Monitoring
  async getAlerts(severity?: string): Promise<any[]> {
    const params = severity ? `?severity=${severity}` : '';
    return this.request<any[]>(`/monitoring/alerts${params}`);
  }

  async getProviderHealth(): Promise<any[]> {
    return this.request<any[]>('/monitoring/provider-health');
  }
}

export const api = new ApiClient();

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const getServiceTypeIcon = (serviceType: string): string => {
  const icons: Record<string, string> = {
    weather_api: '🌤️',
    cloud_storage: '☁️',
    compute_service: '💻',
    data_feed: '📊',
    gpu_rental: '🖥️',
    serverless: '⚡',
  };
  return icons[serviceType] || '🔧';
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'text-yellow-600',
    processing: 'text-blue-600',
    completed: 'text-green-600',
    failed: 'text-red-600',
    cancelled: 'text-gray-600',
  };
  return colors[status] || 'text-gray-600';
};

export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    low: 'text-gray-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    critical: 'text-red-500',
  };
  return colors[priority] || 'text-gray-500';
};