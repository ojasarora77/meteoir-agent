import cron from 'node-cron';
import { ICPCanisterClient } from '../services/ICPCanisterClient.js';

/**
 * Autonomous Decision Engine - The brain of the AI agent
 * Makes independent decisions about payment routing, optimization, and provider selection
 */
export class AutonomousDecisionEngine {
    constructor(agent, config = {}) {
        this.agent = agent;
        this.config = {
            optimizationInterval: config.optimizationInterval || '*/30 * * * * *', // Every 30 seconds
            rebalanceInterval: config.rebalanceInterval || '0 */5 * * * *',      // Every 5 minutes
            healthCheckInterval: config.healthCheckInterval || '0 * * * * *',     // Every minute
            maxCostPerTransaction: config.maxCostPerTransaction || 0.01,          // 0.01 ETH
            reliabilityThreshold: config.reliabilityThreshold || 0.95,           // 95%
            emergencyThreshold: config.emergencyThreshold || 0.005,              // 0.005 ETH
            ...config
        };
        
        // State management
        this.isRunning = false;
        this.scheduledJobs = new Map();
        this.decisionHistory = [];
        this.currentStrategies = new Map();
        
        // Performance tracking
        this.performanceMetrics = {
            decisionsPerHour: 0,
            successfulOptimizations: 0,
            costSavings: 0,
            lastOptimization: null
        };
        
        // ICP integration
        this.icpClient = new ICPCanisterClient({
            canisterId: config.icpCanisterId || 'by4bj-cqaaa-aaaaf-qapnq-cai'
        });
        
        console.log('🧠 Autonomous Decision Engine initialized');
    }

    /**
     * Start the autonomous decision making process
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️ Decision engine already running');
            return;
        }

        try {
            console.log('🚀 Starting Autonomous Decision Engine...');
            
            // Initialize ICP connection
            await this.icpClient.initialize();
            
            // Start all autonomous loops
            this.startOptimizationLoop();
            this.startRebalancingLoop();
            this.startHealthMonitoring();
            this.startPaymentProcessing();
            
            this.isRunning = true;
            console.log('✅ Autonomous Decision Engine is now running');
            
        } catch (error) {
            console.error('❌ Failed to start decision engine:', error);
            throw error;
        }
    }

    /**
     * Stop the autonomous decision engine
     */
    async stop() {
        console.log('🛑 Stopping Autonomous Decision Engine...');
        
        this.isRunning = false;
        
        // Stop all scheduled jobs
        for (const [name, job] of this.scheduledJobs) {
            job.stop();
            console.log(`🔴 Stopped ${name} loop`);
        }
        
        this.scheduledJobs.clear();
        
        // Disconnect from ICP
        await this.icpClient.disconnect();
        
        console.log('✅ Autonomous Decision Engine stopped');
    }

    /**
     * Start continuous cost optimization loop
     */
    startOptimizationLoop() {
        console.log(`⚡ Starting optimization loop: ${this.config.optimizationInterval}`);
        
        const job = cron.schedule(this.config.optimizationInterval, async () => {
            await this.performOptimization();
        }, { 
            scheduled: false 
        });
        
        job.start();
        this.scheduledJobs.set('optimization', job);
    }

    /**
     * Start rebalancing analysis loop
     */
    startRebalancingLoop() {
        console.log(`🔄 Starting rebalancing loop: ${this.config.rebalanceInterval}`);
        
        const job = cron.schedule(this.config.rebalanceInterval, async () => {
            await this.analyzeRebalancing();
        }, { 
            scheduled: false 
        });
        
        job.start();
        this.scheduledJobs.set('rebalancing', job);
    }

    /**
     * Start health monitoring loop
     */
    startHealthMonitoring() {
        console.log(`💚 Starting health monitoring: ${this.config.healthCheckInterval}`);
        
        const job = cron.schedule(this.config.healthCheckInterval, async () => {
            await this.performHealthCheck();
        }, { 
            scheduled: false 
        });
        
        job.start();
        this.scheduledJobs.set('health', job);
    }

    /**
     * Start automatic payment processing
     */
    startPaymentProcessing() {
        console.log('💸 Starting payment processing loop: every 60 seconds');
        
        const job = cron.schedule('0 * * * * *', async () => { // Every minute
            await this.processHangingPayments();
        }, { 
            scheduled: false 
        });
        
        job.start();
        this.scheduledJobs.set('payment-processing', job);
    }

    /**
     * Perform autonomous cost optimization
     */
    async performOptimization() {
        try {
            console.log('🎯 Performing autonomous optimization...');
            
            // Get current usage metrics from ICP
            const metrics = await this.icpClient.getUsageMetrics(3600); // Last hour
            
            if (!metrics) {
                console.log('📊 No metrics available for optimization');
                return;
            }

            // Analyze performance and make decisions
            const decisions = await this.analyzeAndDecide(metrics);
            
            // Execute decisions
            for (const decision of decisions) {
                await this.executeDecision(decision);
            }
            
            // Update performance metrics
            this.updatePerformanceMetrics();
            
            console.log(`✅ Optimization complete: ${decisions.length} decisions made`);
            
        } catch (error) {
            console.error('❌ Optimization failed:', error);
        }
    }

    /**
     * Analyze metrics and make optimization decisions
     */
    async analyzeAndDecide(metrics) {
        const decisions = [];
        
        // Decision 1: Provider performance analysis
        if (metrics.costEfficiency < 0.8) {
            decisions.push({
                type: 'OPTIMIZE_PROVIDERS',
                priority: 'HIGH',
                reason: `Low cost efficiency: ${metrics.costEfficiency.toFixed(3)}`,
                action: 'reselect_providers',
                data: { targetEfficiency: 0.9 }
            });
        }

        // Decision 2: Response time optimization
        if (metrics.averageResponseTime > 5000) { // > 5 seconds
            decisions.push({
                type: 'OPTIMIZE_RESPONSE_TIME',
                priority: 'MEDIUM',
                reason: `High response time: ${metrics.averageResponseTime.toFixed(0)}ms`,
                action: 'switch_faster_providers',
                data: { maxResponseTime: 3000 }
            });
        }

        // Decision 3: Budget management
        const budgetStatus = await this.agent.paymentExecutor.getBudgetStatus();
        const dailyUtilization = parseFloat(budgetStatus.dailySpent) / parseFloat(budgetStatus.dailyLimit);
        
        if (dailyUtilization > 0.8) {
            decisions.push({
                type: 'BUDGET_MANAGEMENT',
                priority: 'HIGH',
                reason: `High budget utilization: ${(dailyUtilization * 100).toFixed(1)}%`,
                action: 'reduce_costs',
                data: { utilizationRate: dailyUtilization }
            });
        }

        // Decision 4: Provider diversity
        const providers = await this.icpClient.listServiceProviders();
        const activeProviders = providers.filter(p => p.isActive);
        
        if (activeProviders.length < 2) {
            decisions.push({
                type: 'PROVIDER_DIVERSITY',
                priority: 'MEDIUM',
                reason: `Low provider diversity: ${activeProviders.length} active`,
                action: 'discover_providers',
                data: { targetCount: 3 }
            });
        }

        // Record decisions
        this.decisionHistory.push({
            timestamp: Date.now(),
            metrics,
            decisions: decisions.length,
            types: decisions.map(d => d.type)
        });

        return decisions;
    }

    /**
     * Execute optimization decision
     */
    async executeDecision(decision) {
        try {
            console.log(`🎯 Executing decision: ${decision.type} (${decision.priority})`);
            console.log(`📝 Reason: ${decision.reason}`);
            
            switch (decision.action) {
                case 'reselect_providers':
                    await this.optimizeProviderSelection(decision.data);
                    break;
                    
                case 'switch_faster_providers':
                    await this.optimizeResponseTime(decision.data);
                    break;
                    
                case 'reduce_costs':
                    await this.implementCostReduction(decision.data);
                    break;
                    
                case 'discover_providers':
                    await this.discoverNewProviders(decision.data);
                    break;
                    
                default:
                    console.log(`⚠️ Unknown decision action: ${decision.action}`);
            }
            
            // Record successful decision execution
            decision.executed = true;
            decision.executedAt = Date.now();
            
        } catch (error) {
            console.error(`❌ Failed to execute decision ${decision.type}:`, error);
            decision.error = error.message;
        }
    }

    /**
     * Optimize provider selection based on cost efficiency
     */
    async optimizeProviderSelection(data) {
        try {
            const providers = await this.icpClient.listServiceProviders();
            
            // Sort by cost efficiency (lower cost, higher reliability)
            const optimizedProviders = providers
                .filter(p => p.reliabilityScore >= this.config.reliabilityThreshold)
                .sort((a, b) => {
                    const scoreA = a.reliabilityScore / a.costPerRequest;
                    const scoreB = b.reliabilityScore / b.costPerRequest;
                    return scoreB - scoreA;
                });

            if (optimizedProviders.length > 0) {
                const bestProvider = optimizedProviders[0];
                console.log(`✅ Selected optimal provider: ${bestProvider.name}`);
                
                // Update agent's preferred provider
                this.currentStrategies.set('preferred_provider', bestProvider.id);
                
                // Sync with ICP canister
                await this.icpClient.updateOptimizationSettings({
                    preferredChains: [bestProvider.supportedChains[0]],
                    reliabilityThreshold: this.config.reliabilityThreshold
                });
            }
            
        } catch (error) {
            console.error('❌ Provider selection optimization failed:', error);
        }
    }

    /**
     * Optimize for faster response times
     */
    async optimizeResponseTime(data) {
        try {
            const providers = await this.icpClient.listServiceProviders();
            
            // For now, prefer providers with higher reliability (proxy for speed)
            const fastProviders = providers
                .filter(p => p.reliabilityScore > 0.97)
                .sort((a, b) => b.reliabilityScore - a.reliabilityScore);

            if (fastProviders.length > 0) {
                console.log(`⚡ Switching to faster provider: ${fastProviders[0].name}`);
                this.currentStrategies.set('fast_provider', fastProviders[0].id);
            }
            
        } catch (error) {
            console.error('❌ Response time optimization failed:', error);
        }
    }

    /**
     * Implement cost reduction strategies
     */
    async implementCostReduction(data) {
        try {
            console.log(`💰 Implementing cost reduction (utilization: ${(data.utilizationRate * 100).toFixed(1)}%)`);
            
            // Strategy: Reduce transaction frequency
            const newSettings = {
                maxCostPerTransaction: this.config.maxCostPerTransaction * 0.8,
                autoOptimizationEnabled: true,
                rebalanceFrequency: 7200 // Reduce frequency to save costs
            };
            
            await this.icpClient.updateOptimizationSettings(newSettings);
            console.log('💡 Reduced max cost per transaction by 20%');
            
        } catch (error) {
            console.error('❌ Cost reduction failed:', error);
        }
    }

    /**
     * Discover and register new service providers
     */
    async discoverNewProviders(data) {
        try {
            console.log(`🔍 Discovering new providers (target: ${data.targetCount})`);
            
            // For demonstration, add some example providers
            const newProviders = [
                {
                    name: 'CheapAPI Provider',
                    apiEndpoint: 'https://api.cheapservice.com/v1',
                    costPerCall: 0.00005,
                    reliabilityScore: 0.96,
                    supportedChains: ['REI', 'Polygon'],
                    active: true
                },
                {
                    name: 'FastResponse Provider',
                    apiEndpoint: 'https://api.fastresponse.com/v1',
                    costPerCall: 0.0002,
                    reliabilityScore: 0.99,
                    supportedChains: ['REI'],
                    active: true
                }
            ];

            for (const provider of newProviders) {
                try {
                    await this.icpClient.registerServiceProvider(provider);
                    console.log(`✅ Registered new provider: ${provider.name}`);
                } catch (error) {
                    console.log(`⚠️ Provider ${provider.name} may already exist`);
                }
            }
            
        } catch (error) {
            console.error('❌ Provider discovery failed:', error);
        }
    }

    /**
     * Analyze rebalancing opportunities
     */
    async analyzeRebalancing() {
        try {
            console.log('🔄 Analyzing rebalancing opportunities...');
            
            const suggestions = await this.icpClient.getRebalancingSuggestions();
            
            if (suggestions.length > 0) {
                console.log(`💡 Found ${suggestions.length} rebalancing suggestions:`);
                
                for (const suggestion of suggestions) {
                    console.log(`   ${suggestion.fromChain} → ${suggestion.toChain}: ${suggestion.reason}`);
                    console.log(`   Potential savings: ${suggestion.potentialSavings.toFixed(4)} ETH`);
                    
                    // Auto-execute if savings are significant
                    if (suggestion.potentialSavings > 0.001) {
                        await this.executeRebalancing(suggestion);
                    }
                }
            } else {
                console.log('✅ No rebalancing needed at this time');
            }
            
        } catch (error) {
            console.error('❌ Rebalancing analysis failed:', error);
        }
    }

    /**
     * Execute rebalancing suggestion
     */
    async executeRebalancing(suggestion) {
        try {
            console.log(`🔄 Executing rebalancing: ${suggestion.fromChain} → ${suggestion.toChain}`);
            
            // Update preferred chains in optimization settings
            await this.icpClient.updateOptimizationSettings({
                preferredChains: [suggestion.toChain, suggestion.fromChain],
                autoOptimizationEnabled: true
            });
            
            console.log(`✅ Rebalancing executed: Switching to ${suggestion.toChain}`);
            
        } catch (error) {
            console.error('❌ Rebalancing execution failed:', error);
        }
    }

    /**
     * Perform system health check
     */
    async performHealthCheck() {
        try {
            // Check ICP canister health
            const icpHealth = await this.icpClient.healthCheck();
            
            // Check blockchain connection
            const blockchainHealth = await this.agent.paymentExecutor.checkEmergencyStop();
            
            // Check budget status
            const budgetStatus = await this.agent.paymentExecutor.getBudgetStatus();
            const dailyRemaining = parseFloat(budgetStatus.dailyRemaining);
            
            // Health decisions
            if (icpHealth === 'Unhealthy') {
                console.warn('⚠️ ICP canister unhealthy - attempting reconnection');
                await this.icpClient.initialize();
            }
            
            if (blockchainHealth) {
                console.warn('🛑 Emergency stop active - pausing operations');
                // Could implement emergency protocols here
            }
            
            if (dailyRemaining < this.config.emergencyThreshold) {
                console.warn(`💰 Low budget warning: ${dailyRemaining} ETH remaining`);
                // Implement budget conservation mode
                await this.implementEmergencyBudgetMode();
            }
            
        } catch (error) {
            console.error('❌ Health check failed:', error);
        }
    }

    /**
     * Process hanging/pending payments
     */
    async processHangingPayments() {
        try {
            const pendingPayments = await this.icpClient.listPendingPayments();
            
            if (pendingPayments.length > 0) {
                console.log(`💸 Processing ${pendingPayments.length} pending payments`);
                
                for (const payment of pendingPayments) {
                    try {
                        await this.icpClient.processPayment(payment.id);
                        console.log(`✅ Processed payment: ${payment.id}`);
                    } catch (error) {
                        console.error(`❌ Failed to process payment ${payment.id}:`, error);
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Payment processing failed:', error);
        }
    }

    /**
     * Implement emergency budget conservation mode
     */
    async implementEmergencyBudgetMode() {
        try {
            console.log('🚨 Implementing emergency budget mode');
            
            // Reduce costs aggressively
            await this.icpClient.updateOptimizationSettings({
                maxCostPerTransaction: this.config.emergencyThreshold,
                autoOptimizationEnabled: true,
                reliabilityThreshold: 0.9, // Lower threshold to find cheaper options
                rebalanceFrequency: 3600
            });
            
            console.log('💡 Emergency budget mode activated');
            
        } catch (error) {
            console.error('❌ Emergency budget mode failed:', error);
        }
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics() {
        const now = Date.now();
        const hourAgo = now - (60 * 60 * 1000);
        
        // Count decisions in the last hour
        const recentDecisions = this.decisionHistory.filter(d => d.timestamp > hourAgo);
        this.performanceMetrics.decisionsPerHour = recentDecisions.length;
        
        // Count successful optimizations
        const successfulOptimizations = recentDecisions.filter(d => d.decisions > 0);
        this.performanceMetrics.successfulOptimizations = successfulOptimizations.length;
        
        this.performanceMetrics.lastOptimization = now;
    }

    /**
     * Get current decision engine status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeJobs: Array.from(this.scheduledJobs.keys()),
            performance: this.performanceMetrics,
            strategies: Object.fromEntries(this.currentStrategies),
            icpConnected: this.icpClient.isHealthy(),
            recentDecisions: this.decisionHistory.slice(-10)
        };
    }

    /**
     * Make an immediate optimization decision for a service request
     */
    async makeImmediateDecision(request) {
        try {
            console.log(`🎯 Making immediate decision for: ${request.serviceType}`);
            
            // Get optimal route from ICP canister (with fallback for failures)
            let recommendedProvider = null;
            try {
                recommendedProvider = await this.icpClient.optimizePaymentRoute(
                    request.chain || 'REI',
                    request.estimatedCost || 0.0001
                );
                
                if (recommendedProvider) {
                    console.log(`✅ ICP recommends: ${recommendedProvider}`);
                    return {
                        provider: recommendedProvider,
                        reason: 'ICP canister optimization',
                        confidence: 0.95
                    };
                }
            } catch (icpError) {
                console.warn(`⚠️  ICP route optimization failed: ${icpError.message}`);
                console.log(`📋 Falling back to local optimization...`);
            }
            
            // Fallback to local optimization
            const providers = await this.agent.serviceRegistry.getProvidersByType(request.serviceType);
            if (providers.length > 0) {
                const selected = this.agent.costOptimizer.selectOptimal(providers, request);
                return {
                    provider: selected.name || selected.id,
                    reason: 'Local cost optimization',
                    confidence: 0.8
                };
            }
            
            throw new Error('No suitable providers found');
            
        } catch (error) {
            console.error('❌ Immediate decision failed:', error);
            throw error;
        }
    }
}
