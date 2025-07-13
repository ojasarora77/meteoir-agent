import { ServiceProvider, QualityMetrics, PerformanceMetrics, SystemAlert, AlertType, AlertSeverity, ServiceType } from '../types';

export interface MonitoringConfig {
  checkInterval: number; // milliseconds
  timeoutThreshold: number; // milliseconds
  uptimeThreshold: number; // percentage
  responseTimeThreshold: number; // milliseconds
  errorRateThreshold: number; // percentage
  alertCooldownPeriod: number; // milliseconds
}

export interface ServiceCheck {
  providerId: string;
  timestamp: Date;
  isHealthy: boolean;
  responseTime: number;
  errorMessage?: string;
  statusCode?: number;
}

export interface ProviderReputationScore {
  providerId: string;
  score: number; // 0-100
  factors: {
    uptime: number;
    averageResponseTime: number;
    errorRate: number;
    dataAccuracy: number;
    costEffectiveness: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
}

/**
 * Service Quality Monitor - Tracks performance and reliability of service providers
 */
export class ServiceQualityMonitor {
  private config: MonitoringConfig;
  private providers: Map<string, ServiceProvider> = new Map();
  private healthChecks: Map<string, ServiceCheck[]> = new Map();
  private performanceMetrics: Map<string, PerformanceMetrics[]> = new Map();
  private alerts: SystemAlert[] = [];
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private lastAlertTime: Map<string, number> = new Map();

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      checkInterval: 60000, // 1 minute
      timeoutThreshold: 5000, // 5 seconds
      uptimeThreshold: 95, // 95%
      responseTimeThreshold: 2000, // 2 seconds
      errorRateThreshold: 10, // 10%
      alertCooldownPeriod: 300000, // 5 minutes
      ...config
    };
  }

  /**
   * Register a service provider for monitoring
   */
  registerProvider(provider: ServiceProvider): void {
    this.providers.set(provider.id, provider);
    this.healthChecks.set(provider.id, []);
    this.performanceMetrics.set(provider.id, []);
    
    // Start monitoring this provider
    this.startMonitoring(provider.id);
  }

  /**
   * Unregister a service provider
   */
  unregisterProvider(providerId: string): void {
    this.stopMonitoring(providerId);
    this.providers.delete(providerId);
    this.healthChecks.delete(providerId);
    this.performanceMetrics.delete(providerId);
  }

  /**
   * Start monitoring a specific provider
   */
  private startMonitoring(providerId: string): void {
    const interval = setInterval(async () => {
      await this.performHealthCheck(providerId);
    }, this.config.checkInterval);
    
    this.monitoringIntervals.set(providerId, interval);
  }

  /**
   * Stop monitoring a specific provider
   */
  private stopMonitoring(providerId: string): void {
    const interval = this.monitoringIntervals.get(providerId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(providerId);
    }
  }

  /**
   * Perform health check on a provider
   */
  async performHealthCheck(providerId: string): Promise<ServiceCheck> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const startTime = Date.now();
    let isHealthy = false;
    let errorMessage: string | undefined;
    let statusCode: number | undefined;

    try {
      // Perform actual health check based on service type
      const healthCheckResult = await this.executeHealthCheck(provider);
      isHealthy = healthCheckResult.isHealthy;
      statusCode = healthCheckResult.statusCode;
      
      if (!isHealthy) {
        errorMessage = healthCheckResult.errorMessage;
      }
    } catch (error) {
      isHealthy = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    const responseTime = Date.now() - startTime;
    
    const check: ServiceCheck = {
      providerId,
      timestamp: new Date(),
      isHealthy,
      responseTime,
      errorMessage,
      statusCode
    };

    // Store health check result
    this.addHealthCheck(providerId, check);

    // Record performance metrics
    this.recordPerformanceMetrics(providerId, check);

    // Check for alerts
    await this.checkForAlerts(providerId, check);

    return check;
  }

  /**
   * Execute actual health check based on service type
   */
  private async executeHealthCheck(provider: ServiceProvider): Promise<{
    isHealthy: boolean;
    statusCode?: number;
    errorMessage?: string;
  }> {
    switch (provider.type) {
      case ServiceType.WEATHER_API:
        return this.checkWeatherAPI(provider);
      case ServiceType.CLOUD_STORAGE:
        return this.checkCloudStorage(provider);
      case ServiceType.COMPUTE_SERVICE:
        return this.checkComputeService(provider);
      case ServiceType.DATA_FEED:
        return this.checkDataFeed(provider);
      default:
        return this.checkGenericHTTP(provider);
    }
  }

  private async checkWeatherAPI(provider: ServiceProvider): Promise<any> {
    try {
      const response = await fetch(`${provider.baseUrl}/weather?q=London&appid=${provider.apiKey}`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeoutThreshold)
      });

      return {
        isHealthy: response.ok,
        statusCode: response.status,
        errorMessage: response.ok ? undefined : `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        isHealthy: false,
        errorMessage: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  private async checkCloudStorage(provider: ServiceProvider): Promise<any> {
    try {
      // Perform a simple list operation or ping
      const response = await fetch(`${provider.baseUrl}/health`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(this.config.timeoutThreshold)
      });

      return {
        isHealthy: response.ok,
        statusCode: response.status
      };
    } catch (error) {
      return {
        isHealthy: false,
        errorMessage: error instanceof Error ? error.message : 'Storage service unavailable'
      };
    }
  }

  private async checkComputeService(provider: ServiceProvider): Promise<any> {
    try {
      const response = await fetch(`${provider.baseUrl}/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeoutThreshold)
      });

      return {
        isHealthy: response.ok,
        statusCode: response.status
      };
    } catch (error) {
      return {
        isHealthy: false,
        errorMessage: error instanceof Error ? error.message : 'Compute service unavailable'
      };
    }
  }

  private async checkDataFeed(provider: ServiceProvider): Promise<any> {
    try {
      const response = await fetch(`${provider.baseUrl}/ping`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeoutThreshold)
      });

      return {
        isHealthy: response.ok,
        statusCode: response.status
      };
    } catch (error) {
      return {
        isHealthy: false,
        errorMessage: error instanceof Error ? error.message : 'Data feed unavailable'
      };
    }
  }

  private async checkGenericHTTP(provider: ServiceProvider): Promise<any> {
    try {
      const response = await fetch(provider.baseUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(this.config.timeoutThreshold)
      });

      return {
        isHealthy: response.ok,
        statusCode: response.status
      };
    } catch (error) {
      return {
        isHealthy: false,
        errorMessage: error instanceof Error ? error.message : 'Service unavailable'
      };
    }
  }

  /**
   * Add health check result to history
   */
  private addHealthCheck(providerId: string, check: ServiceCheck): void {
    const checks = this.healthChecks.get(providerId) || [];
    checks.push(check);
    
    // Keep only last 1000 checks
    if (checks.length > 1000) {
      checks.splice(0, checks.length - 1000);
    }
    
    this.healthChecks.set(providerId, checks);
  }

  /**
   * Record performance metrics
   */
  private recordPerformanceMetrics(providerId: string, check: ServiceCheck): void {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    const metrics: PerformanceMetrics = {
      timestamp: new Date(),
      serviceType: provider.type,
      providerId,
      metrics: {
        responseTime: check.responseTime,
        throughput: 1, // Requests per check interval
        errorRate: check.isHealthy ? 0 : 100,
        availability: check.isHealthy ? 100 : 0
      }
    };

    const providerMetrics = this.performanceMetrics.get(providerId) || [];
    providerMetrics.push(metrics);
    
    // Keep only last 24 hours of metrics (assuming 1-minute intervals)
    if (providerMetrics.length > 1440) {
      providerMetrics.splice(0, providerMetrics.length - 1440);
    }
    
    this.performanceMetrics.set(providerId, providerMetrics);
  }

  /**
   * Check for alert conditions
   */
  private async checkForAlerts(providerId: string, check: ServiceCheck): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    const now = Date.now();
    const lastAlert = this.lastAlertTime.get(providerId) || 0;
    
    // Respect cooldown period
    if (now - lastAlert < this.config.alertCooldownPeriod) {
      return;
    }

    const recentChecks = this.getRecentHealthChecks(providerId, 300000); // Last 5 minutes
    if (recentChecks.length === 0) return;

    // Check for service down
    if (!check.isHealthy) {
      await this.createAlert({
        type: AlertType.SERVICE_DOWN,
        severity: AlertSeverity.HIGH,
        message: `Service ${provider.name} is down`,
        details: {
          providerId,
          errorMessage: check.errorMessage,
          statusCode: check.statusCode,
          responseTime: check.responseTime
        },
        serviceProviderId: providerId
      });
      
      this.lastAlertTime.set(providerId, now);
      return;
    }

    // Check for performance degradation
    if (check.responseTime > this.config.responseTimeThreshold) {
      const avgResponseTime = recentChecks.reduce((sum, c) => sum + c.responseTime, 0) / recentChecks.length;
      
      if (avgResponseTime > this.config.responseTimeThreshold) {
        await this.createAlert({
          type: AlertType.PERFORMANCE_DEGRADATION,
          severity: AlertSeverity.MEDIUM,
          message: `Service ${provider.name} experiencing slow response times`,
          details: {
            providerId,
            averageResponseTime: avgResponseTime,
            threshold: this.config.responseTimeThreshold
          },
          serviceProviderId: providerId
        });
        
        this.lastAlertTime.set(providerId, now);
      }
    }

    // Check error rate
    const errorRate = (recentChecks.filter(c => !c.isHealthy).length / recentChecks.length) * 100;
    if (errorRate > this.config.errorRateThreshold) {
      await this.createAlert({
        type: AlertType.PERFORMANCE_DEGRADATION,
        severity: AlertSeverity.MEDIUM,
        message: `Service ${provider.name} has high error rate`,
        details: {
          providerId,
          errorRate,
          threshold: this.config.errorRateThreshold
        },
        serviceProviderId: providerId
      });
      
      this.lastAlertTime.set(providerId, now);
    }
  }

  /**
   * Create system alert
   */
  private async createAlert(alertData: Omit<SystemAlert, 'id' | 'isResolved' | 'createdAt'>): Promise<void> {
    const alert: SystemAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isResolved: false,
      createdAt: new Date(),
      ...alertData
    };

    this.alerts.push(alert);

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts.splice(0, this.alerts.length - 1000);
    }

    // Log alert
    console.warn(`ALERT [${alert.severity}]: ${alert.message}`, alert.details);

    // In a real implementation, send notifications here
    await this.sendNotification(alert);
  }

  /**
   * Send notification for alert
   */
  private async sendNotification(alert: SystemAlert): Promise<void> {
    // Implementation would depend on notification system (email, Slack, etc.)
    console.log(`Notification sent for alert: ${alert.id}`);
  }

  /**
   * Get recent health checks for a provider
   */
  private getRecentHealthChecks(providerId: string, timeRangeMs: number): ServiceCheck[] {
    const checks = this.healthChecks.get(providerId) || [];
    const cutoffTime = Date.now() - timeRangeMs;
    
    return checks.filter(check => check.timestamp.getTime() > cutoffTime);
  }

  /**
   * Calculate provider reputation score
   */
  calculateReputationScore(providerId: string): ProviderReputationScore {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const recentChecks = this.getRecentHealthChecks(providerId, 86400000); // Last 24 hours
    const recentMetrics = this.getRecentPerformanceMetrics(providerId, 86400000);

    if (recentChecks.length === 0) {
      return {
        providerId,
        score: 0,
        factors: {
          uptime: 0,
          averageResponseTime: 0,
          errorRate: 100,
          dataAccuracy: 0,
          costEffectiveness: 0
        },
        trend: 'stable',
        lastUpdated: new Date()
      };
    }

    // Calculate factors
    const uptime = (recentChecks.filter(c => c.isHealthy).length / recentChecks.length) * 100;
    const averageResponseTime = recentChecks.reduce((sum, c) => sum + c.responseTime, 0) / recentChecks.length;
    const errorRate = (recentChecks.filter(c => !c.isHealthy).length / recentChecks.length) * 100;
    const dataAccuracy = provider.qualityMetrics.dataAccuracy;
    
    // Cost effectiveness score (lower cost = higher score)
    const costEffectiveness = this.calculateCostEffectivenessScore(provider);

    // Calculate composite score
    const score = (
      uptime * 0.3 +
      this.responseTimeToScore(averageResponseTime) * 0.25 +
      (100 - errorRate) * 0.2 +
      dataAccuracy * 0.15 +
      costEffectiveness * 0.1
    );

    // Determine trend
    const trend = this.calculateTrend(providerId);

    return {
      providerId,
      score: Math.round(score),
      factors: {
        uptime,
        averageResponseTime,
        errorRate,
        dataAccuracy,
        costEffectiveness
      },
      trend,
      lastUpdated: new Date()
    };
  }

  private calculateCostEffectivenessScore(provider: ServiceProvider): number {
    // Simple cost effectiveness based on pricing model
    const basePrice = provider.pricingModel.basePrice;
    
    // Lower prices get higher scores
    if (basePrice <= 0.001) return 100;
    if (basePrice <= 0.01) return 80;
    if (basePrice <= 0.1) return 60;
    if (basePrice <= 1) return 40;
    return 20;
  }

  private responseTimeToScore(responseTime: number): number {
    if (responseTime <= 100) return 100;
    if (responseTime <= 500) return 90;
    if (responseTime <= 1000) return 70;
    if (responseTime <= 2000) return 50;
    if (responseTime <= 5000) return 30;
    return 10;
  }

  private calculateTrend(providerId: string): 'improving' | 'stable' | 'declining' {
    const recentChecks = this.getRecentHealthChecks(providerId, 86400000); // Last 24 hours
    
    if (recentChecks.length < 10) return 'stable';

    const halfPoint = Math.floor(recentChecks.length / 2);
    const firstHalf = recentChecks.slice(0, halfPoint);
    const secondHalf = recentChecks.slice(halfPoint);

    const firstHalfScore = firstHalf.filter(c => c.isHealthy).length / firstHalf.length;
    const secondHalfScore = secondHalf.filter(c => c.isHealthy).length / secondHalf.length;

    const difference = secondHalfScore - firstHalfScore;

    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  private getRecentPerformanceMetrics(providerId: string, timeRangeMs: number): PerformanceMetrics[] {
    const metrics = this.performanceMetrics.get(providerId) || [];
    const cutoffTime = Date.now() - timeRangeMs;
    
    return metrics.filter(metric => metric.timestamp.getTime() > cutoffTime);
  }

  /**
   * Get current quality metrics for a provider
   */
  getQualityMetrics(providerId: string): QualityMetrics {
    const reputationScore = this.calculateReputationScore(providerId);
    
    return {
      uptime: reputationScore.factors.uptime,
      avgResponseTime: reputationScore.factors.averageResponseTime,
      reliabilityScore: reputationScore.score,
      dataAccuracy: reputationScore.factors.dataAccuracy,
      lastUpdated: new Date()
    };
  }

  /**
   * Get all alerts
   */
  getAlerts(severity?: AlertSeverity): SystemAlert[] {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity && !alert.isResolved);
    }
    return this.alerts.filter(alert => !alert.isResolved);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isResolved = true;
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get provider statistics
   */
  getProviderStats(providerId: string) {
    const recentChecks = this.getRecentHealthChecks(providerId, 86400000);
    const reputationScore = this.calculateReputationScore(providerId);
    
    return {
      totalChecks: recentChecks.length,
      healthyChecks: recentChecks.filter(c => c.isHealthy).length,
      averageResponseTime: recentChecks.length > 0 
        ? recentChecks.reduce((sum, c) => sum + c.responseTime, 0) / recentChecks.length 
        : 0,
      reputationScore: reputationScore.score,
      uptime: reputationScore.factors.uptime,
      errorRate: reputationScore.factors.errorRate,
      trend: reputationScore.trend
    };
  }

  /**
   * Stop all monitoring
   */
  shutdown(): void {
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval);
    }
    this.monitoringIntervals.clear();
  }
}