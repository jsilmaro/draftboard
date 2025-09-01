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
    <div className="min-h-screen bg-black relative overflow-hidden font-sans">
      {/* Sophisticated Background with Glass-morphism */}
      <div className="absolute inset-0">
        {/* Primary dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        
        {/* Subtle neon green lighting effect */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(34, 197, 94, 0.4) 0%, rgba(147, 51, 234, 0.2) 30%, rgba(236, 72, 153, 0.1) 60%, transparent 70%)`,
            transition: 'all 0.3s ease-out'
          }}
        ></div>
        
                 {/* Stripe Payment Cards in Background */}
         <div className="absolute top-1/4 left-1/4 w-96 h-64 transform -rotate-6 opacity-20 animate-pulse">
           <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-6 relative overflow-hidden h-full">
             <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
             <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full -ml-6 -mb-6"></div>
             
             <div className="flex justify-between items-start mb-6">
               <div className="text-white">
                 <div className="text-xs opacity-80 mb-1">Secure Payment</div>
                 <div className="text-sm font-semibold">Stripe Verified</div>
               </div>
               <div className="flex items-center space-x-1">
                 <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                   <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.831 3.47 1.426 3.47 2.338 0 .914-.796 1.431-2.126 1.431-1.72 0-4.516-.924-6.378-2.168l-.889 5.52c2.172 1.281 5.274 2.206 8.876 2.206 2.669 0 4.843-.624 6.328-1.813 1.664-1.305 2.467-3.236 2.467-5.732 0-4.128-2.524-5.851-6.594-7.305h-.007z"/>
                   </svg>
                 </div>
               </div>
             </div>
             
             <div className="flex justify-between items-end">
               <div className="text-white/80">
                 <div className="text-xs mb-1">Powered by</div>
                 <div className="text-white font-bold text-lg tracking-wider">STRIPE</div>
               </div>
               <div className="text-white/60 text-xs">
                 <div>Secure</div>
                 <div>PCI DSS</div>
               </div>
             </div>
             
             {/* Stripe Logo Overlay */}
             <div className="absolute top-4 right-4">
               <svg className="w-12 h-12 text-white/80" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.831 3.47 1.426 3.47 2.338 0 .914-.796 1.431-2.126 1.431-1.72 0-4.516-.924-6.378-2.168l-.889 5.52c2.172 1.281 5.274 2.206 8.876 2.206 2.669 0 4.843-.624 6.328-1.813 1.664-1.305 2.467-3.236 2.467-5.732 0-4.128-2.524-5.851-6.594-7.305h-.007z"/>
               </svg>
             </div>
           </div>
         </div>
         
         <div className="absolute top-1/3 right-1/4 w-80 h-48 transform rotate-6 opacity-15 animate-pulse" style={{animationDelay: '1s'}}>
           <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-6 relative overflow-hidden h-full">
             <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
             <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full -ml-6 -mb-6"></div>
             
             <div className="flex justify-between items-start mb-6">
               <div className="text-white">
                 <div className="text-xs opacity-80 mb-1">Secure Payment</div>
                 <div className="text-sm font-semibold">Stripe Verified</div>
               </div>
               <div className="flex items-center space-x-1">
                 <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                   <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.831 3.47 1.426 3.47 2.338 0 .914-.796 1.431-2.126 1.431-1.72 0-4.516-.924-6.378-2.168l-.889 5.52c2.172 1.281 5.274 2.206 8.876 2.206 2.669 0 4.843-.624 6.328-1.813 1.664-1.305 2.467-3.236 2.467-5.732 0-4.128-2.524-5.851-6.594-7.305h-.007z"/>
                   </svg>
                 </div>
               </div>
             </div>
             
             <div className="flex justify-between items-end">
               <div className="text-white/80">
                 <div className="text-xs mb-1">Powered by</div>
                 <div className="text-white font-bold text-lg tracking-wider">STRIPE</div>
               </div>
               <div className="text-white/60 text-xs">
                 <div>Secure</div>
                 <div>PCI DSS</div>
               </div>
             </div>
             
             {/* Stripe Logo Overlay */}
             <div className="absolute top-4 right-4">
               <svg className="w-12 h-12 text-white/80" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.831 3.47 1.426 3.47 2.338 0 .914-.796 1.431-2.126 1.431-1.72 0-4.516-.924-6.378-2.168l-.889 5.52c2.172 1.281 5.274 2.206 8.876 2.206 2.669 0 4.843-.624 6.328-1.813 1.664-1.305 2.467-3.236 2.467-5.732 0-4.128-2.524-5.851-6.594-7.305h-.007z"/>
               </svg>
             </div>
           </div>
         </div>
         
         <div className="absolute bottom-1/4 left-1/3 w-72 h-56 transform -rotate-6 opacity-18 animate-pulse" style={{animationDelay: '2s'}}>
           <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-6 relative overflow-hidden h-full">
             <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
             <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full -ml-6 -mb-6"></div>
             
             <div className="flex justify-between items-start mb-6">
               <div className="text-white">
                 <div className="text-xs opacity-80 mb-1">Secure Payment</div>
                 <div className="text-sm font-semibold">Stripe Verified</div>
               </div>
               <div className="flex items-center space-x-1">
                 <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                   <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.831 3.47 1.426 3.47 2.338 0 .914-.796 1.431-2.126 1.431-1.72 0-4.516-.924-6.378-2.168l-.889 5.52c2.172 1.281 5.274 2.206 8.876 2.206 2.669 0 4.843-.624 6.328-1.813 1.664-1.305 2.467-3.236 2.467-5.732 0-4.128-2.524-5.851-6.594-7.305h-.007z"/>
                   </svg>
                 </div>
               </div>
             </div>
             
             <div className="flex justify-between items-end">
               <div className="text-white/80">
                 <div className="text-xs mb-1">Powered by</div>
                 <div className="text-white font-bold text-lg tracking-wider">STRIPE</div>
               </div>
               <div className="text-white/60 text-xs">
                 <div>Secure</div>
                 <div>PCI DSS</div>
               </div>
             </div>
             
             {/* Stripe Logo Overlay */}
             <div className="absolute top-4 right-4">
               <svg className="w-12 h-12 text-white/80" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.831 3.47 1.426 3.47 2.338 0 .914-.796 1.431-2.126 1.431-1.72 0-4.516-.924-6.378-2.168l-.889 5.52c2.172 1.281 5.274 2.206 8.876 2.206 2.669 0 4.843-.624 6.328-1.813 1.664-1.305 2.467-3.236 2.467-5.732 0-4.128-2.524-5.851-6.594-7.305h-.007z"/>
               </svg>
             </div>
           </div>
         </div>
        
        {/* Subtle moving elements */}
        <div className="absolute top-1/6 right-1/6 w-4 h-4 bg-green-400 rounded-full opacity-40 animate-bounce" style={{animation: 'float 8s ease-in-out infinite'}}></div>
        <div className="absolute bottom-1/3 left-1/6 w-3 h-3 bg-purple-400 rounded-full opacity-30 animate-bounce" style={{animation: 'float 6s ease-in-out infinite 1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-pink-400 rounded-full opacity-35 animate-bounce" style={{animation: 'float 7s ease-in-out infinite 2s'}}></div>

        {/* Moving brief cards with smooth animations */}
        <div className="absolute top-1/5 left-0 w-64 h-32 bg-gradient-to-r from-gray-900/60 to-gray-800/60 backdrop-blur-md border border-green-400/30 rounded-xl p-4 transform -rotate-6 opacity-15" style={{
          animation: 'slideRight 25s linear infinite',
          transform: 'translateX(-100%) rotate(-6deg)'
        }}>
          <div className="text-green-400 text-xs font-medium mb-2">Tech Review Campaign</div>
          <div className="text-white text-xs mb-1">Create viral tech reviews</div>
          <div className="text-green-400 text-xs">$500 - $2,000</div>
        </div>
        
        <div className="absolute top-2/3 right-0 w-64 h-32 bg-gradient-to-r from-gray-900/60 to-gray-800/60 backdrop-blur-md border border-purple-400/30 rounded-xl p-4 transform rotate-6 opacity-15" style={{
          animation: 'slideLeft 30s linear infinite',
          transform: 'translateX(100%) rotate(6deg)'
        }}>
          <div className="text-purple-400 text-xs font-medium mb-2">Fashion Influencer</div>
          <div className="text-white text-xs mb-1">Style & share trends</div>
          <div className="text-purple-400 text-xs">$300 - $1,500</div>
        </div>

        {/* CSS Animations */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes slideRight {
              0% { transform: translateX(-100%) rotate(-6deg); }
              100% { transform: translateX(calc(100vw + 100%)) rotate(-6deg); }
            }
            @keyframes slideLeft {
              0% { transform: translateX(calc(100vw + 100%)) rotate(6deg); }
              100% { transform: translateX(-100%) rotate(6deg); }
            }
            @keyframes float {
              0%, 100% { transform: translateY(0px) translateX(0px); }
              25% { transform: translateY(-15px) translateX(8px); }
              50% { transform: translateY(-30px) translateX(-4px); }
              75% { transform: translateY(-15px) translateX(-8px); }
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
              className="w-28 h-14 object-contain object-center"
              style={{
                filter: 'drop-shadow(0 0 15px rgba(34, 197, 94, 0.6))'
              }}
            />
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex items-center space-x-8">
          <Link to="/login" className="text-white hover:text-green-400 transition-colors duration-300 font-medium">
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
            <div className="w-2 h-2 bg-green-400 rounded-full mr-3 shadow-lg shadow-green-400/50 animate-pulse"></div>
            <p className="text-green-400 text-sm font-medium">
              Connecting brands with talented creators worldwide
            </p>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
            Choose Your
            <span className="block bg-gradient-to-r from-green-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Path</span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Join DraftBoard and connect with amazing opportunities. Are you a brand looking for creators, or a creator looking for brands?
          </p>
        </div>

        {/* Enhanced Registration Cards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {/* Enhanced Brand Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-blue-500/5 to-purple-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative bg-gradient-to-br from-gray-900/80 via-gray-800/90 to-gray-900/80 backdrop-blur-xl border border-green-500/20 rounded-2xl p-8 hover:border-green-400/40 transition-all duration-500 hover:scale-[1.02] shadow-xl shadow-green-500/5 group-hover:shadow-green-400/10 overflow-hidden">
              {/* Glass reflection effect */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-green-400/5 to-transparent animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-blue-400/10 to-transparent rounded-full blur-xl"></div>
              </div>
              
              <div className="relative z-10 text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">For Brands</h2>
                <p className="text-gray-300 text-base leading-relaxed">
                  Find talented creators to bring your brand vision to life. Connect with influencers, designers, and content creators.
                </p>
              </div>
              
              <div className="relative z-10 space-y-3 mb-8">
                <div className="flex items-center text-gray-300">
                  <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm">Company profile with logo</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm">Contact information</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm">Banking verification</span>
                </div>
              </div>

              <Link
                to="/brand/register"
                className="relative z-10 w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg text-base transition-all duration-300 hover:scale-105 text-center block"
              >
                Register as Brand
              </Link>
            </div>
          </div>

          {/* Enhanced Creator Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-purple-500/5 to-pink-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative bg-gradient-to-br from-gray-900/80 via-gray-800/90 to-gray-900/80 backdrop-blur-xl border border-green-500/20 rounded-2xl p-8 hover:border-green-400/40 transition-all duration-500 hover:scale-[1.02] shadow-xl shadow-green-500/5 group-hover:shadow-green-400/10 overflow-hidden">
              {/* Glass reflection effect */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-purple-400/5 to-transparent animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-pink-400/10 to-transparent rounded-full blur-xl"></div>
              </div>
              
              <div className="relative z-10 text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">For Creators</h2>
                <p className="text-gray-300 text-base leading-relaxed">
                  Showcase your talent and connect with amazing brands. Grow your career with exciting opportunities.
                </p>
              </div>
              
              <div className="relative z-10 space-y-3 mb-8">
                <div className="flex items-center text-gray-300">
                  <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm">Professional profile</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm">Work showcase</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm">Social media integration</span>
                </div>
              </div>

              <Link
                to="/creator/register"
                className="relative z-10 w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg text-base transition-all duration-300 hover:scale-105 text-center block"
              >
                Register as Creator
              </Link>
            </div>
          </div>
        </div>

        {/* Marketplace & Sign In Section */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Marketplace Section */}
            <div className="bg-gradient-to-br from-gray-900/70 via-gray-800/80 to-gray-900/70 backdrop-blur-sm border border-blue-500/20 rounded-xl p-8 shadow-xl shadow-blue-500/5">
              <h3 className="text-xl font-bold text-white mb-4">Explore Opportunities</h3>
              <p className="text-gray-300 mb-6 text-sm">
                Browse all available briefs and discover creative opportunities from top brands
              </p>
              <Link
                to="/marketplace"
                className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 border border-blue-500/30 hover:border-blue-400/40"
              >
                Browse Marketplace
              </Link>
            </div>

            {/* Sign In Section */}
            <div className="bg-gradient-to-br from-gray-900/70 via-gray-800/80 to-gray-900/70 backdrop-blur-sm border border-green-500/20 rounded-xl p-8 shadow-xl shadow-green-500/5">
              <h3 className="text-xl font-bold text-white mb-4">Already have an account?</h3>
              <p className="text-gray-300 mb-6 text-sm">
                Sign in to access your dashboard and continue your journey
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 text-white font-medium py-2 px-6 rounded-lg transition-all duration-300 hover:scale-105 border border-green-500/30 hover:border-green-400/40"
                >
                  Sign In
                </Link>
                <Link 
                  to="/admin/login" 
                  className="text-gray-400 hover:text-green-400 transition-colors text-xs font-mono"
                >
                  Admin Access
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Bottom Accent */}
        <div className="relative h-16 max-w-4xl mx-auto mt-16">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 via-purple-500 to-pink-500 rounded-full opacity-50"></div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-green-500/20 mt-16">
        <div className="container mx-auto px-6 sm:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 DraftBoard. All rights reserved.
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/login" className="text-gray-400 hover:text-green-400 transition-colors text-sm">
                Sign In
              </Link>
              <Link to="/admin/login" className="text-gray-500 hover:text-green-400 transition-colors text-xs font-mono">
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