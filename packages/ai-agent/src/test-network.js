import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Test network connectivity for different blockchain networks
 */
async function testNetworkConnectivity() {
    console.log('🌐 Testing Network Connectivity...\n');

    const networks = [
        {
            name: 'Base Sepolia',
            rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
            chainId: 84532
        },
        {
            name: 'Base Sepolia (Alt 1)',
            rpcUrl: 'https://base-sepolia.blockpi.network/v1/rpc/public',
            chainId: 84532
        },
        {
            name: 'Base Sepolia (Alt 2)',
            rpcUrl: 'https://base-sepolia-rpc.publicnode.com',
            chainId: 84532
        },
        {
            name: 'REI Testnet',
            rpcUrl: process.env.REI_TESTNET_RPC_URL || 'https://rpc-testnet.rei.network',
            chainId: 12345
        }
    ];

    for (const network of networks) {
        try {
            console.log(`🔗 Testing ${network.name}...`);
            console.log(`   RPC: ${network.rpcUrl}`);
            
            const provider = new ethers.JsonRpcProvider(network.rpcUrl);
            
            // Test basic connectivity
            const startTime = Date.now();
            const netInfo = await provider.getNetwork();
            const blockNumber = await provider.getBlockNumber();
            const responseTime = Date.now() - startTime;
            
            console.log(`   ✅ Chain ID: ${netInfo.chainId.toString()}`);
            console.log(`   ✅ Latest block: ${blockNumber}`);
            console.log(`   ✅ Response time: ${responseTime}ms`);
            
            // Test wallet if private key is provided
            if (process.env.PRIVATE_KEY) {
                try {
                    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
                    const balance = await wallet.getBalance();
                    console.log(`   💰 Wallet balance: ${ethers.formatEther(balance)} ETH`);
                } catch (walletError) {
                    console.log(`   ⚠️ Wallet test failed: ${walletError.message}`);
                }
            }
            
            console.log(`   🎯 Status: HEALTHY\\n`);
            
        } catch (error) {
            console.log(`   ❌ Status: FAILED`);
            console.log(`   ❌ Error: ${error.message}\\n`);
        }
    }

    // Test ICP connectivity
    console.log('🔗 Testing ICP Canister connectivity...');
    try {
        const response = await fetch('https://ic0.app/api/v2/canister/by4bj-cqaaa-aaaaf-qapnq-cai/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/cbor',
            },
            // Simple ping test
        });
        
        if (response.ok) {
            console.log('   ✅ ICP Canister reachable');
        } else {
            console.log(`   ⚠️ ICP Canister response: ${response.status}`);
        }
    } catch (error) {
        console.log(`   ❌ ICP Canister unreachable: ${error.message}`);
    }

    console.log('\\n🎯 Network connectivity test completed!');
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
    testNetworkConnectivity().catch(console.error);
}

export { testNetworkConnectivity };
