# ICP Ninja Deployment Guide for Agentic Stablecoin

This guide provides step-by-step instructions for deploying your Agentic Stablecoin ICP canister using ICP Ninja platform.

## 🎯 Overview

ICP Ninja is a user-friendly platform for deploying Internet Computer canisters without complex local setup. Perfect for quick prototyping and production deployments.

## 📋 Prerequisites

1. **Web Browser** (Chrome, Firefox, Safari, Edge)
2. **Internet Identity or Plug Wallet** for authentication
3. **Your Rust code files** (already created in `/packages/icp-canister/`)

## 🚀 Step-by-Step Deployment

### Step 1: Access ICP Ninja

1. Go to [ICP Ninja](https://ninja.ic0.app/) in your web browser
2. Click **"Launch Ninja"** or **"Get Started"**
3. Connect your wallet:
   - Choose **Internet Identity** (recommended for beginners)
   - Or connect **Plug Wallet** if you have one
   - Or create a new Internet Identity

### Step 2: Create New Project

1. Once logged in, click **"Create New Project"**
2. Choose **"Rust Canister"** as project type
3. Enter project details:
   - **Project Name**: `agentic-stablecoin`
   - **Description**: `AI-powered autonomous payment optimization canister`
   - **Visibility**: Choose "Public" or "Private" based on your preference

### Step 3: Upload Your Code

You'll need to upload these files from your `/packages/icp-canister/` directory:

#### Required Files:
1. **`Cargo.toml`** - Rust dependencies and configuration
2. **`dfx.json`** - DFX project configuration  
3. **`src/lib.rs`** - Main canister code
4. **`src/types.rs`** - Data structures and types
5. **`src/service_registry.rs`** - Service provider management
6. **`src/payment_processor.rs`** - Payment processing logic
7. **`src/cost_optimizer.rs`** - AI cost optimization

#### Upload Process:
1. Click **"Upload Files"** or **"Add Files"**
2. Either drag and drop files or click to browse
3. Upload all the files listed above
4. Ensure the file structure matches:
   ```
   agentic-stablecoin/
   ├── Cargo.toml
   ├── dfx.json
   └── src/
       ├── lib.rs
       ├── types.rs
       ├── service_registry.rs
       ├── payment_processor.rs
       └── cost_optimizer.rs
   ```

### Step 4: Configure Build Settings

1. In the **Build Configuration** section:
   - **Build Command**: `cargo build --target wasm32-unknown-unknown --release`
   - **Canister Name**: `agentic_stablecoin`
   - **Wasm Path**: `target/wasm32-unknown-unknown/release/agentic_stablecoin.wasm`

2. **Environment Variables** (if needed):
   - None required for basic deployment

### Step 5: Deploy the Canister

1. Click **"Build & Deploy"**
2. Wait for the build process to complete (usually 2-5 minutes)
3. Monitor the build logs for any errors
4. Once successful, you'll see:
   - ✅ Build completed
   - ✅ Canister deployed
   - 📝 **Canister ID** (save this!)

### Step 6: Initialize and Test

After deployment, you'll get a canister ID like: `rdmx6-jaaaa-aaaah-qcaaa-cai`

#### Initialize the Canister:
```bash
# Using dfx CLI (if you have it installed)
dfx canister --network ic call rdmx6-jaaaa-aaaah-qcaaa-cai init

# Or use ICP Ninja's built-in terminal
```

#### Test Basic Functionality:
```bash
# Health check
dfx canister --network ic call rdmx6-jaaaa-aaaah-qcaaa-cai health_check

# Should return: "Agentic Stablecoin Canister is healthy. Timestamp: 1234567890"
```

## 🔧 Post-Deployment Configuration

### Step 7: Set Up Authorization

Add your principal as an authorized user:

```bash
# Get your principal ID first
dfx identity get-principal

# Add yourself as authorized (replace YOUR_PRINCIPAL with actual principal)
dfx canister --network ic call rdmx6-jaaaa-aaaah-qcaaa-cai add_authorized_principal '(principal "YOUR_PRINCIPAL")'
```

### Step 8: Register Service Providers

Register your first payment service provider:

```bash
dfx canister --network ic call rdmx6-jaaaa-aaaah-qcaaa-cai register_service_provider '(
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
```

### Step 9: Test Optimization Features

```bash
# Test payment route optimization
dfx canister --network ic call rdmx6-jaaaa-aaaah-qcaaa-cai optimize_payment_route '("REI", 1000000)'

# List all providers
dfx canister --network ic call rdmx6-jaaaa-aaaah-qcaaa-cai list_service_providers

# Get usage metrics
dfx canister --network ic call rdmx6-jaaaa-aaaah-qcaaa-cai get_usage_metrics '(3600)'
```

## 🌐 Alternative: Using ICP Ninja Web Interface

If you prefer not to use the command line:

### Web-Based Testing:

1. In ICP Ninja dashboard, find your deployed canister
2. Click **"Canister Interface"** or **"Test Functions"**
3. You'll see a web interface to call canister methods:
   - Select method: `health_check`
   - Click **"Call"**
   - View results in the response panel

4. For more complex calls:
   - Select method: `register_service_provider`
   - Fill in the form with service provider details
   - Click **"Call"** to execute

## 📱 Frontend Integration

### Step 10: Connect to Your Next.js App

Add to your frontend configuration:

```typescript
// utils/icp-config.ts
export const ICP_CONFIG = {
  CANISTER_ID: 'rdmx6-jaaaa-aaaah-qcaaa-cai', // Your actual canister ID
  HOST: 'https://ic0.app',
};

// utils/agent.ts
import { Actor, HttpAgent } from '@dfinity/agent';
import { ICP_CONFIG } from './icp-config';

const agent = new HttpAgent({ host: ICP_CONFIG.HOST });

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

  return IDL.Service({
    health_check: IDL.Func([], [IDL.Text], ['query']),
    optimize_payment_route: IDL.Func([IDL.Text, IDL.Nat64], [IDL.Opt(IDL.Text)], ['query']),
    list_service_providers: IDL.Func([], [IDL.Vec(ServiceProvider)], ['query']),
    // Add other methods as needed
  });
};

export const createActor = () => {
  return Actor.createActor(idlFactory, {
    agent,
    canisterId: ICP_CONFIG.CANISTER_ID,
  });
};
```

### Usage in React Component:

```tsx
// components/PaymentOptimizer.tsx
import { useState } from 'react';
import { createActor } from '../utils/agent';

export function PaymentOptimizer() {
  const [result, setResult] = useState('');
  const actor = createActor();

  const optimizePayment = async () => {
    try {
      const result = await actor.optimize_payment_route('REI', 1000000);
      setResult(result[0] || 'No provider found');
    } catch (error) {
      console.error('Optimization failed:', error);
    }
  };

  return (
    <div>
      <button onClick={optimizePayment}>
        Optimize Payment Route
      </button>
      <p>Optimal Provider: {result}</p>
    </div>
  );
}
```

## 📊 Monitoring Your Canister

### ICP Ninja Dashboard:

1. **Performance Metrics**: View CPU usage, memory consumption
2. **Call Statistics**: See method call frequency and success rates
3. **Cycle Usage**: Monitor compute costs
4. **Logs**: Debug issues and monitor activity

### Command Line Monitoring:

```bash
# Check canister status
dfx canister --network ic status rdmx6-jaaaa-aaaah-qcaaa-cai

# View recent logs
dfx canister --network ic logs rdmx6-jaaaa-aaaah-qcaaa-cai

# Check cycles balance
dfx wallet --network ic balance
```

## 🔄 Updating Your Canister

When you need to update your code:

### Via ICP Ninja:
1. Upload new code files
2. Click **"Upgrade Canister"**
3. Confirm the upgrade

### Via Command Line:
```bash
# Build new version locally first
cargo build --target wasm32-unknown-unknown --release

# Upgrade canister
dfx canister --network ic install rdmx6-jaaaa-aaaah-qcaaa-cai --mode upgrade
```

## 💰 Cycles Management

### Top Up Cycles:

Your canister needs cycles to run. Top up when needed:

```bash
# Check balance
dfx canister --network ic status rdmx6-jaaaa-aaaah-qcaaa-cai

# Top up with cycles (requires cycles wallet)
dfx canister --network ic deposit-cycles 1000000000000 rdmx6-jaaaa-aaaah-qcaaa-cai
```

### Via ICP Ninja:
1. Go to **"Manage Cycles"** in dashboard
2. Select amount to deposit
3. Confirm transaction

## 🆘 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check Cargo.toml dependencies
   - Ensure all source files are uploaded
   - Verify Rust syntax

2. **Authorization Errors**:
   - Add your principal to authorized users
   - Check Internet Identity connection

3. **Out of Cycles**:
   - Top up cycles via ICP Ninja or dfx
   - Monitor usage regularly

4. **Network Issues**:
   - Verify canister ID is correct
   - Check network connectivity
   - Try different browser/clear cache

### Getting Help:

- **ICP Ninja Discord**: [discord.gg/icp-ninja](https://discord.gg/icp-ninja)
- **Internet Computer Forum**: [forum.dfinity.org](https://forum.dfinity.org)
- **Documentation**: [internetcomputer.org/docs](https://internetcomputer.org/docs)

## 🎉 Success!

Your Agentic Stablecoin canister is now live on the Internet Computer! 

**Important URLs to save:**
- **Canister Dashboard**: `https://ninja.ic0.app/canisters/YOUR_CANISTER_ID`
- **Canister Frontend**: `https://YOUR_CANISTER_ID.ic0.app` (if applicable)
- **IC Explorer**: `https://dashboard.internetcomputer.org/canister/YOUR_CANISTER_ID`

## 🔗 Next Steps

1. **Configure Multiple Service Providers**: Add REI, Polygon, Ethereum providers
2. **Test Payment Flows**: Submit and process test payments
3. **Monitor Performance**: Set up alerts and analytics
4. **Scale**: Deploy additional canisters for different regions
5. **Security Audit**: Review code before production use

Your autonomous payment optimization system is ready to revolutionize stablecoin payments! 🚀
