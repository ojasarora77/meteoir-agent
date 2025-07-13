import React, { useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import useDashboardData from '../../hooks/useDashboardData';
import { useApi } from '../../hooks/useApi';

export const ProviderManagement: React.FC = () => {
  const { providers, loading, refresh } = useDashboardData();
  const { post, post: deleteProvider } = useApi(); // Reusing post for delete
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProvider, setNewProvider] = useState({ type: 'weather_api', name: '', apiKey: '' });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-success" />;
      case 'paused':
        return <ExclamationTriangleIcon className="w-5 h-5 text-warning" />;
      default:
        return <ClockIcon className="w-5 h-5 text-base-content/60" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      active: 'badge-success',
      paused: 'badge-warning',
      error: 'badge-error'
    };
    return `badge badge-sm ${classes[status as keyof typeof classes] || 'badge-ghost'}`;
  };

  const getReliabilityColor = (score: number) => {
    if (score >= 95) return 'text-success';
    if (score >= 80) return 'text-warning';
    return 'text-error';
  };

  const handleAddProvider = async () => {
    await post('admin/providers', newProvider);
    setShowAddModal(false);
    refresh();
  };

  const handleDeleteProvider = async (providerId: string) => {
    await deleteProvider(`admin/providers/${providerId}`, {});
    refresh();
  };

  if (loading && providers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Service Providers</h2>
          <div className="loading loading-spinner loading-md"></div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-6">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-base-300 h-12 w-12"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-base-300 rounded w-3/4"></div>
                  <div className="h-3 bg-base-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Service Providers</h2>
          <p className="text-base-content/70">Manage and monitor your connected services</p>
        </div>
        <div className="flex gap-3">
          <button onClick={refresh} className="btn btn-outline btn-sm">
            <ClockIcon className="w-4 h-4" />
            Refresh
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Add Provider
          </button>
        </div>
      </div>

      {/* Providers Grid */}
      <div className="grid gap-6">
        {providers.map((provider, index) => (
          <div key={index} className="glass-card p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {provider.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {provider.name}
                    {getStatusIcon(provider.status)}
                  </h3>
                  <p className="text-sm text-base-content/60">{provider.cost}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={getStatusBadge(provider.status)}>
                  {provider.status}
                </div>
                <button 
                  onClick={() => setSelectedProvider(provider)}
                  className="btn btn-ghost btn-sm"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                <button className="btn btn-ghost btn-sm">
                  <Cog6ToothIcon className="w-4 h-4" />
                </button>
              <button 
                  onClick={() => handleDeleteProvider(provider.id)}
                  className="btn btn-ghost btn-sm"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center">
                <div className="text-lg font-semibold">{provider.uptime}</div>
                <div className="text-xs text-base-content/60">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{provider.responseTime}</div>
                <div className="text-xs text-base-content/60">Response Time</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-semibold ${getReliabilityColor(provider.reliability)}`}>
                  {provider.reliability}%
                </div>
                <div className="text-xs text-base-content/60">Reliability</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{provider.usage}</div>
                <div className="text-xs text-base-content/60">Usage</div>
              </div>
            </div>

            {/* Usage Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Current Usage</span>
                <span>{provider.usage}</span>
              </div>
              <div className="w-full bg-base-300 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.random() * 80 + 10}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}

        {providers.length === 0 && (
          <div className="glass-card p-12 text-center">
            <ChartBarIcon className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Providers Connected</h3>
            <p className="text-base-content/60 mb-4">
              Connect your first service provider to start optimizing costs
            </p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Your First Provider
            </button>
          </div>
        )}
      </div>

      {/* Provider Detail Modal */}
      {selectedProvider && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">
              {selectedProvider.name} - Detailed Metrics
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Performance Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Reliability Score:</span>
                    <span className={`font-semibold ${getReliabilityColor(selectedProvider.reliability)}`}>
                      {selectedProvider.reliability}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Response Time:</span>
                    <span className="font-semibold">{selectedProvider.responseTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span className="font-semibold">{selectedProvider.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Accuracy:</span>
                    <span className="font-semibold">{selectedProvider.dataAccuracy}%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Cost Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Pricing Model:</span>
                    <span className="font-semibold">{selectedProvider.cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Usage:</span>
                    <span className="font-semibold">{selectedProvider.usage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <div className={getStatusBadge(selectedProvider.status)}>
                      {selectedProvider.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button 
                onClick={() => setSelectedProvider(null)}
                className="btn"
              >
                Close
              </button>
              <button className="btn btn-primary">
                Configure
              </button>
            </div>
          </div>
          <div 
            className="modal-backdrop" 
            onClick={() => setSelectedProvider(null)}
          ></div>
        </div>
      )}

      {/* Add Provider Modal */}
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Add New Service Provider</h3>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Provider Type</span>
                </label>
                <select 
                  className="select select-bordered"
                  value={newProvider.type}
                  onChange={(e) => setNewProvider({ ...newProvider, type: e.target.value })}
                >
                  <option value="weather_api">Weather API</option>
                  <option value="cloud_storage">Cloud Storage</option>
                  <option value="ai_ml_service">AI/ML Service</option>
                  <option value="data_feed">Data Feed</option>
                </select>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Provider Name</span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g., OpenWeatherMap" 
                  className="input input-bordered" 
                  value={newProvider.name}
                  onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">API Key</span>
                </label>
                <input 
                  type="password" 
                  placeholder="Enter your API key" 
                  className="input input-bordered" 
                  value={newProvider.apiKey}
                  onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-action">
              <button 
                onClick={() => setShowAddModal(false)}
                className="btn"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddProvider}
                className="btn btn-primary"
              >
                Add Provider
              </button>
            </div>
          </div>
          <div 
            className="modal-backdrop" 
            onClick={() => setShowAddModal(false)}
          ></div>
        </div>
      )}
    </div>
  );
};

export default ProviderManagement;