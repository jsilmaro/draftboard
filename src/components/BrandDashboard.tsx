import React, { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
// import DefaultAvatar from './DefaultAvatar';
import WinnerSelectionModal from './WinnerSelectionModal';
import { useToast } from '../contexts/ToastContext';
import BrandBriefCard from './BrandBriefCard';
import BriefDetailsModal from './BriefDetailsModal';
import MessagingSystem from './MessagingSystem';
import NotificationBell from './NotificationBell';
import LoadingSpinner from './LoadingSpinner';
import SettingsModal from './SettingsModal';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import CreateBrief from './CreateBrief';

// Lazy load Stripe-dependent components
const PaymentManagement = lazy(() => import('./PaymentManagement'));
const RewardManagement = lazy(() => import('./RewardManagement'));
const BrandWallet = lazy(() => import('./BrandWallet'));

interface Brief {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  status: 'draft' | 'published' | 'archived' | string;
  submissions: number | Array<{
    id: string;
    creator: {
      userName: string;
      fullName: string;
    };
    status: string;
    submittedAt: string;
  }>;
  deadline: string;
  reward: number;
  rewardType?: string;
  amountOfWinners?: number;
  winnersSelected?: boolean;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
  isPrivate?: boolean;
  location?: string;
  additionalFields?: Record<string, unknown>;
  totalRewardsPaid?: number;
  rewardTiers?: Array<{
    position: number;
    cashAmount: number;
    creditAmount: number;
    prizeDescription: string;
  }>;
  winnerRewards?: Array<{
    position: number;
    cashAmount: number;
    creditAmount: number;
    prizeDescription: string;
    calculatedAmount?: number;
  }>;
  brand: {
    id: string;
    companyName: string;
    logo?: string;
    socialInstagram?: string;
    socialTwitter?: string;
    socialLinkedIn?: string;
    socialWebsite?: string;
  };
}

interface Submission {
  id: string;
  creatorName: string;
  briefTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  content?: string;
  attachments?: string[];
}

interface Creator {
  id: string;
  name: string;
  email: string;
  portfolio?: string;
  socialMedia?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
}

interface Metrics {
  activeBriefs: number;
  submissionsThisWeek: number;
  winnersSelected: number;
}

const BrandDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { showSuccessToast, showErrorToast } = useToast();
  // const navigate = useNavigate();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    activeBriefs: 0,
    submissionsThisWeek: 0,
    winnersSelected: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBriefDetails, setShowBriefDetails] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  // const [showMessaging, setShowMessaging] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [briefsFilter, setBriefsFilter] = useState('all');
  const [submissionsFilter, setSubmissionsFilter] = useState('all');
  const [selectedBriefForSubmissions, setSelectedBriefForSubmissions] = useState<string | null>(null);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [analytics, setAnalytics] = useState({
    totalSpent: 0,
    totalRewards: 0,
    activeCampaigns: 0,
    conversionRate: 0
  });

  // Enhanced sidebar functions
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleSidebarSearch = (query: string) => {
    setSidebarSearchQuery(query);
  };

  // Clear selected brief when switching away from submissions
  const handleTabChange = (tab: string) => {
    if (tab !== 'submissions') {
      setSelectedBriefForSubmissions(null);
    }
    setActiveTab(tab);
  };


  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Load briefs
      const briefsResponse = await fetch('/api/brands/briefs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (briefsResponse.ok) {
        const briefsData = await briefsResponse.json();
        setBriefs(briefsData);
        setMetrics(prev => ({
          ...prev,
          activeBriefs: briefsData.filter((b: Brief) => b.status === 'published').length
        }));
      }

      // Load submissions
      const submissionsResponse = await fetch('/api/brands/submissions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json();
        setSubmissions(submissionsData);
        const thisWeek = submissionsData.filter((s: Submission) => {
          const submissionDate = new Date(s.submittedAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return submissionDate >= weekAgo;
        }).length;
        setMetrics(prev => ({
          ...prev,
          submissionsThisWeek: thisWeek
        }));
      }

      // Load creators
      const creatorsResponse = await fetch('/api/brands/creators', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (creatorsResponse.ok) {
        const creatorsData = await creatorsResponse.json();
        setCreators(creatorsData);
      }

      // Load analytics data
      const analyticsResponse = await fetch('/api/rewards/analytics/brand', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }

    } catch (error) {
      // console.error('Error loading dashboard data:', error);
      showErrorToast('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [showErrorToast]);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Navigation structure
  // const navigation = [
  //   { id: 'overview', label: 'Overview', icon: 'overview' },
  //   { id: 'briefs', label: 'My Briefs', icon: 'briefs' },
  //   { id: 'submissions', label: 'Submissions', icon: 'submissions' },
  //   { id: 'creators', label: 'Creators', icon: 'creators' },
  //   { id: 'analytics', label: 'Analytics', icon: 'statistics' },
  //   { id: 'payments', label: 'Payments', icon: 'payments' },
  //   { id: 'rewards', label: 'Rewards', icon: 'rewards-payments' },
  //   { id: 'wallet', label: 'Wallet', icon: 'wallet' },
  //   { id: 'messaging', label: 'Messages', icon: 'messaging' },
  // ];

  // Navigation groups for enhanced sidebar
  const navigationGroups = useMemo(() => [
    {
      id: 'main',
      title: 'Main',
      isExpanded: true,
      items: [
        { id: 'overview', label: 'Overview', icon: 'overview' },
        { id: 'wallet', label: 'Wallet', icon: 'wallet' },
        { id: 'messaging', label: 'Messages', icon: 'messaging' },
      ]
    },
    {
      id: 'brand-management',
      title: 'Brand Management',
      isExpanded: true,
      items: [
        { id: 'create-brief', label: 'Create Brief', icon: 'create' },
        { id: 'briefs', label: 'My Briefs', icon: 'briefs' },
        { id: 'submissions', label: 'Submissions', icon: 'submissions' },
        { id: 'creators', label: 'Creators', icon: 'creators' },
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Payments',
      isExpanded: false,
      items: [
        { id: 'analytics', label: 'Analytics', icon: 'statistics' },
        { id: 'payments', label: 'Payments', icon: 'payments' },
        { id: 'rewards', label: 'Rewards', icon: 'rewards-payments' },
      ]
    }
  ], []);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(navigationGroups.filter(group => group.isExpanded).map(group => group.id))
  );

  // Filter navigation groups based on search query
  const filteredNavigationGroups = useMemo(() => {
    return navigationGroups.map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.label.toLowerCase().includes(sidebarSearchQuery.toLowerCase())
      )
    })).filter(group => group.items.length > 0);
  }, [navigationGroups, sidebarSearchQuery]);

  const accountNav = [
    { id: 'settings', label: 'Settings', icon: 'settings', action: () => setShowSettings(true) },
    { id: 'logout', label: 'Logout', icon: 'logout', action: () => {
      localStorage.removeItem('token');
      window.location.reload();
    }},
  ];

  const handleReviewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
  };

  const handleApproveSubmission = async (submissionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/brands/submissions/${submissionId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        showSuccessToast('Submission approved successfully');
        loadDashboardData();
        setSelectedSubmission(null);
      } else {
        showErrorToast('Failed to approve submission');
      }
    } catch (error) {
      // console.error('Error approving submission:', error);
      showErrorToast('Failed to approve submission');
    }
  };

  const handleRejectSubmission = async (submissionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/brands/submissions/${submissionId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        showSuccessToast('Submission rejected');
        loadDashboardData();
        setSelectedSubmission(null);
      } else {
        showErrorToast('Failed to reject submission');
      }
    } catch (error) {
      // console.error('Error rejecting submission:', error);
      showErrorToast('Failed to reject submission');
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className={`text-4xl font-bold mb-4 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Grow Your Brand with Amazing Creators
        </h1>
        <p className={`text-lg ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Connect with talented creators and bring your brand vision to life with compelling content.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Active Briefs Card */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center">
              <img src="/icons/Green_icons/LiveBrief.png" alt="Active Briefs" className="w-8 h-8" />
            </div>
          </div>
          <div>
            <p className="metric-value">{metrics.activeBriefs}</p>
            <p className="metric-label">Active Briefs</p>
          </div>
        </div>

        {/* Submissions This Week Card */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center">
              <img src="/icons/Green_icons/Performance1.png" alt="Performance" className="w-8 h-8" />
            </div>
          </div>
          <div>
            <p className="metric-value">{metrics.submissionsThisWeek}</p>
            <p className="metric-label">Submissions This Week</p>
          </div>
        </div>

        {/* Winners Selected Card */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center">
              <img src="/icons/Green_icons/Trophy1.png" alt="Rewards" className="w-8 h-8" />
            </div>
          </div>
          <div>
            <p className="metric-value">{metrics.winnersSelected}</p>
            <p className="metric-label">Winners Selected</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="card-title">Recent Submissions</h2>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{submissions.length} total</span>
              </div>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submissions.slice(0, 4).map((submission) => (
                  <div key={submission.id} className={`rounded-lg p-4 border ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  } transition-colors`}>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-gray-100 border-gray-200'
                      }`}>
                        <img src="/icons/profile.png" alt="User" className="w-9 h-9" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>{submission.creatorName}</p>
                        <p className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>Applied to {submission.briefTitle}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          submission.status === 'approved' 
                            ? isDark 
                              ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700' 
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : submission.status === 'rejected' 
                            ? isDark 
                              ? 'bg-red-900/30 text-red-400 border border-red-700' 
                              : 'bg-red-50 text-red-600 border border-red-200'
                            : isDark 
                              ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' 
                              : 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                        }`}>
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleReviewSubmission(submission)}
                        className={`text-sm font-medium transition-colors ${
                          isDark 
                            ? 'text-blue-400 hover:text-blue-300' 
                            : 'text-blue-600 hover:text-blue-800'
                        }`}
                      >
                        Review →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {submissions.length > 4 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setActiveTab('submissions')}
                    className="btn btn-outline"
                  >
                    View All Submissions
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <div className="card-content space-y-3">
              <Link
                to="/brand/create-brief"
                className="btn btn-primary w-full"
              >
                Create New Brief
              </Link>
              <button
                onClick={() => setShowWinnerModal(true)}
                className="btn btn-secondary w-full"
              >
                Select Winners
              </button>
              <Link
                to="/brand/analytics"
                className="btn btn-outline w-full"
              >
                View Analytics
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Activity</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">New submission received</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Brief published</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Winner selected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBriefs = () => {
    const filteredBriefs = briefs.filter(brief => {
      if (briefsFilter === 'published') {
        return brief.status === 'published';
      } else if (briefsFilter === 'draft') {
        return brief.status === 'draft';
      } else if (briefsFilter === 'archived') {
        return brief.status === 'archived';
      } else {
        return true; // 'all' shows everything
      }
    });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className={`text-2xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>My Briefs</h2>
          <Link
            to="/brand/create-brief"
            className="btn btn-primary"
          >
            Create Brief
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {['all', 'published', 'draft', 'archived'].map((filter) => (
            <button
              key={filter}
              onClick={() => setBriefsFilter(filter)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                briefsFilter === filter
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Briefs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBriefs.map((brief) => (
            <BrandBriefCard
              key={brief.id}
              brief={brief}
              onViewClick={(brief) => {
                // Convert brief to the format expected by BriefDetailsModal
                const briefForModal = {
                  id: brief.id,
                  title: brief.title,
                  description: brief.description,
                  requirements: (brief as { requirements?: string }).requirements || '',
                  reward: brief.reward || 0,
                  amountOfWinners: brief.amountOfWinners || 1,
                  totalRewardsPaid: brief.totalRewardsPaid || 0,
                  deadline: brief.deadline,
                  status: brief.status,
                  isPrivate: false,
                  location: 'Anywhere',
                  additionalFields: {},
                  rewardTiers: brief.rewardTiers || [],
                  winnerRewards: (brief as { winnerRewards?: Array<{ position: number; cashAmount: number; creditAmount: number; prizeDescription: string; calculatedAmount?: number; }> }).winnerRewards || [],
                  submissions: Array.isArray(brief.submissions) ? brief.submissions : [],
                  brand: brief.brand || {
                    id: brief.id,
                    companyName: 'Your Brand',
                    logo: undefined,
                    socialInstagram: undefined,
                    socialTwitter: undefined,
                    socialLinkedIn: undefined,
                    socialWebsite: undefined
                  }
                };
                setSelectedBrief(briefForModal as Brief);
                setShowBriefDetails(true);
              }}
              onViewSubmissionsClick={(brief) => {
                // Navigate to submissions for this brief
                // console.log('View submissions for brief:', brief.id);
                // Switch to submissions tab and filter by this brief
                setSelectedBriefForSubmissions(brief.id);
                handleTabChange('submissions');
                showSuccessToast(`Viewing submissions for: ${brief.title}`);
              }}
            />
          ))}
        </div>

        {filteredBriefs.length === 0 && (
          <div className="text-center py-12">
            <p className={`text-lg ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No briefs found for the selected filter.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderSubmissions = () => {
    const filteredSubmissions = submissions.filter(submission => {
      // First filter by brief if a specific brief is selected
      if (selectedBriefForSubmissions) {
        const brief = briefs.find(b => b.id === selectedBriefForSubmissions);
        if (brief && submission.briefTitle !== brief.title) {
          return false;
        }
      }
      
      // Then filter by status
      if (submissionsFilter === 'pending') {
        return submission.status === 'pending';
      } else if (submissionsFilter === 'approved') {
        return submission.status === 'approved';
      } else if (submissionsFilter === 'rejected') {
        return submission.status === 'rejected';
      } else {
        return true; // 'all' shows everything
      }
    });

    const selectedBrief = selectedBriefForSubmissions ? briefs.find(b => b.id === selectedBriefForSubmissions) : null;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
          <h2 className={`text-2xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Submissions</h2>
            {selectedBrief && (
              <div className="mt-2 flex items-center space-x-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Filtered by brief:
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                }`}>
                  {selectedBrief.title}
                </span>
                <button
                  onClick={() => setSelectedBriefForSubmissions(null)}
                  className={`text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  ✕ Clear filter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={`flex space-x-1 p-1 rounded-lg ${
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          {['all', 'pending', 'approved', 'rejected'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSubmissionsFilter(filter)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                submissionsFilter === filter
                  ? isDark
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'bg-white text-gray-900 shadow-sm'
                  : isDark
                    ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <div key={submission.id} className={`card ${
              isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'
            } transition-colors`}>
              <div className="card-content">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-gray-100 border-gray-200'
                    }`}>
                      <img src="/icons/profile.png" alt="User" className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{submission.creatorName}</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Applied to {submission.briefTitle}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      submission.status === 'approved' 
                        ? isDark 
                          ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : submission.status === 'rejected' 
                        ? isDark 
                          ? 'bg-red-900/30 text-red-400 border border-red-700' 
                          : 'bg-red-50 text-red-600 border border-red-200'
                        : isDark 
                          ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' 
                          : 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                    }`}>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                    <button
                      onClick={() => handleReviewSubmission(submission)}
                      className="btn btn-outline"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <p className={`text-lg ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No submissions found for the selected filter.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderCreators = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>Creators</h2>
        <Link
          to="/brand/creators"
          className="btn btn-primary"
        >
          View All Creators
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creators.slice(0, 6).map((creator) => (
          <div key={creator.id} className="card">
            <div className="card-content">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
                  <img src="/icons/profile.png" alt="Creator" className="w-10 h-10" />
                </div>
                <div>
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{creator.name}</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{creator.email}</p>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button className="btn btn-outline text-sm">View Profile</button>
                <button className="btn btn-primary text-sm">Contact</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => {
    // Safe analytics data with defaults
    const safeAnalytics = {
      totalSpent: analytics?.totalSpent || 0,
      totalRewards: analytics?.totalRewards || 0,
      activeCampaigns: analytics?.activeCampaigns || 0,
      conversionRate: analytics?.conversionRate || 0
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className={`text-2xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Analytics</h2>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center">
                <img src="/icons/Green_icons/MoneyBag1.png" alt="Total Spent" className="w-8 h-8" />
              </div>
            </div>
            <div>
              <p className="metric-value">${safeAnalytics.totalSpent.toLocaleString()}</p>
              <p className="metric-label">Total Spent</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center">
                <img src="/icons/Green_icons/Trophy1.png" alt="Total Rewards" className="w-8 h-8" />
              </div>
            </div>
            <div>
              <p className="metric-value">${safeAnalytics.totalRewards.toLocaleString()}</p>
              <p className="metric-label">Total Rewards</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center">
                <img src="/icons/Green_icons/Campaign1.png" alt="Active Campaigns" className="w-8 h-8" />
              </div>
            </div>
            <div>
              <p className="metric-value">{safeAnalytics.activeCampaigns}</p>
              <p className="metric-label">Active Campaigns</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center">
                <img src="/icons/Green_icons/Performance1.png" alt="Conversion Rate" className="w-8 h-8" />
              </div>
            </div>
            <div>
              <p className="metric-value">{safeAnalytics.conversionRate}%</p>
              <p className="metric-label">Conversion Rate</p>
            </div>
          </div>
        </div>

      {/* Analytics Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Campaign Performance</h3>
          </div>
          <div className="card-content">
            <div className={`h-64 flex items-center justify-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Chart placeholder - Campaign performance over time
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Creator Engagement</h3>
          </div>
          <div className="card-content">
            <div className={`h-64 flex items-center justify-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Chart placeholder - Creator engagement metrics
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderCreateBrief = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>Create Brief</h2>
      </div>
      <CreateBrief />
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'create-brief':
        return renderCreateBrief();
      case 'briefs':
        return renderBriefs();
      case 'submissions':
        return renderSubmissions();
      case 'creators':
        return renderCreators();
      case 'analytics':
        return renderAnalytics();
      case 'payments':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <PaymentManagement 
              userType="brand"
              userId={user?.id || ''}
              token={localStorage.getItem('token') || ''}
            />
          </Suspense>
        );
      case 'rewards':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <RewardManagement 
              userType="brand"
              userId={user?.id || ''}
              token={localStorage.getItem('token') || ''}
            />
          </Suspense>
        );
      case 'wallet':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <BrandWallet analytics={analytics} />
          </Suspense>
        );
      case 'messaging':
        return <MessagingSystem isOpen={true} onClose={() => handleTabChange('overview')} />;
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl border-b border-white/20 dark:border-gray-600/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo />
            <h1 className="text-lg font-semibold text-white">
              {activeTab === 'overview' ? 'Dashboard' : 
               activeTab === 'briefs' ? 'My Briefs' :
               activeTab === 'submissions' ? 'Submissions' :
               activeTab === 'creators' ? 'Creators' :
               activeTab === 'analytics' ? 'Analytics' :
               activeTab === 'payments' ? 'Payments' :
               activeTab === 'rewards' ? 'Rewards' :
               activeTab === 'wallet' ? 'Wallet' :
               activeTab === 'messaging' ? 'Messages' : 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <NotificationBell />
            <button
              onClick={() => setActiveTab(activeTab === 'mobile-menu' ? 'overview' : 'mobile-menu')}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Sidebar */}
      <div className={`${activeTab === 'mobile-menu' ? 'block' : 'hidden'} lg:block w-full ${
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
      } ${isDark ? 'bg-gray-800' : 'bg-white'} border-r ${isDark ? 'border-gray-700' : 'border-gray-200'} lg:min-h-screen lg:fixed lg:left-0 lg:top-0 lg:z-40 flex flex-col overflow-y-auto transition-all duration-300 rounded-r-2xl shadow-lg`}>
        <div className="p-4 flex flex-col h-full">
          
          {/* Header with User Profile */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              {!sidebarCollapsed && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-800 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {user?.companyName?.charAt(0) || 'B'}
                    </span>
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {user?.companyName || 'Brand'}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Brand Account
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {sidebarCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  )}
                </svg>
              </button>
            </div>
            
            {/* Search Bar */}
            {!sidebarCollapsed && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
            </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={sidebarSearchQuery}
                  onChange={(e) => handleSidebarSearch(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 text-sm rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Navigation Groups */}
          <nav className="space-y-1 flex-1">
            {filteredNavigationGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.id);
              
              return (
                <div key={group.id} className="space-y-1">
                  {!sidebarCollapsed && (
                  <button
                    onClick={() => toggleGroup(group.id)}
                      className={`flex w-full items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg transition-colors uppercase tracking-wider ${
                      isDark
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    aria-expanded={isExpanded}
                    aria-controls={`nav-group-${group.id}`}
                  >
                      {group.title}
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90' : 'rotate-0'
                        }`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Show icons when collapsed - only for expanded groups */}
                  {sidebarCollapsed && isExpanded && (
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <button
                          key={`collapsed-${item.id}`}
                          onClick={() => {
                            if (item.id === 'messaging') {
                              handleTabChange('messaging');
                            } else {
                              handleTabChange(item.id);
                            }
                          }}
                          className={`w-full flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                            activeTab === item.id
                              ? isDark
                                ? 'bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg'
                                : 'bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg'
                              : isDark
                                ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                          title={item.label}
                        >
                          {item.icon === 'overview' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                            </svg>
                          )}
                          {item.icon === 'wallet' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          )}
                          {item.icon === 'messaging' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          )}
                          {item.icon === 'create' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                          {item.icon === 'briefs' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          {item.icon === 'submissions' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          )}
                          {item.icon === 'creators' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                          )}
                          {item.icon === 'statistics' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          )}
                          {item.icon === 'payments' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          )}
                          {item.icon === 'rewards-payments' && (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    )}
                  </button>
                      ))}
                    </div>
                  )}
                  
                  {isExpanded && !sidebarCollapsed && (
                    <div 
                      id={`nav-group-${group.id}`}
                      className="space-y-1"
                    >
                      {group.items.map((item) => (
                          <button
                          key={item.id}
                            onClick={() => {
                              if (item.id === 'messaging') {
                              handleTabChange('messaging');
                              } else {
                              handleTabChange(item.id);
                              }
                            }}
                          className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                              activeTab === item.id
                                ? isDark
                                ? 'bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg'
                                : 'bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg'
                                : isDark
                                ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                            title={sidebarCollapsed ? item.label : ''}
                          >
                          {item.icon === 'overview' && (
                            <svg className={`${sidebarCollapsed ? 'w-5 h-5 mx-auto' : 'w-4 h-4 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                            </svg>
                          )}
                          {item.icon === 'wallet' && (
                            <svg className={`${sidebarCollapsed ? 'w-5 h-5 mx-auto' : 'w-4 h-4 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          )}
                          {item.icon === 'messaging' && (
                            <svg className={`${sidebarCollapsed ? 'w-5 h-5 mx-auto' : 'w-4 h-4 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          )}
                          {item.icon === 'create' && (
                            <svg className={`${sidebarCollapsed ? 'w-5 h-5 mx-auto' : 'w-4 h-4 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                          {item.icon === 'briefs' && (
                            <svg className={`${sidebarCollapsed ? 'w-5 h-5 mx-auto' : 'w-4 h-4 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          {item.icon === 'submissions' && (
                            <svg className={`${sidebarCollapsed ? 'w-5 h-5 mx-auto' : 'w-4 h-4 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          )}
                          {item.icon === 'creators' && (
                            <svg className={`${sidebarCollapsed ? 'w-5 h-5 mx-auto' : 'w-4 h-4 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                          )}
                          {item.icon === 'statistics' && (
                            <svg className={`${sidebarCollapsed ? 'w-5 h-5 mx-auto' : 'w-4 h-4 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          )}
                          {item.icon === 'payments' && (
                            <svg className={`${sidebarCollapsed ? 'w-5 h-5 mx-auto' : 'w-4 h-4 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          )}
                          {item.icon === 'rewards-payments' && (
                            <svg className={`${sidebarCollapsed ? 'w-5 h-5 mx-auto' : 'w-4 h-4 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          )}
                          {!sidebarCollapsed && (
                            <span className="font-medium">{item.label}</span>
                          )}
                          </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-1">
              {accountNav.map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-2'} rounded-lg text-sm transition-colors ${
                    isDark
                      ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <span className={sidebarCollapsed ? '' : 'mr-3'}>
                    {item.id === 'settings' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : item.icon === 'logout' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    )}
                  </span>
                  {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
              ))}
            </div>
            
            {/* Theme Toggle */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!sidebarCollapsed && (
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </span>
                )}
                <button
                  onClick={() => {
                    // Toggle theme logic would go here
                    const event = new CustomEvent('toggleTheme');
                    window.dispatchEvent(event);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDark ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  title={sidebarCollapsed ? (isDark ? 'Light Mode' : 'Dark Mode') : ''}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDark ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-auto transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      } ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Desktop Header */}
        <div className="hidden lg:block border-b border-gray-200 dark:border-gray-700 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className={`text-2xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {activeTab === 'overview' ? 'Dashboard' : 
                 activeTab === 'briefs' ? 'My Briefs' :
                 activeTab === 'submissions' ? 'Submissions' :
                 activeTab === 'creators' ? 'Creators' :
                 activeTab === 'analytics' ? 'Analytics' :
                 activeTab === 'payments' ? 'Payments' :
                 activeTab === 'rewards' ? 'Rewards' :
                 activeTab === 'wallet' ? 'Wallet' :
                 activeTab === 'messaging' ? 'Messages' : 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="p-4 lg:p-8">
          {renderContent()}
        </main>
      </div>

      {/* Modals */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-2xl w-full ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } rounded-lg shadow-xl`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Review Submission
                </h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className={`${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSubmission.creatorName}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Applied to {selectedSubmission.briefTitle}</p>
                </div>
                
                {selectedSubmission.content && (
                  <div>
                    <h4 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Content:</h4>
                    <div className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      {(() => {
                        try {
                          // Try to parse as JSON first
                          const parsedContent = JSON.parse(selectedSubmission.content);
                          if (parsedContent.originalContent) {
                            return (
                              <div className="space-y-3">
                                <div>
                                  <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Submission Content:</h5>
                                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{parsedContent.originalContent}</p>
                                </div>
                                {parsedContent.briefTitle && (
                                  <div>
                                    <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Brief:</h5>
                                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{parsedContent.briefTitle}</p>
                                  </div>
                                )}
                                {parsedContent.approvedAt && (
                                  <div>
                                    <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Approved At:</h5>
                                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                      {new Date(parsedContent.approvedAt).toLocaleString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{JSON.stringify(parsedContent, null, 2)}</p>;
                        } catch {
                          // If not JSON, display as plain text
                          return <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selectedSubmission.content}</p>;
                        }
                      })()}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => handleRejectSubmission(selectedSubmission.id)}
                    className="btn btn-outline"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproveSubmission(selectedSubmission.id)}
                    className="btn btn-primary"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWinnerModal && (
        <WinnerSelectionModal
          isOpen={showWinnerModal}
          onClose={() => setShowWinnerModal(false)}
          briefId=""
          submissions={[]}
          onSuccess={() => {
            setShowWinnerModal(false);
            loadDashboardData();
          }}
        />
      )}

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showBriefDetails && selectedBrief && (
        <BriefDetailsModal
          brief={selectedBrief as {
            id: string;
            title: string;
            description?: string;
            requirements?: string;
            reward: number;
            amountOfWinners?: number;
            totalRewardsPaid?: number;
            deadline: string;
            status: string;
            isPrivate: boolean;
            location?: string;
            additionalFields?: Record<string, unknown>;
            rewardTiers?: Array<{
              position: number;
              cashAmount: number;
              creditAmount: number;
              prizeDescription: string;
            }>;
            winnerRewards?: Array<{
              position: number;
              cashAmount: number;
              creditAmount: number;
              prizeDescription: string;
              calculatedAmount?: number;
            }>;
            submissions: Array<{
              id: string;
              creator: {
                userName: string;
                fullName: string;
              };
              status: string;
              submittedAt: string;
            }>;
            brand: {
              id: string;
              companyName: string;
              logo?: string;
              socialInstagram?: string;
              socialTwitter?: string;
              socialLinkedIn?: string;
              socialWebsite?: string;
            };
          }}
          isOpen={showBriefDetails}
          onClose={() => {
            setShowBriefDetails(false);
            setSelectedBrief(null);
          }}
        />
      )}
    </div>
  );
};

export default BrandDashboard;
