"use client";

import { useState, useEffect } from 'react';
import { api, formatCurrency, formatPercentage, getServiceTypeIcon } from '../lib/api';

export const DemoSection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [providers, setProviders] = useState<any[]>([]);
  const [costEstimation, setCostEstimation] = useState<any>(null);
  const [budget, setBudget] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  // Check backend status on load
  useEffect(() => {
    checkBackendStatus();
    loadInitialData();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const health = await api.healthCheck();
      setBackendStatus(health.status === 'healthy' ? 'connected' : 'error');
    } catch (_error) {
      setBackendStatus('error');
    }
  };

  const loadInitialData = async () => {
    try {
      // Load providers
      const providersData = await api.getProviders();
      setProviders(providersData);

      // Load budget
      const budgetData = await api.getBudget('demo-user');
      setBudget(budgetData);

      // Load analytics
      const analyticsData = await api.getCostAnalytics('demo-user');
      setAnalytics(analyticsData);
    } catch (_error) {
      console.error('Failed to load initial data:', _error);
    }
  };

  const testWeatherAPI = async () => {
    setIsLoading(true);
    try {
      // Get cost estimation for weather API
      const estimation = await api.estimateCost('weather_api', {
        location: 'London'
      });
      setCostEstimation(estimation);

      // Create a service request
      const serviceRequest = await api.createServiceRequest({
        serviceType: 'weather_api',
        endpoint: '/weather',
        parameters: { location: 'London' },
        maxBudget: 1.0,
        userId: 'demo-user'
      });

      console.log('Service request created:', serviceRequest);
    } catch (_error) {
      console.error('Weather API test failed:', _error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIndicator = () => {
    switch (backendStatus) {
      case 'checking':
        return <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>;
      case 'connected':
        return <div className="w-3 h-3 bg-green-400 rounded-full"></div>;
      case 'error':
        return <div className="w-3 h-3 bg-red-400 rounded-full"></div>;
    }
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            🤖 Live Backend Demo
          </h2>
          <div className="flex items-center justify-center gap-2 mb-6">
            {getStatusIndicator()}
            <span className="text-sm text-gray-600">
              Backend Status: {backendStatus === 'connected' ? 'Connected' : backendStatus === 'error' ? 'Disconnected' : 'Checking...'}
            </span>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the autonomous AI payment system in action. Test cost optimization, 
            provider selection, and real-time analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Service Providers Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              🏢 Available Providers
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {providers.length}
              </span>
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {providers.map((provider) => (
                <div key={provider.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {getServiceTypeIcon(provider.type)} {provider.name}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {provider.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Uptime: {formatPercentage(provider.qualityMetrics?.uptime || 0)}</div>
                    <div>Score: {provider.reputationScore?.score || 'N/A'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget Status Card */}
          {budget && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                💰 Budget Status
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Daily Usage</span>
                    <span>{formatCurrency(budget.currentDailySpent)} / {formatCurrency(budget.dailyLimit)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min((budget.currentDailySpent / budget.dailyLimit) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Monthly Usage</span>
                    <span>{formatCurrency(budget.currentMonthlySpent)} / {formatCurrency(budget.monthlyLimit)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min((budget.currentMonthlySpent / budget.monthlyLimit) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Emergency Stop: {budget.isEmergencyStop ? '🔴 Active' : '🟢 Inactive'}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Card */}
          {analytics && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                📊 Analytics Overview
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(analytics.totalSpent)}
                    </div>
                    <div className="text-xs text-gray-500">Total Spent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(analytics.totalSavings)}
                    </div>
                    <div className="text-xs text-gray-500">Savings</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">
                      {analytics.requestCount}
                    </div>
                    <div className="text-xs text-gray-500">Requests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-orange-600">
                      {formatCurrency(analytics.averageCost)}
                    </div>
                    <div className="text-xs text-gray-500">Avg Cost</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cost Estimation Demo */}
          <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2 xl:col-span-3">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              🧠 AI Cost Optimization Demo
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <button
                onClick={testWeatherAPI}
                disabled={isLoading || backendStatus !== 'connected'}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    🌤️ Test Weather API
                  </>
                )}
              </button>
              
              <div className="text-sm text-gray-600">
                This will analyze weather API providers, select the optimal one based on cost and quality, 
                and create a service request with automatic payment scheduling.
              </div>
            </div>

            {/* Cost estimation results */}
            {costEstimation && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Cost Analysis Results:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Recommended Provider:</h5>
                    <div className="text-lg font-bold text-green-600">
                      {costEstimation.providers[0]?.providerName}
                    </div>
                    <div className="text-sm text-gray-600">
                      Cost: {formatCurrency(costEstimation.providers[0]?.estimatedCost)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Quality Score: {costEstimation.providers[0]?.qualityScore.toFixed(1)}/100
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Optimization Benefits:</h5>
                    <div className="text-sm text-gray-600">
                      Expected Savings: {formatCurrency(costEstimation.analysis.costSavings)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Confidence: {costEstimation.recommendation.confidenceLevel}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Risk Level: {costEstimation.analysis.riskAssessment}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <strong>Reasoning:</strong> {costEstimation.recommendation.reasoning}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Integration Status */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow">
            <span className="text-sm text-gray-600">Backend Integration:</span>
            {backendStatus === 'connected' ? (
              <span className="text-green-600 font-medium">✅ Fully Connected</span>
            ) : (
              <span className="text-red-600 font-medium">❌ Run `npm run dev` in backend</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};