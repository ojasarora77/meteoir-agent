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

async function quickTest() {
    console.log('🧪 Quick Test: AI Agent with Resilient Fallbacks');
    
    const agent = new AutonomousPaymentAgent(config);
    
    try {
        console.log('🚀 Starting agent...');
        await agent.start();
        console.log('✅ Agent started successfully');
        
        const status = await agent.getStatus();
        console.log('📊 Test Mode:', status.agent.testMode);
        console.log('🏥 ICP Health:', status.icp.health);
        console.log('💰 Budget remaining:', status.budget.dailyRemaining);
        
        // Test service request
        console.log('🧪 Testing service request...');
        const result = await agent.handleServiceRequest({
            id: 'test-001',
            serviceType: 'weather',
            data: { location: 'New York' },
            estimatedCost: 0.0001,
            maxCost: 0.001,
            priority: 'normal'
        });
        
        console.log('✅ Service request result:', result.success ? 'SUCCESS' : 'FAILED');
        if (result.success) {
            console.log('🎯 Provider used:', result.provider);
            console.log('💰 Cost:', result.cost);
        }
        
        console.log('🛑 Stopping agent...');
        await agent.stop();
        console.log('✅ Test completed successfully');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

quickTest().catch(console.error);
