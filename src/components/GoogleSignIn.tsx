import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
}



interface GoogleSignInProps {
  onSuccess: (userData: GoogleUser) => void;
  onError: (error: string) => void;
  userType: 'brand' | 'creator' | 'admin';
  className?: string;
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({ 
  onSuccess, 
  onError, 
  userType,
  className = '' 
}) => {
  const { googleLogin } = useAuth();
  
  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (credentialResponse.credential) {
        const decoded: GoogleUser = jwtDecode(credentialResponse.credential);
        
        // Call the backend to handle Google authentication
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            credential: credentialResponse.credential,
            userType: userType,
            userData: decoded
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Use the googleLogin function from AuthContext
          googleLogin(data.user, data.token);
          onSuccess(decoded);
        } else {
          const errorData = await response.json();
          onError(errorData.error || 'Google authentication failed');
        }
      }
    } catch (_error) {
      // Enhanced error handling for OAuth issues
      // Google OAuth Error Details logged silently
      onError('Failed to authenticate with Google. Please try again.');
    }
  };

  const handleError = (_error?: unknown) => {
    // Google Sign-In Error logged silently
    onError('Google Sign-In was cancelled or failed');
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
        </div>
      </div>
      
      <div className="mt-6 flex justify-center">
        <div id="google-signin-container">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap={false}
            auto_select={false}
            cancel_on_tap_outside={true}
            prompt_parent_id="google-signin-container"
            theme="outline"
            size="large"
            text="signup_with"
            shape="rectangular"
            logo_alignment="left"
            width="100%"
          />
        </div>
      </div>
    </div>
  );
};

export default GoogleSignIn; 