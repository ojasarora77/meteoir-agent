import { AutonomousPaymentAgent } from './index.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Test the AI Agent with ICP Integration
 */
async function testAgentIntegration() {
    console.log('🧪 Testing AI Agent with ICP Integration...\n');

    // Configuration
    const config = {
        reiNetwork: {
            rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
            privateKey: process.env.PRIVATE_KEY,
            contractAddress: process.env.PAYMENT_CONTROLLER_ADDRESS
        },
        icpCanisterId: 'by4bj-cqaaa-aaaaf-qapnq-cai',
        decisionEngine: {
            optimizationInterval: '*/10 * * * * *', // Every 10 seconds for testing
            maxCostPerTransaction: 0.001,
            reliabilityThreshold: 0.9
        }
    };

    if (!config.reiNetwork.privateKey) {
        console.error('❌ Private key not provided. Please set PRIVATE_KEY environment variable.');
        console.log('💡 For testing, you can use: PRIVATE_KEY=0x1234567890123456789012345678901234567890123456789012345678901234');
        process.exit(1);
    }

    // Contract address is optional for testing
    if (!config.reiNetwork.contractAddress) {
        console.log('⚠️ No contract address provided - using dummy address for testing');
        config.reiNetwork.contractAddress = '0x0000000000000000000000000000000000000000';
    }

    try {
        // Initialize agent
        const agent = new AutonomousPaymentAgent(config);

        // Start the agent
        console.log('🚀 Starting agent...');
        await agent.start();

        // Wait a bit for initialization
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Test 1: Check agent status
        console.log('\n📊 Testing agent status...');
        const status = await agent.getStatus();
        console.log('Agent Status:', JSON.stringify(status, null, 2));

        // Test 2: Test service request
        console.log('\n🔍 Testing service request...');
        const testRequest = {
            id: 'test-001',
            serviceType: 'weather',
            data: {
                location: 'New York',
                type: 'current'
            },
            estimatedCost: 0.0001,
            maxCost: 0.001,
            priority: 'normal'
        };

        try {
            const result = await agent.handleServiceRequest(testRequest);
            console.log('✅ Service request successful:', result);
        } catch (error) {
            console.log('⚠️ Service request failed (expected if no providers configured):', error.message);
        }

        // Test 3: Check decision engine status
        console.log('\n🧠 Testing decision engine...');
        const decisionStatus = agent.decisionEngine.getStatus();
        console.log('Decision Engine Status:', JSON.stringify(decisionStatus, null, 2));

        // Test 4: Test ICP connection
        console.log('\n🔗 Testing ICP connection...');
        const icpHealth = await agent.icpClient.healthCheck();
        console.log('ICP Health:', icpHealth);

        const icpMetrics = await agent.icpClient.getUsageMetrics(3600);
        console.log('ICP Metrics:', icpMetrics);

        // Test 5: Get agent statistics
        console.log('\n📈 Agent statistics...');
        const stats = agent.getStatistics();
        console.log('Statistics:', JSON.stringify(stats, null, 2));

        // Let it run for a bit to see autonomous behavior
        console.log('\n⏱️ Letting agent run autonomously for 30 seconds...');
        await new Promise(resolve => setTimeout(resolve, 30000));

        // Final status check
        console.log('\n📊 Final status check...');
        const finalStatus = await agent.getStatus();
        console.log('Final Status:', JSON.stringify(finalStatus, null, 2));

        // Stop the agent
        console.log('\n🛑 Stopping agent...');
        await agent.stop();

        console.log('\n✅ Test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
    testAgentIntegration().catch(console.error);
}

export { testAgentIntegration };
