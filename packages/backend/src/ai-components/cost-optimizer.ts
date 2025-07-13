import { ServiceProvider, ServiceRequest, CostAnalysis, ProviderAnalysis, ProviderRecommendation, ServiceType } from '../types';

/**
 * Advanced cost optimization engine using multi-criteria decision analysis
 * Combines cost, quality, reliability, and performance metrics
 */
export class CostOptimizer {
  private weights: Record<string, number>;

  constructor(weights?: Record<string, number>) {
    // Default weights for decision criteria
    this.weights = weights || {
      cost: 0.4,
      reliability: 0.25,
      performance: 0.20,
      quality: 0.15
    };
  }

  /**
   * Analyze service options and return comprehensive cost analysis
   */
  async analyzeServiceOptions(
    serviceType: ServiceType,
    providers: ServiceProvider[],
    request: ServiceRequest
  ): Promise<CostAnalysis> {
    const providerAnalyses: ProviderAnalysis[] = [];

    // Analyze each provider
    for (const provider of providers) {
      if (!provider.isActive) continue;

      const analysis = await this.analyzeProvider(provider, request);
      providerAnalyses.push(analysis);
    }

    // Sort by composite score
    providerAnalyses.sort((a, b) => b.qualityScore - a.qualityScore);

    // Add ranking
    providerAnalyses.forEach((analysis, index) => {
      analysis.rank = index + 1;
    });

    // Generate recommendation
    const recommendation = this.generateRecommendation(providerAnalyses);

    // Calculate overall analysis metrics
    const analysis = this.calculateOverallAnalysis(providerAnalyses, recommendation);

    return {
      serviceType,
      providers: providerAnalyses,
      recommendation,
      analysis,
      timestamp: new Date()
    };
  }

  /**
   * Analyze individual provider using weighted scoring
   */
  private async analyzeProvider(
    provider: ServiceProvider,
    request: ServiceRequest
  ): Promise<ProviderAnalysis> {
    // Calculate estimated cost
    const estimatedCost = this.calculateCost(provider, request);

    // Get quality metrics
    const qualityMetrics = provider.qualityMetrics;

    // Calculate composite scores
    const costScore = this.calculateCostScore(estimatedCost, request.maxBudget);
    const reliabilityScore = qualityMetrics.reliabilityScore;
    const performanceScore = this.calculatePerformanceScore(qualityMetrics.avgResponseTime);
    const qualityScore = qualityMetrics.dataAccuracy;

    // Weighted composite score
    const compositeScore = 
      costScore * this.weights.cost +
      reliabilityScore * this.weights.reliability +
      performanceScore * this.weights.performance +
      qualityScore * this.weights.quality;

    // Generate pros and cons
    const { pros, cons } = this.generateProviderInsights(provider, {
      costScore,
      reliabilityScore,
      performanceScore,
      qualityScore
    });

    return {
      providerId: provider.id,
      providerName: provider.name,
      estimatedCost,
      qualityScore: compositeScore,
      reliabilityScore,
      responseTime: qualityMetrics.avgResponseTime,
      pros,
      cons,
      rank: 0 // Will be set later
    };
  }

  /**
   * Calculate cost for a specific provider and request
   */
  private calculateCost(provider: ServiceProvider, request: ServiceRequest): number {
    const pricing = provider.pricingModel;
    
    switch (pricing.type) {
      case 'per_request':
        return this.calculatePerRequestCost(pricing, request);
      case 'per_mb':
        return this.calculatePerMBCost(pricing, request);
      case 'per_hour':
        return this.calculatePerHourCost(pricing, request);
      case 'subscription':
        return this.calculateSubscriptionCost(pricing, request);
      default:
        return pricing.basePrice;
    }
  }

  private calculatePerRequestCost(pricing: any, request: ServiceRequest): number {
    const baseRequestCount = 1; // Assume single request for now
    
    if (pricing.tierPricing && pricing.tierPricing.length > 0) {
      // Find appropriate tier
      const tier = pricing.tierPricing.find((t: any) => 
        baseRequestCount >= t.minUsage && baseRequestCount <= t.maxUsage
      );
      
      if (tier) {
        return tier.pricePerUnit * baseRequestCount;
      }
    }
    
    return pricing.basePrice * baseRequestCount;
  }

  private calculatePerMBCost(pricing: any, request: ServiceRequest): number {
    // Estimate data size based on request parameters
    const estimatedDataMB = this.estimateDataSize(request);
    
    if (pricing.freeTier && pricing.freeTier.dataLimitMB && 
        estimatedDataMB <= pricing.freeTier.dataLimitMB) {
      return 0;
    }
    
    return pricing.basePrice * estimatedDataMB;
  }

  private calculatePerHourCost(pricing: any, request: ServiceRequest): number {
    // Estimate execution time based on request complexity
    const estimatedHours = this.estimateExecutionTime(request);
    return pricing.basePrice * estimatedHours;
  }

  private calculateSubscriptionCost(pricing: any, request: ServiceRequest): number {
    // For subscription services, calculate prorated cost per request
    const monthlyPrice = pricing.basePrice;
    const estimatedMonthlyRequests = 1000; // Default assumption
    return monthlyPrice / estimatedMonthlyRequests;
  }

  /**
   * Calculate cost effectiveness score (0-100)
   */
  private calculateCostScore(estimatedCost: number, maxBudget: number): number {
    if (estimatedCost > maxBudget) return 0;
    
    // Higher score for lower costs
    const costRatio = estimatedCost / maxBudget;
    return Math.max(0, (1 - costRatio) * 100);
  }

  /**
   * Calculate performance score based on response time
   */
  private calculatePerformanceScore(responseTimeMs: number): number {
    // Logarithmic scoring - lower response time = higher score
    if (responseTimeMs <= 100) return 100;
    if (responseTimeMs >= 5000) return 10;
    
    // Logarithmic scale between 100ms and 5000ms
    const logScore = 100 - (Math.log(responseTimeMs / 100) / Math.log(50)) * 90;
    return Math.max(10, Math.min(100, logScore));
  }

  /**
   * Generate recommendation based on provider analyses
   */
  private generateRecommendation(analyses: ProviderAnalysis[]): ProviderRecommendation {
    if (analyses.length === 0) {
      throw new Error('No providers available for recommendation');
    }

    const primary = analyses[0].providerId;
    const backup = analyses.slice(1, 3).map(a => a.providerId);
    
    // Calculate confidence based on score gap
    const topScore = analyses[0].qualityScore;
    const secondScore = analyses.length > 1 ? analyses[1].qualityScore : 0;
    const scoreGap = topScore - secondScore;
    const confidenceLevel = Math.min(95, 50 + (scoreGap * 2));

    // Estimate savings compared to most expensive option
    const maxCost = Math.max(...analyses.map(a => a.estimatedCost));
    const minCost = analyses[0].estimatedCost;
    const expectedSavings = maxCost - minCost;

    const reasoning = this.generateRecommendationReasoning(analyses[0], analyses);

    return {
      primary,
      backup,
      reasoning,
      confidenceLevel,
      expectedSavings
    };
  }

  /**
   * Generate human-readable reasoning for recommendation
   */
  private generateRecommendationReasoning(
    topProvider: ProviderAnalysis,
    allProviders: ProviderAnalysis[]
  ): string {
    const reasons = [];
    
    if (topProvider.estimatedCost <= Math.min(...allProviders.map(p => p.estimatedCost))) {
      reasons.push('lowest cost');
    }
    
    if (topProvider.reliabilityScore >= 90) {
      reasons.push('excellent reliability');
    }
    
    if (topProvider.responseTime <= 200) {
      reasons.push('fast response times');
    }
    
    if (reasons.length === 0) {
      reasons.push('best overall value');
    }
    
    return `Recommended for ${reasons.join(', ')} with a composite score of ${topProvider.qualityScore.toFixed(1)}/100.`;
  }

  /**
   * Calculate overall analysis metrics
   */
  private calculateOverallAnalysis(
    analyses: ProviderAnalysis[],
    recommendation: ProviderRecommendation
  ) {
    const reliabilityScores = analyses.map(a => a.reliabilityScore);
    const responseTimes = analyses.map(a => a.responseTime);

    const costSavings = recommendation.expectedSavings;
    const avgReliability = reliabilityScores.reduce((sum, score) => sum + score, 0) / reliabilityScores.length;
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    
    // Performance score based on average response time
    const performanceScore = this.calculatePerformanceScore(avgResponseTime);
    
    // Risk assessment based on reliability variance
    const mean = avgReliability;
    const variance = reliabilityScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / reliabilityScores.length;
    const reliabilityStdDev = Math.sqrt(variance);
    
    let riskAssessment = 'Low';
    if (reliabilityStdDev > 15) riskAssessment = 'High';
    else if (reliabilityStdDev > 8) riskAssessment = 'Medium';

    return {
      costSavings,
      reliabilityScore: avgReliability,
      performanceScore,
      riskAssessment
    };
  }

  /**
   * Generate pros and cons for a provider
   */
  private generateProviderInsights(
    provider: ServiceProvider,
    scores: Record<string, number>
  ): { pros: string[]; cons: string[] } {
    const pros: string[] = [];
    const cons: string[] = [];

    // Cost insights
    if (scores.costScore > 80) pros.push('Very cost-effective');
    else if (scores.costScore < 40) cons.push('Higher cost than alternatives');

    // Reliability insights
    if (scores.reliabilityScore > 95) pros.push('Excellent uptime record');
    else if (scores.reliabilityScore < 90) cons.push('Below-average reliability');

    // Performance insights
    if (scores.performanceScore > 85) pros.push('Fast response times');
    else if (scores.performanceScore < 60) cons.push('Slower response times');

    // Quality insights
    if (scores.qualityScore > 90) pros.push('High data accuracy');
    else if (scores.qualityScore < 80) cons.push('Lower data quality');

    // Free tier insights
    if (provider.pricingModel.freeTier) {
      pros.push('Offers free tier');
    }

    return { pros, cons };
  }

  /**
   * Predict optimal choice based on historical data and ML
   */
  async predictOptimalChoice(
    _serviceType: ServiceType,
    historicalData: any[],
    _currentNeeds: ServiceRequest
  ): Promise<string> {
    // Simple prediction based on historical success rates
    const providerSuccessRates = new Map<string, number>();
    
    // Calculate success rates from historical data
    historicalData.forEach(record => {
      const providerId = record.providerId;
      const isSuccessful = record.status === 'completed' && record.responseTime < 1000;
      
      if (!providerSuccessRates.has(providerId)) {
        providerSuccessRates.set(providerId, 0);
      }
      
      const currentRate = providerSuccessRates.get(providerId)!;
      providerSuccessRates.set(providerId, currentRate + (isSuccessful ? 1 : 0));
    });

    // Return provider with highest success rate
    let bestProvider = '';
    let bestRate = 0;
    
    providerSuccessRates.forEach((rate, providerId) => {
      if (rate > bestRate) {
        bestRate = rate;
        bestProvider = providerId;
      }
    });

    return bestProvider;
  }

  /**
   * Estimate data size for cost calculation
   */
  private estimateDataSize(request: ServiceRequest): number {
    // Basic estimation based on service type and parameters
    switch (request.serviceType) {
      case ServiceType.WEATHER_API:
        return 0.001; // Weather data is typically small
      case ServiceType.CLOUD_STORAGE:
        return request.parameters.fileSizeMB || 1;
      case ServiceType.DATA_FEED:
        return request.parameters.dataPoints * 0.001 || 0.1;
      default:
        return 0.1; // Default 100KB
    }
  }

  /**
   * Estimate execution time for cost calculation
   */
  private estimateExecutionTime(request: ServiceRequest): number {
    // Basic estimation in hours
    switch (request.serviceType) {
      case ServiceType.COMPUTE_SERVICE:
        return request.parameters.estimatedHours || 0.1;
      case ServiceType.GPU_RENTAL:
        return request.parameters.trainingHours || 1;
      case ServiceType.SERVERLESS:
        return 0.001; // Serverless functions are typically quick
      default:
        return 0.01; // Default 36 seconds
    }
  }

  /**
   * Update weights based on user feedback
   */
  updateWeights(newWeights: Partial<Record<string, number>>): void {
    // Filter out undefined values
    const filteredWeights: Record<string, number> = {};
    Object.entries(newWeights).forEach(([key, value]) => {
      if (value !== undefined) {
        filteredWeights[key] = value;
      }
    });
    
    this.weights = { ...this.weights, ...filteredWeights };
    
    // Ensure weights sum to 1
    const total = Object.values(this.weights).reduce((sum, weight) => sum + weight, 0);
    if (total > 0) {
      Object.keys(this.weights).forEach(key => {
        this.weights[key] = this.weights[key] / total;
      });
    }
  }

  /**
   * Get current optimization weights
   */
  getWeights(): Record<string, number> {
    return { ...this.weights };
  }
}