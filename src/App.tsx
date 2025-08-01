import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import BrandForm from './components/BrandForm'
import CreatorForm from './components/CreatorForm'
import BrandDashboard from './components/BrandDashboard'
import CreatorDashboard from './components/CreatorDashboard'
import LoginForm from './components/LoginForm'
import AdminDashboard from './components/AdminDashboard'
import CreateBrief from './components/CreateBrief'
import LoadingSpinner from './components/LoadingSpinner'
import { AuthProvider } from './contexts/AuthContext'

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" color="blue" text="Loading your dashboard..." />
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 animate-fade-in">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/brand/register" element={<BrandForm />} />
          <Route path="/creator/register" element={<CreatorForm />} />
          <Route path="/brand/dashboard" element={<BrandDashboard />} />
          <Route path="/creator/dashboard" element={<CreatorDashboard />} />
          <Route path="/brand/create-brief" element={<CreateBrief />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App 