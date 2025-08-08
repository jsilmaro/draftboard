import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';

interface GoogleSignInLoginProps {
  onError: (error: string) => void;
  className?: string;
}

interface CredentialResponse {
  credential?: string;
  select_by?: string;
}

const GoogleSignInLogin: React.FC<GoogleSignInLoginProps> = ({ 
  onError, 
  className = '' 
}) => {
  const { googleLogin } = useAuth();

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (credentialResponse.credential) {
        // Google OAuth successful, attempting authentication...
        
        // Try brand login first
        const brandResponse = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            credential: credentialResponse.credential,
            userType: 'brand'
          }),
        });

        if (brandResponse.ok) {
          const data = await brandResponse.json();
          // Brand authentication successful
          googleLogin(data.user, data.token);
          return;
        }

        // If brand login fails, try creator login
        const creatorResponse = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            credential: credentialResponse.credential,
            userType: 'creator'
          }),
        });

        if (creatorResponse.ok) {
          const data = await creatorResponse.json();
          // Creator authentication successful
          googleLogin(data.user, data.token);
          return;
        }

        // If both fail, show error
        onError('No account found with this Google email. Please register first.');
      }
    } catch (error) {
      // Google authentication error
      onError('Failed to authenticate with Google. Please try again.');
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
          text="signin_with"
          shape="rectangular"
          logo_alignment="left"
          width="100%"
        />
      </div>
    </div>
  );
};

export default GoogleSignInLogin; 