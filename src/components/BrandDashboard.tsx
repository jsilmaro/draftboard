import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import DefaultAvatar from './DefaultAvatar';
import AnimatedNotification from './AnimatedNotification';
import CreateReward from './CreateReward';

interface Brief {
  id: string;
  title: string;
  status: 'active' | 'draft' | 'completed';
  submissions: number;
  deadline: string;
  budget: number;
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
  portfolio: string;
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

const BrandDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
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
  const [detailedSubmission, setDetailedSubmission] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successNotification, setSuccessNotification] = useState({
    title: '',
    message: '',
    icon: ''
  });
  const [showCreateReward, setShowCreateReward] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
  const [metrics, setMetrics] = useState({
    activeBriefs: 0,
    submissionsThisWeek: 0,
    winnersSelected: 0,
    avgSubmissions: 0,
    totalSubmissions: 0
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

      console.log('Fetching dashboard data with token:', token.substring(0, 20) + '...');

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
        console.log('Briefs fetched:', briefsData.length);
      } else {
        console.error('Failed to fetch briefs:', briefsResponse.status, briefsResponse.statusText);
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
      console.error('Error fetching dashboard data:', error);
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
      } else {
        console.error('Failed to publish brief');
      }
    } catch (error) {
      console.error('Error publishing brief:', error);
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
      } else {
        console.error('Failed to update brief');
      }
    } catch (error) {
      console.error('Error updating brief:', error);
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
        console.error('Failed to send invitation');
        alert('Failed to send invitation. Please try again.');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
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
        
        alert(`Creator Contact Details:\n\nName: ${contactData.fullName}\nUsername: @${contactData.userName}\nEmail: ${contactData.email}\nSocial Handles:\n${socialHandles}\nPortfolio: ${contactData.portfolio || 'Not provided'}`);
      } else {
        console.error('Failed to get creator contact details');
        alert('Unable to get creator contact details. Make sure you have submissions from this creator.');
      }
    } catch (error) {
      console.error('Error getting creator contact details:', error);
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
        console.error('Failed to fetch detailed submission data');
        setDetailedSubmission(null);
      }
    } catch (error) {
      console.error('Error fetching detailed submission:', error);
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
        console.error('Failed to reject submission');
        alert('Failed to reject submission. Please try again.');
      }
    } catch (error) {
      console.error('Error rejecting submission:', error);
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
        console.error('Failed to approve submission');
        alert('Failed to approve submission. Please try again.');
      }
    } catch (error) {
      console.error('Error approving submission:', error);
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
        <DefaultAvatar name={user?.companyName || 'Brand'} size="md" />
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
              <span className={`px-2 py-1 text-xs rounded-full ${
                brief.status === 'active' ? 'bg-green-100 text-green-800' :
                brief.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Submissions: {brief.submissions}</p>
              <p>Budget: ${brief.budget.toLocaleString()}</p>
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
            </div>
          </div>
        ))}
      </div>

      {/* View Modal */}
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
                <span className="font-medium">Status:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedBrief.status === 'active' ? 'bg-green-100 text-green-800' :
                  selectedBrief.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedBrief.status.charAt(0).toUpperCase() + selectedBrief.status.slice(1)}
                </span>
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
                <span className="font-medium">Submissions:</span>
                <span>{selectedBrief.submissions}</span>
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
                  handleEditBrief(selectedBrief);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedBrief && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Edit Brief</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdateBrief(selectedBrief.id, {
                title: formData.get('title') as string,
                budget: parseFloat(formData.get('budget') as string),
                deadline: formData.get('deadline') as string,
                status: formData.get('status') as 'draft' | 'active'
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={selectedBrief.title}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget</label>
                  <input
                    type="number"
                    name="budget"
                    defaultValue={selectedBrief.budget}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deadline</label>
                  <input
                    type="date"
                    name="deadline"
                    defaultValue={new Date(selectedBrief.deadline).toISOString().split('T')[0]}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    defaultValue={selectedBrief.status}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
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
                    Publish
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{submission.briefTitle}</td>
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
              <p>Portfolio: {creator.portfolio ? 'Available' : 'Not available'}</p>
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
                  <span className="font-medium">Portfolio:</span>
                  <p className="text-gray-600">{selectedCreator.portfolio ? 'Available' : 'Not available'}</p>
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
                <li>Click "Invite" on any creator card to send them a direct invitation</li>
                <li>Share your brief link with creators you know</li>
                <li>Use the "View Profile" button to see more details about creators</li>
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
    if (showCreateReward) {
      return <CreateReward 
        onBack={() => {
          setShowCreateReward(false);
          setSelectedDraft(null);
        }} 
        draftToEdit={selectedDraft}
      />;
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Rewards</h2>
          <button 
            onClick={() => setShowCreateReward(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Reward
          </button>
        </div>

        {/* Drafts Section */}
        {drafts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Drafts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drafts.map((draft) => (
                <div key={draft.id} className="bg-yellow-50 p-6 rounded-lg shadow-sm border border-yellow-200">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-gray-900">{draft.briefTitle}</h4>
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                      Draft
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      {draft.rewardTiers.length} reward tier{draft.rewardTiers.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      Saved: {new Date(draft.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                                     <div className="flex space-x-2">
                     <button 
                       onClick={() => {
                         setSelectedDraft(draft);
                         setShowCreateReward(true);
                       }}
                       className="text-blue-600 hover:text-blue-800 text-sm"
                     >
                       Continue Editing
                     </button>
                     <button 
                       onClick={async () => {
                         if (confirm('Are you sure you want to delete this draft?')) {
                           try {
                             const token = localStorage.getItem('token');
                             const response = await fetch(`/api/brands/rewards/draft/${draft.id}`, {
                               method: 'DELETE',
                               headers: { Authorization: `Bearer ${token}` }
                             });
                             
                             if (response.ok) {
                               // Refresh dashboard data
                               fetchDashboardData();
                             } else {
                               alert('Failed to delete draft');
                             }
                           } catch (error) {
                             console.error('Error deleting draft:', error);
                             alert('Error deleting draft');
                           }
                         }
                       }}
                       className="text-red-600 hover:text-red-800 text-sm"
                     >
                       Delete
                     </button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Published Rewards Section */}
        {rewards.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Published Rewards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => (
                <div key={reward.id} className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-200">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-gray-900">{reward.briefTitle}</h4>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Published
                    </span>
                  </div>
                  <div className="space-y-3 mb-4">
                    {reward.rewardTiers.map((tier, index) => (
                      <div key={index} className="bg-white p-3 rounded border border-green-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-700">{tier.name}</span>
                          <span className="text-green-600 font-semibold">${tier.amount}</span>
                        </div>
                        {tier.winnerName && (
                          <div className="flex items-center text-sm">
                            <span className="text-gray-500">Winner:</span>
                            <span className="text-green-600 font-medium ml-1">🏆 {tier.winnerName}</span>
                          </div>
                        )}
                        {tier.description && (
                          <p className="text-xs text-gray-500 mt-1">{tier.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Published: {new Date(reward.publishedAt || reward.submittedAt).toLocaleDateString()}
                  </p>
                  
                  {/* Winners Section */}
                  <div className="space-y-3 mb-4">
                    <h5 className="font-medium text-gray-900">Winners</h5>
                    {reward.rewardTiers.map((tier: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-900">{tier.name}</span>
                          <span className="text-sm font-bold text-green-600">${tier.amount}</span>
                        </div>
                        {tier.winnerName && (
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600">🏆 {tier.winnerName}</span>
                          </div>
                        )}
                        {tier.description && (
                          <p className="text-xs text-gray-500 mt-1">{tier.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Published: {new Date(reward.submittedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {rewards.length === 0 && drafts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎁</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No rewards yet</h3>
            <p className="text-gray-600 mb-6">Create your first reward to recognize outstanding creators</p>
            <button 
              onClick={() => setShowCreateReward(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Reward
            </button>
          </div>
        )}
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

            {/* Submission Content */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Submission Content</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                {detailedSubmission ? (
                  <>
                    {/* Text Content */}
                    {detailedSubmission.content && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Creator's Proposal</h5>
                        <div className="bg-white p-3 rounded border text-sm text-gray-700 whitespace-pre-wrap">
                          {detailedSubmission.content}
                        </div>
                      </div>
                    )}

                    {/* Files */}
                    {detailedSubmission.files && detailedSubmission.files.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Attached Files</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {detailedSubmission.files.map((file: string, index: number) => (
                            <div key={index} className="bg-white p-3 rounded border">
                              <div className="text-sm text-gray-600 mb-1">
                                File {index + 1}
                              </div>
                              <a 
                                href={file} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View File
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Submission Details */}
                    <div className="text-sm text-gray-500 border-t pt-3">
                      <p><strong>Amount:</strong> ${detailedSubmission.amount}</p>
                      <p><strong>Submitted:</strong> {new Date(detailedSubmission.submittedAt).toLocaleString()}</p>
                      <p><strong>Files:</strong> {detailedSubmission.files ? detailedSubmission.files.length : 0} attached</p>
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

            {/* Creator Portfolio Preview */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Creator Portfolio</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 mb-3">
                  Previous work and portfolio items from {selectedSubmission.creatorName}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="bg-gray-200 h-20 rounded flex items-center justify-center">
                      <span className="text-gray-500 text-xs">Portfolio Item {item}</span>
                    </div>
                  ))}
                </div>
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
                  <li>• The submission will be moved to the "Rejected" tab</li>
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
                  <li>• The submission will be moved to the "Shortlist" tab</li>
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
      {renderReviewModal()}
      {renderRejectModal()}
      {renderApproveModal()}

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

export default BrandDashboard; 