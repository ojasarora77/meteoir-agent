import { CostOptimizer } from '../ai-components/cost-optimizer';
import { ServiceProvider, ServiceRequest, ServiceType, Priority } from '../types';

describe('CostOptimizer', () => {
  let costOptimizer: CostOptimizer;
  let mockProviders: ServiceProvider[];
  let mockRequest: ServiceRequest;

  beforeEach(() => {
    costOptimizer = new CostOptimizer();
    
    // Mock providers for testing
    mockProviders = [
      {
        id: 'provider-1',
        name: 'OpenWeatherMap',
        type: ServiceType.WEATHER_API,
        baseUrl: 'https://api.openweathermap.org',
        apiKey: 'test-key',
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
        id: 'provider-2',
        name: 'WeatherAPI',
        type: ServiceType.WEATHER_API,
        baseUrl: 'https://api.weatherapi.com',
        apiKey: 'test-key-2',
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
      }
    ];

    mockRequest = {
      id: 'request-1',
      serviceType: ServiceType.WEATHER_API,
      endpoint: '/weather',
      parameters: { location: 'London' },
      estimatedCost: 0,
      maxBudget: 1.0,
      priority: Priority.MEDIUM,
      userId: 'user-1',
      status: 'pending',
      createdAt: new Date()
    };
  });

  describe('analyzeServiceOptions', () => {
    test('should return cost analysis with provider recommendations', async () => {
      const analysis = await costOptimizer.analyzeServiceOptions(
        ServiceType.WEATHER_API,
        mockProviders,
        mockRequest
      );

      expect(analysis).toBeDefined();
      expect(analysis.serviceType).toBe(ServiceType.WEATHER_API);
      expect(analysis.providers).toHaveLength(2);
      expect(analysis.recommendation).toBeDefined();
      expect(analysis.recommendation.primary).toBeDefined();
      expect(analysis.analysis).toBeDefined();
    });

    test('should rank providers by cost effectiveness', async () => {
      const analysis = await costOptimizer.analyzeServiceOptions(
        ServiceType.WEATHER_API,
        mockProviders,
        mockRequest
      );

      const providers = analysis.providers;
      expect(providers[0].rank).toBe(1);
      expect(providers[1].rank).toBe(2);
      
      // First provider should have better score than second
      expect(providers[0].qualityScore).toBeGreaterThanOrEqual(providers[1].qualityScore);
    });

    test('should filter out inactive providers', async () => {
      mockProviders[1].isActive = false;

      const analysis = await costOptimizer.analyzeServiceOptions(
        ServiceType.WEATHER_API,
        mockProviders,
        mockRequest
      );

      expect(analysis.providers).toHaveLength(1);
      expect(analysis.providers[0].providerId).toBe('provider-1');
    });

    test('should handle empty provider list', async () => {
      await expect(
        costOptimizer.analyzeServiceOptions(ServiceType.WEATHER_API, [], mockRequest)
      ).rejects.toThrow('No providers available');
    });
  });

  describe('cost calculation', () => {
    test('should calculate per-request costs correctly', () => {
      const provider = mockProviders[0];
      const cost = (costOptimizer as any).calculateCost(provider, mockRequest);
      
      expect(cost).toBe(0.0015); // Base price for per-request
    });

    test('should handle free tier calculations', () => {
      const provider = mockProviders[0];
      // Mock daily request count to be under free tier
      jest.spyOn(costOptimizer as any, 'getDailyRequestCount').mockReturnValue(500);
      
      const cost = (costOptimizer as any).calculateCost(provider, mockRequest);
      expect(cost).toBe(0); // Should be free under free tier
    });
  });

  describe('weight management', () => {
    test('should update weights correctly', () => {
      const newWeights = { cost: 0.5, reliability: 0.3, performance: 0.2 };
      costOptimizer.updateWeights(newWeights);
      
      const weights = costOptimizer.getWeights();
      expect(weights.cost).toBe(0.5);
      expect(weights.reliability).toBe(0.3);
      expect(weights.performance).toBe(0.2);
    });

    test('should normalize weights to sum to 1', () => {
      const newWeights = { cost: 2, reliability: 1, performance: 1 };
      costOptimizer.updateWeights(newWeights);
      
      const weights = costOptimizer.getWeights();
      const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
      expect(total).toBeCloseTo(1, 5);
    });
  });

  describe('provider insights', () => {
    test('should generate appropriate pros and cons', () => {
      const provider = mockProviders[0];
      const scores = {
        costScore: 85,
        reliabilityScore: 95,
        performanceScore: 90,
        qualityScore: 95
      };

      const insights = (costOptimizer as any).generateProviderInsights(provider, scores);
      
      expect(insights.pros).toContain('Very cost-effective');
      expect(insights.pros).toContain('Excellent uptime record');
      expect(insights.pros).toContain('Fast response times');
      expect(insights.pros).toContain('High data accuracy');
    });
  });
});