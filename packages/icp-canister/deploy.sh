#!/bin/bash

# Agentic Stablecoin ICP Canister Deployment Script

set -e

echo "🚀 Starting Agentic Stablecoin ICP Canister Deployment"

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx is not installed. Installing..."
    DFX_VERSION=0.15.0 sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
    export PATH="$HOME/bin:$PATH"
fi

# Check if we're in the right directory
if [ ! -f "Cargo.toml" ]; then
    echo "❌ Please run this script from the icp-canister directory"
    exit 1
fi

echo "📦 Building the canister..."
cargo build --target wasm32-unknown-unknown --release

echo "🧪 Running cargo check..."
cargo check

echo "🔧 Building with dfx..."
dfx build

echo "✅ Build completed successfully!"

# Check if we should deploy locally or to IC
if [ "$1" == "local" ]; then
    echo "🏠 Deploying locally..."
    
    # Start local replica if not running
    if ! pgrep -f "dfx start" > /dev/null; then
        echo "🔄 Starting local IC replica..."
        dfx start --background
        sleep 5
    fi
    
    # Deploy locally
    dfx deploy
    
    echo "🎉 Local deployment completed!"
    echo "📋 Testing canister..."
    
    # Run health check
    dfx canister call agentic_stablecoin health_check
    
    echo "💡 You can now interact with your canister locally!"
    echo "💡 Example: dfx canister call agentic_stablecoin list_service_providers"
    
elif [ "$1" == "ic" ]; then
    echo "🌐 Deploying to IC mainnet..."
    echo "⚠️  Make sure you have cycles and proper authorization!"
    
    # Deploy to IC
    dfx deploy --network ic
    
    echo "🎉 IC deployment completed!"
    echo "📋 Testing canister..."
    
    # Get canister ID
    CANISTER_ID=$(dfx canister id agentic_stablecoin --network ic)
    echo "📝 Canister ID: $CANISTER_ID"
    
    # Run health check
    dfx canister call agentic_stablecoin health_check --network ic
    
    echo "💡 Your canister is now live on the Internet Computer!"
    echo "💡 Canister URL: https://$CANISTER_ID.ic0.app"
    
else
    echo "📚 Usage: $0 [local|ic]"
    echo ""
    echo "Commands:"
    echo "  $0 local  - Deploy to local IC replica"
    echo "  $0 ic     - Deploy to IC mainnet"
    echo ""
    echo "For ICP Ninja deployment, follow the guide in docs/icp-ninja-deployment.md"
fi

echo "✨ Deployment script completed!"
