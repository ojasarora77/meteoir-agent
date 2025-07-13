import dotenv from 'dotenv';
import { AgenticAPIGateway } from './api-gateway/gateway';
import { PaymentScheduler, IntelligentPaymentScheduler } from './scheduler/payment-scheduler';
import { ServiceQualityMonitor } from './ai-components/service-monitor';
import { DatabaseManager } from './database/connection';
import { MockDatabaseManager } from './database/mock-repositories';
import { CostAnalyticsEngine } from './analytics/cost-analytics';

// Load environment variables
dotenv.config();

/**
 * Main application entry point
 * Initializes and starts the Agentic Stablecoin backend system
 */
class AgenticStablecoinApp {
  private gateway: AgenticAPIGateway | null = null;
  private paymentScheduler: IntelligentPaymentScheduler | null = null;
  private qualityMonitor: ServiceQualityMonitor | null = null;
  private dbManager: DatabaseManager | null = null;
  private analyticsEngine: CostAnalyticsEngine | null = null;

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Starting Agentic Stablecoin Backend...');

      // Initialize database connections
      console.log('📊 Initializing database connections...');
      const useMockData = process.env.NODE_ENV === 'development' || process.env.USE_MOCK_DATA === 'true';
      
      if (useMockData) {
        console.log('🔧 Using mock database for development');
        this.dbManager = MockDatabaseManager.getInstance() as any;
      } else {
        this.dbManager = DatabaseManager.getInstance();
      }
      
      await this.dbManager!.initializeAll();

      // Initialize analytics engine
      console.log('📈 Initializing analytics engine...');
      this.analyticsEngine = new CostAnalyticsEngine();

      // Initialize service quality monitor
      console.log('🔍 Initializing service quality monitor...');
      this.qualityMonitor = new ServiceQualityMonitor({
        checkInterval: parseInt(process.env.MONITOR_CHECK_INTERVAL || '60000'),
        timeoutThreshold: parseInt(process.env.MONITOR_TIMEOUT_THRESHOLD || '5000'),
        uptimeThreshold: parseFloat(process.env.MONITOR_UPTIME_THRESHOLD || '95'),
        responseTimeThreshold: parseInt(process.env.MONITOR_RESPONSE_TIME_THRESHOLD || '2000'),
        errorRateThreshold: parseFloat(process.env.MONITOR_ERROR_RATE_THRESHOLD || '10'),
        alertCooldownPeriod: parseInt(process.env.MONITOR_ALERT_COOLDOWN || '300000'),
      });

      // Initialize payment scheduler
      console.log('💳 Initializing payment scheduler...');
      this.paymentScheduler = new IntelligentPaymentScheduler({
        redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
        queueName: process.env.PAYMENT_QUEUE_NAME || 'payment-processing',
        concurrency: parseInt(process.env.SCHEDULER_CONCURRENCY || '5'),
        retryDelay: parseInt(process.env.JOB_RETRY_DELAY || '5000'),
        maxRetries: parseInt(process.env.MAX_JOB_ATTEMPTS || '3'),
        staleAge: parseInt(process.env.SCHEDULER_STALE_AGE || '30000'),
        maxJobs: parseInt(process.env.SCHEDULER_MAX_JOBS || '1000'),
      });

      // Initialize API gateway
      console.log('🌐 Initializing API gateway...');
      this.gateway = new AgenticAPIGateway(
        {
          port: parseInt(process.env.PORT || '3001'),
          corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
          rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
          rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
          redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
          jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
          requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
        },
        this.paymentScheduler as any,
        this.qualityMonitor!
      );

      // Register initial service providers
      await this.registerDefaultProviders();

      console.log('✅ All systems initialized successfully');
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    try {
      if (!this.gateway) {
        throw new Error('Gateway not initialized');
      }

      // Start the API gateway
      await this.gateway.start();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      console.log('🎉 Agentic Stablecoin Backend is running!');
      console.log(`📡 API Gateway: http://localhost:${process.env.PORT || 3001}`);
      console.log(`🔍 Health Check: http://localhost:${process.env.PORT || 3001}/health`);
      
    } catch (error) {
      console.error('❌ Failed to start application:', error);
      throw error;
    }
  }

  private async registerDefaultProviders(): Promise<void> {
    try {
      console.log('📋 Registering default service providers...');

      // Register weather API providers
      const weatherProviders = [
        {
          name: 'OpenWeatherMap',
          type: 'weather_api',
          baseUrl: 'https://api.openweathermap.org/data/2.5',
          apiKeyEncrypted: process.env.OPENWEATHER_API_KEY,
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
          configuration: {
            timeout: 5000,
            retryAttempts: 3,
            cacheTTL: 300
          }
        },
        {
          name: 'WeatherAPI',
          type: 'weather_api',
          baseUrl: 'https://api.weatherapi.com/v1',
          apiKeyEncrypted: process.env.WEATHERAPI_KEY,
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
          configuration: {
            timeout: 5000,
            retryAttempts: 3,
            cacheTTL: 300
          }
        }
      ];

      // Register cloud storage providers
      const storageProviders = [
        {
          name: 'AWS S3',
          type: 'cloud_storage',
          baseUrl: 'https://s3.amazonaws.com',
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
          configuration: {
            region: process.env.AWS_REGION || 'REMOVED',
            bucketName: process.env.AWS_S3_BUCKET || 'REMOVED'
          }
        },
        {
          name: 'Pinata IPFS',
          type: 'cloud_storage',
          baseUrl: 'https://api.pinata.cloud',
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
          configuration: {
            apiKey: process.env.PINATA_API_KEY,
            secretKey: process.env.PINATA_SECRET_API_KEY,
            jwtToken: process.env.PINATA_JWT_TOKEN,
            gatewayUrl: process.env.PINATA_GATEWAY_URL
          }
        }
      ];

      // In a real implementation, these would be saved to the database
      // and registered with the quality monitor
      console.log(`✅ Registered ${weatherProviders.length} weather providers`);
      console.log(`✅ Registered ${storageProviders.length} storage providers`);

    } catch (error) {
      console.warn('⚠️  Failed to register some providers:', error);
      // Continue startup even if provider registration fails
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

      try {
        // Stop accepting new requests
        console.log('📡 Stopping API gateway...');
        
        // Shutdown payment scheduler
        if (this.paymentScheduler) {
          console.log('💳 Shutting down payment scheduler...');
          await this.paymentScheduler.shutdown();
        }

        // Shutdown quality monitor
        if (this.qualityMonitor) {
          console.log('🔍 Shutting down quality monitor...');
          this.qualityMonitor.shutdown();
        }

        // Close database connections
        if (this.dbManager) {
          console.log('📊 Closing database connections...');
          await this.dbManager.closeAll();
        }

        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  }

  async healthCheck(): Promise<{
    status: string;
    timestamp: Date;
    services: {
      database: boolean;
      redis: boolean;
      scheduler: boolean;
      monitor: boolean;
    };
    version: string;
  }> {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: false,
        redis: false,
        scheduler: false,
        monitor: true,
      },
      version: process.env.npm_package_version || '1.0.0',
    };

    try {
      // Check database health
      if (this.dbManager) {
        const dbHealth = await this.dbManager.healthCheck();
        health.services.database = dbHealth.postgresql && dbHealth.mongodb && dbHealth.redis;
        health.services.redis = dbHealth.redis;
      }

      // Check scheduler health
      if (this.paymentScheduler) {
        const schedulerHealth = await this.paymentScheduler.healthCheck();
        health.services.scheduler = schedulerHealth.isHealthy;
      }

      const allHealthy = Object.values(health.services).every(service => service);
      health.status = allHealthy ? 'healthy' : 'degraded';

    } catch (error) {
      health.status = 'unhealthy';
      console.error('Health check failed:', error);
    }

    return health;
  }
}

// Main execution
async function main() {
  const app = new AgenticStablecoinApp();
  
  try {
    await app.initialize();
    await app.start();
  } catch (error) {
    console.error('💥 Application startup failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export default AgenticStablecoinApp;
export { AgenticStablecoinApp };