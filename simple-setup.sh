#!/bin/bash

echo "🚀 Simple Agentic Stablecoin Setup (No Docker Required)..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd packages/backend
npm install

# Create logs directory
mkdir -p logs

# Start backend in development mode (uses mock data for now)
echo "⚙️ Starting backend with mock data..."
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Test backend health (will work even without real databases)
echo "🔍 Testing backend..."
curl -f http://localhost:3001/health || echo "Backend starting..."

# Start frontend
echo "🌐 Starting frontend..."
cd ../nextjs
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Access your application:"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo ""
echo "🧪 Test endpoints:"
echo "curl http://localhost:3001/health"
echo "curl http://localhost:3001/api/v1/providers"
echo ""
echo "🛑 To stop:"
echo "kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📝 Note: This runs without real databases using mock data."
echo "For full functionality, set up PostgreSQL, Redis, and MongoDB."

# Keep script running
wait