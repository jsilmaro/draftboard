import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import DefaultAvatar from './DefaultAvatar';
import AnimatedNotification from './AnimatedNotification';
import CreatorWallet from './CreatorWallet';
import CreatorBriefCard from './CreatorBriefCard';
import BriefDetailsModal from './BriefDetailsModal';
import BrandPageView from './BrandPageView';
import CreatorApplicationForm from './CreatorApplicationForm';
// StripeConnectButton and PaymentStatusCard now handled by CreatorWallet component

import NotificationBell from './NotificationBell';
import SettingsModal from './SettingsModal';
import MessagingSystem from './MessagingSystem';
import ThemeToggle from './ThemeToggle';




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
  status: 'published' | 'draft' | 'archived';
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
  briefId: string;
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
  briefId?: string;
  brandName?: string;
  rewardType?: 'CASH' | 'CREDIT' | 'PRIZES';
  position?: number;
  submittedAt?: string;
  approvedAt?: string;
  transactionId?: string;
}

interface SubmissionData {
  id: string;
  briefTitle?: string;
  briefId: string;
  brandName?: string;
  amount: number;
  status: string;
  submittedAt: string;
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

const CreatorDashboard: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  // Handle query parameter for tab activation (e.g., ?tab=invites)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);
  const [availableBriefs, setAvailableBriefs] = useState<Brief[]>([]);
  const [marketplaceBriefs, setMarketplaceBriefs] = useState<Brief[]>([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [earningsFilter, setEarningsFilter] = useState<'all' | 'paid' | 'pending' | 'processing'>('all');
  const [earningsSortBy, setEarningsSortBy] = useState<'date' | 'amount' | 'brief'>('date');
  const [earningsSortOrder, setEarningsSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedEarning, setSelectedEarning] = useState<Earning | null>(null);
  const [showEarningDetails, setShowEarningDetails] = useState(false);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [earningsError, setEarningsError] = useState<string | null>(null);
  interface Invite {
    id: string;
    creatorId: string;
    brandId: string;
    briefId?: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    message?: string;
    createdAt: string;
    updatedAt: string;
    respondedAt?: string;
    brand?: {
      id: string;
      companyName: string;
      logo?: string;
      socialWebsite?: string;
    };
    brief?: {
      id: string;
      title: string;
      description: string;
      reward: number;
      deadline: string;
    };
  }

  const [invites, setInvites] = useState<Invite[]>([]);
  const [acceptedInvites, setAcceptedInvites] = useState<Invite[]>([]);
  const [rejectedInvites, setRejectedInvites] = useState<Invite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSubmissionViewModal, setShowSubmissionViewModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showBriefDetailsModal, setShowBriefDetailsModal] = useState(false);
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Recent activity carousel
  // const [currentActivityIndex, setCurrentActivityIndex] = useState(0);

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
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedBriefForApplication, setSelectedBriefForApplication] = useState<Brief | null>(null);
  const [isEditingApplication, setIsEditingApplication] = useState(false);
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
    paidEarnings: 0,
    pendingEarnings: 0,
    thisMonthEarnings: 0,
    avgSubmissions: 0
  });

  const fetchDashboardData = useCallback(async () => {
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



      // Fetch earnings using the dedicated function
      await fetchEarningsData(); // Fetch real earnings data

      // Calculate metrics with the fetched data
      const approvedSubmissions = submissionsData.filter((s: Submission) => s.status === 'approved').length;
      const submissionsThisWeek = submissionsData.filter((s: Submission) => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(s.submittedAt) > weekAgo;
      }).length;
      
      setMetrics({
        activeBriefs: briefsData.length,
        submissionsThisWeek,
        approvedSubmissions,
        totalEarnings: earnings.reduce((sum, e) => sum + e.amount, 0),
        paidEarnings: 0, // Will be updated when earnings are fetched
        pendingEarnings: 0, // Will be updated when earnings are fetched
        thisMonthEarnings: 0, // Will be updated when earnings are fetched
        avgSubmissions: submissionsData.length
      });
    } catch (error) {
      // Error fetching dashboard data
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Fetch data from API
    fetchDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMarketplaceBriefs = useCallback(async () => {
    try {
      setMarketplaceLoading(true);
      const response = await fetch('/api/briefs/public');
      if (response.ok) {
        const data = await response.json();
        setMarketplaceBriefs(data);
      }
    } catch (error) {
      // console.error('Error fetching marketplace briefs:', error);
    } finally {
      setMarketplaceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'marketplace') {
      fetchMarketplaceBriefs();
    }
  }, [activeTab, fetchMarketplaceBriefs]);

  // Fetch earnings data when earnings tab is active
  useEffect(() => {
    if (activeTab === 'earnings') {
      fetchEarningsData(); // Fetch real earnings data from database
    }
  }, [activeTab]);

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

      // Search across briefs, brands, and topics using database
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        // eslint-disable-next-line no-console
        // console.warn('API search failed, falling back to local search');
        // Fallback: search locally in available data
        const localResults = searchLocally(searchQuery);
        setSearchResults(localResults);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      // console.error('Search error:', error);
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

    // Search in available briefs
    availableBriefs.forEach(brief => {
      if (
        brief.title.toLowerCase().includes(lowerQuery) ||
        brief.description.toLowerCase().includes(lowerQuery) ||
        brief.brandName.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          type: 'brief',
          id: brief.id,
          title: brief.title,
          description: brief.description,
          brandName: brief.brandName,
          category: 'Brief',
          reward: brief.reward,
          deadline: brief.deadline,
          data: brief
        });
      }
    });

    // Search in submissions
    mySubmissions.forEach(submission => {
      if (
        submission.briefTitle.toLowerCase().includes(lowerQuery) ||
        submission.status.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          type: 'submission',
          id: submission.id,
          title: submission.briefTitle,
          description: `Status: ${submission.status}`,
          brandName: (submission as Submission & { brandName?: string }).brandName || 'Unknown Brand',
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

  // Helper functions for earnings
  const generateEarningsCSV = (earningsData: Earning[]) => {
    const headers = ['Brief Title', 'Brand Name', 'Amount', 'Reward Type', 'Status', 'Submitted Date', 'Paid Date', 'Position'];
    const rows = earningsData.map(earning => [
      earning.briefTitle,
      earning.brandName || 'Unknown Brand',
      Number(earning.amount || 0).toFixed(2),
      earning.rewardType || 'Cash',
      earning.status,
      earning.submittedAt ? new Date(earning.submittedAt).toLocaleDateString() : '',
      earning.paidAt ? new Date(earning.paidAt).toLocaleDateString() : '',
      earning.position || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // Dedicated function to fetch earnings data from database (updated for Stripe Connect)
  const fetchEarningsData = async () => {
    try {
      setEarningsLoading(true);
      setEarningsError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Updated to use new Stripe Connect payout endpoint
      const response = await fetch('/api/creators/payouts', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch payouts: ${response.status}`);
      }

      const payoutsData = await response.json();
      // Transform payouts data to match earnings format
      const earningsData = payoutsData.data?.map((payout: { id: string; brief: { title: string; brand: { companyName: string } }; netAmount: number; status: string; createdAt: string }) => ({
        id: payout.id,
        briefTitle: payout.brief.title,
        brandName: payout.brief.brand.companyName,
        amount: payout.netAmount,
        rewardType: 'CASH', // Stripe Connect always pays cash
        status: payout.status === 'paid' ? 'paid' : 'pending',
        submittedAt: payout.createdAt,
        paidAt: payout.paidAt
      })) || [];
      setEarnings(earningsData);

      // Calculate detailed metrics from wallet transactions
      const totalEarnings = (earningsData || []).reduce((sum: number, earning: Earning) => sum + earning.amount, 0);
      const paidEarnings = (earningsData || []).filter((e: Earning) => e.status === 'paid').reduce((sum: number, earning: Earning) => sum + earning.amount, 0);
      const pendingEarnings = (earningsData || []).filter((e: Earning) => e.status === 'pending').reduce((sum: number, earning: Earning) => sum + earning.amount, 0);
      
      // Calculate this month's earnings
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthEarnings = (earningsData || []).filter((e: Earning) => {
        const earningDate = new Date(e.paidAt || e.submittedAt || new Date());
        return earningDate.getMonth() === currentMonth && earningDate.getFullYear() === currentYear;
      }).reduce((sum: number, earning: Earning) => sum + earning.amount, 0);

      // Metrics calculated successfully

      setMetrics(prev => ({
        ...prev,
        totalEarnings,
        paidEarnings,
        pendingEarnings,
        thisMonthEarnings
      }));

    } catch (error) {
      // eslint-disable-next-line no-console
      // console.error('Error fetching earnings:', error);
      setEarningsError(error instanceof Error ? error.message : 'Failed to fetch earnings');
      setEarnings([]); // Clear earnings on error
    } finally {
      setEarningsLoading(false);
    }
  };

  // Function to fetch all submissions (including pending ones) for demonstration
  const fetchAllSubmissions = async () => {
    try {
      setEarningsLoading(true);
      setEarningsError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch all submissions to show potential earnings
      const response = await fetch('/api/creators/submissions', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch submissions: ${response.status}`);
      }

      const submissionsData = await response.json();
      // Submissions data received successfully
      
      // Transform submissions to earnings format
      const potentialEarnings: Earning[] = submissionsData.map((submission: SubmissionData) => ({
        id: submission.id,
        briefTitle: submission.briefTitle || 'Unknown Brief',
        briefId: submission.briefId,
        brandName: submission.brandName || 'Unknown Brand',
        amount: submission.amount || 0, // Use the actual amount from database
        rewardType: 'CASH' as const,
        status: submission.status === 'approved' ? 'paid' as const : 
                submission.status === 'pending' ? 'pending' as const : 'processing' as const,
        submittedAt: submission.submittedAt,
        approvedAt: submission.status === 'approved' ? submission.submittedAt : undefined,
        paidAt: submission.status === 'approved' ? submission.submittedAt : undefined,
        position: 1
      }));

      setEarnings(potentialEarnings);

      // Calculate detailed metrics from submissions
      const totalEarnings = potentialEarnings.reduce((sum: number, earning: Earning) => sum + earning.amount, 0);
      const paidEarnings = potentialEarnings.filter((e: Earning) => e.status === 'paid').reduce((sum: number, earning: Earning) => sum + earning.amount, 0);
      const pendingEarnings = potentialEarnings.filter((e: Earning) => e.status === 'pending').reduce((sum: number, earning: Earning) => sum + earning.amount, 0);
      
      // Calculate this month's earnings
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthEarnings = potentialEarnings.filter((e: Earning) => {
        const earningDate = new Date(e.paidAt || e.submittedAt || new Date());
        return earningDate.getMonth() === currentMonth && earningDate.getFullYear() === currentYear;
      }).reduce((sum: number, earning: Earning) => sum + earning.amount, 0);

      setMetrics(prev => ({
        ...prev,
        totalEarnings,
        paidEarnings,
        pendingEarnings,
        thisMonthEarnings
      }));

    } catch (error) {
      // eslint-disable-next-line no-console
      // console.error('Error fetching submissions:', error);
      setEarningsError(error instanceof Error ? error.message : 'Failed to fetch submissions');
      setEarnings([]);
    } finally {
      setEarningsLoading(false);
    }
  };

  // Recent activity carousel
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCurrentActivityIndex(prev => 
  //       prev >= availableBriefs.length - 1 ? 0 : prev + 1
  //     );
  //   }, 3000); // Change every 3 seconds

  //   return () => clearInterval(interval);
  // }, [availableBriefs.length]);

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

  const handleSubmitApplication = async (data: { contentUrl: string; additionalInfo?: string }) => {
    if (!selectedBriefForApplication) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please log in again.');
        return;
      }

      // Check if this is an edit or new application
      const existingSubmission = getExistingSubmission(selectedBriefForApplication.id);
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
            contentUrl: data.contentUrl,
            additionalInfo: data.additionalInfo
          })
        });
      } else {
        // Create new submission
        response = await fetch(`/api/briefs/${selectedBriefForApplication.id}/apply`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contentUrl: data.contentUrl,
            additionalInfo: data.additionalInfo,
            amount: selectedBriefForApplication.reward.toString()
          })
        });
      }

      if (response.ok) {
        // Refresh data
        fetchDashboardData();
        setShowApplicationForm(false);
        setSelectedBriefForApplication(null);
        setIsEditingApplication(false);
        
        // Show animated success notification
        setSuccessNotification({
          title: isEdit ? 'Application Updated!' : 'Application Submitted!',
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

  // Enhanced sidebar functions
  const handleSidebarSearch = (query: string) => {
    setSidebarSearchQuery(query);
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
    // Find submission by briefId, not by title (titles can be duplicated)
    return mySubmissions.find(s => s.briefId === briefId);
  };

  // const navigation = [
  //   { id: 'overview', label: 'Overview', icon: 'overview' },
  //   { id: 'marketplace', label: 'Marketplace', icon: 'marketplace' },
  //   { id: 'briefs', label: 'Available Briefs', icon: 'briefs' },
  //   { id: 'submissions', label: 'My Submissions', icon: 'submissions' },
  //   { id: 'messaging', label: 'Messages', icon: 'messaging' },
  //   { id: 'earnings', label: 'Earnings', icon: 'payments' },
  //   { id: 'wallet', label: 'Wallet', icon: 'wallet' },
  //   { id: 'profile', label: 'Profile', icon: 'profile' },
  // ];

  // Navigation items (flattened without grouping) - matching BrandDashboard structure
  const navigationItems = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: 'overview' },
    { id: 'wallet', label: 'Wallet', icon: 'wallet' },
    { id: 'invites', label: 'Invitations', icon: 'invites' },
    { id: 'messaging', label: 'Messages', icon: 'messaging' },
    { id: 'marketplace', label: 'Marketplace', icon: 'marketplace' },
    { id: 'briefs', label: 'Available Briefs', icon: 'briefs' },
    { id: 'submissions', label: 'My Submissions', icon: 'submissions' },
    { id: 'earnings', label: 'Earnings', icon: 'payments' },
    { id: 'analytics', label: 'Analytics', icon: 'statistics' },
    { id: 'portfolio', label: 'Portfolio', icon: 'awards' },
    { id: 'profile', label: 'Profile', icon: 'profile' },
  ], []);

  // Filter navigation items based on search query
  const filteredNavigationItems = useMemo(() => {
    return navigationItems.filter(item =>
      item.label.toLowerCase().includes(sidebarSearchQuery.toLowerCase())
    );
  }, [navigationItems, sidebarSearchQuery]);

  const accountNav = [
    { id: 'earnings', label: 'Earnings', icon: 'payments' },
    { id: 'settings', label: 'Settings', icon: 'settings', action: () => setShowSettingsModal(true) },
    { id: 'logout', label: 'Logout', icon: 'logout', action: logout },
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className={`text-4xl font-bold mb-4 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Connect with Amazing Brands
        </h1>
        <p className={`text-lg ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Showcase your creativity and discover exciting opportunities with top brands worldwide.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Earnings Card */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div>
            <p className="metric-value">${Number(metrics.totalEarnings || 0).toFixed(2)}</p>
            <p className="metric-label">Total Earnings</p>
          </div>
        </div>

        {/* Submissions This Week Card */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div>
            <p className="metric-value">{mySubmissions.filter(s => new Date(s.submittedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</p>
            <p className="metric-label">Submissions This Week</p>
          </div>
        </div>

        {/* Active Briefs Card */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="metric-value">{availableBriefs.length}</p>
            <p className="metric-label">Active Briefs</p>
          </div>
        </div>
      </div>

      {/* Marketplace Section */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="card-title">Discover Opportunities</h2>
            <button
              onClick={() => setActiveTab('marketplace')}
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
            Find briefs that match your skills and start earning
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableBriefs.slice(0, 2).map((brief) => (
              <div key={brief.id} className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4 hover:shadow-md transition-all duration-200`}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 ${isDark ? 'bg-gray-800' : 'bg-white'} border rounded-lg flex items-center justify-center`}>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                      {brief.brandName?.charAt(0) || 'B'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{brief.brandName || 'Brand'}</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{brief.title}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>${brief.reward}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Reward</p>
                  </div>
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>
                  {brief.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Briefs */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="card-title">Available Briefs</h2>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{availableBriefs.length} available</span>
              </div>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableBriefs.slice(0, 4).map((brief) => {
                  return (
                    <div key={brief.id} className="relative">
                      <div className={`${isDark ? 'bg-gray-950 border-gray-900' : 'bg-white border-gray-200'} border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200`}>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-12 h-12 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} border rounded-xl flex items-center justify-center`}>
                            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-700'}`}>
                              {brief.brandName?.charAt(0) || 'B'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{brief.brandName || 'Brand'}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{brief.title}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              brief.status === 'published' 
                                ? isDark 
                                  ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-700' 
                                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : brief.status === 'draft' 
                                ? isDark 
                                  ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' 
                                  : 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                                : isDark 
                                  ? 'bg-gray-900 text-gray-400 border border-gray-800' 
                                  : 'bg-gray-50 text-gray-600 border border-gray-200'
                            }`}>
                              {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Reward: ${brief.reward}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedBriefId(brief.id);
                              setShowBriefDetailsModal(true);
                            }}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            View Details →
                          </button>
                        </div>
                      </div>
                      {hasSubmittedToBrief(brief.id) && (
                        <div className="absolute top-4 right-4 z-10">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            getSubmissionStatus(brief.id) === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                            getSubmissionStatus(brief.id) === 'rejected' ? 'bg-red-50 text-red-600 border border-red-200' :
                            'bg-yellow-50 text-yellow-600 border border-yellow-200'
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
                    className="btn btn-outline"
                  >
                    View All Briefs
                  </button>
                </div>
            )}
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
                onClick={() => setActiveTab('marketplace')}
                className="btn btn-primary w-full"
              >
                Browse Marketplace
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className="btn btn-secondary w-full"
              >
                View My Submissions
              </button>
              <button
                onClick={() => setActiveTab('earnings')}
                className="btn btn-outline w-full"
              >
                Check Earnings
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Activity</h3>
            </div>
            <div className="card-content">
                {getRecentActivities().slice(0, 3).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {activity.title}
                    </span>
                  </div>
                ))}
                {getRecentActivities().length === 0 && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      No recent activity
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBriefs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>Available Briefs</h2>
        <div className="flex space-x-2">
          <button 
            onClick={fetchDashboardData}
            className="btn btn-outline"
          >
            Refresh
          </button>
          <button className="btn btn-secondary">
            Sort by Reward
          </button>
        </div>
      </div>

      {availableBriefs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No available briefs</h3>
          <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            There are currently no active briefs available. Check back later for new opportunities!
          </p>
          <button 
            onClick={fetchDashboardData}
            className="btn btn-primary"
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
              <CreatorBriefCard 
                key={brief.id}
                brief={briefForCard} 
                onApplyClick={(brief) => {
                  setSelectedBriefForApplication(brief);
                  setIsEditingApplication(hasSubmittedToBrief(brief.id));
                  setShowApplicationForm(true);
                }}
                hasApplied={hasSubmittedToBrief(brief.id)}
                applicationStatus={getSubmissionStatus(brief.id)}
              />
            );
          })}
        </div>
      )}

      {/* View Brief Modal */}
      {showViewModal && selectedBrief && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-950 rounded-lg p-6 max-w-2xl w-full mx-4">
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
                  selectedBrief.status === 'published' ? 'bg-emerald-900/20 text-emerald-400' :
                                      selectedBrief.status === 'draft' ? 'bg-yellow-900/20 text-yellow-400' :
                    'bg-gray-900 text-gray-300'
                }`}>
                  {selectedBrief.status.charAt(0).toUpperCase() + selectedBrief.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Detailed Reward Information */}
            {selectedBrief.winnerRewards && selectedBrief.winnerRewards.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-[#00FF85] to-[#00C853] rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <img src="/icons/Green_icons/Trophy1.png" alt="Rewards" className="w-5 h-5 mr-2" />
                  Reward Breakdown
                </h4>
                <div className="space-y-3">
                  {selectedBrief.winnerRewards.map((reward, index) => (
                    <div key={index} className="bg-gray-950/20 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-white">
                          Reward {reward.position}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-white">
                        {reward.cashAmount > 0 && (
                          <p>Cash: ${(reward.cashAmount || 0).toLocaleString()}</p>
                        )}
                        {reward.creditAmount > 0 && (
                          <p>🎫 Credits: {(reward.creditAmount || 0).toLocaleString()}</p>
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
                className="px-4 py-2 border border-gray-800 rounded-md text-gray-300 hover:bg-gray-900"
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
          <div className="bg-gray-950 rounded-lg p-6 max-w-2xl w-full mx-4">
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
                  className="w-full px-3 py-2 border border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-900 text-white placeholder-gray-400"
                  placeholder="https://drive.google.com/file/d/... or https://www.youtube.com/watch?v=..."
                  required
                />
                <p className={`text-xs mt-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Paste a link to your content (Google Drive, YouTube, Instagram, etc.)
                </p>
              </div>

              <div className="bg-gray-900 p-4 rounded-lg">
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
                  className="px-4 py-2 border border-gray-800 rounded-md text-gray-300 hover:bg-gray-900"
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
      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>My Submissions</h2>
      
      {/* Submissions List */}
      <div className="space-y-4">
        {mySubmissions.map((submission) => (
          <div key={submission.id} className={`card ${
            isDark ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' : 'bg-white border-gray-200 hover:bg-gray-50'
          } transition-colors`}>
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${
                    isDark 
                      ? 'bg-gray-900 border-gray-800' 
                      : 'bg-gray-100 border-gray-200'
                  }`}>
                    <DefaultAvatar name={user?.fullName || 'Creator'} size="sm" />
                  </div>
                  <div>
                    <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{submission.briefTitle}</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Submitted by you</p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>${submission.amount}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Reward</p>
                  </div>
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
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleViewSubmission(submission)}
                      className="btn btn-outline"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleDeleteSubmission(submission)}
                      disabled={submission.status === 'approved' || submission.status === 'rejected'}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        submission.status === 'approved' || submission.status === 'rejected'
                          ? isDark 
                            ? 'text-gray-500 cursor-not-allowed bg-gray-800'
                            : 'text-gray-400 cursor-not-allowed bg-gray-100'
                          : isDark 
                            ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                            : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                      }`}
                      title={
                        submission.status === 'approved' || submission.status === 'rejected'
                          ? 'Cannot delete approved or rejected submissions'
                          : 'Delete submission'
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mySubmissions.length === 0 && (
        <div className="text-center py-12">
          <p className={`text-lg ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            No submissions found.
          </p>
        </div>
      )}
    </div>
  );

  const renderMessaging = () => (
    <div className="h-full">
      <MessagingSystem />
    </div>
  );

  const renderEarnings = () => {
    // Filter and sort earnings
    const filteredEarnings = earnings.filter(earning => 
      earningsFilter === 'all' || earning.status === earningsFilter
    );

    const sortedEarnings = [...filteredEarnings].sort((a, b) => {
      let comparison = 0;
      
      switch (earningsSortBy) {
        case 'amount': {
          comparison = a.amount - b.amount;
          break;
        }
        case 'brief': {
          comparison = a.briefTitle.localeCompare(b.briefTitle);
          break;
        }
        case 'date':
        default: {
          const dateA = new Date(a.paidAt || a.submittedAt || 0);
          const dateB = new Date(b.paidAt || b.submittedAt || 0);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        }
      }
      
      return earningsSortOrder === 'asc' ? comparison : -comparison;
    });

    // Statistics are calculated in metrics state and used in summary cards

    return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Earnings</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => fetchEarningsData()}
              disabled={earningsLoading}
              className="btn btn-outline flex items-center space-x-2"
            >
              <svg className={`w-4 h-4 ${earningsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{earningsLoading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => {
                const csvContent = generateEarningsCSV(earnings);
                downloadCSV(csvContent, 'earnings.csv');
              }}
              disabled={earnings.length === 0}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => fetchAllSubmissions()}
              className="btn btn-primary flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>View All Submissions</span>
            </button>
          </div>
        </div>
        
        {/* Enhanced Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div>
              <p className="metric-value">${Number(metrics.totalEarnings || 0).toFixed(2)}</p>
              <p className="metric-label">Total Earnings</p>
            </div>
      </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <p className="metric-value">${Number(metrics.paidEarnings || 0).toFixed(2)}</p>
              <p className="metric-label">Paid</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <p className="metric-value">${Number(metrics.pendingEarnings || 0).toFixed(2)}</p>
              <p className="metric-label">Pending</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div>
              <p className="metric-value">${Number(metrics.thisMonthEarnings || 0).toFixed(2)}</p>
              <p className="metric-label">This Month</p>
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Filter:</label>
                <select
                  value={earningsFilter}
                  onChange={(e) => setEarningsFilter(e.target.value as 'all' | 'paid' | 'pending' | 'processing')}
                  className="input text-sm"
                >
                  <option value="all">All</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-300">Sort by:</label>
                <select
                  value={earningsSortBy}
                  onChange={(e) => setEarningsSortBy(e.target.value as 'date' | 'amount' | 'brief')}
                  className="px-3 py-1 bg-gray-900 border border-gray-800 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="brief">Brief</option>
                </select>
              </div>
              
              <button
                onClick={() => setEarningsSortOrder(earningsSortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-1 bg-gray-900 hover:bg-gray-600 border border-gray-800 rounded-md text-white text-sm transition-colors duration-200 flex items-center space-x-1"
              >
                <span>{earningsSortOrder === 'asc' ? '↑' : '↓'}</span>
                <span>{earningsSortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
              </button>
            </div>
            
            <div className="text-sm text-gray-400">
              Showing {sortedEarnings.length} of {earnings.length} earnings
            </div>
          </div>
        </div>

        {/* Error Message */}
        {earningsError && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <span className="text-red-400 font-medium">Error loading earnings:</span>
              <span className="text-red-300">{earningsError}</span>
            </div>
            <p className="text-red-300 text-sm mt-2">
              Click &quot;Refresh&quot; to try again or &quot;View All Submissions&quot; to see your submission history. Earnings are based on wallet transactions.
            </p>
          </div>
        )}

        {/* Enhanced Earnings Table */}
      <div className="bg-gray-950/20 backdrop-blur-xl rounded-lg shadow-sm border border-gray-800/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-900/30 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Brief</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-950/10 divide-y divide-gray-700/30">
                {earningsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center space-y-2">
                        <svg className="w-8 h-8 animate-spin text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <p>Loading earnings...</p>
                      </div>
                  </td>
                  </tr>
                ) : sortedEarnings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-4xl">💰</span>
                        <p>No earnings found</p>
                        <p className="text-sm">Earnings are based on wallet transactions. Start submitting to briefs to earn rewards!</p>
                        <button
                          onClick={() => fetchAllSubmissions()}
                          className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                        >
                          View All Submissions
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedEarnings.map((earning) => (
                    <tr key={earning.id} className="hover:bg-gray-900/20 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{earning.briefTitle}</div>
                        {earning.position && (
                          <div className="text-xs text-gray-400">Position #{earning.position}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {earning.brandName || 'Unknown Brand'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                        ${Number(earning.amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          earning.status === 'paid' ? 'bg-green-900/20 text-green-400' :
                          earning.status === 'pending' ? 'bg-yellow-900/20 text-yellow-400' :
                          'bg-gray-900/20 text-gray-400'
                        }`}>
                          {earning.status === 'paid' ? 'Paid' : 
                           earning.status === 'pending' ? 'Pending' : 'Processing'}
                        </span>
                      </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      earning.status === 'paid' ? 'bg-emerald-900/20 text-emerald-400' :
                      earning.status === 'pending' ? 'bg-yellow-900/20 text-yellow-400' :
                      'bg-blue-900/20 text-blue-400'
                    }`}>
                      {earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                    </span>
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div>
                          {earning.paidAt ? (
                            <div>
                              <div>Paid: {new Date(earning.paidAt).toLocaleDateString()}</div>
                              {earning.submittedAt && (
                                <div className="text-xs text-gray-500">
                                  Submitted: {new Date(earning.submittedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ) : earning.submittedAt ? (
                            <div>Submitted: {new Date(earning.submittedAt).toLocaleDateString()}</div>
                          ) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedEarning(earning);
                            setShowEarningDetails(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                        >
                          View Details
                        </button>
                  </td>
                </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  };

  const renderProfile = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Profile</h2>
      
      <div className="bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl border-2 border-gray-500/80 p-6">
        <div className="flex items-center mb-6">
          <DefaultAvatar name={user?.fullName || user?.userName || 'Creator'} size="lg" className="mr-4" />
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
                <input type="text" defaultValue={user?.fullName || ''} className="mt-1 block w-full border border-gray-800 rounded-md px-3 py-2 bg-gray-900 text-white placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Username</label>
                <input type="text" defaultValue={user?.userName || ''} className="mt-1 block w-full border border-gray-800 rounded-md px-3 py-2 bg-gray-900 text-white placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <input type="email" defaultValue={user?.email || ''} className="mt-1 block w-full border border-gray-800 rounded-md px-3 py-2 bg-gray-900 text-white placeholder-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Social Media</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300">Instagram</label>
                <input type="text" placeholder="@username" className="mt-1 block w-full border border-gray-800 rounded-md px-3 py-2 bg-gray-900 text-white placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">TikTok</label>
                <input type="text" placeholder="@username" className="mt-1 block w-full border border-gray-800 rounded-md px-3 py-2 bg-gray-900 text-white placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">YouTube</label>
                <input type="text" placeholder="Channel URL" className="mt-1 block w-full border border-gray-800 rounded-md px-3 py-2 bg-gray-900 text-white placeholder-gray-400" />
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
          className="px-4 py-2 bg-gray-900 hover:bg-gray-600 text-white rounded-lg transition-colors"
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
          <div className="w-16 h-16 bg-gray-950 rounded-full flex items-center justify-center mx-auto mb-4">
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
            <div key={`${result.type}-${result.id}-${index}`} className="bg-gray-900/95 backdrop-blur-md rounded-xl p-6 border-2 border-gray-500/80 hover:border-gray-400/90 transition-all duration-300 shadow-2xl hover:shadow-2xl hover:shadow-green-500/20">
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
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-400">
                  <span className="mr-2">by</span>
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

              <div className="mt-4 pt-4 border-t border-gray-900">
                <button
                  onClick={() => {
                    if (result.type === 'brief') {
                      setSelectedBriefId(result.id);
                      setShowBriefDetailsModal(true);
                    } else {
                      setSelectedSubmission(result.data as Submission);
                      setShowSubmissionViewModal(true);
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

  const renderMarketplace = () => (
    <div className="space-y-6">
      {/* Marketplace Header */}
      <div className="mb-8">
        <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
          Discover Opportunities
        </h1>
        <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-lg`}>
          Find briefs that match your skills and start earning
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className={`${isDark ? 'bg-gray-900/90 border-gray-800/50' : 'bg-white border-gray-200'} backdrop-blur-sm rounded-xl border p-6 mb-8 shadow-sm`}>
        <div className="flex flex-wrap gap-4">
          <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
            Marketplace
          </button>
          <Link 
            to="/community" 
            className={`px-6 py-3 ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'} rounded-lg font-medium transition-colors`}
          >
            Community
          </Link>
          <Link 
            to="/events" 
            className={`px-6 py-3 ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'} rounded-lg font-medium transition-colors`}
          >
            Events
          </Link>
          <Link 
            to="/success-stories" 
            className={`px-6 py-3 ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'} rounded-lg font-medium transition-colors`}
          >
            Success Stories
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={`${isDark ? 'bg-gray-950 border-gray-900' : 'bg-white border-gray-200'} border rounded-xl p-6 mb-8 shadow-sm`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search briefs, brands, or keywords..."
              className={`w-full ${isDark ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'} border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500`}
            />
          </div>
          <div>
            <select className={`w-full ${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500`}>
              <option value="all">All Templates</option>
              <option value="creative">Social Media Campaign</option>
              <option value="technical">Product Review</option>
              <option value="business">Brand Partnership</option>
              <option value="content">Content Creation</option>
              <option value="influencer">Influencer Marketing</option>
              <option value="video">Video Production</option>
              <option value="photography">Photography</option>
              <option value="writing">Copywriting</option>
              <option value="design">Graphic Design</option>
            </select>
          </div>
        </div>
      </div>

      {/* Marketplace Briefs Grid */}
      {marketplaceLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketplaceBriefs.map((brief) => {
            const hasApplied = mySubmissions.some(sub => sub.briefTitle === brief.title);
            const daysRemaining = Math.ceil((new Date(brief.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <div key={brief.id} className={`${isDark ? 'bg-gray-950 border-gray-900' : 'bg-white border-gray-200'} border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200`}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} border rounded-xl flex items-center justify-center`}>
                    <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-700'}`}>
                      {brief.brand?.companyName?.charAt(0) || 'B'}
                    </span>
                  </div>
                  <div>
                    <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{brief.brand?.companyName || 'Brand'}</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(brief.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2 line-clamp-2`}>
                  {brief.title}
                </h2>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm mb-4 line-clamp-3`}>
                  {brief.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      ${(brief.reward || 0).toLocaleString()}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {brief.amountOfWinners || 1} winner{(brief.amountOfWinners || 1) > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {brief.submissions?.length || 0} submissions
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Deadline</span>
                    <span className={`text-sm font-medium ${daysRemaining < 0 ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-green-400' : 'text-green-600')}`}>
                      {daysRemaining < 0 ? 'Expired' : `${daysRemaining} days left`}
                    </span>
                  </div>
                  <div className={`${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full h-2`}>
                    <div 
                      className={`h-2 rounded-full ${daysRemaining < 0 ? 'bg-red-500' : 'bg-green-500'}`} 
                      style={{ width: `${Math.max(0, Math.min(100, ((30 - daysRemaining) / 30) * 100))}%` }} 
                    />
                  </div>
                </div>

                {hasApplied ? (
                  <button 
                    disabled
                    className={`w-full ${isDark ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500'} py-3 rounded-lg font-medium cursor-not-allowed`}
                  >
                    Already Applied
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setSelectedBrief(brief);
                      setShowApplyModal(true);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {marketplaceBriefs.length === 0 && !marketplaceLoading && (
        <div className="text-center py-12">
          <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-lg mb-4`}>
            No marketplace briefs available
          </div>
          <p className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Check back later for new opportunities
          </p>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
          Analytics Dashboard
        </h1>
        <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-lg`}>
          Track your performance and growth as a creator
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Submissions
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {mySubmissions.length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Approved Submissions
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {mySubmissions.filter(s => s.status === 'approved').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Earnings
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ${earnings.reduce((sum, earning) => sum + earning.amount, 0).toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Success Rate
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {mySubmissions.length > 0 
                  ? ((mySubmissions.filter(s => s.status === 'approved').length / mySubmissions.length) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Performance Over Time
        </h3>
        <div className={`h-64 flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg`}>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Chart visualization coming soon...
          </p>
        </div>
      </div>
    </div>
  );

  const renderPortfolio = () => (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
          Portfolio
        </h1>
        <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-lg`}>
          Showcase your work and achievements
        </p>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Completed Projects
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {mySubmissions.filter(s => s.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Rating
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                4.8/5
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Earnings
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ${earnings.reduce((sum, earning) => sum + earning.amount, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Work */}
      <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Featured Work
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mySubmissions.filter(s => s.status === 'approved').slice(0, 6).map((submission) => (
            <div key={submission.id} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {submission.briefTitle}
                </h4>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  Approved
                </span>
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Earned: ${submission.amount}
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {new Date(submission.submittedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Fetch invites when tab is activated
  const fetchInvites = useCallback(async () => {
    try {
      setInvitesLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }

      // Fetch all invites (pending, accepted, rejected)
      const [pendingResponse, acceptedResponse, rejectedResponse] = await Promise.all([
        fetch('/api/invites', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/invites?status=accepted', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/invites?status=rejected', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setInvites(pendingData);
      }

      if (acceptedResponse.ok) {
        const acceptedData = await acceptedResponse.json();
        setAcceptedInvites(acceptedData);
      }

      if (rejectedResponse.ok) {
        const rejectedData = await rejectedResponse.json();
        setRejectedInvites(rejectedData);
      }
    } catch (error) {
      // Error fetching invites
    } finally {
      setInvitesLoading(false);
    }
  }, []);

  // Fetch invites when invites tab is active
  useEffect(() => {
    if (activeTab === 'invites') {
      fetchInvites();
    }
  }, [activeTab, fetchInvites]);

  // Handle invite actions
  const handleInviteAction = async (inviteId: string, action: 'accept' | 'decline') => {
    try {
      setProcessingInviteId(inviteId);
      const token = localStorage.getItem('token');

      if (!token) {
        showToast('Not authenticated', 'error');
        return;
      }

      const response = await fetch(`/api/invites/${inviteId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove the invite from the list
        setInvites(invites.filter((invite) => invite.id !== inviteId));
        
        // Show success toast
        if (action === 'accept') {
          showToast('Invitation accepted successfully!', 'success');
        } else {
          showToast('Invitation declined', 'info');
        }
      } else {
        const data = await response.json();
        showToast(data.error || `Failed to ${action} invitation`, 'error');
      }
    } catch (error) {
      showToast(`Error ${action}ing invitation`, 'error');
    } finally {
      setProcessingInviteId(null);
    }
  };

  // Helper function to render individual invite card
  const renderInviteCard = (invite: Invite, showActions: boolean = true) => (
    <div
      key={invite.id}
      className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
    >
      <div className="p-6">
        {/* Brand Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            {invite.brand?.logo ? (
              <img 
                src={invite.brand.logo} 
                alt={invite.brand.companyName}
                className="w-14 h-14 rounded-xl object-cover"
              />
            ) : (
              <div className={`w-14 h-14 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                <svg className={`w-7 h-7 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
            <div>
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                {invite.brand?.companyName || 'Unknown Brand'}
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Invited {new Date(invite.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedBrandId(invite.brand?.id);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                isDark 
                  ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              } transition-colors`}
            >
              View Brand
            </button>
            {invite.status === 'PENDING' && (
              <span className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs font-medium">
                New Invitation
              </span>
            )}
            {invite.status === 'ACCEPTED' && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                Accepted
              </span>
            )}
            {invite.status === 'DECLINED' && (
              <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                Declined
              </span>
            )}
          </div>
        </div>

        {/* Message */}
        {invite.message && (
          <div className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
              &ldquo;{invite.message}&rdquo;
            </p>
          </div>
        )}

        {/* Brief Info (if available) */}
        {invite.brief && (
          <div className={`mb-4 p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-white'}`}>
            <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
              Related Brief
            </p>
            <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
              {invite.brief.title}
            </h4>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2 line-clamp-2`}>
              {invite.brief.description}
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <span className={isDark ? 'text-green-400' : 'text-green-600'}>
                💰 ${invite.brief.reward.toLocaleString()}
              </span>
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                📅 Deadline: {new Date(invite.brief.deadline).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons (only for pending invites) */}
        {showActions && invite.status === 'PENDING' && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleInviteAction(invite.id, 'accept')}
              disabled={processingInviteId === invite.id}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                processingInviteId === invite.id
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
            >
              {processingInviteId === invite.id ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Accept
                </span>
              )}
            </button>
            <button
              onClick={() => handleInviteAction(invite.id, 'decline')}
              disabled={processingInviteId === invite.id}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                processingInviteId === invite.id
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : isDark
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Decline
              </span>
            </button>
          </div>
        )}

        {/* Response date for accepted/declined invites */}
        {invite.respondedAt && (
          <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Responded on {new Date(invite.respondedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderInvites = () => {
    if (invitesLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className={isDark ? 'text-white' : 'text-gray-900'}>Loading invitations...</p>
          </div>
        </div>
      );
    }

    const totalInvites = invites.length + acceptedInvites.length + rejectedInvites.length;

    if (totalInvites === 0) {
      return (
        <div className="text-center py-16">
          <div className={`w-20 h-20 ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
            <svg className={`w-10 h-10 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
            No invitations yet
          </h3>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
            When brands invite you to collaborate, they&apos;ll appear here
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-8 p-6">
        {/* Pending Invitations */}
        {invites.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Pending Invitations ({invites.length})
              </h2>
            </div>
            <div className="space-y-4">
              {invites.map((invite) => renderInviteCard(invite, true))}
            </div>
          </div>
        )}

        {/* Accepted Invitations */}
        {acceptedInvites.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Accepted Invitations ({acceptedInvites.length})
              </h2>
            </div>
            <div className="space-y-4">
              {acceptedInvites.map((invite) => renderInviteCard(invite, false))}
            </div>
          </div>
        )}

        {/* Rejected Invitations */}
        {rejectedInvites.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Rejected Invitations ({rejectedInvites.length})
              </h2>
            </div>
            <div className="space-y-4">
              {rejectedInvites.map((invite) => renderInviteCard(invite, false))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'marketplace':
        return renderMarketplace();
      case 'briefs':
        return renderBriefs();
      case 'submissions':
        return renderSubmissions();
      case 'messaging':
        return renderMessaging();
      case 'earnings':
        return renderEarnings();
      case 'wallet':
        return <CreatorWallet />;
      case 'invites':
        return renderInvites();
      case 'analytics':
        return renderAnalytics();
      case 'portfolio':
        return renderPortfolio();
      case 'profile':
        return renderProfile();
      default:
        return renderOverview();
    }
  };

  return (
     <div className="min-h-screen bg-black flex flex-col lg:flex-row transition-colors duration-300 relative overflow-hidden font-sans">
      {/* Dark Green Background with Glowing Green Accents */}
      <div className="absolute inset-0">
        {/* Primary black background */}
        <div className="absolute inset-0 bg-black"></div>
        
        {/* Neon green light beam - diagonal from bottom right */}
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute bottom-0 right-0 w-full h-full"
            style={{
              background: `linear-gradient(135deg, transparent 0%, transparent 40%, rgba(34, 197, 94, 0.3) 60%, rgba(34, 197, 94, 0.5) 80%, rgba(34, 197, 94, 0.2) 100%)`,
              clipPath: 'polygon(60% 100%, 100% 40%, 100% 100%)'
            }}
          ></div>
        </div>
        
        {/* Secondary neon green accent - upper right */}
        <div className="absolute inset-0 opacity-15">
          <div 
            className="absolute top-0 right-0 w-1/2 h-1/2"
            style={{
              background: `linear-gradient(45deg, transparent 0%, rgba(34, 197, 94, 0.2) 50%, transparent 100%)`,
              clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%)'
            }}
          ></div>
        </div>
        
        {/* Subtle animated neon green glow effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 via-transparent to-green-600/3 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-green-500/4 via-transparent to-green-400/2 animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Floating glass panels with glassmorphism accents */}
        <div className="absolute top-1/4 left-1/4 w-96 h-64 glass opacity-15 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-48 glass opacity-12 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-56 glass opacity-14 animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Glowing neon green particles */}
        <div className="absolute top-1/6 right-1/6 w-3 h-3 bg-green-400 rounded-full opacity-40 animate-bounce" style={{animation: 'float 8s ease-in-out infinite'}}></div>
        <div className="absolute bottom-1/3 left-1/6 w-2 h-2 bg-green-300 rounded-full opacity-35 animate-bounce" style={{animation: 'float 6s ease-in-out infinite 1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-500 rounded-full opacity-28 animate-bounce" style={{animation: 'float 7s ease-in-out infinite 2s'}}></div>
        
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
       <div className="lg:hidden glass-nav border-b border-white/20 px-4 py-3">
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
              placeholder="Search briefs, brands, or topics..."
               className="w-full pl-4 pr-10 py-2 text-sm glass-input rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

      {/* Modern Sidebar */}
      <div className={`${activeTab === 'mobile-menu' ? 'block' : 'hidden'} lg:block w-full ${
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
      } ${isDark ? 'bg-gray-900/95 backdrop-blur-xl border-gray-800' : 'bg-white/95 backdrop-blur-xl border-gray-200'} border-r lg:min-h-screen lg:fixed lg:left-0 lg:top-0 lg:z-40 flex flex-col overflow-y-auto transition-all duration-300 shadow-xl`}>
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
                  className={`w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border transition-all duration-200 ${
                    isDark
                      ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:bg-gray-800'
                      : 'bg-gray-50/80 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:bg-white'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 flex-1">
            {filteredNavigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'} rounded-xl text-sm transition-all duration-300 group ${
                  activeTab === item.id
                    ? isDark
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25'
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25'
                    : isDark
                      ? 'text-gray-400 hover:bg-gray-800/50 hover:text-white hover:shadow-md'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                }`}
                title={sidebarCollapsed ? item.label : ''}
              >
                {item.icon === 'overview' && (
                  <svg className={`${sidebarCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                  </svg>
                )}
                {item.icon === 'wallet' && (
                  <svg className={`${sidebarCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                )}
                {item.icon === 'messaging' && (
                  <svg className={`${sidebarCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
                {item.icon === 'invites' && (
                  <svg className={`${sidebarCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                )}
                {item.icon === 'marketplace' && (
                  <svg className={`${sidebarCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                )}
                {item.icon === 'briefs' && (
                  <svg className={`${sidebarCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {item.icon === 'submissions' && (
                  <svg className={`${sidebarCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )}
                {item.icon === 'payments' && (
                  <svg className={`${sidebarCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
                {item.icon === 'statistics' && (
                  <svg className={`${sidebarCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )}
                {item.icon === 'awards' && (
                  <svg className={`${sidebarCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                )}
                {item.icon === 'profile' && (
                  <svg className={`${sidebarCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
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
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center p-3' : 'px-4 py-3'} rounded-xl text-sm transition-all duration-300 group ${
                    isDark
                      ? 'text-gray-400 hover:bg-gray-800/50 hover:text-white hover:shadow-md'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                  }`}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <span className={sidebarCollapsed ? '' : 'mr-3'}>
                    {item.id === 'settings' ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : item.id === 'logout' ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className={`hidden lg:block border-b ${isDark ? 'border-gray-900' : 'border-gray-200'} px-8 py-4 ${isDark ? 'bg-black' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {activeTab === 'overview' ? 'Dashboard' : 
                 activeTab === 'marketplace' ? 'Marketplace' :
                 activeTab === 'briefs' ? 'Available Briefs' :
                 activeTab === 'submissions' ? 'My Submissions' :
                 activeTab === 'earnings' ? 'Earnings' :
                 activeTab === 'wallet' ? 'Wallet' :
                 activeTab === 'invites' ? 'Invitations' :
                 activeTab === 'analytics' ? 'Analytics' :
                 activeTab === 'portfolio' ? 'Portfolio' :
                 activeTab === 'profile' ? 'Profile' : 'Dashboard'}
              </h1>
              
              {/* Search Bar */}
              {activeTab === 'overview' && (
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    placeholder="Search briefs, brands, or topics..."
                     className="w-80 pl-4 pr-10 py-2 text-sm glass-input rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              <ThemeToggle size="md" />
              <NotificationBell />
            </div>
          </div>
        </div>
        
        <div className="p-4 lg:p-8">
          {showSearchResults ? renderSearchResults() : renderContent()}
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
                  <div className="bg-gray-950 rounded-lg p-6 max-w-2xl w-full mx-4">
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
            <div className="bg-gray-900 p-4 rounded-lg">
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
                <h4 className="font-medium text-white mb-2">Creator&apos;s Submitted Content</h4>
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">Submitted File Link:</label>
                      <a 
                        href={submissionDetails.files.startsWith('http') ? submissionDetails.files : `${window.location.origin}${submissionDetails.files}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View Submitted Content
                      </a>
                    </div>
                    
                    {submissionDetails.content && submissionDetails.content.trim() && (
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Additional Content:</label>
                        <div className="bg-gray-800 p-3 rounded border border-gray-700">
                          <p className="text-gray-200 text-sm whitespace-pre-wrap">{submissionDetails.content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!submissionDetails.files && (
              <div className="bg-yellow-900/20 border border-yellow-600/30 p-4 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-yellow-200 text-sm">No file submission found for this application.</p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSubmissionViewModal(false)}
                className="px-4 py-2 border border-gray-800 rounded-md text-gray-300 hover:bg-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Brief Details Modal */}
      {selectedBriefId && (
        <BriefDetailsModal
          brief={(() => {
            const foundBrief = availableBriefs.find(b => b.id === selectedBriefId);
            if (foundBrief) {
              // Convert CreatorDashboard Brief to BriefDetailsModal format
              return {
                id: foundBrief.id,
                title: foundBrief.title,
                description: foundBrief.description,
                requirements: '',
                reward: foundBrief.reward,
                amountOfWinners: foundBrief.amountOfWinners,
                totalRewardsPaid: foundBrief.totalRewardsPaid,
                deadline: foundBrief.deadline,
                status: foundBrief.status,
                isPrivate: false,
                location: foundBrief.location || 'Anywhere',
                additionalFields: {},
                rewardTiers: [],
                winnerRewards: [],
                submissions: [],
                brand: foundBrief.brand
              };
            } else {
              // Fallback brief object
              return {
                id: selectedBriefId,
                title: 'Brief Not Found',
                description: 'This brief could not be found.',
                requirements: '',
                reward: 0,
                amountOfWinners: 1,
                totalRewardsPaid: 0,
                deadline: new Date().toISOString(),
                status: 'unknown',
                isPrivate: false,
                location: 'Unknown',
                additionalFields: {},
                rewardTiers: [],
                winnerRewards: [],
                submissions: [],
                brand: {
                  id: 'unknown',
                  companyName: 'Unknown Brand',
                  logo: undefined,
                  socialInstagram: undefined,
                  socialTwitter: undefined,
                  socialLinkedIn: undefined,
                  socialWebsite: undefined
                }
              };
            }
          })()}
          isOpen={showBriefDetailsModal}
          onClose={() => {
            setShowBriefDetailsModal(false);
            setSelectedBriefId(null);
          }}
        />
      )}

      {/* Brand Page View Modal */}
      {selectedBrandId && (
        <BrandPageView
          brandId={selectedBrandId}
          onClose={() => {
            setSelectedBrandId(null);
          }}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />


      {/* Earnings Details Modal */}
      {showEarningDetails && selectedEarning && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-950 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Earning Details</h3>
                <button
                  onClick={() => setShowEarningDetails(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Earning Summary */}
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">{selectedEarning.briefTitle}</h4>
                      <p className="text-3xl font-bold">${Number(selectedEarning.amount || 0).toFixed(2)}</p>
                      <p className="text-sm opacity-90 mt-1">
                        {selectedEarning.brandName || 'Unknown Brand'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        selectedEarning.status === 'paid' ? 'bg-emerald-500/20 text-emerald-100' :
                        selectedEarning.status === 'pending' ? 'bg-yellow-500/20 text-yellow-100' :
                        'bg-blue-500/20 text-blue-100'
                      }`}>
                        {selectedEarning.status.charAt(0).toUpperCase() + selectedEarning.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detailed Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-900/30 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-300 mb-3">Reward Information</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white">
                          {selectedEarning.rewardType || 'Cash'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-white font-semibold">
                          ${Number(selectedEarning.amount || 0).toFixed(2)}
                        </span>
                      </div>
                      {selectedEarning.position && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Position:</span>
                          <span className="text-white">#{selectedEarning.position}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-900/30 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-300 mb-3">Timeline</h5>
                    <div className="space-y-2">
                      {selectedEarning.submittedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Submitted:</span>
                          <span className="text-white">
                            {new Date(selectedEarning.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {selectedEarning.approvedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Approved:</span>
                          <span className="text-white">
                            {new Date(selectedEarning.approvedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {selectedEarning.paidAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Paid:</span>
                          <span className="text-white">
                            {new Date(selectedEarning.paidAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                {(selectedEarning.briefId || selectedEarning.transactionId) && (
                  <div className="bg-gray-900/30 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-300 mb-3">Reference Information</h5>
                    <div className="space-y-2">
                      {selectedEarning.briefId && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Brief ID:</span>
                          <span className="text-white font-mono text-sm">{selectedEarning.briefId}</span>
                        </div>
                      )}
                      {selectedEarning.transactionId && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Transaction ID:</span>
                          <span className="text-white font-mono text-sm">{selectedEarning.transactionId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => setShowEarningDetails(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors duration-200"
                  >
                    Close
                  </button>
                  {selectedEarning.briefId && (
                    <button
                      onClick={() => {
                        setSelectedBriefId(selectedEarning.briefId!);
                        setShowBriefDetailsModal(true);
                        setShowEarningDetails(false);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                    >
                      View Brief
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creator Application Form Modal */}
      {selectedBriefForApplication && (
        <CreatorApplicationForm
          brief={selectedBriefForApplication}
          isOpen={showApplicationForm}
          onClose={() => {
            setShowApplicationForm(false);
            setSelectedBriefForApplication(null);
            setIsEditingApplication(false);
          }}
          onSubmit={async (data) => {
            await handleSubmitApplication(data);
          }}
          isEdit={isEditingApplication}
          existingSubmission={isEditingApplication ? getExistingSubmission(selectedBriefForApplication.id) : undefined}
        />
      )}

      </div>
    </div>
  );
};

export default CreatorDashboard; 