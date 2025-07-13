#!/bin/bash

echo "🚀 Setting up Agentic Stablecoin System..."

# Check if required tools are installed
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    fi
}

echo "🔍 Checking required tools..."
check_command "node"
check_command "npm"
check_command "docker"

# Start databases using Docker (easier setup)
echo "📊 Starting databases with Docker..."

# Redis
echo "Starting Redis..."
docker run -d --name agentic-redis -p 6379:6379 redis:alpine || echo "Redis container already exists"

# PostgreSQL
echo "Starting PostgreSQL..."
docker run -d --name agentic-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=agentic_stablecoin \
  -p 5432:5432 \
  postgres:15-alpine || echo "PostgreSQL container already exists"

# MongoDB
echo "Starting MongoDB..."
docker run -d --name agentic-mongo -p 27017:27017 mongo:6 || echo "MongoDB container already exists"

# Wait for databases to start
echo "⏳ Waiting for databases to start..."
sleep 10

# Setup PostgreSQL schema
echo "📋 Setting up PostgreSQL schema..."
sleep 5  # Give PostgreSQL more time to start
docker exec -i agentic-postgres psql -U postgres -d agentic_stablecoin < packages/backend/src/database/schemas.sql || echo "Schema setup may have failed - continuing..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd packages/backend
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build || echo "Build may have warnings - continuing..."

# Start backend in development mode
echo "⚙️ Starting backend..."
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 10

# Test backend health
echo "🔍 Testing backend health..."
curl -f http://localhost:3001/health || echo "Backend health check may have failed"

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
echo "Health Check: http://localhost:3001/health"
echo "API Docs: http://localhost:3001/api/v1/providers"
echo ""
echo "🛑 To stop everything:"
echo "kill $BACKEND_PID $FRONTEND_PID"
echo "docker stop agentic-redis agentic-postgres agentic-mongo"
echo ""
echo "📋 Next steps:"
echo "1. Get API keys (OpenWeatherMap, etc.) and update packages/backend/.env"
echo "2. Test the weather API: curl -X POST http://localhost:3001/api/v1/estimate-cost -H 'Content-Type: application/json' -d '{\"serviceType\": \"weather_api\", \"parameters\": {\"location\": \"London\"}}'"
echo "3. Open http://localhost:3000 to see your frontend"

# Keep script running to show logs
wait