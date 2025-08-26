import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';
import StripePaymentIntegration from './StripePaymentIntegration';

interface Brief {
  id: string;
  title: string;
  description: string;
  totalRewardValue: number;
  rewardTiers: Array<{
    position: number;
    cashAmount: number;
    creditAmount: number;
    prizeDescription: string;
  }>;
  status: 'active' | 'completed' | 'draft';
  deadline: string;
  brandId: string;
  submissions: Submission[];
  winnersSelected: boolean;
}

interface Submission {
  id: string;
  creatorName: string;
  briefTitle: string;
  status: 'pending' | 'shortlisted' | 'winner' | 'rejected';
  submittedAt: string;
  creator: {
    fullName: string;
    userName: string;
    email: string;
  };
  briefId: string;
  content: string;
}

interface Winner {
  id: string;
  creatorId: string;
  briefId: string;
  position: number;
  reward: {
    cashAmount: number;
    creditAmount: number;
    prizeDescription: string;
  };
  status: 'pending' | 'paid' | 'processing' | 'failed';
  selectedAt: string;
  creator: {
    id: string;
    fullName: string;
    userName: string;
    email: string;
  };
  brief: {
    id: string;
    title: string;
  };
  paymentDetails?: {
    transactionId?: string;
    paymentMethod?: string;
    paidAt?: string;
    failureReason?: string;
  };
}

interface Wallet {
  balance: number;
  currency: string;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  reference?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer' | 'wallet';
  name: string;
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

const RewardsPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'submissions' | 'rewards'>('submissions');
  const [loading, setLoading] = useState(true);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [wallet, setWallet] = useState<Wallet>({
    balance: 0,
    currency: 'USD',
    transactions: []
  });
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [selectedPaymentWinner, setSelectedPaymentWinner] = useState<Winner | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [bulkPaymentMode, setBulkPaymentMode] = useState(false);
  const [selectedWinnersForBulk, setSelectedWinnersForBulk] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch real data from APIs
      const [briefsResponse, submissionsResponse, winnersResponse, walletResponse, paymentMethodsResponse] = await Promise.all([
        fetch('/api/brands/briefs', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/brands/submissions', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/brands/winners', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/brands/wallet', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/brands/payment-methods', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
      ]);

      if (briefsResponse.ok) {
        const briefsData = await briefsResponse.json();
        setBriefs(briefsData || []);
        if (briefsData && briefsData.length > 0) {
          setSelectedBrief(briefsData[0]);
        }
      } else {
        showErrorToast('Failed to load briefs');
      }

      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json();
        setSubmissions(submissionsData || []);
      } else {
        showErrorToast('Failed to load submissions');
      }

      if (winnersResponse.ok) {
        const winnersData = await winnersResponse.json();
        setWinners(winnersData || []);
      } else {
        showErrorToast('Failed to load winners');
      }

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        setWallet({
          balance: walletData.balance || 0,
          currency: walletData.currency || 'USD',
          transactions: walletData.transactions || []
        });
      } else {
        showErrorToast('Failed to load wallet');
      }

      if (paymentMethodsResponse.ok) {
        const paymentMethodsData = await paymentMethodsResponse.json();
        if (paymentMethodsData && paymentMethodsData.length > 0) {
          setSelectedPaymentMethod(paymentMethodsData.find((pm: PaymentMethod) => pm.isDefault) || paymentMethodsData[0]);
        }
      }
    } catch (error) {
      showErrorToast('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmissionStatusChange = async (submissionId: string, status: Submission['status']) => {
    try {
      let response;
      
      if (status === 'rejected') {
        response = await fetch(`/api/brands/submissions/${submissionId}/reject`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            reason: 'Not selected for this brief',
            rejectedAt: new Date().toISOString()
          })
        });
      } else if (status === 'shortlisted') {
        response = await fetch(`/api/brands/submissions/${submissionId}/approve`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ 
            approvedAt: new Date().toISOString()
          })
        });
      } else {
        // For other status changes, we'll update locally for now
        setSubmissions(prev => 
          prev.map(sub => 
            sub.id === submissionId ? { ...sub, status } : sub
          )
        );
        showSuccessToast(`Submission status updated to ${status}`);
        return;
      }

      if (response.ok) {
        setSubmissions(prev => 
          prev.map(sub => 
            sub.id === submissionId ? { ...sub, status } : sub
          )
        );
        showSuccessToast(`Submission status updated to ${status}`);
      } else {
        throw new Error('Failed to update submission status');
      }
    } catch (error) {
      showErrorToast('Failed to update submission status');
    }
  };

  const handleSelectWinner = async (submissionId: string, position: number = 1) => {
    try {
      const submission = submissions.find(s => s.id === submissionId);
      if (!submission) return;

      const response = await fetch('/api/brands/briefs/select-winners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          briefId: submission.briefId,
          winners: [{
            submissionId,
            position
          }],
          rewards: [{
            position,
            cashAmount: 100, // Default reward amount
            creditAmount: 0,
            prizeDescription: ''
          }]
        })
      });

      if (response.ok) {
        // Refresh winners data
        const winnersResponse = await fetch('/api/brands/winners', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (winnersResponse.ok) {
          const winnersData = await winnersResponse.json();
          setWinners(winnersData || []);
        }

        setSubmissions(prev => 
          prev.map(sub => 
            sub.id === submissionId ? { ...sub, status: 'winner' as const } : sub
          )
        );
        showSuccessToast('Winner selected successfully!');
      } else {
        throw new Error('Failed to select winner');
      }
    } catch (error) {
      showErrorToast('Failed to select winner');
    }
  };

  const handleProcessPayment = async (winnerId: string) => {
    const winner = winners.find(w => w.id === winnerId);
    if (winner) {
      setSelectedPaymentWinner(winner);
      setShowStripePayment(true);
    }
  };

  const handleBulkPayment = async () => {
    if (selectedWinnersForBulk.length === 0) {
      showErrorToast('Please select winners for bulk payment');
      return;
    }

    setPaymentProcessing(true);
    try {
      const selectedWinners = winners.filter(w => selectedWinnersForBulk.includes(w.id));
      const totalAmount = selectedWinners.reduce((sum, w) => sum + (w.reward?.cashAmount || 0), 0);

      // Check if wallet has sufficient balance
      if (wallet.balance < totalAmount) {
        showErrorToast('Insufficient wallet balance for bulk payment');
        return;
      }

      // Process bulk payment
      const response = await fetch('/api/brands/bulk-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          winnerIds: selectedWinnersForBulk,
          paymentMethod: selectedPaymentMethod?.id,
          totalAmount
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update winners status
        setWinners(prev => 
          prev.map(w => 
            selectedWinnersForBulk.includes(w.id) 
              ? { 
                  ...w, 
                  status: 'paid' as const,
                  paymentDetails: {
                    transactionId: result.transactionId,
                    paymentMethod: selectedPaymentMethod?.type || 'wallet',
                    paidAt: new Date().toISOString()
                  }
                }
              : w
          )
        );

        // Refresh wallet data
        await fetchData();
        
        showSuccessToast(`Bulk payment processed successfully! ${selectedWinnersForBulk.length} winners paid.`);
        setSelectedWinnersForBulk([]);
        setBulkPaymentMode(false);
      } else {
        throw new Error('Bulk payment failed');
      }
    } catch (error) {
      showErrorToast('Bulk payment failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };



  const handleStripePaymentSuccess = async (_paymentId: string) => {
    if (selectedPaymentWinner) {
      try {
        // Update local state to mark as paid
        setWinners(prev => 
          prev.map(w => 
            w.id === selectedPaymentWinner.id 
              ? { 
                  ...w, 
                  status: 'paid' as const,
                  paymentDetails: {
                    transactionId: _paymentId,
                    paymentMethod: 'stripe',
                    paidAt: new Date().toISOString()
                  }
                }
              : w
          )
        );

        // Refresh wallet data
        const walletResponse = await fetch('/api/brands/wallet', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (walletResponse.ok) {
          const walletData = await walletResponse.json();
          setWallet({
            balance: walletData.balance || 0,
            currency: walletData.currency || 'USD',
            transactions: walletData.transactions || []
          });
        }

        showSuccessToast('Payment processed successfully!');
      } catch (error) {
        showErrorToast('Payment processed but status update failed');
      }

      setShowStripePayment(false);
      setSelectedPaymentWinner(null);
    }
  };

  const handleStripePaymentError = (error: string) => {
    showErrorToast(`Payment failed: ${error}`);
    setShowStripePayment(false);
    setSelectedPaymentWinner(null);
  };

  const handleStripePaymentCancel = () => {
    setShowStripePayment(false);
    setSelectedPaymentWinner(null);
  };

  const handleWinnerSelectionForBulk = (winnerId: string) => {
    setSelectedWinnersForBulk(prev => 
      prev.includes(winnerId) 
        ? prev.filter(id => id !== winnerId)
        : [...prev, winnerId]
    );
  };

  const filteredSubmissions = selectedBrief 
    ? submissions.filter(s => s.briefId === selectedBrief.id)
    : [];

  const filteredWinners = selectedBrief 
    ? winners.filter(w => w.brief.id === selectedBrief.id)
    : [];

  const pendingWinners = filteredWinners.filter(w => w.status === 'pending');
  const paidWinners = filteredWinners.filter(w => w.status === 'paid');

  const getBriefProgress = (brief: Brief) => {
    const briefSubmissions = submissions.filter(s => s.briefId === brief.id);
    const shortlistedCount = briefSubmissions.filter(s => s.status === 'shortlisted').length;
    const winnerCount = briefSubmissions.filter(s => s.status === 'winner').length;
    const totalSubmissions = briefSubmissions.length;
    
    return {
      totalSubmissions,
      shortlistedCount,
      winnerCount,
      progressPercentage: totalSubmissions > 0 ? (winnerCount / totalSubmissions) * 100 : 0
    };
  };

  const getTotalPendingAmount = () => {
    return pendingWinners.reduce((sum, w) => sum + (w.reward?.cashAmount || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/brand-dashboard')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold">🎯 Rewards & Payments</h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-gray-400">Wallet Balance</p>
                <p className="text-lg font-bold text-green-400">${wallet.balance.toLocaleString()}</p>
              </div>
              {pendingWinners.length > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-400">Pending Payments</p>
                  <p className="text-lg font-bold text-yellow-400">${getTotalPendingAmount().toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'submissions', label: '📋 Submissions', count: filteredSubmissions.length },
                { id: 'rewards', label: '🏆 Rewards & Payments', count: filteredWinners.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'submissions' | 'rewards')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-gray-700 text-gray-300 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Brief Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">Select Brief</label>
          <select
            value={selectedBrief?.id || ''}
            onChange={(e) => setSelectedBrief(briefs.find(b => b.id === e.target.value) || null)}
            className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {briefs.map(brief => {
              const progress = getBriefProgress(brief);
              return (
                <option key={brief.id} value={brief.id}>
                  {brief.title} - {progress.totalSubmissions} submissions - ${brief.totalRewardValue}
                </option>
              );
            })}
          </select>
        </div>

        {/* Tab Content */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">📋 Submissions</h2>
              <div className="text-sm text-gray-400">
                {filteredSubmissions.length} total submissions
              </div>
            </div>

            {/* Brief Progress */}
            {selectedBrief && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">📊 Brief Progress</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{getBriefProgress(selectedBrief).totalSubmissions}</div>
                    <div className="text-sm text-gray-400">Total Submissions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{getBriefProgress(selectedBrief).shortlistedCount}</div>
                    <div className="text-sm text-gray-400">Shortlisted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{getBriefProgress(selectedBrief).winnerCount}</div>
                    <div className="text-sm text-gray-400">Winners</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">${selectedBrief.totalRewardValue}</div>
                    <div className="text-sm text-gray-400">Total Reward Value</div>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getBriefProgress(selectedBrief).progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Progress: {getBriefProgress(selectedBrief).progressPercentage.toFixed(1)}% complete
                </p>
              </div>
            )}

            {/* Submissions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSubmissions
                .filter(sub => sub.status !== 'rejected') // Remove rejected submissions
                .map((submission) => (
                <div key={submission.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {submission.creator.fullName?.charAt(0) || submission.creator.userName?.charAt(0) || 'C'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {submission.creator.fullName || submission.creator.userName}
                        </h3>
                        <p className="text-sm text-gray-400">{submission.creator.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                        submission.status === 'winner' ? 'bg-green-900 text-green-300' :
                        submission.status === 'shortlisted' ? 'bg-blue-900 text-blue-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {submission.status}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Submission Content:</p>
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <p className="text-white text-sm">{submission.content || 'No content provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </span>
                    
                    <div className="flex space-x-2">
                      {submission.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleSubmissionStatusChange(submission.id, 'shortlisted')}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            ✅ Shortlist
                          </button>
                          <button
                            onClick={() => handleSubmissionStatusChange(submission.id, 'rejected')}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}
                      
                      {submission.status === 'shortlisted' && (
                        <>
                          <button
                            onClick={() => handleSelectWinner(submission.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            🏆 Select Winner
                          </button>
                          <button
                            onClick={() => handleSubmissionStatusChange(submission.id, 'rejected')}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}

                      {submission.status === 'winner' && (
                        <div className="text-green-400 text-sm">🏆 Winner Selected</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">🏆 Rewards & Payments</h2>
              <div className="flex items-center space-x-4">
                {pendingWinners.length > 0 && (
                  <>
                    <button
                      onClick={() => setBulkPaymentMode(!bulkPaymentMode)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        bulkPaymentMode 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {bulkPaymentMode ? 'Cancel Bulk Payment' : '💳 Bulk Payment'}
                    </button>
                    {bulkPaymentMode && selectedWinnersForBulk.length > 0 && (
                      <button
                        onClick={handleBulkPayment}
                        disabled={paymentProcessing}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {paymentProcessing ? 'Processing...' : `Pay ${selectedWinnersForBulk.length} Winners ($${getTotalPendingAmount()})`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Payment Summary */}
            {filteredWinners.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">💰 Payment Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{filteredWinners.length}</div>
                    <div className="text-sm text-gray-400">Total Winners</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{pendingWinners.length}</div>
                    <div className="text-sm text-gray-400">Pending Payment</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{paidWinners.length}</div>
                    <div className="text-sm text-gray-400">Paid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">${getTotalPendingAmount()}</div>
                    <div className="text-sm text-gray-400">Total Pending</div>
                  </div>
                </div>
              </div>
            )}
            
            {filteredWinners.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-xl font-semibold mb-2">No Winners Yet</h3>
                <p className="text-gray-400">Select winners from the submissions tab to see them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredWinners.map((winner) => (
                  <div key={winner.id} className={`rounded-lg p-6 border ${
                    winner.status === 'paid' 
                      ? 'bg-gradient-to-r from-green-900 to-green-800 border-green-600' 
                      : winner.status === 'processing'
                      ? 'bg-gradient-to-r from-yellow-900 to-yellow-800 border-yellow-600'
                      : 'bg-gradient-to-r from-gray-900 to-gray-800 border-gray-600'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          winner.status === 'paid' ? 'bg-green-600' :
                          winner.status === 'processing' ? 'bg-yellow-600' :
                          'bg-gray-600'
                        }`}>
                          <span className="text-white text-xl">
                            {winner.status === 'paid' ? '✅' : winner.status === 'processing' ? '⏳' : '🏆'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">
                            {winner.creator.fullName || winner.creator.userName}
                          </h3>
                          <p className={`text-sm ${
                            winner.status === 'paid' ? 'text-green-300' :
                            winner.status === 'processing' ? 'text-yellow-300' :
                            'text-gray-300'
                          }`}>
                            {winner.position === 1 ? '1st Place' : 
                             winner.position === 2 ? '2nd Place' : 
                             winner.position === 3 ? '3rd Place' : 
                             `${winner.position}th Place`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-green-400">
                          ${winner.reward?.cashAmount || 0}
                        </span>
                        <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                          winner.status === 'paid' ? 'bg-green-900 text-green-300' : 
                          winner.status === 'processing' ? 'bg-yellow-900 text-yellow-300' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {winner.status === 'paid' ? 'Paid' : 
                           winner.status === 'processing' ? 'Processing' :
                           'Pending Payment'}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className={`text-sm mb-2 ${
                        winner.status === 'paid' ? 'text-green-300' :
                        winner.status === 'processing' ? 'text-yellow-300' :
                        'text-gray-300'
                      }`}>Reward Details:</p>
                      <div className={`p-3 rounded-lg ${
                        winner.status === 'paid' ? 'bg-green-800/50' :
                        winner.status === 'processing' ? 'bg-yellow-800/50' :
                        'bg-gray-700'
                      }`}>
                        <p className={`text-sm ${
                          winner.status === 'paid' ? 'text-green-200' :
                          winner.status === 'processing' ? 'text-yellow-200' :
                          'text-gray-200'
                        }`}>
                          Cash: ${winner.reward?.cashAmount || 0} | 
                          Credits: {winner.reward?.creditAmount || 0} | 
                          Prize: {winner.reward?.prizeDescription || 'None'}
                        </p>
                      </div>
                    </div>

                    {/* Payment Details */}
                    {winner.paymentDetails && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-300 mb-2">Payment Details:</p>
                        <div className="bg-gray-700 p-3 rounded-lg">
                          <p className="text-gray-200 text-sm">
                            Transaction ID: {winner.paymentDetails.transactionId || 'N/A'}<br/>
                            Method: {winner.paymentDetails.paymentMethod || 'N/A'}<br/>
                            Paid: {winner.paymentDetails.paidAt ? new Date(winner.paymentDetails.paidAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${
                        winner.status === 'paid' ? 'text-green-300' :
                        winner.status === 'processing' ? 'text-yellow-300' :
                        'text-gray-300'
                      }`}>
                        {new Date(winner.selectedAt).toLocaleDateString()}
                      </span>
                      
                      {winner.status === 'pending' && (
                        <div className="flex items-center space-x-2">
                          {bulkPaymentMode && (
                            <input
                              type="checkbox"
                              checked={selectedWinnersForBulk.includes(winner.id)}
                              onChange={() => handleWinnerSelectionForBulk(winner.id)}
                              className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                            />
                          )}
                          <button
                            onClick={() => handleProcessPayment(winner.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            💳 Process Payment
                          </button>
                        </div>
                      )}
                      
                      {winner.status === 'paid' && (
                        <div className="text-green-300 text-sm">✅ Payment Completed</div>
                      )}

                      {winner.status === 'processing' && (
                        <div className="text-yellow-300 text-sm">⏳ Payment Processing</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stripe Payment Modal */}
      {showStripePayment && selectedPaymentWinner && (
        <StripePaymentIntegration
          amount={selectedPaymentWinner.reward?.cashAmount || 0}
          recipientName={selectedPaymentWinner.creator.fullName || selectedPaymentWinner.creator.userName}
          winnerId={selectedPaymentWinner.id}
          briefId={selectedPaymentWinner.briefId}
          creatorId={selectedPaymentWinner.creatorId}
          onSuccess={handleStripePaymentSuccess}
          onError={handleStripePaymentError}
          onCancel={handleStripePaymentCancel}
        />
      )}
    </div>
  );
};

export default RewardsPaymentPage;
