import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import DefaultAvatar from './DefaultAvatar';
import AnimatedNotification from './AnimatedNotification';
import NotificationBell from './NotificationBell';
import WinnerSelectionModal from './WinnerSelectionModal';
import BrandWallet from './BrandWallet';
import PaymentManagement from './PaymentManagement';
import { useToast } from '../contexts/ToastContext';

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
  const [editSelectedRewardType, setEditSelectedRewardType] = useState('');
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
      {/* Welcome Header */}
      <div className="flex justify-between items-center fade-in">
        <h1 className="text-3xl font-bold text-gray-900 slide-in-left">
          WELCOME, {user?.companyName?.toUpperCase() || 'BRAND'}
        </h1>
        <div className="flex items-center space-x-4">
          <NotificationBell />
          <DefaultAvatar name={user?.companyName || 'Brand'} size="md" />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 card-hover">
          <h3 className="text-lg font-semibold text-gray-900">Available Briefs</h3>
          <p className="text-3xl font-bold text-blue-600">{metrics.activeBriefs}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 card-hover">
          <h3 className="text-lg font-semibold text-gray-900">Submissions This Week</h3>
          <p className="text-3xl font-bold text-green-600">{metrics.submissionsThisWeek}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 card-hover">
          <h3 className="text-lg font-semibold text-gray-900">Winners Selected</h3>
          <p className="text-3xl font-bold text-purple-600">{metrics.winnersSelected}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {submissions.slice(0, 3).map((submission) => (
                <div key={submission.id} className="text-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <DefaultAvatar name={submission.creatorName} size="xl" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{submission.creatorName}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">📄➡️</span>
              <h4 className="font-semibold text-gray-900">Post a Brief</h4>
            </div>
            <p className="text-sm text-gray-600">
              Creates a campaign brief to invite creators to submit content.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">📋❗</span>
              <h4 className="font-semibold text-gray-900">View My Briefs</h4>
            </div>
            <p className="text-sm text-gray-600">
              See all active and past briefs in one place.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">🔍👤</span>
              <h4 className="font-semibold text-gray-900">Discover Creators</h4>
            </div>
            <p className="text-sm text-gray-600">
              Browse creator profiles and invite them to your briefs.
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
        <div className="space-y-3">
          {briefs.filter(b => b.status === 'active').slice(0, 2).map((brief) => (
            <div key={brief.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">{brief.title}</span>
              <span className="text-sm text-gray-600">
                {Math.ceil((new Date(brief.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Engagement Overview</h3>
          <p className="text-2xl font-bold text-blue-600">{metrics.avgSubmissions} Avg. Submissions This Month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Submissions</h3>
          <p className="text-2xl font-bold text-green-600">{metrics.totalSubmissions} Total Submissions This Month</p>
        </div>
      </div>
    </div>
  );

  const renderBriefs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Briefs</h2>
        <Link
          to="/brand/create-brief"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Brief
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {briefs.map((brief) => (
          <div key={brief.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-gray-900">{brief.title}</h3>
              <div className="flex space-x-2">
                {brief.rewardType && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {brief.rewardType === 'CASH' ? '💰 Cash' : 
                     brief.rewardType === 'CREDIT' ? '🎫 Credit' : 
                     brief.rewardType === 'PRIZES' ? '🎁 Rewards' : brief.rewardType}
                  </span>
                )}
                <span className={`px-2 py-1 text-xs rounded-full ${
                  brief.status === 'active' ? 'bg-green-100 text-green-800' :
                  brief.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Submissions: {(() => {
                try {
                  if (typeof brief.submissions === 'number') {
                    return brief.submissions;
                  } else if (Array.isArray(brief.submissions)) {
                    return (brief.submissions as unknown[]).length;
                  } else {
                    return 0;
                  }
                } catch (error) {
                  return 0;
                }
              })()}</p>
              <p>Winners: {brief.amountOfWinners || 1}</p>
              {(() => {
                const rewardInfo = getBriefRewardInfo(brief.id);
                if (brief.rewardType) {
                  const rewardTypeDisplay = brief.rewardType === 'CASH' ? '💰 Cash' : 
                                           brief.rewardType === 'CREDIT' ? '🎫 Credit' : 
                                           brief.rewardType === 'PRIZES' ? '🎁 Rewards' : brief.rewardType;
                  
                  if (rewardInfo.type === 'published') {
                    return (
                      <div>
                        <p className="text-green-600 font-medium">Primary: {rewardTypeDisplay}</p>
                        <p className="text-xs text-gray-500">{rewardInfo.tiers} tiers configured • Published</p>
                      </div>
                    );
                  } else if (rewardInfo.type === 'draft') {
                    return (
                      <div>
                        <p className="text-yellow-600 font-medium">Primary: {rewardTypeDisplay}</p>
                        <p className="text-xs text-gray-500">{rewardInfo.tiers} tiers configured • Draft</p>
                      </div>
                    );
                  } else {
                    return (
                      <div>
                        <p className="text-blue-600 font-medium">Primary: {rewardTypeDisplay}</p>
                        <p className="text-xs text-gray-500">Primary type set • Configure tiers</p>
                      </div>
                    );
                  }
                } else {
                  return (
                    <div>
                      <p className="text-gray-500">Primary Reward: Not set</p>
                      <p className="text-xs text-red-500">Select primary reward type to attract creators</p>
                    </div>
                  );
                }
              })()}
              <p>Deadline: {new Date(brief.deadline).toLocaleDateString()}</p>
            </div>
            <div className="mt-4 flex space-x-2">
              <button 
                onClick={() => handleViewBrief(brief)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View
              </button>
              <button 
                onClick={() => handleEditBrief(brief)}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Edit
              </button>
              <button 
                onClick={() => {
                  setEditingRewards({
                    brief,
                    rewardData: null,
                    type: 'edit'
                  });
                  setEditSelectedRewardType(brief.rewardType || '');
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
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit Rewards
              </button>
              {brief.status === 'active' && new Date(brief.deadline) <= new Date() && brief.submissions > 0 && !brief.winnersSelected && (
                <button 
                  onClick={() => handleSelectWinners(brief)}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Select Winners
                </button>
              )}

            </div>
          </div>
        ))}
      </div>

      {/* View Modal */}
      {showViewModal && selectedBrief && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedBrief.title}</h3>
                <p className="text-sm text-gray-600 mt-1">Brief Details</p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
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
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Reward Information</h4>
              
              {selectedBrief.rewardType ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <span className="font-medium text-green-900">Primary Reward Type:</span>
                      <div className="text-sm text-green-700 mt-1">
                        {selectedBrief.rewardType === 'CASH' ? '💰 Cash - Monetary rewards' : 
                         selectedBrief.rewardType === 'CREDIT' ? '🎫 Credit - Platform credits/points' : 
                         selectedBrief.rewardType === 'PRIZES' ? '🎁 Prizes - Physical items & experiences' : selectedBrief.rewardType}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl">
                        {selectedBrief.rewardType === 'CASH' ? '💰' : 
                         selectedBrief.rewardType === 'CREDIT' ? '🎫' : 
                         selectedBrief.rewardType === 'PRIZES' ? '🎁' : '🎯'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">Reward Status</h5>
                      <div className="text-sm text-gray-600">
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
                                <span className="text-blue-700">Primary type set</span>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">Winner Configuration</h5>
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Total Winners:</span>
                          <span className="font-medium">{selectedBrief.amountOfWinners || 1}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span>Reward Type:</span>
                          <span className="font-medium">
                            {selectedBrief.rewardType === 'CASH' ? 'Cash' : 
                             selectedBrief.rewardType === 'CREDIT' ? 'Credit' : 
                             selectedBrief.rewardType === 'PRIZES' ? 'Prizes' : 'Mixed'}
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
                  <p className="text-orange-700 mb-4">This brief doesn&apos;t have any reward type set up yet.</p>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setEditingRewards({
                        brief: selectedBrief,
                        rewardData: null,
                        type: 'edit'
                      });
                      setEditSelectedRewardType('');
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
                    Set Up Rewards
                  </button>
                </div>
              )}
            </div>

            {/* Brief Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Brief Details</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Description</h5>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedBrief.description || 'No description provided'}
                  </p>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Requirements</h5>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedBrief.requirements || 'No requirements specified'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Created</h5>
                    <p className="text-gray-600 text-sm">
                      {selectedBrief.createdAt ? new Date(selectedBrief.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Last Updated</h5>
                    <p className="text-gray-600 text-sm">
                      {selectedBrief.updatedAt ? new Date(selectedBrief.updatedAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
                    setEditSelectedRewardType(selectedBrief.rewardType || '');
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

      {/* Edit Modal */}
      {showEditModal && selectedBrief && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Edit Brief</h3>
                <p className="text-sm text-gray-600 mt-1">Update brief information and settings</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brief Title *</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={selectedBrief.title}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      name="status"
                      defaultValue={selectedBrief.status}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">📝 Draft</option>
                      <option value="active">🚀 Active</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Brief Content</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      name="description"
                      defaultValue={selectedBrief.description || ''}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe what you're looking for from creators..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Requirements *</label>
                    <textarea
                      name="requirements"
                      defaultValue={selectedBrief.requirements || ''}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="List specific requirements, deliverables, and guidelines..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Reward Configuration */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200 mb-6">
                <h4 className="text-lg font-semibold text-green-900 mb-4">Reward Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Reward Type *</label>
                    <select
                      name="rewardType"
                      defaultValue={selectedBrief.rewardType || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a reward type</option>
                      <option value="CASH">💰 CASH - Primary monetary rewards</option>
                      <option value="CREDIT">🎫 CREDIT - Primary platform credits/points</option>
                      <option value="PRIZES">🎁 PRIZES - Primary physical items & experiences</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount of Winners *</label>
                    <select
                      name="amountOfWinners"
                      defaultValue={selectedBrief.amountOfWinners || 1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Winner' : 'Winners'}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 mb-6">
                <h4 className="text-lg font-semibold text-purple-900 mb-4">Timeline</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deadline *</label>
                  <input
                    type="date"
                    name="deadline"
                    defaultValue={new Date(selectedBrief.deadline).toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
          <h2 className="text-2xl font-bold text-gray-900">Submissions</h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => setSubmissionFilter('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                submissionFilter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All ({submissions.length})
            </button>
            <button 
              onClick={() => setSubmissionFilter('pending')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                submissionFilter === 'pending' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pending ({submissions.filter(s => s.status === 'pending').length})
            </button>
            <button 
              onClick={() => setSubmissionFilter('approved')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                submissionFilter === 'approved' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Shortlist ({submissions.filter(s => s.status === 'approved').length})
            </button>
            <button 
              onClick={() => setSubmissionFilter('rejected')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                submissionFilter === 'rejected' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Rejected ({submissions.filter(s => s.status === 'rejected').length})
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brief</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brief Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DefaultAvatar name={submission.creatorName} size="sm" className="mr-3" />
                        <span className="text-sm font-medium text-gray-900">{submission.creatorName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
        <h2 className="text-2xl font-bold text-gray-900">Creators</h2>
        <button 
          onClick={handleInviteCreatorGeneral}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Invite Creator
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creators.map((creator) => (
          <div key={creator.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <DefaultAvatar name={creator.fullName} size="md" className="mr-3" />
              <div>
                <h3 className="font-semibold text-gray-900">{creator.fullName}</h3>
                <p className="text-sm text-gray-600">@{creator.userName}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Creator Profile</h3>
              <button
                onClick={() => setShowCreatorProfileModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <DefaultAvatar name={selectedCreator.fullName} size="xl" className="mr-4" />
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{selectedCreator.fullName}</h4>
                  <p className="text-gray-600">@{selectedCreator.userName}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Email:</span>
                  <p className="text-gray-600">{selectedCreator.email}</p>
                </div>
                <div>
                  
                </div>
                <div>
                  <span className="font-medium">Verified:</span>
                  <p className="text-gray-600">{selectedCreator.isVerified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="font-medium">Social Handles:</span>
                  <p className="text-gray-600">
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
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Invite {selectedCreator.fullName}</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Creator
                </label>
                <textarea
                  value={inviteFormData.message}
                  onChange={(e) => setInviteFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell the creator about your project and why you'd like to work with them..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Brief (Optional)
                </label>
                <select
                  value={inviteFormData.briefId}
                  onChange={(e) => setInviteFormData(prev => ({ ...prev, briefId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Invite Creator</h3>
              <button
                onClick={() => setShowInviteCreatorModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                To invite a creator, you can:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
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
          <h2 className="text-2xl font-bold text-gray-900">Rewards Management</h2>
          <button 
            onClick={() => setActiveTab('briefs')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manage Briefs
          </button>
        </div>

        {/* Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">📋</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Briefs</h3>
                <p className="text-3xl font-bold text-blue-600">{briefs.length}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Active and draft briefs</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">💰</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Rewards Configured</h3>
                <p className="text-3xl font-bold text-green-600">
                  {briefs.filter(brief => brief.rewardType).length}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Briefs with reward types set</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">🎯</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Winners</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {briefs.reduce((total, brief) => total + (brief.amountOfWinners || 0), 0)}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Across all briefs</p>
          </div>
        </div>

        {/* Briefs with Rewards Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Briefs with Rewards</h3>
          {briefs.filter(brief => brief.rewardType).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {briefs.filter(brief => brief.rewardType).map((brief) => {
                const rewardTypeDisplay = brief.rewardType === 'CASH' ? '💰 Cash' : 
                                         brief.rewardType === 'CREDIT' ? '🎫 Credit' : 
                                         brief.rewardType === 'PRIZES' ? '🎁 Prizes' : brief.rewardType;
                
                return (
                  <div key={brief.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold text-gray-900 line-clamp-2">{brief.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        brief.status === 'active' ? 'bg-green-100 text-green-800' :
                        brief.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Primary Reward:</span>
                        <span className="text-sm font-medium text-blue-600">{rewardTypeDisplay}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Winners:</span>
                        <span className="text-sm font-medium text-gray-900">{brief.amountOfWinners || 1}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Submissions:</span>
                        <span className="text-sm font-medium text-gray-900">{(() => {
                          try {
                            if (typeof brief.submissions === 'number') {
                              return brief.submissions;
                            } else if (Array.isArray(brief.submissions)) {
                              return (brief.submissions as unknown[]).length;
                            } else {
                              return 0;
                            }
                          } catch (error) {
                            return 0;
                          }
                        })()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Deadline:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(brief.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setEditingRewards({
                            brief,
                            rewardData: null,
                            type: 'edit'
                          });
                          setEditSelectedRewardType(brief.rewardType || '');
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
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 text-sm transition-colors"
                      >
                        Edit Rewards
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedBrief(brief);
                          setShowViewModal(true);
                        }}
                        className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-50 text-sm transition-colors"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => {
                          setActiveTab('submissions');
                          // Set filter to show submissions for this specific brief
                          setSubmissionFilter('all');
                        }}
                        className="flex-1 border border-green-300 text-green-700 py-2 px-3 rounded-md hover:bg-green-50 text-sm transition-colors"
                      >
                        View Submissions
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No rewards configured yet</h3>
              <p className="text-gray-600 mb-4">Start by creating a brief and setting up rewards for your campaigns</p>
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
            <h3 className="text-lg font-semibold text-gray-900">Briefs Needing Rewards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {briefs.filter(brief => !brief.rewardType).map((brief) => (
                <div key={brief.id} className="bg-orange-50 p-6 rounded-lg shadow-sm border border-orange-200">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-gray-900 line-clamp-2">{brief.title}</h4>
                    <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                      No Rewards
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        brief.status === 'active' ? 'bg-green-100 text-green-800' :
                        brief.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Submissions:</span>
                      <span className="text-sm font-medium text-gray-900">{(() => {
                        try {
                          if (typeof brief.submissions === 'number') {
                            return brief.submissions;
                          } else if (Array.isArray(brief.submissions)) {
                            return (brief.submissions as unknown[]).length;
                          } else {
                            return 0;
                          }
                        } catch (error) {
                          return 0;
                        }
                      })()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Deadline:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(brief.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        setEditingRewards({
                          brief,
                          rewardData: null,
                          type: 'edit'
                        });
                        setEditSelectedRewardType('');
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
                      className="flex-1 bg-orange-600 text-white py-2 px-3 rounded-md hover:bg-orange-700 text-sm transition-colors"
                    >
                      Set Rewards
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedBrief(brief);
                        setShowViewModal(true);
                      }}
                      className="flex-1 border border-orange-300 text-orange-700 py-2 px-3 rounded-md hover:bg-orange-50 text-sm transition-colors"
                    >
                      View
                    </button>

                  </div>
                </div>
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
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <DefaultAvatar name={user?.companyName || 'Brand'} size="xl" className="mr-4" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{user?.companyName || 'Brand Name'}</h3>
            <p className="text-gray-600">{user?.email || 'brand@example.com'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Company Information</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input type="text" defaultValue={user?.companyName || ''} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                <input type="text" placeholder="Contact person name" className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" defaultValue={user?.email || ''} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Preferences</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Notification Settings</label>
                <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                  <option>All notifications</option>
                  <option>Important only</option>
                  <option>None</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Privacy Level</label>
                <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                  <option>Public</option>
                  <option>Private</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Language</label>
                <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
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
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Review Submission</h3>
            <button
              onClick={() => {
                setShowReviewModal(false);
                setDetailedSubmission(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Creator Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Creator Information</h4>
              <div className="flex items-center mb-3">
                <DefaultAvatar name={detailedSubmission?.creator?.fullName || selectedSubmission.creatorName} size="md" className="mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{detailedSubmission?.creator?.fullName || selectedSubmission.creatorName}</p>
                  <p className="text-sm text-gray-600">@{detailedSubmission?.creator?.userName || 'creator'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Brief:</span>
                  <p className="text-gray-600">{detailedSubmission?.brief?.title || selectedSubmission.briefTitle}</p>
                </div>
                <div>
                  <span className="font-medium">Submitted:</span>
                  <p className="text-gray-600">{new Date(selectedSubmission.submittedAt).toLocaleDateString()}</p>
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
                    <p className="text-gray-600">{detailedSubmission.creator.email}</p>
                  </div>
                )}
                {(detailedSubmission?.creator?.socialInstagram || 
                  detailedSubmission?.creator?.socialTwitter || 
                  detailedSubmission?.creator?.socialLinkedIn || 
                  detailedSubmission?.creator?.socialTikTok || 
                  detailedSubmission?.creator?.socialYouTube) && (
                  <div>
                    <span className="font-medium">Social:</span>
                    <p className="text-gray-600">
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
              <h4 className="font-semibold text-gray-900 mb-3">Content Submission Link</h4>
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
                    <p className="text-gray-600">Loading submission content...</p>
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
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
            <h3 className="text-xl font-bold text-gray-900">Reject Submission</h3>
            <button
              onClick={() => setShowRejectModal(false)}
              className="text-gray-500 hover:text-gray-700"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Please provide a clear reason for rejecting this submission. This will be shared with the creator."
                  required
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <h4 className="font-semibold text-gray-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
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
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
            <h3 className="text-xl font-bold text-gray-900">Approve & Shortlist</h3>
            <button
              onClick={() => setShowApproveModal(false)}
              className="text-gray-500 hover:text-gray-700"
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
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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

        // Update the brief with new reward type and amount of winners
        const briefResponse = await fetch(`/api/briefs/${brief.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            rewardType: editSelectedRewardType,
            amountOfWinners: editAmountOfWinners
          })
        });

        if (briefResponse.ok) {
          setShowSuccessNotification(true);
          setSuccessNotification({
            title: 'Rewards Updated',
            message: 'Primary reward type and winner rewards have been updated successfully!',
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
              <h3 className="text-xl font-bold text-gray-900">Edit Rewards</h3>
              <p className="text-sm text-gray-600 mt-1">{brief.title}</p>
            </div>
            <button
              onClick={() => {
                setShowEditRewardsModal(false);
                setEditingRewards(null);
              }}
              className="text-gray-500 hover:text-gray-700"
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

          {/* Primary Reward Type Selection */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Reward Type</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reward Type *</label>
              <select
                value={editSelectedRewardType}
                onChange={(e) => setEditSelectedRewardType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a reward type</option>
                <option value="CASH">💰 CASH - Primary monetary rewards</option>
                <option value="CREDIT">🎫 CREDIT - Primary platform credits/points</option>
                <option value="PRIZES">🎁 PRIZES - Primary physical items & experiences</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount of Winners *</label>
              <select
                value={editAmountOfWinners}
                onChange={(e) => handleAmountOfWinnersChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? 'Winner' : 'Winners'}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Winner Rewards */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Winner Rewards</h3>
            <p className="text-sm text-gray-600 mb-6">
              Set rewards for each winning position. You can mix cash, credits, and prizes for each winner.
            </p>
            
            {editWinnerRewards.length > 0 && (
              <div className="space-y-4">
                {editWinnerRewards.map((reward) => (
                  <div key={reward.position} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        {reward.position === 1 ? '🥇 1st Place' : 
                         reward.position === 2 ? '🥈 2nd Place' : 
                         reward.position === 3 ? '🥉 3rd Place' : 
                         `${reward.position}th Place`}
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cash Amount ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={reward.cashAmount || ''}
                          onChange={(e) => handleWinnerRewardChange(reward.position, 'cashAmount', Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Credit Amount
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={reward.creditAmount || ''}
                          onChange={(e) => handleWinnerRewardChange(reward.position, 'creditAmount', Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prize Description
                        </label>
                        <input
                          type="text"
                          value={reward.prizeDescription || ''}
                          onChange={(e) => handleWinnerRewardChange(reward.position, 'prizeDescription', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                setShowEditRewardsModal(false);
                setEditingRewards(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={editIsLoading || !editSelectedRewardType}
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
        return <BrandWallet />;
      case 'payments':
        return <PaymentManagement />;
      case 'awards':
        return renderRewards();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex fade-in">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white slide-in-left">
        <div className="p-6">
          <div className="flex items-center mb-8">
            <div className="flex items-center">
              <DefaultAvatar name={user?.companyName || 'Brand'} size="md" className="mr-3" />
              <span className="font-bold text-lg">{user?.companyName || 'Brand'}</span>
            </div>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
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
      <div className="flex-1 slide-in-right">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>

      {/* Modals */}
      {showViewModal && selectedBrief && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedBrief.title}</h3>
                <p className="text-sm text-gray-600 mt-1">Brief Details</p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
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
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Reward Information</h4>
              
              {selectedBrief.rewardType ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <span className="font-medium text-green-900">Primary Reward Type:</span>
                      <div className="text-sm text-green-700 mt-1">
                        {selectedBrief.rewardType === 'CASH' ? '💰 Cash - Monetary rewards' : 
                         selectedBrief.rewardType === 'CREDIT' ? '🎫 Credit - Platform credits/points' : 
                         selectedBrief.rewardType === 'PRIZES' ? '🎁 Prizes - Physical items & experiences' : selectedBrief.rewardType}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl">
                        {selectedBrief.rewardType === 'CASH' ? '💰' : 
                         selectedBrief.rewardType === 'CREDIT' ? '🎫' : 
                         selectedBrief.rewardType === 'PRIZES' ? '🎁' : '🎯'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">Reward Status</h5>
                      <div className="text-sm text-gray-600">
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
                                <span className="text-blue-700">Primary type set</span>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">Winner Configuration</h5>
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Total Winners:</span>
                          <span className="font-medium">{selectedBrief.amountOfWinners || 1}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span>Reward Type:</span>
                          <span className="font-medium">
                            {selectedBrief.rewardType === 'CASH' ? 'Cash' : 
                             selectedBrief.rewardType === 'CREDIT' ? 'Credit' : 
                             selectedBrief.rewardType === 'PRIZES' ? 'Prizes' : 'Mixed'}
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
                  <p className="text-orange-700 mb-4">This brief doesn&apos;t have any reward type set up yet.</p>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setEditingRewards({
                        brief: selectedBrief,
                        rewardData: null,
                        type: 'edit'
                      });
                      setEditSelectedRewardType('');
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
                    Set Up Rewards
                  </button>
                </div>
              )}
            </div>

            {/* Brief Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Brief Details</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Description</h5>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedBrief.description || 'No description provided'}
                  </p>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Requirements</h5>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedBrief.requirements || 'No requirements specified'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Created</h5>
                    <p className="text-gray-600 text-sm">
                      {selectedBrief.createdAt ? new Date(selectedBrief.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Last Updated</h5>
                    <p className="text-gray-600 text-sm">
                      {selectedBrief.updatedAt ? new Date(selectedBrief.updatedAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
                    setEditSelectedRewardType(selectedBrief.rewardType || '');
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
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Edit Brief</h3>
                <p className="text-sm text-gray-600 mt-1">Update brief information and settings</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brief Title *</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={selectedBrief.title}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      name="status"
                      defaultValue={selectedBrief.status}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">📝 Draft</option>
                      <option value="active">🚀 Active</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Brief Content</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      name="description"
                      defaultValue={selectedBrief.description || ''}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe what you're looking for from creators..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Requirements *</label>
                    <textarea
                      name="requirements"
                      defaultValue={selectedBrief.requirements || ''}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="List specific requirements, deliverables, and guidelines..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Reward Configuration */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200 mb-6">
                <h4 className="text-lg font-semibold text-green-900 mb-4">Reward Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Reward Type *</label>
                    <select
                      name="rewardType"
                      defaultValue={selectedBrief.rewardType || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a reward type</option>
                      <option value="CASH">💰 CASH - Primary monetary rewards</option>
                      <option value="CREDIT">🎫 CREDIT - Primary platform credits/points</option>
                      <option value="PRIZES">🎁 PRIZES - Primary physical items & experiences</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount of Winners *</label>
                    <select
                      name="amountOfWinners"
                      defaultValue={selectedBrief.amountOfWinners || 1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Winner' : 'Winners'}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 mb-6">
                <h4 className="text-lg font-semibold text-purple-900 mb-4">Timeline</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deadline *</label>
                  <input
                    type="date"
                    name="deadline"
                    defaultValue={new Date(selectedBrief.deadline).toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
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
  );
};

export default BrandDashboard; 
