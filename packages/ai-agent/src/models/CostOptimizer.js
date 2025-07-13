import { Matrix } from 'ml-matrix';

/**
 * Cost Optimization AI Model
 * Uses multi-objective optimization to select the best service provider
 */
export class CostOptimizer {
    constructor() {
        this.providerMetrics = new Map();
        this.weights = {
            cost: 0.4,        // 40% weight on cost
            quality: 0.3,     // 30% weight on quality
            speed: 0.2,       // 20% weight on speed
            reliability: 0.1  // 10% weight on reliability
        };
        this.learningRate = 0.01;
        
        console.log('🧠 Cost Optimizer initialized');
    }

    /**
     * Select optimal service provider from available options
     */
    selectOptimal(providers, request) {
        if (!providers || providers.length === 0) {
            throw new Error('No providers available');
        }

        console.log(`🎯 Optimizing selection from ${providers.length} providers`);

        // Score each provider
        const scoredProviders = providers.map(provider => ({
            ...provider,
            score: this.calculateProviderScore(provider, request),
            reasoning: this.generateReasoning(provider, request)
        }));

        // Sort by score (higher is better)
        scoredProviders.sort((a, b) => b.score - a.score);

        const selected = scoredProviders[0];
        console.log(`✅ Selected ${selected.name} with score ${selected.score.toFixed(3)}`);

        return selected;
    }

    /**
     * Calculate comprehensive provider score
     */
    calculateProviderScore(provider, request) {
        const metrics = this.getProviderMetrics(provider.address);
        
        // Normalize scores to 0-1 range
        const costScore = this.calculateCostScore(provider, request);
        const qualityScore = metrics.averageQuality / 100;
        const speedScore = this.calculateSpeedScore(metrics.averageResponseTime);
        const reliabilityScore = metrics.uptime / 100;

        // Weighted combination
        const totalScore = (
            this.weights.cost * costScore +
            this.weights.quality * qualityScore +
            this.weights.speed * speedScore +
            this.weights.reliability * reliabilityScore
        );

        return totalScore;
    }

    /**
     * Calculate cost score (lower cost = higher score)
     */
    calculateCostScore(provider, request) {
        const cost = provider.calculateCost(request);
        const maxCost = request.maxCost || 0.01; // Default max cost
        
        // Inverse relationship: lower cost = higher score
        return Math.max(0, (maxCost - cost) / maxCost);
    }

    /**
     * Calculate speed score (faster = higher score)
     */
    calculateSpeedScore(averageResponseTime) {
        const maxAcceptableTime = 10000; // 10 seconds
        if (averageResponseTime >= maxAcceptableTime) return 0;
        
        return (maxAcceptableTime - averageResponseTime) / maxAcceptableTime;
    }

    /**
     * Get or initialize provider metrics
     */
    getProviderMetrics(address) {
        if (!this.providerMetrics.has(address)) {
            this.providerMetrics.set(address, {
                totalCalls: 0,
                averageQuality: 85, // Start with neutral quality
                averageResponseTime: 2000, // 2 seconds default
                uptime: 95, // 95% uptime default
                costHistory: [],
                qualityHistory: [],
                speedHistory: []
            });
        }
        return this.providerMetrics.get(address);
    }

    /**
     * Add feedback to improve model
     */
    async addFeedback(feedback) {
        const metrics = this.getProviderMetrics(feedback.provider);
        
        // Update metrics with new data
        metrics.totalCalls++;
        metrics.qualityHistory.push(feedback.quality);
        metrics.speedHistory.push(feedback.responseTime);
        metrics.costHistory.push(feedback.cost);

        // Calculate rolling averages (last 50 data points)
        const recentQuality = metrics.qualityHistory.slice(-50);
        const recentSpeed = metrics.speedHistory.slice(-50);
        const recentCost = metrics.costHistory.slice(-50);

        metrics.averageQuality = recentQuality.reduce((a, b) => a + b, 0) / recentQuality.length;
        metrics.averageResponseTime = recentSpeed.reduce((a, b) => a + b, 0) / recentSpeed.length;
        metrics.averageCost = recentCost.reduce((a, b) => a + b, 0) / recentCost.length;

        // Update weights based on performance (simple reinforcement learning)
        this.updateWeights(feedback);

        console.log(`📈 Updated metrics for provider: ${feedback.provider}`);
    }

    /**
     * Update optimization weights based on feedback
     */
    updateWeights(feedback) {
        // Increase weight for factors that performed well
        if (feedback.quality > 90) {
            this.weights.quality += this.learningRate * 0.1;
        }
        
        if (feedback.responseTime < 1000) { // Fast response
            this.weights.speed += this.learningRate * 0.1;
        }

        // Normalize weights to sum to 1
        const totalWeight = Object.values(this.weights).reduce((a, b) => a + b, 0);
        Object.keys(this.weights).forEach(key => {
            this.weights[key] /= totalWeight;
        });
    }

    /**
     * Generate human-readable reasoning for selection
     */
    generateReasoning(provider, request) {
        const metrics = this.getProviderMetrics(provider.address);
        const cost = provider.calculateCost(request);
        
        let reasons = [];
        
        if (cost < request.maxCost * 0.7) {
            reasons.push('low cost');
        }
        
        if (metrics.averageQuality > 90) {
            reasons.push('high quality');
        }
        
        if (metrics.averageResponseTime < 2000) {
            reasons.push('fast response');
        }
        
        if (metrics.uptime > 98) {
            reasons.push('high reliability');
        }

        return reasons.length > 0 
            ? `Selected for ${reasons.join(', ')}`
            : 'Best available option';
    }

    /**
     * Update models with market data
     */
    async updateModels(marketData) {
        if (!marketData) return;

        console.log('🔄 Updating cost optimization models...');
        
        // Adjust weights based on market conditions
        // For example, if gas prices are high, prioritize cost more
        if (marketData.gasPrices > 20) { // High gas prices
            this.weights.cost += 0.05;
            this.weights.speed -= 0.02;
            this.weights.quality -= 0.02;
            this.weights.reliability -= 0.01;
        }

        // Normalize weights
        const totalWeight = Object.values(this.weights).reduce((a, b) => a + b, 0);
        Object.keys(this.weights).forEach(key => {
            this.weights[key] /= totalWeight;
        });

        console.log(`⚡ Updated weights: ${JSON.stringify(this.weights)}`);
    }

    /**
     * Calculate provider ranking for registry updates
     */
    calculateProviderRanking(provider, performance) {
        const baseScore = this.calculateProviderScore(provider, {
            maxCost: 0.01, // Standard request
            priority: 'normal'
        });

        // Adjust based on recent performance
        const performanceMultiplier = performance.recentSuccessRate || 1.0;
        
        return baseScore * performanceMultiplier;
    }

    /**
     * Get optimization statistics
     */
    getStatistics() {
        const providers = Array.from(this.providerMetrics.entries()).map(([address, metrics]) => ({
            address,
            ...metrics
        }));

        return {
            totalProviders: providers.length,
            weights: { ...this.weights },
            averageQuality: providers.reduce((sum, p) => sum + p.averageQuality, 0) / providers.length || 0,
            averageResponseTime: providers.reduce((sum, p) => sum + p.averageResponseTime, 0) / providers.length || 0
        };
    }

    /**
     * Export model data for persistence
     */
    exportModel() {
        return {
            weights: this.weights,
            providerMetrics: Object.fromEntries(this.providerMetrics),
            learningRate: this.learningRate
        };
    }

    /**
     * Import model data
     */
    importModel(modelData) {
        if (modelData.weights) {
            this.weights = { ...modelData.weights };
        }
        
        if (modelData.providerMetrics) {
            this.providerMetrics = new Map(Object.entries(modelData.providerMetrics));
        }
        
        if (modelData.learningRate) {
            this.learningRate = modelData.learningRate;
        }
        
        console.log('📥 Model data imported successfully');
    }
}
