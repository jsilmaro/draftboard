import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header with Logo and Theme Toggle */}
      <div className="absolute top-4 left-4 z-10 sm:top-6 sm:left-6">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">DraftBoard</h1>
        </div>
      </div>
      <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 md:mb-8 sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
            Connect Brands with Creators
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed sm:text-lg md:text-xl px-4">
            The ultimate platform for brands to discover talented creators and for creators to showcase their work to amazing brands.
          </p>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 max-w-6xl mx-auto">
          {/* Brand Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 md:p-10 hover:shadow-4xl hover:-translate-y-2 transition-all duration-300 group">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 dark:bg-blue-900/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 sm:text-3xl">For Brands</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed sm:text-base md:text-lg">
                Find talented creators to bring your brand vision to life. Connect with influencers, designers, and content creators.
              </p>
            </div>
            
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm sm:text-base">Company profile with logo</span>
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm sm:text-base">Contact information</span>
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm sm:text-base">Banking verification</span>
              </div>
            </div>

            <Link
              to="/brand/register"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-center block transition-all duration-300 hover:shadow-lg hover:scale-[1.02] text-sm sm:text-base"
            >
              Register as Brand
            </Link>
          </div>

          {/* Creator Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 md:p-10 hover:shadow-4xl hover:-translate-y-2 transition-all duration-300 group">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-50 dark:bg-purple-900/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 sm:text-3xl">For Creators</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed sm:text-base md:text-lg">
                Showcase your talent and connect with amazing brands. Grow your career with exciting opportunities.
              </p>
            </div>
            
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm sm:text-base">Professional profile</span>
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm sm:text-base">Work showcase</span>
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm sm:text-base">Social media integration</span>
              </div>
            </div>

            <Link
              to="/creator/register"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl text-center block transition-all duration-300 hover:shadow-lg hover:scale-[1.02] text-sm sm:text-base"
            >
              Register as Creator
            </Link>
          </div>
        </div>

        <div className="text-center mt-12 sm:mt-16">
          <p className="text-gray-500 text-xs sm:text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
              Sign in here
            </Link>
          </p>
          <div className="mt-3 sm:mt-4">
            <Link 
              to="/admin/login" 
              className="text-xs text-gray-400 hover:text-gray-600 font-mono"
            >
              Admin Access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 