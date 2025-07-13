import { mockServiceProviders, mockUserBudget, mockServiceRequests, mockCostAnalytics } from './mock-data';

/**
 * Mock repositories for development without database setup
 */

export class MockServiceProviderRepository {
  async findAll(): Promise<any[]> {
    return mockServiceProviders;
  }

  async findByType(type: string): Promise<any[]> {
    return mockServiceProviders.filter(p => p.type === type);
  }

  async findById(id: string): Promise<any> {
    return mockServiceProviders.find(p => p.id === id) || null;
  }

  async create(provider: any): Promise<any> {
    const newProvider = {
      id: `mock-${Date.now()}`,
      ...provider,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockServiceProviders.push(newProvider);
    return newProvider;
  }

  async update(id: string, updates: any): Promise<any> {
    const provider = mockServiceProviders.find(p => p.id === id);
    if (provider) {
      Object.assign(provider, updates, { updatedAt: new Date() });
      return provider;
    }
    return null;
  }

  async delete(id: string): Promise<boolean> {
    const index = mockServiceProviders.findIndex(p => p.id === id);
    if (index !== -1) {
      mockServiceProviders[index].isActive = false;
      return true;
    }
    return false;
  }
}

export class MockServiceRequestRepository {
  async create(request: any): Promise<any> {
    const newRequest = {
      id: `req-${Date.now()}`,
      ...request,
      status: 'pending',
      createdAt: new Date()
    };
    mockServiceRequests.push(newRequest);
    return newRequest;
  }

  async findById(id: string): Promise<any> {
    return mockServiceRequests.find(r => r.id === id) || null;
  }

  async findByUserId(userId: string, limit: number = 100): Promise<any[]> {
    return mockServiceRequests
      .filter(r => r.userId === userId)
      .slice(0, limit)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateStatus(id: string, status: string, responseData?: any, errorMessage?: string): Promise<any> {
    const request = mockServiceRequests.find(r => r.id === id);
    if (request) {
      request.status = status;
      if (responseData) request.responseData = responseData;
      if (errorMessage) request.errorMessage = errorMessage;
      if (status === 'completed' || status === 'failed') {
        request.completedAt = new Date();
      }
      return request;
    }
    return null;
  }

  async findPending(): Promise<any[]> {
    return mockServiceRequests.filter(r => r.status === 'pending');
  }
}

export class MockBudgetRepository {
  async getBudget(userId: string): Promise<any> {
    if (userId === 'demo-user') {
      return mockUserBudget;
    }
    return {
      userId,
      dailyLimit: 50.0,
      monthlyLimit: 1000.0,
      currentDailySpent: 0,
      currentMonthlySpent: 0,
      emergencyStopThreshold: 25.0,
      lastResetDate: new Date(),
      isEmergencyStop: false
    };
  }

  async updateSpending(userId: string, amount: number): Promise<any> {
    const budget = await this.getBudget(userId);
    budget.currentDailySpent += amount;
    budget.currentMonthlySpent += amount;
    budget.updatedAt = new Date();
    return budget;
  }

  async checkBudgetLimits(userId: string, requestAmount: number): Promise<{
    canProceed: boolean;
    dailyExceeded: boolean;
    monthlyExceeded: boolean;
    emergencyStop: boolean;
  }> {
    const budget = await this.getBudget(userId);
    
    const projectedDaily = budget.currentDailySpent + requestAmount;
    const projectedMonthly = budget.currentMonthlySpent + requestAmount;
    
    return {
      canProceed: projectedDaily <= budget.dailyLimit && 
                  projectedMonthly <= budget.monthlyLimit && 
                  !budget.isEmergencyStop,
      dailyExceeded: projectedDaily > budget.dailyLimit,
      monthlyExceeded: projectedMonthly > budget.monthlyLimit,
      emergencyStop: budget.isEmergencyStop
    };
  }
}

export class MockAnalyticsRepository {
  async getCostSavings(userId: string, days: number = 30): Promise<any> {
    return {
      total_spent: mockCostAnalytics.totalSpent,
      total_savings: mockCostAnalytics.totalSavings,
      total_requests: mockCostAnalytics.requestCount
    };
  }

  async getDailyCostSummary(userId: string, days: number = 30): Promise<any[]> {
    const today = new Date();
    const summary = [];
    
    for (let i = 0; i < Math.min(days, 7); i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      summary.push({
        date: date.toISOString().split('T')[0],
        user_id: userId,
        total_requests: Math.floor(Math.random() * 20) + 5,
        successful_requests: Math.floor(Math.random() * 18) + 4,
        total_cost: (Math.random() * 10 + 2).toFixed(2),
        avg_execution_time: Math.floor(Math.random() * 500) + 100
      });
    }
    
    return summary;
  }

  async getProviderPerformance(providerId: string, hours: number = 24): Promise<any[]> {
    const performance = [];
    const now = new Date();
    
    for (let i = 0; i < Math.min(hours, 24); i++) {
      const timestamp = new Date(now.getTime() - i * 3600000);
      
      performance.push({
        provider_id: providerId,
        timestamp_hour: timestamp,
        avg_response_time: Math.random() * 300 + 100,
        throughput_requests_per_hour: Math.floor(Math.random() * 50) + 10,
        error_rate_percentage: Math.random() * 5,
        availability_percentage: 95 + Math.random() * 5,
        cost_per_request: 0.001 + Math.random() * 0.004
      });
    }
    
    return performance;
  }
}

export class MockDatabaseManager {
  static getInstance(): MockDatabaseManager {
    return new MockDatabaseManager();
  }

  async initializeAll(): Promise<void> {
    console.log('✅ Mock database initialized');
  }

  async closeAll(): Promise<void> {
    console.log('✅ Mock database closed');
  }

  async healthCheck(): Promise<{
    postgresql: boolean;
    mongodb: boolean;
    redis: boolean;
  }> {
    return {
      postgresql: true,
      mongodb: true,
      redis: true
    };
  }

  async executeQuery(query: string, params?: any[]): Promise<any> {
    console.log('Mock query executed:', query.substring(0, 50) + '...');
    return { rows: [] };
  }
}