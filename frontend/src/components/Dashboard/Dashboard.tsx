// frontend/src/components/Dashboard/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { matchingAPI, journalAPI, analysisAPI } from '../../services/api';
import './Dashboard.css';

interface Match {
  id: number;
  full_name: string;
  profile_picture: string;
  compatibility_score: number;
  last_message?: string;
  last_message_time?: string;
}

interface JournalEntry {
  id: number;
  date: string;
  mood: string;
}

interface DashboardStats {
  total_matches: number;
  new_matches: number;
  journal_entries: number;
  personality_insights: string[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_matches: 0,
    new_matches: 0,
    journal_entries: 0,
    personality_insights: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');
    
    try {
      // Fetch matches
      const matchesResponse = await matchingAPI.getMutualMatches(user.id);
      const matchesData = matchesResponse.data.matches || [];
      setMatches(matchesData.slice(0, 5));
      
      // Fetch journal entries
      const journalResponse = await journalAPI.getEntries(user.id);
      const journalData = journalResponse.data.entries || [];
      setRecentEntries(journalData.slice(0, 3));
      
      // Fetch personality insights
      const personalityResponse = await analysisAPI.getPersonalityTraits(user.id);
      const personalityData = personalityResponse.data;
      
      // Calculate stats
      setStats({
        total_matches: matchesData.length,
        new_matches: matchesData.filter((m: any) => m.is_new).length,
        journal_entries: journalData.length,
        personality_insights: personalityData.insights || []
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Welcome back, {user?.full_name.split(' ')[0]}!</h2>
        <p>Here's what's happening with your SoulSync journey</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon matches">
            <i className="fas fa-heart"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.total_matches}</h3>
            <p>Total Matches</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon new-matches">
            <i className="fas fa-star"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.new_matches}</h3>
            <p>New Matches</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon journal">
            <i className="fas fa-book"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.journal_entries}</h3>
            <p>Journal Entries</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon insights">
            <i className="fas fa-lightbulb"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.personality_insights.length}</h3>
            <p>Personality Insights</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="recent-matches">
          <h3>Recent Matches</h3>
          {matches.length > 0 ? (
            <div className="matches-list">
              {matches.map(match => (
                <div key={match.id} className="match-item">
                  <img 
                    src={match.profile_picture || '/default-avatar.png'} 
                    alt={match.full_name}
                    className="match-avatar"
                  />
                  <div className="match-info">
                    <h4>{match.full_name}</h4>
                    <p>{Math.round(match.compatibility_score * 100)}% match</p>
                    {match.last_message && (
                      <p className="last-message">{match.last_message}</p>
                    )}
                  </div>
                  <button className="chat-button">
                    <i className="fas fa-comment"></i>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-section">
              <p>You don't have any matches yet. Start swiping to find your perfect match!</p>
              <button className="primary-button">
                Find Matches
              </button>
            </div>
          )}
        </div>

        <div className="recent-journal">
          <h3>Recent Journal Entries</h3>
          {recentEntries.length > 0 ? (
            <div className="entries-list">
              {recentEntries.map(entry => (
                <div key={entry.id} className="journal-entry">
                  <div className="entry-mood">
                    {entry.mood === 'happy' && '😊'}
                    {entry.mood === 'sad' && '😢'}
                    {entry.mood === 'excited' && '😆'}
                    {entry.mood === 'neutral' && '😐'}
                    {entry.mood === 'thoughtful' && '🤔'}
                  </div>
                  <div className="entry-info">
                    <p>{new Date(entry.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-section">
              <p>You haven't written any journal entries yet. Start journaling to track your emotions!</p>
              <button className="primary-button">
                Write Journal Entry
              </button>
            </div>
          )}
        </div>
      </div>

      {stats.personality_insights.length > 0 && (
        <div className="personality-insights">
          <h3>Your Personality Insights</h3>
          <div className="insights-grid">
            {stats.personality_insights.map((insight, index) => (
              <div key={index} className="insight-card">
                <p>{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-button">
            <i className="fas fa-user-plus"></i>
            <span>Find Matches</span>
          </button>
          <button className="action-button">
            <i className="fas fa-pencil-alt"></i>
            <span>Write Journal</span>
          </button>
          <button className="action-button">
            <i className="fas fa-comments"></i>
            <span>View Messages</span>
          </button>
          <button className="action-button">
            <i className="fas fa-chart-line"></i>
            <span>See Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
