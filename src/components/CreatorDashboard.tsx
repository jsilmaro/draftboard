import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DefaultAvatar from './DefaultAvatar';
import AnimatedNotification from './AnimatedNotification';
import CreatorWallet from './CreatorWallet';
import BriefCard from './BriefCard';
import BriefDetailsModal from './BriefDetailsModal';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';


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
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Brief[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
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

  // const handleViewBrief = (brief: Brief) => {
  //   setSelectedBrief(brief);
  //   setShowViewModal(true);
  // };

  // const handleApplyToBrief = (brief: Brief) => {
  //   setSelectedBrief(brief);
    
  //   // Check if user has already submitted to this brief
  //   const existingSubmission = getExistingSubmission(brief.id);
    
  //   if (existingSubmission) {
  //     // This is an edit - load existing data
  //     // We'll need to fetch the full submission details
  //     fetchSubmissionDetails(existingSubmission.id);
  //   } else {
  //     // This is a new application - clear form
  //     setApplyFormData({ contentUrl: '' });
  //     setShowApplyModal(true);
  //   }
  // };

  // Search functionality
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/briefs/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        // Fallback to client-side search
        const filtered = availableBriefs.filter(brief => 
          brief.title.toLowerCase().includes(query.toLowerCase()) ||
          brief.description.toLowerCase().includes(query.toLowerCase()) ||
          brief.brandName.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      // Fallback to client-side search
      const filtered = availableBriefs.filter(brief => 
        brief.title.toLowerCase().includes(query.toLowerCase()) ||
        brief.description.toLowerCase().includes(query.toLowerCase()) ||
        brief.brandName.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    }
    
    setIsSearching(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
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

  // const fetchSubmissionDetails = async (submissionId: string) => {
  //   try {
  //     const token = localStorage.getItem('token');
  //     if (!token) return;

  //     const response = await fetch(`/api/creators/submissions/${submissionId}`, {
  //       headers: {
  //         'Authorization': `Bearer ${token}`
  //       }
  //     });

  //     if (response.ok) {
  //       const submissionData = await response.json();
  //       setApplyFormData({
  //         contentUrl: submissionData.files || ''
  //       });
        
  //       // Update the selectedBrief with the complete brief information
  //       if (submissionData.brief) {
  //         setSelectedBrief({
  //           id: submissionData.brief.id,
  //           title: submissionData.brief.title,
  //           description: submissionData.brief.description || '',
  //           brandName: submissionData.brief.brandName || '',
  //           reward: submissionData.amount,
  //           amountOfWinners: 1,
  //           totalRewardsPaid: 0,
  //           deadline: submissionData.brief.deadline || new Date().toISOString(),
  //           status: 'active',
  //           brand: {
  //             id: submissionData.brief.brandId || '',
  //             companyName: submissionData.brief.brandName || '',
  //             logo: undefined
  //           },
  //           submissions: []
  //         });
  //       }
        
  //       setShowApplyModal(true);
  //     } else {
  //       // Fallback to empty form
  //       setApplyFormData({ contentUrl: '' });
  //       setShowApplyModal(true);
  //     }
  //   } catch (error) {
  //     // Fallback to empty form
  //     setApplyFormData({ contentUrl: '' });
  //     setShowApplyModal(true);
  //   }
  // };

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
    { id: 'overview', label: 'Overview', icon: '❤️' },
    { id: 'briefs', label: 'Available Briefs', icon: '📄' },
    { id: 'submissions', label: 'My Submissions', icon: '📚' },
    { id: 'earnings', label: 'Earnings', icon: '💰' },
    { id: 'wallet', label: 'Wallet', icon: '💳' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  const accountNav = [
    { id: 'earnings', label: 'Earnings', icon: '💰' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'logout', label: 'Logout', icon: '🚪', action: logout },
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Hero Section with Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="flex-1">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Connect with Amazing Brands 🚀
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Showcase your creativity and discover exciting opportunities with top brands worldwide.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything..."
                className="w-full pl-4 pr-12 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Live Activity Feed */}
        <div className="lg:w-96">
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Live Activity</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Real-time brief updates</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 dark:text-green-400 font-semibold">LIVE</span>
              </div>
            </div>
            
            <div className="relative overflow-hidden">
              <div className="space-y-4">
                {getRecentActivities().map((activity, index) => (
                  <div 
                    key={activity.id}
                    className={`relative p-4 rounded-2xl border-2 transition-all duration-700 transform ${
                      index === currentActivityIndex 
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-blue-300 dark:border-blue-600 scale-105 shadow-lg' 
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 scale-100 shadow-sm'
                    } ${index === currentActivityIndex ? 'animate-slide-in' : ''}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-300 ${
                        index === currentActivityIndex 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          New brief from {activity.brand}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                          {activity.time}
                        </span>
                        {index === currentActivityIndex && (
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-1 animate-bounce"></div>
                        )}
                      </div>
                    </div>
                    {index === currentActivityIndex && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/20 dark:via-blue-900/20 to-transparent animate-pulse"></div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Flowing animation overlay */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-blue-50/10 dark:via-blue-900/10 to-transparent animate-flow-down pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Creator Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl p-8 border border-blue-200 dark:border-blue-700">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">💰</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            ${metrics.totalEarnings.toLocaleString()}
          </p>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Total Earnings</p>
        </div>
        <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl p-8 border border-green-200 dark:border-green-700">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">📝</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {metrics.submissionsThisWeek.toLocaleString()}
          </p>
          <p className="text-gray-600 dark:text-gray-400 font-medium">This Week</p>
        </div>
        <div className="text-center bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-3xl p-8 border border-orange-200 dark:border-orange-700">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🎯</span>
          </div>
          <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {metrics.activeBriefs.toLocaleString()}
          </p>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Active Briefs</p>
        </div>
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Search Results for &quot;{searchQuery}&quot;
          </h3>
          {isSearching ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((brief) => (
                <div key={brief.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">{brief.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{brief.brandName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">${brief.reward}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No results found.</p>
          )}
        </div>
      )}

      {/* Featured Opportunities */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Opportunities</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Handpicked briefs perfect for your skills</p>
          </div>
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl">
            View All &rarr;
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableBriefs.slice(0, 6).map((brief, index) => (
            <div key={brief.id} className="group cursor-pointer transform hover:scale-105 transition-all duration-300">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                {/* Gradient overlay */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    #{index + 1}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      ${brief.reward}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reward</p>
                  </div>
                </div>
                
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 text-lg">
                  {brief.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">
                  by {brief.brandName}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {brief.submissions.length} creators applied
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-400 text-sm">★★★★★</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">5.0</span>
                  </div>
                </div>
                
                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBriefs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Available Briefs</h2>
        <div className="flex space-x-2">
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No available briefs</h3>
          <p className="text-gray-600 mb-6">
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
                      getSubmissionStatus(brief.id) === 'approved' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                      getSubmissionStatus(brief.id) === 'rejected' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
                      'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedBrief.title}</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium text-gray-900 dark:text-white">Brand:</span>
                <span className="text-gray-700 dark:text-gray-300">{selectedBrief.brandName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-900 dark:text-white">Reward Type:</span>
                <span className="text-gray-700 dark:text-gray-300">{selectedBrief.rewardType === 'CASH' ? 'Cash' : 
                       selectedBrief.rewardType === 'CREDIT' ? 'Credit' :
                       selectedBrief.rewardType === 'PRIZES' ? 'Prize' :
                       'Cash'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-900 dark:text-white">Spots:</span>
                <span className="text-gray-700 dark:text-gray-300">{selectedBrief.amountOfWinners !== null && selectedBrief.amountOfWinners !== undefined ? selectedBrief.amountOfWinners : 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-900 dark:text-white">Deadline:</span>
                <span className="text-gray-700 dark:text-gray-300">{new Date(selectedBrief.deadline).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-900 dark:text-white">Status:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedBrief.status === 'active' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                  selectedBrief.status === 'draft' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
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
                    <div key={index} className="bg-white bg-opacity-20 p-3 rounded-lg">
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
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {hasSubmittedToBrief(selectedBrief.id) ? 'Edit Submission' : 'Apply to'} {selectedBrief.title}
              </h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitApplication} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Submission link:
                </label>
                <input
                  type="url"
                  value={applyFormData.contentUrl}
                  onChange={(e) => setApplyFormData(prev => ({ ...prev, contentUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="https://drive.google.com/file/d/... or https://www.youtube.com/watch?v=..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste a link to your content (Google Drive, YouTube, Instagram, etc.)
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Brief Summary</h4>
                <div className="space-y-2 text-sm text-gray-600">
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
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Submissions</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Brief</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {mySubmissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DefaultAvatar name={user?.fullName || 'Creator'} size="sm" className="mr-3" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{submission.briefTitle}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${submission.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      submission.status === 'approved' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                      submission.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
                      'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                    }`}>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleViewSubmission(submission)}
                      className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-3"
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
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Earnings</h2>
      
      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Earnings</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">${metrics.totalEarnings}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">This Month</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">${earnings.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">${earnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0)}</p>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brief</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {earnings.map((earning) => (
                <tr key={earning.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {earning.briefTitle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${earning.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      earning.status === 'paid' ? 'bg-green-100 text-green-800' :
                      earning.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
      <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <DefaultAvatar name={user?.fullName || user?.userName || 'Creator'} size="xl" className="mr-4" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{user?.fullName || 'Creator Name'}</h3>
            <p className="text-gray-600">@{user?.userName || 'username'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" defaultValue={user?.fullName || ''} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input type="text" defaultValue={user?.userName || ''} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" defaultValue={user?.email || ''} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Social Media</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Instagram</label>
                <input type="text" placeholder="@username" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">TikTok</label>
                <input type="text" placeholder="@username" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">YouTube</label>
                <input type="text" placeholder="Channel URL" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
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
    <div className="min-h-screen bg-white dark:bg-gray-900 flex transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 dark:bg-gray-700 text-white">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <DefaultAvatar name={user?.fullName || user?.userName || 'Creator'} size="md" className="mr-3" />
              <span className="font-bold text-lg">{user?.userName || 'Creator'}</span>
            </div>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
                title={item.label}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t border-gray-600">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Account</h3>
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
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                  title={item.label}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeTab === 'overview' ? 'Dashboard' : 
                 activeTab === 'briefs' ? 'Available Briefs' :
                 activeTab === 'submissions' ? 'My Submissions' :
                 activeTab === 'earnings' ? 'Earnings' :
                 activeTab === 'wallet' ? 'Wallet' :
                 activeTab === 'profile' ? 'Profile' : 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <ThemeToggle />
              <DefaultAvatar name={user?.fullName || user?.userName || 'Creator'} size="md" />
            </div>
          </div>
        </div>
        
        <div className="p-8">
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
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Submission Details</h3>
            <button
              onClick={() => setShowSubmissionViewModal(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Brief Information</h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p><strong>Brief Title:</strong> {selectedSubmission.briefTitle}</p>
                <p><strong>Amount:</strong> ${selectedSubmission.amount}</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedSubmission.status === 'approved' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                    selectedSubmission.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
                    'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                  }`}>
                    {selectedSubmission.status.charAt(0).toUpperCase() + selectedSubmission.status.slice(1)}
                  </span>
                </p>
                <p><strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
              </div>
            </div>

            {submissionDetails.files && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Content Submission Link</h4>
                <div className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
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
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
    </div>
  );
};

export default CreatorDashboard; 