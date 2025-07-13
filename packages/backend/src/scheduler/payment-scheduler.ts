import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { ServiceRequest, ServiceProvider, PaymentRecord, PaymentStatus } from '../types';
import { DatabaseManager, ServiceRequestRepository, BudgetRepository } from '../database/connection';
import { CostOptimizer } from '../ai-components/cost-optimizer';

export interface PaymentJob {
  serviceRequestId: string;
  providerId: string;
  amount: number;
  currency: string;
  priority: number;
  userId: string;
  maxRetries: number;
  estimatedExecutionTime: number;
}

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  errorMessage?: string;
  actualCost?: number;
  executionTime: number;
  blockchainNetwork?: string;
  gasUsed?: number;
}

export interface SchedulerConfig {
  redisUrl: string;
  queueName: string;
  concurrency: number;
  retryDelay: number;
  maxRetries: number;
  staleAge: number;
  maxJobs: number;
}

/**
 * Payment Scheduler with intelligent queue management
 * Handles autonomous payment processing with cost optimization and failover
 */
export class PaymentScheduler {
  private queue: Queue;
  private worker: Worker;
  private redis: Redis;
  private config: SchedulerConfig;
  private costOptimizer: CostOptimizer;
  private serviceRequestRepo: ServiceRequestRepository;
  private budgetRepo: BudgetRepository;
  private isProcessing: boolean = false;

  constructor(config: SchedulerConfig) {
    this.config = config;
    this.redis = new Redis(config.redisUrl);
    this.costOptimizer = new CostOptimizer();
    this.serviceRequestRepo = new ServiceRequestRepository();
    this.budgetRepo = new BudgetRepository();

    // Initialize queue
    this.queue = new Queue(config.queueName, {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: config.maxRetries,
        backoff: {
          type: 'exponential',
          delay: config.retryDelay,
        },
      },
    });

    // Initialize worker
    this.worker = new Worker(
      config.queueName,
      async (job: Job) => this.processPayment(job),
      {
        connection: this.redis,
        concurrency: config.concurrency,
        stalledInterval: 30000,
        maxStalledCount: 1,
      }
    );

    this.setupEventHandlers();
  }

  /**
   * Schedule a payment request
   */
  async schedulePayment(
    serviceRequest: ServiceRequest,
    provider: ServiceProvider,
    options?: {
      delay?: number;
      priority?: number;
    }
  ): Promise<string> {
    // Check budget constraints
    const budgetCheck = await this.budgetRepo.checkBudgetLimits(
      serviceRequest.userId,
      serviceRequest.estimatedCost
    );

    if (!budgetCheck.canProceed) {
      throw new Error(
        `Budget constraints exceeded: ${JSON.stringify(budgetCheck)}`
      );
    }

    const paymentJob: PaymentJob = {
      serviceRequestId: serviceRequest.id,
      providerId: provider.id,
      amount: serviceRequest.estimatedCost,
      currency: 'USDC',
      priority: this.getPriorityScore(serviceRequest.priority),
      userId: serviceRequest.userId,
      maxRetries: this.config.maxRetries,
      estimatedExecutionTime: this.estimateExecutionTime(serviceRequest),
    };

    const job = await this.queue.add(
      'payment',
      paymentJob,
      {
        priority: paymentJob.priority,
        delay: options?.delay || 0,
        attempts: paymentJob.maxRetries,
      }
    );

    // Update service request status
    await this.serviceRequestRepo.updateStatus(
      serviceRequest.id,
      'processing'
    );

    console.log(`Payment scheduled: ${job.id} for service request ${serviceRequest.id}`);
    return job.id!;
  }

  /**
   * Process a payment job
   */
  private async processPayment(job: Job<PaymentJob>): Promise<PaymentResult> {
    const startTime = Date.now();
    const { serviceRequestId, providerId, amount, currency, userId } = job.data;

    try {
      console.log(`Processing payment job ${job.id} for service request ${serviceRequestId}`);

      // Double-check budget before processing
      const budgetCheck = await this.budgetRepo.checkBudgetLimits(userId, amount);
      if (!budgetCheck.canProceed) {
        throw new Error('Budget exceeded during payment processing');
      }

      // Execute the actual service call and payment
      const result = await this.executeServicePayment(job.data);

      if (result.success) {
        // Update budget
        await this.budgetRepo.updateSpending(userId, result.actualCost || amount);

        // Update service request
        await this.serviceRequestRepo.updateStatus(
          serviceRequestId,
          'completed',
          { paymentResult: result }
        );

        console.log(`Payment completed: ${job.id}`);
      } else {
        // Update service request with error
        await this.serviceRequestRepo.updateStatus(
          serviceRequestId,
          'failed',
          undefined,
          result.errorMessage
        );

        console.error(`Payment failed: ${job.id} - ${result.errorMessage}`);
      }

      result.executionTime = Date.now() - startTime;
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update service request with error
      await this.serviceRequestRepo.updateStatus(
        serviceRequestId,
        'failed',
        undefined,
        errorMessage
      );

      console.error(`Payment processing error: ${job.id}`, error);

      return {
        success: false,
        errorMessage,
        executionTime,
      };
    }
  }

  /**
   * Execute the actual service payment
   */
  private async executeServicePayment(jobData: PaymentJob): Promise<PaymentResult> {
    // In a real implementation, this would:
    // 1. Call the service API
    // 2. Execute blockchain payment
    // 3. Verify payment confirmation
    // 4. Handle any errors or retries

    const { serviceRequestId, providerId, amount, currency } = jobData;

    try {
      // Simulate service call and payment processing
      await this.simulateServiceCall(serviceRequestId, providerId);
      
      // Simulate blockchain payment
      const paymentResult = await this.simulateBlockchainPayment(amount, currency);

      return {
        success: true,
        transactionHash: paymentResult.transactionHash,
        actualCost: paymentResult.actualCost,
        executionTime: 0, // Will be set by caller
        blockchainNetwork: 'REI Network',
        gasUsed: paymentResult.gasUsed,
      };

    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Payment execution failed',
        executionTime: 0,
      };
    }
  }

  /**
   * Simulate service API call
   */
  private async simulateServiceCall(serviceRequestId: string, providerId: string): Promise<void> {
    // In real implementation, this would make the actual API call
    const delay = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Service API call failed');
    }
  }

  /**
   * Simulate blockchain payment
   */
  private async simulateBlockchainPayment(amount: number, currency: string): Promise<{
    transactionHash: string;
    actualCost: number;
    gasUsed: number;
  }> {
    // Simulate blockchain transaction time
    const delay = Math.random() * 2000 + 1000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate occasional blockchain failures
    if (Math.random() < 0.02) { // 2% failure rate
      throw new Error('Blockchain transaction failed');
    }

    return {
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      actualCost: amount + (Math.random() * 0.001), // Add small variance
      gasUsed: Math.floor(Math.random() * 50000 + 21000),
    };
  }

  /**
   * Setup event handlers for queue monitoring
   */
  private setupEventHandlers(): void {
    this.queue.on('completed', (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    this.queue.on('failed', (job, error) => {
      console.error(`Job ${job?.id} failed:`, error);
    });

    this.queue.on('stalled', (jobId) => {
      console.warn(`Job ${jobId} stalled`);
    });

    this.worker.on('completed', (job) => {
      console.log(`Worker completed job ${job.id}`);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`Worker failed job ${job?.id}:`, error);
    });

    this.worker.on('error', (error) => {
      console.error('Worker error:', error);
    });
  }

  /**
   * Get priority score for job ordering
   */
  private getPriorityScore(priority: string): number {
    const priorities = {
      'critical': 10,
      'high': 7,
      'medium': 5,
      'low': 1,
    };
    return priorities[priority as keyof typeof priorities] || 5;
  }

  /**
   * Estimate execution time for a service request
   */
  private estimateExecutionTime(request: ServiceRequest): number {
    // Basic estimation based on service type
    const baseTimes = {
      'weather_api': 1000,
      'cloud_storage': 2000,
      'compute_service': 5000,
      'data_feed': 1500,
      'gpu_rental': 10000,
      'serverless': 3000,
    };

    return baseTimes[request.serviceType as keyof typeof baseTimes] || 2000;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length,
    };
  }

  /**
   * Get job details
   */
  async getJob(jobId: string): Promise<Job | null> {
    return this.queue.getJob(jobId);
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.getJob(jobId);
    if (job) {
      await job.remove();
      return true;
    }
    return false;
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    const job = await this.getJob(jobId);
    if (job && job.failedReason) {
      await job.retry();
      return true;
    }
    return false;
  }

  /**
   * Clean up completed and failed jobs
   */
  async cleanup(): Promise<void> {
    await this.queue.clean(24 * 60 * 60 * 1000, 100); // Clean jobs older than 24 hours
  }

  /**
   * Pause job processing
   */
  async pause(): Promise<void> {
    await this.queue.pause();
    this.isProcessing = false;
    console.log('Payment scheduler paused');
  }

  /**
   * Resume job processing
   */
  async resume(): Promise<void> {
    await this.queue.resume();
    this.isProcessing = true;
    console.log('Payment scheduler resumed');
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down payment scheduler...');
    
    await this.worker.close();
    await this.queue.close();
    await this.redis.disconnect();
    
    this.isProcessing = false;
    console.log('Payment scheduler shutdown complete');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    details: {
      queueConnected: boolean;
      workerRunning: boolean;
      redisConnected: boolean;
      stats: any;
    };
  }> {
    try {
      const stats = await this.getQueueStats();
      const queueConnected = await this.queue.isPaused() !== undefined;
      const workerRunning = this.worker.isRunning();
      const redisConnected = this.redis.status === 'ready';

      const isHealthy = queueConnected && workerRunning && redisConnected;

      return {
        isHealthy,
        details: {
          queueConnected,
          workerRunning,
          redisConnected,
          stats,
        },
      };
    } catch (error) {
      return {
        isHealthy: false,
        details: {
          queueConnected: false,
          workerRunning: false,
          redisConnected: false,
          stats: null,
        },
      };
    }
  }
}

/**
 * Budget-aware payment scheduler that considers cost optimization
 */
export class IntelligentPaymentScheduler extends PaymentScheduler {
  private costOptimizer: CostOptimizer;

  constructor(config: SchedulerConfig) {
    super(config);
    this.costOptimizer = new CostOptimizer();
  }

  /**
   * Schedule payment with cost optimization
   */
  async scheduleOptimizedPayment(
    serviceRequest: ServiceRequest,
    availableProviders: ServiceProvider[]
  ): Promise<string> {
    // Analyze providers for cost optimization
    const analysis = await this.costOptimizer.analyzeServiceOptions(
      serviceRequest.serviceType,
      availableProviders,
      serviceRequest
    );

    // Get the recommended provider
    const recommendedProvider = availableProviders.find(
      p => p.id === analysis.recommendation.primary
    );

    if (!recommendedProvider) {
      throw new Error('No suitable provider found');
    }

    // Schedule payment with optimized provider
    return this.schedulePayment(serviceRequest, recommendedProvider);
  }

  /**
   * Schedule payment with automatic failover
   */
  async scheduleWithFailover(
    serviceRequest: ServiceRequest,
    primaryProvider: ServiceProvider,
    backupProviders: ServiceProvider[]
  ): Promise<string> {
    try {
      // Try primary provider first
      return await this.schedulePayment(serviceRequest, primaryProvider);
    } catch (error) {
      console.warn(`Primary provider failed, trying backup providers:`, error);

      // Try backup providers
      for (const backupProvider of backupProviders) {
        try {
          return await this.schedulePayment(serviceRequest, backupProvider);
        } catch (backupError) {
          console.warn(`Backup provider ${backupProvider.name} failed:`, backupError);
          continue;
        }
      }

      throw new Error('All providers failed');
    }
  }

  /**
   * Batch schedule multiple payments with optimization
   */
  async scheduleBatch(
    requests: ServiceRequest[],
    providers: ServiceProvider[]
  ): Promise<string[]> {
    const jobIds: string[] = [];

    for (const request of requests) {
      try {
        const jobId = await this.scheduleOptimizedPayment(request, providers);
        jobIds.push(jobId);
      } catch (error) {
        console.error(`Failed to schedule request ${request.id}:`, error);
        // Continue with other requests
      }
    }

    return jobIds;
  }
}