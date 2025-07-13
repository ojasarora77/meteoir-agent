/**
 * Usage Prediction AI Model
 * Forecasts resource needs and usage patterns using time series analysis
 */
export class UsagePrediction {
    constructor() {
        this.usageHistory = [];
        this.patterns = {
            hourly: new Array(24).fill(0), // Usage by hour of day
            daily: new Array(7).fill(0),   // Usage by day of week
            monthly: new Array(12).fill(0) // Usage by month
        };
        this.serviceTypePatterns = new Map();
        this.seasonalFactors = new Map();
        
        console.log('📊 Usage Prediction model initialized');
    }

    /**
     * Predict usage for the next 24 hours
     */
    predictNext24Hours(serviceType = null) {
        const now = new Date();
        const predictions = [];

        for (let hour = 0; hour < 24; hour++) {
            const futureTime = new Date(now.getTime() + (hour * 60 * 60 * 1000));
            const prediction = this.predictUsageForTime(futureTime, serviceType);
            
            predictions.push({
                hour: futureTime.getHours(),
                timestamp: futureTime.getTime(),
                predictedUsage: prediction.usage,
                confidence: prediction.confidence,
                serviceType: serviceType
            });
        }

        console.log(`🔮 Generated 24-hour predictions${serviceType ? ` for ${serviceType}` : ''}`);
        return predictions;
    }

    /**
     * Predict usage for a specific time
     */
    predictUsageForTime(dateTime, serviceType = null) {
        const hour = dateTime.getHours();
        const dayOfWeek = dateTime.getDay();
        const month = dateTime.getMonth();

        // Base prediction from historical patterns
        let basePrediction = (
            this.patterns.hourly[hour] +
            this.patterns.daily[dayOfWeek] +
            this.patterns.monthly[month]
        ) / 3;

        // Adjust for service type if specified
        if (serviceType && this.serviceTypePatterns.has(serviceType)) {
            const servicePattern = this.serviceTypePatterns.get(serviceType);
            basePrediction *= servicePattern.multiplier || 1.0;
        }

        // Apply seasonal factors
        const seasonalMultiplier = this.getSeasonalMultiplier(dateTime);
        basePrediction *= seasonalMultiplier;

        // Calculate confidence based on data availability
        const confidence = this.calculateConfidence(hour, dayOfWeek, serviceType);

        return {
            usage: Math.max(0, basePrediction),
            confidence: confidence,
            factors: {
                hourly: this.patterns.hourly[hour],
                daily: this.patterns.daily[dayOfWeek],
                seasonal: seasonalMultiplier
            }
        };
    }

    /**
     * Add new data point to improve predictions
     */
    async addDataPoint(request, result) {
        const timestamp = Date.now();
        const date = new Date(timestamp);

        const dataPoint = {
            timestamp,
            hour: date.getHours(),
            dayOfWeek: date.getDay(),
            month: date.getMonth(),
            serviceType: request.serviceType,
            cost: result.cost,
            responseTime: result.data.responseTime,
            success: result.success,
            priority: request.priority
        };

        this.usageHistory.push(dataPoint);

        // Keep only last 10000 data points to manage memory
        if (this.usageHistory.length > 10000) {
            this.usageHistory = this.usageHistory.slice(-10000);
        }

        // Update patterns
        this.updatePatterns();
        this.updateServiceTypePatterns();

        console.log(`📈 Added data point for ${request.serviceType} at ${date.toISOString()}`);
    }

    /**
     * Update usage patterns based on historical data
     */
    updatePatterns() {
        // Reset patterns
        this.patterns.hourly.fill(0);
        this.patterns.daily.fill(0);
        this.patterns.monthly.fill(0);

        const counts = {
            hourly: new Array(24).fill(0),
            daily: new Array(7).fill(0),
            monthly: new Array(12).fill(0)
        };

        // Aggregate usage data
        this.usageHistory.forEach(point => {
            this.patterns.hourly[point.hour] += point.cost;
            this.patterns.daily[point.dayOfWeek] += point.cost;
            this.patterns.monthly[point.month] += point.cost;

            counts.hourly[point.hour]++;
            counts.daily[point.dayOfWeek]++;
            counts.monthly[point.month]++;
        });

        // Calculate averages
        for (let i = 0; i < 24; i++) {
            this.patterns.hourly[i] = counts.hourly[i] > 0 
                ? this.patterns.hourly[i] / counts.hourly[i] 
                : 0;
        }

        for (let i = 0; i < 7; i++) {
            this.patterns.daily[i] = counts.daily[i] > 0 
                ? this.patterns.daily[i] / counts.daily[i] 
                : 0;
        }

        for (let i = 0; i < 12; i++) {
            this.patterns.monthly[i] = counts.monthly[i] > 0 
                ? this.patterns.monthly[i] / counts.monthly[i] 
                : 0;
        }
    }

    /**
     * Update service-specific patterns
     */
    updateServiceTypePatterns() {
        const serviceData = new Map();

        // Group data by service type
        this.usageHistory.forEach(point => {
            if (!serviceData.has(point.serviceType)) {
                serviceData.set(point.serviceType, []);
            }
            serviceData.get(point.serviceType).push(point);
        });

        // Calculate patterns for each service type
        serviceData.forEach((data, serviceType) => {
            const totalCost = data.reduce((sum, point) => sum + point.cost, 0);
            const averageCost = totalCost / data.length;
            const averageResponseTime = data.reduce((sum, point) => sum + point.responseTime, 0) / data.length;
            const successRate = data.filter(point => point.success).length / data.length;

            // Calculate peak usage hours
            const hourlyUsage = new Array(24).fill(0);
            data.forEach(point => hourlyUsage[point.hour]++);
            const peakHour = hourlyUsage.indexOf(Math.max(...hourlyUsage));

            this.serviceTypePatterns.set(serviceType, {
                totalUsage: data.length,
                averageCost,
                averageResponseTime,
                successRate,
                peakHour,
                multiplier: averageCost > 0 ? averageCost / 0.001 : 1.0, // Normalize to 0.001 ETH baseline
                lastUpdated: Date.now()
            });
        });
    }

    /**
     * Get seasonal multiplier for a given date
     */
    getSeasonalMultiplier(date) {
        const month = date.getMonth();
        const hour = date.getHours();

        // Business hours tend to have higher usage
        let hourMultiplier = 1.0;
        if (hour >= 9 && hour <= 17) { // 9 AM to 5 PM
            hourMultiplier = 1.3;
        } else if (hour >= 18 && hour <= 22) { // 6 PM to 10 PM
            hourMultiplier = 1.1;
        } else if (hour >= 0 && hour <= 6) { // Midnight to 6 AM
            hourMultiplier = 0.7;
        }

        // Weekend patterns
        const dayOfWeek = date.getDay();
        let dayMultiplier = 1.0;
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
            dayMultiplier = 0.8;
        }

        return hourMultiplier * dayMultiplier;
    }

    /**
     * Calculate confidence level for predictions
     */
    calculateConfidence(hour, dayOfWeek, serviceType) {
        let confidence = 0.5; // Base confidence

        // More data points = higher confidence
        const totalDataPoints = this.usageHistory.length;
        if (totalDataPoints > 1000) confidence += 0.3;
        else if (totalDataPoints > 100) confidence += 0.2;
        else if (totalDataPoints > 10) confidence += 0.1;

        // Service-specific data improves confidence
        if (serviceType && this.serviceTypePatterns.has(serviceType)) {
            const servicePattern = this.serviceTypePatterns.get(serviceType);
            if (servicePattern.totalUsage > 50) confidence += 0.1;
        }

        // Recent data is more relevant
        const recentDataPoints = this.usageHistory.filter(
            point => Date.now() - point.timestamp < 7 * 24 * 60 * 60 * 1000 // Last 7 days
        ).length;
        
        if (recentDataPoints > 100) confidence += 0.1;

        return Math.min(1.0, confidence);
    }

    /**
     * Predict optimal budget allocation
     */
    predictBudgetAllocation(totalBudget, timeframe = '24h') {
        const predictions = this.predictNext24Hours();
        const totalPredictedUsage = predictions.reduce((sum, p) => sum + p.predictedUsage, 0);

        if (totalPredictedUsage === 0) {
            return predictions.map(p => ({ ...p, allocatedBudget: totalBudget / predictions.length }));
        }

        return predictions.map(prediction => ({
            ...prediction,
            allocatedBudget: (prediction.predictedUsage / totalPredictedUsage) * totalBudget
        }));
    }

    /**
     * Detect usage anomalies
     */
    detectAnomalies(threshold = 2.0) {
        if (this.usageHistory.length < 50) return []; // Need sufficient data

        const recent = this.usageHistory.slice(-24); // Last 24 data points
        const historical = this.usageHistory.slice(0, -24);

        const historicalAverage = historical.reduce((sum, point) => sum + point.cost, 0) / historical.length;
        const historicalStdDev = this.calculateStandardDeviation(historical.map(p => p.cost));

        const anomalies = recent.filter(point => {
            const deviation = Math.abs(point.cost - historicalAverage) / historicalStdDev;
            return deviation > threshold;
        });

        if (anomalies.length > 0) {
            console.log(`⚠️ Detected ${anomalies.length} usage anomalies`);
        }

        return anomalies;
    }

    /**
     * Calculate standard deviation
     */
    calculateStandardDeviation(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
        return Math.sqrt(avgSquaredDiff);
    }

    /**
     * Get prediction statistics
     */
    getStatistics() {
        const serviceTypes = Array.from(this.serviceTypePatterns.keys());
        
        return {
            totalDataPoints: this.usageHistory.length,
            serviceTypes: serviceTypes.length,
            patterns: {
                peakHour: this.patterns.hourly.indexOf(Math.max(...this.patterns.hourly)),
                peakDay: this.patterns.daily.indexOf(Math.max(...this.patterns.daily)),
                peakMonth: this.patterns.monthly.indexOf(Math.max(...this.patterns.monthly))
            },
            serviceTypeStats: Object.fromEntries(
                Array.from(this.serviceTypePatterns.entries()).map(([type, pattern]) => [
                    type,
                    {
                        usage: pattern.totalUsage,
                        averageCost: pattern.averageCost,
                        successRate: pattern.successRate,
                        peakHour: pattern.peakHour
                    }
                ])
            )
        };
    }

    /**
     * Export model for persistence
     */
    exportModel() {
        return {
            usageHistory: this.usageHistory.slice(-1000), // Keep last 1000 points
            patterns: this.patterns,
            serviceTypePatterns: Object.fromEntries(this.serviceTypePatterns),
            seasonalFactors: Object.fromEntries(this.seasonalFactors)
        };
    }

    /**
     * Import model data
     */
    importModel(modelData) {
        if (modelData.usageHistory) {
            this.usageHistory = modelData.usageHistory;
        }
        
        if (modelData.patterns) {
            this.patterns = modelData.patterns;
        }
        
        if (modelData.serviceTypePatterns) {
            this.serviceTypePatterns = new Map(Object.entries(modelData.serviceTypePatterns));
        }
        
        if (modelData.seasonalFactors) {
            this.seasonalFactors = new Map(Object.entries(modelData.seasonalFactors));
        }
        
        console.log('📥 Usage prediction model imported successfully');
    }
}
