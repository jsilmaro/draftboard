/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import WithdrawalManagement from './WithdrawalManagement';
import AdminFinancialDashboard from './AdminFinancialDashboard';
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
  const { isDark } = useTheme();
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
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async (search = '', status = '', page = 1) => {
    try {
      setIsLoading(true);
      // Get the authentication token
      const token = localStorage.getItem('token');
      
      console.log('🔍 Admin Dashboard: Starting data fetch...');
      console.log('🔑 Token exists:', !!token);
      
      if (!token) {
        console.log('❌ No authentication token found');
        setIsLoading(false);
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

      console.log('📊 Brands response status:', brandsRes.status);
      if (brandsRes.ok) {
        const brandsData = await brandsRes.json();
        console.log('📊 Brands data received:', brandsData);
        const brandsArray = brandsData.brands || brandsData || [];
        setBrands(brandsArray.map((brand: ApiBrand) => ({
          id: brand.id,
          email: brand.email,
          type: 'brand' as const,
          companyName: brand.companyName,
          isVerified: brand.isVerified,
          createdAt: brand.createdAt
        })));
      } else {
        console.log('❌ Brands request failed:', brandsRes.status, brandsRes.statusText);
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

      console.log('📈 Analytics response status:', analyticsRes.status);
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        console.log('📈 Analytics data received:', analyticsData);
        setAnalytics({
          totalBrands: analyticsData.totalBrands,
          totalCreators: analyticsData.totalCreators,
          totalBriefs: analyticsData.totalBriefs,
          totalSubmissions: analyticsData.totalSubmissions,
          totalPayouts: analyticsData.totalPayouts,
          monthlyRevenue: analyticsData.monthlyRevenue
        });
      } else {
        console.log('❌ Analytics request failed:', analyticsRes.status, analyticsRes.statusText);
      }
    } catch (error) {
      console.error('❌ Error fetching admin data:', error);
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
    } finally {
      setIsLoading(false);
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
    { id: 'financial', label: 'Financial Dashboard', icon: '/icons/Green_icons/MoneyBag1.png' },
    { id: 'analytics', label: 'Analytics', icon: '/icons/Green_icons/Statistic1.png' },
  ];

  const renderOverview = () => {
    console.log('📊 Rendering overview with data:', {
      brands: brands.length,
      creators: creators.length,
      briefs: briefs.length,
      submissions: submissions.length,
      analytics,
      isLoading
    });
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading dashboard data...</p>
          </div>
        </div>
      );
    }
    
    return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-xl border shadow-sm`}>
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl">
            <img src="/icons/profile.png" alt="Brands" className="w-8 h-8" />
          </div>
          <div className="ml-4">
            <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Total Brands</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{analytics.totalBrands}</p>
          </div>
        </div>
      </div>

      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-xl border shadow-sm`}>
        <div className="flex items-center">
          <div className="p-3 bg-green-100 dark:bg-green-500/20 rounded-xl">
            <img src="/icons/profile.png" alt="Creators" className="w-8 h-8" />
          </div>
          <div className="ml-4">
            <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Total Creators</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{analytics.totalCreators}</p>
          </div>
        </div>
      </div>

      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-xl border shadow-sm`}>
        <div className="flex items-center">
          <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-xl">
            <img src="/icons/Green_icons/Brief1.png" alt="Briefs" className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Available Briefs</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{briefs.filter(b => b.status === 'published').length}</p>
          </div>
        </div>
      </div>

      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-xl border shadow-sm`}>
        <div className="flex items-center">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-500/20 rounded-xl">
            <img src="/icons/Green_icons/MoneyBag1.png" alt="Payouts" className="w-8 h-8" />
          </div>
          <div className="ml-4">
            <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Monthly Revenue</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>${analytics.monthlyRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderBrands = () => (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Brand Management</h3>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Overview of registered brands with contact information</p>
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
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => handleFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Brand</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Email</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Status</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Joined</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`${isDark ? 'bg-gray-900/10' : 'bg-white'} divide-y ${isDark ? 'divide-gray-700/30' : 'divide-gray-200'}`}>
            {brands.map((brand) => (
              <tr key={brand.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full flex items-center justify-center`}>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{brand.companyName?.charAt(0)}</span>
                    </div>
                    <div className="ml-4">
                      <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{brand.companyName}</div>
                    </div>
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {brand.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    brand.isVerified ? 'bg-green-900/20 text-green-400' : 'bg-yellow-900/20 text-yellow-400'
                  }`}>
                    {brand.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
      <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Creator Management</h3>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Overview of registered creators with contact information</p>
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
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => handleFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Creator</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Email</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Status</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Joined</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`${isDark ? 'bg-gray-900/10' : 'bg-white'} divide-y ${isDark ? 'divide-gray-700/30' : 'divide-gray-200'}`}>
            {creators.map((creator) => (
              <tr key={creator.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full flex items-center justify-center`}>
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{creator.userName?.charAt(0)}</span>
                    </div>
                    <div className="ml-4">
                      <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{creator.fullName}</div>
                      <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>@{creator.userName}</div>
                    </div>
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {creator.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    creator.isVerified ? 'bg-green-900/20 text-green-400' : 'bg-yellow-900/20 text-yellow-400'
                  }`}>
                    {creator.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
      <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Brief Management</h3>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Manage all campaign briefs</p>
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
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => handleFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Brief</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Brand</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Reward</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Status</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Submissions</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`${isDark ? 'bg-gray-900/10' : 'bg-white'} divide-y ${isDark ? 'divide-gray-700/30' : 'divide-gray-200'}`}>
            {briefs.map((brief) => (
              <tr key={brief.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{brief.title}</div>
                  <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Created {new Date(brief.createdAt).toLocaleDateString()}</div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{brief.brandName}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>${brief.reward.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    brief.status === 'published' ? 'bg-green-900/20 text-green-400' :
                    brief.status === 'archived' ? 'bg-blue-900/20 text-blue-400' :
                    'bg-gray-800 text-gray-300'
                  }`}>
                    {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{brief.submissions}</td>
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
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Archived Briefs</h3>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Briefs that have exceeded their deadline and been automatically archived</p>
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
                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>
        </div>
        
        {archivedBriefs.length === 0 ? (
          <div className="text-center py-12">
            <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-4xl mb-4`}>📁</div>
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>No Archived Briefs</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Briefs that exceed their deadline will be automatically archived here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Brief</th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Brand</th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Reward</th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Deadline</th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Archived</th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Submissions</th>
                  <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`${isDark ? 'bg-gray-900/10' : 'bg-white'} divide-y ${isDark ? 'divide-gray-700/30' : 'divide-gray-200'}`}>
                {archivedBriefs.map((brief) => (
                  <tr key={brief.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{brief.title}</div>
                      <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Created {new Date(brief.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{brief.brandName}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>${brief.reward.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-400">
                      {brief.deadline ? new Date(brief.deadline).toLocaleDateString() : 'No deadline'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {brief.archivedAt ? new Date(brief.archivedAt).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{brief.submissions}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleView(brief, 'briefs')}
                        className={`px-3 py-1 rounded-md transition-colors duration-200 mr-2 ${
                          isDark 
                            ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                        }`}
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
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
      <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Submission Monitoring</h3>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Track all creator submissions</p>
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
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => handleFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Brief</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Creator</th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Amount</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Status</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Submitted</th>
              <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`${isDark ? 'bg-gray-900/10' : 'bg-white'} divide-y ${isDark ? 'divide-gray-700/30' : 'divide-gray-200'}`}>
            {submissions.map((submission) => (
              <tr key={submission.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{submission.briefTitle}</div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{submission.creatorName}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>${submission.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    submission.status === 'approved' ? 'bg-green-900/20 text-green-400' :
                    submission.status === 'rejected' ? 'bg-red-900/20 text-red-400' :
                    'bg-yellow-900/20 text-yellow-400'
                  }`}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
      <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Payout Management</h3>
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Track and manage creator payouts</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-emerald-900/20 border-emerald-800/30' : 'bg-emerald-50 border-emerald-200'}`}>
            <h4 className={`text-lg font-semibold ${isDark ? 'text-emerald-500' : 'text-emerald-700'}`}>Total Payouts</h4>
            <p className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>${analytics.totalPayouts.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-blue-900/20 border-blue-800/30' : 'bg-blue-50 border-blue-200'}`}>
            <h4 className={`text-lg font-semibold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>Pending Payouts</h4>
            <p className={`text-2xl font-bold ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>${submissions.filter(s => s.status === 'approved').reduce((sum, s) => sum + s.amount, 0).toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-yellow-900/20 border-yellow-800/30' : 'bg-yellow-50 border-yellow-200'}`}>
            <h4 className={`text-lg font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>This Month</h4>
            <p className={`text-2xl font-bold ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`}>${(analytics.monthlyRevenue * 0.7).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Creator</th>
                <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Amount</th>
                <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Status</th>
                <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Date</th>
                <th className={`px-6 py-3 text-left text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-700'} uppercase tracking-wider`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`${isDark ? 'bg-gray-900/10' : 'bg-white'} divide-y ${isDark ? 'divide-gray-700/30' : 'divide-gray-200'}`}>
              {submissions.filter(s => s.status === 'approved').map((submission) => (
                <tr key={submission.id}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{submission.creatorName}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>${submission.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-emerald-900/20 text-emerald-500">
                      Paid
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
          <div className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-6 rounded-lg border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>Total Brands</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{analytics.totalBrands}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <img src="/icons/profile.png" alt="Brands" className="w-10 h-10" />
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-6 rounded-lg border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-600'}`}>Total Creators</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>{analytics.totalCreators}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <img src="/icons/profile.png" alt="Creators" className="w-10 h-10" />
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-6 rounded-lg border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>Total Briefs</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{analytics.totalBriefs}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <img src="/icons/Green_icons/Brief1.png" alt="Briefs" className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-6 rounded-lg border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`}>Monthly Revenue</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>${analytics.monthlyRevenue.toLocaleString()}</p>
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
          <div className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-6 rounded-lg border`}>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Submission Status Distribution</h3>
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
                        color: isDark ? 'white' : '#374151',
                        padding: 20
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Brief Status Chart */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-6 rounded-lg border`}>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Brief Status Distribution</h3>
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
                        color: isDark ? 'white' : '#374151',
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
        <div className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-6 rounded-lg border`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Revenue Trend (Last 12 Months)</h3>
          <div className="h-80">
            <Line 
              data={revenueData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: {
                      color: isDark ? 'white' : '#374151'
                    }
                  }
                },
                scales: {
                  x: {
                    ticks: { color: isDark ? 'white' : '#374151' },
                    grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
                  },
                  y: {
                    ticks: { color: isDark ? 'white' : '#374151' },
                    grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* User Growth Chart */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-6 rounded-lg border`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>User Growth Trend</h3>
          <div className="h-80">
            <Line 
              data={userGrowthData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    labels: {
                      color: isDark ? 'white' : '#374151'
                    }
                  }
                },
                scales: {
                  x: {
                    ticks: { color: isDark ? 'white' : '#374151' },
                    grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
                  },
                  y: {
                    ticks: { color: isDark ? 'white' : '#374151' },
                    grid: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-6 rounded-lg border`}>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Brief Performance</h3>
            <div className="space-y-4">
              <div className={`flex justify-between items-center p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Available Briefs</span>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} bg-blue-500/20 px-3 py-1 rounded-full`}>
                  {briefs.filter(b => b.status === 'published').length}
                </span>
              </div>
              <div className={`flex justify-between items-center p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Archived Briefs</span>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} bg-green-500/20 px-3 py-1 rounded-full`}>
                  {briefs.filter(b => b.status === 'archived').length}
                </span>
              </div>
              <div className={`flex justify-between items-center p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Total Submissions</span>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} bg-purple-500/20 px-3 py-1 rounded-full`}>
                  {submissions.length}
                </span>
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-6 rounded-lg border`}>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Financial Overview</h3>
            <div className="space-y-4">
              <div className={`flex justify-between items-center p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Total Payouts</span>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} bg-green-500/20 px-3 py-1 rounded-full`}>
                  ${analytics.totalPayouts.toLocaleString()}
                </span>
              </div>
              <div className={`flex justify-between items-center p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Platform Fee (10%)</span>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} bg-yellow-500/20 px-3 py-1 rounded-full`}>
                  ${(analytics.monthlyRevenue * 0.1).toLocaleString()}
                </span>
              </div>
              <div className={`flex justify-between items-center p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Net Revenue</span>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} bg-blue-500/20 px-3 py-1 rounded-full`}>
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
      case 'financial':
        return <AdminFinancialDashboard />;
      case 'analytics':
        return renderAnalytics();
      default:
        return renderOverview();
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex`}>
      {/* Sidebar */}
      <div className={`${isDark ? 'bg-gray-900/95 backdrop-blur-xl border-gray-800' : 'bg-white/95 backdrop-blur-xl border-gray-200'} border-r w-64 min-h-screen fixed left-0 top-0 z-40 flex flex-col overflow-y-auto transition-all duration-300 shadow-xl`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Admin Panel</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>System Management</p>
          </div>
        </div>
      </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm transition-all duration-300 group ${
                  activeTab === tab.id
                  ? isDark
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : isDark
                    ? 'text-gray-400 hover:bg-gray-800/50 hover:text-white hover:shadow-md'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
              }`}
            >
              <img src={tab.icon} alt={tab.label} className="w-5 h-5 mr-3" />
              <span className="font-medium">{tab.label}</span>
              </button>
            ))}
        </div>

        {/* Account Navigation */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b sticky top-0 z-30`}>
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {tabs.find(tab => tab.id === activeTab)?.label || 'Admin Dashboard'}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <ThemeToggle size="md" />
                <Link to="/" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>

            {/* Enhanced Modal System for CRUD Operations */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} rounded-lg border shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden`}>
            {/* Modal Header */}
            <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border-b px-6 py-4 rounded-t-lg`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-lg">
                      {modalType === 'view' ? '👁️' : 
                       modalType === 'edit' ? '✏️' : 
                       modalType === 'create' ? '➕' : '🗑️'}
                    </span>
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {modalType === 'view' ? 'View Details' : 
                       modalType === 'edit' ? 'Edit Item' : 
                       modalType === 'create' ? 'Create New' : 'Confirm Delete'}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
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
                  className={`w-8 h-8 ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'} rounded-lg flex items-center justify-center hover:text-white transition-all duration-200`}
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
                  <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg p-8 border`}>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
                        <img src="/icons/profile.png" alt="Brand" className="w-12 h-12" />
                      </div>
                      <div>
                        <h4 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                          {selectedItem.companyName || selectedItem.title || selectedItem.userName || 'Item Details'}
                        </h4>
                        <p className={`text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {selectedItem.email || selectedItem.description || 'Detailed Information'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Basic Information */}
                    <div className="space-y-6">
                      <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg p-6 border`}>
                        <h5 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
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
                              <div key={key} className={`${isDark ? 'bg-gray-600 border-gray-500 hover:bg-gray-500' : 'bg-white border-gray-200 hover:bg-gray-50'} rounded-lg p-4 border transition-all duration-300`}>
                                <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>{label}</div>
                                <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold text-lg`}>{String(displayValue)}</div>
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
                        <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg p-6 border`}>
                          <h5 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
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
                                    <div key={fieldKey} className={`${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-50 border border-gray-200'} rounded-lg p-4 transition-all duration-300`}>
                                      <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>{label}</div>
                                      <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{String(displayValue)}</div>
                                    </div>
                                  );
                                });
                              } catch (error) {
                                return (
                                  <div className="text-gray-400 text-sm bg-gray-600 rounded-lg p-4">
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
                        <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg p-6 border`}>
                          <h5 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
                            <img src="/icons/profile.png" alt="Brand" className="w-9 h-9 mr-3" />
                            Brand Information
                          </h5>
                          <div className="space-y-4">
                            <div className={`${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-50 border border-gray-200'} rounded-lg p-4 transition-all duration-300`}>
                              <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Company Name</div>
                              <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold text-lg`}>{selectedItem.brand.companyName}</div>
                            </div>
                            <div className={`${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-50 border border-gray-200'} rounded-lg p-4 transition-all duration-300`}>
                              <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Email</div>
                              <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold text-lg`}>{selectedItem.brand.email}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Creator Information for Submissions */}
                      {selectedItem.creator && (
                        <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg p-6 border`}>
                          <h5 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
                            <img src="/icons/profile.png" alt="Creator" className="w-9 h-9 mr-3" />
                            Creator Information
                          </h5>
                          <div className="space-y-4">
                            <div className={`${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-50 border border-gray-200'} rounded-lg p-4 transition-all duration-300`}>
                              <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Username</div>
                              <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold text-lg`}>{selectedItem.creator.userName}</div>
                            </div>
                            <div className={`${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-50 border border-gray-200'} rounded-lg p-4 transition-all duration-300`}>
                              <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Full Name</div>
                              <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold text-lg`}>{selectedItem.creator.fullName}</div>
                            </div>
                            <div className={`${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-50 border border-gray-200'} rounded-lg p-4 transition-all duration-300`}>
                              <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Email</div>
                              <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold text-lg`}>{selectedItem.creator.email}</div>
                            </div>
                            <div className={`${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-50 border border-gray-200'} rounded-lg p-4 transition-all duration-300`}>
                              <div className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Verification Status</div>
                              <div className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold text-lg`}>
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
                  <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} rounded-lg p-6 border`}>
                    <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
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
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
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
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
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