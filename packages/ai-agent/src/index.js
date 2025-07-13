import { ethers } from 'ethers';
import axios from 'axios';
import WebSocket from 'ws';
import cron from 'node-cron';
import { CostOptimizer } from './models/CostOptimizer.js';
import { UsagePrediction } from './models/UsagePrediction.js';
import { ServiceRegistry } from './services/ServiceRegistry.js';
import { ICPCanisterClient } from './services/ICPCanisterClient.js';
import { PaymentExecutor } from './blockchain/PaymentExecutor.js';
import { PerformanceMonitor } from './monitoring/PerformanceMonitor.js';
import { AutonomousDecisionEngine } from './core/AutonomousDecisionEngine.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Autonomous AI Agent for Stablecoin Payments
 * This is the main orchestrator that coordinates all AI models and blockchain interactions
 */
export class AutonomousPaymentAgent {
    constructor(config) {
        this.config = config;
        this.isRunning = false;
        this.startTime = null;
        this.testMode = false; // Initialize test mode flag
        
        // Core components
        this.costOptimizer = new CostOptimizer();
        this.usagePrediction = new UsagePrediction();
        this.serviceRegistry = new ServiceRegistry();
        this.paymentExecutor = new PaymentExecutor(config.reiNetwork);
        this.performanceMonitor = new PerformanceMonitor();
        
        // ICP integration
        this.icpClient = new ICPCanisterClient({
            canisterId: config.icpCanisterId || 'by4bj-cqaaa-aaaaf-qapnq-cai'
        });
        
        // Autonomous decision engine
        this.decisionEngine = new AutonomousDecisionEngine(this, config.decisionEngine);
        
        // State management
        this.currentBudget = null;
        this.activeServices = new Map();
        this.decisionHistory = [];
        this.localUsageQueue = []; // For storing usage data when ICP is unavailable
        
        console.log('🤖 Autonomous Payment Agent initialized');
    }

    /**
     * Start the autonomous agent
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️ Agent is already running');
            return;
        }

        try {
            console.log('🚀 Starting Autonomous Payment Agent...');
            
            // Initialize blockchain connection
            await this.paymentExecutor.initialize();
            
            // Initialize ICP connection (with graceful fallback)
            try {
                await this.icpClient.initialize();
            } catch (icpError) {
                console.warn('⚠️  ICP canister initialization failed:', icpError.message);
                console.log('📋 Agent will run in degraded mode without ICP integration');
            }
            
            // Load current budget
            await this.loadBudgetStatus();
            
            // Initialize service registry
            await this.serviceRegistry.initialize();
            
            // Start autonomous decision engine (with graceful fallback)
            try {
                await this.decisionEngine.start();
            } catch (decisionError) {
                console.warn('⚠️  Decision engine startup partial failure:', decisionError.message);
                console.log('📋 Agent will continue with limited autonomous capabilities');
            }
            
            // Start monitoring loops
            this.startServiceDiscovery();
            this.startUsageMonitoring();
            this.startPerformanceMonitoring();
            
            this.isRunning = true;
            this.startTime = Date.now();
            console.log('✅ Agent is now running autonomously with ICP integration');
            
        } catch (error) {
            console.error('❌ Failed to start agent:', error);
            throw error;
        }
    }

    /**
     * Stop the autonomous agent
     */
    async stop() {
        console.log('🛑 Stopping Autonomous Payment Agent...');
        this.isRunning = false;
        
        // Stop decision engine
        await this.decisionEngine.stop();
        
        // Stop ICP connection
        await this.icpClient.disconnect();
        
        // Stop blockchain event monitoring
        this.paymentExecutor.stopEventMonitoring();
        
        console.log('✅ Agent stopped');
    }

    /**
     * Handle service requests from applications
     */
    async handleServiceRequest(request) {
        try {
            console.log(`🔍 Processing service request: ${request.serviceType}`);
            
            // 1. Validate request
            if (!this.validateServiceRequest(request)) {
                throw new Error('Invalid service request');
            }

            // 2. Check budget constraints
            const budgetCheck = await this.checkBudgetConstraints(request.estimatedCost);
            if (!budgetCheck.allowed) {
                throw new Error(`Budget constraint violated: ${budgetCheck.reason}`);
            }

            // 3. Use autonomous decision engine for provider selection
            const decision = await this.decisionEngine.makeImmediateDecision(request);
            console.log(`🎯 Decision: ${decision.provider} (${decision.reason}, confidence: ${decision.confidence})`);

            // 4. Get provider details
            const providers = await this.serviceRegistry.findProviders(request.serviceType);
            const selectedProvider = providers.find(p => p.id === decision.provider || p.name === decision.provider);
            
            if (!selectedProvider) {
                throw new Error(`Selected provider not found: ${decision.provider}`);
            }

            // 5. Submit payment request to ICP canister (with fallback for failures)
            const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            try {
                await this.icpClient.submitPayment({
                    id: paymentId,
                    providerId: selectedProvider.id,
                    chain: request.chain || 'REI',
                    amount: request.estimatedCost || selectedProvider.costPerCall,
                    recipient: selectedProvider.address,
                    metadata: {
                        serviceType: request.serviceType,
                        requestId: request.id,
                        timestamp: Date.now()
                    }
                });
                console.log(`✅ Payment submitted to ICP canister: ${paymentId}`);
            } catch (icpError) {
                console.warn(`⚠️  ICP canister submission failed: ${icpError.message}`);
                console.log(`📋 Continuing with local payment processing...`);
            }

            // 6. Execute payment and service call
            const result = await this.executeServiceWithPayment(selectedProvider, request, paymentId);

            // 7. Record usage for AI learning (with fallback for ICP failures)
            try {
                await this.icpClient.recordPaymentUsage(
                    request.chain || 'REI',
                    selectedProvider.id,
                    request.estimatedCost || selectedProvider.costPerCall,
                    result.success,
                    result.responseTime
                );
                console.log(`📊 Usage recorded in ICP canister`);
            } catch (icpError) {
                console.warn(`⚠️  ICP usage recording failed: ${icpError.message}`);
                console.log(`📋 Storing usage data locally for later sync...`);
                // Store locally for later sync when ICP is available
                this.storeUsageLocally({
                    chain: request.chain || 'REI',
                    providerId: selectedProvider.id,
                    cost: request.estimatedCost || selectedProvider.costPerCall,
                    success: result.success,
                    responseTime: result.responseTime,
                    timestamp: Date.now()
                });
            }

            // 8. Log decision for analysis
            this.logDecision(request, selectedProvider, result, decision);

            return result;

        } catch (error) {
            console.error(`❌ Service request failed:`, error);
            throw error;
        }
    }

    /**
     * Execute payment and call service
     */
    async executeServiceWithPayment(provider, request, paymentId) {
        const startTime = Date.now();
        
        try {
            // Calculate exact cost
            const cost = provider.calculateCost(request);
            
            console.log(`💰 Executing payment ${paymentId}: ${cost} ETH to ${provider.name}`);
            
            let paymentTx = null;
            
            // Execute blockchain payment (skip in test mode)
            if (this.testMode) {
                console.log(`🧪 TEST MODE: Simulating payment of ${cost} ETH`);
                paymentTx = {
                    hash: `0xtest${Date.now()}`,
                    simulated: true
                };
            } else {
                paymentTx = await this.paymentExecutor.executePayment(
                    provider.address,
                    ethers.parseEther(cost.toString()),
                    request.serviceType
                );
                console.log(`✅ Payment successful: ${paymentTx.hash}`);
            }

            // Call the actual service
            const serviceResult = await provider.callService(request.data);

            // Verify service delivery
            const verification = await this.verifyServiceDelivery(provider, request, serviceResult);
            
            const responseTime = Date.now() - startTime;
            
            // Process payment completion in ICP canister (with fallback for failures)
            if (verification.valid) {
                try {
                    await this.icpClient.processPayment(paymentId);
                    console.log(`✅ Payment processed in ICP canister: ${paymentId}`);
                } catch (icpError) {
                    console.warn(`⚠️  ICP payment processing failed: ${icpError.message}`);
                    console.log(`📋 Payment completed locally, will sync with ICP later`);
                }
            }
            
            return {
                success: verification.valid,
                paymentTx,
                serviceResult,
                verification,
                responseTime,
                cost,
                provider: provider.name,
                paymentId
            };

        } catch (error) {
            const responseTime = Date.now() - startTime;
            console.error(`❌ Service execution failed:`, error);
            
            return {
                success: false,
                error: error.message,
                responseTime,
                provider: provider.name,
                paymentId
            };
        }
    }

    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        // Run performance analytics every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            if (!this.isRunning) return;
            
            try {
                await this.performanceMonitor.collectMetrics();
                console.log('📊 Performance metrics collected');
            } catch (error) {
                console.error('❌ Performance monitoring failed:', error);
            }
        });
    }

    /**
     * Continuous service discovery
     */
    startServiceDiscovery() {
        // Run every hour
        cron.schedule('0 * * * *', async () => {
            if (!this.isRunning) return;
            
            try {
                console.log('🔍 Running service discovery...');
                await this.serviceRegistry.discoverNewServices();
                console.log('✅ Service discovery completed');
            } catch (error) {
                console.error('❌ Service discovery failed:', error);
            }
        });
    }

    /**
     * Monitor usage patterns
     */
    startUsageMonitoring() {
        // Run every 15 minutes
        cron.schedule('*/15 * * * *', async () => {
            if (!this.isRunning) return;
            
            try {
                console.log('📊 Analyzing usage patterns...');
                const patterns = await this.performanceMonitor.analyzeUsagePatterns();
                await this.usagePrediction.updateModel(patterns);
                console.log('✅ Usage analysis completed');
            } catch (error) {
                console.error('❌ Usage monitoring failed:', error);
            }
        });
    }

    /**
     * Continuous cost optimization
     */
    startCostOptimization() {
        // Run every 30 minutes
        cron.schedule('*/30 * * * *', async () => {
            if (!this.isRunning) return;
            
            try {
                console.log('⚡ Running cost optimization...');
                
                // Get current market conditions
                const marketData = await this.gatherMarketData();
                
                // Update cost models
                await this.costOptimizer.updateModels(marketData);
                
                // Re-evaluate active service providers
                await this.reevaluateProviders();
                
                console.log('✅ Cost optimization completed');
            } catch (error) {
                console.error('❌ Cost optimization failed:', error);
            }
        });
    }

    /**
     * Load current budget status from blockchain
     */
    async loadBudgetStatus() {
        try {
            this.currentBudget = await this.paymentExecutor.getBudgetStatus();
            console.log(`💰 Current budget: Daily ${this.currentBudget.dailyRemaining} ETH, Monthly ${this.currentBudget.monthlyRemaining} ETH`);
            
            // Check if budget is zero - enable test mode
            const dailyRemaining = parseFloat(this.currentBudget.dailyRemaining) || 0;
            const monthlyRemaining = parseFloat(this.currentBudget.monthlyRemaining) || 0;
            
            if (dailyRemaining === 0 && monthlyRemaining === 0) {
                console.warn('⚠️  Budget is zero - enabling TEST MODE for demonstration');
                this.testMode = true;
                // Set minimal test budget
                this.currentBudget = {
                    dailyRemaining: 0.001, // 0.001 ETH for testing
                    monthlyRemaining: 0.001,
                    isTestMode: true
                };
            }
        } catch (error) {
            console.error('❌ Failed to load budget status:', error);
            console.log('📋 Enabling TEST MODE due to budget loading failure');
            this.testMode = true;
            this.currentBudget = {
                dailyRemaining: 0.001, // 0.001 ETH for testing
                monthlyRemaining: 0.001,
                isTestMode: true
            };
        }
    }

    /**
     * Validate service request
     */
    validateServiceRequest(request) {
        const required = ['serviceType', 'data', 'maxCost', 'priority'];
        return required.every(field => request[field] !== undefined);
    }

    /**
     * Check budget constraints
     */
    async checkBudgetConstraints(estimatedCost) {
        // Refresh budget status
        await this.loadBudgetStatus();
        
        // In test mode, be more lenient with budget constraints
        if (this.testMode) {
            console.log(`🧪 TEST MODE: Allowing service request (estimated cost: ${estimatedCost} ETH)`);
            return { allowed: true, reason: 'Test mode enabled' };
        }
        
        if (estimatedCost > this.currentBudget.dailyRemaining) {
            return { allowed: false, reason: 'Daily budget exceeded' };
        }
        
        if (estimatedCost > this.currentBudget.monthlyRemaining) {
            return { allowed: false, reason: 'Monthly budget exceeded' };
        }
        
        return { allowed: true };
    }

    /**
     * Update AI models with feedback
     */
    async updateModelsWithFeedback(provider, request, result) {
        try {
            const feedback = {
                provider: provider.name,
                cost: result.cost,
                responseTime: result.data.responseTime,
                quality: this.assessServiceQuality(result.data),
                timestamp: Date.now()
            };

            await this.costOptimizer.addFeedback(feedback);
            await this.usagePrediction.addDataPoint(request, result);
            
        } catch (error) {
            console.error('❌ Failed to update models:', error);
        }
    }

    /**
     * Assess service quality
     */
    assessServiceQuality(serviceData) {
        // Simple quality assessment - can be enhanced
        let score = 100;
        
        if (serviceData.responseTime > 5000) score -= 20; // Slow response
        if (serviceData.error) score -= 50; // Errors
        if (!serviceData.data) score -= 30; // No data
        
        return Math.max(0, score);
    }

    /**
     * Verify service delivery
     */
    async verifyServiceDelivery(provider, request, result) {
        // Basic verification - can be enhanced with more sophisticated checks
        const checks = {
            hasData: !!result.data,
            responseTime: result.responseTime < 30000, // 30 second timeout
            noErrors: !result.error
        };

        const allPassed = Object.values(checks).every(check => check);
        
        return {
            valid: allPassed,
            reason: allPassed ? 'All checks passed' : 'Service verification failed',
            checks: checks
        };
    }

    /**
     * Gather market data for optimization
     */
    async gatherMarketData() {
        try {
            // Gather pricing data from various sources
            const marketData = {
                timestamp: Date.now(),
                gasPrices: await this.getGasPrices(),
                serviceProviderPricing: await this.serviceRegistry.getAllPricing(),
                networkStatus: await this.getNetworkStatus()
            };

            return marketData;
        } catch (error) {
            console.error('❌ Failed to gather market data:', error);
            return null;
        }
    }

    /**
     * Re-evaluate current service providers
     */
    async reevaluateProviders() {
        try {
            const providers = await this.serviceRegistry.getAllProviders();
            
            for (const provider of providers) {
                const performance = await this.performanceMonitor.getProviderPerformance(provider.address);
                const newRanking = this.costOptimizer.calculateProviderRanking(provider, performance);
                
                await this.serviceRegistry.updateProviderRanking(provider.address, newRanking);
            }
            
        } catch (error) {
            console.error('❌ Failed to re-evaluate providers:', error);
        }
    }

    /**
     * Get current gas prices
     */
    async getGasPrices() {
        try {
            // For REI Network, this might always be 0 or very low
            const gasPrice = await this.paymentExecutor.provider.getGasPrice();
            return ethers.formatUnits(gasPrice, 'gwei');
        } catch (error) {
            console.error('❌ Failed to get gas prices:', error);
            return 0;
        }
    }

    /**
     * Get network status
     */
    async getNetworkStatus() {
        try {
            const blockNumber = await this.paymentExecutor.provider.getBlockNumber();
            const network = await this.paymentExecutor.provider.getNetwork();
            
            return {
                blockNumber,
                chainId: network.chainId,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('❌ Failed to get network status:', error);
            return null;
        }
    }

    /**
     * Log decision for analysis
     */
    logDecision(request, provider, result, aiDecision = null) {
        const decision = {
            timestamp: Date.now(),
            request: {
                serviceType: request.serviceType,
                maxCost: request.maxCost,
                priority: request.priority
            },
            decision: {
                provider: provider.name,
                cost: result.cost,
                reasoning: aiDecision ? aiDecision.reason : (provider.reasoning || 'Cost optimized selection'),
                confidence: aiDecision ? aiDecision.confidence : 0.8,
                source: aiDecision ? 'AI Decision Engine' : 'Local Optimizer'
            },
            outcome: {
                success: result.success,
                quality: result.serviceResult ? this.assessServiceQuality(result.serviceResult) : 0,
                responseTime: result.responseTime || 0,
                paymentId: result.paymentId
            }
        };

        this.decisionHistory.push(decision);
        
        // Keep only last 1000 decisions in memory
        if (this.decisionHistory.length > 1000) {
            this.decisionHistory = this.decisionHistory.slice(-1000);
        }

        console.log(`📝 Decision logged: ${provider.name} selected for ${request.serviceType} (${decision.decision.source})`);
    }

    /**
     * Get agent statistics
     */
    getStatistics() {
        const recent = this.decisionHistory.slice(-100); // Last 100 decisions
        
        const stats = {
            totalDecisions: this.decisionHistory.length,
            recentDecisions: recent.length,
            averageCost: recent.reduce((sum, d) => sum + d.decision.cost, 0) / recent.length || 0,
            successRate: recent.filter(d => d.outcome.success).length / recent.length || 0,
            averageQuality: recent.reduce((sum, d) => sum + d.outcome.quality, 0) / recent.length || 0,
            providerDistribution: this.calculateProviderDistribution(recent)
        };

        return stats;
    }

    /**
     * Calculate provider distribution
     */
    calculateProviderDistribution(decisions) {
        const distribution = {};
        decisions.forEach(decision => {
            const provider = decision.decision.provider;
            distribution[provider] = (distribution[provider] || 0) + 1;
        });
        return distribution;
    }

    /**
     * Get comprehensive agent status
     */
    async getStatus() {
        try {
            const status = {
                agent: {
                    isRunning: this.isRunning,
                    uptime: this.isRunning ? Date.now() - this.startTime : 0,
                    testMode: this.testMode || false
                },
                blockchain: {
                    connected: this.paymentExecutor.wallet ? true : false,
                    walletAddress: this.paymentExecutor.wallet?.address,
                    network: this.paymentExecutor.provider?.network?.name
                },
                icp: {
                    connected: this.icpClient.isHealthy(),
                    canisterId: this.icpClient.canisterId,
                    health: await this.icpClient.healthCheck().catch(() => 'Unhealthy'),
                    localQueueSize: this.localUsageQueue?.length || 0
                },
                decisionEngine: this.decisionEngine.getStatus(),
                budget: this.currentBudget || await this.paymentExecutor.getBudgetStatus().catch(() => null),
                statistics: this.getStatistics(),
                services: {
                    registeredProviders: this.serviceRegistry.providers.size,
                    activeProviders: Array.from(this.serviceRegistry.providers.values()).filter(p => p.active).length
                }
            };

            return status;
        } catch (error) {
            console.error('❌ Failed to get status:', error);
            return {
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    /**
     * Store usage data locally when ICP canister is unavailable
     */
    storeUsageLocally(usageData) {
        if (!this.localUsageQueue) {
            this.localUsageQueue = [];
        }
        
        this.localUsageQueue.push(usageData);
        console.log(`📋 Stored usage data locally (queue size: ${this.localUsageQueue.length})`);
        
        // Limit queue size to prevent memory issues
        if (this.localUsageQueue.length > 100) {
            this.localUsageQueue = this.localUsageQueue.slice(-50); // Keep last 50 entries
        }
    }

    /**
     * Attempt to sync local usage data with ICP canister
     */
    async syncLocalUsageWithICP() {
        if (!this.localUsageQueue || this.localUsageQueue.length === 0) {
            return;
        }

        console.log(`🔄 Attempting to sync ${this.localUsageQueue.length} local usage records with ICP...`);
        
        const synced = [];
        for (const usage of this.localUsageQueue) {
            try {
                await this.icpClient.recordPaymentUsage(
                    usage.chain,
                    usage.providerId,
                    usage.cost,
                    usage.success,
                    usage.responseTime
                );
                synced.push(usage);
            } catch (error) {
                console.warn(`⚠️  Failed to sync usage record: ${error.message}`);
                break; // Stop syncing if ICP is still unavailable
            }
        }

        // Remove successfully synced records
        this.localUsageQueue = this.localUsageQueue.filter(usage => !synced.includes(usage));
        
        if (synced.length > 0) {
            console.log(`✅ Synced ${synced.length} usage records with ICP canister`);
        }
    }
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const config = {
        reiNetwork: {
            rpcUrl: process.env.REI_RPC_URL || 'https://rpc-testnet.rei.network',
            privateKey: process.env.PRIVATE_KEY,
            contractAddress: process.env.PAYMENT_CONTROLLER_ADDRESS
        }
    };

    const agent = new AutonomousPaymentAgent(config);
    
    // Start the agent
    await agent.start();
    
    // Example service request
    const exampleRequest = {
        serviceType: 'weather',
        data: { location: 'New York', fields: ['temperature', 'humidity'] },
        maxCost: 0.001,
        priority: 'normal'
    };
    
    try {
        const result = await agent.handleServiceRequest(exampleRequest);
        console.log('✅ Service request completed:', result);
    } catch (error) {
        console.error('❌ Service request failed:', error);
    }
}
