import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import DefaultAvatar from './DefaultAvatar';
import AnimatedNotification from './AnimatedNotification';
import WinnerSelectionModal from './WinnerSelectionModal';

import { useToast } from '../contexts/ToastContext';
import BrandBriefCard from './BrandBriefCard';

import NotificationBell from './NotificationBell';
import LoadingSpinner from './LoadingSpinner';


// Lazy load Stripe-dependent components to prevent loading during login
const BrandWallet = lazy(() => import('./BrandWallet'));
const PaymentManagement = lazy(() => import('./PaymentManagement'));

interface Brief {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  status: 'active' | 'draft' | 'completed';
  submissions: number;
  deadline: string;
  reward: number;
  rewardType?: string;
  amountOfWinners?: number;
  winnersSelected?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Submission {
  id: string;
  creatorName: string;
  briefTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  thumbnail?: string;
}

interface Creator {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  
  socialInstagram?: string;
  socialTwitter?: string;
  socialLinkedIn?: string;
  socialTikTok?: string;
  socialYouTube?: string;
  isVerified: boolean;
}

interface Reward {
  id: string;
  briefTitle: string;
  briefId: string;
  rewardTiers: Array<{
    name: string;
    amount: number;
    description: string;
    winnerName?: string;
    winnerId?: string;
  }>;
  submittedAt: string;
  publishedAt?: string;
  status: 'published';
}

interface Draft {
  id: string;
  briefId: string;
  briefTitle: string;
  rewardTiers: Array<{
    id: string;
    name: string;
    amount: number;
    description: string;
    type: 'CASH' | 'CREDIT' | 'PRIZES';
  }>;
  savedAt: string;
}

interface DetailedSubmission {
  id: string;
  content: string;
  files?: string; // Now stores a single URL instead of array of file paths
  amount: number;
  submittedAt: string;
  creator: {
    fullName: string;
    userName: string;
    email: string;
    socialInstagram?: string;
    socialTwitter?: string;
    socialLinkedIn?: string;
    socialTikTok?: string;
    socialYouTube?: string;
  };
  brief: {
    title: string;
  };
}

interface EditingRewards {
  brief: Brief;
  rewardData?: Reward | Draft | null;
  type?: string;
}



const BrandDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreatorProfileModal, setShowCreatorProfileModal] = useState(false);
  const [showInviteCreatorModal, setShowInviteCreatorModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    message: '',
    briefId: ''
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [detailedSubmission, setDetailedSubmission] = useState<DetailedSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successNotification, setSuccessNotification] = useState({
    title: '',
    message: '',
    icon: ''
  });
  const [showEditRewardsModal, setShowEditRewardsModal] = useState(false);
  const [editingRewards, setEditingRewards] = useState<EditingRewards | null>(null);

  const [editIsLoading, setEditIsLoading] = useState(false);
  const [editAmountOfWinners, setEditAmountOfWinners] = useState(1);
  const [editWinnerRewards, setEditWinnerRewards] = useState<Array<{
    position: number;
    cashAmount: number;
    creditAmount: number;
    prizeDescription: string;
  }>>([]);
  
  // Winner selection state
  const [showWinnerSelectionModal, setShowWinnerSelectionModal] = useState(false);
  const [selectedBriefForWinners, setSelectedBriefForWinners] = useState<Brief | null>(null);
  // const [showSubmissionViewModal, setShowSubmissionViewModal] = useState(false);
  const [briefSubmissions, setBriefSubmissions] = useState<Array<{
    id: string;
    creatorName: string;
    content: string;
    files?: string;
    submittedAt: string;
    amount: number;
  }>>([]);
  
  const [metrics, setMetrics] = useState({
    activeBriefs: 0,
    submissionsThisWeek: 0,
    winnersSelected: 0,
    avgSubmissions: 0,
    totalSubmissions: 0
  });

  // Winner selection functions
  const handleSelectWinners = async (brief: Brief) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/brands/briefs/${brief.id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const submissionsData = await response.json();
        setBriefSubmissions(submissionsData);
        setSelectedBriefForWinners(brief);
        setShowWinnerSelectionModal(true);
      } else {
        showErrorToast('Failed to load submissions');
      }
    } catch (error) {
      showErrorToast('Failed to load submissions');
    }
  };



  const handleWinnersSelected = async (_winners: { submissionId: string; position: number }[]) => {
    try {
      // Refresh briefs data to show updated winner selection status
      await fetchDashboardData();
      showSuccessToast('Winners selected successfully!');
    } catch (error) {
      // Error refreshing data
    }
  };

  // Helper function to get reward information for a brief
  const getBriefRewardInfo = (briefId: string) => {
    const publishedReward = rewards.find(r => r.briefId === briefId);
    const draftReward = drafts.find(d => d.briefId === briefId);
    
    if (publishedReward) {
      return {
        type: 'published',
        totalAmount: publishedReward.rewardTiers.reduce((sum: number, tier) => sum + tier.amount, 0),
        tiers: publishedReward.rewardTiers.length,
        status: 'published'
      };
    } else if (draftReward) {
      return {
        type: 'draft',
        totalAmount: draftReward.rewardTiers.reduce((sum: number, tier) => sum + tier.amount, 0),
        tiers: draftReward.rewardTiers.length,
        status: 'draft'
      };
    } else {
      return {
        type: 'none',
        totalAmount: 0,
        tiers: 0,
        status: 'not_set'
      };
    }
  };

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

      // Fetch briefs
      const briefsResponse = await fetch('/api/brands/briefs', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      let briefsData = [];
      if (briefsResponse.ok) {
        briefsData = await briefsResponse.json();
        setBriefs(briefsData);
      }

      // Fetch submissions
      const submissionsResponse = await fetch('/api/brands/submissions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let submissionsData = [];
      if (submissionsResponse.ok) {
        submissionsData = await submissionsResponse.json();
        setSubmissions(submissionsData);
      }

      // Fetch creators
      const creatorsResponse = await fetch('/api/brands/creators', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let creatorsData = [];
      if (creatorsResponse.ok) {
        creatorsData = await creatorsResponse.json();
        setCreators(creatorsData);
      }

      // Fetch rewards and drafts
      const rewardsResponse = await fetch('/api/brands/rewards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let rewardsData = [];
      let draftsData = [];
      if (rewardsResponse.ok) {
        const responseData = await rewardsResponse.json();
        rewardsData = responseData.rewards || [];
        draftsData = responseData.drafts || [];
        setRewards(rewardsData);
        setDrafts(draftsData);
      }

      // Calculate metrics with the fetched data
      const activeBriefs = briefsData.filter((b: Brief) => b.status === 'active').length;
      const submissionsThisWeek = submissionsData.filter((s: Submission) => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(s.submittedAt) > weekAgo;
      }).length;
      const winnersSelected = submissionsData.filter((s: Submission) => s.status === 'approved').length;
      
      setMetrics({
        activeBriefs,
        submissionsThisWeek,
        winnersSelected,
        avgSubmissions: submissionsData.length,
        totalSubmissions: submissionsData.length
      });
    } catch (error) {
      // Error fetching dashboard data
    }
  };

  const handleViewBrief = (brief: Brief) => {
    setSelectedBrief(brief);
    setShowViewModal(true);
  };

  const handleEditBrief = (brief: Brief) => {
    setSelectedBrief(brief);
    setShowEditModal(true);
  };

  const handlePublishBrief = async (briefId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/briefs/${briefId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'active'
        })
      });

      if (response.ok) {
        // Refresh the briefs data
        fetchDashboardData();
        setShowEditModal(false);
        setSelectedBrief(null);
        showSuccessToast('Brief published successfully! 📢 Your brief is now live and accepting submissions.');
      } else {
        // Failed to publish brief
        showErrorToast('Failed to publish brief. Please try again.');
      }
    } catch (error) {
      // Error publishing brief
    }
  };

  const handleUpdateBrief = async (briefId: string, updatedData: Partial<Brief>) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/briefs/${briefId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        // Refresh the briefs data
        fetchDashboardData();
        setShowEditModal(false);
        setSelectedBrief(null);
        showSuccessToast('Brief updated successfully! ✏️ Your changes have been saved.');
      } else {
        // Failed to update brief
        showErrorToast('Failed to update brief. Please try again.');
      }
    } catch (error) {
      // Error updating brief
      showErrorToast('Error updating brief. Please try again.');
    }
  };

  const handleDeleteBrief = async (briefId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/briefs/${briefId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Refresh the briefs data
        fetchDashboardData();
        setShowViewModal(false);
        setSelectedBrief(null);
        showSuccessToast('Brief deleted successfully! 🗑️ The brief has been permanently removed.');
      } else {
        const errorData = await response.json();
        if (response.status === 400) {
          showErrorToast(errorData.error || 'Cannot delete brief with existing submissions.');
        } else {
          showErrorToast('Failed to delete brief. Please try again.');
        }
      }
    } catch (error) {
      showErrorToast('Error deleting brief. Please try again.');
    }
  };

  const handleViewCreatorProfile = (creator: Creator) => {
    setSelectedCreator(creator);
    setShowCreatorProfileModal(true);
  };

  const handleInviteCreator = (creator: Creator) => {
    setSelectedCreator(creator);
    setShowInviteModal(true);
  };

  const handleInviteCreatorGeneral = () => {
    setShowInviteCreatorModal(true);
  };

  const handleSubmitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCreator) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/brands/invite-creator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          creatorId: selectedCreator.id,
          message: inviteFormData.message,
          briefId: inviteFormData.briefId || null
        })
      });

      if (response.ok) {
        alert('Invitation sent successfully!');
        setShowInviteModal(false);
        setShowInviteCreatorModal(false);
        setSelectedCreator(null);
        setInviteFormData({ message: '', briefId: '' });
      } else {
        // Failed to send invitation
        alert('Failed to send invitation. Please try again.');
      }
    } catch (error) {
      // Error sending invitation
      alert('Error sending invitation. Please try again.');
    }
  };

  const handleGetCreatorContact = async (creatorId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/brands/creators/${creatorId}/contact`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const contactData = await response.json();
        const socialHandles = [
          contactData.socialInstagram && `Instagram: ${contactData.socialInstagram}`,
          contactData.socialTwitter && `Twitter: ${contactData.socialTwitter}`,
          contactData.socialLinkedIn && `LinkedIn: ${contactData.socialLinkedIn}`,
          contactData.socialTikTok && `TikTok: ${contactData.socialTikTok}`,
          contactData.socialYouTube && `YouTube: ${contactData.socialYouTube}`
        ].filter(Boolean).join('\n') || 'Not provided';
        
        alert(`Creator Contact Details:\n\nName: ${contactData.fullName}\nUsername: @${contactData.userName}\nEmail: ${contactData.email}\nSocial Handles:\n${socialHandles}\n`);
      } else {
        // Failed to get creator contact details
        alert('Unable to get creator contact details. Make sure you have submissions from this creator.');
      }
    } catch (error) {
      // Error getting creator contact details
      alert('Error getting creator contact details. Please try again.');
    }
  };

  // Submission action handlers
  const handleReviewSubmission = async (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowReviewModal(true);
    
    // Fetch detailed submission data
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/brands/submissions/${submission.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const detailedData = await response.json();
        setDetailedSubmission(detailedData);
      } else {
        // Failed to fetch detailed submission data
        setDetailedSubmission(null);
      }
    } catch (error) {
      // Error fetching detailed submission
      setDetailedSubmission(null);
    }
  };

  const handleRejectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleApproveSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowApproveModal(true);
  };

  const handleSubmitRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubmission || !rejectReason.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/brands/submissions/${selectedSubmission.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: rejectReason,
          rejectedAt: new Date().toISOString(),
          briefTitle: selectedSubmission.briefTitle
        })
      });

      if (response.ok) {
        // Refresh submissions data
        fetchDashboardData();
        setShowRejectModal(false);
        setSelectedSubmission(null);
        setRejectReason('');
        
        // Show simple notification for rejection (no animation for bad news)
        alert('Submission rejected successfully. The creator has been notified.');
      } else {
        // Failed to reject submission
        alert('Failed to reject submission. Please try again.');
      }
    } catch (error) {
      // Error rejecting submission
      alert('Error rejecting submission. Please try again.');
    }
  };

  const handleSubmitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubmission) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/brands/submissions/${selectedSubmission.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          approvedAt: new Date().toISOString(),
          briefTitle: selectedSubmission.briefTitle
        })
      });

      if (response.ok) {
        // Refresh submissions data
        fetchDashboardData();
        setShowApproveModal(false);
        setSelectedSubmission(null);
        
        // Show animated success notification
        setSuccessNotification({
          title: 'Submission Shortlisted! 🎉',
          message: 'The creator has been notified and is excited to work with your brand!',
          icon: '🏆'
        });
        setShowSuccessNotification(true);
      } else {
        // Failed to approve submission
        alert('Failed to approve submission. Please try again.');
      }
    } catch (error) {
      // Error approving submission
      alert('Error approving submission. Please try again.');
    }
  };

  const handleTabClick = (tabId: string) => {
    if (tabId === 'create') {
      navigate('/brand/create-brief');
    } else if (tabId === 'rewards-payments') {
      navigate('/rewards-payments');
    } else {
      setActiveTab(tabId);
    }
  };

  const navigation = [
    { id: 'overview', label: 'Overview', icon: '❤️' },
    { id: 'briefs', label: 'My Briefs', icon: '📄' },
    { id: 'submissions', label: 'Submissions', icon: '📚' },
    { id: 'create', label: 'Create a Brief', icon: '📄➕' },
    { id: 'creators', label: 'Creators', icon: '👥' },
    { id: 'rewards-payments', label: 'Rewards & Payments', icon: '🎯' },
    { id: 'wallet', label: 'Wallet', icon: '💳' },
    { id: 'payments', label: 'Payments', icon: '💰' },
  ];

  const accountNav = [
    { id: 'awards', label: 'Rewards', icon: '💰' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'logout', label: 'Logout', icon: '🚪', action: logout },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Grow Your Brand with Amazing Creators 🚀
        </h1>
        <p className="text-lg text-gray-300">
          Connect with talented creators and bring your brand vision to life with compelling content.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Active Briefs Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📄</span>
            </div>
          </div>
          <div className="text-white">
            <p className="text-3xl font-bold mb-2">{metrics.activeBriefs}</p>
            <p className="text-sm opacity-90">Active Briefs</p>
          </div>
        </div>

        {/* Submissions This Week Card */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
          <div className="text-white">
            <p className="text-3xl font-bold mb-2">{metrics.submissionsThisWeek}</p>
            <p className="text-sm opacity-90">Submissions This Week</p>
          </div>
        </div>

        {/* Winners Selected Card */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
          </div>
          <div className="text-white">
            <p className="text-3xl font-bold mb-2">{metrics.winnersSelected}</p>
            <p className="text-sm opacity-90">Winners Selected</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Recent Submissions</h2>
              <span className="text-sm text-gray-400">{submissions.length} total</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submissions.slice(0, 4).map((submission) => (
                <div key={submission.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-white">👤</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{submission.creatorName}</p>
                      <p className="text-xs text-gray-400">Applied to {submission.briefTitle}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        submission.status === 'approved' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                        submission.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
                        'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                      }`}>
                        {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleReviewSubmission(submission)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
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
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  View All Submissions →
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
                <p className="text-xs text-gray-400">Real-time creator activity</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-semibold">LIVE</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {submissions.slice(0, 5).map((submission, index) => (
                <div 
                  key={submission.id}
                  className={`p-3 rounded-lg border border-gray-700 transition-all duration-300 ${
                    index === 0 
                      ? 'bg-gradient-to-r from-green-900/30 to-blue-900/30 border-green-500/50' 
                      : 'bg-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                      index === 0 
                        ? 'bg-gradient-to-br from-green-500 to-blue-600 text-white' 
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      👤
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {submission.creatorName}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Applied to {submission.briefTitle}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 font-medium">
                        {Math.floor(Math.random() * 10) + 1}m ago
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
        <h2 className="text-2xl font-bold text-white">My Briefs</h2>
        <Link
          to="/brand/create-brief"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Brief
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {briefs.map((brief) => (
          <BrandBriefCard
            key={brief.id}
            brief={{
              ...brief,
              description: brief.description || '',
              amountOfWinners: brief.amountOfWinners || 1,
              brand: {
                id: user?.id || '',
                companyName: 'Your Brand',
                logo: undefined
              }
            }}
            onViewClick={(_briefData) => handleViewBrief(brief)}
            onEditClick={(_briefData) => handleEditBrief(brief)}
            onEditRewardsClick={(_briefData) => {
                  setEditingRewards({
                    brief,
                    rewardData: null,
                    type: 'edit'
                  });
                  setEditAmountOfWinners(brief.amountOfWinners || 1);
                  // Initialize winner rewards based on current amount of winners
                  const initialRewards = [];
                  for (let i = 1; i <= (brief.amountOfWinners || 1); i++) {
                    initialRewards.push({
                      position: i,
                      cashAmount: 0,
                      creditAmount: 0,
                      prizeDescription: ''
                    });
                  }
                  setEditWinnerRewards(initialRewards);
                  setShowEditRewardsModal(true);
                }}
            onSelectWinnersClick={(_briefData) => handleSelectWinners(brief)}
            onViewSubmissionsClick={() => {
              setActiveTab('submissions');
              setSubmissionFilter('all');
            }}
          />
        ))}
      </div>

      {/* View Modal */}
      {showViewModal && selectedBrief && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedBrief.title}</h3>
                <p className="text-sm text-gray-300 mt-1">Brief Details</p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-300 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Brief Overview */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-3">Brief Overview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="font-medium text-blue-900">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedBrief.status === 'active' ? 'bg-green-100 text-green-800' :
                    selectedBrief.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedBrief.status.charAt(0).toUpperCase() + selectedBrief.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-blue-900">Deadline:</span>
                  <span className="text-blue-900">{new Date(selectedBrief.deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-blue-900">Submissions:</span>
                  <span className="text-blue-900">{(() => {
                    try {
                      if (typeof selectedBrief.submissions === 'number') {
                        return selectedBrief.submissions;
                      } else if (Array.isArray(selectedBrief.submissions)) {
                        return (selectedBrief.submissions as unknown[]).length;
                      } else {
                        return 0;
                      }
                    } catch (error) {
                      return 0;
                    }
                  })()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-blue-900">Amount of Winners:</span>
                  <span className="text-blue-900">{selectedBrief.amountOfWinners || 1}</span>
                </div>
              </div>
            </div>

            {/* Reward Information */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700 mb-6">
              <h4 className="text-lg font-semibold text-white mb-4">Reward Information</h4>
              
              {selectedBrief.amountOfWinners ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <span className="font-medium text-green-900">Amount of Rewards:</span>
                      <div className="text-sm text-green-700 mt-1">
                        {selectedBrief.amountOfWinners || 1} rewards available
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl">🎯</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-white mb-2">Reward Status</h5>
                      <div className="text-sm text-gray-300">
                        {(() => {
                          const rewardInfo = getBriefRewardInfo(selectedBrief.id);
                          if (rewardInfo.type === 'published') {
                            return (
                              <div className="flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                <span className="text-green-700">Published</span>
                              </div>
                            );
                          } else if (rewardInfo.type === 'draft') {
                            return (
                              <div className="flex items-center">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                <span className="text-yellow-700">Draft</span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                <span className="text-blue-700">Rewards configured</span>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-white mb-2">Reward Configuration</h5>
                      <div className="text-sm text-gray-300">
                        <div className="flex items-center justify-between">
                          <span>Total Rewards:</span>
                          <span className="font-medium">{selectedBrief.amountOfWinners || 1}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span>Status:</span>
                          <span className="font-medium">
                            {selectedBrief.status === 'active' ? 'Active' : 
                             selectedBrief.status === 'draft' ? 'Draft' : 'Completed'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h5 className="text-lg font-semibold text-orange-900 mb-2">No Rewards Configured</h5>
                  <p className="text-orange-700 mb-4">This brief doesn&apos;t have any rewards set up yet.</p>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setEditingRewards({
                        brief: selectedBrief,
                        rewardData: null,
                        type: 'edit'
                      });
                      setEditAmountOfWinners(selectedBrief.amountOfWinners || 1);
                      const initialRewards = [];
                      for (let i = 1; i <= (selectedBrief.amountOfWinners || 1); i++) {
                        initialRewards.push({
                          position: i,
                          cashAmount: 0,
                          creditAmount: 0,
                          prizeDescription: ''
                        });
                      }
                      setEditWinnerRewards(initialRewards);
                      setShowEditRewardsModal(true);
                    }}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Configure Rewards
                  </button>
                </div>
              )}
            </div>

            {/* Brief Details */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700 mb-6">
              <h4 className="text-lg font-semibold text-white mb-4">Brief Details</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-white mb-2">Description</h5>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {selectedBrief.description || 'No description provided'}
                  </p>
                </div>
                
                <div>
                  <h5 className="font-medium text-white mb-2">Requirements</h5>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {selectedBrief.requirements || 'No requirements specified'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-white mb-2">Created</h5>
                    <p className="text-gray-300 text-sm">
                      {selectedBrief.createdAt ? new Date(selectedBrief.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium text-white mb-2">Last Updated</h5>
                    <p className="text-gray-300 text-sm">
                      {selectedBrief.updatedAt ? new Date(selectedBrief.updatedAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-50"
              >
                Close
              </button>
              {selectedBrief.rewardType && (
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setEditingRewards({
                      brief: selectedBrief,
                      rewardData: null,
                      type: 'edit'
                    });
                    setEditAmountOfWinners(selectedBrief.amountOfWinners || 1);
                    const initialRewards = [];
                    for (let i = 1; i <= (selectedBrief.amountOfWinners || 1); i++) {
                      initialRewards.push({
                        position: i,
                        cashAmount: 0,
                        creditAmount: 0,
                        prizeDescription: ''
                      });
                    }
                    setEditWinnerRewards(initialRewards);
                    setShowEditRewardsModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit Rewards
                </button>
              )}
              <button
                onClick={() => {
                  const shareUrl = `${window.location.origin}/brand/${user?.id || 'unknown'}/briefs`;
                  window.open(shareUrl, '_blank');
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                📤 Share Link
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditBrief(selectedBrief);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Edit Brief
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedBrief && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Edit Brief</h3>
                <p className="text-sm text-gray-300 mt-1">Update brief information and settings</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-300 text-xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdateBrief(selectedBrief.id, {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                requirements: formData.get('requirements') as string,
                amountOfWinners: parseInt(formData.get('amountOfWinners') as string) || 1,
                deadline: formData.get('deadline') as string,
                status: formData.get('status') as 'draft' | 'active'
              });
            }}>
              
              {/* Basic Information */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Brief Title *</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={selectedBrief.title}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      name="status"
                      defaultValue={selectedBrief.status}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">📝 Draft</option>
                      <option value="active">🚀 Active</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700 mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Brief Content</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                    <textarea
                      name="description"
                      defaultValue={selectedBrief.description || ''}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-white"
                      placeholder="Describe what you're looking for from creators..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Requirements *</label>
                    <textarea
                      name="requirements"
                      defaultValue={selectedBrief.requirements || ''}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-white"
                      placeholder="List specific requirements, deliverables, and guidelines..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Reward Configuration */}
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-700 mb-6">
                <h4 className="text-lg font-semibold text-green-900 dark:text-green-400 mb-4">Reward Configuration</h4>
                  <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount of Rewards *</label>
                  <input
                    type="number"
                      name="amountOfWinners"
                    min="1"
                    max="50"
                      defaultValue={selectedBrief.amountOfWinners || 1}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-white"
                    placeholder="Enter number of rewards (1-50)"
                      required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter a number between 1 and 50</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-700 mb-6">
                <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-400 mb-4">Timeline</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Deadline *</label>
                  <input
                    type="date"
                    name="deadline"
                    defaultValue={new Date(selectedBrief.deadline).toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-white"
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Brief
                </button>
                {selectedBrief.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => handlePublishBrief(selectedBrief.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    🚀 Publish Brief
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderSubmissions = () => {
    const filteredSubmissions = submissions.filter(submission => {
      if (submissionFilter === 'all') return true;
      return submission.status === submissionFilter;
    });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Submissions</h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => setSubmissionFilter('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                submissionFilter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-300 hover:bg-gray-300'
              }`}
            >
              All ({submissions.length})
            </button>
            <button 
              onClick={() => setSubmissionFilter('pending')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                submissionFilter === 'pending' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-300 hover:bg-gray-300'
              }`}
            >
              Pending ({submissions.filter(s => s.status === 'pending').length})
            </button>
            <button 
              onClick={() => setSubmissionFilter('approved')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                submissionFilter === 'approved' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-300 hover:bg-gray-300'
              }`}
            >
              Shortlist ({submissions.filter(s => s.status === 'approved').length})
            </button>
            <button 
              onClick={() => setSubmissionFilter('rejected')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                submissionFilter === 'rejected' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-300 hover:bg-gray-300'
              }`}
            >
              Rejected ({submissions.filter(s => s.status === 'rejected').length})
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brief</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brief Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DefaultAvatar name={submission.creatorName} size="sm" className="mr-3" />
                        <span className="text-sm font-medium text-white">{submission.creatorName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <button 
                        onClick={() => {
                          // Filter submissions to show only this brief
                          const brief = briefs.find(b => b.title === submission.briefTitle);
                          if (brief) {
                            setSelectedBrief(brief);
                            // You could add a state to filter submissions by brief ID
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {submission.briefTitle}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {(() => {
                        const brief = briefs.find(b => b.title === submission.briefTitle);
                        if (brief?.rewardType) {
                          const rewardTypeDisplay = brief.rewardType === 'CASH' ? '💰 Cash' : 
                                                   brief.rewardType === 'CREDIT' ? '🎫 Credit' : 
                                                   brief.rewardType === 'PRIZES' ? '🎁 Prizes' : brief.rewardType;
                          return rewardTypeDisplay;
                        } else {
                          return 'Not set';
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                        submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {submission.status === 'approved' ? 'Shortlisted' :
                         submission.status === 'rejected' ? 'Rejected' :
                         'Pending Review'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleReviewSubmission(submission)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Review
                      </button>
                      {submission.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApproveSubmission(submission)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectSubmission(submission)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderCreators = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Creators</h2>
        <button 
          onClick={handleInviteCreatorGeneral}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Invite Creator
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creators.map((creator) => (
          <div key={creator.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
            <div className="flex items-center mb-4">
              <DefaultAvatar name={creator.fullName} size="md" className="mr-3" />
              <div>
                <h3 className="font-semibold text-white">{creator.fullName}</h3>
                <p className="text-sm text-gray-300">@{creator.userName}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-300 mb-4">
              <p>Email: {creator.email}</p>
      
              <p>Verified: {creator.isVerified ? 'Yes' : 'No'}</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => handleViewCreatorProfile(creator)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm transition-colors"
              >
                View Profile
              </button>
              <button 
                onClick={() => handleInviteCreator(creator)}
                className="flex-1 border border-blue-600 text-blue-600 py-2 px-4 rounded-md hover:bg-blue-50 text-sm transition-colors"
              >
                Invite
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Creator Profile Modal */}
      {showCreatorProfileModal && selectedCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Creator Profile</h3>
              <button
                onClick={() => setShowCreatorProfileModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-300 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <DefaultAvatar name={selectedCreator.fullName} size="xl" className="mr-4" />
                <div>
                  <h4 className="text-lg font-semibold text-white">{selectedCreator.fullName}</h4>
                  <p className="text-gray-300">@{selectedCreator.userName}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-white">Email:</span>
                  <p className="text-gray-300">{selectedCreator.email}</p>
                </div>
                <div>
                  
                </div>
                <div>
                  <span className="font-medium text-white">Verified:</span>
                  <p className="text-gray-300">{selectedCreator.isVerified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="font-medium text-white">Social Handles:</span>
                  <p className="text-gray-300">
                    {[
                      selectedCreator.socialInstagram && `Instagram: ${selectedCreator.socialInstagram}`,
                      selectedCreator.socialTwitter && `Twitter: ${selectedCreator.socialTwitter}`,
                      selectedCreator.socialLinkedIn && `LinkedIn: ${selectedCreator.socialLinkedIn}`,
                      selectedCreator.socialTikTok && `TikTok: ${selectedCreator.socialTikTok}`,
                      selectedCreator.socialYouTube && `YouTube: ${selectedCreator.socialYouTube}`
                    ].filter(Boolean).join(', ') || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowCreatorProfileModal(false)}
                className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
              <button
                onClick={() => handleGetCreatorContact(selectedCreator.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Get Contact Details
              </button>
              <button
                onClick={() => {
                  setShowCreatorProfileModal(false);
                  handleInviteCreator(selectedCreator);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Invite to Brief
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Creator Modal */}
      {showInviteModal && selectedCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Invite {selectedCreator.fullName}</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-500 hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message to Creator
                </label>
                <textarea
                  value={inviteFormData.message}
                  onChange={(e) => setInviteFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell the creator about your project and why you'd like to work with them..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Brief (Optional)
                </label>
                <select
                  value={inviteFormData.briefId}
                  onChange={(e) => setInviteFormData(prev => ({ ...prev, briefId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No specific brief</option>
                  {briefs.filter(b => b.status === 'active').map(brief => (
                    <option key={brief.id} value={brief.id}>{brief.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* General Invite Creator Modal */}
      {showInviteCreatorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Invite Creator</h3>
              <button
                onClick={() => setShowInviteCreatorModal(false)}
                className="text-gray-500 hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-300">
                To invite a creator, you can:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li>Click &quot;Invite&quot; on any creator card to send them a direct invitation</li>
                <li>Share your brief link with creators you know</li>
                <li>Use the &quot;View Profile&quot; button to see more details about creators</li>
                <li>Contact creators directly if you have their contact information</li>
              </ul>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> The best way to attract creators is to create compelling briefs with clear requirements and fair compensation.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInviteCreatorModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRewards = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Rewards Management</h2>
          <button 
            onClick={() => setActiveTab('briefs')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manage Briefs
          </button>
        </div>

        {/* Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">📋</div>
              <div>
                <h3 className="text-lg font-semibold text-white">Total Briefs</h3>
                <p className="text-3xl font-bold text-blue-600">{briefs.length}</p>
              </div>
            </div>
            <p className="text-sm text-gray-300">Active and draft briefs</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">💰</div>
              <div>
                <h3 className="text-lg font-semibold text-white">Rewards Configured</h3>
                <p className="text-3xl font-bold text-green-600">
                  {briefs.filter(brief => brief.rewardType).length}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-300">Briefs with reward types set</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">🎯</div>
              <div>
                <h3 className="text-lg font-semibold text-white">Total Winners</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {briefs.reduce((total, brief) => total + (brief.amountOfWinners || 0), 0)}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-300">Across all briefs</p>
          </div>
        </div>

        {/* Briefs with Rewards Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Briefs with Rewards</h3>
          {briefs.filter(brief => brief.rewardType).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {briefs.filter(brief => brief.rewardType).map((brief) => (
                <BrandBriefCard
                  key={brief.id}
                  brief={{
                    ...brief,
                    description: brief.description || '',
                    amountOfWinners: brief.amountOfWinners || 1,
                    brand: {
                      id: brief.id,
                      companyName: 'Your Brand',
                      logo: undefined
                    }
                  }}
                  onViewClick={(_briefData) => handleViewBrief(brief)}
                  onEditClick={(_briefData) => handleEditBrief(brief)}
                  onEditRewardsClick={(_briefData) => {
                          setEditingRewards({
                            brief,
                            rewardData: null,
                            type: 'edit'
                          });
                          setEditAmountOfWinners(brief.amountOfWinners || 1);
                          // Initialize winner rewards
                          const initialRewards = [];
                          for (let i = 1; i <= (brief.amountOfWinners || 1); i++) {
                            initialRewards.push({
                              position: i,
                              cashAmount: 0,
                              creditAmount: 0,
                              prizeDescription: ''
                            });
                          }
                          setEditWinnerRewards(initialRewards);
                          setShowEditRewardsModal(true);
                        }}
                  onSelectWinnersClick={(_briefData) => handleSelectWinners(brief)}
                  onViewSubmissionsClick={() => {
                          setActiveTab('submissions');
                          setSubmissionFilter('all');
                        }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-700">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-lg font-semibold text-white mb-2">No rewards configured yet</h3>
              <p className="text-gray-300 mb-4">Start by creating a brief and setting up rewards for your campaigns</p>
              <div className="flex justify-center space-x-3">
                <button 
                  onClick={() => navigate('/brand/create-brief')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Brief
                </button>
                <button 
                  onClick={() => setActiveTab('briefs')}
                  className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  View All Briefs
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Briefs without Rewards Section */}
        {briefs.filter(brief => !brief.rewardType).length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Briefs Needing Rewards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {briefs.filter(brief => !brief.rewardType).map((brief) => (
                <BrandBriefCard
                  key={brief.id}
                  brief={{
                    ...brief,
                    description: brief.description || '',
                    amountOfWinners: brief.amountOfWinners || 1,
                    brand: {
                      id: brief.id,
                      companyName: 'Your Brand',
                      logo: undefined
                    }
                  }}
                  onViewClick={(_briefData) => handleViewBrief(brief)}
                  onEditClick={(_briefData) => handleEditBrief(brief)}
                  onEditRewardsClick={(_briefData) => {
                        setEditingRewards({
                          brief,
                          rewardData: null,
                          type: 'edit'
                        });
                        setEditAmountOfWinners(brief.amountOfWinners || 1);
                        // Initialize winner rewards
                        const initialRewards = [];
                        for (let i = 1; i <= (brief.amountOfWinners || 1); i++) {
                          initialRewards.push({
                            position: i,
                            cashAmount: 0,
                            creditAmount: 0,
                            prizeDescription: ''
                          });
                        }
                        setEditWinnerRewards(initialRewards);
                        setShowEditRewardsModal(true);
                      }}
                  onSelectWinnersClick={(_briefData) => handleSelectWinners(brief)}
                  onViewSubmissionsClick={() => {
                    setActiveTab('submissions');
                    setSubmissionFilter('all');
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => navigate('/brand/create-brief')}
              className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-left"
            >
              <div className="text-2xl mb-2">📝</div>
              <h4 className="font-semibold mb-1">Create New Brief</h4>
              <p className="text-sm text-blue-100">Start a new campaign with rewards</p>
            </button>
            
            <button 
              onClick={() => setActiveTab('briefs')}
              className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-left"
            >
              <div className="text-2xl mb-2">📋</div>
              <h4 className="font-semibold mb-1">Manage Briefs</h4>
              <p className="text-sm text-green-100">View and edit all your briefs</p>
            </button>
            
            <button 
              onClick={() => setActiveTab('submissions')}
              className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors text-left"
            >
              <div className="text-2xl mb-2">📥</div>
              <h4 className="font-semibold mb-1">Review Submissions</h4>
              <p className="text-sm text-purple-100">Evaluate creator submissions</p>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Settings</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
        <div className="flex items-center mb-6">
          <DefaultAvatar name={user?.companyName || 'Brand'} size="xl" className="mr-4" />
          <div>
            <h3 className="text-xl font-semibold text-white">{user?.companyName || 'Brand Name'}</h3>
            <p className="text-gray-300 dark:text-gray-400">{user?.email || 'brand@example.com'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-white mb-3">Company Information</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300">Company Name</label>
                <input type="text" defaultValue={user?.companyName || ''} className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Contact Name</label>
                <input type="text" placeholder="Contact person name" className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <input type="email" defaultValue={user?.email || ''} className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-white" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Preferences</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300">Notification Settings</label>
                <select className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-white">
                  <option>All notifications</option>
                  <option>Important only</option>
                  <option>None</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Privacy Level</label>
                <select className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-white">
                  <option>Public</option>
                  <option>Private</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Language</label>
                <select className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-white">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );

  // Review Submission Modal
  const renderReviewModal = () => (
    showReviewModal && selectedSubmission && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Review Submission</h3>
            <button
              onClick={() => {
                setShowReviewModal(false);
                setDetailedSubmission(null);
              }}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-300 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Creator Information */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-3">Creator Information</h4>
              <div className="flex items-center mb-3">
                <DefaultAvatar name={detailedSubmission?.creator?.fullName || selectedSubmission.creatorName} size="md" className="mr-3" />
                <div>
                  <p className="font-medium text-white">{detailedSubmission?.creator?.fullName || selectedSubmission.creatorName}</p>
                  <p className="text-sm text-gray-300">@{detailedSubmission?.creator?.userName || 'creator'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Brief:</span>
                  <p className="text-gray-300">{detailedSubmission?.brief?.title || selectedSubmission.briefTitle}</p>
                </div>
                <div>
                  <span className="font-medium">Submitted:</span>
                  <p className="text-gray-300">{new Date(selectedSubmission.submittedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                    selectedSubmission.status === 'approved' ? 'bg-green-100 text-green-800' :
                    selectedSubmission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedSubmission.status === 'approved' ? 'Shortlisted' :
                     selectedSubmission.status === 'rejected' ? 'Rejected' :
                     'Pending Review'}
                  </span>
                </div>
                {detailedSubmission?.creator?.email && (
                  <div>
                    <span className="font-medium">Email:</span>
                    <p className="text-gray-300">{detailedSubmission.creator.email}</p>
                  </div>
                )}
                {(detailedSubmission?.creator?.socialInstagram || 
                  detailedSubmission?.creator?.socialTwitter || 
                  detailedSubmission?.creator?.socialLinkedIn || 
                  detailedSubmission?.creator?.socialTikTok || 
                  detailedSubmission?.creator?.socialYouTube) && (
                  <div>
                    <span className="font-medium">Social:</span>
                    <p className="text-gray-300">
                      {[
                        detailedSubmission.creator.socialInstagram && `Instagram: ${detailedSubmission.creator.socialInstagram}`,
                        detailedSubmission.creator.socialTwitter && `Twitter: ${detailedSubmission.creator.socialTwitter}`,
                        detailedSubmission.creator.socialLinkedIn && `LinkedIn: ${detailedSubmission.creator.socialLinkedIn}`,
                        detailedSubmission.creator.socialTikTok && `TikTok: ${detailedSubmission.creator.socialTikTok}`,
                        detailedSubmission.creator.socialYouTube && `YouTube: ${detailedSubmission.creator.socialYouTube}`
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Content Submission Link */}
            <div>
              <h4 className="font-semibold text-white mb-3">Content Submission Link</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                {detailedSubmission ? (
                  <>
                    {detailedSubmission.files ? (
                      <div className="mb-4">
                        <div className="bg-white p-3 rounded border">
                          <a 
                            href={detailedSubmission.files} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm break-all"
                          >
                            {detailedSubmission.files}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <div className="bg-white p-3 rounded border text-sm text-gray-500">
                          No content submission link provided
                        </div>
                      </div>
                    )}

                    {/* Submission Details */}
                    <div className="text-sm text-gray-500 border-t pt-3">
                      <p><strong>Amount:</strong> ${detailedSubmission.amount}</p>
                      <p><strong>Submitted:</strong> {new Date(detailedSubmission.submittedAt).toLocaleString()}</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">📄</div>
                    <p className="text-gray-300">Loading submission content...</p>
                  </div>
                )}
              </div>
            </div>


          </div>

          <div className="mt-6 flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowReviewModal(false);
                setDetailedSubmission(null);
              }}
              className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-50"
            >
              Close
            </button>
            {selectedSubmission.status === 'pending' && (
              <>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    handleApproveSubmission(selectedSubmission);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Approve & Shortlist
                </button>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    handleRejectSubmission(selectedSubmission);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  );

  // Reject Submission Modal
  const renderRejectModal = () => (
    showRejectModal && selectedSubmission && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Reject Submission</h3>
            <button
              onClick={() => setShowRejectModal(false)}
              className="text-gray-500 hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">About this submission</h4>
              <p className="text-sm text-yellow-700">
                <strong>Creator:</strong> {selectedSubmission.creatorName}<br />
                <strong>Brief:</strong> {selectedSubmission.briefTitle}<br />
                <strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
              </p>
            </div>

            <form onSubmit={handleSubmitRejection}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Please provide a clear reason for rejecting this submission. This will be shared with the creator."
                  required
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <h4 className="font-semibold text-white mb-2">What happens next?</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• The creator will be notified of the rejection</li>
                  <li>• The submission will be moved to the &quot;Rejected&quot; tab</li>
                  <li>• The rejection reason will be tracked for future reference</li>
                  <li>• The creator can still apply to other briefs</li>
                </ul>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Reject Submission
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  );

  // Approve Submission Modal
  const renderApproveModal = () => (
    showApproveModal && selectedSubmission && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Approve & Shortlist</h3>
            <button
              onClick={() => setShowApproveModal(false)}
              className="text-gray-500 hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">About this submission</h4>
              <p className="text-sm text-green-700">
                <strong>Creator:</strong> {selectedSubmission.creatorName}<br />
                <strong>Brief:</strong> {selectedSubmission.briefTitle}<br />
                <strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
              </p>
            </div>

            <form onSubmit={handleSubmitApproval}>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• The creator will be notified that their work has been shortlisted</li>
                  <li>• The submission will be moved to the &quot;Shortlist&quot; tab</li>
                  <li>• You can review all shortlisted submissions before making final decisions</li>
                  <li>• The creator will be excited to work with your brand</li>
                </ul>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Approve & Shortlist
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  );

  const renderEditRewardsModal = () => {
    if (!showEditRewardsModal || !editingRewards) return null;

    const { brief } = editingRewards;

    const handleSave = async () => {
      setEditIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Update the brief with new amount of winners
        const briefResponse = await fetch(`/api/briefs/${brief.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            amountOfWinners: editAmountOfWinners
          })
        });

        if (briefResponse.ok) {
          setShowSuccessNotification(true);
          setSuccessNotification({
            title: 'Rewards Updated',
            message: 'Amount of rewards and winner rewards have been updated successfully!',
            icon: '✅'
          });
          setShowEditRewardsModal(false);
          setEditingRewards(null);
          fetchDashboardData();
        } else {
          alert('Failed to update rewards. Please try again.');
        }
      } catch (error) {
        alert('Error updating rewards. Please try again.');
      } finally {
        setEditIsLoading(false);
      }
    };

    const handleAmountOfWinnersChange = (amount: number) => {
      setEditAmountOfWinners(amount);
      // Update winner rewards array
      const newRewards = [];
      for (let i = 1; i <= amount; i++) {
        const existingReward = editWinnerRewards.find(r => r.position === i);
        newRewards.push({
          position: i,
          cashAmount: existingReward?.cashAmount || 0,
          creditAmount: existingReward?.creditAmount || 0,
          prizeDescription: existingReward?.prizeDescription || ''
        });
      }
      setEditWinnerRewards(newRewards);
    };

    const handleWinnerRewardChange = (position: number, field: string, value: string | number) => {
      setEditWinnerRewards(prev => prev.map(reward => 
        reward.position === position 
          ? { ...reward, [field]: value }
          : reward
      ));
    };

    const calculateTotalReward = () => {
      return editWinnerRewards.reduce((total, reward) => {
        return total + (reward.cashAmount || 0) + (reward.creditAmount || 0);
      }, 0);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Edit Rewards</h3>
              <p className="text-sm text-gray-300 mt-1">{brief.title}</p>
            </div>
            <button
              onClick={() => {
                setShowEditRewardsModal(false);
                setEditingRewards(null);
              }}
              className="text-gray-500 hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Brief Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-900">Status:</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  brief.status === 'active' ? 'bg-green-100 text-green-800' :
                  brief.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-900">Current Reward Type:</span>
                <span className="ml-2">
                  {brief.rewardType ? (
                    brief.rewardType === 'CASH' ? '💰 Cash' : 
                    brief.rewardType === 'CREDIT' ? '🎫 Credit' : 
                    brief.rewardType === 'PRIZES' ? '🎁 Prizes' : brief.rewardType
                  ) : 'Not set'}
                </span>
              </div>
            </div>
          </div>

          {/* Amount of Rewards Selection */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Amount of Rewards</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amount of Rewards *</label>
              <input
                type="number"
                min="1"
                max="50"
                value={editAmountOfWinners}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 1 && value <= 50) {
                    handleAmountOfWinnersChange(value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter number of rewards (1-50)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter a number between 1 and 50</p>
            </div>
          </div>

          {/* Winner Rewards */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Winner Rewards</h3>
            <p className="text-sm text-gray-300 mb-6">
              Set rewards for each winning position. You can mix cash, credits, and prizes for each winner.
            </p>
            
            {editWinnerRewards.length > 0 && (
              <div className="space-y-4">
                {editWinnerRewards.map((reward) => (
                  <div key={reward.position} className="border border-gray-700 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-white">
                        Reward {reward.position}
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Cash Amount ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={reward.cashAmount || ''}
                          onChange={(e) => handleWinnerRewardChange(reward.position, 'cashAmount', Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Credit Amount
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={reward.creditAmount || ''}
                          onChange={(e) => handleWinnerRewardChange(reward.position, 'creditAmount', Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Prize Description
                        </label>
                        <input
                          type="text"
                          value={reward.prizeDescription || ''}
                          onChange={(e) => handleWinnerRewardChange(reward.position, 'prizeDescription', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Product bundle, Gift card, Experience"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Total Calculator */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-blue-900">Campaign Total:</span>
                    <span className="text-2xl font-bold text-blue-900">
                      ${calculateTotalReward().toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mt-2">
                    Total cash value of all rewards (excluding prizes)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
            <button
              onClick={() => {
                setShowEditRewardsModal(false);
                setEditingRewards(null);
              }}
              className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={editIsLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {editIsLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'briefs':
        return renderBriefs();
      case 'submissions':
        return renderSubmissions();
      case 'creators':
        return renderCreators();
      case 'wallet':
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" color="blue" text="Loading wallet..." /></div>}>
            <BrandWallet />
          </Suspense>
        );
      case 'payments':
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" color="blue" text="Loading payments..." /></div>}>
            <PaymentManagement />
          </Suspense>
        );
      case 'awards':
        return renderRewards();
      case 'settings':
        return renderSettings();
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
            <img src="/logo-light2.svg" alt="DraftBoard" className="h-8 w-auto mr-3" style={{filter: 'drop-shadow(0 0 4px rgba(34,197,94,0.3))'}} />
            <span className="font-bold text-lg text-white">{user?.companyName || 'Brand'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <NotificationBell />
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
              placeholder="Search creators, briefs, or submissions..."
              className="w-full pl-4 pr-10 py-2 text-sm border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
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
          <div className="flex items-center justify-center mb-6 lg:mb-8">
            <div className="relative">
              <img src="/logo-light2.svg" alt="DraftBoard" className="h-10 w-auto" style={{filter: 'drop-shadow(0 0 8px rgba(34,197,94,0.4))'}} />
            </div>
          </div>

          {/* Main Navigation */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">Discover</h3>
            <nav className="space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200 group ${
                    activeTab === item.id
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                  title={item.label}
                >
                  <span className={`mr-3 text-base transition-all duration-200 ${
                    activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  }`}>{item.icon}</span>
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
                  <span className={`mr-3 text-base transition-all duration-200 ${
                    activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  }`}>{item.icon}</span>
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
                  {user?.companyName?.charAt(0) || 'B'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.companyName || 'Brand Account'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email || 'brand@example.com'}
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
                 activeTab === 'briefs' ? 'My Briefs' :
                 activeTab === 'submissions' ? 'Submissions' :
                 activeTab === 'creators' ? 'Creators' :
                 activeTab === 'wallet' ? 'Wallet' :
                 activeTab === 'payments' ? 'Payments' :
                 activeTab === 'awards' ? 'Rewards' :
                 activeTab === 'settings' ? 'Settings' : 'Dashboard'}
              </h1>
              
              {/* Search Bar */}
              {activeTab === 'overview' && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search creators, briefs, or submissions..."
                    className="w-80 pl-4 pr-10 py-2 text-sm border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
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
              <DefaultAvatar name={user?.companyName || 'Brand'} size="md" />
            </div>
          </div>
        </div>
        
        <div className="p-4 lg:p-8">
          {renderContent()}
        </div>
      </div>

      {/* Modals */}
      {showViewModal && selectedBrief && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedBrief.title}</h3>
                <p className="text-sm text-gray-300 mt-1">Brief Details</p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-300 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Brief Overview */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-3">Brief Overview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="font-medium text-blue-900">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedBrief.status === 'active' ? 'bg-green-100 text-green-800' :
                    selectedBrief.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedBrief.status.charAt(0).toUpperCase() + selectedBrief.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-blue-900">Deadline:</span>
                  <span className="text-blue-900">{new Date(selectedBrief.deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-blue-900">Submissions:</span>
                  <span className="text-blue-900">{(() => {
                    try {
                      if (typeof selectedBrief.submissions === 'number') {
                        return selectedBrief.submissions;
                      } else if (Array.isArray(selectedBrief.submissions)) {
                        return (selectedBrief.submissions as unknown[]).length;
                      } else {
                        return 0;
                      }
                    } catch (error) {
                      return 0;
                    }
                  })()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-blue-900">Amount of Winners:</span>
                  <span className="text-blue-900">{selectedBrief.amountOfWinners || 1}</span>
                </div>
              </div>
            </div>

            {/* Reward Information */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700 mb-6">
              <h4 className="text-lg font-semibold text-white mb-4">Reward Information</h4>
              
              {selectedBrief.amountOfWinners ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <span className="font-medium text-green-900">Amount of Rewards:</span>
                      <div className="text-sm text-green-700 mt-1">
                        {selectedBrief.amountOfWinners || 1} rewards available
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl">🎯</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-white mb-2">Reward Status</h5>
                      <div className="text-sm text-gray-300">
                        {(() => {
                          const rewardInfo = getBriefRewardInfo(selectedBrief.id);
                          if (rewardInfo.type === 'published') {
                            return (
                              <div className="flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                <span className="text-green-700">Published</span>
                              </div>
                            );
                          } else if (rewardInfo.type === 'draft') {
                            return (
                              <div className="flex items-center">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                <span className="text-yellow-700">Draft</span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                <span className="text-blue-700">Rewards configured</span>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-white mb-2">Reward Configuration</h5>
                      <div className="text-sm text-gray-300">
                        <div className="flex items-center justify-between">
                          <span>Total Rewards:</span>
                          <span className="font-medium">{selectedBrief.amountOfWinners || 1}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span>Status:</span>
                          <span className="font-medium">
                            {selectedBrief.status === 'active' ? 'Active' : 
                             selectedBrief.status === 'draft' ? 'Draft' : 'Completed'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h5 className="text-lg font-semibold text-orange-900 mb-2">No Rewards Configured</h5>
                  <p className="text-orange-700 mb-4">This brief doesn&apos;t have any rewards set up yet.</p>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setEditingRewards({
                        brief: selectedBrief,
                        rewardData: null,
                        type: 'edit'
                      });
                      setEditAmountOfWinners(selectedBrief.amountOfWinners || 1);
                      const initialRewards = [];
                      for (let i = 1; i <= (selectedBrief.amountOfWinners || 1); i++) {
                        initialRewards.push({
                          position: i,
                          cashAmount: 0,
                          creditAmount: 0,
                          prizeDescription: ''
                        });
                      }
                      setEditWinnerRewards(initialRewards);
                      setShowEditRewardsModal(true);
                    }}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Configure Rewards
                  </button>
                </div>
              )}
            </div>

            {/* Brief Details */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-700 mb-6">
              <h4 className="text-lg font-semibold text-white mb-4">Brief Details</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-white mb-2">Description</h5>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {selectedBrief.description || 'No description provided'}
                  </p>
                </div>
                
                <div>
                  <h5 className="font-medium text-white mb-2">Requirements</h5>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {selectedBrief.requirements || 'No requirements specified'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-white mb-2">Created</h5>
                    <p className="text-gray-300 text-sm">
                      {selectedBrief.createdAt ? new Date(selectedBrief.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium text-white mb-2">Last Updated</h5>
                    <p className="text-gray-300 text-sm">
                      {selectedBrief.updatedAt ? new Date(selectedBrief.updatedAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
              {selectedBrief.rewardType && (
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setEditingRewards({
                      brief: selectedBrief,
                      rewardData: null,
                      type: 'edit'
                    });
                    setEditAmountOfWinners(selectedBrief.amountOfWinners || 1);
                    const initialRewards = [];
                    for (let i = 1; i <= (selectedBrief.amountOfWinners || 1); i++) {
                      initialRewards.push({
                        position: i,
                        cashAmount: 0,
                        creditAmount: 0,
                        prizeDescription: ''
                      });
                    }
                    setEditWinnerRewards(initialRewards);
                    setShowEditRewardsModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit Rewards
                </button>
              )}
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditBrief(selectedBrief);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Edit Brief
              </button>

            </div>
          </div>
        </div>
      )}
      {renderReviewModal()}
      {renderRejectModal()}
      {renderApproveModal()}
      {renderEditRewardsModal()}
      {showEditModal && selectedBrief && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white">Edit Brief</h3>
              <p className="text-sm text-gray-300 dark:text-gray-400 mt-1">Update brief information and settings</p>
            </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-300 text-xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdateBrief(selectedBrief.id, {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                requirements: formData.get('requirements') as string,
                rewardType: formData.get('rewardType') as string,
                amountOfWinners: parseInt(formData.get('amountOfWinners') as string) || 1,
                deadline: formData.get('deadline') as string,
                status: formData.get('status') as 'draft' | 'active'
              });
            }}>
              
              {/* Basic Information */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Brief Title *</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={selectedBrief.title}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      name="status"
                      defaultValue={selectedBrief.status}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">📝 Draft</option>
                      <option value="active">🚀 Active</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-700 mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Brief Content</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                    <textarea
                      name="description"
                      defaultValue={selectedBrief.description || ''}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe what you're looking for from creators..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Requirements *</label>
                    <textarea
                      name="requirements"
                      defaultValue={selectedBrief.requirements || ''}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="List specific requirements, deliverables, and guidelines..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Reward Configuration */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200 mb-6">
                <h4 className="text-lg font-semibold text-green-900 mb-4">Reward Configuration</h4>
                  <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount of Rewards *</label>
                  <input
                    type="number"
                      name="amountOfWinners"
                    min="1"
                    max="50"
                      defaultValue={selectedBrief.amountOfWinners || 1}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter number of rewards (1-50)"
                      required
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter a number between 1 and 50</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 mb-6">
                <h4 className="text-lg font-semibold text-purple-900 mb-4">Timeline</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Deadline *</label>
                  <input
                    type="date"
                    name="deadline"
                    defaultValue={new Date(selectedBrief.deadline).toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${selectedBrief.title}"? This action cannot be undone.`)) {
                      handleDeleteBrief(selectedBrief.id);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  🗑️ Delete Brief
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Brief
                </button>
                {selectedBrief.status === 'draft' && (
                  <button
                    type="button"
                    onClick={() => handlePublishBrief(selectedBrief.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    🚀 Publish Brief
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Winner Selection Modal */}
      <WinnerSelectionModal
        brief={selectedBriefForWinners}
        submissions={briefSubmissions}
        isOpen={showWinnerSelectionModal}
        onClose={() => setShowWinnerSelectionModal(false)}
        onWinnersSelected={handleWinnersSelected}
      />



      {/* Animated Notifications */}
      {showSuccessNotification && (
        <AnimatedNotification
          message={successNotification.message}
          type="success"
          onClose={() => setShowSuccessNotification(false)}
        />
      )}
      </div>
    </div>
  );
};

export default BrandDashboard; 
