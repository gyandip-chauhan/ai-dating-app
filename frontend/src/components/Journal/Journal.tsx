// frontend/src/components/Journal/Journal.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { journalAPI } from '../../services/api';
import './Journal.css';

interface JournalEntry {
  id: number;
  date: string;
  content: string;
  mood: string;
  title?: string;
  tags?: string[];
}

interface CreateEntryData {
  content: string;
  mood: string;
  title?: string;
}

const moodOptions = [
  { value: 'happy', label: '😊 Happy', color: '#4CAF50' },
  { value: 'sad', label: '😢 Sad', color: '#2196F3' },
  { value: 'excited', label: '😆 Excited', color: '#FF9800' },
  { value: 'neutral', label: '😐 Neutral', color: '#9E9E9E' },
  { value: 'thoughtful', label: '🤔 Thoughtful', color: '#607D8B' },
  { value: 'anxious', label: '😰 Anxious', color: '#F44336' },
  { value: 'grateful', label: '🙏 Grateful', color: '#9C27B0' },
  { value: 'tired', label: '😴 Tired', color: '#795548' },
];

const Journal: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState({ content: '', title: '' });
  const [currentMood, setCurrentMood] = useState('neutral');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const fetchEntries = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await journalAPI.getEntries(user.id);
      setEntries(
        response.data.entries.map((entry: any) => ({
          id: entry.id,
          date: entry.created_at,
          content: entry.content,
          mood: entry.mood,
          title: entry.title || '',
          tags: entry.tags || []
        }))
      );
    } catch (err: any) {
      console.error('Error fetching journal entries:', err);
      setError(err.response?.data?.message || 'Failed to load journal entries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addEntry = async () => {
    if (!newEntry.content.trim() || !user) return;

    setIsAdding(true);
    setError(null);
    try {
      // Create the entry data with proper typing
      const entryData: CreateEntryData = {
        content: newEntry.content,
        mood: currentMood
      };
      
      // Only add title if it exists
      if (newEntry.title.trim()) {
        entryData.title = newEntry.title;
      }
      
      const response = await journalAPI.createEntry(user.id, entryData);
      
      setEntries([{ 
        ...response.data, 
        date: response.data.created_at,
        tags: []
      }, ...entries]);
      
      setNewEntry({ content: '', title: '' });
      setCurrentMood('neutral');
      setSuccess('Journal entry added successfully!');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error adding journal entry:', err);
      setError(err.response?.data?.message || 'Failed to add journal entry. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const updateEntry = async (entryId: number, updates: Partial<JournalEntry>) => {
    if (!user) return;

    try {
      // Create update data with proper typing
      const updateData: Partial<CreateEntryData> = {};
      
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.mood !== undefined) updateData.mood = updates.mood;
      if (updates.title !== undefined) updateData.title = updates.title;
      
      const response = await journalAPI.updateEntry(user.id, entryId, updateData);
      
      setEntries(entries.map(entry => 
        entry.id === entryId 
          ? { ...entry, ...response.data, date: response.data.updated_at || entry.date }
          : entry
      ));
      
      setSelectedEntry(null);
      setSuccess('Journal entry updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating journal entry:', err);
      setError(err.response?.data?.message || 'Failed to update journal entry. Please try again.');
    }
  };

  const deleteEntry = async (entryId: number) => {
    if (!user) return;

    if (!window.confirm('Are you sure you want to delete this journal entry?')) return;

    try {
      await journalAPI.deleteEntry(user.id, entryId);
      
      setEntries(entries.filter(entry => entry.id !== entryId));
      setSuccess('Journal entry deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting journal entry:', err);
      setError(err.response?.data?.message || 'Failed to delete journal entry. Please try again.');
    }
  };

  const getMoodDetails = (moodValue: string) => {
    return moodOptions.find(option => option.value === moodValue) || moodOptions[3];
  };

  const filteredEntries = entries.filter(entry => {
    const matchesMood = filterMood === 'all' || entry.mood === filterMood;
    const matchesSearch = searchQuery === '' || 
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.title && entry.title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesMood && matchesSearch;
  });

  const getMoodStats = () => {
    const moodCounts: Record<string, number> = {};
    moodOptions.forEach(mood => {
      moodCounts[mood.value] = 0;
    });
    
    entries.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    
    return moodCounts;
  };

  const moodStats = getMoodStats();

  return (
    <div className="journal-container">
      <div className="journal-header">
        <h2>Journal</h2>
        <p>Reflect on your day and track your emotions</p>
      </div>

      {error && (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => setError(null)} className="retry-btn">
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="success-state">
          <div className="success-icon">✅</div>
          <p>{success}</p>
          <button onClick={() => setSuccess(null)} className="dismiss-btn">
            ✕
          </button>
        </div>
      )}

      <div className="journal-content">
        <div className="new-entry-card">
          <h3>New Entry</h3>

          <div className="mood-selector">
            <span className="mood-label">How are you feeling today?</span>
            <div className="mood-options">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  className={`mood-option ${currentMood === mood.value ? 'active' : ''}`}
                  onClick={() => setCurrentMood(mood.value)}
                  style={{
                    backgroundColor: currentMood === mood.value ? mood.color : 'transparent',
                    borderColor: mood.color,
                  }}
                  title={mood.label}
                >
                  <span className="mood-emoji">{mood.label.split(' ')[0]}</span>
                  <span className="mood-name">{mood.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="entry-input">
            <input
              type="text"
              value={newEntry.title}
              onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
              placeholder="Entry title (optional)"
              className="title-input"
            />
            
            <textarea
              value={newEntry.content}
              onChange={(e) => setNewEntry({...newEntry, content: e.target.value})}
              placeholder="Write about your day, thoughts, or feelings..."
              rows={6}
            />

            <div className="entry-actions">
              <button
                onClick={addEntry}
                disabled={!newEntry.content.trim() || isAdding}
                className="add-entry-btn"
              >
                {isAdding ? (
                  <>
                    <span className="spinner"></span>
                    Adding...
                  </>
                ) : (
                  'Add Entry'
                )}
              </button>

              {(newEntry.content || newEntry.title) && (
                <button
                  onClick={() => setNewEntry({ content: '', title: '' })}
                  className="clear-btn"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="entries-section">
          <div className="section-header">
            <div className="section-title">
              <h3>Previous Entries</h3>
              <span className="entries-count">{filteredEntries.length} of {entries.length} entries</span>
            </div>
            
            <div className="section-controls">
              <div className="search-box">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search entries..."
                />
                <i className="fas fa-search"></i>
              </div>
              
              <select 
                value={filterMood} 
                onChange={(e) => setFilterMood(e.target.value)}
                className="mood-filter"
              >
                <option value="all">All moods</option>
                {moodOptions.map(mood => (
                  <option key={mood.value} value={mood.value}>
                    {mood.label}
                  </option>
                ))}
              </select>
              
              <div className="view-toggle">
                <button 
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  <i className="fas fa-list"></i>
                </button>
                <button 
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  <i className="fas fa-th"></i>
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your journal entries...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h4>No entries found</h4>
              <p>
                {entries.length === 0 
                  ? 'Start writing to begin your journaling journey!' 
                  : 'Try changing your search or filter criteria.'
                }
              </p>
            </div>
          ) : (
            <div className={`entries-list ${viewMode}`}>
              {filteredEntries.map((entry) => {
                const mood = getMoodDetails(entry.mood);
                return (
                  <div key={entry.id} className="journal-entry-card">
                    <div className="entry-header">
                      <div className="entry-mood" style={{ backgroundColor: mood.color }}>
                        {mood.label}
                      </div>
                      <div className="entry-actions">
                        <button 
                          onClick={() => setSelectedEntry(entry)}
                          className="icon-button"
                          title="Edit entry"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          onClick={() => deleteEntry(entry.id)}
                          className="icon-button"
                          title="Delete entry"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    
                    {entry.title && (
                      <h4 className="entry-title">{entry.title}</h4>
                    )}
                    
                    <p className="entry-content">
                      {entry.content.length > 150 && viewMode === 'grid'
                        ? `${entry.content.substring(0, 150)}...`
                        : entry.content
                      }
                    </p>
                    
                    <div className="entry-footer">
                      <span className="entry-date">
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Entry Modal */}
      {selectedEntry && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Journal Entry</h3>
              <button onClick={() => setSelectedEntry(null)} className="close-button">
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="mood-selector">
                <span className="mood-label">Mood:</span>
                <div className="mood-options">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.value}
                      className={`mood-option ${selectedEntry.mood === mood.value ? 'active' : ''}`}
                      onClick={() => setSelectedEntry({...selectedEntry, mood: mood.value})}
                      style={{
                        backgroundColor: selectedEntry.mood === mood.value ? mood.color : 'transparent',
                        borderColor: mood.color,
                      }}
                    >
                      {mood.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <input
                type="text"
                value={selectedEntry.title || ''}
                onChange={(e) => setSelectedEntry({...selectedEntry, title: e.target.value})}
                placeholder="Entry title (optional)"
                className="title-input"
              />
              
              <textarea
                value={selectedEntry.content}
                onChange={(e) => setSelectedEntry({...selectedEntry, content: e.target.value})}
                placeholder="Write about your day, thoughts, or feelings..."
                rows={8}
              />
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setSelectedEntry(null)}
                className="secondary-button"
              >
                Cancel
              </button>
              <button 
                onClick={() => updateEntry(selectedEntry.id, {
                  content: selectedEntry.content,
                  mood: selectedEntry.mood,
                  title: selectedEntry.title
                })}
                className="primary-button"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mood Statistics Panel */}
      {entries.length > 0 && (
        <div className="mood-statistics">
          <h4>Your Mood Statistics</h4>
          <div className="mood-stats-grid">
            {moodOptions.map(mood => (
              <div key={mood.value} className="mood-stat-item">
                <div className="mood-stat-header">
                  <span className="mood-emoji">{mood.label.split(' ')[0]}</span>
                  <span className="mood-count">{moodStats[mood.value]}</span>
                </div>
                <div className="mood-stat-bar">
                  <div 
                    className="mood-stat-fill" 
                    style={{
                      width: `${(moodStats[mood.value] / entries.length) * 100}%`,
                      backgroundColor: mood.color
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;
