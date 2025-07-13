import { DatabaseManager, AnalyticsRepository } from '../database/connection';
import { ServiceType } from '../types';

export interface CostMetrics {
  totalSpent: number;
  totalSavings: number;
  requestCount: number;
  averageCost: number;
  successRate: number;
  topServices: Array<{
    serviceType: ServiceType;
    cost: number;
    requests: number;
  }>;
  topProviders: Array<{
    providerId: string;
    providerName: string;
    cost: number;
    requests: number;
    savings: number;
  }>;
}

export interface CostTrend {
  date: string;
  totalCost: number;
  requestCount: number;
  averageCost: number;
  savings: number;
}

export interface ProviderComparison {
  providerId: string;
  providerName: string;
  serviceType: ServiceType;
  metrics: {
    averageCost: number;
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    reliabilityScore: number;
    costEfficiencyRank: number;
  };
  trends: {
    costTrend: 'increasing' | 'decreasing' | 'stable';
    usageTrend: 'increasing' | 'decreasing' | 'stable';
    performanceTrend: 'improving' | 'degrading' | 'stable';
  };
}

export interface OptimizationRecommendation {
  type: 'cost_reduction' | 'performance_improvement' | 'reliability_enhancement';
  priority: 'high' | 'medium' | 'low';
  description: string;
  potentialSavings?: number;
  currentProvider: string;
  recommendedProvider: string;
  confidence: number;
  impact: {
    costImpact: number;
    performanceImpact: number;
    reliabilityImpact: number;
  };
}

export interface BudgetAnalysis {
  userId: string;
  currentPeriod: {
    dailyUsage: number;
    monthlyUsage: number;
    dailyLimit: number;
    monthlyLimit: number;
  };
  projections: {
    endOfDayProjection: number;
    endOfMonthProjection: number;
    dailyBurnRate: number;
    daysUntilBudgetExhausted: number;
  };
  recommendations: {
    budgetAdjustment?: number;
    serviceOptimization: string[];
    costReductionOpportunities: string[];
  };
}

/**
 * Advanced Cost Analytics Engine
 */
export class CostAnalyticsEngine {
  private db: DatabaseManager;
  private analyticsRepo: AnalyticsRepository;

  constructor() {
    this.db = DatabaseManager.getInstance();
    this.analyticsRepo = new AnalyticsRepository();
  }

  /**
   * Get comprehensive cost metrics for a user
   */
  async getCostMetrics(userId: string, timeframe: number = 30): Promise<CostMetrics> {
    try {
      // Get basic cost summary
      const costSummary = await this.analyticsRepo.getCostSavings(userId, timeframe);
      
      // Get detailed service breakdown
      const serviceBreakdown = await this.getServiceBreakdown(userId, timeframe);
      
      // Get provider breakdown
      const providerBreakdown = await this.getProviderBreakdown(userId, timeframe);
      
      // Calculate success rate
      const successRate = await this.calculateSuccessRate(userId, timeframe);

      return {
        totalSpent: costSummary.total_spent || 0,
        totalSavings: costSummary.total_savings || 0,
        requestCount: costSummary.total_requests || 0,
        averageCost: costSummary.total_requests > 0 
          ? (costSummary.total_spent / costSummary.total_requests) 
          : 0,
        successRate,
        topServices: serviceBreakdown,
        topProviders: providerBreakdown,
      };
    } catch (error) {
      console.error('Failed to get cost metrics:', error);
      throw error;
    }
  }

  /**
   * Get cost trends over time
   */
  async getCostTrends(userId: string, days: number = 30): Promise<CostTrend[]> {
    try {
      const query = `
        SELECT 
          date,
          SUM(total_cost) as total_cost,
          SUM(total_requests) as request_count,
          AVG(total_cost / NULLIF(total_requests, 0)) as average_cost,
          SUM(cost_savings) as savings
        FROM analytics_daily 
        WHERE user_id = $1 
        AND date >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY date
        ORDER BY date ASC
      `;

      const result = await this.db.executeQuery(query, [userId]);
      
      return result.rows.map((row: any) => ({
        date: row.date,
        totalCost: parseFloat(row.total_cost) || 0,
        requestCount: parseInt(row.request_count) || 0,
        averageCost: parseFloat(row.average_cost) || 0,
        savings: parseFloat(row.savings) || 0,
      }));
    } catch (error) {
      console.error('Failed to get cost trends:', error);
      throw error;
    }
  }

  /**
   * Compare providers across all metrics
   */
  async compareProviders(serviceType?: ServiceType, days: number = 30): Promise<ProviderComparison[]> {
    try {
      const serviceTypeFilter = serviceType ? `AND sr.service_type = '${serviceType}'` : '';
      
      const query = `
        SELECT 
          sp.id as provider_id,
          sp.name as provider_name,
          sr.service_type,
          COUNT(*) as total_requests,
          AVG(COALESCE(sr.actual_cost, sr.estimated_cost)) as average_cost,
          COUNT(CASE WHEN sr.status = 'completed' THEN 1 END)::FLOAT / COUNT(*) * 100 as success_rate,
          AVG(sr.execution_time_ms) as average_response_time
        FROM service_providers sp
        JOIN service_requests sr ON sp.id = sr.provider_id
        WHERE sr.created_at >= CURRENT_DATE - INTERVAL '${days} days'
        ${serviceTypeFilter}
        GROUP BY sp.id, sp.name, sr.service_type
        ORDER BY average_cost ASC
      `;

      const result = await this.db.executeQuery(query);
      
      const comparisons: ProviderComparison[] = await Promise.all(
        result.rows.map(async (row: any, index: number) => {
          const trends = await this.calculateProviderTrends(row.provider_id, days);
          
          return {
            providerId: row.provider_id,
            providerName: row.provider_name,
            serviceType: row.service_type,
            metrics: {
              averageCost: parseFloat(row.average_cost) || 0,
              totalRequests: parseInt(row.total_requests) || 0,
              successRate: parseFloat(row.success_rate) || 0,
              averageResponseTime: parseFloat(row.average_response_time) || 0,
              reliabilityScore: this.calculateReliabilityScore(row),
              costEfficiencyRank: index + 1,
            },
            trends,
          };
        })
      );

      return comparisons;
    } catch (error) {
      console.error('Failed to compare providers:', error);
      throw error;
    }
  }

  /**
   * Generate optimization recommendations
   */
  async generateOptimizationRecommendations(userId: string): Promise<OptimizationRecommendation[]> {
    try {
      const recommendations: OptimizationRecommendation[] = [];
      
      // Get user's recent usage patterns
      const usagePatterns = await this.getUserUsagePatterns(userId);
      
      // Get provider comparisons for each service type used
      for (const pattern of usagePatterns) {
        const providers = await this.compareProviders(pattern.serviceType);
        const currentProvider = providers.find(p => p.providerId === pattern.currentProviderId);
        const bestProvider = providers[0]; // Sorted by cost
        
        if (currentProvider && bestProvider && currentProvider.providerId !== bestProvider.providerId) {
          const potentialSavings = 
            (currentProvider.metrics.averageCost - bestProvider.metrics.averageCost) * 
            pattern.monthlyRequests;
          
          if (potentialSavings > 1) { // Only recommend if savings > $1
            recommendations.push({
              type: 'cost_reduction',
              priority: potentialSavings > 10 ? 'high' : potentialSavings > 5 ? 'medium' : 'low',
              description: `Switch from ${currentProvider.providerName} to ${bestProvider.providerName} for ${pattern.serviceType} to reduce costs`,
              potentialSavings,
              currentProvider: currentProvider.providerName,
              recommendedProvider: bestProvider.providerName,
              confidence: this.calculateRecommendationConfidence(currentProvider, bestProvider),
              impact: {
                costImpact: potentialSavings,
                performanceImpact: bestProvider.metrics.averageResponseTime - currentProvider.metrics.averageResponseTime,
                reliabilityImpact: bestProvider.metrics.reliabilityScore - currentProvider.metrics.reliabilityScore,
              },
            });
          }
        }
      }

      // Sort by potential savings
      recommendations.sort((a, b) => (b.potentialSavings || 0) - (a.potentialSavings || 0));
      
      return recommendations.slice(0, 10); // Top 10 recommendations
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      throw error;
    }
  }

  /**
   * Analyze budget usage and projections
   */
  async analyzeBudget(userId: string): Promise<BudgetAnalysis> {
    try {
      // Get current budget information
      const budgetQuery = `SELECT * FROM user_budgets WHERE user_id = $1`;
      const budgetResult = await this.db.executeQuery(budgetQuery, [userId]);
      const budget = budgetResult.rows[0];

      if (!budget) {
        throw new Error('Budget not found for user');
      }

      // Calculate daily burn rate
      const dailySpendQuery = `
        SELECT 
          DATE(created_at) as date,
          SUM(COALESCE(actual_cost, estimated_cost)) as daily_spend
        FROM service_requests 
        WHERE user_id = $1 
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      const dailySpendResult = await this.db.executeQuery(dailySpendQuery, [userId]);
      const dailySpends = dailySpendResult.rows.map((row: any) => parseFloat(row.daily_spend));
      const avgDailyBurnRate = dailySpends.length > 0 
        ? dailySpends.reduce((sum, spend) => sum + spend, 0) / dailySpends.length 
        : 0;

      // Calculate projections
      const remainingDailyBudget = budget.daily_limit - budget.current_daily_spent;
      const remainingMonthlyBudget = budget.monthly_limit - budget.current_monthly_spent;
      
      const endOfDayProjection = budget.current_daily_spent + avgDailyBurnRate;
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const daysRemaining = daysInMonth - new Date().getDate();
      const endOfMonthProjection = budget.current_monthly_spent + (avgDailyBurnRate * daysRemaining);

      const daysUntilBudgetExhausted = avgDailyBurnRate > 0 
        ? Math.floor(remainingMonthlyBudget / avgDailyBurnRate) 
        : Infinity;

      // Generate recommendations
      const recommendations = await this.generateBudgetRecommendations(
        budget,
        avgDailyBurnRate,
        endOfMonthProjection
      );

      return {
        userId,
        currentPeriod: {
          dailyUsage: budget.current_daily_spent,
          monthlyUsage: budget.current_monthly_spent,
          dailyLimit: budget.daily_limit,
          monthlyLimit: budget.monthly_limit,
        },
        projections: {
          endOfDayProjection,
          endOfMonthProjection,
          dailyBurnRate: avgDailyBurnRate,
          daysUntilBudgetExhausted,
        },
        recommendations,
      };
    } catch (error) {
      console.error('Failed to analyze budget:', error);
      throw error;
    }
  }

  /**
   * Get service breakdown by cost and usage
   */
  private async getServiceBreakdown(userId: string, days: number): Promise<Array<{
    serviceType: ServiceType;
    cost: number;
    requests: number;
  }>> {
    const query = `
      SELECT 
        service_type,
        SUM(COALESCE(actual_cost, estimated_cost)) as cost,
        COUNT(*) as requests
      FROM service_requests 
      WHERE user_id = $1 
      AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY service_type
      ORDER BY cost DESC
      LIMIT 10
    `;

    const result = await this.db.executeQuery(query, [userId]);
    
    return result.rows.map((row: any) => ({
      serviceType: row.service_type as ServiceType,
      cost: parseFloat(row.cost) || 0,
      requests: parseInt(row.requests) || 0,
    }));
  }

  /**
   * Get provider breakdown by cost and savings
   */
  private async getProviderBreakdown(userId: string, days: number): Promise<Array<{
    providerId: string;
    providerName: string;
    cost: number;
    requests: number;
    savings: number;
  }>> {
    const query = `
      SELECT 
        sp.id as provider_id,
        sp.name as provider_name,
        SUM(COALESCE(sr.actual_cost, sr.estimated_cost)) as cost,
        COUNT(*) as requests,
        SUM(ad.cost_savings) as savings
      FROM service_providers sp
      JOIN service_requests sr ON sp.id = sr.provider_id
      LEFT JOIN analytics_daily ad ON ad.provider_id = sp.id AND ad.user_id = $1
      WHERE sr.user_id = $1 
      AND sr.created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY sp.id, sp.name
      ORDER BY cost DESC
      LIMIT 10
    `;

    const result = await this.db.executeQuery(query, [userId]);
    
    return result.rows.map((row: any) => ({
      providerId: row.provider_id,
      providerName: row.provider_name,
      cost: parseFloat(row.cost) || 0,
      requests: parseInt(row.requests) || 0,
      savings: parseFloat(row.savings) || 0,
    }));
  }

  /**
   * Calculate success rate for user's requests
   */
  private async calculateSuccessRate(userId: string, days: number): Promise<number> {
    const query = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_requests
      FROM service_requests 
      WHERE user_id = $1 
      AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
    `;

    const result = await this.db.executeQuery(query, [userId]);
    const row = result.rows[0];
    
    if (!row || row.total_requests === 0) return 0;
    
    return (row.successful_requests / row.total_requests) * 100;
  }

  /**
   * Calculate provider trends
   */
  private async calculateProviderTrends(providerId: string, days: number): Promise<{
    costTrend: 'increasing' | 'decreasing' | 'stable';
    usageTrend: 'increasing' | 'decreasing' | 'stable';
    performanceTrend: 'improving' | 'degrading' | 'stable';
  }> {
    // Simplified trend calculation
    // In a real implementation, this would analyze historical data more thoroughly
    
    const query = `
      SELECT 
        DATE(created_at) as date,
        AVG(COALESCE(actual_cost, estimated_cost)) as avg_cost,
        COUNT(*) as request_count,
        AVG(execution_time_ms) as avg_response_time
      FROM service_requests 
      WHERE provider_id = $1 
      AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const result = await this.db.executeQuery(query, [providerId]);
    
    if (result.rows.length < 2) {
      return {
        costTrend: 'stable',
        usageTrend: 'stable',
        performanceTrend: 'stable',
      };
    }

    const firstHalf = result.rows.slice(0, Math.floor(result.rows.length / 2));
    const secondHalf = result.rows.slice(Math.floor(result.rows.length / 2));

    const avgCostFirst = firstHalf.reduce((sum, row) => sum + parseFloat(row.avg_cost || 0), 0) / firstHalf.length;
    const avgCostSecond = secondHalf.reduce((sum, row) => sum + parseFloat(row.avg_cost || 0), 0) / secondHalf.length;

    const avgUsageFirst = firstHalf.reduce((sum, row) => sum + parseInt(row.request_count || 0), 0) / firstHalf.length;
    const avgUsageSecond = secondHalf.reduce((sum, row) => sum + parseInt(row.request_count || 0), 0) / secondHalf.length;

    const avgResponseFirst = firstHalf.reduce((sum, row) => sum + parseFloat(row.avg_response_time || 0), 0) / firstHalf.length;
    const avgResponseSecond = secondHalf.reduce((sum, row) => sum + parseFloat(row.avg_response_time || 0), 0) / secondHalf.length;

    return {
      costTrend: avgCostSecond > avgCostFirst * 1.1 ? 'increasing' : 
                 avgCostSecond < avgCostFirst * 0.9 ? 'decreasing' : 'stable',
      usageTrend: avgUsageSecond > avgUsageFirst * 1.1 ? 'increasing' : 
                  avgUsageSecond < avgUsageFirst * 0.9 ? 'decreasing' : 'stable',
      performanceTrend: avgResponseSecond < avgResponseFirst * 0.9 ? 'improving' : 
                        avgResponseSecond > avgResponseFirst * 1.1 ? 'degrading' : 'stable',
    };
  }

  /**
   * Calculate reliability score for a provider
   */
  private calculateReliabilityScore(providerData: any): number {
    const successRate = parseFloat(providerData.success_rate) || 0;
    const responseTime = parseFloat(providerData.average_response_time) || 0;
    
    // Simple scoring algorithm
    let score = successRate; // Start with success rate
    
    // Adjust for response time (lower is better)
    if (responseTime <= 500) score += 10;
    else if (responseTime <= 1000) score += 5;
    else if (responseTime >= 5000) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get user usage patterns
   */
  private async getUserUsagePatterns(userId: string): Promise<Array<{
    serviceType: ServiceType;
    currentProviderId: string;
    monthlyRequests: number;
    averageCost: number;
  }>> {
    const query = `
      SELECT 
        sr.service_type,
        sr.provider_id as current_provider_id,
        COUNT(*) * (30.0 / EXTRACT(DAY FROM (CURRENT_DATE - MIN(DATE(sr.created_at))))) as monthly_requests,
        AVG(COALESCE(sr.actual_cost, sr.estimated_cost)) as average_cost
      FROM service_requests sr
      WHERE sr.user_id = $1 
      AND sr.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY sr.service_type, sr.provider_id
      HAVING COUNT(*) >= 5
      ORDER BY monthly_requests DESC
    `;

    const result = await this.db.executeQuery(query, [userId]);
    
    return result.rows.map((row: any) => ({
      serviceType: row.service_type as ServiceType,
      currentProviderId: row.current_provider_id,
      monthlyRequests: Math.round(parseFloat(row.monthly_requests) || 0),
      averageCost: parseFloat(row.average_cost) || 0,
    }));
  }

  /**
   * Calculate recommendation confidence
   */
  private calculateRecommendationConfidence(current: ProviderComparison, recommended: ProviderComparison): number {
    let confidence = 50; // Base confidence
    
    // Increase confidence based on cost difference
    const costDifference = (current.metrics.averageCost - recommended.metrics.averageCost) / current.metrics.averageCost;
    confidence += costDifference * 100;
    
    // Adjust for reliability
    const reliabilityDifference = recommended.metrics.reliabilityScore - current.metrics.reliabilityScore;
    confidence += reliabilityDifference * 0.5;
    
    // Adjust for sample size
    if (recommended.metrics.totalRequests < 10) confidence -= 20;
    if (current.metrics.totalRequests < 10) confidence -= 10;
    
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Generate budget recommendations
   */
  private async generateBudgetRecommendations(
    budget: any,
    dailyBurnRate: number,
    projectedMonthlySpend: number
  ): Promise<{
    budgetAdjustment?: number;
    serviceOptimization: string[];
    costReductionOpportunities: string[];
  }> {
    const recommendations = {
      budgetAdjustment: undefined as number | undefined,
      serviceOptimization: [] as string[],
      costReductionOpportunities: [] as string[],
    };

    // Budget adjustment recommendation
    if (projectedMonthlySpend > budget.monthly_limit * 1.2) {
      recommendations.budgetAdjustment = Math.ceil(projectedMonthlySpend * 1.1);
    }

    // Service optimization recommendations
    if (dailyBurnRate > budget.daily_limit * 0.8) {
      recommendations.serviceOptimization.push('Consider reducing request frequency for non-critical services');
      recommendations.serviceOptimization.push('Implement request batching to reduce overall costs');
    }

    // Cost reduction opportunities
    recommendations.costReductionOpportunities.push('Review provider selections for potential cost savings');
    recommendations.costReductionOpportunities.push('Consider upgrading to volume-based pricing tiers');
    
    if (budget.current_monthly_spent > budget.monthly_limit * 0.9) {
      recommendations.costReductionOpportunities.push('Enable emergency cost controls to prevent budget overruns');
    }

    return recommendations;
  }
}