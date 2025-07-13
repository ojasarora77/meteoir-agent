"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import {
  BellIcon,
  ChartBarIcon,
  ClockIcon,
  Cog6ToothIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  PauseIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";

const Dashboard: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [agentActive, setAgentActive] = useState(false);

  // Mock data for demo
  const mockData = {
    totalSpent: "$847.23",
    transactionsToday: 47,
    activeBudget: "$2,500.00",
    servicesConnected: 12,
    avgCostSavings: "23%",
    uptime: "99.8%",
  };

  const recentTransactions = [
    { id: 1, service: "Weather API", amount: "$0.05", time: "2 min ago", status: "completed" },
    { id: 2, service: "AWS S3 Storage", amount: "$2.34", time: "5 min ago", status: "completed" },
    { id: 3, service: "OpenAI GPT-4", amount: "$12.50", time: "8 min ago", status: "completed" },
    { id: 4, service: "IPFS Pinning", amount: "$0.12", time: "12 min ago", status: "completed" },
  ];

  const connectedServices = [
    { name: "OpenWeatherMap", status: "active", cost: "$0.001/call", calls: 156 },
    { name: "AWS S3", status: "active", cost: "$0.023/GB", usage: "12.4 GB" },
    { name: "OpenAI API", status: "active", cost: "$0.02/1k tokens", usage: "45k tokens" },
    { name: "IPFS Pinata", status: "paused", cost: "$0.15/GB", usage: "2.1 GB" },
  ];

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-base-content">AI Agent Dashboard</h1>
            <p className="text-base-content/70 mt-2">Monitor and control your autonomous payment agent</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setAgentActive(!agentActive)}
              className={`btn btn-lg px-6 transition-all duration-300 ${
                agentActive ? "btn-error hover:btn-error/80" : "btn-primary hover:scale-105"
              }`}
            >
              {agentActive ? (
                <>
                  <PauseIcon className="w-5 h-5 mr-2" />
                  Pause Agent
                </>
              ) : (
                <>
                  <PlayIcon className="w-5 h-5 mr-2" />
                  Start Agent
                </>
              )}
            </button>
            <button className="btn btn-outline btn-lg px-6">
              <Cog6ToothIcon className="w-5 h-5 mr-2" />
              Settings
            </button>
          </div>
        </div>

        {/* Status Indicator */}
        {connectedAddress && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-4 h-4 rounded-full animate-pulse ${agentActive ? "bg-success" : "bg-warning"}`}
                ></div>
                <span className="font-medium">Agent Status: {agentActive ? "Active & Learning" : "Paused"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-base-content/60">
                <span>Connected:</span>
                <code className="bg-base-300 px-2 py-1 rounded text-xs">
                  {connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-success">+{mockData.avgCostSavings}</span>
            </div>
            <h3 className="font-semibold text-base-content/80 mb-1">Cost Savings</h3>
            <p className="text-2xl font-bold">{mockData.totalSpent}</p>
            <p className="text-sm text-base-content/60">Total spent today</p>
          </div>

          <div className="glass-card p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm text-base-content/60">{mockData.transactionsToday} today</span>
            </div>
            <h3 className="font-semibold text-base-content/80 mb-1">Transactions</h3>
            <p className="text-2xl font-bold">{mockData.transactionsToday}</p>
            <p className="text-sm text-base-content/60">Automated payments</p>
          </div>

          <div className="glass-card p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                <CpuChipIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm text-success">{mockData.uptime}</span>
            </div>
            <h3 className="font-semibold text-base-content/80 mb-1">Agent Uptime</h3>
            <p className="text-2xl font-bold">{mockData.servicesConnected}</p>
            <p className="text-sm text-base-content/60">Services connected</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Recent Transactions</h2>
                <button className="btn btn-outline btn-sm">View All</button>
              </div>

              <div className="space-y-4">
                {recentTransactions.map(tx => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 bg-base-100 rounded-xl hover:bg-base-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                        <CurrencyDollarIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{tx.service}</p>
                        <p className="text-sm text-base-content/60">{tx.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{tx.amount}</p>
                      <div className="badge badge-success badge-sm">{tx.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Overview */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold mb-6">Budget Overview</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Daily Budget</span>
                  <span className="font-semibold">$100.00</span>
                </div>
                <div className="w-full bg-base-300 rounded-full h-3">
                  <div className="bg-primary h-3 rounded-full" style={{ width: "34%" }}></div>
                </div>
                <div className="flex justify-between text-sm text-base-content/60">
                  <span>$34.00 used</span>
                  <span>$66.00 remaining</span>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Services */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Connected Services</h2>
                <button className="btn btn-primary btn-sm">Add New</button>
              </div>

              <div className="space-y-4">
                {connectedServices.map((service, index) => (
                  <div key={index} className="p-4 bg-base-100 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{service.name}</h3>
                      <div
                        className={`badge badge-sm ${service.status === "active" ? "badge-success" : "badge-warning"}`}
                      >
                        {service.status}
                      </div>
                    </div>
                    <p className="text-sm text-base-content/60 mb-1">{service.cost}</p>
                    <p className="text-xs text-base-content/50">{service.usage}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <button className="btn btn-outline w-full justify-start">
                  <BellIcon className="w-4 h-4 mr-2" />
                  Set Alerts
                </button>
                <button className="btn btn-outline w-full justify-start">
                  <ChartBarIcon className="w-4 h-4 mr-2" />
                  View Analytics
                </button>
                <button className="btn btn-outline w-full justify-start">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  Schedule Tasks
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
