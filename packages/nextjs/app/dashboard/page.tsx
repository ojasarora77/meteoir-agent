"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import {
  ChartBarIcon,
  Cog6ToothIcon,
  CpuChipIcon,
  ClockIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import DashboardOverview from "../../components/dashboard/DashboardOverview";
import ProviderManagement from "../../components/dashboard/ProviderManagement";
import TransactionHistory from "../../components/dashboard/TransactionHistory";

const Dashboard: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: CpuChipIcon },
    { id: 'providers', name: 'Providers', icon: Cog6ToothIcon },
    { id: 'transactions', name: 'Transactions', icon: DocumentTextIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview />;
      case 'providers':
        return <ProviderManagement />;
      case 'transactions':
        return <TransactionHistory />;
      case 'analytics':
        return (
          <div className="glass-card p-12 text-center">
            <ChartBarIcon className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
            <p className="text-base-content/60 mb-4">
              Detailed cost analysis, usage patterns, and optimization insights coming soon.
            </p>
            <button className="btn btn-primary">
              <ClockIcon className="w-4 h-4 mr-2" />
              Coming Soon
            </button>
          </div>
        );
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navigation Tabs */}
      <div className="bg-base-100 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-base-content/60 hover:text-base-content hover:border-base-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Wallet Connection Status */}
      {connectedAddress && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  Wallet Connected: 
                  <code className="ml-2 bg-base-300 px-2 py-1 rounded text-xs">
                    {connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}
                  </code>
                </span>
              </div>
              <div className="text-sm text-base-content/60">
                Ready for autonomous payments
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Dashboard;
