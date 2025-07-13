#!/bin/bash

echo "🧪 Testing Agentic Stablecoin API..."

API_BASE="http://localhost:3001"

# Test 1: Health Check
echo "1. Testing health check..."
curl -s "$API_BASE/health" | jq '.' || echo "Health check failed"

echo -e "\n"

# Test 2: Get Providers
echo "2. Testing get providers..."
curl -s "$API_BASE/api/v1/providers" | jq '.' || echo "Get providers failed"

echo -e "\n"

# Test 3: Get Weather Providers
echo "3. Testing get weather providers..."
curl -s "$API_BASE/api/v1/providers/weather_api" | jq '.' || echo "Get weather providers failed"

echo -e "\n"

# Test 4: Cost Estimation
echo "4. Testing cost estimation..."
curl -s -X POST "$API_BASE/api/v1/estimate-cost" \
  -H "Content-Type: application/json" \
  -d '{"serviceType": "weather_api", "parameters": {"location": "London"}}' | jq '.' || echo "Cost estimation failed"

echo -e "\n"

# Test 5: Provider Comparison
echo "5. Testing provider comparison..."
curl -s -X POST "$API_BASE/api/v1/compare-providers" \
  -H "Content-Type: application/json" \
  -d '{"serviceType": "weather_api", "parameters": {"location": "New York"}}' | jq '.' || echo "Provider comparison failed"

echo -e "\n"

# Test 6: Create Service Request
echo "6. Testing service request creation..."
curl -s -X POST "$API_BASE/api/v1/service-request" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "weather_api",
    "endpoint": "/weather",
    "parameters": {"location": "Tokyo"},
    "maxBudget": 1.0,
    "userId": "test-user"
  }' | jq '.' || echo "Service request creation failed"

echo -e "\n"

# Test 7: Get Budget
echo "7. Testing get budget..."
curl -s "$API_BASE/api/v1/budget/demo-user" | jq '.' || echo "Get budget failed"

echo -e "\n"

# Test 8: Get Analytics
echo "8. Testing cost analytics..."
curl -s "$API_BASE/api/v1/analytics/costs/demo-user" | jq '.' || echo "Cost analytics failed"

echo -e "\n"

# Test 9: Get Provider Analytics
echo "9. Testing provider analytics..."
curl -s "$API_BASE/api/v1/analytics/providers" | jq '.' || echo "Provider analytics failed"

echo -e "\n"

echo "✅ API testing complete!"