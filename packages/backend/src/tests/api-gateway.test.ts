import request from 'supertest';
import { AgenticAPIGateway } from '../api-gateway/gateway';
import { PaymentScheduler } from '../scheduler/payment-scheduler';
import { ServiceQualityMonitor } from '../ai-components/service-monitor';

// Mock dependencies
jest.mock('../scheduler/payment-scheduler');
jest.mock('../ai-components/service-monitor');
jest.mock('../database/connection');
jest.mock('rate-limiter-flexible');

describe('AgenticAPIGateway', () => {
  let gateway: AgenticAPIGateway;
  let app: any;
  let mockPaymentScheduler: jest.Mocked<PaymentScheduler>;
  let mockQualityMonitor: jest.Mocked<ServiceQualityMonitor>;

  const mockConfig = {
    port: 3001,
    corsOrigins: ['http://localhost:3000'],
    rateLimitWindow: 900000,
    rateLimitMax: 100,
    redisUrl: 'redis://localhost:6379',
    jwtSecret: 'test-secret',
    requestTimeout: 30000
  };

  beforeEach(() => {
    // Create mocks
    mockPaymentScheduler = {
      schedulePayment: jest.fn(),
      healthCheck: jest.fn(),
      getQueueStats: jest.fn(),
      getJob: jest.fn(),
      cancelJob: jest.fn(),
      retryJob: jest.fn()
    } as any;

    mockQualityMonitor = {
      getQualityMetrics: jest.fn(),
      calculateReputationScore: jest.fn(),
      getAlerts: jest.fn(),
      getProviderStats: jest.fn()
    } as any;

    // Mock rate limiter
    const mockRateLimiter = {
      consume: jest.fn().mockResolvedValue(undefined)
    };
    
    gateway = new AgenticAPIGateway(mockConfig, mockPaymentScheduler, mockQualityMonitor);
    app = gateway.getApp();

    // Mock database repositories
    const mockServiceProviderRepo = {
      findAll: jest.fn(),
      findByType: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    const mockServiceRequestRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn()
    };

    const mockBudgetRepo = {
      getBudget: jest.fn(),
      checkBudgetLimits: jest.fn()
    };

    (gateway as any).serviceProviderRepo = mockServiceProviderRepo;
    (gateway as any).serviceRequestRepo = mockServiceRequestRepo;
    (gateway as any).budgetRepo = mockBudgetRepo;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    test('GET /health should return health status', async () => {
      mockPaymentScheduler.healthCheck.mockResolvedValueOnce({
        isHealthy: true,
        details: {
          queueConnected: true,
          workerRunning: true,
          redisConnected: true,
          stats: { waiting: 0, active: 0, completed: 10, failed: 1 }
        }
      });

      mockPaymentScheduler.getQueueStats.mockResolvedValueOnce({
        waiting: 0,
        active: 0,
        completed: 10,
        failed: 1,
        total: 11
      });

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services.api).toBe(true);
      expect(response.body.services.scheduler).toBe(true);
    });

    test('GET /health should return unhealthy when scheduler fails', async () => {
      mockPaymentScheduler.healthCheck.mockRejectedValueOnce(new Error('Scheduler down'));

      const response = await request(app)
        .get('/health')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
    });
  });

  describe('Service Providers', () => {
    test('GET /api/v1/providers should return all providers', async () => {
      const mockProviders = [
        {
          id: 'provider-1',
          name: 'OpenWeatherMap',
          type: 'weather_api',
          isActive: true
        }
      ];

      (gateway as any).serviceProviderRepo.findAll.mockResolvedValueOnce(mockProviders);
      mockQualityMonitor.getQualityMetrics.mockReturnValue({
        uptime: 99.9,
        avgResponseTime: 200,
        reliabilityScore: 95,
        dataAccuracy: 95,
        lastUpdated: new Date()
      });
      mockQualityMonitor.calculateReputationScore.mockReturnValue({
        score: 85,
        factors: {},
        trend: 'stable',
        lastUpdated: new Date()
      });

      const response = await request(app)
        .get('/api/v1/providers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('OpenWeatherMap');
    });

    test('GET /api/v1/providers/:type should return providers by type', async () => {
      const mockProviders = [
        {
          id: 'provider-1',
          name: 'OpenWeatherMap',
          type: 'weather_api'
        }
      ];

      (gateway as any).serviceProviderRepo.findByType.mockResolvedValueOnce(mockProviders);
      mockQualityMonitor.getQualityMetrics.mockReturnValue({});
      mockQualityMonitor.calculateReputationScore.mockReturnValue({ score: 85 });

      const response = await request(app)
        .get('/api/v1/providers/weather_api')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('Cost Estimation', () => {
    test('POST /api/v1/estimate-cost should return cost analysis', async () => {
      const mockProviders = [
        {
          id: 'provider-1',
          name: 'OpenWeatherMap',
          type: 'weather_api',
          pricingModel: { type: 'per_request', basePrice: 0.0015 },
          qualityMetrics: { uptime: 99.9, avgResponseTime: 200 }
        }
      ];

      (gateway as any).serviceProviderRepo.findByType.mockResolvedValueOnce(mockProviders);
      
      const mockCostOptimizer = {
        analyzeServiceOptions: jest.fn().mockResolvedValueOnce({
          serviceType: 'weather_api',
          providers: [{
            providerId: 'provider-1',
            estimatedCost: 0.0015,
            qualityScore: 85
          }],
          recommendation: {
            primary: 'provider-1',
            confidence: 85
          },
          analysis: {
            costSavings: 0.002,
            reliabilityScore: 95
          }
        })
      };

      (gateway as any).costOptimizer = mockCostOptimizer;

      const response = await request(app)
        .post('/api/v1/estimate-cost')
        .send({
          serviceType: 'weather_api',
          parameters: { location: 'London' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.serviceType).toBe('weather_api');
      expect(response.body.data.providers).toHaveLength(1);
    });

    test('POST /api/v1/estimate-cost should handle no providers available', async () => {
      (gateway as any).serviceProviderRepo.findByType.mockResolvedValueOnce([]);

      const response = await request(app)
        .post('/api/v1/estimate-cost')
        .send({
          serviceType: 'weather_api',
          parameters: { location: 'London' }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('No providers available');
    });
  });

  describe('Service Requests', () => {
    test('POST /api/v1/service-request should create and schedule service request', async () => {
      const mockProviders = [
        {
          id: 'provider-1',
          name: 'OpenWeatherMap',
          type: 'weather_api',
          pricingModel: { type: 'per_request', basePrice: 0.0015 }
        }
      ];

      const mockServiceRequest = {
        id: 'request-1',
        serviceType: 'weather_api',
        estimatedCost: 0.0015,
        providerId: 'provider-1'
      };

      (gateway as any).budgetRepo.checkBudgetLimits.mockResolvedValueOnce({
        canProceed: true,
        dailyExceeded: false,
        monthlyExceeded: false,
        emergencyStop: false
      });

      (gateway as any).serviceProviderRepo.findByType.mockResolvedValueOnce(mockProviders);
      (gateway as any).serviceRequestRepo.create.mockResolvedValueOnce(mockServiceRequest);

      const mockCostOptimizer = {
        analyzeServiceOptions: jest.fn().mockResolvedValueOnce({
          recommendation: { primary: 'provider-1' },
          providers: [{ providerId: 'provider-1', estimatedCost: 0.0015 }],
          analysis: { costSavings: 0.002 }
        })
      };

      (gateway as any).costOptimizer = mockCostOptimizer;
      mockPaymentScheduler.schedulePayment.mockResolvedValueOnce('job-123');

      const response = await request(app)
        .post('/api/v1/service-request')
        .send({
          serviceType: 'weather_api',
          endpoint: '/weather',
          parameters: { location: 'London' },
          maxBudget: 1.0,
          userId: 'user-1'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.serviceRequestId).toBe('request-1');
      expect(response.body.data.jobId).toBe('job-123');
      expect(response.body.data.status).toBe('scheduled');
    });

    test('POST /api/v1/service-request should reject when budget exceeded', async () => {
      (gateway as any).budgetRepo.checkBudgetLimits.mockResolvedValueOnce({
        canProceed: false,
        dailyExceeded: true,
        monthlyExceeded: false,
        emergencyStop: false
      });

      const response = await request(app)
        .post('/api/v1/service-request')
        .send({
          serviceType: 'weather_api',
          endpoint: '/weather',
          parameters: { location: 'London' },
          maxBudget: 1.0,
          userId: 'user-1'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Budget constraints');
    });

    test('GET /api/v1/service-request/:id should return service request details', async () => {
      const mockServiceRequest = {
        id: 'request-1',
        serviceType: 'weather_api',
        status: 'completed'
      };

      (gateway as any).serviceRequestRepo.findById.mockResolvedValueOnce(mockServiceRequest);

      const response = await request(app)
        .get('/api/v1/service-request/request-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('request-1');
    });

    test('GET /api/v1/service-request/:id should return 404 for non-existent request', async () => {
      (gateway as any).serviceRequestRepo.findById.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/v1/service-request/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVICE_REQUEST_NOT_FOUND');
    });
  });

  describe('Budget Management', () => {
    test('GET /api/v1/budget/:userId should return user budget', async () => {
      const mockBudget = {
        userId: 'user-1',
        dailyLimit: 50.0,
        monthlyLimit: 1000.0,
        currentDailySpent: 15.5,
        currentMonthlySpent: 234.75
      };

      (gateway as any).budgetRepo.getBudget.mockResolvedValueOnce(mockBudget);

      const response = await request(app)
        .get('/api/v1/budget/user-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe('user-1');
      expect(response.body.data.dailyLimit).toBe(50.0);
    });

    test('GET /api/v1/budget/:userId should return 404 for non-existent budget', async () => {
      (gateway as any).budgetRepo.getBudget.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/v1/budget/non-existent-user')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BUDGET_NOT_FOUND');
    });
  });

  describe('Analytics', () => {
    test('GET /api/v1/analytics/costs/:userId should return cost analytics', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/costs/user-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalSpent');
      expect(response.body.data).toHaveProperty('totalSavings');
    });

    test('GET /api/v1/analytics/providers should return provider analytics', async () => {
      const mockProviders = [
        { id: 'provider-1', name: 'OpenWeatherMap' }
      ];

      (gateway as any).serviceProviderRepo.findAll.mockResolvedValueOnce(mockProviders);
      mockQualityMonitor.getProviderStats.mockReturnValue({
        totalChecks: 100,
        healthyChecks: 95,
        uptime: 99.5,
        reputationScore: 85
      });

      const response = await request(app)
        .get('/api/v1/analytics/providers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('OpenWeatherMap');
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ENDPOINT_NOT_FOUND');
    });

    test('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/v1/service-request')
        .send({
          // Missing required fields
          serviceType: 'weather_api'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Missing required field');
    });

    test('should include request ID in all responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('requestId');
      expect(response.body.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
    });
  });
});