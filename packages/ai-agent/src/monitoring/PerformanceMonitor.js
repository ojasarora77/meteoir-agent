/**
 * Performance Monitor - Tracks and analyzes system performance
 */
export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalCost: 0,
            averageResponseTime: 0,
            averageCost: 0
        };
        
        this.providerMetrics = new Map();
        this.timeSeriesData = [];
        this.anomalies = [];
        
        console.log('📊 Performance Monitor initialized');
    }

    /**
     * Record a service request for monitoring
     */
    recordRequest(request, result) {
        const timestamp = Date.now();
        
        // Update global metrics
        this.metrics.totalRequests++;
        if (result.success) {
            this.metrics.successfulRequests++;
        } else {
            this.metrics.failedRequests++;
        }
        
        this.metrics.totalCost += result.cost || 0;
        this.metrics.averageCost = this.metrics.totalCost / this.metrics.totalRequests;
        
        // Update response time (exponential moving average)
        const responseTime = result.responseTime || 0;
        this.metrics.averageResponseTime = this.metrics.averageResponseTime * 0.9 + responseTime * 0.1;
        
        // Record time series data
        const dataPoint = {
            timestamp,
            serviceType: request.serviceType,
            provider: result.provider,
            cost: result.cost,
            responseTime: responseTime,
            success: result.success,
            quality: this.assessQuality(result)
        };
        
        this.timeSeriesData.push(dataPoint);
        
        // Keep only last 1000 data points
        if (this.timeSeriesData.length > 1000) {
            this.timeSeriesData = this.timeSeriesData.slice(-1000);
        }
        
        // Update provider-specific metrics
        this.updateProviderMetrics(result.provider, dataPoint);
        
        // Check for anomalies
        this.detectAnomalies(dataPoint);
        
        console.log(`📈 Recorded request: ${request.serviceType} -> ${result.provider} (${result.success ? 'SUCCESS' : 'FAILED'})`);
    }

    /**
     * Update provider-specific metrics
     */
    updateProviderMetrics(providerName, dataPoint) {
        if (!this.providerMetrics.has(providerName)) {
            this.providerMetrics.set(providerName, {
                totalRequests: 0,
                successfulRequests: 0,
                totalCost: 0,
                totalResponseTime: 0,
                averageQuality: 0,
                recentSuccessRate: 1.0,
                uptime: 100,
                history: []
            });
        }
        
        const metrics = this.providerMetrics.get(providerName);
        
        metrics.totalRequests++;
        if (dataPoint.success) {
            metrics.successfulRequests++;
        }
        
        metrics.totalCost += dataPoint.cost;
        metrics.totalResponseTime += dataPoint.responseTime;
        metrics.history.push(dataPoint);
        
        // Keep only last 100 requests per provider
        if (metrics.history.length > 100) {
            metrics.history = metrics.history.slice(-100);
        }
        
        // Calculate recent success rate (last 20 requests)
        const recent = metrics.history.slice(-20);
        metrics.recentSuccessRate = recent.filter(r => r.success).length / recent.length;
        
        // Calculate average quality
        const qualitySum = recent.reduce((sum, r) => sum + r.quality, 0);
        metrics.averageQuality = qualitySum / recent.length;
        
        // Update uptime based on recent performance
        if (dataPoint.success) {
            metrics.uptime = Math.min(100, metrics.uptime + 0.1);
        } else {
            metrics.uptime = Math.max(0, metrics.uptime - 2);
        }
    }

    /**
     * Assess service quality
     */
    assessQuality(result) {
        let quality = 100;
        
        if (!result.success) return 0;
        
        // Penalize slow responses
        if (result.responseTime > 10000) quality -= 30;
        else if (result.responseTime > 5000) quality -= 15;
        else if (result.responseTime > 2000) quality -= 5;
        
        // Check data quality if available
        if (result.data) {
            if (!result.data.data) quality -= 20;
            if (result.data.error) quality -= 25;
        }
        
        return Math.max(0, quality);
    }

    /**
     * Detect performance anomalies
     */
    detectAnomalies(dataPoint) {
        if (this.timeSeriesData.length < 50) return; // Need sufficient data
        
        const recent = this.timeSeriesData.slice(-50);
        const avgResponseTime = recent.reduce((sum, d) => sum + d.responseTime, 0) / recent.length;
        const avgCost = recent.reduce((sum, d) => sum + d.cost, 0) / recent.length;
        
        const anomaly = {
            timestamp: dataPoint.timestamp,
            type: null,
            severity: 'low',
            description: '',
            dataPoint
        };
        
        // Response time anomaly
        if (dataPoint.responseTime > avgResponseTime * 3) {
            anomaly.type = 'response_time';
            anomaly.severity = dataPoint.responseTime > avgResponseTime * 5 ? 'high' : 'medium';
            anomaly.description = `Response time ${dataPoint.responseTime}ms is ${(dataPoint.responseTime / avgResponseTime).toFixed(1)}x higher than average`;
        }
        
        // Cost anomaly
        if (dataPoint.cost > avgCost * 2) {
            anomaly.type = 'cost';
            anomaly.severity = dataPoint.cost > avgCost * 5 ? 'high' : 'medium';
            anomaly.description = `Cost ${dataPoint.cost} ETH is ${(dataPoint.cost / avgCost).toFixed(1)}x higher than average`;
        }
        
        // Failure anomaly
        if (!dataPoint.success) {
            const recentFailures = recent.filter(d => !d.success).length;
            if (recentFailures > recent.length * 0.2) { // More than 20% failures
                anomaly.type = 'failure_rate';
                anomaly.severity = 'high';
                anomaly.description = `High failure rate: ${recentFailures}/${recent.length} recent requests failed`;
            }
        }
        
        if (anomaly.type) {
            this.anomalies.push(anomaly);
            console.warn(`⚠️ Anomaly detected: ${anomaly.type} - ${anomaly.description}`);
            
            // Keep only last 100 anomalies
            if (this.anomalies.length > 100) {
                this.anomalies = this.anomalies.slice(-100);
            }
        }
    }

    /**
     * Analyze usage patterns
     */
    async analyzeUsagePatterns() {
        if (this.timeSeriesData.length < 10) {
            return { status: 'insufficient_data' };
        }
        
        const now = Date.now();
        const last24h = this.timeSeriesData.filter(d => now - d.timestamp < 24 * 60 * 60 * 1000);
        const last7d = this.timeSeriesData.filter(d => now - d.timestamp < 7 * 24 * 60 * 60 * 1000);
        
        // Analyze by hour
        const hourlyUsage = new Array(24).fill(0);
        last24h.forEach(d => {
            const hour = new Date(d.timestamp).getHours();
            hourlyUsage[hour]++;
        });
        
        // Analyze by service type
        const serviceTypeUsage = {};
        last7d.forEach(d => {
            serviceTypeUsage[d.serviceType] = (serviceTypeUsage[d.serviceType] || 0) + 1;
        });
        
        // Analyze by provider
        const providerUsage = {};
        last7d.forEach(d => {
            providerUsage[d.provider] = (providerUsage[d.provider] || 0) + 1;
        });
        
        // Calculate trends
        const trends = this.calculateTrends();
        
        const patterns = {
            hourlyUsage,
            serviceTypeUsage,
            providerUsage,
            trends,
            peakHour: hourlyUsage.indexOf(Math.max(...hourlyUsage)),
            totalRequests24h: last24h.length,
            totalRequests7d: last7d.length,
            averageCost24h: last24h.reduce((sum, d) => sum + d.cost, 0) / last24h.length || 0,
            successRate24h: last24h.filter(d => d.success).length / last24h.length || 0
        };
        
        console.log(`📊 Usage patterns analyzed: ${patterns.totalRequests24h} requests in 24h, peak at ${patterns.peakHour}:00`);
        return patterns;
    }

    /**
     * Calculate performance trends
     */
    calculateTrends() {
        if (this.timeSeriesData.length < 20) return {};
        
        const recent = this.timeSeriesData.slice(-10);
        const older = this.timeSeriesData.slice(-20, -10);
        
        const recentAvgCost = recent.reduce((sum, d) => sum + d.cost, 0) / recent.length;
        const olderAvgCost = older.reduce((sum, d) => sum + d.cost, 0) / older.length;
        
        const recentAvgResponseTime = recent.reduce((sum, d) => sum + d.responseTime, 0) / recent.length;
        const olderAvgResponseTime = older.reduce((sum, d) => sum + d.responseTime, 0) / older.length;
        
        const recentSuccessRate = recent.filter(d => d.success).length / recent.length;
        const olderSuccessRate = older.filter(d => d.success).length / older.length;
        
        return {
            costTrend: olderAvgCost > 0 ? ((recentAvgCost - olderAvgCost) / olderAvgCost) * 100 : 0,
            responseTimeTrend: olderAvgResponseTime > 0 ? ((recentAvgResponseTime - olderAvgResponseTime) / olderAvgResponseTime) * 100 : 0,
            successRateTrend: olderSuccessRate > 0 ? ((recentSuccessRate - olderSuccessRate) / olderSuccessRate) * 100 : 0
        };
    }

    /**
     * Get provider performance data
     */
    getProviderPerformance(providerAddress) {
        // Convert address to provider name (simplified)
        const providerName = this.findProviderName(providerAddress);
        
        if (!this.providerMetrics.has(providerName)) {
            return {
                totalRequests: 0,
                recentSuccessRate: 1.0,
                averageResponseTime: 0,
                averageCost: 0,
                uptime: 100
            };
        }
        
        const metrics = this.providerMetrics.get(providerName);
        
        return {
            totalRequests: metrics.totalRequests,
            recentSuccessRate: metrics.recentSuccessRate,
            averageResponseTime: metrics.totalResponseTime / metrics.totalRequests,
            averageCost: metrics.totalCost / metrics.totalRequests,
            uptime: metrics.uptime,
            averageQuality: metrics.averageQuality
        };
    }

    /**
     * Find provider name by address (simplified mapping)
     */
    findProviderName(address) {
        const addressToName = {
            '0x1111111111111111111111111111111111111111': 'OpenWeatherMap',
            '0x2222222222222222222222222222222222222222': 'WeatherAPI',
            '0x3333333333333333333333333333333333333333': 'IPFS-Pinata',
            '0x4444444444444444444444444444444444444444': 'CoinGecko'
        };
        
        return addressToName[address] || address;
    }

    /**
     * Generate performance report
     */
    generateReport() {
        const now = Date.now();
        const last24h = this.timeSeriesData.filter(d => now - d.timestamp < 24 * 60 * 60 * 1000);
        const last7d = this.timeSeriesData.filter(d => now - d.timestamp < 7 * 24 * 60 * 60 * 1000);
        
        const report = {
            timestamp: now,
            period: '24h',
            summary: {
                totalRequests: this.metrics.totalRequests,
                successRate: (this.metrics.successfulRequests / this.metrics.totalRequests) * 100,
                averageCost: this.metrics.averageCost,
                averageResponseTime: this.metrics.averageResponseTime,
                totalCost: this.metrics.totalCost
            },
            last24h: {
                requests: last24h.length,
                successRate: last24h.filter(d => d.success).length / last24h.length * 100,
                averageCost: last24h.reduce((sum, d) => sum + d.cost, 0) / last24h.length || 0,
                averageResponseTime: last24h.reduce((sum, d) => sum + d.responseTime, 0) / last24h.length || 0
            },
            providers: Array.from(this.providerMetrics.entries()).map(([name, metrics]) => ({
                name,
                requests: metrics.totalRequests,
                successRate: (metrics.successfulRequests / metrics.totalRequests) * 100,
                recentSuccessRate: metrics.recentSuccessRate * 100,
                uptime: metrics.uptime,
                averageQuality: metrics.averageQuality
            })),
            anomalies: this.anomalies.filter(a => now - a.timestamp < 24 * 60 * 60 * 1000),
            trends: this.calculateTrends()
        };
        
        console.log(`📋 Generated performance report: ${report.last24h.requests} requests, ${report.last24h.successRate.toFixed(1)}% success rate`);
        return report;
    }

    /**
     * Get real-time metrics
     */
    getRealTimeMetrics() {
        return {
            ...this.metrics,
            successRate: (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 || 0,
            activeProviders: this.providerMetrics.size,
            recentAnomalies: this.anomalies.filter(a => Date.now() - a.timestamp < 60 * 60 * 1000).length // Last hour
        };
    }

    /**
     * Export monitoring data
     */
    exportData() {
        return {
            metrics: this.metrics,
            providerMetrics: Object.fromEntries(this.providerMetrics),
            timeSeriesData: this.timeSeriesData.slice(-500), // Last 500 data points
            anomalies: this.anomalies.slice(-50) // Last 50 anomalies
        };
    }

    /**
     * Import monitoring data
     */
    importData(data) {
        if (data.metrics) {
            this.metrics = { ...this.metrics, ...data.metrics };
        }
        
        if (data.providerMetrics) {
            this.providerMetrics = new Map(Object.entries(data.providerMetrics));
        }
        
        if (data.timeSeriesData) {
            this.timeSeriesData = data.timeSeriesData;
        }
        
        if (data.anomalies) {
            this.anomalies = data.anomalies;
        }
        
        console.log('📥 Performance monitoring data imported');
    }

    /**
     * Reset metrics
     */
    reset() {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalCost: 0,
            averageResponseTime: 0,
            averageCost: 0
        };
        
        this.providerMetrics.clear();
        this.timeSeriesData = [];
        this.anomalies = [];
        
        console.log('🔄 Performance metrics reset');
    }
}
