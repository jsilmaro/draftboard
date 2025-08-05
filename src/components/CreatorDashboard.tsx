import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DefaultAvatar from './DefaultAvatar';
import AnimatedNotification from './AnimatedNotification';

interface Brief {
  id: string;
  title: string;
  brandName: string;
  budget: number;
  deadline: string;
  status: 'active' | 'draft' | 'completed';
}

interface Submission {
  id: string;
  briefTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  amount: number;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  createdAt: string;
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
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);
  const [showEditPortfolioModal, setShowEditPortfolioModal] = useState(false);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null);
  const [applyFormData, setApplyFormData] = useState({
    content: '',
    files: [] as File[]
  });
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successNotification, setSuccessNotification] = useState({
    title: '',
    message: '',
    icon: ''
  });
  const [portfolioFormData, setPortfolioFormData] = useState({
    title: '',
    description: '',
    category: '',
    imageUrl: '',
    files: [] as File[]
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
        console.log('No token found, user not authenticated');
        return;
      }

      console.log('Fetching creator dashboard data with token:', token.substring(0, 20) + '...');

      // Fetch available briefs
      const briefsResponse = await fetch('/api/creators/briefs', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      let briefsData = [];
      if (briefsResponse.ok) {
        briefsData = await briefsResponse.json();
        setAvailableBriefs(briefsData);
        console.log('Available briefs fetched:', briefsData.length);
      } else {
        console.error('Failed to fetch briefs:', briefsResponse.status, briefsResponse.statusText);
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

      // Fetch portfolio
      const portfolioResponse = await fetch('/api/creators/portfolio', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let portfolioData = [];
      if (portfolioResponse.ok) {
        portfolioData = await portfolioResponse.json();
        setPortfolioItems(portfolioData);
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
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleViewBrief = (brief: Brief) => {
    setSelectedBrief(brief);
    setShowViewModal(true);
  };

  const handleApplyToBrief = (brief: Brief) => {
    setSelectedBrief(brief);
    setShowApplyModal(true);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBrief) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const formData = new FormData();
      formData.append('content', applyFormData.content);
      formData.append('amount', selectedBrief.budget.toString());
      
      // Add files if any
      applyFormData.files.forEach((file) => {
        formData.append(`files`, file);
      });

      const response = await fetch(`/api/briefs/${selectedBrief.id}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        // Refresh data
        fetchDashboardData();
        setShowApplyModal(false);
        setSelectedBrief(null);
        setApplyFormData({ content: '', files: [] });
        
        // Show animated success notification
        setSuccessNotification({
          title: 'Application Submitted! 🚀',
          message: 'Your application has been sent to the brand. Good luck!',
          icon: '📤'
        });
        setShowSuccessNotification(true);
      } else {
        console.error('Failed to submit application');
        alert('Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setApplyFormData(prev => ({
        ...prev,
        files: Array.from(e.target.files || [])
      }));
    }
  };

  const handleAddPortfolioItem = () => {
    setShowAddPortfolioModal(true);
    setPortfolioFormData({
      title: '',
      description: '',
      category: '',
      imageUrl: '',
      files: []
    });
  };

  const handleEditPortfolioItem = (item: PortfolioItem) => {
    setSelectedPortfolioItem(item);
    setPortfolioFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      imageUrl: item.imageUrl,
      files: []
    });
    setShowEditPortfolioModal(true);
  };

  const handleSubmitPortfolioItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const formData = new FormData();
      formData.append('title', portfolioFormData.title);
      formData.append('description', portfolioFormData.description);
      formData.append('category', portfolioFormData.category);
      
      // Add files if any
      portfolioFormData.files.forEach((file) => {
        formData.append('files', file);
      });

      const url = selectedPortfolioItem 
        ? `/api/creators/portfolio/${selectedPortfolioItem.id}`
        : '/api/creators/portfolio';
      
      const method = selectedPortfolioItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        // Refresh portfolio data
        fetchDashboardData();
        setShowAddPortfolioModal(false);
        setShowEditPortfolioModal(false);
        setSelectedPortfolioItem(null);
        setPortfolioFormData({
          title: '',
          description: '',
          category: '',
          imageUrl: '',
          files: []
        });
        
        // Show animated success notification
        setSuccessNotification({
          title: selectedPortfolioItem ? 'Portfolio Updated! ✨' : 'Portfolio Added! 🎨',
          message: selectedPortfolioItem ? 'Your work has been updated successfully!' : 'Your work has been added to your portfolio!',
          icon: selectedPortfolioItem ? '✨' : '🎨'
        });
        setShowSuccessNotification(true);
      } else {
        console.error('Failed to save portfolio item');
        alert('Failed to save portfolio item. Please try again.');
      }
    } catch (error) {
      console.error('Error saving portfolio item:', error);
      alert('Error saving portfolio item. Please try again.');
    }
  };

  const handleDeletePortfolioItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this portfolio item?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/creators/portfolio/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchDashboardData();
        alert('Portfolio item deleted successfully!');
      } else {
        console.error('Failed to delete portfolio item');
        alert('Failed to delete portfolio item. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
      alert('Error deleting portfolio item. Please try again.');
    }
  };

  const handlePortfolioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPortfolioFormData(prev => ({
        ...prev,
        files: Array.from(e.target.files || [])
      }));
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

  const navigation = [
    { id: 'overview', label: 'Overview', icon: '❤️' },
    { id: 'briefs', label: 'Available Briefs', icon: '📄' },
    { id: 'submissions', label: 'My Submissions', icon: '📚' },
    { id: 'portfolio', label: 'Portfolio', icon: '🎨' },
    { id: 'earnings', label: 'Earnings', icon: '💰' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  const accountNav = [
    { id: 'earnings', label: 'Earnings', icon: '💰' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'logout', label: 'Logout', icon: '🚪', action: logout },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          WELCOME, {user?.fullName?.toUpperCase() || 'CREATOR'}
        </h1>
        <DefaultAvatar name={user?.fullName || user?.userName || 'Creator'} size="md" />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Active Briefs</h3>
          <p className="text-3xl font-bold text-green-600">{metrics.activeBriefs}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Submissions This Week</h3>
          <p className="text-3xl font-bold text-green-600">{metrics.submissionsThisWeek}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Total Earnings</h3>
          <p className="text-3xl font-bold text-green-600">${metrics.totalEarnings}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h3>
            <div className="space-y-4">
              {mySubmissions.slice(0, 3).map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <DefaultAvatar name={user?.fullName || 'Creator'} size="md" className="mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{submission.briefTitle}</p>
                      <p className="text-sm text-gray-600">${submission.amount}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                    submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="space-y-4">
          <button 
            onClick={() => setActiveTab('briefs')}
            className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-green-300 cursor-pointer text-left"
          >
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">📄</span>
              <h4 className="font-semibold text-gray-900">Browse Briefs</h4>
            </div>
            <p className="text-sm text-gray-600">
              Discover new opportunities and apply to briefs that match your skills.
            </p>
          </button>

          <button 
            onClick={() => setActiveTab('portfolio')}
            className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-green-300 cursor-pointer text-left"
          >
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">🎨</span>
              <h4 className="font-semibold text-gray-900">Update Portfolio</h4>
            </div>
            <p className="text-sm text-gray-600">
              Showcase your best work to attract more brand opportunities.
            </p>
          </button>

          <button 
            onClick={() => setActiveTab('earnings')}
            className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-green-300 cursor-pointer text-left"
          >
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">💰</span>
              <h4 className="font-semibold text-gray-900">Track Earnings</h4>
            </div>
            <p className="text-sm text-gray-600">
              Monitor your income and payment status from approved submissions.
            </p>
          </button>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
        <div className="space-y-3">
          {availableBriefs.slice(0, 2).map((brief) => (
            <div key={brief.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium text-gray-900">{brief.title}</span>
                <p className="text-sm text-gray-600">{brief.brandName}</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-600">
                  {Math.ceil((new Date(brief.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
                <p className="text-sm font-medium text-green-600">${brief.budget}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Overview</h3>
          <p className="text-2xl font-bold text-green-600">{metrics.avgSubmissions} Avg. Submissions This Month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Approval Rate</h3>
          <p className="text-2xl font-bold text-green-600">{Math.round((metrics.approvedSubmissions / Math.max(metrics.submissionsThisWeek, 1)) * 100)}%</p>
        </div>
      </div>
    </div>
  );

  const renderBriefs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Available Briefs</h2>
        <div className="flex space-x-2">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
            Filter
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Sort by Budget
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableBriefs.map((brief) => (
          <div key={brief.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-gray-900">{brief.title}</h3>
              <span className="text-sm text-gray-600">{brief.brandName}</span>
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p>Budget: ${brief.budget.toLocaleString()}</p>
              <p>Deadline: {new Date(brief.deadline).toLocaleDateString()}</p>
              <p>Status: {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}</p>
              {hasSubmittedToBrief(brief.id) && (
                <div className="flex items-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    getSubmissionStatus(brief.id) === 'approved' ? 'bg-green-100 text-green-800' :
                    getSubmissionStatus(brief.id) === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getSubmissionStatus(brief.id) === 'approved' ? 'Approved' :
                     getSubmissionStatus(brief.id) === 'rejected' ? 'Rejected' :
                     'Pending Review'}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">Your submission</span>
                  {getSubmissionStatus(brief.id) === 'rejected' && (
                    <div className="ml-2 text-xs text-red-600">
                      • Cannot resubmit to this brief
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => handleViewBrief(brief)}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm"
              >
                View Details
              </button>
              {hasSubmittedToBrief(brief.id) ? (
                getSubmissionStatus(brief.id) === 'rejected' ? (
                  <button 
                    disabled
                    className="flex-1 border border-gray-400 text-gray-400 py-2 px-4 rounded-md cursor-not-allowed text-sm"
                    title="This submission was rejected. You cannot edit rejected submissions."
                  >
                    Submission Rejected
                  </button>
                ) : (
                  <button 
                    onClick={() => handleApplyToBrief(brief)}
                    className="flex-1 border border-blue-600 text-blue-600 py-2 px-4 rounded-md hover:bg-blue-50 text-sm"
                  >
                    Edit Submission
                  </button>
                )
              ) : (
                <button 
                  onClick={() => handleApplyToBrief(brief)}
                  className="flex-1 border border-green-600 text-green-600 py-2 px-4 rounded-md hover:bg-green-50 text-sm"
                >
                  Apply
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* View Brief Modal */}
      {showViewModal && selectedBrief && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedBrief.title}</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Brand:</span>
                <span>{selectedBrief.brandName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Budget:</span>
                <span>${selectedBrief.budget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Deadline:</span>
                <span>{new Date(selectedBrief.deadline).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedBrief.status === 'active' ? 'bg-green-100 text-green-800' :
                  selectedBrief.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedBrief.status.charAt(0).toUpperCase() + selectedBrief.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleApplyToBrief(selectedBrief);
                }}
                disabled={hasSubmittedToBrief(selectedBrief.id) && getSubmissionStatus(selectedBrief.id) === 'rejected'}
                className={`px-4 py-2 rounded-md ${
                  hasSubmittedToBrief(selectedBrief.id) && getSubmissionStatus(selectedBrief.id) === 'rejected'
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : hasSubmittedToBrief(selectedBrief.id)
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                title={hasSubmittedToBrief(selectedBrief.id) && getSubmissionStatus(selectedBrief.id) === 'rejected' 
                  ? 'This submission was rejected. You cannot edit rejected submissions.' 
                  : undefined}
              >
                {hasSubmittedToBrief(selectedBrief.id) && getSubmissionStatus(selectedBrief.id) === 'rejected' 
                  ? 'Submission Rejected' 
                  : hasSubmittedToBrief(selectedBrief.id) 
                  ? 'Edit Submission' 
                  : 'Apply Now'}
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
              <h3 className="text-xl font-bold text-gray-900">Apply to {selectedBrief.title}</h3>
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
                  Your Proposal *
                </label>
                <textarea
                  value={applyFormData.content}
                  onChange={(e) => setApplyFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Describe your approach, experience, and why you're the best fit for this brief..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: Images, Videos, PDF, Word documents
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Brief Summary</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Brand:</strong> {selectedBrief.brandName}</p>
                  <p><strong>Budget:</strong> ${selectedBrief.budget.toLocaleString()}</p>
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
                  Submit Application
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
      <h2 className="text-2xl font-bold text-gray-900">My Submissions</h2>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brief</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mySubmissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DefaultAvatar name={user?.fullName || 'Creator'} size="sm" className="mr-3" />
                      <span className="text-sm font-medium text-gray-900">{submission.briefTitle}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${submission.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                      submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-green-600 hover:text-green-900 mr-3">View</button>
                    <button className="text-gray-600 hover:text-gray-900">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPortfolio = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Portfolio</h2>
        <button 
          onClick={handleAddPortfolioItem}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Add New Work
        </button>
      </div>

      {portfolioItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No portfolio items yet</h3>
          <p className="text-gray-600 mb-6">Start building your portfolio by adding your best work</p>
          <button 
            onClick={handleAddPortfolioItem}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Add Your First Work
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-500">Image Placeholder</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{item.category}</span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditPortfolioItem(item)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeletePortfolioItem(item.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Portfolio Modal */}
      {showAddPortfolioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add New Work</h3>
              <button
                onClick={() => setShowAddPortfolioModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitPortfolioItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={portfolioFormData.title}
                  onChange={(e) => setPortfolioFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={portfolioFormData.description}
                  onChange={(e) => setPortfolioFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={portfolioFormData.category}
                  onChange={(e) => setPortfolioFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Photography">Photography</option>
                  <option value="Videography">Videography</option>
                  <option value="Graphic Design">Graphic Design</option>
                  <option value="Content Writing">Content Writing</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Podcasting">Podcasting</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Files *
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handlePortfolioFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload images, videos, or documents showcasing your work
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddPortfolioModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add Work
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Portfolio Modal */}
      {showEditPortfolioModal && selectedPortfolioItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Edit Work</h3>
              <button
                onClick={() => setShowEditPortfolioModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitPortfolioItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={portfolioFormData.title}
                  onChange={(e) => setPortfolioFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={portfolioFormData.description}
                  onChange={(e) => setPortfolioFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={portfolioFormData.category}
                  onChange={(e) => setPortfolioFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Photography">Photography</option>
                  <option value="Videography">Videography</option>
                  <option value="Graphic Design">Graphic Design</option>
                  <option value="Content Writing">Content Writing</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Podcasting">Podcasting</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Files (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handlePortfolioFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to keep existing files
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditPortfolioModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Update Work
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderEarnings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Earnings</h2>
      
      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Total Earnings</h3>
          <p className="text-3xl font-bold text-green-600">${metrics.totalEarnings}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">This Month</h3>
          <p className="text-3xl font-bold text-green-600">${earnings.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">${earnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0)}</p>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
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
      case 'portfolio':
        return renderPortfolio();
      case 'earnings':
        return renderEarnings();
      case 'profile':
        return renderProfile();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white">
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
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
                title={item.label}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t border-gray-700">
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
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
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
      <div className="flex-1">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>

      {/* Animated Notifications */}
      <AnimatedNotification
        isVisible={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        type="success"
        title={successNotification.title}
        message={successNotification.message}
        icon={successNotification.icon}
      />
    </div>
  );
};

export default CreatorDashboard; 