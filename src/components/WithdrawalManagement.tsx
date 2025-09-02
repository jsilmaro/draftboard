import React, { useState, useEffect, useCallback } from 'react';

interface WithdrawalRequest {
  id: string;
  creatorId: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  adminNotes?: string;
  stripeTransferId?: string;
  requestedAt: string;
  processedAt?: string;
  creator: {
    id: string;
    fullName: string;
    userName: string;
    email: string;
  };
}

const WithdrawalManagement: React.FC = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionReason, setActionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const token = localStorage.getItem('token') || '';

  const fetchWithdrawalRequests = useCallback(async () => {
    try {
      setLoading(true);
      const queryParam = filter !== 'all' ? `?status=${filter}` : '';
      const url = `/api/admin/withdrawal-requests${queryParam}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWithdrawalRequests(data);
      } else {
        await response.json(); // Consume response but don't store error
      }
    } catch (_error) {
      // Silently handle error
    } finally {
      setLoading(false);
    }
  }, [filter, token]);

  useEffect(() => {
    fetchWithdrawalRequests();
  }, [fetchWithdrawalRequests]);

  const handleAction = async () => {
    if (!selectedRequest) return;

    if (actionType === 'reject' && !actionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);

    try {
      const endpoint = `/api/admin/withdrawal-requests/${selectedRequest.id}/${actionType}`;
      const body = actionType === 'reject' 
        ? { reason: actionReason, adminNotes }
        : { adminNotes };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await response.json(); // Consume response but don't store result
        
        setShowActionModal(false);
        setSelectedRequest(null);
        setActionReason('');
        setAdminNotes('');
        fetchWithdrawalRequests(); // Refresh data
        alert(`Withdrawal request ${actionType}d successfully!`);
      } else {
        const errorData = await response.json();
        alert(`Failed to ${actionType} withdrawal request: ${errorData.error}`);
      }
    } catch (_error) {
      alert(`Failed to ${actionType} withdrawal request: Network error`);
    } finally {
      setProcessing(false);
    }
  };

  const openActionModal = (request: WithdrawalRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setShowActionModal(true);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`;
    }
  };

  const filteredRequests = withdrawalRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const pendingCount = withdrawalRequests.filter(req => req.status === 'pending').length;
  const totalAmount = filteredRequests.reduce((sum, req) => sum + req.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm border border-white/10 dark:border-gray-700/30 rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-200">Withdrawal Management</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">
              {pendingCount} pending request{pendingCount !== 1 ? 's' : ''}
            </span>
            <button
              onClick={fetchWithdrawalRequests}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <h3 className="text-sm font-medium opacity-90">Total Requests</h3>
            <p className="text-2xl font-bold">{withdrawalRequests.length}</p>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4 rounded-lg">
            <h3 className="text-sm font-medium opacity-90">Pending</h3>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
            <h3 className="text-sm font-medium opacity-90">Approved</h3>
            <p className="text-2xl font-bold">
              {withdrawalRequests.filter(req => req.status === 'approved').length}
            </p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
            <h3 className="text-sm font-medium opacity-90">Total Amount</h3>
            <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">
                  {withdrawalRequests.filter(req => req.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Withdrawal Requests Table */}
        <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm rounded-lg border border-white/10 dark:border-gray-600/20 overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <p className="text-gray-400">No withdrawal requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Creator</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Requested</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 dark:divide-gray-700/30">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-white/5 dark:hover:bg-gray-600/20">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{request.creator.fullName}</div>
                          <div className="text-sm text-gray-400">@{request.creator.userName}</div>
                          <div className="text-xs text-gray-500">{request.creator.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-white">${request.amount.toFixed(2)}</div>
                        <div className="text-xs text-gray-400">{request.currency}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        {request.reason && (
                          <div className="text-xs text-red-400 mt-1">
                            Reason: {request.reason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(request.requestedAt).toLocaleDateString()}
                        {request.processedAt && (
                          <div className="text-xs">
                            Processed: {new Date(request.processedAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === 'pending' ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openActionModal(request, 'approve')}
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openActionModal(request, 'reject')}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-medium"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500">
                            {request.status === 'approved' ? 'Approved' : 'Completed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {actionType === 'approve' ? 'Approve' : 'Reject'} Withdrawal Request
                </h3>
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedRequest(null);
                    setActionReason('');
                    setAdminNotes('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Creator:</strong> {selectedRequest.creator.fullName} (@{selectedRequest.creator.userName})
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Amount:</strong> ${selectedRequest.amount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Requested:</strong> {new Date(selectedRequest.requestedAt).toLocaleDateString()}
                </p>
              </div>

              {actionType === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter reason for rejection..."
                    required
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Internal notes..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedRequest(null);
                    setActionReason('');
                    setAdminNotes('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={processing || (actionType === 'reject' && !actionReason.trim())}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors duration-200 ${
                    actionType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                      : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                  } disabled:cursor-not-allowed`}
                >
                  {processing ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalManagement;

