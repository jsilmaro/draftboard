
import { Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import LandingPage from './components/LandingPage'
import BrandForm from './components/BrandForm'
import CreatorForm from './components/CreatorForm'
import BrandDashboard from './components/BrandDashboard'
import CreatorDashboard from './components/CreatorDashboard'
import LoginForm from './components/LoginForm'
import AdminDashboard from './components/AdminDashboard'
import AdminLogin from './components/AdminLogin'
import CreateBrief from './components/CreateBrief'
import PublicBrandBriefs from './components/PublicBrandBriefs'
// RewardsPaymentPage removed - replaced with Stripe Connect functionality in BrandDashboard
import PaymentSuccess from './components/PaymentSuccess'
import PaymentCancel from './components/PaymentCancel'
import BriefFundingSuccess from './components/BriefFundingSuccess'
import RewardManagementPage from './components/RewardManagementPage'

import ProtectedRoute from './components/ProtectedRoute'
import CreatorWallet from './components/CreatorWallet'
import Marketplace from './components/Marketplace'
import PublicBriefDetails from './components/PublicBriefDetails'
import ApplyToBriefPage from './pages/ApplyToBriefPage'
// ReviewSubmissionsPage removed - now integrated into ManageRewardsPayments
import CommunityPage from './components/CommunityPage'
import EventsPage from './components/EventsPage'
import SuccessStoriesPage from './components/SuccessStoriesPage'
import MessagingSystem from './components/MessagingSystem'
import NotificationsPage from './pages/NotificationsPage'
import NotificationDetailPage from './pages/NotificationDetailPage'
import StripeConnectTestPage from './pages/StripeConnectTestPage'
import StripeSuccessPage from './components/StripeSuccessPage'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { StripeProvider } from './components/StripeProvider'


function App() {
  // Replace with your actual Google OAuth Client ID
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id';

  return (
    <GoogleOAuthProvider 
      clientId={GOOGLE_CLIENT_ID}
      onScriptLoadError={() => {
        // Google OAuth script load error - continuing without OAuth
      }}
    >
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <StripeProvider>
              <div className="min-h-screen bg-background text-foreground animate-fade-in transition-colors duration-300 overflow-x-hidden">
              <Routes>
              {/* Public Marketplace Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/brief/:briefId" element={<PublicBriefDetails />} />
              <Route path="/brief/:briefId/apply" element={<ApplyToBriefPage />} />
              <Route path="/brand/:brandId/briefs" element={<PublicBrandBriefs />} />
              
              {/* Public Community Routes */}
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/success-stories" element={<SuccessStoriesPage />} />
              <Route path="/messages" element={<MessagingSystem />} />
              
              {/* Authentication Routes */}
              <Route path="/login" element={<LoginForm />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/brand/register" element={<BrandForm />} />
              <Route path="/creator/register" element={<CreatorForm />} />

              {/* Protected Brand Routes */}
              <Route 
                path="/brand/dashboard" 
                element={
                  <ProtectedRoute requiredUserType="brand">
                    <BrandDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/brand/create-brief" 
                element={
                  <ProtectedRoute requiredUserType="brand">
                    <CreateBrief />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/brand/reward-management" 
                element={
                  <ProtectedRoute requiredUserType="brand">
                    <RewardManagementPage />
                  </ProtectedRoute>
                } 
              />
              {/* Review Submissions route removed - now integrated into Manage Rewards & Payments */}
              {/* Old rewards-payments route removed - now handled by Stripe Connect in BrandDashboard */}

              {/* Protected Creator Routes */}
              <Route 
                path="/creator/dashboard" 
                element={
                  <ProtectedRoute requiredUserType="creator">
                    <CreatorDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/creator/wallet" 
                element={
                  <ProtectedRoute requiredUserType="creator">
                    <CreatorWallet />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute requiredUserType="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Payment Routes */}
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancel" element={<PaymentCancel />} />
              <Route path="/briefs/:briefId/funding/success" element={<BriefFundingSuccess />} />
              <Route path="/briefs/:briefId/funding/cancel" element={<PaymentCancel />} />
              
              {/* Stripe Success Routes */}
              <Route path="/dashboard" element={<StripeSuccessPage />} />

              {/* Notification Routes */}
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/notifications/:id" 
                element={
                  <ProtectedRoute>
                    <NotificationDetailPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Stripe Connect Test Route */}
              <Route 
                path="/stripe-connect-test" 
                element={
                  <ProtectedRoute>
                    <StripeConnectTestPage />
                  </ProtectedRoute>
                } 
              />


            </Routes>
            </div>
          </StripeProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
    </GoogleOAuthProvider>
  )
}

export default App 