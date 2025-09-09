/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import WithdrawalManagement from './WithdrawalManagement';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);


interface User {
  id: string;
  email: string;
  type: 'brand' | 'creator' | 'admin';
  companyName?: string;
  userName?: string;
  fullName?: string;
  isVerified: boolean;
  createdAt: string;
}

interface Brief {
  id: string;
  title: string;
  brandId: string;
  brandName: string;
  status: 'published' | 'draft' | 'archived';
  reward: number;
  submissions: number;
  createdAt: string;
  deadline?: string;
  archivedAt?: string;
}

interface Submission {
  id: string;
  briefId: string;
  briefTitle: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  amount: number;
  submittedAt: string;
  briefDescription: string;
  briefReward: number;
  briefAdditionalFields: unknown;
}

interface Analytics {
  totalBrands: number;
  totalCreators: number;
  totalBriefs: number;
  totalSubmissions: number;
  totalPayouts: number;
  monthlyRevenue: number;
}

interface ApiBrand {
  id: string;
  companyName: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
}

interface ApiCreator {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
}

interface ApiBrief {
  id: string;
  title: string;
  brandId: string;
  brand: {
    companyName: string;
  };
  status: 'active' | 'completed' | 'draft';
  reward: number;
  _count: {
    submissions: number;
  };
  createdAt: string;
}

interface ApiSubmission {
  id: string;
  briefId: string;
  brief: {
    title: string;
    description?: string;
    reward?: number;
    additionalFields?: unknown;
  };
  creatorId: string;
  creator: {
    fullName: string;
    email?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  amount: number;
  submittedAt: string;
}

const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [brands, setBrands] = useState<User[]>([]);
  const [creators, setCreators] = useState<User[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalBrands: 0,
    totalCreators: 0,
    totalBriefs: 0,
    totalSubmissions: 0,
    totalPayouts: 0,
    monthlyRevenue: 0
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'create'>('view');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchData = async (search = '', status = '', page = 1) => {
    try {
      // Get the authentication token
      const token = localStorage.getItem('token');
      
      if (!token) {
        // No authentication token found
        return;
      }

      // Build search parameters
      const searchParams = new URLSearchParams();
      if (search) searchParams.append('search', search);
      if (status) searchParams.append('status', status);
      if (page > 1) searchParams.append('page', page.toString());
      searchParams.append('limit', itemsPerPage.toString());

      // Fetch all data in parallel with authentication headers
      const [brandsRes, creatorsRes, briefsRes, submissionsRes, analyticsRes] = await Promise.all([
        fetch(`/api/admin/brands?${searchParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`/api/admin/creators?${searchParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`/api/admin/briefs?${searchParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`/api/admin/submissions?${searchParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/admin/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (brandsRes.ok) {
        const brandsData = await brandsRes.json();
        const brandsArray = brandsData.brands || brandsData || [];
        setBrands(brandsArray.map((brand: ApiBrand) => ({
          id: brand.id,
          email: brand.email,
          type: 'brand' as const,
          companyName: brand.companyName,
          isVerified: brand.isVerified,
          createdAt: brand.createdAt
        })));
      }

      if (creatorsRes.ok) {
        const creatorsData = await creatorsRes.json();
        const creatorsArray = creatorsData.creators || creatorsData || [];
        setCreators(creatorsArray.map((creator: ApiCreator) => ({
          id: creator.id,
          email: creator.email,
          type: 'creator' as const,
          userName: creator.userName,
          fullName: creator.fullName,
          isVerified: creator.isVerified,
          createdAt: creator.createdAt
        })));
      }

      if (briefsRes.ok) {
        const briefsData = await briefsRes.json();
        const briefsArray = briefsData.briefs || briefsData || [];
        setBriefs(briefsArray.map((brief: ApiBrief) => ({
          id: brief.id,
          title: brief.title,
          brandId: brief.brandId,
          brandName: brief.brand?.companyName || 'Unknown Brand',
          status: brief.status as 'active' | 'completed' | 'draft',
          reward: brief.reward,
          submissions: brief._count?.submissions || 0,
          createdAt: brief.createdAt
        })));
      }

      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        const submissionsArray = submissionsData.submissions || submissionsData || [];
        setSubmissions(submissionsArray.map((submission: ApiSubmission) => ({
          id: submission.id,
          briefId: submission.briefId,
          briefTitle: submission.brief?.title || 'Unknown Brief',
          creatorId: submission.creatorId,
          creatorName: submission.creator?.fullName || 'Unknown Creator',
          creatorEmail: submission.creator?.email || 'No email',
          status: submission.status as 'pending' | 'approved' | 'rejected',
          amount: submission.amount,
          submittedAt: submission.submittedAt,
          briefDescription: submission.brief?.description || 'No description',
          briefReward: submission.brief?.reward || 0,
          briefAdditionalFields: submission.brief?.additionalFields || null
        })));
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics({
          totalBrands: analyticsData.totalBrands,
          totalCreators: analyticsData.totalCreators,
          totalBriefs: analyticsData.totalBriefs,
          totalSubmissions: analyticsData.totalSubmissions,
          totalPayouts: analyticsData.totalPayouts,
          monthlyRevenue: analyticsData.monthlyRevenue
        });
      }
    } catch (error) {
      // Error fetching admin data - set empty arrays when API fails
      setBrands([]);
      setCreators([]);
      setBriefs([]);
      setSubmissions([]);
      setAnalytics({
        totalBrands: 0,
        totalCreators: 0,
        totalBriefs: 0,
        totalSubmissions: 0,
        totalPayouts: 0,
        monthlyRevenue: 0
      });
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search and filter handlers
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    fetchData(term, filterStatus, 1);
  };

  const handleFilter = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1);
    fetchData(searchTerm, status, 1);
  };



  // Handler functions for View and Delete
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleView = async (item: any, type: string) => {
    try {
      // eslint-disable-next-line no-console
      console.log('👁️ Viewing item:', item, 'Type:', type);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No token found');
        alert('Authentication required. Please log in again.');
        return;
      }

      const url = `/api/admin/${type}/${item.id}`;
      // eslint-disable-next-line no-console
      console.log('🌐 Calling API:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // eslint-disable-next-line no-console
      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        // eslint-disable-next-line no-console
        console.log('✅ Data fetched successfully:', data);
        setSelectedItem(data);
        setModalType('view');
        setShowModal(true);
      } else {
        const errorData = await response.json();
        // eslint-disable-next-line no-console
        console.error('❌ API Error:', errorData);
        alert(`Error fetching details: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Network/JS Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Network error: ${errorMessage}`);
    }
  };



  const handleCreate = (_type: string) => {
    setModalType('create');
    setFormData({});
    setIsEditing(false);
    setShowModal(true);
  };

  const handleSave = async (type: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const isCreate = modalType === 'create';
      const url = isCreate 
        ? `/api/admin/${type}` 
        : `/api/admin/${type}/${selectedItem.id}`;
      
      const method = isCreate ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        // eslint-disable-next-line no-console
        console.log('✅ Item saved successfully:', result);
        
        alert(`${isCreate ? 'Created' : 'Updated'} successfully!`);
        setShowModal(false);
        setFormData({});
        setSelectedItem(null);
        fetchData(); // Refresh data
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to save'}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Error saving:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Network error: ${errorMessage}`);
    }
  };



  const handleReviewSubmission = async (submissionId: string, status: 'approved' | 'rejected') => {
    const actionKey = `${submissionId}-${status}`;
    
    try {
      // eslint-disable-next-line no-console
      console.log('🔄 Reviewing submission:', submissionId, 'Status:', status);
      
      // Set loading state
      setLoadingStates(prev => ({ ...prev, [actionKey]: true }));
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No token found');
        alert('Authentication required. Please log in again.');
        return;
      }

      const url = `/api/admin/submissions/${submissionId}/review`;
      // eslint-disable-next-line no-console
      console.log('🌐 Calling API:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      // eslint-disable-next-line no-console
      console.log('📡 Response status:', response.status);
      // eslint-disable-next-line no-console
      console.log('📡 Response headers:', response.headers);

      if (response.ok) {
        const result = await response.json();
        // eslint-disable-next-line no-console
        console.log('✅ Submission updated successfully:', result);
        
        // Show success message
        alert(`Submission ${status} successfully!`);
        
        // Refresh data to show updated status
        fetchData();
      } else {
        const errorData = await response.json();
        // eslint-disable-next-line no-console
        console.error('❌ API Error:', errorData);
        alert(`Error: ${errorData.error || 'Failed to update submission'}`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Network/JS Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Network error: ${errorMessage}`);
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '/icons/Green_icons/Dashboard1.png' },
    { id: 'brands', label: 'Manage Brands', icon: '/icons/profile.png' },
    { id: 'creators', label: 'Manage Creators', icon: '/icons/profile.png' },
    { id: 'briefs', label: 'Manage Briefs', icon: '/icons/Green_icons/Brief1.png' },
    { id: 'archived-briefs', label: 'Archived Briefs', icon: '/icons/Green_icons/Brief1.png' },
    { id: 'submissions', label: 'Submissions', icon: '/icons/Green_icons/Task1.png' },
    { id: 'withdrawals', label: 'Withdrawals', icon: '/icons/Green_icons/Withdrawal1.png' },
    { id: 'payouts', label: 'Payouts', icon: '/icons/Green_icons/MoneyBag1.png' },
    { id: 'analytics', label: 'Analytics', icon: '/icons/Green_icons/Statistic1.png' },
  ];

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-gray-900 p-6 rounded-lg shadow-md">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-full">
            <img src="/icons/profile.png" alt="Brands" className="w-10 h-10" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-300">Total Brands</p>
            <p className="text-2xl font-bold text-white">{analytics.totalBrands}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded-lg shadow-md">
        <div className="flex items-center">
          <div className="p-3 bg-green-100 rounded-full">
            <img src="/icons/profile.png" alt="Creators" className="w-10 h-10" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-300">Total Creators</p>
            <p className="text-2xl font-bold text-white">{analytics.totalCreators}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded-lg shadow-md">
        <div className="flex items-center">
          <div className="p-3 bg-purple-100 rounded-full">
            <img src="/icons/Green_icons/Brief1.png" alt="Briefs" className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-300">Available Briefs</p>
            <p className="text-2xl font-bold text-white">{briefs.filter(b => b.status === 'published').length}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded-lg shadow-md">
        <div className="flex items-center">
          <div className="p-3 bg-yellow-100 rounded-full">
            <img src="/icons/Green_icons/MoneyBag1.png" alt="Payouts" className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-300">Monthly Revenue</p>
            <p className="text-2xl font-bold text-white">${analytics.monthlyRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBrands = () => (
    <div className="bg-gray-900/20 backdrop-blur-xl rounded-lg shadow-md border border-gray-600/30">
      <div className="px-6 py-4 border-b border-gray-700/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Brand Management</h3>
            <p className="text-sm text-gray-300 mt-1">Overview of registered brands with contact information</p>
          </div>
          <button
            onClick={() => handleCreate('brands')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            + Add Brand
          </button>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search brands..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => handleFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-600/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Brand</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900/10 divide-y divide-gray-700/30">
            {brands.map((brand) => (
              <tr key={brand.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-300">{brand.companyName?.charAt(0)}</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">{brand.companyName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {brand.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    brand.isVerified ? 'bg-green-900/20 text-green-400' : 'bg-yellow-900/20 text-yellow-400'
                  }`}>
                    {brand.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {new Date(brand.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleView(brand, 'brands')}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200 mr-2"
                  >
                    View
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCreators = () => (
    <div className="bg-gray-900/20 backdrop-blur-xl rounded-lg shadow-md border border-gray-600/30">
      <div className="px-6 py-4 border-b border-gray-700/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Creator Management</h3>
            <p className="text-sm text-gray-300 mt-1">Overview of registered creators with contact information</p>
          </div>
          <button
            onClick={() => handleCreate('creators')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
          >
            + Add Creator
          </button>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search creators..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => handleFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
          >
            <option value="">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-600/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Creator</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900/10 divide-y divide-gray-700/30">
            {creators.map((creator) => (
              <tr key={creator.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-300">{creator.userName?.charAt(0)}</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">{creator.fullName}</div>
                      <div className="text-sm text-gray-300">@{creator.userName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {creator.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    creator.isVerified ? 'bg-green-900/20 text-green-400' : 'bg-yellow-900/20 text-yellow-400'
                  }`}>
                    {creator.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {new Date(creator.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleView(creator, 'creators')}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200 mr-2"
                  >
                    View
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBriefs = () => (
    <div className="bg-gray-900/20 backdrop-blur-xl rounded-lg shadow-md border border-gray-600/30">
      <div className="px-6 py-4 border-b border-gray-700/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Brief Management</h3>
            <p className="text-sm text-gray-300 mt-1">Manage all campaign briefs</p>
          </div>
          <button
            onClick={() => handleCreate('briefs')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
          >
            + Add Brief
          </button>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search briefs..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => handleFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-600/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Brief</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Brand</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Reward</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Submissions</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900/10 divide-y divide-gray-700/30">
            {briefs.map((brief) => (
              <tr key={brief.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{brief.title}</div>
                  <div className="text-sm text-gray-300">Created {new Date(brief.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{brief.brandName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${brief.reward.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    brief.status === 'published' ? 'bg-green-900/20 text-green-400' :
                    brief.status === 'archived' ? 'bg-blue-900/20 text-blue-400' :
                    'bg-gray-800 text-gray-300'
                  }`}>
                    {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{brief.submissions}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleView(brief, 'briefs')}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200 mr-2"
                  >
                    View
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderArchivedBriefs = () => {
    const archivedBriefs = briefs.filter(brief => brief.status === 'archived');
    
    return (
      <div className="bg-gray-900/20 backdrop-blur-xl rounded-lg shadow-md border border-gray-600/30">
        <div className="px-6 py-4 border-b border-gray-700/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Archived Briefs</h3>
              <p className="text-sm text-gray-300 mt-1">Briefs that have exceeded their deadline and been automatically archived</p>
            </div>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/admin/archive-expired-briefs', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    alert(`Archiving completed: ${result.result.archived} briefs archived, ${result.result.notifications} notifications sent`);
                    // Refresh the data
                    fetchData();
                  } else {
                    alert('Failed to run archiving process');
                  }
                } catch (error) {
                  console.error('Error running archiving:', error);
                  alert('Error running archiving process');
                }
              }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200"
            >
              🔄 Run Archive Process
            </button>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search archived briefs..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>
        
        {archivedBriefs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Archived Briefs</h3>
            <p className="text-gray-400">Briefs that exceed their deadline will be automatically archived here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-600/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Brief</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Reward</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Archived</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Submissions</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900/10 divide-y divide-gray-700/30">
                {archivedBriefs.map((brief) => (
                  <tr key={brief.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{brief.title}</div>
                      <div className="text-sm text-gray-300">Created {new Date(brief.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{brief.brandName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${brief.reward.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400">
                      {brief.deadline ? new Date(brief.deadline).toLocaleDateString() : 'No deadline'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {brief.archivedAt ? new Date(brief.archivedAt).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{brief.submissions}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleView(brief, 'briefs')}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors duration-200 mr-2"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderSubmissions = () => (
    <div className="bg-gray-900/20 backdrop-blur-xl rounded-lg shadow-md border border-gray-600/30">
      <div className="px-6 py-4 border-b border-gray-700/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Submission Monitoring</h3>
            <p className="text-sm text-gray-300 mt-1">Track all creator submissions</p>
          </div>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => handleFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-600/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Brief</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Creator</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900/10 divide-y divide-gray-700/30">
            {submissions.map((submission) => (
              <tr key={submission.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{submission.briefTitle}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{submission.creatorName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${submission.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    submission.status === 'approved' ? 'bg-green-900/20 text-green-400' :
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
                    onClick={() => handleView(submission, 'submissions')}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200 mr-2"
                  >
                    Review
                  </button>
                  <button 
                    onClick={() => handleReviewSubmission(submission.id, 'approved')}
                    disabled={loadingStates[`${submission.id}-approved`]}
                    className={`px-3 py-1 rounded-md transition-colors duration-200 mr-2 ${
                      loadingStates[`${submission.id}-approved`]
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    } text-white`}
                  >
                    {loadingStates[`${submission.id}-approved`] ? '⏳' : 'Approve'}
                  </button>
                  <button 
                    onClick={() => handleReviewSubmission(submission.id, 'rejected')}
                    disabled={loadingStates[`${submission.id}-rejected`]}
                    className={`px-3 py-1 rounded-md transition-colors duration-200 mr-2 ${
                      loadingStates[`${submission.id}-rejected`]
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    } text-white`}
                  >
                    {loadingStates[`${submission.id}-rejected`] ? '⏳' : 'Reject'}
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPayouts = () => (
    <div className="bg-gray-900/20 backdrop-blur-xl rounded-lg shadow-md border border-gray-600/30">
      <div className="px-6 py-4 border-b border-gray-700/30">
        <h3 className="text-lg font-semibold text-white">Payout Management</h3>
        <p className="text-sm text-gray-300 mt-1">Track and manage creator payouts</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-emerald-900/20 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-emerald-500">Total Payouts</h4>
            <p className="text-2xl font-bold text-emerald-500">${analytics.totalPayouts.toLocaleString()}</p>
          </div>
          <div className="bg-blue-900/20 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-400">Pending Payouts</h4>
            <p className="text-2xl font-bold text-blue-400">${submissions.filter(s => s.status === 'approved').reduce((sum, s) => sum + s.amount, 0).toLocaleString()}</p>
          </div>
          <div className="bg-yellow-900/20 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-yellow-400">This Month</h4>
            <p className="text-2xl font-bold text-yellow-400">${(analytics.monthlyRevenue * 0.7).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-600/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Creator</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900/10 divide-y divide-gray-700/30">
              {submissions.filter(s => s.status === 'approved').map((submission) => (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{submission.creatorName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${submission.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-900/20 text-emerald-500">
                      Paid
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleView(submission, 'payouts')}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200"
                    >
                      View Details
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

  const renderAnalytics = () => {
    // Chart data preparation
    const submissionStatusData = {
      labels: ['Pending', 'Approved', 'Rejected'],
      datasets: [{
        data: [
          submissions.filter(s => s.status === 'pending').length,
          submissions.filter(s => s.status === 'approved').length,
          submissions.filter(s => s.status === 'rejected').length
        ],
        backgroundColor: [
          'rgba(255, 193, 7, 0.8)',
          'rgba(40, 167, 69, 0.8)',
          'rgba(220, 53, 69, 0.8)'
        ],
        borderColor: [
          'rgba(255, 193, 7, 1)',
          'rgba(40, 167, 69, 1)',
          'rgba(220, 53, 69, 1)'
        ],
        borderWidth: 2
      }]
    };

    const briefStatusData = {
      labels: ['Draft', 'Active', 'Completed'],
      datasets: [{
        data: [
          briefs.filter(b => b.status === 'draft').length,
          briefs.filter(b => b.status === 'published').length,
          briefs.filter(b => b.status === 'archived').length
        ],
        backgroundColor: [
          'rgba(108, 117, 125, 0.8)',
          'rgba(0, 123, 255, 0.8)',
          'rgba(40, 167, 69, 0.8)'
        ],
        borderColor: [
          'rgba(108, 117, 125, 1)',
          'rgba(0, 123, 255, 1)',
          'rgba(40, 167, 69, 1)'
        ],
        borderWidth: 2
      }]
    };

    const revenueData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        label: 'Monthly Revenue',
        data: Array(12).fill(0).map((_, i) => i === 8 ? analytics.monthlyRevenue : Math.random() * 10000),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true
      }]
    };

    const userGrowthData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      datasets: [
        {
          label: 'Brands',
          data: Array(9).fill(0).map((_, i) => i === 8 ? analytics.totalBrands : Math.floor(Math.random() * analytics.totalBrands)),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.4
        },
        {
          label: 'Creators',
          data: Array(9).fill(0).map((_, i) => i === 8 ? analytics.totalCreators : Math.floor(Math.random() * analytics.totalCreators)),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4
        }
      ]
    };

    return (
      <div className="space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 p-6 rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-300">Total Brands</p>
                <p className="text-3xl font-bold text-blue-400">{analytics.totalBrands}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <img src="/icons/profile.png" alt="Brands" className="w-10 h-10" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 p-6 rounded-xl border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-300">Total Creators</p>
                <p className="text-3xl font-bold text-green-400">{analytics.totalCreators}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <img src="/icons/profile.png" alt="Creators" className="w-10 h-10" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 p-6 rounded-xl border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-300">Total Briefs</p>
                <p className="text-3xl font-bold text-purple-400">{analytics.totalBriefs}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <img src="/icons/Green_icons/Brief1.png" alt="Briefs" className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 p-6 rounded-xl border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-300">Monthly Revenue</p>
                <p className="text-3xl font-bold text-yellow-400">${analytics.monthlyRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <img src="/icons/Green_icons/MoneyBag1.png" alt="Payouts" className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submission Status Chart */}
          <div className="bg-gray-900/20 backdrop-blur-xl p-6 rounded-xl border border-gray-600/30">
            <h3 className="text-lg font-semibold text-white mb-4">Submission Status Distribution</h3>
            <div className="h-64">
              <Doughnut 
                data={submissionStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: 'white',
                        padding: 20
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Brief Status Chart */}
          <div className="bg-gray-900/20 backdrop-blur-xl p-6 rounded-xl border border-gray-600/30">
            <h3 className="text-lg font-semibold text-white mb-4">Brief Status Distribution</h3>
            <div className="h-64">
              <Doughnut 
                data={briefStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: 'white',
                        padding: 20
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-gray-900/20 backdrop-blur-xl p-6 rounded-xl border border-gray-600/30">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend (Last 12 Months)</h3>
          <div className="h-80">
            <Line 
              data={revenueData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: {
                      color: 'white'
                    }
                  }
                },
                scales: {
                  x: {
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                  },
                  y: {
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-gray-900/20 backdrop-blur-xl p-6 rounded-xl border border-gray-600/30">
          <h3 className="text-lg font-semibold text-white mb-4">User Growth Trend</h3>
          <div className="h-80">
            <Line 
              data={userGrowthData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: {
                      color: 'white'
                    }
                  }
                },
                scales: {
                  x: {
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                  },
                  y: {
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900/20 backdrop-blur-xl p-6 rounded-xl border border-gray-600/30">
            <h3 className="text-lg font-semibold text-white mb-4">Brief Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-300">Available Briefs</span>
                <span className="text-sm font-medium text-white bg-blue-500/20 px-3 py-1 rounded-full">
                  {briefs.filter(b => b.status === 'published').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-300">Archived Briefs</span>
                <span className="text-sm font-medium text-white bg-green-500/20 px-3 py-1 rounded-full">
                  {briefs.filter(b => b.status === 'archived').length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-300">Total Submissions</span>
                <span className="text-sm font-medium text-white bg-purple-500/20 px-3 py-1 rounded-full">
                  {submissions.length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/20 backdrop-blur-xl p-6 rounded-xl border border-gray-600/30">
            <h3 className="text-lg font-semibold text-white mb-4">Financial Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-300">Total Payouts</span>
                <span className="text-sm font-medium text-white bg-green-500/20 px-3 py-1 rounded-full">
                  ${analytics.totalPayouts.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-300">Platform Fee (10%)</span>
                <span className="text-sm font-medium text-white bg-yellow-500/20 px-3 py-1 rounded-full">
                  ${(analytics.monthlyRevenue * 0.1).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-300">Net Revenue</span>
                <span className="text-sm font-medium text-white bg-blue-500/20 px-3 py-1 rounded-full">
                  ${(analytics.monthlyRevenue * 0.9).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'brands':
        return renderBrands();
      case 'creators':
        return renderCreators();
      case 'briefs':
        return renderBriefs();
      case 'archived-briefs':
        return renderArchivedBriefs();
      case 'submissions':
        return renderSubmissions();
      case 'withdrawals':
        return <WithdrawalManagement />;
      case 'payouts':
        return renderPayouts();
      case 'analytics':
        return renderAnalytics();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            </div>
                         <div className="flex items-center space-x-4">
               <Link to="/" className="text-gray-300 hover:text-white">
                 ← Back to Home
               </Link>
               <button
                 onClick={logout}
                 className="text-red-400 hover:text-red-300 font-medium"
               >
                 Logout
               </button>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400 bg-blue-900/20 px-3 py-2 rounded-t-lg'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-800/30 px-3 py-2 rounded-t-lg'
                }`}
              >
                <img src={tab.icon} alt={tab.label} className="w-7 h-7 mr-2" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {renderContent()}
      </div>

            {/* Enhanced Modal System for CRUD Operations */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border-b border-white/20 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">
                      {modalType === 'view' ? '👁️' : 
                       modalType === 'edit' ? '✏️' : 
                       modalType === 'create' ? '➕' : '🗑️'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {modalType === 'view' ? 'View Details' : 
                       modalType === 'edit' ? 'Edit Item' : 
                       modalType === 'create' ? 'Create New' : 'Confirm Delete'}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {modalType === 'view' ? 'Detailed information' : 
                       modalType === 'edit' ? 'Modify existing item' : 
                       modalType === 'create' ? 'Add new item' : 'Delete confirmation'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedItem(null);

                    setFormData({});
                    setIsEditing(false);
                  }}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-gray-300 hover:text-white transition-all duration-200"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* View Mode */}
              {modalType === 'view' && selectedItem && (
                <div className="space-y-8">
                  {/* Header Section */}
                  <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-8 border border-white/20">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <img src="/icons/profile.png" alt="Brand" className="w-12 h-12" />
                      </div>
                      <div>
                        <h4 className="text-3xl font-bold text-white mb-2">
                          {selectedItem.companyName || selectedItem.title || selectedItem.userName || 'Item Details'}
                        </h4>
                        <p className="text-xl text-gray-300">
                          {selectedItem.email || selectedItem.description || 'Detailed Information'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Basic Information */}
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-gray-900/40 to-gray-800/40 rounded-2xl p-6 border border-white/10">
                        <h5 className="text-xl font-semibold text-white mb-6 flex items-center">
                          <img src="/icons/Green_icons/Brief1.png" alt="Info" className="w-5 h-5 mr-3" />
                          Basic Information
                        </h5>
                        <div className="space-y-4">
                          {Object.entries(selectedItem).map(([key, value]) => {
                            // Skip certain fields that are handled separately
                            if (['id', 'admin', 'brand', 'creator', 'brief', 'submission', 'title', 'description', 'additionalFields', 'companyName', 'email', 'userName'].includes(key)) return null;
                            
                            // Format values
                            let displayValue = value;
                            let label = key.replace(/([A-Z])/g, ' $1').trim();
                            
                            if (key === 'createdAt' || key === 'updatedAt' || key === 'submittedAt' || key === 'deadline') {
                              displayValue = new Date(value as string).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                            } else if (key === 'reward' || key === 'amount') {
                              displayValue = `$${Number(value).toFixed(2)}`;
                            } else if (typeof value === 'boolean') {
                              displayValue = value ? '✅ Yes' : '❌ No';
                            } else if (key === 'isVerified') {
                              displayValue = value ? '✅ Verified' : '⏳ Pending';
                            } else if (key === 'status') {
                              displayValue = (value as string).charAt(0).toUpperCase() + (value as string).slice(1);
                            } else if (key === 'isPrivate') {
                              label = 'Private Brief';
                              displayValue = value ? '✅ Yes' : '❌ No';
                            }
                            
                            return (
                              <div key={key} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:border-white/30 hover:scale-[1.02]">
                                <div className="text-sm font-medium text-gray-300 mb-2">{label}</div>
                                <div className="text-white font-semibold text-lg">{String(displayValue)}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Additional Information */}
                    <div className="space-y-6">
                      {/* Additional Fields for Briefs */}
                      {selectedItem.additionalFields && (
                        <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-2xl p-6 border border-white/10">
                          <h5 className="text-xl font-semibold text-white mb-6 flex items-center">
                            <img src="/icons/Green_icons/Brief1.png" alt="Requirements" className="w-5 h-5 mr-3" />
                            Additional Requirements
                          </h5>
                          <div className="space-y-4">
                            {(() => {
                              try {
                                const additionalFields = typeof selectedItem.additionalFields === 'string' 
                                  ? JSON.parse(selectedItem.additionalFields) 
                                  : selectedItem.additionalFields;
                                
                                return Object.entries(additionalFields).map(([fieldKey, fieldValue]) => {
                                  if (!fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0)) return null;
                                  
                                  let displayValue = fieldValue;
                                  if (Array.isArray(fieldValue)) {
                                    displayValue = fieldValue.join(', ');
                                  }
                                  
                                  const label = fieldKey.replace(/([A-Z])/g, ' $1').trim();
                                  
                                  return (
                                    <div key={fieldKey} className="bg-white/15 rounded-xl p-4 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02]">
                                      <div className="text-sm font-medium text-gray-300 mb-2">{label}</div>
                                      <div className="text-white font-medium">{String(displayValue)}</div>
                                    </div>
                                  );
                                });
                              } catch (error) {
                                return (
                                  <div className="text-gray-400 text-sm bg-white/10 rounded-xl p-4">
                                    Unable to parse additional fields
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Brand Information for Briefs */}
                      {selectedItem.brand && (
                        <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-2xl p-6 border border-white/10">
                          <h5 className="text-xl font-semibold text-white mb-6 flex items-center">
                            <img src="/icons/profile.png" alt="Brand" className="w-9 h-9 mr-3" />
                            Brand Information
                          </h5>
                          <div className="space-y-4">
                            <div className="bg-white/15 rounded-xl p-4 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02]">
                              <div className="text-sm font-medium text-gray-300 mb-2">Company Name</div>
                              <div className="text-white font-semibold text-lg">{selectedItem.brand.companyName}</div>
                            </div>
                            <div className="bg-white/15 rounded-xl p-4 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02]">
                              <div className="text-sm font-medium text-gray-300 mb-2">Email</div>
                              <div className="text-white font-semibold text-lg">{selectedItem.brand.email}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Creator Information for Submissions */}
                      {selectedItem.creator && (
                        <div className="bg-gradient-to-r from-indigo-900/40 to-blue-900/40 rounded-2xl p-6 border border-white/10">
                          <h5 className="text-xl font-semibold text-white mb-6 flex items-center">
                            <img src="/icons/profile.png" alt="Creator" className="w-9 h-9 mr-3" />
                            Creator Information
                          </h5>
                          <div className="space-y-4">
                            <div className="bg-white/15 rounded-xl p-4 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02]">
                              <div className="text-sm font-medium text-gray-300 mb-2">Username</div>
                              <div className="text-white font-semibold text-lg">{selectedItem.creator.userName}</div>
                            </div>
                            <div className="bg-white/15 rounded-xl p-4 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02]">
                              <div className="text-sm font-medium text-gray-300 mb-2">Full Name</div>
                              <div className="text-white font-semibold text-lg">{selectedItem.creator.fullName}</div>
                            </div>
                            <div className="bg-white/15 rounded-xl p-4 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02]">
                              <div className="text-sm font-medium text-gray-300 mb-2">Email</div>
                              <div className="text-white font-semibold text-lg">{selectedItem.creator.email}</div>
                            </div>
                            <div className="bg-white/15 rounded-xl p-4 hover:bg-white/20 transition-all duration-300 hover:scale-[1.02]">
                              <div className="text-sm font-medium text-gray-300 mb-2">Verification Status</div>
                              <div className="text-white font-semibold text-lg">
                                {selectedItem.creator.isVerified ? '✅ Verified' : '⏳ Pending'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Edit/Create Mode */}
              {(modalType === 'edit' || modalType === 'create') && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-white/10">
                    <h4 className="text-lg font-semibold text-white mb-4">
                                             {modalType === 'create' ? 'Create New' : 'Edit'} {activeTab.slice(0, -1)}
                    </h4>
                    
                    {/* Dynamic Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeTab === 'brands' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                            <input
                              type="text"
                              value={formData.companyName || ''}
                              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                              placeholder="Enter company name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <input
                              type="email"
                              value={formData.email || ''}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                              placeholder="Enter email"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Contact Name</label>
                            <input
                              type="text"
                              value={formData.contactName || ''}
                              onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                              placeholder="Enter contact name"
                            />
                          </div>
                          {modalType === 'create' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                              <input
                                type="password"
                                value={formData.password || ''}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                placeholder="Enter password (min 6 characters)"
                              />
                              <p className="text-xs text-gray-400 mt-1">Password must be at least 6 characters long</p>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Verification Status</label>
                            <select
                              value={formData.isVerified || false}
                              onChange={(e) => setFormData({...formData, isVerified: e.target.value === 'true'})}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            >
                              <option value="false">Pending</option>
                              <option value="true">Verified</option>
                            </select>
                          </div>
                        </>
                      )}
                      
                      {activeTab === 'creators' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                            <input
                              type="text"
                              value={formData.userName || ''}
                              onChange={(e) => setFormData({...formData, userName: e.target.value})}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                              placeholder="Enter username"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                            <input
                              type="text"
                              value={formData.fullName || ''}
                              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                              placeholder="Enter full name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <input
                              type="email"
                              value={formData.email || ''}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                              placeholder="Enter email"
                            />
                          </div>
                          {modalType === 'create' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                              <input
                                type="password"
                                value={formData.password || ''}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                placeholder="Enter password (min 6 characters)"
                              />
                              <p className="text-xs text-gray-400 mt-1">Password must be at least 6 characters long</p>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Verification Status</label>
                            <select
                              value={formData.isVerified || false}
                              onChange={(e) => setFormData({...formData, isVerified: e.target.value === 'true'})}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            >
                              <option value="false">Pending</option>
                              <option value="true">Verified</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-4 mt-6">
                      <button
                        onClick={() => handleSave(activeTab)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        {modalType === 'create' ? 'Create' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => {
                          setShowModal(false);
                          setFormData({});
                          setSelectedItem(null);
                          setIsEditing(false);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}


            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 