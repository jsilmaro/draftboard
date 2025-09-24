import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';

const BriefFundingSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { briefId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fundingConfirmed, setFundingConfirmed] = useState(false);
  const hasProcessed = useRef(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    // Prevent multiple processing
    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    // Handle successful payment
    const handleSuccess = async () => {
      try {
        // Brief funding successful for session
        
        // Confirm the funding with the backend
        const confirmResponse = await fetch(`/api/briefs/${briefId}/fund/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ sessionId })
        });

        if (confirmResponse.ok) {
          await confirmResponse.json();
          // Brief funding confirmed successfully
          setFundingConfirmed(true);
        } else {
          // Failed to confirm funding
          setError('Payment was successful but funding confirmation failed');
        }
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/brand/dashboard');
        }, 3000);
        
      } catch (err) {
        // Error processing successful payment
        setError('Payment was successful but there was an error processing it');
      } finally {
        setLoading(false);
      }
    };

    handleSuccess();
  }, [searchParams, navigate, briefId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Processing your brief funding...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Funding Error</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => navigate('/brand/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-white mb-2">Brief Funding Successful!</h1>
        <p className="text-gray-300 mb-4">
          Your brief has been successfully funded and is now live for creators to submit!
        </p>
        {fundingConfirmed && (
          <p className="text-green-400 mb-4">
            ✅ Funding confirmed in the system
          </p>
        )}
        <div className="animate-pulse">
          <p className="text-sm text-gray-400">Redirecting to dashboard in 3 seconds...</p>
        </div>
      </div>
    </div>
  );
};

export default BriefFundingSuccess;
