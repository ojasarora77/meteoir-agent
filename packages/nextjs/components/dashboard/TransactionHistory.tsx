import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import useDashboardData from '../../hooks/useDashboardData';

export const TransactionHistory: React.FC = () => {
  const { transactions, loading, refresh } = useDashboardData();
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('time');

  useEffect(() => {
    let filtered = Array.isArray(transactions) ? [...transactions] : [];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.provider?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return parseFloat(b.amount.replace('$', '')) - parseFloat(a.amount.replace('$', ''));
        case 'service':
          return a.service.localeCompare(b.service);
        case 'time':
        default:
          return new Date(b.time).getTime() - new Date(a.time).getTime();
      }
    });

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, statusFilter, sortBy]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-success" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-warning" />;
      case 'failed':
        return <ExclamationTriangleIcon className="w-5 h-5 text-error" />;
      default:
        return <ClockIcon className="w-5 h-5 text-base-content/60" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      completed: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-error'
    };
    return `badge badge-sm ${classes[status as keyof typeof classes] || 'badge-ghost'}`;
  };

  const calculateTotalSpent = () => {
    return filteredTransactions
      .filter(tx => tx.status === 'completed')
      .reduce((sum, tx) => sum + parseFloat(tx.amount.replace('$', '')), 0)
      .toFixed(2);
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Service', 'Amount', 'Time', 'Status', 'Provider'],
      ...filteredTransactions.map(tx => [
        tx.service,
        tx.amount,
        tx.time,
        tx.status,
        tx.provider || 'Unknown'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Transaction History</h2>
          <div className="loading loading-spinner loading-md"></div>
        </div>
        <div className="glass-card p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-base-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-base-300 rounded w-3/4"></div>
                  <div className="h-3 bg-base-300 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-base-300 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Transaction History</h2>
          <p className="text-base-content/70">
            Total spent: <span className="font-semibold">${calculateTotalSpent()}</span>
            {' • '}
            <span>{filteredTransactions.length} transactions</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={refresh} className="btn btn-outline btn-sm">
            <ClockIcon className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={exportTransactions} className="btn btn-outline btn-sm">
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Search</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search services..."
                className="input input-bordered w-full pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-base-content/60" />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Status</span>
            </label>
            <select
              className="select select-bordered"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Sort By</span>
            </label>
            <select
              className="select select-bordered"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="time">Time</option>
              <option value="amount">Amount</option>
              <option value="service">Service</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Actions</span>
            </label>
            <button className="btn btn-outline">
              <FunnelIcon className="w-4 h-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="glass-card p-6">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <CurrencyDollarIcon className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
            <p className="text-base-content/60">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'No transactions have been made yet'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction, index) => (
              <div
                key={transaction.id || index}
                className="flex items-center justify-between p-4 bg-base-100 rounded-xl hover:bg-base-200 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{transaction.service}</p>
                      {transaction.provider && (
                        <span className="text-xs bg-base-300 px-2 py-1 rounded">
                          {transaction.provider}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-base-content/60">{transaction.time}</p>
                  </div>
                </div>
                
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="font-semibold">{transaction.amount}</p>
                    <div className={getStatusBadge(transaction.status)}>
                      {transaction.status}
                    </div>
                  </div>
                  {getStatusIcon(transaction.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-card p-6 text-center">
          <div className="text-2xl font-bold text-success">
            {filteredTransactions.filter(tx => tx.status === 'completed').length}
          </div>
          <div className="text-sm text-base-content/60">Completed</div>
        </div>
        
        <div className="glass-card p-6 text-center">
          <div className="text-2xl font-bold text-warning">
            {filteredTransactions.filter(tx => tx.status === 'pending').length}
          </div>
          <div className="text-sm text-base-content/60">Pending</div>
        </div>
        
        <div className="glass-card p-6 text-center">
          <div className="text-2xl font-bold text-error">
            {filteredTransactions.filter(tx => tx.status === 'failed').length}
          </div>
          <div className="text-sm text-base-content/60">Failed</div>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;