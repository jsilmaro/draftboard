import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);



  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Moving Neon Green Background */}
      <div className="absolute inset-0">
        {/* Primary moving neon green wave with subtle purple/pink accents */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 255, 127, 0.6) 0%, rgba(147, 51, 234, 0.2) 30%, rgba(236, 72, 153, 0.1) 60%, transparent 70%)`,
            transition: 'all 0.3s ease-out'
          }}
        ></div>
        
        {/* Animated wave beams with subtle color variations */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 left-1/4 w-96 h-2 bg-gradient-to-b from-transparent via-green-400 to-transparent animate-pulse opacity-60 animate-bounce"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-2 bg-gradient-to-b from-transparent via-purple-400 to-transparent animate-pulse opacity-40 delay-1000 animate-bounce"></div>
          <div className="absolute top-2/3 left-1/3 w-80 h-2 bg-gradient-to-b from-transparent via-pink-400 to-transparent animate-pulse opacity-50 delay-2000 animate-bounce"></div>
        </div>

        {/* Diagonal wave beam with subtle gradient */}
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-gradient-to-tl from-green-500/20 via-purple-500/15 via-pink-500/10 to-transparent blur-3xl animate-pulse animate-bounce"></div>
        
        {/* Moving Bubbles with subtle color variations */}
        <div className="absolute top-1/4 right-1/4 w-6 h-6 bg-green-400 rounded-full animate-bounce opacity-60 shadow-lg shadow-green-400/50" style={{animation: 'float 6s ease-in-out infinite'}}></div>
        <div className="absolute bottom-1/3 left-1/4 w-4 h-4 bg-purple-400 rounded-full animate-bounce opacity-50 delay-1000 shadow-lg shadow-purple-400/40" style={{animation: 'float 8s ease-in-out infinite 1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-pink-400 rounded-full animate-bounce opacity-50 delay-2000 shadow-lg shadow-pink-400/40" style={{animation: 'float 7s ease-in-out infinite 2s'}}></div>
        <div className="absolute top-1/6 right-1/3 w-5 h-5 bg-green-400 rounded-full animate-bounce opacity-60 delay-3000 shadow-lg shadow-green-400/50" style={{animation: 'float 9s ease-in-out infinite 3s'}}></div>
        <div className="absolute bottom-1/4 right-1/6 w-4 h-4 bg-purple-400 rounded-full animate-bounce opacity-50 delay-4000 shadow-lg shadow-purple-400/40" style={{animation: 'float 5s ease-in-out infinite 4s'}}></div>
        <div className="absolute top-3/4 left-1/6 w-3 h-3 bg-pink-400 rounded-full animate-bounce opacity-50 delay-5000 shadow-lg shadow-pink-400/40" style={{animation: 'float 6.5s ease-in-out infinite 5s'}}></div>

        {/* Moving Brief Cards in Background */}
        <div className="absolute top-1/5 left-0 w-64 h-32 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-400/30 rounded-lg p-4 transform -rotate-12 opacity-20 animate-pulse" style={{
          animation: 'slideRight 20s linear infinite',
          transform: 'translateX(-100%) rotate(-12deg)',
          animationFillMode: 'forwards'
        }}>
          <div className="text-green-400 text-xs font-semibold mb-2">Tech Review Campaign</div>
          <div className="text-white text-xs mb-1">Create viral tech reviews</div>
          <div className="text-green-400 text-xs">$500 - $2,000</div>
        </div>
        
        <div className="absolute top-2/3 right-0 w-64 h-32 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-400/30 rounded-lg p-4 transform rotate-12 opacity-20 animate-pulse" style={{
          animation: 'slideLeft 25s linear infinite',
          transform: 'translateX(100%) rotate(12deg)',
          animationFillMode: 'forwards'
        }}>
          <div className="text-green-400 text-xs font-semibold mb-2">Fashion Influencer</div>
          <div className="text-white text-xs mb-1">Style & share trends</div>
          <div className="text-green-400 text-xs">$300 - $1,500</div>
        </div>
        
        <div className="absolute bottom-1/4 left-1/4 w-64 h-32 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-green-400/30 rounded-lg p-4 transform -rotate-6 opacity-20 animate-pulse" style={{
          animation: 'slideUp 30s linear infinite',
          transform: 'translateY(100%) rotate(-6deg)',
          animationFillMode: 'forwards'
        }}>
          <div className="text-green-400 text-xs font-semibold mb-2">Fitness Content</div>
          <div className="text-white text-xs mb-1">Workout challenges</div>
          <div className="text-green-400 text-xs">$400 - $1,800</div>
        </div>

        {/* Moving Media Content - TikTok/Video Posts */}
        <div className="absolute top-1/6 left-1/6 w-48 h-64 bg-gradient-to-b from-gray-900/90 to-gray-800/90 backdrop-blur-sm border border-green-400/30 rounded-lg p-3 transform rotate-6 opacity-15" style={{
          animation: 'slideDiagonal 35s linear infinite',
          transform: 'translateX(-100%) translateY(-100%) rotate(6deg)',
          animationFillMode: 'forwards'
        }}>
          <div className="w-full h-32 bg-gradient-to-br from-green-400/20 to-purple-400/20 rounded-md mb-2 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="text-green-400 text-xs font-semibold mb-1">@techcreator</div>
          <div className="text-white text-xs mb-1">AI Gadget Review</div>
          <div className="text-green-400 text-xs">2.1M views</div>
        </div>

        <div className="absolute top-3/4 right-1/6 w-48 h-64 bg-gradient-to-b from-gray-900/90 to-gray-800/90 backdrop-blur-sm border border-purple-400/30 rounded-lg p-3 transform -rotate-8 opacity-15" style={{
          animation: 'slideDiagonalReverse 40s linear infinite',
          transform: 'translateX(100%) translateY(100%) rotate(-8deg)',
          animationFillMode: 'forwards'
        }}>
          <div className="w-full h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-md mb-2 flex items-center justify-center">
            <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="text-purple-400 text-xs font-semibold mb-1">@fashionista</div>
          <div className="text-white text-xs mb-1">Style Transformation</div>
          <div className="text-purple-400 text-xs">1.8M views</div>
        </div>

        <div className="absolute top-1/3 left-3/4 w-48 h-64 bg-gradient-to-b from-gray-900/90 to-gray-800/90 backdrop-blur-sm border border-pink-400/30 rounded-lg p-3 transform rotate-12 opacity-15" style={{
          animation: 'slideUpDiagonal 45s linear infinite',
          transform: 'translateY(100%) translateX(50%) rotate(12deg)',
          animationFillMode: 'forwards'
        }}>
          <div className="w-full h-32 bg-gradient-to-br from-pink-400/20 to-green-400/20 rounded-md mb-2 flex items-center justify-center">
            <svg className="w-8 h-8 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="text-pink-400 text-xs font-semibold mb-1">@fitnessguru</div>
          <div className="text-white text-xs mb-1">Workout Challenge</div>
          <div className="text-pink-400 text-xs">3.2M views</div>
        </div>

        {/* Subtle starry grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0, 255, 127, 0.3) 1px, transparent 0), radial-gradient(circle at 25px 25px, rgba(147, 51, 234, 0.2) 1px, transparent 0), radial-gradient(circle at 50px 50px, rgba(236, 72, 153, 0.15) 1px, transparent 0)`,
            backgroundSize: '50px 50px, 75px 75px, 100px 100px'
          }}></div>
        </div>

        {/* CSS Animations for moving cards */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes slideRight {
              0% { transform: translateX(-100%) rotate(-12deg); }
              100% { transform: translateX(calc(100vw + 100%)) rotate(-12deg); }
            }
            @keyframes slideLeft {
              0% { transform: translateX(calc(100vw + 100%)) rotate(12deg); }
              100% { transform: translateX(-100%) rotate(12deg); }
            }
            @keyframes slideUp {
              0% { transform: translateY(calc(100vh + 100%)) rotate(-6deg); }
              100% { transform: translateY(-100%) rotate(-6deg); }
            }
            @keyframes slideDiagonal {
              0% { transform: translateX(-100%) translateY(-100%) rotate(6deg); }
              100% { transform: translateX(calc(100vw + 100%)) translateY(calc(100vh + 100%)) rotate(6deg); }
            }
            @keyframes slideDiagonalReverse {
              0% { transform: translateX(100%) translateY(100%) rotate(-8deg); }
              100% { transform: translateX(-100%) translateY(-100%) rotate(-8deg); }
            }
            @keyframes slideUpDiagonal {
              0% { transform: translateY(100%) translateX(50%) rotate(12deg); }
              100% { transform: translateY(-100%) translateX(-50%) rotate(12deg); }
            }
            @keyframes float {
              0%, 100% { transform: translateY(0px) translateX(0px); }
              25% { transform: translateY(-20px) translateX(10px); }
              50% { transform: translateY(-40px) translateX(-5px); }
              75% { transform: translateY(-20px) translateX(-10px); }
            }
          `
        }} />
        
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center">
          <div className="flex items-center justify-center p-1">
            <img 
              src="/logo-light2.svg" 
              alt="DraftBoard Logo" 
              className="w-28 h-14 object-contain object-center drop-shadow-2xl"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(0, 255, 127, 0.8))'
              }}
            />
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex items-center space-x-8">
          <Link to="/login" className="text-white hover:text-green-400 transition-colors duration-300">
            Sign In
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 sm:px-8 pt-20 pb-16">
        {/* Hero Section */}
        <div className={`text-center max-w-4xl mx-auto mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Animated Tagline */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-purple-400 rounded-full mr-3 shadow-lg shadow-green-400/70 animate-pulse"></div>
            <p className="text-green-400 text-sm font-medium drop-shadow-lg">
              Connecting brands with talented creators worldwide
            </p>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight drop-shadow-2xl">
            Choose Your
            <span className="block bg-gradient-to-r from-green-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">Path</span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
            Join DraftBoard and connect with amazing opportunities. Are you a brand looking for creators, or a creator looking for brands?
          </p>
        </div>

        {/* Enhanced Registration Cards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {/* Enhanced Brand Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-blue-500/10 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative bg-gradient-to-br from-gray-900/90 via-gray-800/95 to-gray-900/90 backdrop-blur-xl border border-green-500/30 rounded-3xl p-8 hover:border-green-400/50 transition-all duration-500 hover:scale-[1.02] shadow-2xl shadow-green-500/10 group-hover:shadow-green-400/20 overflow-hidden">
              {/* Water-like reflection effect */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-green-400/10 to-transparent animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-blue-400/20 to-transparent rounded-full blur-xl"></div>
              </div>
              
              <div className="relative z-10 text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-green-500/20">
                  <svg className="w-10 h-10 text-green-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">For Brands</h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Find talented creators to bring your brand vision to life. Connect with influencers, designers, and content creators.
                </p>
              </div>
              
              <div className="relative z-10 space-y-4 mb-8">
                <div className="flex items-center text-gray-300 group/item">
                  <div className="w-6 h-6 bg-green-500/30 rounded-full flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:scale-110 transition-transform shadow-md shadow-green-500/20">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-base">Company profile with logo</span>
                </div>
                <div className="flex items-center text-gray-300 group/item">
                  <div className="w-6 h-6 bg-green-500/30 rounded-full flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:scale-110 transition-transform shadow-md shadow-green-500/20">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-base">Contact information</span>
                </div>
                <div className="flex items-center text-gray-300 group/item">
                  <div className="w-6 h-6 bg-green-500/30 rounded-full flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:scale-110 transition-transform shadow-md shadow-green-500/20">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-base">Banking verification</span>
                </div>
              </div>

              <Link
                to="/brand/register"
                className="relative z-10 w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black font-bold py-4 px-6 rounded-xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/50 text-center block shadow-lg shadow-green-500/20"
              >
                Register as Brand
              </Link>
            </div>
          </div>

          {/* Enhanced Creator Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-purple-500/10 to-pink-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative bg-gradient-to-br from-gray-900/90 via-gray-800/95 to-gray-900/90 backdrop-blur-xl border border-green-500/30 rounded-3xl p-8 hover:border-green-400/50 transition-all duration-500 hover:scale-[1.02] shadow-2xl shadow-green-500/10 group-hover:shadow-green-400/20 overflow-hidden">
              {/* Water-like reflection effect */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-purple-400/10 to-transparent animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-pink-400/20 to-transparent rounded-full blur-xl"></div>
              </div>
              
              <div className="relative z-10 text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-green-500/20">
                  <svg className="w-10 h-10 text-green-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">For Creators</h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Showcase your talent and connect with amazing brands. Grow your career with exciting opportunities.
                </p>
              </div>
              
              <div className="relative z-10 space-y-4 mb-8">
                <div className="flex items-center text-gray-300 group/item">
                  <div className="w-6 h-6 bg-green-500/30 rounded-full flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:scale-110 transition-transform shadow-md shadow-green-500/20">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-base">Professional profile</span>
                </div>
                <div className="flex items-center text-gray-300 group/item">
                  <div className="w-6 h-6 bg-green-500/30 rounded-full flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:scale-110 transition-transform shadow-md shadow-green-500/20">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-base">Work showcase</span>
                </div>
                <div className="flex items-center text-gray-300 group/item">
                  <div className="w-6 h-6 bg-green-500/30 rounded-full flex items-center justify-center mr-4 flex-shrink-0 group-hover/item:scale-110 transition-transform shadow-md shadow-green-500/20">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-base">Social media integration</span>
                </div>
              </div>

              <Link
                to="/creator/register"
                className="relative z-10 w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/50 text-center block shadow-lg shadow-green-500/20"
              >
                Register as Creator
              </Link>
            </div>
          </div>
        </div>

        {/* Sign In Section */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900/80 via-gray-800/90 to-gray-900/80 backdrop-blur-sm border border-green-500/30 rounded-2xl p-8 shadow-2xl shadow-green-500/10">
            <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">Already have an account?</h3>
            <p className="text-gray-300 mb-6">
              Sign in to access your dashboard and continue your journey
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                to="/login"
                className="bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 hover:scale-105 border border-green-500/50 hover:border-green-400/50 shadow-lg shadow-green-500/20"
              >
                Sign In
              </Link>
              <Link 
                to="/admin/login" 
                className="text-gray-400 hover:text-green-400 transition-colors text-sm font-mono drop-shadow-lg"
              >
                Admin Access
              </Link>
            </div>
          </div>
        </div>

        {/* Animated Bottom Wave */}
        <div className="relative h-32 max-w-4xl mx-auto mt-16">
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-green-500 via-purple-500 to-pink-500 animate-pulse rounded-full shadow-lg shadow-green-500/30"></div>
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-40 h-2 bg-gradient-to-r from-green-500 via-purple-500 to-pink-500 rounded-full animate-pulse shadow-lg shadow-green-500/30"></div>
          <div className="absolute bottom-12 left-1/4 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse shadow-lg shadow-purple-500/30"></div>
          <div className="absolute bottom-12 right-1/4 transform translate-x-1/2 w-20 h-1 bg-gradient-to-r from-green-500 to-purple-500 rounded-full animate-pulse shadow-lg shadow-green-500/30"></div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-green-500/30 mt-16">
        <div className="container mx-auto px-6 sm:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-gray-400 text-sm mb-4 md:mb-0 drop-shadow-lg">
              © 2024 DraftBoard. All rights reserved.
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/login" className="text-gray-400 hover:text-green-400 transition-colors text-sm drop-shadow-lg">
                Sign In
              </Link>
              <Link to="/admin/login" className="text-gray-500 hover:text-green-400 transition-colors text-xs font-mono drop-shadow-lg">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 