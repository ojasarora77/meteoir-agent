import { ethers } from 'ethers';

/**
 * Payment Executor - Handles blockchain interactions and payment execution
 */
export class PaymentExecutor {
    constructor(config) {
        this.config = config;
        this.provider = null;
        this.wallet = null;
        this.contract = null;
        this.gasEstimates = new Map();
        
        console.log('💰 Payment Executor initialized');
    }

    /**
     * Initialize blockchain connection
     */
    async initialize() {
        try {
            console.log('🔗 Connecting to blockchain network...');
            
            // Create provider
            this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
            
            // Create wallet
            if (!this.config.privateKey) {
                throw new Error('Private key not provided');
            }
            
            this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
            
            // Connect to PaymentController contract
            if (!this.config.contractAddress) {
                throw new Error('Contract address not provided');
            }
            
            this.contract = new ethers.Contract(
                this.config.contractAddress,
                this.getContractABI(),
                this.wallet
            );

            // Test connection
            const network = await this.provider.getNetwork();
            
            // Test wallet balance (getBalance method is inherited from BaseWallet)
            console.log('🔍 Testing wallet balance...');
            try {
                const balance = await this.wallet.provider.getBalance(this.wallet.address);
                console.log(`✅ Connected to chain ID: ${network.chainId}`);
                console.log(`🌐 Network name: ${this.getNetworkName(network.chainId)}`);
                console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ETH`);
                console.log(`📄 Contract address: ${this.config.contractAddress}`);
            } catch (balanceError) {
                console.warn(`⚠️ Could not get balance: ${balanceError.message}`);
                console.log(`✅ Connected to chain ID: ${network.chainId}`);
                console.log(`🌐 Network name: ${this.getNetworkName(network.chainId)}`);
                console.log(`📄 Contract address: ${this.config.contractAddress}`);
            }

            // Verify contract (skip if no contract deployed)
            if (this.config.contractAddress && this.config.contractAddress !== '0x0000000000000000000000000000000000000000') {
                await this.verifyContract();
            } else {
                console.log('⚠️ No contract address provided - skipping contract verification');
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize payment executor:', error);
            throw error;
        }
    }

    /**
     * Get network name from chain ID
     */
    getNetworkName(chainId) {
        const networks = {
            1: 'Ethereum Mainnet',
            5: 'Ethereum Goerli',
            11155111: 'Ethereum Sepolia',
            8453: 'Base Mainnet',
            84532: 'Base Sepolia',
            12345: 'REI Network Testnet',
            55555: 'REI Network Mainnet'
        };
        return networks[chainId] || `Unknown Network (${chainId})`;
    }

    /**
     * Execute payment to service provider
     */
    async executePayment(providerAddress, amount, serviceType) {
        try {
            console.log(`💸 Executing payment: ${ethers.formatEther(amount)} ETH to ${providerAddress}`);
            
            // Estimate gas
            const gasEstimate = await this.contract.executePayment.estimateGas(
                providerAddress,
                amount,
                serviceType,
                { value: amount }
            );

            // Add 20% buffer to gas estimate
            const gasLimit = gasEstimate * 120n / 100n;

            // Execute transaction
            const tx = await this.contract.executePayment(
                providerAddress,
                amount,
                serviceType,
                {
                    value: amount,
                    gasLimit: gasLimit
                }
            );

            console.log(`📤 Transaction sent: ${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            
            console.log(`✅ Payment confirmed in block ${receipt.blockNumber}`);
            console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

            // Store gas estimate for future use
            this.gasEstimates.set(serviceType, gasEstimate);

            return {
                hash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed,
                effectiveGasPrice: receipt.effectiveGasPrice,
                status: receipt.status
            };

        } catch (error) {
            console.error('❌ Payment execution failed:', error);
            
            // Parse specific error types
            if (error.message.includes('Daily limit exceeded')) {
                throw new Error('DAILY_LIMIT_EXCEEDED');
            } else if (error.message.includes('Monthly limit exceeded')) {
                throw new Error('MONTHLY_LIMIT_EXCEEDED');
            } else if (error.message.includes('Insufficient payment')) {
                throw new Error('INSUFFICIENT_PAYMENT');
            } else if (error.message.includes('Provider not registered')) {
                throw new Error('PROVIDER_NOT_REGISTERED');
            }
            
            throw error;
        }
    }

    /**
     * Get current budget status
     */
    async getBudgetStatus(userAddress = null) {
        try {
            const address = userAddress || this.wallet.address;
            const budget = await this.contract.getBudgetStatus(address);
            
            return {
                dailyLimit: ethers.formatEther(budget.dailyLimit),
                monthlyLimit: ethers.formatEther(budget.monthlyLimit),
                dailySpent: ethers.formatEther(budget.dailySpent),
                monthlySpent: ethers.formatEther(budget.monthlySpent),
                dailyRemaining: ethers.formatEther(budget.dailyRemaining),
                monthlyRemaining: ethers.formatEther(budget.monthlyRemaining)
            };
            
        } catch (error) {
            console.error('❌ Failed to get budget status:', error);
            throw error;
        }
    }

    /**
     * Set budget limits
     */
    async setBudget(dailyLimit, monthlyLimit, emergencyThreshold) {
        try {
            console.log(`📊 Setting budget: Daily ${dailyLimit} ETH, Monthly ${monthlyLimit} ETH`);
            
            const dailyLimitWei = ethers.parseEther(dailyLimit.toString());
            const monthlyLimitWei = ethers.parseEther(monthlyLimit.toString());
            const emergencyThresholdWei = ethers.parseEther(emergencyThreshold.toString());

            const tx = await this.contract.setBudget(
                dailyLimitWei,
                monthlyLimitWei,
                emergencyThresholdWei
            );

            console.log(`📤 Budget transaction sent: ${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`✅ Budget set successfully in block ${receipt.blockNumber}`);

            return receipt;

        } catch (error) {
            console.error('❌ Failed to set budget:', error);
            throw error;
        }
    }

    /**
     * Register a new service provider
     */
    async registerServiceProvider(providerAddress, apiEndpoint, costPerCall) {
        try {
            console.log(`📝 Registering service provider: ${providerAddress}`);
            
            const costPerCallWei = ethers.parseEther(costPerCall.toString());
            
            const tx = await this.contract.registerServiceProvider(
                providerAddress,
                apiEndpoint,
                costPerCallWei
            );

            console.log(`📤 Registration transaction sent: ${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`✅ Provider registered successfully in block ${receipt.blockNumber}`);

            return receipt;

        } catch (error) {
            console.error('❌ Failed to register service provider:', error);
            throw error;
        }
    }

    /**
     * Get service provider details
     */
    async getServiceProvider(providerAddress) {
        try {
            const provider = await this.contract.getServiceProvider(providerAddress);
            
            return {
                apiEndpoint: provider.apiEndpoint,
                costPerCall: ethers.formatEther(provider.costPerCall),
                reputationScore: provider.reputationScore.toString(),
                isActive: provider.isActive,
                totalPayments: ethers.formatEther(provider.providerPayments)
            };
            
        } catch (error) {
            console.error('❌ Failed to get service provider:', error);
            throw error;
        }
    }

    /**
     * Get payment history
     */
    async getPaymentHistory(userAddress = null) {
        try {
            const address = userAddress || this.wallet.address;
            const paymentIds = await this.contract.getUserPaymentHistory(address);
            
            const payments = [];
            for (const paymentId of paymentIds) {
                const payment = await this.contract.paymentHistory(paymentId);
                payments.push({
                    id: paymentId.toString(),
                    provider: payment.provider,
                    amount: ethers.formatEther(payment.amount),
                    timestamp: new Date(Number(payment.timestamp) * 1000),
                    serviceType: payment.serviceType,
                    successful: payment.successful
                });
            }
            
            return payments;
            
        } catch (error) {
            console.error('❌ Failed to get payment history:', error);
            throw error;
        }
    }

    /**
     * Check if agent is authorized
     */
    async isAuthorizedAgent(agentAddress = null) {
        try {
            const address = agentAddress || this.wallet.address;
            return await this.contract.authorizedAgents(address);
        } catch (error) {
            console.error('❌ Failed to check authorization:', error);
            return false;
        }
    }

    /**
     * Get contract statistics
     */
    async getContractStatistics() {
        try {
            const totalPayments = await this.contract.totalPayments();
            const totalProviders = await this.contract.totalProviders();
            const emergencyStop = await this.contract.emergencyStop();
            const owner = await this.contract.owner();
            
            return {
                totalPayments: totalPayments.toString(),
                totalProviders: totalProviders.toString(),
                emergencyStop,
                owner,
                contractAddress: this.config.contractAddress
            };
            
        } catch (error) {
            console.error('❌ Failed to get contract statistics:', error);
            throw error;
        }
    }

    /**
     * Estimate gas for a payment
     */
    async estimatePaymentGas(providerAddress, amount, serviceType) {
        try {
            const gasEstimate = await this.contract.executePayment.estimateGas(
                providerAddress,
                amount,
                serviceType,
                { value: amount }
            );
            
            return {
                gasEstimate: gasEstimate.toString(),
                gasPrice: await this.provider.getGasPrice(),
                estimatedCost: ethers.formatEther(gasEstimate * await this.provider.getGasPrice())
            };
            
        } catch (error) {
            console.error('❌ Failed to estimate gas:', error);
            throw error;
        }
    }

    /**
     * Verify contract deployment and functionality
     */
    async verifyContract() {
        try {
            // Test basic contract functions
            const owner = await this.contract.owner();
            const emergencyStop = await this.contract.emergencyStop();
            
            console.log(`👑 Contract owner: ${owner}`);
            console.log(`🛡️ Emergency stop: ${emergencyStop}`);
            
            // Check if wallet is authorized
            const isAuthorized = await this.isAuthorizedAgent();
            console.log(`🔑 Wallet authorized: ${isAuthorized}`);
            
            if (!isAuthorized) {
                console.warn('⚠️ Warning: Wallet is not authorized as an agent');
            }
            
        } catch (error) {
            console.error('❌ Contract verification failed:', error);
            throw error;
        }
    }

    /**
     * Monitor blockchain events
     */
    async startEventMonitoring() {
        console.log('👂 Starting event monitoring...');
        
        // Listen for PaymentExecuted events
        this.contract.on('PaymentExecuted', (agent, provider, amount, serviceType, timestamp, event) => {
            console.log(`💰 Payment Event: ${ethers.formatEther(amount)} ETH to ${provider} for ${serviceType}`);
        });

        // Listen for BudgetUpdated events
        this.contract.on('BudgetUpdated', (user, dailyLimit, monthlyLimit, event) => {
            console.log(`📊 Budget Updated: Daily ${ethers.formatEther(dailyLimit)} ETH, Monthly ${ethers.formatEther(monthlyLimit)} ETH`);
        });

        // Listen for ServiceProviderRegistered events
        this.contract.on('ServiceProviderRegistered', (provider, apiEndpoint, costPerCall, event) => {
            console.log(`📝 Provider Registered: ${provider} at ${apiEndpoint}`);
        });
    }

    /**
     * Stop event monitoring
     */
    stopEventMonitoring() {
        if (this.contract) {
            this.contract.removeAllListeners();
            console.log('🛑 Event monitoring stopped');
        }
    }

    /**
     * Get PaymentController contract ABI
     */
    getContractABI() {
        return [
            "function executePayment(address provider, uint256 amount, string memory serviceType) external payable",
            "function setBudget(uint256 dailyLimit, uint256 monthlyLimit, uint256 emergencyThreshold) external",
            "function registerServiceProvider(address provider, string memory apiEndpoint, uint256 costPerCall) external",
            "function getBudgetStatus(address user) external view returns (uint256 dailyLimit, uint256 monthlyLimit, uint256 dailySpent, uint256 monthlySpent, uint256 dailyRemaining, uint256 monthlyRemaining)",
            "function getServiceProvider(address provider) external view returns (string memory apiEndpoint, uint256 costPerCall, uint256 reputationScore, bool isActive, uint256 providerPayments)",
            "function getUserPaymentHistory(address user) external view returns (uint256[] memory)",
            "function paymentHistory(uint256 index) external view returns (address provider, uint256 amount, uint256 timestamp, string memory serviceType, bool successful)",
            "function authorizedAgents(address agent) external view returns (bool)",
            "function totalPayments() external view returns (uint256)",
            "function totalProviders() external view returns (uint256)",
            "function emergencyStop() external view returns (bool)",
            "function owner() external view returns (address)",
            "event PaymentExecuted(address indexed agent, address indexed provider, uint256 amount, string serviceType, uint256 timestamp)",
            "event BudgetUpdated(address indexed user, uint256 dailyLimit, uint256 monthlyLimit)",
            "event ServiceProviderRegistered(address indexed provider, string apiEndpoint, uint256 costPerCall)"
        ];
    }

    /**
     * Get wallet and network information
     */
    getWalletInfo() {
        return {
            address: this.wallet?.address,
            network: this.provider?.network,
            contractAddress: this.config.contractAddress,
            rpcUrl: this.config.rpcUrl
        };
    }

    /**
     * Emergency stop check
     */
    async checkEmergencyStop() {
        try {
            const emergencyStop = await this.contract.emergencyStop();
            if (emergencyStop) {
                throw new Error('EMERGENCY_STOP_ACTIVE');
            }
            return false;
        } catch (error) {
            if (error.message === 'EMERGENCY_STOP_ACTIVE') {
                throw error;
            }
            console.error('❌ Failed to check emergency stop:', error);
            return true; // Assume emergency stop if can't check
        }
    }
}
