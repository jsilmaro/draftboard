import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Link, useSearchParams } from 'react-router-dom';
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
import ManageRewardsPayments from './ManageRewardsPayments';
import EditBrief from './EditBrief';
import CreatorDetailModal from './CreatorDetailModal';

// BrandWallet removed - brands pay directly through Stripe Checkout when funding briefs

interface BrandBriefCardProps {
  brief: {
    id: string;
    title: string;
    description?: string;
    rewardType?: string;
    amountOfWinners?: number;
    deadline: string;
    status: string;
    submissions: number | Array<unknown>;
    totalRewardsPaid?: number;
    reward?: number;
    totalRewardValue?: number;
    rewardTiers?: Array<{
      position: number;
      cashAmount: number;
      creditAmount: number;
      prizeDescription: string;
    }>;
    brand?: {
      id: string;
      companyName: string;
      logo?: string;
    };
  };
  onViewClick?: (brief: BrandBriefCardProps['brief']) => void;
  onEditClick?: (brief: BrandBriefCardProps['brief']) => void;
  onEditRewardsClick?: (brief: BrandBriefCardProps['brief']) => void;
  onSelectWinnersClick?: (brief: BrandBriefCardProps['brief']) => void;
  onViewSubmissionsClick?: (brief: BrandBriefCardProps['brief']) => void;
  onDeleteClick?: (briefId: string) => void;
  onPublishClick?: (briefId: string) => void;
  onDraftClick?: (briefId: string) => void;
  onArchiveClick?: (briefId: string) => void;
}

interface Brief {
  id: string;
  title: string;
  description: string;
  requirements: string;
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
  amountOfWinners: number;
  winnersSelected?: boolean;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
  isPrivate: boolean;
  location?: string;
  additionalFields?: Record<string, string | string[]>;
  totalRewardsPaid?: number;
  isFunded?: boolean;
  fundedAt?: string;
  rewardTiers: Array<{
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
  userName: string;
  email: string;
  userType?: string; // MUST be 'creator'
  profileImage?: string | null;
  socialInstagram?: string;
  socialTwitter?: string;
  socialLinkedIn?: string;
  socialTikTok?: string;
  socialYouTube?: string;
  isVerified: boolean;
  totalSubmissions: number;
  wins: number;
  totalEarnings: number;
  lastInteraction: string;
  submissions: Array<{
    id: string;
    briefId: string;
    briefTitle: string;
    submittedAt: string;
    status: string;
    isWinner: boolean;
  }>;
}

interface Metrics {
  activeBriefs: number;
  submissionsThisWeek: number;
  winnersSelected: number;
}

const BrandDashboard: React.FC = () => {
  const { isDark } = useTheme();
  const { showSuccessToast, showErrorToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBriefDetails, setShowBriefDetails] = useState(false);
  const [showCreateBriefModal, setShowCreateBriefModal] = useState(false);
  const [showEditBriefModal, setShowEditBriefModal] = useState(false);
  const [editingBrief, setEditingBrief] = useState<Brief | null>(null);
  const [previousTab, setPreviousTab] = useState<string>('overview');
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  // const [showMessaging, setShowMessaging] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [briefsFilter, setBriefsFilter] = useState('all');
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [creatorsSearchQuery, setCreatorsSearchQuery] = useState('');
  const [creatorsSortBy, setCreatorsSortBy] = useState<'name' | 'wins' | 'earnings' | 'lastInteraction'>('lastInteraction');
  const [creatorsFilter, setCreatorsFilter] = useState<'all' | 'topEarners' | 'mostActive' | 'recentWinners'>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [invitingCreatorId, setInvitingCreatorId] = useState<string | null>(null);
  const [invitedCreators, setInvitedCreators] = useState<Set<string>>(new Set());
  const [sendingInvite, setSendingInvite] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalSpent: 0,
    totalRewards: 0,
    totalRewardValue: 0,
    activeCampaigns: 0,
    conversionRate: 0,
    totalBriefs: 0,
    totalSubmissions: 0,
    averageReward: 0,
    recentBriefs: [] as Array<{
      id: string;
      title: string;
      status: string;
      createdAt: string;
    }>,
    topPerformingBriefs: [] as Array<{
      id: string;
      title: string;
      submissions: number;
      status: string;
    }>,
    monthlyTrends: [] as Array<{
      month: string;
      briefs: number;
      submissions: number;
    }>,
    briefPerformance: [] as Array<{
      id: string;
      title: string;
      submissions: number;
      totalRewardValue: number;
      status: string;
    }>
  });

  // Handle URL parameters on component mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const stripeParam = searchParams.get('stripe');

    // Set active tab from URL parameter
    if (tabParam && ['overview', 'briefs', 'create-brief', 'creators', 'analytics', 'messaging', 'manage-rewards'].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    // Handle Stripe success parameter
    if (stripeParam === 'success') {
      showSuccessToast('Payment completed successfully! Your wallet has been updated.');
      // Clean up the URL parameter after showing the message
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('stripe');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, showSuccessToast]);


  // Clear selected brief when switching away from submissions
  const handleTabChange = (tab: string) => {
    // Store the current tab as previous tab before switching
    if (tab !== 'create-brief') {
      setPreviousTab(activeTab);
    }
    setActiveTab(tab);
    
    // Update URL parameter to reflect the active tab
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', tab);
    setSearchParams(newSearchParams, { replace: true });
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

      // Load creators - ONLY creators, NEVER brands
      const creatorsResponse = await fetch('/api/brands/creators', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Load invited creators list
      const invitedResponse = await fetch('/api/creators/invited', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let invitedIds: string[] = [];
      if (invitedResponse.ok) {
        const invitedData = await invitedResponse.json();
        invitedIds = invitedData.invitedCreators || [];
        // Loaded previously invited creators
      }
      
      if (creatorsResponse.ok) {
        const creatorsData = await creatorsResponse.json();
        
        // STRICT VALIDATION: ONLY accept if explicitly marked as 'creator'
        const verifiedCreators = creatorsData.filter((user: Creator) => {
          // MUST have userType === 'creator' (NO exceptions!)
          if (user.userType !== 'creator') {
            // Rejected: Not explicitly marked as creator
            return false;
          }
          
          // MUST have required creator fields
          if (!user.userName || !user.email) {
            // Rejected: Missing creator fields
            return false;
          }
          
          return true;
        });
        
        // Loaded verified creators only
        setCreators(verifiedCreators);
        
        // Set invited creators from backend
        setInvitedCreators(new Set(invitedIds));
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

  // Navigation items (flattened without grouping)
  const navigationItems = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: 'overview' },
    { id: 'messaging', label: 'Messages', icon: 'messaging' },
    { id: 'create-brief', label: 'Create Brief', icon: 'create' },
    { id: 'briefs', label: 'My Briefs', icon: 'briefs' },
    { id: 'manage-rewards', label: 'Manage Rewards & Payments', icon: 'rewards-payments' },
    { id: 'creators', label: 'Creators', icon: 'creators' },
    { id: 'analytics', label: 'Analytics', icon: 'statistics' },
  ], []);

  // Filter navigation items based on search query
  const filteredNavigationItems = useMemo(() => {
    return navigationItems;
  }, [navigationItems]);

  const accountNav = [
    { id: 'settings', label: 'Settings', icon: 'settings', action: () => setShowSettings(true) },
    { id: 'logout', label: 'Logout', icon: 'logout', action: () => {
      localStorage.removeItem('token');
      window.location.reload();
    }},
  ];


  // Brief management functions
  const handleDeleteBrief = async (briefId: string) => {
    if (!window.confirm('Are you sure you want to delete this brief? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // First verify authentication
      const verifyResponse = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      await verifyResponse.json();
      
      const response = await fetch(`/api/briefs/${briefId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        showSuccessToast('Brief deleted successfully');
        loadDashboardData();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        showErrorToast(`Failed to delete brief: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      showErrorToast('Failed to delete brief');
    }
  };

  const handlePublishBrief = async (briefId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/briefs/${briefId}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'published' })
      });

      if (response.ok) {
        showSuccessToast('Brief published successfully');
        loadDashboardData();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        showErrorToast(`Failed to publish brief: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      showErrorToast('Failed to publish brief');
    }
  };

  const handleDraftBrief = async (briefId: string) => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (storedUser.type !== 'brand') {
        alert(`ERROR: You are logged in as a ${storedUser.type}, not a brand! Please log in as a brand to manage briefs.`);
        return;
      }
      
      const response = await fetch(`/api/briefs/${briefId}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'draft' })
      });

      if (response.ok) {
        showSuccessToast('Brief moved to draft');
        loadDashboardData();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        if (errorData.error === 'Access denied - you can only update your own briefs') {
          alert(`⚠️ OWNERSHIP ERROR:\n\nThis brief belongs to a different brand!\n\nYou are logged in as: ${storedUser.companyName || storedUser.email}\nYour Brand ID: ${storedUser.id}\n\nThis brief was created by another brand account.\n\nYou can only manage briefs that YOU created.`);
        }
        showErrorToast(`Failed to move brief to draft: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      showErrorToast('Failed to move brief to draft');
    }
  };

  const handleArchiveBrief = async (briefId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/briefs/${briefId}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'archived' })
      });

      if (response.ok) {
        showSuccessToast('Brief archived successfully');
        loadDashboardData();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        showErrorToast(`Failed to archive brief: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      showErrorToast('Failed to archive brief');
    }
  };

  const handleEditBrief = (brief: BrandBriefCardProps['brief']) => {
    // Convert to the format expected by EditBrief
    const briefForEdit: Brief = {
      id: brief.id,
      title: brief.title,
      description: brief.description || '',
      requirements: (brief as { requirements?: string }).requirements || '',
      reward: brief.reward || 0,
      deadline: brief.deadline,
      amountOfWinners: brief.amountOfWinners || 1,
      status: brief.status,
      isPrivate: (brief as { isPrivate?: boolean }).isPrivate || false,
      submissions: Array.isArray(brief.submissions) ? brief.submissions as Array<{
        id: string;
        creator: {
          userName: string;
          fullName: string;
        };
        status: string;
        submittedAt: string;
      }> : [],
      brand: brief.brand || {
        id: brief.id,
        companyName: 'Your Brand',
        logo: undefined,
        socialInstagram: undefined,
        socialTwitter: undefined,
        socialLinkedIn: undefined,
        socialWebsite: undefined
      },
      rewardTiers: brief.rewardTiers || [],
      additionalFields: (brief as { additionalFields?: Record<string, string | string[]> }).additionalFields || {}
    };
    setEditingBrief(briefForEdit);
    setShowEditBriefModal(true);
  };

  const handleEditBriefSuccess = (_updatedBrief: Brief) => {
    showSuccessToast('Brief updated successfully');
    loadDashboardData();
    setShowEditBriefModal(false);
    setEditingBrief(null);
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

      {/* Marketplace Section */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="card-title">Discover Creators</h2>
            <button
              onClick={() => setActiveTab('creators')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              View All
            </button>
          </div>
        </div>
        <div className="card-content">
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Find talented creators to bring your brand vision to life
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4 hover:shadow-md transition-all duration-200`}>
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-10 h-10 ${isDark ? 'bg-gray-800' : 'bg-white'} border rounded-lg flex items-center justify-center`}>
                  <svg className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Content Creators</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Find creators for your campaigns</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>500+</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Available</p>
                </div>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Connect with talented content creators who can bring your brand vision to life.
              </p>
            </div>
            <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4 hover:shadow-md transition-all duration-200`}>
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-10 h-10 ${isDark ? 'bg-gray-800' : 'bg-white'} border rounded-lg flex items-center justify-center`}>
                  <svg className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Analytics</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Track campaign performance</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Real-time</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Insights</p>
                </div>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Monitor your campaign performance with detailed analytics and insights.
              </p>
            </div>
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
                      ? 'bg-gray-950 border-gray-900 hover:bg-gray-900' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  } transition-colors`}>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                        isDark 
                          ? 'bg-gray-900 border-gray-800' 
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
                      <span className={`text-sm ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        View in Manage Rewards & Payments
                      </span>
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
              <button
                onClick={() => setShowCreateBriefModal(true)}
                className="btn btn-primary w-full"
              >
                Create New Brief
              </button>
              <button
                onClick={() => handleTabChange('analytics')}
                className="btn btn-outline w-full"
              >
                View Analytics
              </button>
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
      } else if (briefsFilter === 'funded') {
        return brief.isFunded === true;
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
        <div className={`flex space-x-1 p-1 rounded-lg ${
          isDark ? 'bg-gray-950' : 'bg-gray-100'
        }`}>
          {['all', 'published', 'draft', 'archived', 'funded'].map((filter) => (
            <button
              key={filter}
              onClick={() => setBriefsFilter(filter)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                briefsFilter === filter
                  ? isDark
                    ? 'bg-gray-900 text-white shadow-sm'
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
              onViewSubmissionsClick={(_brief) => {
                // Navigate to submissions for this brief
                // console.log('View submissions for brief:', brief.id);
                // Switch to manage rewards tab to review submissions
                handleTabChange('manage-rewards');
                showSuccessToast(`View submissions in Manage Rewards & Payments`);
              }}
              onDeleteClick={handleDeleteBrief}
              onPublishClick={handlePublishBrief}
              onDraftClick={handleDraftBrief}
              onArchiveClick={handleArchiveBrief}
              onEditClick={handleEditBrief}
              onEditRewardsClick={(brief) => {
                // Navigate to manage rewards tab to edit reward tiers
                handleTabChange('manage-rewards');
                showSuccessToast(`Edit rewards for "${brief.title}" in Manage Rewards & Payments`);
              }}
              onSelectWinnersClick={(brief) => {
                // Navigate to manage rewards tab to select winners
                handleTabChange('manage-rewards');
                showSuccessToast(`Select winners for "${brief.title}" in Manage Rewards & Payments`);
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


  const handleMessageCreator = (_creatorId: string) => {
    // Close the modal and switch to messaging tab
    setShowCreatorModal(false);
    setSelectedCreator(null);
    handleTabChange('messaging');
    // The messaging system will handle opening the conversation
  };

  const handleOpenInviteModal = (creator: Creator) => {
    // VALIDATION: Ensure this is definitely a creator, not a brand
    if (creator.userType && creator.userType !== 'creator') {
      showErrorToast('Cannot invite brand accounts. Only creators can be invited.');
      // Attempted to invite non-creator
      return;
    }
    
    // Extra safety check
    if (!creator.userName || !creator.email) {
      showErrorToast('Invalid creator account.');
      // Invalid creator data
      return;
    }
    
    setSelectedCreator(creator);
    setInvitingCreatorId(creator.id);
    setInviteMessage('');
    setShowInviteModal(true);
  };

  const handleSendInvite = async () => {
    if (!invitingCreatorId || !selectedCreator || sendingInvite) return;

    // FINAL VALIDATION: Double-check this is a creator before sending
    if (selectedCreator.userType && selectedCreator.userType !== 'creator') {
      showErrorToast('Cannot invite brand accounts. Only creators can be invited.');
      // Blocked: Attempted to invite non-creator via API
      setShowInviteModal(false);
      return;
    }

    try {
      setSendingInvite(true);
      const token = localStorage.getItem('token');
      
      // Sending invitation to creator
      
      const response = await fetch('/api/creators/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          creatorId: invitingCreatorId,
          message: inviteMessage
        })
      });

      if (response.ok) {
        // Successfully invited creator
        showSuccessToast(`Invitation sent to ${selectedCreator.name}!`);
        
        // Add creator to invited list immediately (optimistic update)
        setInvitedCreators(prev => new Set(prev).add(invitingCreatorId));
        
        // Close modal
        setShowInviteModal(false);
        setInviteMessage('');
        setInvitingCreatorId(null);
        setSelectedCreator(null);
        
        // Reload invited list from backend to ensure sync
        try {
          const token = localStorage.getItem('token');
          const invitedResponse = await fetch('/api/creators/invited', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (invitedResponse.ok) {
            const invitedData = await invitedResponse.json();
            setInvitedCreators(new Set(invitedData.invitedCreators || []));
            // Refreshed invited list
          }
        } catch (error) {
          // Failed to refresh invited list
        }
      } else {
        const error = await response.json();
        
        // Show specific error message for brand accounts
        if (error.error === 'Cannot invite brand accounts') {
          showErrorToast('You can only invite creator accounts, not other brands.');
        } else {
          showErrorToast(error.message || error.error || 'Failed to send invitation');
        }
      }
    } catch (error) {
      showErrorToast('Failed to send invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`;
    return `${Math.floor(diffInDays / 365)}y ago`;
  };

  const renderCreators = () => {
    // Filter creators based on search query
    let filteredCreators = creators.filter(creator => {
      const searchLower = creatorsSearchQuery.toLowerCase();
      return (
        (creator.name?.toLowerCase() || '').includes(searchLower) ||
        (creator.userName?.toLowerCase() || '').includes(searchLower) ||
        (creator.email?.toLowerCase() || '').includes(searchLower)
      );
    });

    // Apply category filters
    if (creatorsFilter === 'topEarners') {
      filteredCreators = filteredCreators
        .filter(c => c.totalEarnings > 0)
        .sort((a, b) => b.totalEarnings - a.totalEarnings)
        .slice(0, 10);
    } else if (creatorsFilter === 'mostActive') {
      filteredCreators = filteredCreators
        .filter(c => c.totalSubmissions > 0)
        .sort((a, b) => b.totalSubmissions - a.totalSubmissions)
        .slice(0, 10);
    } else if (creatorsFilter === 'recentWinners') {
      filteredCreators = filteredCreators.filter(c => c.wins > 0);
    }

    // Sort creators
    const sortedCreators = [...filteredCreators].sort((a, b) => {
      switch (creatorsSortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'wins':
          return (b.wins || 0) - (a.wins || 0);
        case 'earnings':
          return (b.totalEarnings || 0) - (a.totalEarnings || 0);
        case 'lastInteraction':
        default:
          return new Date(b.lastInteraction || 0).getTime() - new Date(a.lastInteraction || 0).getTime();
      }
    });

    return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
        <h2 className={`text-2xl font-bold ${
          isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Creators
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Manage creators who have worked with your brand
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search creators by name, username, or email..."
                value={creatorsSearchQuery}
                onChange={(e) => setCreatorsSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors ${
                  isDark
                    ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                }`}
              />
            </div>
          </div>

          {/* Sort Dropdown */}
          <select
            value={creatorsSortBy}
            onChange={(e) => setCreatorsSortBy(e.target.value as typeof creatorsSortBy)}
            className={`px-4 py-2.5 rounded-lg border transition-colors ${
              isDark
                ? 'bg-gray-900 border-gray-800 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500'
                : 'bg-white border-gray-200 text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500'
            }`}
          >
            <option value="lastInteraction">Sort by: Last Interaction</option>
            <option value="name">Sort by: Name</option>
            <option value="wins">Sort by: Wins</option>
            <option value="earnings">Sort by: Earnings</option>
          </select>
      </div>

        {/* Filter Tabs */}
        <div className={`flex space-x-1 p-1 rounded-lg ${
          isDark ? 'bg-gray-950' : 'bg-gray-100'
        }`}>
          {[
            { id: 'all', label: 'All Creators' },
            { id: 'topEarners', label: 'Top Earners' },
            { id: 'mostActive', label: 'Most Active' },
            { id: 'recentWinners', label: 'Recent Winners' }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setCreatorsFilter(filter.id as typeof creatorsFilter)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                creatorsFilter === filter.id
                  ? isDark
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-900 shadow-sm'
                  : isDark
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
          }`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
              Total Creators
            </p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {creators.length}
            </p>
          </div>
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
          }`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
              Total Submissions
            </p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {creators.reduce((sum, c) => sum + (Number(c.totalSubmissions) || 0), 0)}
            </p>
          </div>
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
          }`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
              Total Winners
            </p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {creators.reduce((sum, c) => sum + (Number(c.wins) || 0), 0)}
            </p>
          </div>
          <div className={`p-4 rounded-lg border ${
            isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
          }`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
              Total Paid Out
            </p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ${creators.reduce((sum, c) => sum + (Number(c.totalEarnings) || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Creators Table */}
        {sortedCreators.length === 0 ? (
          <div className={`text-center py-12 rounded-lg border ${
            isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
          }`}>
            <svg className={`w-16 h-16 mx-auto mb-4 ${
              isDark ? 'text-gray-700' : 'text-gray-300'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {creatorsSearchQuery ? 'No creators found matching your search' : 'No creators have submitted to your briefs yet'}
            </p>
          </div>
        ) : (
          <div className={`rounded-lg border overflow-hidden ${
            isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Creator
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Submissions
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Wins
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Earnings
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Last Interaction
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-200'}`}>
                  {sortedCreators.map((creator) => (
                    <tr 
                      key={creator.id}
                      className={`transition-colors ${
                        isDark 
                          ? 'hover:bg-gray-900/50' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                            isDark 
                              ? 'bg-gradient-to-br from-green-600 to-green-800 text-white' 
                              : 'bg-gradient-to-br from-green-500 to-green-700 text-white'
                          }`}>
                            {(creator.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                            <div className="flex items-center space-x-2">
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {creator.name || 'Unknown'}
                              </p>
                              {creator.isVerified && (
                                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                </div>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              @{creator.userName || 'unknown'}
                            </p>
              </div>
              </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {creator.totalSubmissions || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {creator.wins || 0}
                          </span>
                          {(creator.wins || 0) > 0 && (
                            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          )}
            </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          (creator.totalEarnings || 0) > 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          ${(creator.totalEarnings || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatTimeAgo(creator.lastInteraction || new Date().toISOString())}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedCreator(creator);
                              setShowCreatorModal(true);
                            }}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                              isDark
                                ? 'bg-gray-800 text-white hover:bg-gray-700'
                                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                            }`}
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => !invitedCreators.has(creator.id) && handleOpenInviteModal(creator)}
                            disabled={invitedCreators.has(creator.id)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                              invitedCreators.has(creator.id)
                                ? isDark
                                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : isDark
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                            title={invitedCreators.has(creator.id) ? 'Already invited' : 'Invite this creator to connect'}
                          >
                            {invitedCreators.has(creator.id) ? (
                              <span className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Invited</span>
                              </span>
                            ) : (
                              'Invite'
                            )}
                          </button>
                          <button
                            onClick={() => handleMessageCreator(creator.id)}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                          >
                            Message
                          </button>
          </div>
                      </td>
                    </tr>
        ))}
                </tbody>
              </table>
      </div>
          </div>
        )}

        {/* Creator Detail Modal */}
        {showCreatorModal && selectedCreator && (
          <CreatorDetailModal
            creator={selectedCreator}
            isOpen={showCreatorModal}
            onClose={() => {
              setShowCreatorModal(false);
              setSelectedCreator(null);
            }}
            onMessage={handleMessageCreator}
          />
        )}

        {/* Invite Creator Modal */}
        {showInviteModal && selectedCreator && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
            onClick={() => {
              setShowInviteModal(false);
              setInviteMessage('');
              setInvitingCreatorId(null);
              setSelectedCreator(null);
            }}
          >
            <div 
              className={`relative w-full max-w-md rounded-2xl shadow-2xl p-6 ${
                isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="mb-4">
                <h3 className={`text-xl font-bold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Invite {selectedCreator.name}
                </h3>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Send an invitation to collaborate or connect with this creator.
                </p>
              </div>

              {/* Creator Info */}
              <div className={`mb-4 p-3 rounded-lg border ${
                isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isDark 
                      ? 'bg-gradient-to-br from-green-600 to-green-800 text-white' 
                      : 'bg-gradient-to-br from-green-500 to-green-700 text-white'
                  }`}>
                    {(selectedCreator.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedCreator.name}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      @{selectedCreator.userName || 'unknown'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message Input */}
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Message (Optional)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none ${
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  rows={3}
                  placeholder="Include a personal message with your invitation..."
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Let them know why you&apos;d like to work together
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteMessage('');
                    setInvitingCreatorId(null);
                    setSelectedCreator(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDark 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvite}
                  disabled={sendingInvite}
                  className={`px-6 py-2 font-medium rounded-lg transition-all shadow-md ${
                    sendingInvite
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-lg'
                  } text-white`}
                >
                  {sendingInvite ? (
                    <span className="flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending...</span>
                    </span>
                  ) : (
                    'Send Invite'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
  };

  const renderAnalytics = () => {
    // Safe analytics data with defaults
    const safeAnalytics = {
      totalSpent: analytics?.totalSpent || 0,
      totalRewards: analytics?.totalRewards || 0,
      totalRewardValue: analytics?.totalRewardValue || 0,
      activeCampaigns: analytics?.activeCampaigns || 0,
      conversionRate: analytics?.conversionRate || 0,
      totalBriefs: analytics?.totalBriefs || 0,
      totalSubmissions: analytics?.totalSubmissions || 0,
      averageReward: analytics?.averageReward || 0,
      recentBriefs: analytics?.recentBriefs || [],
      topPerformingBriefs: analytics?.topPerformingBriefs || [],
      monthlyTrends: analytics?.monthlyTrends || [],
      briefPerformance: analytics?.briefPerformance || []
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
              <p className="metric-value">${safeAnalytics.totalRewardValue.toLocaleString()}</p>
              <p className="metric-label">Total Reward Value</p>
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

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-center">
                <img src="/icons/Green_icons/Brief1.png" alt="Total Briefs" className="w-8 h-8" />
              </div>
            </div>
            <div>
              <p className="metric-value">{safeAnalytics.totalBriefs}</p>
              <p className="metric-label">Total Briefs</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center">
                <img src="/icons/Green_icons/Submissions1.png" alt="Total Submissions" className="w-8 h-8" />
              </div>
            </div>
            <div>
              <p className="metric-value">{safeAnalytics.totalSubmissions}</p>
              <p className="metric-label">Total Submissions</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center justify-center">
                <img src="/icons/Green_icons/MoneyBag1.png" alt="Average Reward" className="w-8 h-8" />
              </div>
            </div>
            <div>
              <p className="metric-value">${safeAnalytics.averageReward.toLocaleString()}</p>
              <p className="metric-label">Average Reward</p>
            </div>
          </div>
        </div>

        {/* Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Monthly Trends</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {safeAnalytics.monthlyTrends.slice(-6).map((trend, _index) => (
                  <div key={_index} className="flex justify-between items-center">
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {trend.month}
                    </span>
                    <div className="flex space-x-4">
                      <span className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        {trend.briefs} briefs
                      </span>
                      <span className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        {trend.submissions} submissions
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Top Performing Briefs</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                {safeAnalytics.topPerformingBriefs.slice(0, 5).map((brief, _index) => (
                  <div key={brief.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {brief.title}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {brief.submissions} submissions
                      </p>
                    </div>
                    <div className={`px-2 py-1 text-xs rounded-full ${
                      brief.status === 'published' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {brief.status}
                    </div>
                  </div>
                ))}
                {safeAnalytics.topPerformingBriefs.length === 0 && (
                  <p className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    No briefs yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Brief Performance Breakdown */}
        {safeAnalytics.briefPerformance.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Brief Performance Breakdown</h3>
            </div>
            <div className="card-content">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className={`text-left py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Brief Title
                      </th>
                      <th className={`text-left py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Submissions
                      </th>
                      <th className={`text-left py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Reward Value
                      </th>
                      <th className={`text-left py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeAnalytics.briefPerformance.map((brief) => (
                      <tr key={brief.id} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {brief.title}
                        </td>
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {brief.submissions}
                        </td>
                        <td className={`py-3 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          ${brief.totalRewardValue.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            brief.status === 'published' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {brief.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCreateBrief = () => {
    // Open the side modal when this tab is active
    if (!showCreateBriefModal) {
      setShowCreateBriefModal(true);
    }
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className={`text-2xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Create Brief</h2>
        </div>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Create Brief Panel
          </h3>
          <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            The Create Brief panel should be opening on the side...
          </p>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'create-brief':
        return renderCreateBrief();
      case 'briefs':
        return renderBriefs();
      case 'manage-rewards':
        return <ManageRewardsPayments />;
      case 'creators':
        return renderCreators();
      case 'analytics':
        return renderAnalytics();
      // Wallet removed - brands pay directly via Stripe Checkout when funding briefs
      case 'messaging':
        return <MessagingSystem />;
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${
      isDark ? 'bg-black' : 'bg-gray-50'
    }`}>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white/10 dark:bg-gray-950/20 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo />
            <h1 className="text-lg font-semibold text-white">
              {activeTab === 'overview' ? 'Dashboard' : 
               activeTab === 'briefs' ? 'My Briefs' :
               activeTab === 'funded-briefs' ? 'Brief Management' :
               activeTab === 'winners' ? 'Select Winners' :
               activeTab === 'manage-rewards' ? 'Manage Rewards & Payments' :
               activeTab === 'creators' ? 'Creators' :
               activeTab === 'analytics' ? 'Analytics' :
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
      } ${isDark ? 'bg-gray-950' : 'bg-white'} border-r ${isDark ? 'border-gray-900' : 'border-gray-200'} lg:min-h-screen lg:fixed lg:left-0 lg:top-0 lg:z-40 flex flex-col overflow-y-auto transition-all duration-300 rounded-r-2xl shadow-lg`}>
        <div className="p-4 flex flex-col h-full">
          
          {/* Header with Logo */}
            <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {!sidebarCollapsed ? (
                <div className="flex items-center space-x-3">
                  <img 
                    src={isDark ? "/logo-light2.svg" : "/logo.svg"} 
                    alt="DraftBoard" 
                    className="w-20 h-6"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3 w-full">
                  <img 
                    src="/icons/draftboard-logo.svg" 
                    alt="DraftBoard" 
                    className="w-10 h-10"
                  />
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-950' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    title="Expand sidebar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
              {!sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-950' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Collapse sidebar"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
            </div>
            
          </div>

          {/* Navigation Items */}
          <nav className="space-y-0.5 flex-1">
            {filteredNavigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'messaging') {
                    handleTabChange('messaging');
                  } else {
                    handleTabChange(item.id);
                  }
                }}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center p-2' : 'px-4 py-3'} rounded-lg text-sm transition-all duration-200 ${
                  activeTab === item.id
                    ? isDark
                      ? 'bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg'
                      : 'bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg'
                    : isDark
                      ? `${sidebarCollapsed ? 'text-gray-200' : 'text-gray-300'} hover:bg-gray-900 hover:text-white`
                      : `${sidebarCollapsed ? 'text-gray-800' : 'text-gray-600'} hover:bg-gray-100 hover:text-gray-900`
                }`}
                title={sidebarCollapsed ? item.label : ''}
              >
                {item.icon === 'overview' && (
                  <span className={sidebarCollapsed ? '' : 'mr-3'}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                    </svg>
                  </span>
                )}
                {item.icon === 'wallet' && (
                  <span className={sidebarCollapsed ? '' : 'mr-3'}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </span>
                )}
                {item.icon === 'messaging' && (
                  <span className={sidebarCollapsed ? '' : 'mr-3'}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </span>
                )}
                {item.icon === 'create' && (
                  <span className={sidebarCollapsed ? '' : 'mr-3'}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                )}
                {item.icon === 'briefs' && (
                  <span className={sidebarCollapsed ? '' : 'mr-3'}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                )}
                {item.icon === 'submissions' && (
                  <span className={sidebarCollapsed ? '' : 'mr-3'}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </span>
                )}
                {item.icon === 'creators' && (
                  <span className={sidebarCollapsed ? '' : 'mr-3'}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </span>
                )}
                {item.icon === 'statistics' && (
                  <span className={sidebarCollapsed ? '' : 'mr-3'}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </span>
                )}
                {item.icon === 'rewards-payments' && (
                  <span className={sidebarCollapsed ? '' : 'mr-3'}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </span>
                )}
                {!sidebarCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-1">
              {accountNav.map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center p-4' : 'px-4 py-3'} rounded-lg text-sm transition-colors ${
                    isDark
                      ? 'text-gray-400 hover:bg-gray-900 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <span className={sidebarCollapsed ? '' : 'mr-3'}>
                    {item.id === 'settings' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : item.icon === 'logout' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    )}
                  </span>
                  {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
              ))}
            </div>
            
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-auto transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      } ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        {/* Desktop Header */}
        <div className="hidden lg:block border-b border-gray-200 dark:border-gray-700 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className={`text-2xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {activeTab === 'overview' ? 'Dashboard' : 
                 activeTab === 'briefs' ? 'My Briefs' :
                 activeTab === 'funded-briefs' ? 'Brief Management' :
                 activeTab === 'winners' ? 'Select Winners' :
                 activeTab === 'manage-rewards' ? 'Manage Rewards & Payments' :
                 activeTab === 'creators' ? 'Creators' :
                 activeTab === 'analytics' ? 'Analytics' :
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

      {/* Create Brief Side Modal */}
      {showCreateBriefModal && (
        <div className={`fixed inset-0 z-50 flex ${
          isDark ? 'bg-black bg-opacity-50' : 'bg-gray-900 bg-opacity-50'
        }`}>
          <div className="ml-auto w-full max-w-4xl h-full bg-white dark:bg-black shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`text-xl font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Create New Brief
              </h2>
              <button
                onClick={() => {
                  setShowCreateBriefModal(false);
                  setActiveTab(previousTab);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-950'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-full overflow-y-auto">
              <CreateBrief isSideModal={true} onClose={() => {
                setShowCreateBriefModal(false);
                setActiveTab(previousTab);
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Brief Modal */}
      {showEditBriefModal && editingBrief && (
        <EditBrief
          brief={editingBrief}
          isOpen={showEditBriefModal}
          onClose={() => {
            setShowEditBriefModal(false);
            setEditingBrief(null);
          }}
          onSuccess={handleEditBriefSuccess}
        />
      )}
    </div>
  );
};

export default BrandDashboard;
