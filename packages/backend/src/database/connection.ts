import { Pool, PoolClient } from 'pg';
import mongoose from 'mongoose';
import Redis from 'ioredis';

/**
 * Database connection manager for PostgreSQL, MongoDB, and Redis
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private pgPool: Pool | null = null;
  private mongoConnection: typeof mongoose | null = null;
  private redisClient: Redis | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize PostgreSQL connection
   */
  async initializePostgreSQL(): Promise<void> {
    try {
      this.pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      // Test connection
      const client = await this.pgPool.connect();
      await client.query('SELECT NOW()');
      client.release();

      console.log('✅ PostgreSQL connected successfully');
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error);
      throw error;
    }
  }

  /**
   * Initialize MongoDB connection
   */
  async initializeMongoDB(): Promise<void> {
    try {
      this.mongoConnection = await mongoose.connect(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/agentic_stablecoin',
        {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        }
      );

      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis(): Promise<void> {
    try {
      this.redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      });

      this.redisClient.on('error', (error) => {
        console.error('Redis error:', error);
      });

      this.redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      // Test connection
      await this.redisClient.ping();
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw error;
    }
  }

  /**
   * Initialize all database connections
   */
  async initializeAll(): Promise<void> {
    await Promise.all([
      this.initializePostgreSQL(),
      this.initializeMongoDB(),
      this.initializeRedis()
    ]);
  }

  /**
   * Get PostgreSQL client
   */
  async getPostgreSQLClient(): Promise<PoolClient> {
    if (!this.pgPool) {
      throw new Error('PostgreSQL not initialized');
    }
    return this.pgPool.connect();
  }

  /**
   * Execute PostgreSQL query
   */
  async executeQuery(text: string, params?: any[]): Promise<any> {
    const client = await this.getPostgreSQLClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Get MongoDB connection
   */
  getMongoose(): typeof mongoose {
    if (!this.mongoConnection) {
      throw new Error('MongoDB not initialized');
    }
    return this.mongoConnection;
  }

  /**
   * Get Redis client
   */
  getRedis(): Redis {
    if (!this.redisClient) {
      throw new Error('Redis not initialized');
    }
    return this.redisClient;
  }

  /**
   * Close all connections
   */
  async closeAll(): Promise<void> {
    const promises = [];

    if (this.pgPool) {
      promises.push(this.pgPool.end());
    }

    if (this.mongoConnection) {
      promises.push(mongoose.disconnect());
    }

    if (this.redisClient) {
      promises.push(this.redisClient.disconnect());
    }

    await Promise.all(promises);
    console.log('✅ All database connections closed');
  }

  /**
   * Health check for all databases
   */
  async healthCheck(): Promise<{
    postgresql: boolean;
    mongodb: boolean;
    redis: boolean;
  }> {
    const status = {
      postgresql: false,
      mongodb: false,
      redis: false
    };

    // PostgreSQL health check
    try {
      await this.executeQuery('SELECT 1');
      status.postgresql = true;
    } catch (error) {
      console.error('PostgreSQL health check failed:', error);
    }

    // MongoDB health check
    try {
      if (this.mongoConnection) {
        await mongoose.connection.db.admin().ping();
        status.mongodb = true;
      }
    } catch (error) {
      console.error('MongoDB health check failed:', error);
    }

    // Redis health check
    try {
      if (this.redisClient) {
        await this.redisClient.ping();
        status.redis = true;
      }
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    return status;
  }
}

/**
 * Service Provider Repository
 */
export class ServiceProviderRepository {
  private db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  async create(provider: any): Promise<any> {
    const query = `
      INSERT INTO service_providers (name, type, base_url, api_key_encrypted, pricing_model, quality_metrics, configuration)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      provider.name,
      provider.type,
      provider.baseUrl,
      provider.apiKeyEncrypted,
      JSON.stringify(provider.pricingModel),
      JSON.stringify(provider.qualityMetrics),
      JSON.stringify(provider.configuration || {})
    ];

    const result = await this.db.executeQuery(query, values);
    return result.rows[0];
  }

  async findById(id: string): Promise<any> {
    const query = 'SELECT * FROM service_providers WHERE id = $1';
    const result = await this.db.executeQuery(query, [id]);
    return result.rows[0];
  }

  async findByType(type: string): Promise<any[]> {
    const query = 'SELECT * FROM service_providers WHERE type = $1 AND is_active = true';
    const result = await this.db.executeQuery(query, [type]);
    return result.rows;
  }

  async update(id: string, updates: any): Promise<any> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE service_providers 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [id, ...Object.values(updates)];
    const result = await this.db.executeQuery(query, values);
    return result.rows[0];
  }

  async delete(id: string): Promise<boolean> {
    const query = 'UPDATE service_providers SET is_active = false WHERE id = $1';
    const result = await this.db.executeQuery(query, [id]);
    return result.rowCount > 0;
  }

  async findAll(): Promise<any[]> {
    const query = 'SELECT * FROM service_providers WHERE is_active = true ORDER BY name';
    const result = await this.db.executeQuery(query);
    return result.rows;
  }
}

/**
 * Service Request Repository
 */
export class ServiceRequestRepository {
  private db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  async create(request: any): Promise<any> {
    const query = `
      INSERT INTO service_requests (service_type, endpoint, parameters, estimated_cost, max_budget, priority, user_id, provider_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      request.serviceType,
      request.endpoint,
      JSON.stringify(request.parameters),
      request.estimatedCost,
      request.maxBudget,
      request.priority,
      request.userId,
      request.providerId
    ];

    const result = await this.db.executeQuery(query, values);
    return result.rows[0];
  }

  async updateStatus(id: string, status: string, responseData?: any, errorMessage?: string): Promise<any> {
    const query = `
      UPDATE service_requests 
      SET status = $2, response_data = $3, error_message = $4, completed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [id, status, JSON.stringify(responseData), errorMessage];
    const result = await this.db.executeQuery(query, values);
    return result.rows[0];
  }

  async findByUserId(userId: string, limit: number = 100): Promise<any[]> {
    const query = `
      SELECT sr.*, sp.name as provider_name 
      FROM service_requests sr
      LEFT JOIN service_providers sp ON sr.provider_id = sp.id
      WHERE sr.user_id = $1
      ORDER BY sr.created_at DESC
      LIMIT $2
    `;
    
    const result = await this.db.executeQuery(query, [userId, limit]);
    return result.rows;
  }

  async findPending(): Promise<any[]> {
    const query = `
      SELECT * FROM service_requests 
      WHERE status = 'pending'
      ORDER BY priority DESC, created_at ASC
    `;
    
    const result = await this.db.executeQuery(query);
    return result.rows;
  }
}

/**
 * Budget Repository
 */
export class BudgetRepository {
  private db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  async getBudget(userId: string): Promise<any> {
    const query = 'SELECT * FROM user_budgets WHERE user_id = $1';
    const result = await this.db.executeQuery(query, [userId]);
    return result.rows[0];
  }

  async updateSpending(userId: string, amount: number): Promise<any> {
    const query = `
      UPDATE user_budgets 
      SET current_daily_spent = current_daily_spent + $2,
          current_monthly_spent = current_monthly_spent + $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;
    
    const result = await this.db.executeQuery(query, [userId, amount]);
    return result.rows[0];
  }

  async checkBudgetLimits(userId: string, requestAmount: number): Promise<{
    canProceed: boolean;
    dailyExceeded: boolean;
    monthlyExceeded: boolean;
    emergencyStop: boolean;
  }> {
    const budget = await this.getBudget(userId);
    
    if (!budget) {
      return {
        canProceed: false,
        dailyExceeded: true,
        monthlyExceeded: true,
        emergencyStop: true
      };
    }

    const projectedDaily = budget.current_daily_spent + requestAmount;
    const projectedMonthly = budget.current_monthly_spent + requestAmount;
    
    return {
      canProceed: projectedDaily <= budget.daily_limit && 
                  projectedMonthly <= budget.monthly_limit && 
                  !budget.is_emergency_stopped,
      dailyExceeded: projectedDaily > budget.daily_limit,
      monthlyExceeded: projectedMonthly > budget.monthly_limit,
      emergencyStop: budget.is_emergency_stopped
    };
  }
}

/**
 * Analytics Repository
 */
export class AnalyticsRepository {
  private db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  async getDailyCostSummary(userId: string, days: number = 30): Promise<any[]> {
    const query = `
      SELECT * FROM daily_cost_summary 
      WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date DESC
    `;
    
    const result = await this.db.executeQuery(query, [userId]);
    return result.rows;
  }

  async getProviderPerformance(providerId: string, hours: number = 24): Promise<any[]> {
    const query = `
      SELECT * FROM performance_metrics 
      WHERE provider_id = $1 AND timestamp_hour >= CURRENT_TIMESTAMP - INTERVAL '${hours} hours'
      ORDER BY timestamp_hour DESC
    `;
    
    const result = await this.db.executeQuery(query, [providerId]);
    return result.rows;
  }

  async getCostSavings(userId: string, days: number = 30): Promise<any> {
    const query = `
      SELECT 
        SUM(total_cost) as total_spent,
        SUM(cost_savings) as total_savings,
        COUNT(*) as total_requests
      FROM analytics_daily 
      WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '${days} days'
    `;
    
    const result = await this.db.executeQuery(query, [userId]);
    return result.rows[0];
  }
}

// Export singleton instance
export const dbManager = DatabaseManager.getInstance();