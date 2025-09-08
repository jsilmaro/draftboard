import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    // Handle successful payment
    const handleSuccess = async () => {
      try {
        // eslint-disable-next-line no-console
        console.log('Payment successful for session:', sessionId);
        
        // Trigger webhook processing to ensure wallet is updated
        try {
          // Use the fallback webhook endpoint for manual triggering
          const webhookResponse = await fetch('/api/stripe/webhook', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: sessionId
            })
          });
          
          if (webhookResponse.ok) {
            // eslint-disable-next-line no-console
            console.log('Webhook processing completed');
          } else {
            // eslint-disable-next-line no-console
            console.log('Webhook processing failed, but payment was successful');
          }
        } catch (webhookError) {
          // eslint-disable-next-line no-console
          console.log('Webhook processing error:', webhookError);
        }
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/brand/dashboard');
        }, 3000);
        
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error processing successful payment:', err);
        setError('Payment was successful but there was an error processing it');
      } finally {
        setLoading(false);
      }
    };

    handleSuccess();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Payment Error</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => navigate('/brandj')}
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
        <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-gray-300 mb-4">
          Your wallet has been funded successfully. You will be redirected to your dashboard shortly.
        </p>
        <div className="animate-pulse">
          <p className="text-sm text-gray-400">Redirecting in 3 seconds...</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
