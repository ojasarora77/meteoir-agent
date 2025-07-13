import { Actor, HttpAgent } from '@dfinity/agent';
import axios from 'axios';

/**
 * ICP Canister Client - Connects AI Agent to deployed ICP canister
 * Syncs optimization decisions and payment data with the ICP brain
 */
export class ICPCanisterClient {
    constructor(config = {}) {
        this.canisterId = config.canisterId || 'by4bj-cqaaa-aaaaf-qapnq-cai';
        this.host = config.host || 'https://ic0.app';
        this.agent = null;
        this.actor = null;
        this.isConnected = false;
        
        console.log('🔗 ICP Canister Client initialized');
    }

    /**
     * Initialize connection to ICP canister
     */
    async initialize() {
        try {
            console.log(`🚀 Connecting to ICP canister: ${this.canisterId}`);
            
            // Create HTTP agent
            this.agent = new HttpAgent({ 
                host: this.host,
                // For local development, disable certificate verification
                // verifyQuerySignatures: false 
            });
            
            // Create actor with canister interface
            this.actor = Actor.createActor(this.getCanisterIDL(), {
                agent: this.agent,
                canisterId: this.canisterId,
            });

            // Test connection with health check
            const healthStatus = await this.healthCheck();
            console.log(`✅ Connected to ICP canister: ${healthStatus}`);
            
            this.isConnected = true;
            return true;
            
        } catch (error) {
            console.error('❌ Failed to connect to ICP canister:', error);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            if (!this.actor) {
                throw new Error('Not connected to canister');
            }
            
            const result = await this.actor.health_check();
            return result;
            
        } catch (error) {
            console.error('❌ Health check failed:', error);
            this.isConnected = false;
            return 'Unhealthy';
        }
    }

    /**
     * Register service provider with ICP canister
     */
    async registerServiceProvider(provider) {
        try {
            console.log(`📝 Registering provider with ICP: ${provider.name}`);
            
            const serviceProvider = {
                id: provider.id || provider.name.toLowerCase().replace(/\s+/g, '-'),
                name: provider.name,
                api_endpoint: provider.apiEndpoint,
                supported_chains: provider.supportedChains || ['REI'],
                cost_per_request: Math.floor((provider.costPerCall || 0.0001) * 1e18), // Convert to wei equivalent
                reliability_score: provider.reliabilityScore || 0.95,
                last_ping: Math.floor(Date.now() / 1000),
                is_active: provider.active !== false
            };

            const result = await this.actor.register_service_provider(serviceProvider);
            
            if (result.Ok) {
                console.log(`✅ Provider registered successfully: ${result.Ok}`);
                return result.Ok;
            } else {
                throw new Error(result.Err);
            }
            
        } catch (error) {
            console.error('❌ Failed to register provider with ICP:', error);
            throw error;
        }
    }

    /**
     * Get optimal payment route from ICP canister
     */
    async optimizePaymentRoute(chain, amount) {
        try {
            console.log(`🎯 Requesting route optimization: ${chain}, ${amount}`);
            
            const amountBigInt = BigInt(Math.floor(amount * 1e18)); // Convert to wei equivalent
            const result = await this.actor.optimize_payment_route(chain, amountBigInt);
            
            if (result.length > 0) {
                const providerId = result[0];
                console.log(`✅ ICP recommends provider: ${providerId}`);
                return providerId;
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Failed to get route optimization:', error);
            return null;
        }
    }

    /**
     * Submit payment request to ICP canister
     */
    async submitPayment(paymentData) {
        try {
            console.log(`💸 Submitting payment to ICP: ${paymentData.id}`);
            
            const paymentRequest = {
                id: paymentData.id,
                provider_id: paymentData.providerId,
                chain: paymentData.chain || 'REI',
                amount: BigInt(Math.floor(paymentData.amount * 1e18)),
                recipient: paymentData.recipient,
                metadata: JSON.stringify(paymentData.metadata || {}),
                timestamp: BigInt(Math.floor(Date.now() / 1000)),
                status: { Pending: null }
            };

            const result = await this.actor.submit_payment(paymentRequest);
            
            if (result.Ok) {
                console.log(`✅ Payment submitted to ICP: ${result.Ok}`);
                return result.Ok;
            } else {
                throw new Error(result.Err);
            }
            
        } catch (error) {
            console.error('❌ Failed to submit payment to ICP:', error);
            throw error;
        }
    }

    /**
     * Process pending payment
     */
    async processPayment(paymentId) {
        try {
            const result = await this.actor.process_payment(paymentId);
            
            if (result.Ok) {
                console.log(`✅ Payment processed: ${result.Ok}`);
                return result.Ok;
            } else {
                throw new Error(result.Err);
            }
            
        } catch (error) {
            console.error('❌ Failed to process payment:', error);
            throw error;
        }
    }

    /**
     * Record payment usage for AI learning
     */
    async recordPaymentUsage(chain, providerId, amount, successful, responseTime) {
        try {
            const amountBigInt = BigInt(Math.floor(amount * 1e18));
            
            const result = await this.actor.record_payment_usage(
                chain,
                providerId,
                amountBigInt,
                successful,
                responseTime
            );
            
            if (result.Ok) {
                console.log(`📊 Usage recorded: ${result.Ok}`);
                return result.Ok;
            }
            
        } catch (error) {
            console.error('❌ Failed to record usage:', error);
        }
    }

    /**
     * Get usage metrics
     */
    async getUsageMetrics(timeWindow = 3600) {
        try {
            const metrics = await this.actor.get_usage_metrics(BigInt(timeWindow));
            
            return {
                totalRequests: Number(metrics.total_requests),
                successfulPayments: Number(metrics.successful_payments),
                failedPayments: Number(metrics.failed_payments),
                totalVolume: Number(metrics.total_volume) / 1e18, // Convert back to ETH
                averageResponseTime: metrics.average_response_time,
                costEfficiency: metrics.cost_efficiency
            };
            
        } catch (error) {
            console.error('❌ Failed to get usage metrics:', error);
            return null;
        }
    }

    /**
     * Get rebalancing suggestions
     */
    async getRebalancingSuggestions() {
        try {
            const suggestions = await this.actor.get_rebalancing_suggestions();
            
            return suggestions.map(suggestion => ({
                fromChain: suggestion.from_chain,
                toChain: suggestion.to_chain,
                reason: suggestion.reason,
                potentialSavings: suggestion.potential_savings
            }));
            
        } catch (error) {
            console.error('❌ Failed to get rebalancing suggestions:', error);
            return [];
        }
    }

    /**
     * List all service providers
     */
    async listServiceProviders() {
        try {
            const providers = await this.actor.list_service_providers();
            
            return providers.map(provider => ({
                id: provider.id,
                name: provider.name,
                apiEndpoint: provider.api_endpoint,
                supportedChains: provider.supported_chains,
                costPerRequest: Number(provider.cost_per_request) / 1e18,
                reliabilityScore: provider.reliability_score,
                lastPing: Number(provider.last_ping),
                isActive: provider.is_active
            }));
            
        } catch (error) {
            console.error('❌ Failed to list providers:', error);
            return [];
        }
    }

    /**
     * List pending payments
     */
    async listPendingPayments() {
        try {
            const payments = await this.actor.list_pending_payments();
            
            return payments.map(payment => ({
                id: payment.id,
                providerId: payment.provider_id,
                chain: payment.chain,
                amount: Number(payment.amount) / 1e18,
                recipient: payment.recipient,
                metadata: JSON.parse(payment.metadata || '{}'),
                timestamp: Number(payment.timestamp),
                status: Object.keys(payment.status)[0]
            }));
            
        } catch (error) {
            console.error('❌ Failed to list pending payments:', error);
            return [];
        }
    }

    /**
     * Update optimization settings
     */
    async updateOptimizationSettings(settings) {
        try {
            const optimizationSettings = {
                max_cost_per_transaction: BigInt(Math.floor((settings.maxCostPerTransaction || 0.01) * 1e18)),
                preferred_chains: settings.preferredChains || ['REI'],
                reliability_threshold: settings.reliabilityThreshold || 0.95,
                auto_optimization_enabled: settings.autoOptimizationEnabled !== false,
                rebalance_frequency: BigInt(settings.rebalanceFrequency || 3600)
            };

            const result = await this.actor.update_optimization_settings(optimizationSettings);
            
            if (result.Ok) {
                console.log(`⚙️ Optimization settings updated: ${result.Ok}`);
                return result.Ok;
            } else {
                throw new Error(result.Err);
            }
            
        } catch (error) {
            console.error('❌ Failed to update optimization settings:', error);
            throw error;
        }
    }

    /**
     * Get canister IDL interface
     */
    getCanisterIDL() {
        return ({ IDL }) => {
            const PaymentStatus = IDL.Variant({
                'Pending': IDL.Null,
                'Processing': IDL.Null,
                'Completed': IDL.Null,
                'Failed': IDL.Null,
                'Cancelled': IDL.Null,
            });

            const ServiceProvider = IDL.Record({
                'id': IDL.Text,
                'name': IDL.Text,
                'api_endpoint': IDL.Text,
                'supported_chains': IDL.Vec(IDL.Text),
                'cost_per_request': IDL.Nat64,
                'reliability_score': IDL.Float64,
                'last_ping': IDL.Nat64,
                'is_active': IDL.Bool,
            });

            const PaymentRequest = IDL.Record({
                'id': IDL.Text,
                'provider_id': IDL.Text,
                'chain': IDL.Text,
                'amount': IDL.Nat64,
                'recipient': IDL.Text,
                'metadata': IDL.Text,
                'timestamp': IDL.Nat64,
                'status': PaymentStatus,
            });

            const OptimizationSettings = IDL.Record({
                'max_cost_per_transaction': IDL.Nat64,
                'preferred_chains': IDL.Vec(IDL.Text),
                'reliability_threshold': IDL.Float64,
                'auto_optimization_enabled': IDL.Bool,
                'rebalance_frequency': IDL.Nat64,
            });

            const UsageMetrics = IDL.Record({
                'total_requests': IDL.Nat64,
                'successful_payments': IDL.Nat64,
                'failed_payments': IDL.Nat64,
                'total_volume': IDL.Nat64,
                'average_response_time': IDL.Float64,
                'cost_efficiency': IDL.Float64,
            });

            const RebalancingSuggestion = IDL.Record({
                'from_chain': IDL.Text,
                'to_chain': IDL.Text,
                'reason': IDL.Text,
                'potential_savings': IDL.Float64,
            });

            return IDL.Service({
                'health_check': IDL.Func([], [IDL.Text], ['query']),
                'register_service_provider': IDL.Func([ServiceProvider], [IDL.Variant({ 'Ok': IDL.Text, 'Err': IDL.Text })], []),
                'optimize_payment_route': IDL.Func([IDL.Text, IDL.Nat64], [IDL.Opt(IDL.Text)], ['query']),
                'submit_payment': IDL.Func([PaymentRequest], [IDL.Variant({ 'Ok': IDL.Text, 'Err': IDL.Text })], []),
                'process_payment': IDL.Func([IDL.Text], [IDL.Variant({ 'Ok': IDL.Text, 'Err': IDL.Text })], []),
                'record_payment_usage': IDL.Func([IDL.Text, IDL.Text, IDL.Nat64, IDL.Bool, IDL.Float64], [IDL.Variant({ 'Ok': IDL.Text, 'Err': IDL.Text })], []),
                'get_usage_metrics': IDL.Func([IDL.Nat64], [UsageMetrics], ['query']),
                'get_rebalancing_suggestions': IDL.Func([], [IDL.Vec(RebalancingSuggestion)], ['query']),
                'list_service_providers': IDL.Func([], [IDL.Vec(ServiceProvider)], ['query']),
                'list_pending_payments': IDL.Func([], [IDL.Vec(PaymentRequest)], ['query']),
                'update_optimization_settings': IDL.Func([OptimizationSettings], [IDL.Variant({ 'Ok': IDL.Text, 'Err': IDL.Text })], []),
            });
        };
    }

    /**
     * Check connection status
     */
    isHealthy() {
        return this.isConnected;
    }

    /**
     * Disconnect from canister
     */
    async disconnect() {
        this.isConnected = false;
        this.actor = null;
        this.agent = null;
        console.log('🔌 Disconnected from ICP canister');
    }
}
