import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { Redis } from 'ioredis';
import { CostOptimizer } from '../ai-components/cost-optimizer';
import { ServiceQualityMonitor } from '../ai-components/service-monitor';
import { PaymentScheduler } from '../scheduler/payment-scheduler';
import { ServiceRequestRepository, ServiceProviderRepository, BudgetRepository } from '../database/connection';
import { MockServiceProviderRepository, MockServiceRequestRepository, MockBudgetRepository } from '../database/mock-repositories';
import { ServiceRequest, ServiceProvider, ServiceType, Priority } from '../types';

export interface GatewayConfig {
  port: number;
  corsOrigins: string[];
  rateLimitWindow: number;
  rateLimitMax: number;
  redisUrl: string;
  jwtSecret: string;
  requestTimeout: number;
}

export interface ServiceRequestPayload {
  serviceType: ServiceType;
  endpoint: string;
  parameters: Record<string, any>;
  maxBudget: number;
  priority?: Priority;
  preferredProvider?: string;
  userId: string;
}

export interface CostEstimationRequest {
  serviceType: ServiceType;
  parameters: Record<string, any>;
  providers?: string[];
}

/**
 * API Gateway with intelligent cost calculation and request routing
 */
export class AgenticAPIGateway {
  private app: express.Application;
  private rateLimiter: RateLimiterRedis;
  private costOptimizer: CostOptimizer;
  private qualityMonitor: ServiceQualityMonitor;
  private paymentScheduler: PaymentScheduler;
  private serviceRequestRepo: ServiceRequestRepository;
  private serviceProviderRepo: ServiceProviderRepository;
  private budgetRepo: BudgetRepository;
  private config: GatewayConfig;

  constructor(
    config: GatewayConfig,
    paymentScheduler: PaymentScheduler,
    qualityMonitor: ServiceQualityMonitor
  ) {
    this.config = config;
    this.app = express();
    this.paymentScheduler = paymentScheduler;
    this.qualityMonitor = qualityMonitor;
    this.costOptimizer = new CostOptimizer();
    // Use mock repositories if in development mode or if databases are not available
    const useMockData = process.env.NODE_ENV === 'development' || process.env.USE_MOCK_DATA === 'true';
    
    if (useMockData) {
      console.log('🔧 Using mock repositories for development');
      this.serviceRequestRepo = new MockServiceRequestRepository() as any;
      this.serviceProviderRepo = new MockServiceProviderRepository() as any;
      this.budgetRepo = new MockBudgetRepository() as any;
    } else {
      this.serviceRequestRepo = new ServiceRequestRepository();
      this.serviceProviderRepo = new ServiceProviderRepository();
      this.budgetRepo = new BudgetRepository();
    }

    // Initialize rate limiter
    try {
      this.rateLimiter = new RateLimiterRedis({
        storeClient: new Redis(config.redisUrl),
        keyPrefix: 'rl_api_',
        points: config.rateLimitMax,
        duration: config.rateLimitWindow,
        blockDuration: 60, // Block for 1 minute
      });
    } catch (error) {
      console.warn('⚠️ Redis not available, using mock rate limiter');
      // Mock rate limiter for development
      this.rateLimiter = {
        consume: async () => Promise.resolve()
      } as any;
    }

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true,
    }));

    // Logging
    this.app.use(morgan('combined'));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Rate limiting middleware
    this.app.use(async (req: Request, res: Response, next: NextFunction) => {
      try {
        await this.rateLimiter.consume(req.ip);
        next();
      } catch (rateLimiterRes) {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
            retryAfter: rateLimiterRes.msBeforeNext,
          },
          timestamp: new Date(),
          requestId: this.generateRequestId(),
        });
      }
    });

    // Request timeout
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.setTimeout(this.config.requestTimeout, () => {
        res.status(408).json({
          success: false,
          error: {
            code: 'REQUEST_TIMEOUT',
            message: 'Request timeout',
          },
          timestamp: new Date(),
          requestId: this.generateRequestId(),
        });
      });
      next();
    });

    // Add request ID
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      (req as any).requestId = this.generateRequestId();
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', this.handleHealthCheck.bind(this));

    // Service discovery
    this.app.get('/api/v1/providers', this.handleGetProviders.bind(this));
    this.app.get('/api/v1/providers/:type', this.handleGetProvidersByType.bind(this));

    // Cost estimation
    this.app.post('/api/v1/estimate-cost', this.handleCostEstimation.bind(this));
    this.app.post('/api/v1/compare-providers', this.handleProviderComparison.bind(this));

    // Service requests
    this.app.post('/api/v1/service-request', this.handleServiceRequest.bind(this));
    this.app.get('/api/v1/service-request/:id', this.handleGetServiceRequest.bind(this));
    this.app.get('/api/v1/service-requests', this.handleGetServiceRequests.bind(this));

    // Budget management
    this.app.get('/api/v1/budget/:userId', this.handleGetBudget.bind(this));
    this.app.put('/api/v1/budget/:userId', this.handleUpdateBudget.bind(this));

    // Analytics
    this.app.get('/api/v1/analytics/costs/:userId', this.handleCostAnalytics.bind(this));
    this.app.get('/api/v1/analytics/providers', this.handleProviderAnalytics.bind(this));

    // System monitoring
    this.app.get('/api/v1/monitoring/alerts', this.handleGetAlerts.bind(this));
    this.app.get('/api/v1/monitoring/provider-health', this.handleProviderHealth.bind(this));

    this.app.post('/api/v1/agent/start', (req, res) => this.sendSuccessResponse(res, { message: 'Agent started' }, (req as any).requestId));
    this.app.post('/api/v1/agent/stop', (req, res) => this.sendSuccessResponse(res, { message: 'Agent stopped' }, (req as any).requestId));

    // Admin endpoints
    this.app.post('/api/v1/admin/providers', this.handleCreateProvider.bind(this));
    this.app.put('/api/v1/admin/providers/:id', this.handleUpdateProvider.bind(this));
    this.app.delete('/api/v1/admin/providers/:id', this.handleDeleteProvider.bind(this));
  }

  /**
   * Health check endpoint
   */
  private async handleHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const schedulerHealth = await this.paymentScheduler.healthCheck();
      const queueStats = await this.paymentScheduler.getQueueStats();

      const health = {
        status: 'healthy',
        timestamp: new Date(),
        services: {
          api: true,
          scheduler: schedulerHealth.isHealthy,
          monitor: true,
        },
        stats: {
          queue: queueStats,
        },
      };

      res.json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get all service providers
   */
  private async handleGetProviders(req: Request, res: Response): Promise<void> {
    try {
      const providers = await this.serviceProviderRepo.findAll();
      
      // Add quality metrics
      const providersWithMetrics = await Promise.all(
        providers.map(async (provider) => ({
          ...provider,
          qualityMetrics: this.qualityMonitor.getQualityMetrics(provider.id),
          reputationScore: this.qualityMonitor.calculateReputationScore(provider.id),
        }))
      );

      this.sendSuccessResponse(res, providersWithMetrics, (req as any).requestId);
    } catch (error) {
      this.sendErrorResponse(res, 'PROVIDERS_FETCH_ERROR', error, (req as any).requestId);
    }
  }

  /**
   * Get providers by service type
   */
  private async handleGetProvidersByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const providers = await this.serviceProviderRepo.findByType(type);

      const providersWithMetrics = await Promise.all(
        providers.map(async (provider) => ({
          ...provider,
          qualityMetrics: this.qualityMonitor.getQualityMetrics(provider.id),
          reputationScore: this.qualityMonitor.calculateReputationScore(provider.id),
        }))
      );

      this.sendSuccessResponse(res, providersWithMetrics, (req as any).requestId);
    } catch (error) {
      this.sendErrorResponse(res, 'PROVIDERS_TYPE_FETCH_ERROR', error, (req as any).requestId);
    }
  }

  /**
   * Cost estimation endpoint
   */
  private async handleCostEstimation(req: Request, res: Response): Promise<void> {
    try {
      const { serviceType, parameters, providers: providerIds }: CostEstimationRequest = req.body;

      // Get available providers
      let providers: ServiceProvider[];
      if (providerIds && providerIds.length > 0) {
        providers = await Promise.all(
          providerIds.map(id => this.serviceProviderRepo.findById(id))
        );
        providers = providers.filter(p => p !== null);
      } else {
        providers = await this.serviceProviderRepo.findByType(serviceType);
      }

      if (providers.length === 0) {
        throw new Error('No providers available for this service type');
      }

      // Create a mock service request for cost analysis
      const mockRequest: ServiceRequest = {
        id: 'estimation',
        serviceType,
        endpoint: '',
        parameters,
        estimatedCost: 0,
        maxBudget: 1000, // High budget for estimation
        priority: Priority.MEDIUM,
        userId: 'estimation',
        status: 'pending' as any,
        createdAt: new Date(),
      };

      // Perform cost analysis
      const analysis = await this.costOptimizer.analyzeServiceOptions(
        serviceType,
        providers,
        mockRequest
      );

      this.sendSuccessResponse(res, analysis, (req as any).requestId);
    } catch (error) {
      this.sendErrorResponse(res, 'COST_ESTIMATION_ERROR', error, (req as any).requestId);
    }
  }

  /**
   * Provider comparison endpoint
   */
  private async handleProviderComparison(req: Request, res: Response): Promise<void> {
    try {
      const { serviceType, parameters } = req.body;
      const providers = await this.serviceProviderRepo.findByType(serviceType);

      if (providers.length === 0) {
        throw new Error('No providers available for comparison');
      }

      // Create mock request
      const mockRequest: ServiceRequest = {
        id: 'comparison',
        serviceType,
        endpoint: '',
        parameters,
        estimatedCost: 0,
        maxBudget: 1000,
        priority: Priority.MEDIUM,
        userId: 'comparison',
        status: 'pending' as any,
        createdAt: new Date(),
      };

      // Get detailed analysis for each provider
      const comparison = await Promise.all(
        providers.map(async (provider) => {
          const singleProviderAnalysis = await this.costOptimizer.analyzeServiceOptions(
            serviceType,
            [provider],
            mockRequest
          );

          return {
            provider: {
              id: provider.id,
              name: provider.name,
              type: provider.type,
            },
            analysis: singleProviderAnalysis.providers[0],
            qualityMetrics: this.qualityMonitor.getQualityMetrics(provider.id),
            reputationScore: this.qualityMonitor.calculateReputationScore(provider.id),
          };
        })
      );

      this.sendSuccessResponse(res, comparison, (req as any).requestId);
    } catch (error) {
      this.sendErrorResponse(res, 'PROVIDER_COMPARISON_ERROR', error, (req as any).requestId);
    }
  }

  /**
   * Handle service request
   */
  private async handleServiceRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestData: ServiceRequestPayload = req.body;

      // Validate request
      this.validateServiceRequest(requestData);

      // Check budget
      const budgetCheck = await this.budgetRepo.checkBudgetLimits(
        requestData.userId,
        requestData.maxBudget
      );

      if (!budgetCheck.canProceed) {
        throw new Error(`Budget constraints: ${JSON.stringify(budgetCheck)}`);
      }

      // Get available providers
      const providers = await this.serviceProviderRepo.findByType(requestData.serviceType);
      if (providers.length === 0) {
        throw new Error('No providers available for this service type');
      }

      // Create service request
      const serviceRequest = await this.serviceRequestRepo.create({
        serviceType: requestData.serviceType,
        endpoint: requestData.endpoint,
        parameters: requestData.parameters,
        estimatedCost: 0, // Will be calculated
        maxBudget: requestData.maxBudget,
        priority: requestData.priority || Priority.MEDIUM,
        userId: requestData.userId,
        providerId: null, // Will be determined by cost optimization
      });

      // Perform cost optimization to select provider
      const analysis = await this.costOptimizer.analyzeServiceOptions(
        requestData.serviceType,
        providers,
        serviceRequest
      );

      const selectedProvider = providers.find(
        p => p.id === analysis.recommendation.primary
      );

      if (!selectedProvider) {
        throw new Error('Failed to select optimal provider');
      }

      // Update service request with selected provider and estimated cost
      serviceRequest.providerId = selectedProvider.id;
      serviceRequest.estimatedCost = analysis.providers[0].estimatedCost;

      // Schedule payment
      const jobId = await this.paymentScheduler.schedulePayment(
        serviceRequest,
        selectedProvider
      );

      const response = {
        serviceRequestId: serviceRequest.id,
        jobId,
        selectedProvider: {
          id: selectedProvider.id,
          name: selectedProvider.name,
        },
        estimatedCost: serviceRequest.estimatedCost,
        analysis: analysis.analysis,
        status: 'scheduled',
      };

      this.sendSuccessResponse(res, response, (req as any).requestId);
    } catch (error) {
      this.sendErrorResponse(res, 'SERVICE_REQUEST_ERROR', error, (req as any).requestId);
    }
  }

  /**
   * Get service request details
   */
  private async handleGetServiceRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const serviceRequest = await this.serviceRequestRepo.findById(id);

      if (!serviceRequest) {
        res.status(404).json({
          success: false,
          error: {
            code: 'SERVICE_REQUEST_NOT_FOUND',
            message: 'Service request not found',
          },
          timestamp: new Date(),
          requestId: (req as any).requestId,
        });
        return;
      }

      this.sendSuccessResponse(res, serviceRequest, (req as any).requestId);
    } catch (error) {
      this.sendErrorResponse(res, 'SERVICE_REQUEST_GET_ERROR', error, (req as any).requestId);
    }
  }

  /**
   * Get user's service requests
   */
  private async handleGetServiceRequests(req: Request, res: Response): Promise<void> {
    try {
      const { userId, limit = 100 } = req.query;
      
      if (!userId) {
        throw new Error('userId is required');
      }

      const serviceRequests = await this.serviceRequestRepo.findByUserId(
        userId as string,
        parseInt(limit as string)
      );

      this.sendSuccessResponse(res, serviceRequests, (req as any).requestId);
    } catch (error) {
      this.sendErrorResponse(res, 'SERVICE_REQUESTS_GET_ERROR', error, (req as any).requestId);
    }
  }

  /**
   * Get user budget
   */
  private async handleGetBudget(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const budget = await this.budgetRepo.getBudget(userId);

      if (!budget) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BUDGET_NOT_FOUND',
            message: 'Budget not found for user',
          },
          timestamp: new Date(),
          requestId: (req as any).requestId,
        });
        return;
      }

      this.sendSuccessResponse(res, budget, (req as any).requestId);
    } catch (error) {
      this.sendErrorResponse(res, 'BUDGET_GET_ERROR', error, (req as any).requestId);
    }
  }

  /**
   * Update user budget
   */
  private async handleUpdateBudget(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const updates = req.body;

      // TODO: Implement budget update logic
      this.sendSuccessResponse(res, { message: 'Budget update not yet implemented' }, (req as any).requestId);
    } catch (error) {
      this.sendErrorResponse(res, 'BUDGET_UPDATE_ERROR', error, (req as any).requestId);
    }
  }

  /**
   * Get cost analytics
   */
  private async handleCostAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { days = 30 } = req.query;

      // TODO: Implement analytics from AnalyticsRepository
      const analytics = {
        totalSpent: 150.50,
        totalSavings: 45.25,
        requestCount: 234,
        averageCost: 0.64,
        period: `${days} days`,
      };

      this.sendSuccessResponse(res, analytics, (req as any).requestId);
    } catch (error) {
      this.sendErrorResponse(res, 'ANALYTICS_ERROR', error, (req as any).requestId);
    }
  }

  /**
   * Get provider analytics
   */
  private async handleProviderAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const providers = await this.serviceProviderRepo.findAll();
      
      const analytics = await Promise.all(
        providers.map(async (provider) => ({
          id: provider.id,
          name: provider.name,
          stats: this.qualityMonitor.getProviderStats(provider.id),
        }))
      );

      this.sendSuccessResponse(res, analytics, (req as any).requestId);
    } catch (error) {
      this.sendErrorResponse(res, 'PROVIDER_ANALYTICS_ERROR', error, (req as any).requestId);
    }
  }

  /**
   * Get system alerts
   */
  private async handleGetAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { severity } = req.query;
      const alerts = this.qualityMonitor.getAlerts(severity as any);

      this.sendSuccessResponse(res, alerts, (req as any).requestId);
    } catch (error) {
      this.sendErrorResponse(res, 'ALERTS_GET_ERROR', error, (req as any).requestId);
    }
  }

  /**
   * Get provider health status
   */
  private async handleProviderHealth(req: Request, res: Response): Promise<void> {
    try {
      const providers = await this.serviceProviderRepo.findAll();
      
      const healthStatus = await Promise.all(
        providers.map(async (provider) => ({
          id: provider.id,
          name: provider.name,
          health: this.qualityMonitor.getProviderStats(provider.id),
          lastCheck: new Date(),
        }))
      );

      this.sendSuccessResponse(res, healthStatus, (req as any).requestId);
    } catch (error) {
      this.sendErrorResponse(res, 'PROVIDER_HEALTH_ERROR', error, (req as any).requestId);
    }
  }

  /**
   * Create provider (admin)
   */
  private async handleCreateProvider(req: Request, res: Response): Promise<void> {
    try {
      const providerData = req.body;
      const provider = await this.serviceProviderRepo.create(providerData);

      // Register with monitoring
      this.qualityMonitor.registerProvider(provider);

      this.sendSuccessResponse(res, provider, (req as any).requestId);
    } catch (error) {
      this.sendErrorResponse(res, 'PROVIDER_CREATE_ERROR', error, (req as any).requestId);
    }
  }

  /**
   * Update provider (admin)
   */
  private async handleUpdateProvider(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const provider = await this.serviceProviderRepo.update(id, updates);
      this.sendSuccessResponse(res, provider, (req as any).requestId);
    } catch (error) {
      this.sendErrorResponse(res, 'PROVIDER_UPDATE_ERROR', error, (req as any).requestId);
    }
  }

  /**
   * Delete provider (admin)
   */
  private async handleDeleteProvider(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      await this.serviceProviderRepo.delete(id);
      this.qualityMonitor.unregisterProvider(id);

      this.sendSuccessResponse(res, { message: 'Provider deleted' }, (req as any).requestId);
    } catch (error) {
      this.sendErrorResponse(res, 'PROVIDER_DELETE_ERROR', error, (req as any).requestId);
    }
  }

  /**
   * Validate service request payload
   */
  private validateServiceRequest(request: ServiceRequestPayload): void {
    const required = ['serviceType', 'endpoint', 'parameters', 'maxBudget', 'userId'];
    
    for (const field of required) {
      if (!(field in request)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (request.maxBudget <= 0) {
      throw new Error('maxBudget must be greater than 0');
    }

    if (!Object.values(ServiceType).includes(request.serviceType)) {
      throw new Error(`Invalid service type: ${request.serviceType}`);
    }
  }

  /**
   * Send success response
   */
  private sendSuccessResponse(res: Response, data: any, requestId: string): void {
    res.json({
      success: true,
      data,
      timestamp: new Date(),
      requestId,
    });
  }

  /**
   * Send error response
   */
  private sendErrorResponse(
    res: Response,
    code: string,
    error: any,
    requestId: string,
    statusCode: number = 400
  ): void {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        details: error instanceof Error ? error.stack : undefined,
      },
      timestamp: new Date(),
      requestId,
    });
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'ENDPOINT_NOT_FOUND',
          message: 'Endpoint not found',
        },
        timestamp: new Date(),
        requestId: this.generateRequestId(),
      });
    });

    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        timestamp: new Date(),
        requestId: (req as any).requestId || this.generateRequestId(),
      });
    });
  }

  /**
   * Start the API gateway server
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.port, () => {
        console.log(`🚀 Agentic API Gateway running on port ${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * Get Express app instance
   */
  getApp(): express.Application {
    return this.app;
  }
}