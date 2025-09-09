import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import DefaultAvatar from './DefaultAvatar';
import AnimatedNotification from './AnimatedNotification';
import WinnerSelectionModal from './WinnerSelectionModal';

import { useToast } from '../contexts/ToastContext';
import BrandBriefCard from './BrandBriefCard';

import NotificationBell from './NotificationBell';
import LoadingSpinner from './LoadingSpinner';
import SettingsModal from './SettingsModal';
import Logo from './Logo';



// Lazy load Stripe-dependent components to prevent loading during login
const PaymentManagement = lazy(() => import('./PaymentManagement'));
const RewardManagement = lazy(() => import('./RewardManagement'));

interface Brief {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  status: 'draft' | 'published' | 'archived';
  submissions: number;
  deadline: string;
  reward: number;
  rewardType?: string;
  amountOfWinners?: number;
  winnersSelected?: boolean;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
  winnerRewards?: Array<{
    position: number;
    cashAmount: number;
    creditAmount: number;
    prizeDescription: string;

  }>;
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

interface SearchResult {
  type: 'brief' | 'submission';
  id: string;
  title: string;
  description: string;
  brandName: string;
  brandContact?: string;
  category: string;
  reward: number;
  deadline: string;
  location?: string;
  submissionsCount?: number;
  status?: string;
  data: Brief | Submission;
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
  const [briefsFilter, setBriefsFilter] = useState<'published' | 'draft' | 'archived' | 'all'>('published');
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successNotification, setSuccessNotification] = useState({
    title: '',
    message: '',
    icon: ''
  });
  const [showEditRewardsModal, setShowEditRewardsModal] = useState(false);
  const [editingRewards, setEditingRewards] = useState<EditingRewards | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

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
    creatorId: string;
    creatorName: string;
    creatorEmail: string;
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

  // Statistics state
  const [statistics, setStatistics] = useState<{
    briefStats: Array<{
      briefId: string;
      briefTitle: string;
      totalSubmissions: number;
      pendingSubmissions: number;
      approvedSubmissions: number;
      rejectedSubmissions: number;
      submissionRate: number;
      avgSubmissionsPerDay: number;
      createdAt: string;
      status: string;
    }>;
    overallStats: {
      totalBriefs: number;
      activeBriefs: number;
      totalSubmissions: number;
      avgSubmissionsPerBrief: number;
      topPerformingBrief: string;
      recentActivity: Array<{
        date: string;
        submissions: number;
      }>;
    };
  }>({
    briefStats: [],
    overallStats: {
      totalBriefs: 0,
      activeBriefs: 0,
      totalSubmissions: 0,
      avgSubmissionsPerBrief: 0,
      topPerformingBrief: '',
      recentActivity: []
    }
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



  const handleWinnersSelected = async (results: { successful: number; failed: number; details: string[] }) => {
    try {
      // Refresh briefs data to show updated winner selection status
      await fetchDashboardData();
      showSuccessToast(`Winners selected successfully! ${results.successful} rewards distributed, ${results.failed} failed.`);
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

  const fetchDashboardData = useCallback(async () => {
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
      const activeBriefs = briefsData.filter((b: Brief) => b.status === 'published').length;
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

      // Calculate statistics
      calculateStatistics(briefsData, submissionsData);
    } catch (error) {
      // Error fetching dashboard data
    }
  }, []);

  useEffect(() => {
    // Fetch data from API
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Calculate detailed statistics for briefs and overall performance
  const calculateStatistics = (briefsData: Brief[], submissionsData: Submission[]) => {
    const briefStats = briefsData.map(brief => {
      const briefSubmissions = submissionsData.filter(sub => sub.briefTitle === brief.title);
      const totalSubmissions = briefSubmissions.length;
      const pendingSubmissions = briefSubmissions.filter(sub => sub.status === 'pending').length;
      const approvedSubmissions = briefSubmissions.filter(sub => sub.status === 'approved').length;
      const rejectedSubmissions = briefSubmissions.filter(sub => sub.status === 'rejected').length;
      
      // Calculate submission rate (submissions per day since creation)
      const createdAt = new Date(brief.createdAt || Date.now());
      const daysSinceCreation = Math.max(1, Math.ceil((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
      const submissionRate = totalSubmissions / daysSinceCreation;
      const avgSubmissionsPerDay = totalSubmissions / daysSinceCreation;

      return {
        briefId: brief.id,
        briefTitle: brief.title,
        totalSubmissions,
        pendingSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
        submissionRate,
        avgSubmissionsPerDay,
        createdAt: brief.createdAt || new Date().toISOString(),
        status: brief.status
      };
    });

    // Calculate overall statistics
    const totalBriefs = briefsData.length;
    const activeBriefs = briefsData.filter(brief => brief.status === 'published').length;
    const totalSubmissions = submissionsData.length;
    const avgSubmissionsPerBrief = totalBriefs > 0 ? totalSubmissions / totalBriefs : 0;
    
    // Find top performing brief
    const topPerformingBrief = briefStats.length > 0 
      ? briefStats.reduce((max, current) => 
          current.totalSubmissions > max.totalSubmissions ? current : max
        ).briefTitle
      : '';

    // Calculate recent activity (last 7 days)
    const recentActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const submissionsOnDate = submissionsData.filter(sub => 
        sub.submittedAt.startsWith(dateStr)
      ).length;
      recentActivity.push({
        date: dateStr,
        submissions: submissionsOnDate
      });
    }

    setStatistics({
      briefStats,
      overallStats: {
        totalBriefs,
        activeBriefs,
        totalSubmissions,
        avgSubmissionsPerBrief,
        topPerformingBrief,
        recentActivity
      }
    });
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
          title: 'Submission Shortlisted!',
          message: 'The creator has been notified and is excited to work with your brand!',
          icon: '/icons/Green_icons/Trophy1.png'
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

  // Search functionality
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowSearchResults(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please log in again.');
        return;
      }

      // Search across briefs, creators, and submissions using database
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        // eslint-disable-next-line no-console
        console.warn('API search failed, falling back to local search');
        // Fallback: search locally in available data
        const localResults = searchLocally(searchQuery);
        setSearchResults(localResults);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Search error:', error);
      // Fallback: search locally in available data
      const localResults = searchLocally(searchQuery);
      setSearchResults(localResults);
    } finally {
      setIsSearching(false);
    }
  };

  const searchLocally = (query: string): SearchResult[] => {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search in created briefs
    (briefs || []).forEach((brief: Brief) => {
      if (
        brief.title.toLowerCase().includes(lowerQuery) ||
        (brief.description && brief.description.toLowerCase().includes(lowerQuery)) ||
        (brief.requirements && brief.requirements.toLowerCase().includes(lowerQuery))
      ) {
        results.push({
          type: 'brief',
          id: brief.id,
          title: brief.title,
          description: brief.description || '',
          brandName: user?.companyName || 'Your Brand',
          category: 'Brief',
          reward: brief.reward,
          deadline: brief.deadline,
          data: brief
        });
      }
    });

    // Search in submissions
    submissions.forEach(submission => {
      if (
        submission.briefTitle.toLowerCase().includes(lowerQuery) ||
        submission.creatorName.toLowerCase().includes(lowerQuery) ||
        submission.status.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          type: 'submission',
          id: submission.id,
          title: submission.briefTitle,
          description: `Creator: ${submission.creatorName} - Status: ${submission.status}`,
          brandName: submission.creatorName,
          category: 'Submission',
          reward: (submission as Submission & { reward?: number }).reward || 0,
          deadline: submission.submittedAt,
          data: submission
        });
      }
    });

    return results;
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const navigation = [
    { id: 'overview', label: 'Overview', icon: 'overview' },
    { id: 'briefs', label: 'My Briefs', icon: 'briefs' },
    { id: 'submissions', label: 'Submissions', icon: 'submissions' },
    { id: 'create', label: 'Create a Brief', icon: 'create' },
    { id: 'creators', label: 'Creators', icon: 'creators' },
    { id: 'statistics', label: 'Statistics', icon: 'statistics' },
    { id: 'payments', label: 'Wallet & Payments', icon: 'payments' },
  ];

  const accountNav = [
    { id: 'rewards-payments', label: 'Rewards', icon: 'rewards-payments' },
    { id: 'settings', label: 'Settings', icon: 'settings', action: () => setShowSettingsModal(true) },
    { id: 'logout', label: 'Logout', icon: 'logout', action: logout },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
            Grow Your Brand with Amazing Creators
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
              <img src="/icons/Green_icons/LiveBrief.png" alt="Active Briefs" className="w-8 h-8" />
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
              <img src="/icons/Green_icons/Performance1.png" alt="Performance" className="w-8 h-8" />
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
              <img src="/icons/Green_icons/Trophy1.png" alt="Rewards" className="w-8 h-8" />
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
                      <img src="/icons/profile.png" alt="User" className="w-9 h-9" />
                </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{submission.creatorName}</p>
                      <p className="text-xs text-gray-400">Applied to {submission.briefTitle}</p>
            </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        submission.status === 'approved' ? 'bg-emerald-900/20 text-emerald-400' :
                        submission.status === 'rejected' ? 'bg-red-900/20 text-red-400' :
                        'bg-yellow-900/20 text-yellow-400'
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
                      className="text-white hover:text-white text-sm font-medium"
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
                  className="text-white hover:text-white text-sm font-medium"
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
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-emerald-500 font-semibold">LIVE</span>
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
                      <img src="/icons/profile.png" alt="User" className="w-8 h-8" />
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

  const renderBriefs = () => {
    // Filter briefs based on the selected filter
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
          <h2 className="text-2xl font-bold text-white">My Briefs</h2>
          <Link
            to="/brand/create-brief"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Brief
          </Link>
        </div>

        {/* Filter Options */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setBriefsFilter('published')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              briefsFilter === 'published'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
              Published Briefs
          </button>
          <button
            onClick={() => setBriefsFilter('draft')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              briefsFilter === 'draft'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            Draft Briefs
          </button>
          <button
            onClick={() => setBriefsFilter('archived')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              briefsFilter === 'archived'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            Archived Briefs
          </button>
          <button
            onClick={() => setBriefsFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              briefsFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            All Briefs
          </button>
        </div>

        {briefsFilter === 'archived' && filteredBriefs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">📁</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Archived Briefs</h3>
            <p className="text-gray-400">Briefs that exceed their deadline will be automatically archived here.</p>
          </div>
        ) : briefsFilter === 'draft' && filteredBriefs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">📝</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Draft Briefs</h3>
            <p className="text-gray-400">Create your first draft brief to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBriefs.map((brief) => (
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
                  const baseReward = brief.reward || 0;
                  
                  for (let i = 1; i <= (brief.amountOfWinners || 1); i++) {
                    // Calculate reward for each position
                    let percentage = 0;
                    if (i === 1) percentage = 0.4;
                    else if (i === 2) percentage = 0.3;
                    else if (i === 3) percentage = 0.2;
                    else percentage = 0.1;
                    
                    const calculatedAmount = baseReward * percentage;
                    
                    initialRewards.push({
                      position: i,
                      cashAmount: calculatedAmount,
                      creditAmount: 0,
                      prizeDescription: `Reward ${i} - ${(percentage * 100).toFixed(0)}% of total`
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
            onDeleteClick={(briefData) => handleDeleteBrief(briefData.id)}
          />
        ))}
          </div>
        )}

        {/* View Modal */}
      {showViewModal && selectedBrief && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/20 dark:border-gray-600/30">
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
            <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-4 rounded-lg border border-white/10 dark:border-gray-600/20 mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">Brief Overview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="font-medium text-white">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedBrief.status === 'published' ? 'bg-green-100/20 dark:bg-green-900/30 text-green-800 dark:text-green-300 backdrop-blur-sm border border-green-200/30 dark:border-green-600/30' :
                    selectedBrief.status === 'draft' ? 'bg-yellow-100/20 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 backdrop-blur-sm border border-yellow-200/30 dark:border-yellow-600/30' :
                    selectedBrief.status === 'archived' ? 'bg-gray-100/20 dark:bg-gray-800/30 text-gray-800 dark:text-gray-400 backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30' :
                    'bg-blue-100/20 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 backdrop-blur-sm border border-blue-200/30 dark:border-blue-600/30'
                  }`}>
                    {selectedBrief.status.charAt(0).toUpperCase() + selectedBrief.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-white">Deadline:</span>
                  <span className="text-white">{new Date(selectedBrief.deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-white">Submissions:</span>
                  <span className="text-white">{(() => {
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
                  <span className="font-medium text-white">Amount of Winners:</span>
                  <span className="text-white">{selectedBrief.amountOfWinners || 1}</span>
                </div>
              </div>
            </div>

            {/* Reward Information */}
            <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-white/10 dark:border-gray-600/20 mb-6">
              <h4 className="text-lg font-semibold text-white mb-4">Reward Information</h4>
              
              {selectedBrief.amountOfWinners ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm rounded-lg border border-white/10 dark:border-gray-600/20">
                    <div>
                      <span className="font-medium text-white">Amount of Rewards:</span>
                      <div className="text-sm text-white mt-1">
                        {selectedBrief.amountOfWinners || 1} rewards available
                      </div>
                    </div>
                    <div className="text-right">
                      <img src="/icons/Green_icons/Target1.png" alt="Target" className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm rounded-lg border border-white/10 dark:border-gray-600/20">
                      <h5 className="font-medium text-white mb-2">Reward Status</h5>
                      <div className="text-sm text-white">
                        {(() => {
                          const rewardInfo = getBriefRewardInfo(selectedBrief.id);
                          if (rewardInfo.type === 'published') {
                            return (
                              <div className="flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                <span className="text-green-300">Published</span>
                              </div>
                            );
                          } else if (rewardInfo.type === 'draft') {
                            return (
                              <div className="flex items-center">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                <span className="text-yellow-300">Draft</span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                <span className="text-white">Rewards configured</span>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm rounded-lg border border-white/10 dark:border-gray-600/20">
                      <h5 className="font-medium text-white mb-2">Reward Configuration</h5>
                      <div className="text-sm text-white">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Total Rewards:</span>
                          <span className="font-medium">{selectedBrief.amountOfWinners || 1}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-gray-300">Status:</span>
                          <span className="font-medium">
                            {selectedBrief.status === 'published' ? 'Active' : 
                             selectedBrief.status === 'draft' ? 'Draft' : 'Completed'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Calculated Reward Amounts */}
                  {selectedBrief.winnerRewards && selectedBrief.winnerRewards.length > 0 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/30">
                      <h5 className="font-medium text-white mb-3 flex items-center">
                        <img src="/icons/Green_icons/Trophy1.png" alt="Rewards" className="w-5 h-5 mr-2" />
                        Calculated Reward Amounts
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {selectedBrief.winnerRewards.map((reward) => (
                          <div key={reward.position} className="bg-white/10 rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-green-400 mb-1">
                              {reward.position === 1 ? '🥇 1st' : 
                               reward.position === 2 ? '🥈 2nd' : 
                               reward.position === 3 ? '🥉 3rd' : 
                               `${reward.position}th`}
                            </div>
                            <div className="text-sm text-white font-medium">
                              ${(reward.cashAmount + reward.creditAmount).toFixed(2)}
                            </div>
                            {reward.cashAmount > 0 && (
                              <div className="text-xs text-gray-300">
                                Cash: ${reward.cashAmount.toFixed(2)}
                              </div>
                            )}
                            {reward.creditAmount > 0 && (
                              <div className="text-xs text-gray-300">
                                Credits: ${reward.creditAmount.toFixed(2)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
            <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-white/10 dark:border-gray-600/20 mb-6">
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
          <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-2xl rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/10 dark:border-gray-600/20 shadow-2xl">
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
                status: formData.get('status') as 'draft' | 'published'
              });
            }}>
              
              {/* Basic Information */}
              <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-6 rounded-lg border border-white/10 dark:border-gray-600/20 mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Brief Title *</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={selectedBrief.title}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Status</label>
                    <select
                      name="status"
                      defaultValue={selectedBrief.status}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                    >
                      <option value="draft">📝 Draft</option>
                      <option value="published">📢 Published</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-white/10 dark:border-gray-600/20 mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Brief Content</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Description *</label>
                    <textarea
                      name="description"
                      defaultValue={selectedBrief.description || ''}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                      placeholder="Describe what you're looking for from creators..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Requirements *</label>
                    <textarea
                      name="requirements"
                      defaultValue={selectedBrief.requirements || ''}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                      placeholder="List specific requirements, deliverables, and guidelines..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Reward Configuration */}
              <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-6 rounded-lg border border-white/10 dark:border-gray-600/20 mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Reward Configuration</h4>
                  <div>
                  <label className="block text-sm font-medium text-white mb-2">Amount of Rewards *</label>
                  <input
                    type="number"
                      name="amountOfWinners"
                    min="1"
                    max="50"
                      defaultValue={selectedBrief.amountOfWinners || 1}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                    placeholder="Enter number of rewards (1-50)"
                      required
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-300 mt-1">Enter a number between 1 and 50</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-6 rounded-lg border border-white/10 dark:border-gray-600/20 mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Timeline</h4>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Deadline *</label>
                  <input
                    type="date"
                    name="deadline"
                    defaultValue={new Date(selectedBrief.deadline).toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
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
                    Publish Brief
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    );
  };


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
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              All ({submissions.length})
            </button>
            <button 
              onClick={() => setSubmissionFilter('pending')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                submissionFilter === 'pending' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Pending ({submissions.filter(s => s.status === 'pending').length})
            </button>
            <button 
              onClick={() => setSubmissionFilter('approved')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                submissionFilter === 'approved' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Shortlist ({submissions.filter(s => s.status === 'approved').length})
            </button>
            <button 
              onClick={() => setSubmissionFilter('rejected')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                submissionFilter === 'rejected' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Rejected ({submissions.filter(s => s.status === 'rejected').length})
            </button>
          </div>
        </div>

        <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl rounded-lg shadow-sm border border-white/20 dark:border-gray-600/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Creator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Brief</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Brief Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/5 dark:bg-gray-800/10 divide-y divide-white/10 dark:divide-gray-700/30">
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
                        className="text-white hover:text-blue-300 font-medium"
                      >
                        {submission.briefTitle}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {(() => {
                        const brief = briefs.find(b => b.title === submission.briefTitle);
                        if (brief?.rewardType) {
                          const rewardTypeDisplay = brief.rewardType === 'CASH' ? 'Cash' : 
                                                   brief.rewardType === 'CREDIT' ? 'Credit' : 
                                                   brief.rewardType === 'PRIZES' ? 'Prizes' : brief.rewardType;
                          return rewardTypeDisplay;
                        } else {
                          return 'Not set';
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        submission.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                        submission.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
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
                        className="text-white hover:text-blue-300 mr-3 font-medium"
                      >
                        Review
                      </button>
                      {submission.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApproveSubmission(submission)}
                            className="text-green-400 hover:text-green-300 mr-3 font-medium"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectSubmission(submission)}
                            className="text-red-400 hover:text-red-300 font-medium"
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
          <div key={creator.id} className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-white/10 dark:border-gray-600/20">
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
          <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl rounded-lg p-6 max-w-2xl w-full mx-4 border border-white/20 dark:border-gray-600/30">
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
          <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl rounded-lg p-6 max-w-2xl w-full mx-4 border border-white/20 dark:border-gray-600/30">
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
                <label className="block text-sm font-medium text-white mb-2">
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
                <label className="block text-sm font-medium text-white mb-2">
                  Select Brief (Optional)
                </label>
                <select
                  value={inviteFormData.briefId}
                  onChange={(e) => setInviteFormData(prev => ({ ...prev, briefId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No specific brief</option>
                  {briefs.filter(b => b.status === 'published').map(brief => (
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
          <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl rounded-lg p-6 max-w-2xl w-full mx-4 border border-white/20 dark:border-gray-600/30">
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
              <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-4 rounded-lg border border-white/10 dark:border-gray-600/20">
                <p className="text-sm text-white">
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


  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Settings</h2>
      
      <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl rounded-lg shadow-sm border border-white/20 dark:border-gray-600/30 p-6">
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
                <label className="block text-sm font-medium text-white">Company Name</label>
                <input type="text" defaultValue={user?.companyName || ''} className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-700 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white">Contact Name</label>
                <input type="text" placeholder="Contact person name" className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-700 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white">Email</label>
                <input type="email" defaultValue={user?.email || ''} className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-700 text-white" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Preferences</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-white">Notification Settings</label>
                <select className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-700 text-white">
                  <option>All notifications</option>
                  <option>Important only</option>
                  <option>None</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white">Privacy Level</label>
                <select className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-700 text-white">
                  <option>Public</option>
                  <option>Private</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white">Language</label>
                <select className="mt-1 block w-full border border-gray-600 rounded-md px-3 py-2 bg-gray-700 text-white">
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

  // Statistics Page
  const renderStatistics = () => (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Statistics & Analytics
        </h1>
        <p className="text-lg text-gray-300">
          Track your brief performance and submission analytics to optimize your creator campaigns.
        </p>
      </div>

      {/* Overall Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl flex items-center justify-center">
              <img 
                src="/icons/briefs.png" 
                alt="Briefs"
                className="w-6 h-6"
              />
            </div>
          </div>
          <div className="text-white">
            <p className="text-3xl font-bold mb-2">{statistics.overallStats.totalBriefs}</p>
            <p className="text-sm opacity-90">Total Briefs</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-xl flex items-center justify-center">
              <img 
                src="/icons/submissions.png" 
                alt="Submissions"
                className="w-6 h-6"
              />
            </div>
          </div>
          <div className="text-white">
            <p className="text-3xl font-bold mb-2">{statistics.overallStats.totalSubmissions}</p>
            <p className="text-sm opacity-90">Total Submissions</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
              <img 
                src="/icons/overview.png" 
                alt="Overview"
                className="w-6 h-6"
              />
            </div>
          </div>
          <div className="text-white">
            <p className="text-3xl font-bold mb-2">{statistics.overallStats.avgSubmissionsPerBrief.toFixed(1)}</p>
            <p className="text-sm opacity-90">Avg per Brief</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center">
              <img 
                src="/icons/rewards-payments.png" 
                alt="Rewards"
                className="w-6 h-6"
              />
            </div>
          </div>
          <div className="text-white">
            <p className="text-3xl font-bold mb-2">{statistics.overallStats.activeBriefs}</p>
            <p className="text-sm opacity-90">Active Briefs</p>
          </div>
        </div>
      </div>

      {/* Brief Statistics Table */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">Brief Performance Statistics</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Brief Title</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Total Submissions</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Pending</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Approved</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Rejected</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Avg/Day</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {statistics.briefStats.map((brief) => (
                <tr key={brief.briefId} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white font-medium">{brief.briefTitle}</td>
                  <td className="py-3 px-4 text-white">{brief.totalSubmissions}</td>
                  <td className="py-3 px-4 text-yellow-400">{brief.pendingSubmissions}</td>
                  <td className="py-3 px-4 text-emerald-500">{brief.approvedSubmissions}</td>
                  <td className="py-3 px-4 text-red-400">{brief.rejectedSubmissions}</td>
                  <td className="py-3 px-4 text-white">{brief.avgSubmissionsPerDay.toFixed(1)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      brief.status === 'published' ? 'bg-emerald-900/30 text-emerald-300 backdrop-blur-sm border border-emerald-600/30' :
                      brief.status === 'completed' ? 'bg-blue-100/20 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 backdrop-blur-sm border border-blue-200/30 dark:border-blue-600/30' :
                      brief.status === 'archived' ? 'bg-gray-100/20 dark:bg-gray-800/30 text-gray-800 dark:text-gray-400 backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30' :
                      'bg-gray-100/20 dark:bg-gray-700/30 text-gray-800 dark:text-gray-300 backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30'
                    }`}>
                      {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Chart */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">Recent Activity (Last 7 Days)</h2>
        <div className="grid grid-cols-7 gap-2">
          {statistics.overallStats.recentActivity.map((day, index) => (
            <div key={index} className="text-center">
              <div className="bg-gray-800 rounded-lg p-3 mb-2">
                <div className="text-2xl font-bold text-white mb-1">{day.submissions}</div>
                <div className="text-xs text-gray-400">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performing Brief */}
      {statistics.overallStats.topPerformingBrief && (
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Top Performing Brief</h2>
          <p className="text-lg text-white opacity-90">{statistics.overallStats.topPerformingBrief}</p>
          <p className="text-sm text-white opacity-75 mt-2">
            This brief has received the most submissions among all your active briefs.
          </p>
        </div>
      )}
    </div>
  );

  // Review Submission Modal
  const renderReviewModal = () => (
    showReviewModal && selectedSubmission && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/20 dark:border-gray-600/30">
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
            <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-4 rounded-lg border border-white/10 dark:border-gray-600/20">
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
                  <span className="font-medium text-white">Brief:</span>
                  <p className="text-white">{detailedSubmission?.brief?.title || selectedSubmission.briefTitle}</p>
                </div>
                <div>
                  <span className="font-medium text-white">Submitted:</span>
                  <p className="text-white">{new Date(selectedSubmission.submittedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium text-white">Status:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                    selectedSubmission.status === 'approved' ? 'bg-emerald-900/30 text-emerald-300' :
                    selectedSubmission.status === 'rejected' ? 'bg-red-900/30 text-red-300' :
                    'bg-yellow-900/30 text-yellow-300'
                  }`}>
                    {selectedSubmission.status === 'approved' ? 'Shortlisted' :
                     selectedSubmission.status === 'rejected' ? 'Rejected' :
                     'Pending Review'}
                  </span>
                </div>
                {detailedSubmission?.creator?.email && (
                  <div>
                    <span className="font-medium text-white">Email:</span>
                    <p className="text-white">{detailedSubmission.creator.email}</p>
                  </div>
                )}
                {(detailedSubmission?.creator?.socialInstagram || 
                  detailedSubmission?.creator?.socialTwitter || 
                  detailedSubmission?.creator?.socialLinkedIn || 
                  detailedSubmission?.creator?.socialTikTok || 
                  detailedSubmission?.creator?.socialYouTube) && (
                  <div>
                    <span className="font-medium text-white">Social:</span>
                    <p className="text-white">
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
              <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-4 rounded-lg border border-white/10 dark:border-gray-600/20">
                {detailedSubmission ? (
                  <>
                    {detailedSubmission.files ? (
                      <div className="mb-4">
                        <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm p-3 rounded border border-white/20 dark:border-gray-600/30">
                          <a 
                            href={detailedSubmission.files} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-white hover:text-white text-sm break-all"
                          >
                            {detailedSubmission.files}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm p-3 rounded border border-white/20 dark:border-gray-600/30 text-sm text-gray-400 dark:text-gray-300">
                          No content submission link provided
                        </div>
                      </div>
                    )}

                    {/* Submission Details */}
                    <div className="text-sm text-gray-300 dark:text-white border-t border-white/10 dark:border-gray-600/20 pt-3">
                      <p><strong className="text-white">Amount:</strong> ${detailedSubmission.amount}</p>
                      <p><strong className="text-white">Submitted:</strong> {new Date(detailedSubmission.submittedAt).toLocaleString()}</p>
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
              className="px-4 py-2 border border-gray-600/50 rounded-md text-gray-300 dark:text-white hover:bg-gray-50/10 dark:hover:bg-gray-700/30"
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
        <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl w-full mx-4 border border-white/10 dark:border-gray-600/20">
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
            <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm border border-white/10 dark:border-gray-600/20 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">About this submission</h4>
              <p className="text-sm text-white">
                <strong>Creator:</strong> {selectedSubmission.creatorName}<br />
                <strong>Brief:</strong> {selectedSubmission.briefTitle}<br />
                <strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
              </p>
            </div>

            <form onSubmit={handleSubmitRejection}>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
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
        <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl w-full mx-4 border border-white/10 dark:border-gray-600/20">
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
            <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm border border-white/10 dark:border-gray-600/20 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">About this submission</h4>
              <p className="text-sm text-white">
                <strong>Creator:</strong> {selectedSubmission.creatorName}<br />
                <strong>Brief:</strong> {selectedSubmission.briefTitle}<br />
                <strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
              </p>
            </div>

            <form onSubmit={handleSubmitApproval}>
              <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-4 rounded-lg border border-white/10 dark:border-gray-600/20">
                <h4 className="font-semibold text-white mb-2">What happens next?</h4>
                <ul className="text-sm text-white space-y-1">
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
          <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-4 rounded-lg border border-white/10 dark:border-gray-600/20 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-white">Status:</span>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  brief.status === 'published' ? 'bg-green-100/20 dark:bg-green-900/30 text-green-800 dark:text-green-300 backdrop-blur-sm border border-green-200/30 dark:border-green-600/30' :
                  brief.status === 'draft' ? 'bg-yellow-100/20 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 backdrop-blur-sm border border-yellow-200/30 dark:border-yellow-600/30' :
                  brief.status === 'archived' ? 'bg-gray-100/20 dark:bg-gray-800/30 text-gray-800 dark:text-gray-400 backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30' :
                  'bg-gray-100/20 dark:bg-gray-700/30 text-gray-800 dark:text-gray-300 backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30'
                }`}>
                  {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-900">Current Reward Type:</span>
                <span className="ml-2">
                  {brief.rewardType ? (
                    brief.rewardType === 'CASH' ? 'Cash' : 
                    brief.rewardType === 'CREDIT' ? 'Credit' : 
                    brief.rewardType === 'PRIZES' ? 'Prizes' : brief.rewardType
                  ) : 'Not set'}
                </span>
              </div>
            </div>
          </div>

          {/* Amount of Rewards Selection */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Amount of Rewards</h3>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Amount of Rewards *</label>
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
                        <label className="block text-sm font-medium text-white mb-2">
                          Cash Amount ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={reward.cashAmount || ''}
                          onChange={(e) => handleWinnerRewardChange(reward.position, 'cashAmount', Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Credit Amount
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={reward.creditAmount || ''}
                          onChange={(e) => handleWinnerRewardChange(reward.position, 'creditAmount', Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Prize Description
                        </label>
                        <input
                          type="text"
                          value={reward.prizeDescription || ''}
                          onChange={(e) => handleWinnerRewardChange(reward.position, 'prizeDescription', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                          placeholder="e.g., Product bundle, Gift card, Experience"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Total Calculator */}
                <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-4 rounded-lg border border-white/10 dark:border-gray-600/20">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-white">Campaign Total:</span>
                    <span className="text-2xl font-bold text-white">
                      ${calculateTotalReward().toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-white mt-2">
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

  const renderSearchResults = () => (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Search Results</h1>
          <p className="text-gray-400">
            {isSearching ? 'Searching...' : `Found ${searchResults.length} results for "${searchQuery}"`}
          </p>
        </div>
        <button
          onClick={clearSearch}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Clear Search
        </button>
      </div>

      {/* Loading State */}
      {isSearching && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span className="ml-3 text-gray-400">Searching...</span>
        </div>
      )}

      {/* No Results */}
      {!isSearching && searchResults.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No results found</h3>
          <p className="text-gray-400">Try searching with different keywords</p>
        </div>
      )}

      {/* Search Results Grid */}
      {!isSearching && searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((result, index) => (
            <div key={`${result.type}-${result.id}-${index}`} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                    result.type === 'brief' ? 'bg-blue-600' : 'bg-green-600'
                  }`}>
                    {result.type === 'brief' ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      result.type === 'brief' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {result.type === 'brief' ? 'Brief' : 'Submission'}
                    </span>
                  </div>
                </div>
                {result.reward && (
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">${result.reward}</p>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{result.title}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-3">{result.description}</p>
              
              {/* Additional info for briefs */}
              {result.type === 'brief' && (
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  {result.location && (
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {result.location}
                    </span>
                  )}
                  {result.submissionsCount !== undefined && (
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {result.submissionsCount} submissions
                    </span>
                  )}
                  {result.status && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      result.status === 'published' ? 'bg-green-100 text-green-800' :
                      result.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      result.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {result.status}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-400">
                  <span className="mr-2">{result.type === 'brief' ? 'by' : 'from'}</span>
                  <span className="font-medium text-white">{result.brandName}</span>
                  {result.brandContact && (
                    <span className="ml-1 text-gray-500">({result.brandContact})</span>
                  )}
                </div>
                {result.deadline && (
                  <span className="text-gray-400">
                    {new Date(result.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    if (result.type === 'brief') {
                      setSelectedBrief(result.data as Brief);
                      setShowViewModal(true);
                    } else {
                      setSelectedSubmission(result.data as Submission);
                      setShowReviewModal(true);
                    }
                  }}
                  className="w-full py-2 px-4 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium"
                >
                  {result.type === 'brief' ? 'View Brief' : 'View Submission'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
      case 'creators':
        return renderCreators();
      case 'statistics':
        return renderStatistics();
      case 'rewards-payments':
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" color="blue" text="Loading rewards system..." /></div>}>
            <RewardManagement 
              userType="brand" 
              userId={user?.id || ''} 
              token={localStorage.getItem('token') || ''} 
            />
          </Suspense>
        );
      case 'payments':
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" color="blue" text="Loading payments..." /></div>}>
            <PaymentManagement 
              userType="brand" 
              userId={user?.id || ''} 
              token={localStorage.getItem('token') || ''} 
            />
          </Suspense>
        );
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
            {/* Logo */}
            <img 
              src="/logo-light2.svg" 
              alt="DraftBoard" 
              className="w-22 h-7 mr-3 drop-shadow-[0_0_4px_rgba(34,197,94,0.3)]"
            />
          </div>
          <div className="flex items-center">
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
              onKeyPress={handleSearchKeyPress}
              placeholder="Search creators, briefs, or submissions..."
              className="w-full pl-4 pr-10 py-2 text-sm border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-8 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-300"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
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

      {/* Enhanced Sidebar - Fixed Position */}
      <div className={`${activeTab === 'mobile-menu' ? 'block' : 'hidden'} lg:block w-full lg:w-72 bg-black backdrop-blur-xl border-r border-gray-800 text-white lg:min-h-screen shadow-2xl lg:fixed lg:left-0 lg:top-0 lg:z-40`}>
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
                  onClick={() => handleTabClick(item.id)}
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
                    {item.id === 'settings' ? (
                      // Settings gear icon
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : item.id === 'logout' ? (
                      // Logout icon
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    ) : (
                      <img 
                        src={`/icons/${item.icon}.png`} 
                        alt={item.label}
                        className="w-5 h-5"
                      />
                    )}
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
                    {item.id === 'settings' ? (
                      // Settings gear icon
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : item.id === 'logout' ? (
                      // Logout icon
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    ) : (
                      <img 
                        src={`/icons/${item.icon}.png`} 
                        alt={item.label}
                        className="w-5 h-5"
                      />
                    )}
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
      <div className="flex-1 overflow-auto bg-gray-900/30 backdrop-blur-sm lg:ml-72">
        {/* Desktop Header */}
        <div className="hidden lg:block bg-black border-b border-gray-800 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-bold text-white">
                {activeTab === 'overview' ? 'Dashboard' : 
                 activeTab === 'briefs' ? 'My Briefs' :
                 activeTab === 'submissions' ? 'Submissions' :
                 activeTab === 'creators' ? 'Creators' :
                 activeTab === 'statistics' ? 'Statistics' :
                 activeTab === 'rewards-payments' ? 'Rewards & Payments' :
                 activeTab === 'wallet' ? 'Wallet' :
                 activeTab === 'payments' ? 'Payments' :
                 activeTab === 'settings' ? 'Settings' : 'Dashboard'}
              </h1>
              
              {/* Search Bar */}
              {activeTab === 'overview' && (
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    placeholder="Search creators, briefs, or submissions..."
                    className="w-80 pl-4 pr-10 py-2 text-sm border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-300"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
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
              <DefaultAvatar name={user?.companyName || 'Brand'} size="md" />
            </div>
          </div>
        </div>
        
        <div className="p-4 lg:p-8">
          {showSearchResults ? renderSearchResults() : renderContent()}
        </div>
      </div>

      {/* Modals */}
      {showViewModal && selectedBrief && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/20 dark:border-gray-600/30">
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
            <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-4 rounded-lg border border-white/10 dark:border-gray-600/20 mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">Brief Overview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="font-medium text-white">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedBrief.status === 'published' ? 'bg-green-100/20 dark:bg-green-900/30 text-green-800 dark:text-green-300 backdrop-blur-sm border border-green-200/30 dark:border-green-600/30' :
                    selectedBrief.status === 'draft' ? 'bg-yellow-100/20 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 backdrop-blur-sm border border-yellow-200/30 dark:border-yellow-600/30' :
                    selectedBrief.status === 'archived' ? 'bg-gray-100/20 dark:bg-gray-800/30 text-gray-800 dark:text-gray-400 backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30' :
                    'bg-blue-100/20 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 backdrop-blur-sm border border-blue-200/30 dark:border-blue-600/30'
                  }`}>
                    {selectedBrief.status.charAt(0).toUpperCase() + selectedBrief.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-white">Deadline:</span>
                  <span className="text-white">{new Date(selectedBrief.deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-white">Submissions:</span>
                  <span className="text-white">{(() => {
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
                  <span className="font-medium text-white">Amount of Winners:</span>
                  <span className="text-white">{selectedBrief.amountOfWinners || 1}</span>
                </div>
              </div>
            </div>

            {/* Reward Information */}
            <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-white/10 dark:border-gray-600/20 mb-6">
              <h4 className="text-lg font-semibold text-white mb-4">Reward Information</h4>
              
              {selectedBrief.amountOfWinners ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm rounded-lg border border-white/10 dark:border-gray-600/20">
                    <div>
                      <span className="font-medium text-white">Amount of Rewards:</span>
                      <div className="text-sm text-white mt-1">
                        {selectedBrief.amountOfWinners || 1} rewards available
                      </div>
                    </div>
                    <div className="text-right">
                      <img src="/icons/Green_icons/Target1.png" alt="Target" className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm rounded-lg border border-white/10 dark:border-gray-600/20">
                      <h5 className="font-medium text-white mb-2">Reward Status</h5>
                      <div className="text-sm text-white">
                        {(() => {
                          const rewardInfo = getBriefRewardInfo(selectedBrief.id);
                          if (rewardInfo.type === 'published') {
                            return (
                              <div className="flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                <span className="text-green-300">Published</span>
                              </div>
                            );
                          } else if (rewardInfo.type === 'draft') {
                            return (
                              <div className="flex items-center">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                                <span className="text-yellow-300">Draft</span>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                <span className="text-white">Rewards configured</span>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm rounded-lg border border-white/10 dark:border-gray-600/20">
                      <h5 className="font-medium text-white mb-2">Reward Configuration</h5>
                      <div className="text-sm text-white">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Total Rewards:</span>
                          <span className="font-medium">{selectedBrief.amountOfWinners || 1}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-gray-300">Status:</span>
                          <span className="font-medium">
                            {selectedBrief.status === 'published' ? 'Active' : 
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
            <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-white/10 dark:border-gray-600/20 mb-6">
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
                  <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-2xl rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/10 dark:border-gray-600/20 shadow-2xl">
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
                status: formData.get('status') as 'draft' | 'published'
              });
            }}>
              
              {/* Basic Information */}
              <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-6 rounded-lg border border-white/10 dark:border-gray-600/20 mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Brief Title *</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={selectedBrief.title}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Status</label>
                    <select
                      name="status"
                      defaultValue={selectedBrief.status}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                    >
                      <option value="draft">📝 Draft</option>
                      <option value="published">📢 Published</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="bg-white/5 dark:bg-gray-800/10 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-white/10 dark:border-gray-600/20 mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Brief Content</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Description *</label>
                    <textarea
                      name="description"
                      defaultValue={selectedBrief.description || ''}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                      placeholder="Describe what you're looking for from creators..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Requirements *</label>
                    <textarea
                      name="requirements"
                      defaultValue={selectedBrief.requirements || ''}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                      placeholder="List specific requirements, deliverables, and guidelines..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Reward Configuration */}
              <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-6 rounded-lg border border-white/10 dark:border-gray-600/20 mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Reward Configuration</h4>
                  <div>
                  <label className="block text-sm font-medium text-white mb-2">Amount of Rewards *</label>
                  <input
                    type="number"
                      name="amountOfWinners"
                    min="1"
                    max="50"
                      defaultValue={selectedBrief.amountOfWinners || 1}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                    placeholder="Enter number of rewards (1-50)"
                      required
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-300 mt-1">Enter a number between 1 and 50</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white/5 dark:bg-gray-700/30 backdrop-blur-sm p-6 rounded-lg border border-white/10 dark:border-gray-600/20 mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Timeline</h4>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Deadline *</label>
                  <input
                    type="date"
                    name="deadline"
                    defaultValue={new Date(selectedBrief.deadline).toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
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
                  className="px-4 py-2 border border-gray-600 rounded-md text-white hover:bg-gray-700"
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
                    Publish Brief
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Winner Selection Modal */}
      <WinnerSelectionModal
        briefId={selectedBriefForWinners?.id || ''}
        submissions={briefSubmissions}
        isOpen={showWinnerSelectionModal}
        onClose={() => setShowWinnerSelectionModal(false)}
        onSuccess={handleWinnersSelected}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
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
