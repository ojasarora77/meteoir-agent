import { ServiceProvider, ServiceType } from '../types';

/**
 * Mock data for development without database setup
 */

export const mockServiceProviders: ServiceProvider[] = [
  {
    id: 'openweathermap-1',
    name: 'OpenWeatherMap',
    type: ServiceType.WEATHER_API,
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    apiKey: 'mock-api-key',
    pricingModel: {
      type: 'per_request',
      basePrice: 0.0015,
      currency: 'USD',
      freeTier: { requestsPerDay: 1000 }
    },
    qualityMetrics: {
      uptime: 99.9,
      avgResponseTime: 200,
      reliabilityScore: 95,
      dataAccuracy: 95,
      lastUpdated: new Date()
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'weatherapi-1',
    name: 'WeatherAPI',
    type: ServiceType.WEATHER_API,
    baseUrl: 'https://api.weatherapi.com/v1',
    apiKey: 'mock-api-key-2',
    pricingModel: {
      type: 'per_request',
      basePrice: 0.004,
      currency: 'USD',
      freeTier: { requestsPerMonth: 1000000 }
    },
    qualityMetrics: {
      uptime: 99.5,
      avgResponseTime: 300,
      reliabilityScore: 92,
      dataAccuracy: 93,
      lastUpdated: new Date()
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'aws-s3-1',
    name: 'AWS S3',
    type: ServiceType.CLOUD_STORAGE,
    baseUrl: 'https://s3.amazonaws.com',
    apiKey: 'mock-aws-key',
    pricingModel: {
      type: 'per_mb',
      basePrice: 0.023,
      currency: 'USD'
    },
    qualityMetrics: {
      uptime: 99.99,
      avgResponseTime: 100,
      reliabilityScore: 99,
      dataAccuracy: 99,
      lastUpdated: new Date()
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pinata-ipfs-1',
    name: 'Pinata IPFS',
    type: ServiceType.CLOUD_STORAGE,
    baseUrl: 'https://api.pinata.cloud',
    apiKey: 'mock-pinata-key',
    pricingModel: {
      type: 'per_mb',
      basePrice: 0.15,
      currency: 'USD',
      freeTier: { dataLimitMB: 1024 }
    },
    qualityMetrics: {
      uptime: 99.8,
      avgResponseTime: 300,
      reliabilityScore: 96,
      dataAccuracy: 98,
      lastUpdated: new Date()
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const mockUserBudget = {
  userId: 'demo-user',
  dailyLimit: 50.0,
  monthlyLimit: 1000.0,
  currentDailySpent: 15.75,
  currentMonthlySpent: 234.50,
  emergencyStopThreshold: 25.0,
  lastResetDate: new Date(),
  isEmergencyStop: false
};

export const mockServiceRequests = [
  {
    id: 'req-1',
    serviceType: ServiceType.WEATHER_API,
    endpoint: '/weather',
    parameters: { location: 'London' },
    estimatedCost: 0.0015,
    actualCost: 0.0015,
    maxBudget: 1.0,
    priority: 'medium',
    userId: 'demo-user',
    providerId: 'openweathermap-1',
    status: 'completed',
    responseData: {
      temperature: 15.5,
      humidity: 72,
      description: 'clear sky'
    },
    executionTime: 245,
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    completedAt: new Date(Date.now() - 3590000)
  },
  {
    id: 'req-2',
    serviceType: ServiceType.WEATHER_API,
    endpoint: '/weather',
    parameters: { location: 'New York' },
    estimatedCost: 0.0015,
    actualCost: 0.0015,
    maxBudget: 1.0,
    priority: 'high',
    userId: 'demo-user',
    providerId: 'weatherapi-1',
    status: 'completed',
    responseData: {
      temperature: 22.1,
      humidity: 65,
      description: 'partly cloudy'
    },
    executionTime: 189,
    createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
    completedAt: new Date(Date.now() - 1795000)
  }
];

export const mockCostAnalytics = {
  totalSpent: 156.75,
  totalSavings: 23.45,
  requestCount: 127,
  averageCost: 1.23,
  successRate: 97.6,
  topServices: [
    {
      serviceType: ServiceType.WEATHER_API,
      cost: 89.30,
      requests: 67
    },
    {
      serviceType: ServiceType.CLOUD_STORAGE,
      cost: 67.45,
      requests: 60
    }
  ],
  topProviders: [
    {
      providerId: 'openweathermap-1',
      providerName: 'OpenWeatherMap',
      cost: 45.20,
      requests: 35,
      savings: 12.30
    },
    {
      providerId: 'aws-s3-1',
      providerName: 'AWS S3',
      cost: 67.45,
      requests: 60,
      savings: 8.90
    }
  ]
};