import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DefaultAvatar from './DefaultAvatar';
import AnimatedNotification from './AnimatedNotification';
import CreatorWallet from './CreatorWallet';
import BriefCard from './BriefCard';
import BriefDetailsModal from './BriefDetailsModal';

import NotificationBell from './NotificationBell';
import SettingsButton from './SettingsButton';
import SettingsModal from './SettingsModal';
import Logo from './Logo';




interface Brief {
  id: string;
  title: string;
  description: string;
  brandName: string;
  reward: number;
  rewardType?: 'CASH' | 'CREDIT' | 'PRIZES';
  amountOfWinners: number;
  totalRewardsPaid: number;
  location?: string;
  deadline: string;
  status: 'active' | 'draft' | 'completed';
  brand: {
    id: string;
    companyName: string;
    logo?: string;
    socialInstagram?: string;
    socialTwitter?: string;
    socialLinkedIn?: string;
    socialWebsite?: string;
  };
  submissions: Array<{
    id: string;
    creator: {
      userName: string;
    };
  }>;
  winnerRewards?: Array<{
    position: number;
    cashAmount: number;
    creditAmount: number;
    prizeDescription: string;
  }>;
}

interface Submission {
  id: string;
  briefTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  amount: number;
}



interface Earning {
  id: string;
  briefTitle: string;
  amount: number;
  status: 'paid' | 'pending' | 'processing';
  paidAt?: string;
}

const CreatorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [availableBriefs, setAvailableBriefs] = useState<Brief[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSubmissionViewModal, setShowSubmissionViewModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showBriefDetailsModal, setShowBriefDetailsModal] = useState(false);
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  
  // Recent activity carousel
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);

  const [submissionDetails, setSubmissionDetails] = useState<{
    id: string;
    content: string;
    files: string;
    amount: number;
    status: string;
    submittedAt: string;
    brief?: {
      id: string;
      title: string;
      brandName: string;
      deadline: string;
    };
  } | null>(null);

  const [applyFormData, setApplyFormData] = useState({
    contentUrl: ''
  });
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successNotification, setSuccessNotification] = useState({
    title: '',
    message: '',
    icon: ''
  });

  const [metrics, setMetrics] = useState({
    activeBriefs: 0,
    submissionsThisWeek: 0,
    approvedSubmissions: 0,
    totalEarnings: 0,
    avgSubmissions: 0
  });

  useEffect(() => {
    // Fetch data from API
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // No token found, user not authenticated
        return;
      }

      // Fetch available briefs
      const briefsResponse = await fetch('/api/creators/briefs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let briefsData = [];
      if (briefsResponse.ok) {
        briefsData = await briefsResponse.json();
        setAvailableBriefs(briefsData);
      } else {
        // Failed to fetch briefs
      }

      // Fetch submissions
      const submissionsResponse = await fetch('/api/creators/submissions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let submissionsData = [];
      if (submissionsResponse.ok) {
        submissionsData = await submissionsResponse.json();
        setMySubmissions(submissionsData);
      }



      // Fetch earnings
      const earningsResponse = await fetch('/api/creators/earnings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let earningsData = [];
      if (earningsResponse.ok) {
        earningsData = await earningsResponse.json();
        setEarnings(earningsData);
      }

      // Calculate metrics with the fetched data
      const approvedSubmissions = submissionsData.filter((s: Submission) => s.status === 'approved').length;
      const totalEarnings = earningsData.reduce((sum: number, earning: Earning) => sum + earning.amount, 0);
      const submissionsThisWeek = submissionsData.filter((s: Submission) => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(s.submittedAt) > weekAgo;
      }).length;
      
      setMetrics({
        activeBriefs: briefsData.length,
        submissionsThisWeek,
        approvedSubmissions,
        totalEarnings,
        avgSubmissions: submissionsData.length
      });
    } catch (error) {
      // Error fetching dashboard data
    }
  };



  // Search functionality placeholder
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality can be implemented here if needed
  };

  // Recent activity carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivityIndex(prev => 
        prev >= availableBriefs.length - 1 ? 0 : prev + 1
      );
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [availableBriefs.length]);

  const getRecentActivities = () => {
    return availableBriefs.slice(0, 4).map((brief, _index) => ({
      id: brief.id,
      title: brief.title,
      brand: brief.brandName,
      type: 'brief',
      time: `${Math.floor(Math.random() * 10) + 1}m ago`,
      icon: '📋'
    }));
  };



  const handleViewSubmission = async (submission: Submission) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please log in again.');
        return;
      }

      const response = await fetch(`/api/creators/submissions/${submission.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const details = await response.json();
        setSubmissionDetails(details);
        setSelectedSubmission(submission);
        setShowSubmissionViewModal(true);
      } else {
        alert('Failed to load submission details');
      }
    } catch (error) {
      alert('Error loading submission details');
    }
  };



  const handleDeleteSubmission = async (submission: Submission) => {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please log in again.');
        return;
      }



      const response = await fetch(`/api/creators/submissions/${submission.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Refresh data
        fetchDashboardData();
        
        // Show animated success notification
        setSuccessNotification({
          title: 'Submission Deleted! 🗑️',
          message: 'Your submission has been deleted successfully.',
          icon: '🗑️'
        });
        setShowSuccessNotification(true);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete submission: ${errorData.error || 'Please try again.'}`);
      }
    } catch (error) {
      alert('Error deleting submission. Please try again.');
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBrief) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please log in again.');
        return;
      }

      // Check if this is an edit or new application
      const existingSubmission = getExistingSubmission(selectedBrief.id);
      const isEdit = !!existingSubmission;



      let response;
      if (isEdit) {
        // Update existing submission
        response = await fetch(`/api/creators/submissions/${existingSubmission.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contentUrl: applyFormData.contentUrl
          })
        });
      } else {
        // Create new submission
        response = await fetch(`/api/briefs/${selectedBrief.id}/apply`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contentUrl: applyFormData.contentUrl,
            amount: selectedBrief.reward.toString()
          })
        });
      }



      if (response.ok) {
        // Refresh data
        fetchDashboardData();
        setShowApplyModal(false);
        setSelectedBrief(null);
        setApplyFormData({ contentUrl: '' });
        
        // Show animated success notification
        setSuccessNotification({
          title: isEdit ? 'Application Updated! ✏️' : 'Application Submitted! 🚀',
          message: isEdit ? 'Your application has been updated successfully!' : 'Your application has been sent to the brand. Good luck!',
          icon: isEdit ? '✏️' : '📤'
        });
        setShowSuccessNotification(true);
      } else {
        // Failed to submit application
        const errorData = await response.json();
        alert(`Failed to ${isEdit ? 'update' : 'submit'} application: ${errorData.error || 'Please try again.'}`);
      }
    } catch (error) {
      // Error submitting application
      alert('Error submitting application. Please try again.');
    }
  };





  // Helper function to check if user has already submitted to a brief
  const hasSubmittedToBrief = (briefId: string) => {
    return mySubmissions.some(submission => 
      submission.briefTitle === availableBriefs.find(b => b.id === briefId)?.title
    );
  };

  // Helper function to get submission status for a brief
  const getSubmissionStatus = (briefId: string) => {
    const brief = availableBriefs.find(b => b.id === briefId);
    if (!brief) return null;
    
    const submission = mySubmissions.find(s => s.briefTitle === brief.title);
    return submission ? submission.status : null;
  };

  // Helper function to get existing submission data for a brief
  const getExistingSubmission = (briefId: string) => {
    const brief = availableBriefs.find(b => b.id === briefId);
    if (!brief) return null;
    
    return mySubmissions.find(s => s.briefTitle === brief.title);
  };

  const navigation = [
    { id: 'overview', label: 'Overview', icon: 'overview' },
    { id: 'briefs', label: 'Available Briefs', icon: 'briefs' },
    { id: 'submissions', label: 'My Submissions', icon: 'submissions' },
    { id: 'earnings', label: 'Earnings', icon: 'payments' },
    { id: 'wallet', label: 'Wallet', icon: 'wallet' },
    { id: 'profile', label: 'Profile', icon: 'profile' },
  ];

  const accountNav = [
    { id: 'earnings', label: 'Earnings', icon: 'payments' },
    { id: 'settings', label: 'Settings', icon: 'settings', action: () => setShowSettingsModal(true) },
    { id: 'logout', label: 'Logout', icon: 'logout', action: logout },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
            Connect with Amazing Brands 🚀
          </h1>
        <p className="text-lg text-gray-300">
            Showcase your creativity and discover exciting opportunities with top brands worldwide.
          </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Earnings Card */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-400 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          <div className="text-white">
            <p className="text-3xl font-bold mb-2">$0</p>
            <p className="text-sm opacity-90">Total Earnings</p>
          </div>
        </div>

        {/* Submissions This Week Card */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          </div>
          <div className="text-white">
            <p className="text-3xl font-bold mb-2">{mySubmissions.filter(s => new Date(s.submittedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</p>
            <p className="text-sm opacity-90">Submissions This Week</p>
          </div>
        </div>

        {/* Active Briefs Card */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
          <div className="text-white">
            <p className="text-3xl font-bold mb-2">{availableBriefs.length}</p>
            <p className="text-sm opacity-90">Active Briefs</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Briefs Section */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Available Briefs</h2>
              <span className="text-sm text-gray-400">{availableBriefs.length} available</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableBriefs.slice(0, 4).map((brief, _index) => {
                const briefForCard = {
                  ...brief,
                  brand: {
                    id: brief.id,
                    companyName: brief.brandName || 'Brand',
                    logo: undefined
                  }
                };
                
                return (
                  <div key={brief.id} className="relative">
                    <BriefCard 
                      brief={briefForCard} 
                      onApplyClick={(brief) => {
                        setSelectedBriefId(brief.id);
                        setShowBriefDetailsModal(true);
                      }}
                    />
                    {hasSubmittedToBrief(brief.id) && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getSubmissionStatus(brief.id) === 'approved' ? 'bg-emerald-900/20 text-emerald-400' :
                          getSubmissionStatus(brief.id) === 'rejected' ? 'bg-red-900/20 text-red-400' :
                          'bg-yellow-900/20 text-yellow-400'
                        }`}>
                          {getSubmissionStatus(brief.id) === 'approved' ? 'Approved' :
                           getSubmissionStatus(brief.id) === 'rejected' ? 'Rejected' :
                           'Pending Review'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {availableBriefs.length > 4 && (
              <div className="mt-6 text-center">
              <button
                  onClick={() => setActiveTab('briefs')}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                  View All Briefs →
              </button>
            </div>
            )}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 h-fit">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Live Activity</h3>
                <p className="text-xs text-gray-400">Real-time brief updates</p>
              </div>
              <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-emerald-500 font-semibold">LIVE</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {getRecentActivities().slice(0, 5).map((activity, index) => (
                  <div 
                    key={activity.id}
                  className={`p-3 rounded-lg border border-gray-700 transition-all duration-300 ${
                      index === currentActivityIndex 
                      ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/50' 
                      : 'bg-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        index === currentActivityIndex 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
                        : 'bg-gray-700 text-gray-300'
                      }`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                          {activity.title}
                        </p>
                      <p className="text-xs text-gray-400 mt-1">
                          New brief from {activity.brand}
                        </p>
                      </div>
                      <div className="text-right">
                      <span className="text-xs text-gray-500 font-medium">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>


    </div>
  );

  const renderBriefs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Available Briefs</h2>
        <div className="flex space-x-2">
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Refresh
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Sort by Reward
          </button>
        </div>
      </div>

      {availableBriefs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-white mb-2">No available briefs</h3>
          <p className="text-gray-300 mb-6">
            There are currently no active briefs available. Check back later for new opportunities!
          </p>
          <button 
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableBriefs.map((brief) => {
            // Transform the brief data to match BriefCard interface
            const briefForCard = {
              ...brief,
              description: brief.description || '',
              amountOfWinners: brief.amountOfWinners || 1,
              totalRewardsPaid: brief.totalRewardsPaid || 0,

              brand: {
                id: brief.brand?.id || '',
                companyName: brief.brandName || brief.brand?.companyName || '',
                logo: brief.brand?.logo,
                socialInstagram: brief.brand?.socialInstagram,
                socialTwitter: brief.brand?.socialTwitter,
                socialLinkedIn: brief.brand?.socialLinkedIn,
                socialWebsite: brief.brand?.socialWebsite
              },
              submissions: brief.submissions || []
            };
            
            return (
              <div key={brief.id} className="relative">
                <BriefCard 
                  brief={briefForCard} 
                  onApplyClick={(brief) => {
                    setSelectedBriefId(brief.id);
                    setShowBriefDetailsModal(true);
                  }}
                />
                {hasSubmittedToBrief(brief.id) && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      getSubmissionStatus(brief.id) === 'approved' ? 'bg-emerald-900/20 text-emerald-400' :
                      getSubmissionStatus(brief.id) === 'rejected' ? 'bg-red-900/20 text-red-400' :
                      'bg-yellow-900/20 text-yellow-400'
                    }`}>
                      {getSubmissionStatus(brief.id) === 'approved' ? 'Approved' :
                       getSubmissionStatus(brief.id) === 'rejected' ? 'Rejected' :
                       'Pending Review'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* View Brief Modal */}
      {showViewModal && selectedBrief && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{selectedBrief.title}</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-300 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium text-white">Brand:</span>
                <span className="text-gray-300">{selectedBrief.brandName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-white">Reward Type:</span>
                <span className="text-gray-300">{selectedBrief.rewardType === 'CASH' ? 'Cash' : 
                       selectedBrief.rewardType === 'CREDIT' ? 'Credit' :
                       selectedBrief.rewardType === 'PRIZES' ? 'Prize' :
                       'Cash'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-white">Spots:</span>
                <span className="text-gray-300">{selectedBrief.amountOfWinners !== null && selectedBrief.amountOfWinners !== undefined ? selectedBrief.amountOfWinners : 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-white">Deadline:</span>
                <span className="text-gray-300">{new Date(selectedBrief.deadline).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-white">Status:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedBrief.status === 'active' ? 'bg-emerald-900/20 text-emerald-400' :
                                      selectedBrief.status === 'draft' ? 'bg-yellow-900/20 text-yellow-400' :
                    'bg-gray-700 text-gray-300'
                }`}>
                  {selectedBrief.status.charAt(0).toUpperCase() + selectedBrief.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Detailed Reward Information */}
            {selectedBrief.winnerRewards && selectedBrief.winnerRewards.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-[#00FF85] to-[#00C853] rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-3">🏆 Reward Breakdown</h4>
                <div className="space-y-3">
                  {selectedBrief.winnerRewards.map((reward, index) => (
                    <div key={index} className="bg-gray-800/20 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-white">
                                              {reward.position === 1 ? '🥇 1st Spot' :
                      reward.position === 2 ? '🥈 2nd Spot' :
                      reward.position === 3 ? '🥉 3rd Spot' :
                      `${reward.position}th Spot`}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-white">
                        {reward.cashAmount > 0 && (
                          <p>💰 Cash: ${reward.cashAmount.toLocaleString()}</p>
                        )}
                        {reward.creditAmount > 0 && (
                          <p>🎫 Credits: {reward.creditAmount.toLocaleString()}</p>
                        )}
                        {reward.prizeDescription && (
                          <p>🎁 Prize: {reward.prizeDescription}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && selectedBrief && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {hasSubmittedToBrief(selectedBrief.id) ? 'Edit Submission' : 'Apply to'} {selectedBrief.title}
              </h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-gray-500 hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitApplication} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content Submission link:
                </label>
                <input
                  type="url"
                  value={applyFormData.contentUrl}
                  onChange={(e) => setApplyFormData(prev => ({ ...prev, contentUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://drive.google.com/file/d/... or https://www.youtube.com/watch?v=..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste a link to your content (Google Drive, YouTube, Instagram, etc.)
                </p>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">Brief Summary</h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <p><strong>Brand:</strong> {selectedBrief.brandName}</p>
                  <p><strong>Reward:</strong> {selectedBrief.rewardType === 'CASH' ? 'Cash' : 
                       selectedBrief.rewardType === 'CREDIT' ? 'Credit' :
                       selectedBrief.rewardType === 'PRIZES' ? 'Prize' :
                       'Cash'}</p>
                  <p><strong>Spots:</strong> {selectedBrief.amountOfWinners !== null && selectedBrief.amountOfWinners !== undefined ? selectedBrief.amountOfWinners : 1}</p>
                  <p><strong>Deadline:</strong> {new Date(selectedBrief.deadline).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {hasSubmittedToBrief(selectedBrief.id) ? 'Update Submission' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderSubmissions = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">My Submissions</h2>
      <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl rounded-lg shadow-sm border border-white/20 dark:border-gray-600/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-700/30 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Brief</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white/5 dark:bg-gray-800/10 divide-y divide-white/10 dark:divide-gray-700/30">
              {mySubmissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DefaultAvatar name={user?.fullName || 'Creator'} size="sm" className="mr-3" />
                      <span className="text-sm font-medium text-white">{submission.briefTitle}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${submission.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      submission.status === 'approved' ? 'bg-emerald-900/20 text-emerald-400' :
                      submission.status === 'rejected' ? 'bg-red-900/20 text-red-400' :
                      'bg-yellow-900/20 text-yellow-400'
                    }`}>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleViewSubmission(submission)}
                      className="text-emerald-500 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mr-3"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleDeleteSubmission(submission)}
                      disabled={submission.status === 'approved' || submission.status === 'rejected'}
                      className={`${
                        submission.status === 'approved' || submission.status === 'rejected'
                          ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300'
                      }`}
                      title={
                        submission.status === 'approved' || submission.status === 'rejected'
                          ? 'Cannot delete approved or rejected submissions'
                          : 'Delete submission'
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );



  const renderEarnings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Earnings</h2>
      
      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/20 backdrop-blur-xl p-6 rounded-lg shadow-sm border border-gray-600/30">
          <h3 className="text-lg font-semibold text-white">Total Earnings</h3>
          <p className="text-3xl font-bold text-emerald-500">${metrics.totalEarnings}</p>
        </div>
        <div className="bg-gray-800/20 backdrop-blur-xl p-6 rounded-lg shadow-sm border border-gray-600/30">
          <h3 className="text-lg font-semibold text-white">This Month</h3>
          <p className="text-3xl font-bold text-emerald-500">${earnings.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0)}</p>
        </div>
        <div className="bg-gray-800/20 backdrop-blur-xl p-6 rounded-lg shadow-sm border border-gray-600/30">
          <h3 className="text-lg font-semibold text-white">Pending</h3>
          <p className="text-3xl font-bold text-yellow-400">${earnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0)}</p>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="bg-gray-800/20 backdrop-blur-xl rounded-lg shadow-sm border border-gray-600/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-700/30 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Brief</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Paid Date</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800/10 divide-y divide-gray-700/30">
              {earnings.map((earning) => (
                <tr key={earning.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {earning.briefTitle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${earning.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      earning.status === 'paid' ? 'bg-emerald-900/20 text-emerald-400' :
                      earning.status === 'pending' ? 'bg-yellow-900/20 text-yellow-400' :
                      'bg-blue-900/20 text-blue-400'
                    }`}>
                      {earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {earning.paidAt ? new Date(earning.paidAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Profile</h2>
      
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <DefaultAvatar name={user?.fullName || user?.userName || 'Creator'} size="xl" className="mr-4" />
          <div>
            <h3 className="text-xl font-semibold text-white">{user?.fullName || 'Creator Name'}</h3>
            <p className="text-gray-300">@{user?.userName || 'username'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-white mb-3">Personal Information</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300">Full Name</label>
                <input type="text" defaultValue={user?.fullName || ''} className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Username</label>
                <input type="text" defaultValue={user?.userName || ''} className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <input type="email" defaultValue={user?.email || ''} className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Social Media</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300">Instagram</label>
                <input type="text" placeholder="@username" className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">TikTok</label>
                <input type="text" placeholder="@username" className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">YouTube</label>
                <input type="text" placeholder="Channel URL" className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'briefs':
        return renderBriefs();
      case 'submissions':
        return renderSubmissions();

      case 'earnings':
        return renderEarnings();
      case 'wallet':
        return <CreatorWallet />;
      case 'profile':
        return renderProfile();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col lg:flex-row transition-colors duration-300 relative overflow-hidden font-sans">
      {/* Sophisticated Background with Glass-morphism */}
      <div className="absolute inset-0">
        {/* Primary dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        
        {/* Subtle neon green lighting effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-400/15 via-transparent to-green-600/8 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-green-500/8 via-transparent to-green-400/4 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/4 via-transparent to-green-500/10 animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Floating glass panels with mirror-like effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-64 bg-gradient-to-br from-gray-900/30 to-gray-800/20 backdrop-blur-xl border border-green-500/15 rounded-2xl opacity-15 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-48 bg-gradient-to-br from-gray-900/25 to-gray-800/30 backdrop-blur-xl border border-purple-500/15 rounded-2xl opacity-12 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-56 bg-gradient-to-br from-gray-900/28 to-gray-800/18 backdrop-blur-xl border border-pink-500/15 rounded-2xl opacity-14 animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Subtle moving elements */}
        <div className="absolute top-1/6 right-1/6 w-3 h-3 bg-green-400 rounded-full opacity-30 animate-bounce" style={{animation: 'float 8s ease-in-out infinite'}}></div>
        <div className="absolute bottom-1/3 left-1/6 w-2 h-2 bg-purple-400 rounded-full opacity-25 animate-bounce" style={{animation: 'float 6s ease-in-out infinite 1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-pink-400 rounded-full opacity-28 animate-bounce" style={{animation: 'float 7s ease-in-out infinite 2s'}}></div>
        
        {/* CSS Animations */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes float {
              0%, 100% { transform: translateY(0px) translateX(0px); }
              25% { transform: translateY(-10px) translateX(5px); }
              50% { transform: translateY(-20px) translateX(-3px); }
              75% { transform: translateY(-10px) translateX(-5px); }
            }
          `
        }} />
      </div>
      
      {/* Content Container */}
      <div className="relative z-10 flex flex-col lg:flex-row w-full">
      {/* Mobile Header */}
      <div className="lg:hidden bg-black border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
                          <Logo size="sm" className="mr-3 drop-shadow-[0_0_4px_rgba(34,197,94,0.3)]" />
            <span className="font-bold text-lg text-white">{user?.userName || 'Creator'}</span>
          </div>
                      <div className="flex items-center space-x-3">
              <NotificationBell />
              <SettingsButton />
              <button
              onClick={() => setActiveTab(activeTab === 'mobile-menu' ? 'overview' : 'mobile-menu')}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        {activeTab === 'overview' && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search briefs, brands, or topics..."
              className="w-full pl-4 pr-10 py-2 text-sm border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-300"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Sidebar */}
      <div className={`${activeTab === 'mobile-menu' ? 'block' : 'hidden'} lg:block w-full lg:w-72 bg-black backdrop-blur-xl border-r border-gray-800 text-white lg:min-h-screen shadow-2xl`}>
        <div className="p-4 lg:p-6">
          
          {/* Logo Section */}
          <div className="flex items-center justify-start mb-6 lg:mb-8">
            <div className="relative">
              <Logo size="md" className="drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
            </div>
          </div>

          {/* Main Navigation */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Discover</h3>
            <nav className="space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200 group ${
                    activeTab === item.id
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                  title={item.label}
                >
                  <span className={`mr-3 transition-all duration-200 ${
                    activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  }`}>
                    <img 
                      src={`/icons/${item.icon}.png`} 
                      alt={item.label}
                      className="w-5 h-5"
                    />
                  </span>
                  <span className="text-sm font-normal">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Manage Section */}
          <div className="pt-6 border-t border-gray-800">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Manage</h3>
            <nav className="space-y-2">
              {accountNav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200 group ${
                    activeTab === item.id
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                  title={item.label}
                >
                  <span className={`mr-3 transition-all duration-200 ${
                    activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  }`}>
                    <img 
                      src={`/icons/${item.icon}.png`} 
                      alt={item.label}
                      className="w-5 h-5"
                    />
                  </span>
                  <span className="text-sm font-normal">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* User Info Section */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="flex items-center px-3 py-3 rounded-lg bg-gray-800">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                <span className="text-white font-medium text-sm">
                  {user?.fullName?.charAt(0) || user?.userName?.charAt(0) || 'C'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.fullName || user?.userName || 'Creator Account'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email || 'creator@example.com'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-900/30 backdrop-blur-sm">
        {/* Desktop Header */}
        <div className="hidden lg:block bg-black border-b border-gray-800 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-bold text-white">
                {activeTab === 'overview' ? 'Dashboard' : 
                 activeTab === 'briefs' ? 'Available Briefs' :
                 activeTab === 'submissions' ? 'My Submissions' :
                 activeTab === 'earnings' ? 'Earnings' :
                 activeTab === 'wallet' ? 'Wallet' :
                 activeTab === 'profile' ? 'Profile' : 'Dashboard'}
              </h1>
              
              {/* Search Bar */}
              {activeTab === 'overview' && (
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search briefs, brands, or topics..."
                    className="w-80 pl-4 pr-10 py-2 text-sm border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-300"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <SettingsButton />
              <DefaultAvatar name={user?.fullName || user?.userName || 'Creator'} size="md" />
            </div>
          </div>
        </div>
        
        <div className="p-4 lg:p-8">
          {renderContent()}
        </div>
      </div>

      {/* Animated Notifications */}
      {showSuccessNotification && (
        <AnimatedNotification
          message={successNotification.message}
          type="success"
          onClose={() => setShowSuccessNotification(false)}
        />
      )}

      {/* Submission View Modal */}
      {showSubmissionViewModal && selectedSubmission && submissionDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Submission Details</h3>
            <button
              onClick={() => setShowSubmissionViewModal(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-300 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-white mb-2">Brief Information</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <p><strong>Brief Title:</strong> {selectedSubmission.briefTitle}</p>
                <p><strong>Amount:</strong> ${selectedSubmission.amount}</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedSubmission.status === 'approved' ? 'bg-emerald-900/20 text-emerald-400' :
                    selectedSubmission.status === 'rejected' ? 'bg-red-900/20 text-red-400' :
                    'bg-yellow-900/20 text-yellow-400'
                  }`}>
                    {selectedSubmission.status.charAt(0).toUpperCase() + selectedSubmission.status.slice(1)}
                  </span>
                </p>
                <p><strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
              </div>
            </div>

            {submissionDetails.files && (
              <div>
                <h4 className="font-medium text-white mb-2">Content Submission Link</h4>
                <div className="bg-gray-700 p-3 rounded border border-gray-600">
                  <a 
                    href={submissionDetails.files} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm break-all"
                  >
                    {submissionDetails.files}
                  </a>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSubmissionViewModal(false)}
                className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Brief Details Modal */}
      <BriefDetailsModal
        briefId={selectedBriefId}
        isOpen={showBriefDetailsModal}
        onClose={() => {
          setShowBriefDetailsModal(false);
          setSelectedBriefId(null);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
      </div>
    </div>
  );
};

export default CreatorDashboard; 