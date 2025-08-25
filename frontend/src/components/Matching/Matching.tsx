// frontend/src/components/Matching/Matching.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { matchingAPI, analysisAPI } from '../../services/api';
import './Matching.css';

interface UserProfile {
  id: number;
  full_name: string;
  age: number;
  location: string;
  bio: string;
  profile_picture: string;
  interests: string[];
  compatibility_score: number;
  trait_scores: Record<string, number>;
}

const Matching: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState({
    minAge: 18,
    maxAge: 100,
    location: '',
    interests: [] as string[]
  });
  const [showFilters, setShowFilters] = useState(false);
  const [compatibilityDetails, setCompatibilityDetails] = useState<{
    userId: number;
    details: any;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchPotentialMatches();
    }
  }, [user, filters]);

  const fetchPotentialMatches = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');
    
    try {
      const response = await matchingAPI.getPotentialMatches(user.id, 20);
      setProfiles(response.data.profiles || []);
      setCurrentIndex(0);
    } catch (error: any) {
      console.error('Error fetching matches:', error);
      setError(error.response?.data?.message || 'Failed to load potential matches. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (direction: 'like' | 'dislike') => {
    if (!user || !profiles.length || currentIndex >= profiles.length) return;

    const currentProfile = profiles[currentIndex];
    
    try {
      if (direction === 'like') {
        await matchingAPI.likeUser(user.id, currentProfile.id);
      } else {
        await matchingAPI.dislikeUser(user.id, currentProfile.id);
      }
      
      // Move to next profile
      setCurrentIndex(prev => prev + 1);
    } catch (error: any) {
      console.error('Error swiping:', error);
      setError(error.response?.data?.message || 'Failed to process your choice. Please try again.');
    }
  };

  const viewCompatibility = async (userId: number) => {
    if (!user) return;

    try {
      const response = await analysisAPI.getCompatibility(user.id, userId);
      setCompatibilityDetails({
        userId,
        details: response.data
      });
    } catch (error: any) {
      console.error('Error fetching compatibility details:', error);
      setError(error.response?.data?.message || 'Failed to load compatibility details.');
    }
  };

  const currentProfile = profiles[currentIndex];

  if (isLoading) {
    return (
      <div className="matching-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Finding potential matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="matching-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchPotentialMatches} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="matching-container">
        <div className="no-more-profiles">
          <div className="empty-icon">💔</div>
          <h3>No more profiles to show</h3>
          <p>We've run out of potential matches in your area. Try adjusting your filters or check back later.</p>
          <button onClick={fetchPotentialMatches} className="primary-button">
            Refresh Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="matching-container">
      <div className="matching-header">
        <h2>Find Your Match</h2>
        <p>Swipe right to like, left to pass</p>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="filter-toggle"
        >
          <i className="fas fa-filter"></i>
          Filters
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <h4>Filter Preferences</h4>
          <div className="filter-group">
            <label>Age Range</label>
            <div className="age-range">
              <input
                type="range"
                min="18"
                max="100"
                value={filters.minAge}
                onChange={(e) => setFilters({...filters, minAge: parseInt(e.target.value)})}
              />
              <input
                type="range"
                min="18"
                max="100"
                value={filters.maxAge}
                onChange={(e) => setFilters({...filters, maxAge: parseInt(e.target.value)})}
              />
              <div className="age-values">
                <span>{filters.minAge}</span>
                <span>to</span>
                <span>{filters.maxAge}</span>
              </div>
            </div>
          </div>
          
          <div className="filter-actions">
            <button 
              onClick={() => setShowFilters(false)}
              className="secondary-button"
            >
              Close
            </button>
            <button 
              onClick={fetchPotentialMatches}
              className="primary-button"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      <div className="profile-card">
        <div className="profile-image">
          <img src={currentProfile.profile_picture || '/default-avatar.png'} alt={currentProfile.full_name} />
          <div className="compatibility-badge">
            {Math.round(currentProfile.compatibility_score * 100)}% Match
          </div>
        </div>
        
        <div className="profile-details">
          <h3>{currentProfile.full_name}, {currentProfile.age}</h3>
          <p className="location">{currentProfile.location}</p>
          
          <div className="profile-bio">
            <p>{currentProfile.bio}</p>
          </div>
          
          <div className="profile-interests">
            <h4>Interests</h4>
            <div className="interests-list">
              {currentProfile.interests.slice(0, 5).map((interest, index) => (
                <span key={index} className="interest-tag">{interest}</span>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => viewCompatibility(currentProfile.id)}
            className="compatibility-btn"
          >
            View Compatibility Details
          </button>
        </div>
        
        <div className="swipe-actions">
          <button 
            onClick={() => handleSwipe('dislike')}
            className="swipe-button dislike"
          >
            <i className="fas fa-times"></i>
          </button>
          <button 
            onClick={() => handleSwipe('like')}
            className="swipe-button like"
          >
            <i className="fas fa-heart"></i>
          </button>
        </div>
      </div>

      <div className="progress-indicator">
        {currentIndex + 1} of {profiles.length}
      </div>

      {compatibilityDetails && (
        <div className="modal-overlay">
          <div className="modal-content compatibility-modal">
            <div className="modal-header">
              <h3>Compatibility Details</h3>
              <button 
                onClick={() => setCompatibilityDetails(null)}
                className="close-button"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="compatibility-score">
                <h4>{Math.round(compatibilityDetails.details.overall_score * 100)}% Match</h4>
                <div className="score-breakdown">
                  {compatibilityDetails.details.breakdown && 
                    Object.entries(compatibilityDetails.details.breakdown).map(([trait, score]) => (
                      <div key={trait} className="trait-score">
                        <span className="trait-name">{trait}</span>
                        <div className="score-bar">
                          <div 
                            className="score-fill" 
                            style={{ width: `${(score as number) * 100}%` }}
                          ></div>
                        </div>
                        <span className="score-value">{Math.round((score as number) * 100)}%</span>
                      </div>
                    ))
                  }
                </div>
              </div>
              
              <div className="compatibility-insights">
                <h4>Why you might be compatible:</h4>
                <ul>
                  {compatibilityDetails.details.insights?.map((insight: string, index: number) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matching;
