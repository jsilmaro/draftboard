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
import ProtectedRoute from './components/ProtectedRoute'
import GoogleOAuthTest from './components/GoogleOAuthTest'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  // Replace with your actual Google OAuth Client ID
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id';

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 animate-fade-in">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredUserType="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/brand/register" element={<BrandForm />} />
            <Route path="/creator/register" element={<CreatorForm />} />
            <Route path="/test-oauth" element={<GoogleOAuthTest />} />
            <Route 
              path="/brand/dashboard" 
              element={
                <ProtectedRoute requiredUserType="brand">
                  <BrandDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/creator/dashboard" 
              element={
                <ProtectedRoute requiredUserType="creator">
                  <CreatorDashboard />
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
          </Routes>
        </div>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App 