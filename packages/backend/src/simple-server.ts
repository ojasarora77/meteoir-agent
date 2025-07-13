import express from 'express';
import cors from 'cors';
import { mockServiceProviders, mockUserBudget, mockCostAnalytics } from './database/mock-data';
import { CostOptimizer } from './ai-components/cost-optimizer';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize cost optimizer
const costOptimizer = new CostOptimizer();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    services: {
      api: true,
      database: true,
      scheduler: true,
      monitor: true,
    },
    version: '1.0.0'
  });
});

// Get all providers
app.get('/api/v1/providers', (req, res) => {
  res.json({
    success: true,
    data: mockServiceProviders.map(provider => ({
      ...provider,
      qualityMetrics: provider.qualityMetrics,
      reputationScore: {
        score: 85 + Math.random() * 15,
        trend: 'stable'
      }
    })),
    timestamp: new Date(),
    requestId: `req_${Date.now()}`
  });
});

// Get providers by type
app.get('/api/v1/providers/:type', (req, res) => {
  const { type } = req.params;
  const filteredProviders = mockServiceProviders.filter(p => p.type === type);
  
  res.json({
    success: true,
    data: filteredProviders.map(provider => ({
      ...provider,
      qualityMetrics: provider.qualityMetrics,
      reputationScore: {
        score: 85 + Math.random() * 15,
        trend: 'stable'
      }
    })),
    timestamp: new Date(),
    requestId: `req_${Date.now()}`
  });
});

// Cost estimation
app.post('/api/v1/estimate-cost', async (req, res) => {
  try {
    const { serviceType, parameters } = req.body;
    
    // Get providers for this service type
    const providers = mockServiceProviders.filter(p => p.type === serviceType);
    
    if (providers.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_PROVIDERS',
          message: 'No providers available for this service type'
        },
        timestamp: new Date(),
        requestId: `req_${Date.now()}`
      });
    }

    // Mock service request for analysis
    const mockRequest = {
      id: 'estimation',
      serviceType: serviceType as any,
      endpoint: '',
      parameters,
      estimatedCost: 0,
      maxBudget: 1000,
      priority: 'medium' as any,
      userId: 'estimation',
      status: 'pending' as any,
      createdAt: new Date(),
    };

    // Perform cost analysis
    const analysis = await costOptimizer.analyzeServiceOptions(
      serviceType,
      providers,
      mockRequest
    );

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date(),
      requestId: `req_${Date.now()}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYSIS_ERROR',
        message: error instanceof Error ? error.message : 'Analysis failed'
      },
      timestamp: new Date(),
      requestId: `req_${Date.now()}`
    });
  }
});

// Provider comparison
app.post('/api/v1/compare-providers', async (req, res) => {
  try {
    const { serviceType, parameters } = req.body;
    const providers = mockServiceProviders.filter(p => p.type === serviceType);

    const comparison = providers.map((provider, index) => ({
      provider: {
        id: provider.id,
        name: provider.name,
        type: provider.type,
      },
      analysis: {
        providerId: provider.id,
        providerName: provider.name,
        estimatedCost: provider.pricingModel.basePrice,
        qualityScore: 80 + Math.random() * 20,
        reliabilityScore: provider.qualityMetrics.reliabilityScore,
        responseTime: provider.qualityMetrics.avgResponseTime,
        pros: ['Cost effective', 'Reliable'],
        cons: ['Limited features'],
        rank: index + 1
      },
      qualityMetrics: provider.qualityMetrics,
      reputationScore: {
        score: 80 + Math.random() * 20,
        trend: 'stable'
      }
    }));

    res.json({
      success: true,
      data: comparison,
      timestamp: new Date(),
      requestId: `req_${Date.now()}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'COMPARISON_ERROR',
        message: error instanceof Error ? error.message : 'Comparison failed'
      },
      timestamp: new Date(),
      requestId: `req_${Date.now()}`
    });
  }
});

// Create service request
app.post('/api/v1/service-request', (req, res) => {
  try {
    const requestData = req.body;
    
    // Select best provider (simplified)
    const providers = mockServiceProviders.filter(p => p.type === requestData.serviceType);
    const selectedProvider = providers[0];

    if (!selectedProvider) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_PROVIDER',
          message: 'No provider available'
        },
        timestamp: new Date(),
        requestId: `req_${Date.now()}`
      });
    }

    const response = {
      serviceRequestId: `req_${Date.now()}`,
      jobId: `job_${Date.now()}`,
      selectedProvider: {
        id: selectedProvider.id,
        name: selectedProvider.name,
      },
      estimatedCost: selectedProvider.pricingModel.basePrice,
      analysis: {
        costSavings: 0.001,
        reliabilityScore: selectedProvider.qualityMetrics.reliabilityScore,
        performanceScore: 85,
        riskAssessment: 'Low'
      },
      status: 'scheduled',
    };

    res.json({
      success: true,
      data: response,
      timestamp: new Date(),
      requestId: `req_${Date.now()}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'REQUEST_ERROR',
        message: error instanceof Error ? error.message : 'Request failed'
      },
      timestamp: new Date(),
      requestId: `req_${Date.now()}`
    });
  }
});

// Get budget
app.get('/api/v1/budget/:userId', (req, res) => {
  res.json({
    success: true,
    data: mockUserBudget,
    timestamp: new Date(),
    requestId: `req_${Date.now()}`
  });
});

// Get cost analytics
app.get('/api/v1/analytics/costs/:userId', (req, res) => {
  res.json({
    success: true,
    data: mockCostAnalytics,
    timestamp: new Date(),
    requestId: `req_${Date.now()}`
  });
});

// Get provider analytics
app.get('/api/v1/analytics/providers', (req, res) => {
  const analytics = mockServiceProviders.map(provider => ({
    id: provider.id,
    name: provider.name,
    stats: {
      totalChecks: 100,
      healthyChecks: 95,
      averageResponseTime: provider.qualityMetrics.avgResponseTime,
      reputationScore: 85 + Math.random() * 15,
      uptime: provider.qualityMetrics.uptime,
      errorRate: 5,
      trend: 'stable'
    }
  }));

  res.json({
    success: true,
    data: analytics,
    timestamp: new Date(),
    requestId: `req_${Date.now()}`
  });
});

// Get alerts
app.get('/api/v1/monitoring/alerts', (req, res) => {
  res.json({
    success: true,
    data: [],
    timestamp: new Date(),
    requestId: `req_${Date.now()}`
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: 'Endpoint not found'
    },
    timestamp: new Date(),
    requestId: `req_${Date.now()}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Agentic Stablecoin Backend (Simple Mode)');
  console.log(`📡 API running on port ${PORT}`);
  console.log(`🔍 Health: http://localhost:${PORT}/health`);
  console.log(`📋 Providers: http://localhost:${PORT}/api/v1/providers`);
  console.log('');
  console.log('✅ Ready for frontend integration!');
});