# AI Agent Integration Example

This file demonstrates how to integrate the Node.js AI agent with the ICP canister.

```javascript
// packages/ai-agent/src/icp-integration.js
const { Actor, HttpAgent } = require('@dfinity/agent');
const { idlFactory } = require('./agentic_stablecoin.did.js');

class ICPCanisterClient {
  constructor(canisterId, options = {}) {
    this.canisterId = canisterId;
    this.agent = new HttpAgent({
      host: 'https://ic0.app',
      ...options.agentOptions,
    });
    
    this.actor = Actor.createActor(idlFactory, {
      agent: this.agent,
      canisterId: this.canisterId,
    });
  }

  async optimizePaymentRoute(chain, amount) {
    try {
      const result = await this.actor.optimize_payment_route(chain, amount);
      return result[0]; // Optional unwrapping
    } catch (error) {
      console.error('Failed to optimize payment route:', error);
      throw error;
    }
  }

  async submitPayment(paymentRequest) {
    try {
      const result = await this.actor.submit_payment(paymentRequest);
      return result;
    } catch (error) {
      console.error('Failed to submit payment:', error);
      throw error;
    }
  }

  async getUsageMetrics(timeWindow = 3600) {
    try {
      const metrics = await this.actor.get_usage_metrics(timeWindow);
      return metrics;
    } catch (error) {
      console.error('Failed to get usage metrics:', error);
      throw error;
    }
  }

  async recordUsage(chain, providerId, cost, success, responseTime) {
    try {
      await this.actor.record_payment_usage(chain, providerId, cost, success, responseTime);
    } catch (error) {
      console.error('Failed to record usage:', error);
      throw error;
    }
  }
}

module.exports = { ICPCanisterClient };
```

Update your main AI agent orchestrator to use this:

```javascript
// packages/ai-agent/src/index.js
const { ICPCanisterClient } = require('./icp-integration');

class AgenticStablecoinOrchestrator {
  constructor() {
    // ... existing code ...
    this.icpClient = new ICPCanisterClient(process.env.ICP_CANISTER_ID);
  }

  async optimizeAndExecutePayment(paymentData) {
    try {
      // 1. Get optimal provider from ICP canister
      const optimalProvider = await this.icpClient.optimizePaymentRoute(
        paymentData.chain, 
        paymentData.amount
      );

      if (!optimalProvider) {
        throw new Error('No suitable payment provider found');
      }

      // 2. Execute payment using optimal provider
      const startTime = Date.now();
      const result = await this.paymentExecutor.executePayment(
        paymentData, 
        optimalProvider
      );
      const responseTime = Date.now() - startTime;

      // 3. Record usage metrics in ICP canister
      await this.icpClient.recordUsage(
        paymentData.chain,
        optimalProvider,
        paymentData.amount,
        result.success,
        responseTime
      );

      return result;
    } catch (error) {
      console.error('Payment optimization and execution failed:', error);
      throw error;
    }
  }
}
```
