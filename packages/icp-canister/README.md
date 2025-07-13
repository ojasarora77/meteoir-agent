# Agentic Stablecoin ICP Canister

🚀 **DEPLOYED LIVE ON INTERNET COMPUTER!**

- **Canister ID**: `by4bj-cqaaa-aaaaf-qapnq-cai`
- **Live Interface**: [https://a4gq6-oaaaa-aaaab-qaa4q-cai.icp0.io/?id=by4bj-cqaaa-aaaaf-qapnq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.icp0.io/?id=by4bj-cqaaa-aaaaf-qapnq-cai)
- **IC Dashboard**: [https://dashboard.internetcomputer.org/canister/by4bj-cqaaa-aaaaf-qapnq-cai](https://dashboard.internetcomputer.org/canister/by4bj-cqaaa-aaaaf-qapnq-cai)
- **Network**: Internet Computer Mainnet
- **Status**: ✅ Active and ready for integration

This ICP canister serves as the **AI brain** for autonomous payment optimization, service provider management, and cross-chain payment execution.

## 🧠 Contract Functionality

### Core Features

#### 1. **Service Provider Registry**
- **Register Providers**: Add payment service providers with cost, reliability, and blockchain support data
- **Provider Discovery**: AI-powered selection of optimal providers based on cost, reliability, and performance
- **Dynamic Management**: Activate/deactivate providers and track performance metrics

#### 2. **AI-Powered Cost Optimization**
- **Route Optimization**: Automatically selects the best payment provider for each transaction
- **Cost Analysis**: Real-time cost comparison across multiple providers and chains
- **Learning Algorithm**: Continuously improves recommendations based on historical performance
- **Rebalancing Suggestions**: Recommends chain switches when better options are available

#### 3. **Autonomous Payment Processing**
- **Payment Lifecycle**: Submit → Process → Track → Complete payment flows
- **Auto-Retry Logic**: Intelligent retry mechanism for failed payments
- **Status Tracking**: Real-time payment status monitoring
- **Background Processing**: Automatic payment processing every 60 seconds

#### 4. **Cross-Chain Support**
- **Multi-Chain**: Supports REI Network, Polygon, Ethereum, and custom chains
- **Chain Optimization**: Selects optimal blockchain based on cost and speed
- **Bridge Integration**: Seamless cross-chain payment execution

#### 5. **Usage Analytics & Monitoring**
- **Performance Metrics**: Track success rates, costs, and response times
- **Usage Prediction**: AI models predict future usage patterns
- **Cost Efficiency**: Calculate and optimize cost per successful transaction
- **Historical Analysis**: Comprehensive transaction history and analytics

#### 6. **Security & Access Control**
- **Principal-Based Auth**: Secure access control using Internet Computer principals
- **Authorization Levels**: Owner, user, and emergency contact permissions
- **Health Monitoring**: Real-time system health checks and status reports

## 🚀 Quick Start with Live Canister

### Instant Integration
```javascript
// Use directly in your frontend
const CANISTER_ID = 'by4bj-cqaaa-aaaaf-qapnq-cai';
const IC_HOST = 'https://ic0.app';
```

### Test the Live Deployment

```bash
# Health check
dfx canister --network ic call by4bj-cqaaa-aaaaf-qapnq-cai health_check

# Register a test provider
dfx canister --network ic call by4bj-cqaaa-aaaaf-qapnq-cai register_service_provider '(
  record {
    id = "rei-mainnet";
    name = "REI Network Provider";
    api_endpoint = "https://rpc-mainnet.rei.network";
    supported_chains = vec {"REI"};
    cost_per_request = 500;
    reliability_score = 0.98;
    last_ping = 0;
    is_active = true;
  }
)'

# List providers
dfx canister --network ic call by4bj-cqaaa-aaaaf-qapnq-cai list_service_providers

# Optimize payment route
dfx canister --network ic call by4bj-cqaaa-aaaaf-qapnq-cai optimize_payment_route '("REI", 1000000)'
```

### Prerequisites

1. **Install Rust and Cargo**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-unknown-unknown
   ```

2. **Install DFINITY SDK**:
   ```bash
   DFX_VERSION=0.15.0 sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
   ```

### Local Development

1. **Build and Deploy Locally**:
   ```bash
   ./deploy.sh local
   ```

2. **Test the Canister**:
   ```bash
   # Health check
   dfx canister call agentic_stablecoin health_check
   
   # Register a test provider
   dfx canister call agentic_stablecoin register_service_provider '(
     record {
       id = "rei-mainnet";
       name = "REI Network Provider";
       api_endpoint = "https://rpc-mainnet.rei.network";
       supported_chains = vec {"REI"};
       cost_per_request = 500;
       reliability_score = 0.98;
       last_ping = 0;
       is_active = true;
     }
   )'
   
   # List providers
   dfx canister call agentic_stablecoin list_service_providers
   
   # Optimize payment route
   dfx canister call agentic_stablecoin optimize_payment_route '("REI", 1000000)'
   ```

### IC Mainnet Deployment

1. **Deploy to IC**:
   ```bash
   ./deploy.sh ic
   ```

2. **Configure Authorization**:
   ```bash
   dfx canister --network ic call agentic_stablecoin add_authorized_principal '(principal "YOUR_PRINCIPAL_HERE")'
   ```

## 🎯 ICP Ninja Deployment

For deploying via ICP Ninja, follow the detailed guide: [`docs/icp-ninja-deployment.md`](../../docs/icp-ninja-deployment.md)

## 📚 API Reference

### Service Management
- `register_service_provider(provider: ServiceProvider)` - Register a new payment service provider
- `list_service_providers()` - Get all registered providers
- `deactivate_service_provider(id: String)` - Deactivate a provider

### Payment Processing
- `submit_payment(payment: PaymentRequest)` - Submit a payment for processing
- `process_payment(id: String)` - Process a pending payment
- `get_payment_status(id: String)` - Check payment status
- `cancel_payment(id: String)` - Cancel a pending payment

### Cost Optimization
- `optimize_payment_route(chain: String, amount: u64)` - Get optimal provider for payment
- `get_rebalancing_suggestions()` - Get suggestions for chain rebalancing
- `record_payment_usage(...)` - Record usage metrics for learning
- `get_usage_metrics(timeWindow: u64)` - Get performance analytics

### Configuration
- `update_optimization_settings(settings: OptimizationSettings)` - Update AI optimization parameters
- `add_authorized_principal(principal: Principal)` - Authorize new users
- `health_check()` - System health status

## 🧪 Testing Examples

### Register Multiple Providers
```bash
# REI Network
dfx canister call agentic_stablecoin register_service_provider '(
  record {
    id = "rei-provider";
    name = "REI Network Provider";
    api_endpoint = "https://rpc-mainnet.rei.network";
    supported_chains = vec {"REI"};
    cost_per_request = 500;
    reliability_score = 0.98;
    last_ping = 0;
    is_active = true;
  }
)'

# Polygon
dfx canister call agentic_stablecoin register_service_provider '(
  record {
    id = "polygon-provider";
    name = "Polygon Provider";
    api_endpoint = "https://polygon-rpc.com";
    supported_chains = vec {"Polygon"};
    cost_per_request = 800;
    reliability_score = 0.95;
    last_ping = 0;
    is_active = true;
  }
)'
```

### Submit and Process Payment
```bash
# Submit payment
dfx canister call agentic_stablecoin submit_payment '(
  record {
    id = "payment-001";
    provider_id = "rei-provider";
    chain = "REI";
    amount = 1000000;
    recipient = "0x742d35Cc6635C0532925a3b8D356E4F23f8b8e8e";
    metadata = "Test payment";
    timestamp = 0;
    status = variant { Pending };
  }
)'

# Process payment
dfx canister call agentic_stablecoin process_payment '"payment-001"'

# Check status
dfx canister call agentic_stablecoin get_payment_status '"payment-001"'
```

### Optimization Testing
```bash
# Record usage for AI learning
dfx canister call agentic_stablecoin record_payment_usage '("REI", "rei-provider", 1000000, true, 2.5)'

# Get usage metrics (last hour)
dfx canister call agentic_stablecoin get_usage_metrics '(3600)'

# Update optimization settings
dfx canister call agentic_stablecoin update_optimization_settings '(
  record {
    max_cost_per_transaction = 2000000;
    preferred_chains = vec {"REI"; "Polygon"};
    reliability_threshold = 0.95;
    auto_optimization_enabled = true;
    rebalance_frequency = 3600;
  }
)'
```

## 🔧 Integration with Frontend

Add to your Next.js project:

```typescript
// utils/icp-canister.ts
import { Actor, HttpAgent } from '@dfinity/agent';

const CANISTER_ID = 'your-canister-id';
const agent = new HttpAgent({ host: 'https://ic0.app' });

export const agenticStablecoinActor = Actor.createActor(idlFactory, {
  agent,
  canisterId: CANISTER_ID,
});

// Optimize payment
export const optimizePayment = async (chain: string, amount: number) => {
  return await agenticStablecoinActor.optimize_payment_route(chain, amount);
};
```

## 🌐 Frontend Integration with Live Canister

### TypeScript Integration

```typescript
// utils/icp-canister.ts
import { Actor, HttpAgent } from '@dfinity/agent';

const CANISTER_ID = 'by4bj-cqaaa-aaaaf-qapnq-cai';
const agent = new HttpAgent({ host: 'https://ic0.app' });

// Define the service interface
const idlFactory = ({ IDL }) => {
  const ServiceProvider = IDL.Record({
    id: IDL.Text,
    name: IDL.Text,
    api_endpoint: IDL.Text,
    supported_chains: IDL.Vec(IDL.Text),
    cost_per_request: IDL.Nat64,
    reliability_score: IDL.Float64,
    last_ping: IDL.Nat64,
    is_active: IDL.Bool,
  });

  const PaymentStatus = IDL.Variant({
    Pending: IDL.Null,
    Processing: IDL.Null,
    Completed: IDL.Null,
    Failed: IDL.Null,
    Cancelled: IDL.Null,
  });

  return IDL.Service({
    health_check: IDL.Func([], [IDL.Text], ['query']),
    optimize_payment_route: IDL.Func([IDL.Text, IDL.Nat64], [IDL.Opt(IDL.Text)], ['query']),
    list_service_providers: IDL.Func([], [IDL.Vec(ServiceProvider)], ['query']),
    get_usage_metrics: IDL.Func([IDL.Nat64], [UsageMetrics], ['query']),
    // Add other methods as needed
  });
};

export const agenticStablecoinActor = Actor.createActor(idlFactory, {
  agent,
  canisterId: CANISTER_ID,
});

// Example usage functions
export const optimizePayment = async (chain: string, amount: number) => {
  try {
    const result = await agenticStablecoinActor.optimize_payment_route(chain, amount);
    return result[0] || null; // Handle optional return
  } catch (error) {
    console.error('Failed to optimize payment:', error);
    throw error;
  }
};

export const getProviders = async () => {
  try {
    return await agenticStablecoinActor.list_service_providers();
  } catch (error) {
    console.error('Failed to get providers:', error);
    throw error;
  }
};

export const getUsageMetrics = async (timeWindow = 3600) => {
  try {
    return await agenticStablecoinActor.get_usage_metrics(timeWindow);
  } catch (error) {
    console.error('Failed to get usage metrics:', error);
    throw error;
  }
};
```

### React Component Example

```tsx
// components/PaymentOptimizer.tsx
import { useState, useEffect } from 'react';
import { optimizePayment, getProviders, getUsageMetrics } from '../utils/icp-canister';

export function PaymentOptimizer() {
  const [providers, setProviders] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [optimizedProvider, setOptimizedProvider] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [providerData, metricsData] = await Promise.all([
        getProviders(),
        getUsageMetrics(86400) // 24 hours
      ]);
      setProviders(providerData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const result = await optimizePayment('REI', 1000000);
      setOptimizedProvider(result || 'No provider found');
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">🧠 AI Payment Optimizer</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Available Providers</h3>
          <div className="space-y-2">
            {providers.map((provider, index) => (
              <div key={index} className="p-3 border rounded-md">
                <div className="font-medium">{provider.name}</div>
                <div className="text-sm text-gray-600">
                  Cost: {provider.cost_per_request} | 
                  Reliability: {(provider.reliability_score * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Usage Metrics (24h)</h3>
          {metrics && (
            <div className="p-3 border rounded-md">
              <div>Total Requests: {metrics.total_requests}</div>
              <div>Success Rate: {((metrics.successful_payments / metrics.total_requests) * 100).toFixed(1)}%</div>
              <div>Average Response: {metrics.average_response_time.toFixed(2)}ms</div>
              <div>Cost Efficiency: {metrics.cost_efficiency.toFixed(4)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={handleOptimize}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Optimizing...' : 'Optimize REI Payment Route'}
        </button>
        
        {optimizedProvider && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-md">
            <strong>Optimal Provider:</strong> {optimizedProvider}
          </div>
        )}
      </div>
    </div>
  );
}
```

## 📈 Monitoring

```bash
# System health
dfx canister call agentic_stablecoin health_check

# Usage analytics
dfx canister call agentic_stablecoin get_usage_metrics '(86400)' # 24 hours

# Rebalancing recommendations
dfx canister call agentic_stablecoin get_rebalancing_suggestions

# Check canister status
dfx canister status agentic_stablecoin
```

## 🔒 Security

- Authorization required for all write operations
- Principal-based access control
- Auto-processing with failure handling
- Secure payment state management

## 📁 Project Structure

```
icp-canister/
├── src/
│   ├── lib.rs                 # Main canister code
│   ├── types.rs              # Data structures
│   ├── service_registry.rs   # Provider management
│   ├── payment_processor.rs  # Payment handling
│   └── cost_optimizer.rs     # AI optimization
├── Cargo.toml                # Dependencies
├── dfx.json                  # DFX configuration
├── deploy.sh                 # Deployment script
└── README.md                 # This file
```

## 🆘 Troubleshooting

### Build Issues
```bash
cargo clean
cargo check
cargo build --target wasm32-unknown-unknown --release
```

### Authorization Issues
```bash
# Check your principal
dfx identity get-principal

# Add yourself as authorized
dfx canister call agentic_stablecoin add_authorized_principal '(principal "YOUR_PRINCIPAL")'
```

### Canister Issues
```bash
# Check logs
dfx canister logs agentic_stablecoin

# Restart local replica
dfx stop && dfx start --background
```

## 🔗 Related Documentation

- [ICP Ninja Deployment Guide](../../docs/icp-ninja-deployment.md)
- [AI Agent Integration](../../docs/ai-agent-icp-integration.md)
- [Complete ICP Canister Guide](../../docs/icp-canister-guide.md)

## 🚀 Next Steps

1. Deploy the canister using `./deploy.sh local` or `./deploy.sh ic`
2. Integrate with your frontend application
3. Connect to the Node.js AI agent layer
4. Configure service providers and optimization settings
5. Monitor performance and iterate on AI models

Your autonomous payment agent is ready to optimize stablecoin payments across multiple chains! 🎉
