// frontend/src/components/Profile/Profile.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI, profileAPI } from '../../services/api';
import './Profile.css';

interface ProfileData {
  id: number;
  full_name: string;
  email: string;
  age: number | null;
  gender: string | null;
  location: string | null;
  bio: string | null;
  interests: string[];
  profile_picture: string | null;
  occupation: string | null;
  relationship_goals?: string;
  personality_traits?: Record<string, number>;
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    id: 0,
    full_name: '',
    email: '',
    age: null,
    gender: null,
    location: null,
    bio: null,
    interests: [],
    profile_picture: null,
    occupation: null,
    relationship_goals: '',
    personality_traits: {}
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [suggestedInterests, setSuggestedInterests] = useState<string[]>([]);
  const [showInterestSuggestions, setShowInterestSuggestions] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
      fetchSuggestedInterests();
    }
  }, [user]);

  useEffect(() => {
    if (newInterest.length > 2) {
      searchInterests(newInterest);
    } else {
      setSuggestedInterests([]);
      setShowInterestSuggestions(false);
    }
  }, [newInterest]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await usersAPI.getUser(user.id);
      const userData = response.data;
      
      setProfile({
        id: userData.id,
        full_name: userData.full_name || '',
        email: userData.email,
        age: userData.age,
        gender: userData.gender,
        location: userData.location,
        bio: userData.bio,
        interests: userData.interests || [],
        profile_picture: userData.profile_picture,
        occupation: userData.occupation || null,
        relationship_goals: userData.relationship_goals || '',
        personality_traits: userData.personality_traits || {}
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setError(error.response?.data?.message || 'Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestedInterests = async () => {
    try {
      const response = await profileAPI.getSuggestedInterests();
      setSuggestedInterests(response.data.interests || []);
    } catch (error) {
      console.error('Error fetching suggested interests:', error);
    }
  };

  const searchInterests = async (query: string) => {
    try {
      const response = await profileAPI.searchInterests(query);
      setSuggestedInterests(response.data.interests || []);
      setShowInterestSuggestions(true);
    } catch (error) {
      console.error('Error searching interests:', error);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    setError(null);
    
    try {
      const response = await usersAPI.updateUser(user.id, {
        full_name: profile.full_name,
        age: profile.age,
        gender: profile.gender,
        location: profile.location,
        bio: profile.bio,
        profile_picture: profile.profile_picture,
        occupation: profile.occupation,
        relationship_goals: profile.relationship_goals,
        interests: profile.interests
      });
      
      const updatedUser = response.data;
      setProfile(updatedUser);
      updateUser(updatedUser);
      
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInterest = (interest: string) => {
    const trimmedInterest = interest.trim();
    if (trimmedInterest && !profile.interests.includes(trimmedInterest)) {
      setProfile({
        ...profile,
        interests: [...profile.interests, trimmedInterest]
      });
    }
    setNewInterest('');
    setShowInterestSuggestions(false);
  };

  const handleRemoveInterest = (interestToRemove: string) => {
    setProfile({
      ...profile,
      interests: profile.interests.filter(interest => interest !== interestToRemove)
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      const response = await usersAPI.uploadProfilePicture(user.id, file);
      setProfile({
        ...profile,
        profile_picture: response.data.profile_picture_url
      });
      setSuccess('Profile picture updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      setError(error.response?.data?.message || 'Failed to upload profile picture. Please try again.');
    }
  };

  const handleInterestKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newInterest.trim()) {
      e.preventDefault();
      handleAddInterest(newInterest);
    }
  };

  const getPersonalityInsights = () => {
    if (!profile.personality_traits) return null;
    
    const traits = profile.personality_traits;
    const topTraits = Object.entries(traits)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([trait]) => trait);
    
    return topTraits.length > 0 ? topTraits.join(', ') : 'Not enough data yet';
  };

  if (isLoading && !isEditing) {
    return (
      <div className="profile-container">
        <div className="profile-skeleton">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line short"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
        </div>
      </div>
    );
  }

  if (error && !isEditing) {
    return (
      <div className="profile-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchProfile} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        <div className="profile-header">
          <h2>Your Profile</h2>
          <p>Manage your personal information and preferences</p>
        </div>

        {success && (
          <div className="success-state">
            <div className="success-icon">✅</div>
            <p>{success}</p>
            <button onClick={() => setSuccess(null)} className="dismiss-btn">
              ✕
            </button>
          </div>
        )}

        {isEditing ? (
          <div className="profile-edit">
            <div className="profile-image-edit">
              <div className="image-preview">
                <img src={profile.profile_picture || '/default-avatar.png'} alt="Profile" />
                <label htmlFor="profile-image-upload" className="image-upload-btn">
                  <i className="fas fa-camera"></i>
                  Change Photo
                </label>
                <input
                  id="profile-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name"
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="disabled-input"
                />
                <span className="field-note">Email cannot be changed</span>
              </div>

              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  type="number"
                  value={profile.age || ''}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Enter your age"
                  min="18"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  value={profile.gender || ''}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  value={profile.location || ''}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="Enter your location"
                />
              </div>

              <div className="form-group">
                <label htmlFor="occupation">Occupation</label>
                <input
                  id="occupation"
                  type="text"
                  value={profile.occupation || ''}
                  onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                  placeholder="Enter your occupation"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="relationship_goals">Relationship Goals</label>
                <select
                  id="relationship_goals"
                  value={profile.relationship_goals || ''}
                  onChange={(e) => setProfile({ ...profile, relationship_goals: e.target.value })}
                >
                  <option value="">Select your relationship goals</option>
                  <option value="long-term">Long-term relationship</option>
                  <option value="short-term">Short-term dating</option>
                  <option value="friendship">Friendship</option>
                  <option value="not-sure">Not sure yet</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell others about yourself, your interests, and what you're looking for..."
                  rows={4}
                  maxLength={500}
                />
                <span className="char-counter">{profile.bio?.length || 0}/500 characters</span>
              </div>

              <div className="form-group full-width">
                <label htmlFor="interests">Interests</label>
                <div className="interests-input-container">
                  <input
                    id="interests"
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={handleInterestKeyPress}
                    placeholder="Add an interest"
                    onFocus={() => newInterest.length > 2 && setShowInterestSuggestions(true)}
                  />
                  <button
                    type="button"
                    className="add-interest-btn"
                    onClick={() => newInterest && handleAddInterest(newInterest)}
                    disabled={!newInterest.trim()}
                  >
                    Add
                  </button>
                </div>

                {showInterestSuggestions && suggestedInterests.length > 0 && (
                  <div className="interest-suggestions">
                    {suggestedInterests.map((interest, index) => (
                      <button
                        key={index}
                        type="button"
                        className="suggestion-item"
                        onClick={() => handleAddInterest(interest)}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                )}

                <div className="interests-edit-list">
                  {profile.interests && profile.interests.map((interest, index) => (
                    <span key={index} className="interest-tag editable">
                      {interest}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(interest)}
                        className="remove-interest"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                onClick={handleSave}
                className="save-btn"
                disabled={isSaving || !profile.full_name.trim()}
              >
                {isSaving ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="cancel-btn"
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-view">
            <div className="profile-card">
              <div className="profile-image">
                <img src={profile.profile_picture || '/default-avatar.png'} alt="Profile" />
                <div className="profile-overlay">
                  <button
                    className="edit-image-btn"
                    onClick={() => document.getElementById('profile-image-upload-view')?.click()}
                  >
                    <i className="fas fa-camera"></i>
                    Change Photo
                  </button>
                  <input
                    id="profile-image-upload-view"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <div className="profile-info">
                <h3>{profile.full_name}</h3>
                <p className="profile-email">{profile.email}</p>
                
                <div className="profile-details">
                  {profile.age && <span><i className="fas fa-birthday-cake"></i> {profile.age} years old</span>}
                  {profile.gender && <span><i className="fas fa-venus-mars"></i> {profile.gender}</span>}
                  {profile.location && <span><i className="fas fa-map-marker-alt"></i> {profile.location}</span>}
                  {profile.occupation && <span><i className="fas fa-briefcase"></i> {profile.occupation}</span>}
                  {profile.relationship_goals && (
                    <span><i className="fas fa-heart"></i> Looking for {profile.relationship_goals}</span>
                  )}
                </div>

                <div className="profile-bio">
                  <h4>About Me</h4>
                  <p>{profile.bio || 'No bio added yet.'}</p>
                </div>

                <div className="profile-interests">
                  <h4>Interests</h4>
                  <div className="interests-list">
                    {profile.interests && profile.interests.length > 0 ? (
                      profile.interests.map((interest, index) => (
                        <span key={index} className="interest-tag">{interest}</span>
                      ))
                    ) : (
                      <p>No interests added yet.</p>
                    )}
                  </div>
                </div>

                {profile.personality_traits && Object.keys(profile.personality_traits).length > 0 && (
                  <div className="personality-insights">
                    <h4>Personality Insights</h4>
                    <p>Your top traits: {getPersonalityInsights()}</p>
                    <div className="traits-progress">
                      {Object.entries(profile.personality_traits)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([trait, score]) => (
                          <div key={trait} className="trait-row">
                            <span className="trait-name">{trait}</span>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ width: `${score * 100}%` }}
                              ></div>
                            </div>
                            <span className="trait-score">{Math.round(score * 100)}%</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="edit-profile-btn"
              >
                <i className="fas fa-edit"></i>
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
