import { PaymentScheduler, IntelligentPaymentScheduler } from '../scheduler/payment-scheduler';
import { ServiceRequest, ServiceProvider, ServiceType, Priority } from '../types';
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

// Mock dependencies
jest.mock('bullmq');
jest.mock('ioredis');
jest.mock('../database/connection');

const MockedQueue = Queue as jest.MockedClass<typeof Queue>;
const MockedWorker = Worker as jest.MockedClass<typeof Worker>;
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

describe('PaymentScheduler', () => {
  let scheduler: PaymentScheduler;
  let mockQueue: jest.Mocked<Queue>;
  let mockWorker: jest.Mocked<Worker>;
  let mockRedis: jest.Mocked<Redis>;

  const mockConfig = {
    redisUrl: 'redis://localhost:6379',
    queueName: 'test-payment-queue',
    concurrency: 2,
    retryDelay: 1000,
    maxRetries: 3,
    staleAge: 30000,
    maxJobs: 1000
  };

  const mockServiceRequest: ServiceRequest = {
    id: 'request-1',
    serviceType: ServiceType.WEATHER_API,
    endpoint: '/weather',
    parameters: { location: 'London' },
    estimatedCost: 0.0015,
    maxBudget: 1.0,
    priority: Priority.MEDIUM,
    userId: 'user-1',
    status: 'pending',
    createdAt: new Date()
  };

  const mockProvider: ServiceProvider = {
    id: 'provider-1',
    name: 'OpenWeatherMap',
    type: ServiceType.WEATHER_API,
    baseUrl: 'https://api.openweathermap.org',
    apiKey: 'test-key',
    pricingModel: {
      type: 'per_request',
      basePrice: 0.0015,
      currency: 'USD'
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
  };

  beforeEach(() => {
    // Setup mocks
    mockQueue = {
      add: jest.fn(),
      getWaiting: jest.fn(),
      getActive: jest.fn(),
      getCompleted: jest.fn(),
      getFailed: jest.fn(),
      getJob: jest.fn(),
      clean: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      close: jest.fn(),
      isPaused: jest.fn(),
      on: jest.fn()
    } as any;

    mockWorker = {
      close: jest.fn(),
      isRunning: jest.fn(),
      on: jest.fn()
    } as any;

    mockRedis = {
      status: 'ready',
      disconnect: jest.fn()
    } as any;

    MockedQueue.mockImplementation(() => mockQueue);
    MockedWorker.mockImplementation(() => mockWorker);
    MockedRedis.mockImplementation(() => mockRedis);

    scheduler = new PaymentScheduler(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('schedulePayment', () => {
    test('should schedule payment successfully', async () => {
      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValueOnce(mockJob as any);

      // Mock budget repository
      const mockBudgetRepo = {
        checkBudgetLimits: jest.fn().mockResolvedValue({
          canProceed: true,
          dailyExceeded: false,
          monthlyExceeded: false,
          emergencyStop: false
        })
      };

      const mockServiceRequestRepo = {
        updateStatus: jest.fn().mockResolvedValue({})
      };

      (scheduler as any).budgetRepo = mockBudgetRepo;
      (scheduler as any).serviceRequestRepo = mockServiceRequestRepo;

      const jobId = await scheduler.schedulePayment(mockServiceRequest, mockProvider);

      expect(jobId).toBe('job-123');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'payment',
        expect.objectContaining({
          serviceRequestId: 'request-1',
          providerId: 'provider-1',
          amount: 0.0015,
          currency: 'USDC',
          userId: 'user-1'
        }),
        expect.objectContaining({
          priority: expect.any(Number),
          attempts: mockConfig.maxRetries
        })
      );
    });

    test('should reject payment when budget constraints are exceeded', async () => {
      const mockBudgetRepo = {
        checkBudgetLimits: jest.fn().mockResolvedValue({
          canProceed: false,
          dailyExceeded: true,
          monthlyExceeded: false,
          emergencyStop: false
        })
      };

      (scheduler as any).budgetRepo = mockBudgetRepo;

      await expect(
        scheduler.schedulePayment(mockServiceRequest, mockProvider)
      ).rejects.toThrow('Budget constraints exceeded');
    });
  });

  describe('getQueueStats', () => {
    test('should return queue statistics', async () => {
      mockQueue.getWaiting.mockResolvedValueOnce([1, 2, 3] as any);
      mockQueue.getActive.mockResolvedValueOnce([1, 2] as any);
      mockQueue.getCompleted.mockResolvedValueOnce([1, 2, 3, 4] as any);
      mockQueue.getFailed.mockResolvedValueOnce([1] as any);

      const stats = await scheduler.getQueueStats();

      expect(stats).toEqual({
        waiting: 3,
        active: 2,
        completed: 4,
        failed: 1,
        total: 10
      });
    });
  });

  describe('healthCheck', () => {
    test('should return healthy status when all components are working', async () => {
      mockQueue.getWaiting.mockResolvedValueOnce([]);
      mockQueue.getActive.mockResolvedValueOnce([]);
      mockQueue.getCompleted.mockResolvedValueOnce([]);
      mockQueue.getFailed.mockResolvedValueOnce([]);
      mockQueue.isPaused.mockResolvedValueOnce(false);
      mockWorker.isRunning.mockReturnValueOnce(true);

      const health = await scheduler.healthCheck();

      expect(health.isHealthy).toBe(true);
      expect(health.details.queueConnected).toBe(true);
      expect(health.details.workerRunning).toBe(true);
      expect(health.details.redisConnected).toBe(true);
    });

    test('should return unhealthy status when components fail', async () => {
      mockQueue.isPaused.mockRejectedValueOnce(new Error('Queue error'));

      const health = await scheduler.healthCheck();

      expect(health.isHealthy).toBe(false);
    });
  });

  describe('job management', () => {
    test('should cancel job successfully', async () => {
      const mockJob = {
        remove: jest.fn().mockResolvedValueOnce(undefined)
      };
      mockQueue.getJob.mockResolvedValueOnce(mockJob as any);

      const result = await scheduler.cancelJob('job-123');

      expect(result).toBe(true);
      expect(mockJob.remove).toHaveBeenCalled();
    });

    test('should retry failed job', async () => {
      const mockJob = {
        failedReason: 'Network error',
        retry: jest.fn().mockResolvedValueOnce(undefined)
      };
      mockQueue.getJob.mockResolvedValueOnce(mockJob as any);

      const result = await scheduler.retryJob('job-123');

      expect(result).toBe(true);
      expect(mockJob.retry).toHaveBeenCalled();
    });
  });

  describe('pause and resume', () => {
    test('should pause and resume queue processing', async () => {
      mockQueue.pause.mockResolvedValueOnce(undefined);
      mockQueue.resume.mockResolvedValueOnce(undefined);

      await scheduler.pause();
      expect(mockQueue.pause).toHaveBeenCalled();

      await scheduler.resume();
      expect(mockQueue.resume).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    test('should shutdown gracefully', async () => {
      mockWorker.close.mockResolvedValueOnce(undefined);
      mockQueue.close.mockResolvedValueOnce(undefined);
      mockRedis.disconnect.mockResolvedValueOnce('OK' as any);

      await scheduler.shutdown();

      expect(mockWorker.close).toHaveBeenCalled();
      expect(mockQueue.close).toHaveBeenCalled();
      expect(mockRedis.disconnect).toHaveBeenCalled();
    });
  });
});

describe('IntelligentPaymentScheduler', () => {
  let intelligentScheduler: IntelligentPaymentScheduler;
  let mockCostOptimizer: any;

  beforeEach(() => {
    mockCostOptimizer = {
      analyzeServiceOptions: jest.fn()
    };

    intelligentScheduler = new IntelligentPaymentScheduler(mockConfig);
    (intelligentScheduler as any).costOptimizer = mockCostOptimizer;
  });

  describe('scheduleOptimizedPayment', () => {
    test('should select optimal provider and schedule payment', async () => {
      const mockProviders = [mockProvider];
      const mockAnalysis = {
        recommendation: {
          primary: 'provider-1',
          backup: [],
          reasoning: 'Best cost-performance ratio',
          confidenceLevel: 85,
          expectedSavings: 0.002
        },
        providers: [{
          providerId: 'provider-1',
          estimatedCost: 0.0015
        }]
      };

      mockCostOptimizer.analyzeServiceOptions.mockResolvedValueOnce(mockAnalysis);

      // Mock the schedulePayment method
      jest.spyOn(intelligentScheduler, 'schedulePayment').mockResolvedValueOnce('job-456');

      const jobId = await intelligentScheduler.scheduleOptimizedPayment(
        mockServiceRequest,
        mockProviders
      );

      expect(jobId).toBe('job-456');
      expect(mockCostOptimizer.analyzeServiceOptions).toHaveBeenCalledWith(
        ServiceType.WEATHER_API,
        mockProviders,
        mockServiceRequest
      );
    });

    test('should throw error when no suitable provider found', async () => {
      const mockAnalysis = {
        recommendation: {
          primary: 'non-existent-provider'
        }
      };

      mockCostOptimizer.analyzeServiceOptions.mockResolvedValueOnce(mockAnalysis);

      await expect(
        intelligentScheduler.scheduleOptimizedPayment(mockServiceRequest, [mockProvider])
      ).rejects.toThrow('No suitable provider found');
    });
  });

  describe('scheduleWithFailover', () => {
    test('should use backup providers when primary fails', async () => {
      const backupProvider = { ...mockProvider, id: 'backup-provider', name: 'Backup' };
      
      jest.spyOn(intelligentScheduler, 'schedulePayment')
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockResolvedValueOnce('backup-job-789');

      const jobId = await intelligentScheduler.scheduleWithFailover(
        mockServiceRequest,
        mockProvider,
        [backupProvider]
      );

      expect(jobId).toBe('backup-job-789');
    });

    test('should throw error when all providers fail', async () => {
      const backupProvider = { ...mockProvider, id: 'backup-provider' };

      jest.spyOn(intelligentScheduler, 'schedulePayment')
        .mockRejectedValue(new Error('Provider failed'));

      await expect(
        intelligentScheduler.scheduleWithFailover(
          mockServiceRequest,
          mockProvider,
          [backupProvider]
        )
      ).rejects.toThrow('All providers failed');
    });
  });

  describe('scheduleBatch', () => {
    test('should schedule multiple requests in batch', async () => {
      const requests = [
        mockServiceRequest,
        { ...mockServiceRequest, id: 'request-2' }
      ];

      jest.spyOn(intelligentScheduler, 'scheduleOptimizedPayment')
        .mockResolvedValueOnce('job-1')
        .mockResolvedValueOnce('job-2');

      const jobIds = await intelligentScheduler.scheduleBatch(requests, [mockProvider]);

      expect(jobIds).toEqual(['job-1', 'job-2']);
    });

    test('should continue with other requests when one fails', async () => {
      const requests = [
        mockServiceRequest,
        { ...mockServiceRequest, id: 'request-2' }
      ];

      jest.spyOn(intelligentScheduler, 'scheduleOptimizedPayment')
        .mockRejectedValueOnce(new Error('First request failed'))
        .mockResolvedValueOnce('job-2');

      const jobIds = await intelligentScheduler.scheduleBatch(requests, [mockProvider]);

      expect(jobIds).toEqual(['job-2']);
    });
  });
});