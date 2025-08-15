import React, { useState, useEffect } from 'react';

interface Winner {
  id: string;
  position: number;
  selectedAt: string;
  creator: {
    id: string;
    fullName: string;
    userName: string;
    email: string;
  };
  reward: {
    id: string;
    cashAmount: number;
    creditAmount: number;
    prizeDescription: string;
  };
  payment?: {
    id: string;
    amount: number;
    status: string;
    paymentMethod: string;
    paidAt?: string;
  } | null;
  brief: {
    id: string;
    title: string;
  };
}

const PaymentManagement: React.FC = () => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/brands/winners', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWinners(data);
      }
    } catch (error) {
      // Error fetching winners
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPositionBadge = (position: number) => {
    switch (position) {
      case 1:
        return '🥇 1st Place';
      case 2:
        return '🥈 2nd Place';
      case 3:
        return '🥉 3rd Place';
      default:
        return `${position}th Place`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Payment Management</h2>
        <button
          onClick={fetchWinners}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Winners List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Winners Requiring Payment</h3>
        </div>
        
        <div className="overflow-hidden">
          {winners.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {winners.map((winner) => (
                <div key={winner.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">
                          {winner.position === 1 ? '🥇' : winner.position === 2 ? '🥈' : winner.position === 3 ? '🥉' : '🏆'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {winner.creator.fullName || winner.creator.userName}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {winner.brief.title} • {getPositionBadge(winner.position)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Selected on {new Date(winner.selectedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="mb-2">
                        {winner.reward.cashAmount > 0 && (
                          <p className="font-semibold text-green-600">
                            {formatCurrency(winner.reward.cashAmount)}
                          </p>
                        )}
                        {winner.reward.creditAmount > 0 && (
                          <p className="text-sm text-blue-600">
                            {winner.reward.creditAmount} Credits
                          </p>
                        )}
                        {winner.reward.prizeDescription && (
                          <p className="text-sm text-purple-600">
                            {winner.reward.prizeDescription}
                          </p>
                        )}
                      </div>
                      
                      {winner.payment ? (
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(winner.payment.status)}`}>
                          {winner.payment.status.charAt(0).toUpperCase() + winner.payment.status.slice(1)}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          Payment Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">🏆</div>
              <p className="text-gray-500">No winners requiring payment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentManagement;
