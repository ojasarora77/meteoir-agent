REI Network Documentation & Setup Guide
🔗 Key Resources
Official Documentation

Main Docs: https://docs.rei.network
Quick Start Guide: https://docs.rei.network/developer/quick-start
API Reference: https://docs.rei.network/developer/api-reference
System Contracts: https://docs.rei.network/developer/system-contracts
Official Website: https://www.rei.network

Network Information
REI Network Mainnet

Chain ID: 47805 (0xbabd)
Currency: REI
RPC URLs: Available at https://chainlist.org/chain/47805
Block Time: ~3 seconds
TPS: 3000+
Gas Fees: FREE (Zero gas fees through staking mechanism)

REI Network Testnet

Chain Name: rei-testnet
Node Setup: rei --chain rei-testnet
Faucet: https://github.com/REI-Network/rei-faucet

🚀 Key Features for Your Hackathon
Zero Gas Fees
REI Network achieves free gas through innovative staking & replacement design for on-chain resources. Perfect for your microtransaction use case!
EVM Compatibility

Fully compatible with Ethereum RPC (except EIP1559)
Use existing Solidity contracts and tools
Same APIs: eth, net, web3, debug, txpool namespaces
Deploy with Hardhat, Truffle, or any Ethereum tooling

Performance

3 second block times (upgrading to 1.5s)
3000+ TPS
Built for high-frequency interactions

🛠 Setup Instructions
1. Install REI Network CLI
bash# Via npm (recommended for hackathon)
npm install @rei-network/cli --global

# Or from source
git clone https://github.com/rei-network/rei.git
cd rei
npm install
npm link -w @rei-network/cli
2. Connect to Testnet
bash# Start testnet node
rei --chain rei-testnet --rpc --rpc-host 0.0.0.0

# Default RPC endpoint
# http://localhost:11451
3. MetaMask Configuration
Add REI Network manually to MetaMask:
Mainnet:

Network Name: REI Network
RPC URL: [Check ChainList for current endpoints]
Chain ID: 47805
Currency Symbol: REI

Testnet:

Use local node: http://localhost:11451
Chain ID: Configure for rei-testnet

4. Get Testnet Tokens
Use REI testnet faucet: https://github.com/REI-Network/rei-faucet
💡 Development Approach for 24 Hours
Smart Contract Strategy
solidity// Your existing Solidity skills work directly!
// Focus on these REI-specific advantages:

contract AutonomousPaymentAgent {
    // Zero gas fees = perfect for microtransactions
    // High TPS = real-time payment processing
    // 3s blocks = fast confirmation
}
Integration Points

Web3.js/Ethers.js: Works exactly like Ethereum
Hardhat: Full compatibility for deployment
OpenZeppelin: All libraries work
The Graph: Supported for indexing (see docs)

🎯 Hackathon Architecture
Tech Stack

Smart Contracts: Solidity on REI Network
Backend: Node.js + Web3.js
Payment Token: REI (or deploy USDC/USDT)
APIs: Standard HTTP APIs for services
Frontend: React with Web3 integration

Key Advantages for Endless Bounty

Partnership: REI Network officially partnered with Endless
Zero Fees: Perfect for autonomous microtransactions
EVM Compatible: Use your existing Solidity skills
Fast: 3s blocks for responsive AI agent actions
Production Ready: Mainnet live with real usage

📋 Sample Project Structure
autonomous-payment-agent/
├── contracts/
│   ├── PaymentController.sol
│   ├── ServiceRegistry.sol
│   └── BudgetManager.sol
├── scripts/
│   ├── deploy.js
│   └── setup-services.js
├── ai-agent/
│   ├── payment-scheduler.js
│   ├── cost-optimizer.js
│   └── service-monitor.js
├── frontend/
│   ├── dashboard/
│   └── wallet-integration/
└── integrations/
    ├── weather-api.js
    ├── storage-api.js
    └── compute-api.js
🔧 Development Commands
bash# Start local development
rei --chain rei-testnet --rpc --rpc-host 0.0.0.0

# Deploy contracts
npx hardhat deploy --network rei-testnet

# Run AI agent
node ai-agent/index.js

# Start dashboard
npm run dev
📚 Additional Resources
Example Projects

Bank Contract Example: https://docs.rei.network/developer/guides/using-the-graph/using-the-graph-on-rei-network
REI Bank Subgraph: https://github.com/bijianing97/REIBank-subgraph

Community & Support

GitHub: https://github.com/rei-network
Developer Portal: https://www.rei.network/developer/

Monitoring & Analytics

The Graph Protocol support for indexing
Standard Ethereum tooling compatibility
Built-in performance monitoring

🌐 REI Network + ICP Interoperability
Perfect Multi-Chain Architecture
ICP's Chain Fusion Technology: ICP's Chain Fusion protocol enables developers to build cross-chain applications by allowing smart contracts to communicate with various blockchains directly, including EVM-compatible chains like REI Network.
Direct Integration Capabilities:

ICP smart contracts can read, write and own ETH on EVM chains
The EVM RPC canister is an ICP smart contract for communicating with Ethereum and other EVM blockchains using an onchain API
Chain-key signatures also derive Ethereum addresses, enabling ICP smart contracts to read, write and own ETH

Why This Multi-Chain Approach Wins
Expanded Service Ecosystem:

REI Network: Zero-fee microtransactions for frequent API payments
ICP: Smart contracts on the ICP blockchain can utilize hundreds of gigabytes of memory and compute at the full speed of a modern CPU - perfect for AI agent logic
Cross-Chain: ICP's interoperability layer is underpinned by Chain Key Cryptography, which allows smart contracts to interact with other blockchains without holding private keys

Enhanced Autonomous Capabilities:

AI Models on ICP: The Internet Computer is able to run AI models as tamperproof smart contracts
HTTP Outcalls: ICP smart contracts process HTTP, and interact with users directly via web experiences they create
Reverse Gas Model: ICP adopts a reverse Gas model, where developers pay the Gas costs, allowing users to access applications without holding tokens

🏗 Multi-Chain Architecture for Your Agent
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ICP Canister  │    │  REI Network    │    │  External APIs  │
│                 │    │                 │    │                 │
│ • AI Decision   │◄──►│ • Payment Logic │◄──►│ • Cloud Services│
│ • HTTP Outcalls │    │ • Zero Gas Fees │    │ • Data Feeds    │
│ • Data Storage  │    │ • Fast Execution│    │ • Compute APIs  │
│ • User Frontend │    │ • EVM Compatible│    │ • Storage APIs  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
📋 24-Hour Multi-Chain Implementation
Hours 1-8: Core Infrastructure

ICP Canister: AI agent logic + HTTP outcalls
REI Contracts: Payment execution + service registry
Cross-Chain Bridge: Chain Fusion integration

Hours 9-16: Service Integration

API Connections: Weather, storage, compute services
Payment Flows: REI for microtransactions, ICP for complex operations
Decision Engine: AI models running on ICP canisters

Hours 17-24: Demo & Polish

Frontend: Full-stack DApp hosted on ICP
Demo Scenarios: Multi-chain autonomous payments
Analytics Dashboard: Cross-chain transaction monitoring


🏆 Why This Wins the Endless Bounty

Triple Innovation: REI Network + ICP + Endless partnership
Real Cross-Chain: Native interoperability without bridges
AI-Powered: 1,230% increase in activity on ICP's Chain Fusion protocol shows growing adoption
Zero Friction: REI's zero fees + ICP's reverse gas model
Production Scale: Piggycell successfully completing a stress test with 3.5 million users and 100,000 devices on ICP

Bottom Line: You're building the first truly autonomous multi-chain payment agent that leverages the best of both ecosystems - REI's zero fees for payments and ICP's AI capabilities for decision-making!