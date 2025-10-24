import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import SubmissionModal from '../components/SubmissionModal';
import LoadingSpinner from '../components/LoadingSpinner';

interface Brief {
  id: string;
  title: string;
  description: string;
  requirements: string;
  reward: number;
  amountOfWinners: number;
  deadline: string;
  status: string;
  brand: {
    id: string;
    companyName: string;
    logo?: string;
  };
  rewardTiers?: Array<{
    position: number;
    name: string;
    amount: number;
    description?: string;
  }>;
}

const ApplyToBriefPage: React.FC = () => {
  const { briefId } = useParams<{ briefId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  const fetchBriefDetails = useCallback(async () => {
    if (!briefId) {
      setError('Brief ID is required');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/briefs/${briefId}/public`);
      if (response.ok) {
        const data = await response.json();
        setBrief(data);
        // Automatically open the submission modal
        setShowSubmissionModal(true);
      } else {
        setError('Brief not found');
      }
    } catch (error) {
      setError('Failed to load brief details');
    } finally {
      setLoading(false);
    }
  }, [briefId]);

  useEffect(() => {
    // Check if user is authenticated and is a creator
    if (!user) {
      navigate('/login', { state: { returnUrl: `/brief/${briefId}/apply` } });
      return;
    }

    if (user.type !== 'creator') {
      alert('Only creators can apply to briefs. Please log in with a creator account.');
      navigate('/marketplace');
      return;
    }

    if (briefId && briefId.trim() !== '') {
      fetchBriefDetails();
    } else {
      setError('Invalid brief ID');
      setLoading(false);
    }
  }, [briefId, fetchBriefDetails, user, navigate]);

  const handleSubmissionSuccess = () => {
    setShowSubmissionModal(false);
    // Navigate back to marketplace or brief details
    navigate(`/brief/${briefId}`);
  };

  const handleModalClose = () => {
    setShowSubmissionModal(false);
    // Navigate back to brief details
    navigate(`/brief/${briefId}`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} flex items-center justify-center`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <h1 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {error || 'Brief not found'}
          </h1>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Submission Modal */}
      <SubmissionModal
        brief={brief}
        isOpen={showSubmissionModal}
        onClose={handleModalClose}
        onSubmit={handleSubmissionSuccess}
      />
    </>
  );
};

export default ApplyToBriefPage;









