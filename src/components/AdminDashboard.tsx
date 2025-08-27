import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


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
  status: 'active' | 'completed' | 'draft';
  reward: number;
  submissions: number;
  createdAt: string;
}

interface Submission {
  id: string;
  briefId: string;
  briefTitle: string;
  creatorId: string;
  creatorName: string;
  status: 'pending' | 'approved' | 'rejected';
  amount: number;
  submittedAt: string;
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
  };
  creatorId: string;
  creator: {
    fullName: string;
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the authentication token
        const token = localStorage.getItem('token');
        
        if (!token) {
          // No authentication token found
          return;
        }

        // Fetch all data in parallel with authentication headers
        const [brandsRes, creatorsRes, briefsRes, submissionsRes, analyticsRes] = await Promise.all([
          fetch('/api/admin/brands', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('/api/admin/creators', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('/api/admin/briefs', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('/api/admin/submissions', {
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
          setBrands(brandsData.map((brand: ApiBrand) => ({
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
          setCreators(creatorsData.map((creator: ApiCreator) => ({
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
          setBriefs(briefsData.map((brief: ApiBrief) => ({
            id: brief.id,
            title: brief.title,
            brandId: brief.brandId,
            brandName: brief.brand.companyName,
            status: brief.status as 'active' | 'completed' | 'draft',
            reward: brief.reward,
            submissions: brief._count.submissions,
            createdAt: brief.createdAt
          })));
        }

        if (submissionsRes.ok) {
          const submissionsData = await submissionsRes.json();
          setSubmissions(submissionsData.map((submission: ApiSubmission) => ({
            id: submission.id,
            briefId: submission.briefId,
            briefTitle: submission.brief.title,
            creatorId: submission.creatorId,
            creatorName: submission.creator.fullName,
            status: submission.status as 'pending' | 'approved' | 'rejected',
            amount: submission.amount,
            submittedAt: submission.submittedAt
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

    fetchData();
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'brands', label: 'Manage Brands', icon: '🏢' },
    { id: 'creators', label: 'Manage Creators', icon: '👤' },
    { id: 'briefs', label: 'Manage Briefs', icon: '📋' },
    { id: 'submissions', label: 'Submissions', icon: '📝' },
    { id: 'payouts', label: 'Payouts', icon: '💰' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ];

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-gray-900 p-6 rounded-lg shadow-md">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-full">
            <span className="text-2xl">🏢</span>
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
            <span className="text-2xl">👤</span>
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
            <span className="text-2xl">📋</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-300">Available Briefs</p>
            <p className="text-2xl font-bold text-white">{briefs.filter(b => b.status === 'active').length}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded-lg shadow-md">
        <div className="flex items-center">
          <div className="p-3 bg-yellow-100 rounded-full">
            <span className="text-2xl">💰</span>
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
    <div className="bg-gray-900 rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Brand Management</h3>
        <p className="text-sm text-gray-300 mt-1">Overview of registered brands with contact information</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Brand</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
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
                    brand.isVerified ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                  }`}>
                    {brand.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {new Date(brand.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3">View</button>
                  <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCreators = () => (
    <div className="bg-gray-900 rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Creator Management</h3>
        <p className="text-sm text-gray-300 mt-1">Overview of registered creators with contact information</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Creator</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {creators.map((creator) => (
              <tr key={creator.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-300">{creator.userName?.charAt(0)}</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">{creator.fullName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-300">@{creator.userName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {creator.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    creator.isVerified ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                  }`}>
                    {creator.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {new Date(creator.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3">View</button>
                  <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBriefs = () => (
    <div className="bg-gray-900 rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Brief Management</h3>
        <p className="text-sm text-gray-300 mt-1">Manage all campaign briefs</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Brief</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Brand</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reward</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {briefs.map((brief) => (
              <tr key={brief.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{brief.title}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-300">Created {new Date(brief.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{brief.brandName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${brief.reward.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    brief.status === 'active' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                    brief.status === 'completed' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400' :
                    'bg-gray-800 text-gray-800 dark:text-gray-300'
                  }`}>
                    {brief.status.charAt(0).toUpperCase() + brief.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{brief.submissions}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3">View</button>
                  <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSubmissions = () => (
    <div className="bg-gray-900 rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Submission Monitoring</h3>
        <p className="text-sm text-gray-300 mt-1">Track all creator submissions</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Creator</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Brief</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {submissions.map((submission) => (
              <tr key={submission.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{submission.creatorName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{submission.briefTitle}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${submission.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    submission.status === 'approved' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                    submission.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
                    'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                  }`}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3">Review</button>
                  <button className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-3">Approve</button>
                  <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPayouts = () => (
    <div className="bg-gray-900 rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Payout Management</h3>
        <p className="text-sm text-gray-300 mt-1">Track and manage creator payouts</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-green-800 dark:text-green-400">Total Payouts</h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">${analytics.totalPayouts.toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-400">Pending Payouts</h4>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${submissions.filter(s => s.status === 'approved').reduce((sum, s) => sum + s.amount, 0).toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400">This Month</h4>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">${(analytics.monthlyRevenue * 0.7).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Creator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {submissions.filter(s => s.status === 'approved').map((submission) => (
                <tr key={submission.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{submission.creatorName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">${submission.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                      Paid
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-white mb-4">Brief Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Available Briefs</span>
              <span className="text-sm font-medium text-white">{briefs.filter(b => b.status === 'active').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Completed Briefs</span>
              <span className="text-sm font-medium text-white">{briefs.filter(b => b.status === 'completed').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Total Submissions</span>
              <span className="text-sm font-medium text-white">{submissions.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Analytics</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Monthly Revenue</span>
              <span className="text-sm font-medium text-white">${analytics.monthlyRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Total Payouts</span>
              <span className="text-sm font-medium text-white">${analytics.totalPayouts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Platform Fee</span>
              <span className="text-sm font-medium text-white">${(analytics.monthlyRevenue * 0.1).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.totalBrands}</div>
            <div className="text-sm text-gray-300">Total Brands</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.totalCreators}</div>
            <div className="text-sm text-gray-300">Total Creators</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analytics.totalBriefs}</div>
            <div className="text-sm text-gray-300">Total Briefs</div>
          </div>
        </div>
      </div>
    </div>
  );

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
      case 'submissions':
        return renderSubmissions();
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
               <Link to="/" className="text-gray-300 hover:text-white dark:hover:text-white">
                 ← Back to Home
               </Link>
               <button
                 onClick={logout}
                 className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-medium"
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
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-300 dark:hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard; 