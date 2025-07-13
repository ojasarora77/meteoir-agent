# Budget Setup and Efficient Testing Workflow

## Overview

This document explains how to set up a budget for the AI agent and demonstrates how testing becomes more efficient after setting a real budget.

## Quick Start

### 1. Set the Budget (One-time setup)

Run the Hardhat script to set up a budget for the AI agent:

```bash
# From the ai-agent directory
npm run set-budget

# Or from the hardhat directory
npm run set-budget
```

This script will:
- Set a daily limit of 0.01 ETH
- Set a monthly limit of 0.1 ETH  
- Set an emergency threshold of 0.005 ETH
- Deploy the budget configuration to Base Sepolia network

### 2. Run Efficient Tests

After setting the budget, run the efficient test suite:

```bash
# From the ai-agent directory
npm run test:efficient
```

## Why Tests Are More Efficient After Setting Budget

### Before Setting Budget (Test Mode)
- Agent runs in **test mode** with simulated payments
- Limited to 0.001 ETH allocation
- All transactions are simulated
- Provider selection may be restricted
- Performance metrics are artificial

### After Setting Budget (Production Mode)
- Agent runs in **production mode** with real payment capabilities
- Access to full budget allocation (0.01 ETH daily, 0.1 ETH monthly)
- Real blockchain transactions (when needed)
- Full provider ecosystem access
- Accurate performance metrics and cost optimization
- Better decision-making algorithms based on real costs

## Test Comparison

### Test Mode (No Budget Set)
```
🧪 TEST MODE CHARACTERISTICS:
├─ Budget: 0.001 ETH (simulated)
├─ Payments: All simulated
├─ Providers: Limited selection
├─ Performance: Artificial metrics
└─ Decision Engine: Basic algorithms
```

### Production Mode (Budget Set)
```
💰 PRODUCTION MODE CHARACTERISTICS:
├─ Budget: 0.01 ETH daily / 0.1 ETH monthly
├─ Payments: Real when necessary
├─ Providers: Full ecosystem access
├─ Performance: Real metrics
└─ Decision Engine: Advanced optimization
```

## Budget Configuration

The default budget setup in `setBudget.js`:

```javascript
const dailyLimit = ethers.parseEther("0.01");        // 0.01 ETH per day
const monthlyLimit = ethers.parseEther("0.1");       // 0.1 ETH per month  
const emergencyThreshold = ethers.parseEther("0.005"); // 0.005 ETH emergency
```

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run set-budget` | Set up budget for the AI agent |
| `npm run test:efficient` | Run comprehensive tests with budget |
| `npm test` | Run basic tests (may use test mode) |
| `npm run test:integration` | Run integration tests |
| `npm run test:network` | Test network connectivity |

## Environment Requirements

Ensure your `.env` file contains:

```env
PRIVATE_KEY=your_wallet_private_key
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PAYMENT_CONTROLLER_ADDRESS=your_deployed_contract_address
```

## Expected Efficiency Improvements

After setting the budget, you should see:

1. **Faster Provider Selection**: Access to all registered providers
2. **Better Cost Optimization**: Real-time cost analysis and provider comparison
3. **Accurate Performance Metrics**: Real transaction costs and timing
4. **Advanced Decision Making**: ML-powered optimization based on actual data
5. **Full Feature Access**: Complete agent functionality without restrictions

## Troubleshooting

### Budget Not Set
- Error: "Agent running in test mode - limited functionality"
- Solution: Run `npm run set-budget` first

### Network Issues
- Error: "Failed to connect to Base Sepolia"
- Solution: Check RPC URL and network connectivity

### Insufficient Budget
- Error: "Budget exhausted"
- Solution: Wait for daily/monthly reset or increase budget limits

## Cost Management

The agent automatically:
- Tracks daily and monthly spending
- Prevents overspending beyond limits
- Optimizes costs across providers
- Provides detailed budget reports

Monitor your budget usage through the test outputs and agent status reports.
