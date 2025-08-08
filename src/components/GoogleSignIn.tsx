import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../contexts/AuthContext';

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

interface CredentialResponse {
  credential?: string;
  select_by?: string;
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
    } catch (error) {
      // Google authentication error
      onError('Failed to authenticate with Google');
    }
  };

  const handleError = () => {
    onError('Google Sign-In was cancelled or failed');
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>
      
      <div className="mt-6 flex justify-center">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          useOneTap
          theme="outline"
          size="large"
          text="signup_with"
          shape="rectangular"
          logo_alignment="left"
          width="100%"
        />
      </div>
    </div>
  );
};

export default GoogleSignIn; 