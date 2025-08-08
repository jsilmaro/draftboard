import React, { useState } from 'react';
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

const GoogleOAuthTest: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const { googleLogin } = useAuth();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      addLog('Google OAuth success callback triggered');
      
      if (credentialResponse.credential) {
        addLog('Credential received, decoding...');
        const decoded: GoogleUser = jwtDecode(credentialResponse.credential);
        addLog(`Decoded user: ${decoded.email} (${decoded.name})`);
        
        addLog('Attempting brand authentication...');
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

        addLog(`Brand response status: ${brandResponse.status}`);
        
        if (brandResponse.ok) {
          const data = await brandResponse.json();
          addLog(`Brand authentication successful: ${data.message}`);
          addLog(`User data: ${JSON.stringify(data.user)}`);
          googleLogin(data.user, data.token);
          addLog('googleLogin function called');
          return;
        }

        addLog('Brand authentication failed, trying creator...');
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

        addLog(`Creator response status: ${creatorResponse.status}`);
        
        if (creatorResponse.ok) {
          const data = await creatorResponse.json();
          addLog(`Creator authentication successful: ${data.message}`);
          addLog(`User data: ${JSON.stringify(data.user)}`);
          googleLogin(data.user, data.token);
          addLog('googleLogin function called');
          return;
        }

        const brandError = await brandResponse.json().catch(() => ({}));
        const creatorError = await creatorResponse.json().catch(() => ({}));
        
        addLog(`Authentication failed. Brand error: ${JSON.stringify(brandError)}`);
        addLog(`Creator error: ${JSON.stringify(creatorError)}`);
      }
    } catch (error) {
      addLog(`Error: ${error}`);
      // Google authentication error
    }
  };

  const handleError = () => {
    addLog('Google OAuth error callback triggered');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Google OAuth Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Google Sign-In</h2>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap
            theme="outline"
            size="large"
            text="signin_with"
            shape="rectangular"
            logo_alignment="left"
            width="300"
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-gray-100 p-4 rounded h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Try signing in with Google above.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => setLogs([])}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleOAuthTest;


