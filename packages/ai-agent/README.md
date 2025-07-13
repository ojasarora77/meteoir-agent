# Autonomous AI Payment Agent

🤖 **Intelligent AI agent for autonomous stablecoin payments with ICP integration**

## 🧠 Features

### ✅ **Implemented Components:**

1. **🔗 ICP Canister Integration**
   - Real-time connection to deployed canister: `by4bj-cqaaa-aaaaf-qapnq-cai`
   - Automatic optimization sync with ICP brain
   - Cross-chain payment routing decisions

2. **🤖 Autonomous Decision Engine**
   - Continuous cost optimization (every 30 seconds)
   - Rebalancing analysis (every 5 minutes)
   - Health monitoring (every minute)
   - Emergency budget management

3. **💰 Payment Execution**
   - REI Network blockchain integration
   - Smart contract interactions
   - Gas optimization and estimation

4. **📊 AI Models**
   - Cost optimization algorithms
   - Usage prediction models
   - Performance monitoring

5. **🏪 Service Registry**
   - Dynamic provider discovery
   - Provider performance tracking
   - Multi-chain service support

## 🚀 Quick Start

### Prerequisites

1. **Install dependencies:**
   ```bash
   cd packages/ai-agent
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Required environment variables:**
   ```bash
   # Recommended: Base Sepolia (for stability)
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   
   # Alternative: REI Network
   REI_TESTNET_RPC_URL=https://rpc-testnet.rei.network
   
   PRIVATE_KEY=your_private_key_here
   PAYMENT_CONTROLLER_ADDRESS=your_deployed_contract_address
   ICP_CANISTER_ID=by4bj-cqaaa-aaaaf-qapnq-cai
   ```

### Running the Agent

1. **Start the agent:**
   ```bash
   npm start
   ```

2. **Development mode (with auto-reload):**
   ```bash
   npm run dev
   ```

3. **Test integration:**
   ```bash
   npm run test:integration
   ```

## 🎯 How It Works

### Autonomous Operation Flow

1. **🚀 Initialization**
   - Connects to REI Network blockchain
   - Establishes ICP canister connection
   - Starts autonomous decision engine

2. **🔄 Continuous Optimization**
   - **Every 30 seconds**: Cost optimization analysis
   - **Every 5 minutes**: Rebalancing opportunities
   - **Every minute**: Health checks and budget monitoring

3. **💡 Decision Making**
   - Receives service requests
   - Consults ICP canister for optimal routing
   - Executes payments via smart contracts
   - Records performance data for learning

4. **📊 Performance Tracking**
   - Real-time metrics collection
   - AI model updates based on outcomes
   - Continuous improvement of decisions

### Example Service Request

```javascript
import { AutonomousPaymentAgent } from './src/index.js';

const agent = new AutonomousPaymentAgent(config);
await agent.start();

// Request a service
const result = await agent.handleServiceRequest({
    id: 'weather-001',
    serviceType: 'weather',
    data: { location: 'New York' },
    estimatedCost: 0.0001,
    maxCost: 0.001,
    priority: 'normal'
});

console.log('Service result:', result);
```

## 🔧 Configuration

### Decision Engine Settings

```javascript
const config = {
    decisionEngine: {
        optimizationInterval: '*/30 * * * * *', // Every 30 seconds
        rebalanceInterval: '0 */5 * * * *',     // Every 5 minutes
        healthCheckInterval: '0 * * * * *',     // Every minute
        maxCostPerTransaction: 0.01,            // 0.01 ETH max
        reliabilityThreshold: 0.95,             // 95% minimum
        emergencyThreshold: 0.005               // 0.005 ETH emergency
    }
};
```

### ICP Integration

```javascript
const config = {
    icpCanisterId: 'by4bj-cqaaa-aaaaf-qapnq-cai',
    reiNetwork: {
        rpcUrl: 'https://sepolia.base.org', // Base Sepolia
        privateKey: 'your_private_key',
        contractAddress: 'your_contract_address'
    }
};
```

## 📊 Monitoring & Analytics

### Agent Status

```javascript
const status = await agent.getStatus();
console.log(status);
```

**Returns:**
```json
{
    \"agent\": {
        \"isRunning\": true,
        \"uptime\": 150000
    },
    \"blockchain\": {
        \"connected\": true,
        \"walletAddress\": \"0x...\",
        \"network\": \"base-sepolia\"
    },
    \"icp\": {
        \"connected\": true,
        \"canisterId\": \"by4bj-cqaaa-aaaaf-qapnq-cai\",
        \"health\": \"Healthy\"
    },
    \"decisionEngine\": {
        \"isRunning\": true,
        \"activeJobs\": [\"optimization\", \"rebalancing\", \"health\"],
        \"performance\": {
            \"decisionsPerHour\": 12,
            \"successfulOptimizations\": 8,
            \"costSavings\": 0.0045
        }
    }
}
```

### Decision History

```javascript
const stats = agent.getStatistics();
console.log('Success rate:', stats.successRate);
console.log('Average cost:', stats.averageCost);
console.log('Provider distribution:', stats.providerDistribution);
```

## 🧪 Testing

### Integration Test

```bash
npm run test:integration
```

**Test scenarios:**
- ✅ Agent initialization
- ✅ ICP canister connection
- ✅ Decision engine functionality
- ✅ Service request handling
- ✅ Autonomous optimization loops

### Manual Testing

```javascript
// Test ICP connection
const health = await agent.icpClient.healthCheck();
console.log('ICP Health:', health);

// Test decision making
const decision = await agent.decisionEngine.makeImmediateDecision({
    serviceType: 'weather',
    chain: 'REI',
    estimatedCost: 0.0001
});
console.log('AI Decision:', decision);
```

## 🔍 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Autonomous AI Agent                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ Decision Engine │────│  ICP Canister   │                │
│  │                 │    │  Integration    │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ Cost Optimizer  │    │ Service Registry│                │
│  │                 │    │                 │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │Payment Executor │    │Performance Monitor               │
│  │                 │    │                 │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    REI Network                              │
│                  Smart Contracts                           │
└─────────────────────────────────────────────────────────────┘
```

## 🆘 Troubleshooting

### 🛡️ Resilient Operation

The agent is designed to handle failures gracefully:

- **ICP Canister Offline**: Agent runs in degraded mode, storing data locally for later sync
- **Zero Budget**: Automatically enables TEST MODE for demonstration purposes  
- **Network Issues**: Continues operation with fallback error handling
- **Contract Failures**: Logs errors but doesn't crash the agent

### Common Issues

1. **ICP Connection Failed**
   ```bash
   # Check canister health
   dfx canister --network ic call by4bj-cqaaa-aaaaf-qapnq-cai health_check
   ```
   **Solution**: Agent automatically switches to degraded mode and continues operating

2. **Blockchain Connection Issues**
   ```bash
   # Verify RPC URL and private key (Base Sepolia)
   curl -X POST https://sepolia.base.org \\
     -H "Content-Type: application/json" \\
     -d '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}'
   ```

3. **Budget Constraints / Zero Budget**
   ```javascript
   // Check budget status
   const budget = await agent.paymentExecutor.getBudgetStatus();
   console.log('Daily remaining:', budget.dailyRemaining);
   ```
   **Solution**: Agent automatically enables TEST MODE when budget is zero

4. **Service Request Failures**
   ```bash
   # Check agent status for detailed information
   const status = await agent.getStatus();
   console.log('Test Mode:', status.agent.testMode);
   console.log('ICP Health:', status.icp.health);
   ```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm start
```

## 🔗 Integration

### Frontend Integration

```typescript
// Connect to running agent
const agent = new AutonomousPaymentAgent(config);
await agent.start();

// Monitor agent status
setInterval(async () => {
    const status = await agent.getStatus();
    updateUI(status);
}, 5000);
```

### API Endpoints (Future)

```bash
# Health check
GET /api/health

# Agent status
GET /api/status

# Submit service request
POST /api/service-request

# Get statistics
GET /api/statistics
```

## 📚 API Reference

### Main Classes

- **`AutonomousPaymentAgent`** - Main orchestrator
- **`AutonomousDecisionEngine`** - AI decision making
- **`ICPCanisterClient`** - ICP integration
- **`PaymentExecutor`** - Blockchain interactions
- **`CostOptimizer`** - Cost optimization algorithms
- **`ServiceRegistry`** - Provider management

### Key Methods

- `agent.start()` - Start autonomous operation
- `agent.stop()` - Stop agent
- `agent.handleServiceRequest(request)` - Process service request
- `agent.getStatus()` - Get comprehensive status
- `agent.getStatistics()` - Get performance metrics

## 🚀 Future Enhancements

- [ ] REST API server for remote control
- [ ] WebSocket real-time updates
- [ ] Machine learning model improvements
- [ ] Multi-chain bridge integration
- [ ] Advanced failure recovery mechanisms
- [ ] Predictive cost modeling

## 📄 License

MIT License - see LICENSE file for details.

---

**🤖 Ready to revolutionize autonomous payments with AI and ICP! 🚀**
