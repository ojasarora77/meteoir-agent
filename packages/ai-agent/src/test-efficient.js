import { AutonomousPaymentAgent } from './index.js';
import dotenv from 'dotenv';

dotenv.config();

const config = {
    reiNetwork: {
        rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
        privateKey: process.env.PRIVATE_KEY,
        contractAddress: process.env.PAYMENT_CONTROLLER_ADDRESS
    },
    icpCanisterId: 'by4bj-cqaaa-aaaaf-qapnq-cai'
};

async function efficientTest() {
    console.log('🚀 Efficient AI Agent Test with Proper Budget');
    console.log('=============================================\n');
    
    const agent = new AutonomousPaymentAgent(config);
    
    try {
        console.log('🔧 Starting agent...');
        await agent.start();
        console.log('✅ Agent started successfully\n');
        
        // Get comprehensive status
        const status = await agent.getStatus();
        
        console.log('📊 AGENT STATUS:');
        console.log('├─ Running:', status.agent.isRunning ? '✅' : '❌');
        console.log('├─ Test Mode:', status.agent.testMode ? '🧪 ENABLED' : '💰 DISABLED');
        console.log('├─ Uptime:', Math.round(status.agent.uptime / 1000), 'seconds');
        console.log('└─ Network:', status.blockchain.connected ? '✅ Connected' : '❌ Disconnected');
        
        console.log('\n💰 BUDGET STATUS:');
        if (status.budget.isTestMode) {
            console.log('├─ Mode: 🧪 TEST MODE (Simulated payments)');
            console.log('├─ Daily: 0.001 ETH (test allocation)');
            console.log('└─ Monthly: 0.001 ETH (test allocation)');
        } else {
            console.log('├─ Daily Available:', status.budget.dailyRemaining, 'ETH');
            console.log('├─ Monthly Available:', status.budget.monthlyRemaining, 'ETH');
            console.log('├─ Daily Spent:', status.budget.dailySpent || '0.0', 'ETH');
            console.log('└─ Monthly Spent:', status.budget.monthlySpent || '0.0', 'ETH');
        }
        
        console.log('\n🏥 ICP INTEGRATION:');
        console.log('├─ Health:', status.icp.health === 'Healthy' ? '✅ Healthy' : '⚠️ Unhealthy');
        console.log('├─ Connected:', status.icp.connected ? '✅' : '❌');
        console.log('├─ Canister ID:', status.icp.canisterId);
        console.log('└─ Local Queue:', status.icp.localQueueSize || 0, 'pending records');
        
        console.log('\n🧠 DECISION ENGINE:');
        console.log('├─ Status:', status.decisionEngine.isRunning ? '✅ Running' : '❌ Stopped');
        console.log('├─ Active Jobs:', status.decisionEngine.activeJobs.length);
        console.log('├─ Decisions/Hour:', status.decisionEngine.performance.decisionsPerHour);
        console.log('└─ Cost Savings:', status.decisionEngine.performance.costSavings, 'ETH');
        
        console.log('\n🏪 SERVICE PROVIDERS:');
        console.log('├─ Registered:', status.services.registeredProviders);
        console.log('└─ Active:', status.services.activeProviders);
        
        // Test multiple service requests efficiently
        console.log('\n🧪 TESTING SERVICE REQUESTS:');
        console.log('=====================================');
        
        const testRequests = [
            {
                name: 'Weather Service',
                request: {
                    id: 'test-weather-001',
                    serviceType: 'weather',
                    data: { location: 'New York', fields: ['temperature'] },
                    estimatedCost: 0.0001,
                    maxCost: 0.001,
                    priority: 'normal'
                }
            },
            {
                name: 'Price Data Service',
                request: {
                    id: 'test-price-001',
                    serviceType: 'price-data',
                    data: { coin: 'ethereum', currency: 'usd' },
                    estimatedCost: 0.00005,
                    maxCost: 0.001,
                    priority: 'high'
                }
            }
        ];
        
        const results = [];
        
        for (const test of testRequests) {
            console.log(`\n🔍 Testing: ${test.name}`);
            console.log('─'.repeat(30));
            
            const startTime = Date.now();
            
            try {
                const result = await agent.handleServiceRequest(test.request);
                const duration = Date.now() - startTime;
                
                console.log(`├─ Result: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
                console.log(`├─ Duration: ${duration}ms`);
                
                if (result.success) {
                    console.log(`├─ Provider: ${result.provider || 'Unknown'}`);
                    console.log(`├─ Cost: ${result.cost || 'N/A'} ETH`);
                    console.log(`├─ Payment: ${result.paymentTx?.simulated ? '🧪 Simulated' : '💰 Real'}`);
                    console.log(`└─ Response Time: ${result.responseTime || 'N/A'}ms`);
                } else {
                    console.log(`└─ Error: ${result.error || 'Unknown error'}`);
                }
                
                results.push({
                    name: test.name,
                    success: result.success,
                    duration,
                    cost: result.cost || 0,
                    provider: result.provider
                });
                
            } catch (error) {
                console.log(`├─ Result: ❌ EXCEPTION`);
                console.log(`└─ Error: ${error.message}`);
                
                results.push({
                    name: test.name,
                    success: false,
                    duration: Date.now() - startTime,
                    error: error.message
                });
            }
        }
        
        // Summary Report
        console.log('\n📊 TEST SUMMARY REPORT:');
        console.log('========================');
        
        const successful = results.filter(r => r.success).length;
        const total = results.length;
        const successRate = ((successful / total) * 100).toFixed(1);
        const avgDuration = Math.round(results.reduce((sum, r) => sum + r.duration, 0) / total);
        const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);
        
        console.log(`├─ Success Rate: ${successRate}% (${successful}/${total})`);
        console.log(`├─ Average Duration: ${avgDuration}ms`);
        console.log(`├─ Total Cost: ${totalCost} ETH`);
        console.log(`└─ Agent Mode: ${status.agent.testMode ? 'Test Mode' : 'Production Mode'}`);
        
        // Test decision engine statistics
        console.log('\n🧮 DECISION ENGINE STATS:');
        const stats = agent.getStatistics();
        console.log('├─ Total Decisions:', stats.totalDecisions);
        console.log('├─ Success Rate:', (stats.successRate * 100).toFixed(1) + '%');
        console.log('├─ Average Cost:', stats.averageCost, 'ETH');
        console.log('└─ Provider Distribution:', Object.keys(stats.providerDistribution).length, 'providers used');
        
        // Final status after testing
        console.log('\n🔄 FINAL STATUS CHECK:');
        const finalStatus = await agent.getStatus();
        const finalBudget = finalStatus.budget;
        
        if (!finalStatus.agent.testMode) {
            console.log('├─ Daily Remaining:', finalBudget.dailyRemaining, 'ETH');
            console.log('├─ Daily Spent:', finalBudget.dailySpent, 'ETH');
            console.log('└─ Budget Efficiency:', ((parseFloat(finalBudget.dailySpent) / parseFloat(finalBudget.dailyLimit)) * 100).toFixed(2) + '%');
        } else {
            console.log('└─ Test mode: All payments simulated');
        }
        
        console.log('\n🛑 Stopping agent...');
        await agent.stop();
        console.log('✅ Agent stopped gracefully');
        
        console.log('\n🎉 EFFICIENT TEST COMPLETED SUCCESSFULLY!');
        console.log(`⚡ Total test time: ${Math.round((Date.now() - global.testStartTime) / 1000)}s`);
        
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Track total test time
global.testStartTime = Date.now();

efficientTest().catch(console.error);
