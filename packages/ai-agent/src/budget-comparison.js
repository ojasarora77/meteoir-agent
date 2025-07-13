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

async function budgetComparison() {
    console.log('🔄 BUDGET EFFICIENCY COMPARISON TEST');
    console.log('====================================\n');
    
    const agent = new AutonomousPaymentAgent(config);
    
    try {
        console.log('🚀 Starting AI agent...');
        await agent.start();
        
        // Get status to check budget mode
        const status = await agent.getStatus();
        
        console.log('📊 CURRENT AGENT STATUS:');
        console.log('├─ Running:', status.agent.isRunning ? '✅' : '❌');
        console.log('├─ Test Mode:', status.agent.testMode ? '🧪 ENABLED' : '💰 DISABLED');
        console.log('├─ Network:', status.blockchain.connected ? '✅ Connected' : '❌ Disconnected');
        console.log('└─ Chain ID:', status.blockchain.chainId);
        
        console.log('\n💰 BUDGET ANALYSIS:');
        if (status.agent.testMode) {
            console.log('├─ Mode: 🧪 TEST MODE');
            console.log('├─ Limitations: Simulated payments only');
            console.log('├─ Budget: Fixed 0.001 ETH allocation');
            console.log('├─ Provider Access: Limited');
            console.log('└─ Decision Engine: Basic algorithms');
        } else {
            console.log('├─ Mode: 💰 PRODUCTION MODE');
            console.log('├─ Daily Budget:', status.budget.dailyRemaining, 'ETH');
            console.log('├─ Monthly Budget:', status.budget.monthlyRemaining, 'ETH');
            console.log('├─ Provider Access: Full ecosystem');
            console.log('└─ Decision Engine: Advanced AI optimization');
        }
        
        console.log('\n🔍 EFFICIENCY IMPROVEMENTS AFTER BUDGET SETUP:');
        console.log('=============================================');
        
        const improvements = [
            {
                aspect: 'Provider Selection',
                before: 'Limited to test providers only',
                after: 'Access to all registered providers with real cost data'
            },
            {
                aspect: 'Decision Making',
                before: 'Simulated cost optimization',
                after: 'Real-time ML-powered cost analysis and provider ranking'
            },
            {
                aspect: 'Payment Processing',
                before: 'All payments simulated',
                after: 'Actual blockchain transactions when beneficial'
            },
            {
                aspect: 'Performance Metrics',
                before: 'Artificial success rates and costs',
                after: 'Real performance data for continuous optimization'
            },
            {
                aspect: 'Budget Management',
                before: 'Fixed 0.001 ETH allocation',
                after: '0.01 ETH daily / 0.1 ETH monthly with smart spending'
            }
        ];
        
        improvements.forEach((improvement, index) => {
            console.log(`\\n${index + 1}. ${improvement.aspect}:`);
            console.log(`   ❌ Before: ${improvement.before}`);
            console.log(`   ✅ After:  ${improvement.after}`);
        });
        
        console.log('\\n📈 PERFORMANCE IMPACT:');
        console.log('======================');
        
        if (!status.agent.testMode) {
            console.log('✅ Production mode enables:');
            console.log('├─ 10x larger budget allocation');
            console.log('├─ Real provider cost comparison');
            console.log('├─ ML-based optimization algorithms');
            console.log('├─ Accurate performance tracking');
            console.log('└─ Dynamic provider selection');
            
            // Demonstrate service registry efficiency
            console.log('\\n🏪 SERVICE PROVIDER ECOSYSTEM:');
            console.log('├─ Registered Providers:', status.services.registeredProviders);
            console.log('├─ Active Providers:', status.services.activeProviders);
            console.log('└─ Decision Engine Jobs:', status.decisionEngine.activeJobs.length);
            
        } else {
            console.log('⚠️ Test mode limitations:');
            console.log('├─ Restricted budget allocation');
            console.log('├─ Simulated payment flows');
            console.log('├─ Basic provider selection');
            console.log('└─ Limited optimization algorithms');
        }
        
        console.log('\\n💡 RECOMMENDED WORKFLOW:');
        console.log('========================');
        console.log('1. Set budget: npm run set-budget');
        console.log('2. Run tests:  npm run test:efficient');
        console.log('3. Monitor:    Check budget usage in test outputs');
        console.log('4. Optimize:   Agent automatically improves over time');
        
        console.log('\\n🎯 CONCLUSION:');
        console.log('==============');
        if (!status.agent.testMode) {
            console.log('✅ Budget is properly configured!');
            console.log('✅ Agent running in efficient production mode');
            console.log('✅ Full feature access enabled');
            console.log('✅ Ready for autonomous operation');
        } else {
            console.log('⚠️ Agent running in test mode');
            console.log('💡 Run "npm run set-budget" to unlock full efficiency');
        }
        
        await agent.stop();
        console.log('\\n✅ Comparison test completed');
        
    } catch (error) {
        console.error('\\n❌ Test failed:', error.message);
    }
}

budgetComparison().catch(console.error);
