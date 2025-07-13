import React, { useState } from 'react';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import useDashboardData from '../../hooks/useDashboardData';
import { useApi } from '../../hooks/useApi';

export const DashboardOverview: React.FC = () => {
  const { overview, providers, transactions, analytics, loading, error, lastUpdated, refresh, testOptimization } = useDashboardData();
  const { post } = useApi();
  const [agentActive, setAgentActive] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const handleTestOptimization = async () => {
    setTesting(true);
    try {
      const result = await testOptimization('weather_api', 'London');
      setOptimizationResult(result);
    } catch (error) {
      console.error('Optimization test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const handleAgentToggle = async () => {
    if (agentActive) {
      await post('agent/stop', {});
    } else {
      await post('agent/start', {});
    }
    setAgentActive(!agentActive);
  };

  if (loading && !overview) {
    return (
      <div className="min-h-screen bg-base-200 p-6 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 p-6 flex items-center justify-center">
        <div className="alert alert-error max-w-md">
          <ExclamationTriangleIcon className="w-6 h-6" />
          <div>
            <h3 className="font-bold">Connection Error</h3>
            <div className="text-xs">{error}</div>
          </div>
          <button onClick={refresh} className="btn btn-sm">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Real-Time Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-base-content flex items-center gap-3">
            <CpuChipIcon className="w-10 h-10" />
            AI Agent Dashboard
          </h1>
          <p className="text-base-content/70 mt-2">
            Autonomous cost optimization • Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleTestOptimization}
            disabled={testing}
            className="btn btn-outline btn-sm"
          >
            {testing ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <BoltIcon className="w-4 h-4" />
            )}
            Test AI
          </button>
          
          <button
            onClick={refresh}
            className="btn btn-outline btn-sm"
          >
            <ClockIcon className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={handleAgentToggle}
            className={`btn btn-lg px-6 transition-all duration-300 ${
              agentActive ? "btn-error hover:btn-error/80" : "btn-primary hover:scale-105"
            }`}
          >
            {agentActive ? (
              <>
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                Stop Agent
              </>
            ) : (
              <>
                <BoltIcon className="w-5 h-5 mr-2" />
                Start Agent
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Status Indicator */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full animate-pulse ${agentActive ? "bg-success" : "bg-warning"}`}></div>
            <span className="font-medium">
              Agent Status: {agentActive ? "Active & Optimizing" : "Standby Mode"}
            </span>
            {overview?.servicesConnected > 0 && (
              <div className="badge badge-primary">
                {overview.servicesConnected} services connected
              </div>
            )}
          </div>
          <div className="text-sm text-base-content/60">
            Backend: <span className="text-success">Connected</span>
          </div>
        </div>
      </div>

      {/* Real-Time Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-success">
                +{overview?.avgCostSavings || "0%"}
              </span>
              <div className="text-xs text-base-content/60">savings</div>
            </div>
          </div>
          <h3 className="font-semibold text-base-content/80 mb-1">Daily Spending</h3>
          <p className="text-2xl font-bold">{overview?.totalSpent || "$0.00"}</p>
          <p className="text-sm text-base-content/60">of {overview?.activeBudget || "$100.00"} budget</p>
        </div>

        <div className="glass-card p-6 hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm text-base-content/60">
              {overview?.transactionsToday || 0} today
            </span>
          </div>
          <h3 className="font-semibold text-base-content/80 mb-1">Transactions</h3>
          <p className="text-2xl font-bold">{overview?.transactionsToday || 0}</p>
          <p className="text-sm text-base-content/60">Automated payments</p>
        </div>

        <div className="glass-card p-6 hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
              <CpuChipIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm text-success">{overview?.uptime || "0%"}</span>
          </div>
          <h3 className="font-semibold text-base-content/80 mb-1">System Uptime</h3>
          <p className="text-2xl font-bold">{overview?.servicesConnected || 0}</p>
          <p className="text-sm text-base-content/60">Active services</p>
        </div>

        <div className="glass-card p-6 hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm text-base-content/60">reliability</span>
          </div>
          <h3 className="font-semibold text-base-content/80 mb-1">Success Rate</h3>
          <p className="text-2xl font-bold">98.2%</p>
          <p className="text-sm text-base-content/60">API calls successful</p>
        </div>
      </div>

      {/* AI Optimization Test Result */}
      {optimizationResult && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BoltIcon className="w-5 h-5" />
            Latest AI Optimization Test
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Recommendation</h3>
              <div className="bg-base-100 p-4 rounded-lg">
                <p className="font-medium text-primary">
                  Primary: {optimizationResult.recommendation?.primary}
                </p>
                <p className="text-sm text-base-content/70 mt-2">
                  {optimizationResult.recommendation?.reasoning}
                </p>
                <div className="flex gap-4 mt-3 text-sm">
                  <span>Confidence: {optimizationResult.recommendation?.confidenceLevel?.toFixed(1)}%</span>
                  <span className="text-success">
                    Savings: ${optimizationResult.recommendation?.expectedSavings?.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Analysis</h3>
              <div className="bg-base-100 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-base-content/60">Cost Savings:</span>
                    <p className="font-semibold">${optimizationResult.analysis?.costSavings?.toFixed(4)}</p>
                  </div>
                  <div>
                    <span className="text-base-content/60">Reliability:</span>
                    <p className="font-semibold">{optimizationResult.analysis?.reliabilityScore?.toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-base-content/60">Performance:</span>
                    <p className="font-semibold">{optimizationResult.analysis?.performanceScore?.toFixed(1)}/100</p>
                  </div>
                  <div>
                    <span className="text-base-content/60">Risk:</span>
                    <p className="font-semibold">{optimizationResult.analysis?.riskAssessment}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Progress */}
      {overview?.budgetUsage && (
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Daily Budget Usage</h2>
            <span className="text-sm text-base-content/60">
              ${overview.budgetUsage.used.toFixed(2)} / ${overview.budgetUsage.limit.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-base-300 rounded-full h-3 mb-2">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                overview.budgetUsage.percentage > 80 ? 'bg-error' : 
                overview.budgetUsage.percentage > 60 ? 'bg-warning' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(overview.budgetUsage.percentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-base-content/60">
            <span>{overview.budgetUsage.percentage.toFixed(1)}% used</span>
            <span>${(overview.budgetUsage.limit - overview.budgetUsage.used).toFixed(2)} remaining</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;