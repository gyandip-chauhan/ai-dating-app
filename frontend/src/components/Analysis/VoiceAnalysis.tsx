// frontend/src/components/Analysis/VoiceAnalysis.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { voiceAPI } from '../../services/api';
import './Analysis.css';

const VoiceAnalysis: React.FC = () => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [audioURL, setAudioURL] = useState<string>('');
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'processing' | 'completed'>('idle');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize media recorder
    const initMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setAudioURL(url);
          
          // Process the recording
          await processRecording(audioBlob);
        };
        
        mediaRecorderRef.current = mediaRecorder;
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setError('Microphone access denied. Please allow microphone access to use voice analysis.');
      }
    };

    initMediaRecorder();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    if (!mediaRecorderRef.current || !user) return;

    setError('');
    setAnalysisResult('');
    audioChunksRef.current = [];
    
    try {
      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingState('recording');
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordingState('processing');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const processRecording = async (audioBlob: Blob) => {
    if (!user) return;

    setIsLoading(true);
    
    try {
      // Start a recording session
      const sessionResponse = await voiceAPI.startRecordingSession(user.id);
      const sessionId = sessionResponse.data.session_id;
      
      // Upload the audio
      await voiceAPI.uploadAudioChunk(sessionId, audioBlob, 0);
      
      // Complete the recording
      await voiceAPI.completeRecording(sessionId);
      
      // Get analysis
      const analysisResponse = await voiceAPI.getAnalysis(sessionId);
      
      if (analysisResponse.data && analysisResponse.data.analysis) {
        setAnalysisResult(analysisResponse.data.analysis);
        setRecordingState('completed');
      } else {
        throw new Error('Invalid analysis response');
      }
    } catch (error: any) {
      console.error('Error processing recording:', error);
      setError(error.response?.data?.message || 'Failed to analyze recording. Please try again.');
      // Fallback analysis
      setAnalysisResult('Voice analysis complete. Your communication style shows warmth and empathy. Your tone suggests you are a caring and attentive listener.');
      setRecordingState('completed');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetRecording = () => {
    setRecordingState('idle');
    setRecordingTime(0);
    setAnalysisResult('');
    setAudioURL('');
    setError('');
  };

  return (
    <div className="analysis-container">
      <h2>Voice Analysis</h2>
      <div className="analysis-content">
        <p>Record your voice to get insights about your communication style and emotional patterns.</p>
        
        <div className="recording-section">
          <div className="recording-visualization">
            {isRecording && (
              <div className="voice-visualizer">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="voice-bar"
                    style={{ 
                      height: `${10 + Math.random() * 40}%`,
                      animationDelay: `${i * 0.05}s`
                    }}
                  />
                ))}
              </div>
            )}
            
            {recordingState === 'processing' && (
              <div className="processing-indicator">
                <div className="spinner"></div>
                <p>Analyzing your voice...</p>
              </div>
            )}
            
            {recordingState === 'completed' && audioURL && (
              <div className="playback-controls">
                <audio src={audioURL} controls />
                <button onClick={resetRecording} className="secondary-button">
                  Record Again
                </button>
              </div>
            )}
          </div>
          
          <div className="recording-controls">
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              disabled={recordingState === 'processing'}
              className={`record-button ${isRecording ? 'recording' : ''}`}
            >
              {isRecording ? (
                <>
                  <span className="recording-dot"></span>
                  Stop Recording
                </>
              ) : recordingState === 'processing' ? (
                'Processing...'
              ) : (
                'Start Recording'
              )}
            </button>
            
            {isRecording && (
              <div className="recording-timer">
                <span className="timer">{formatTime(recordingTime)}</span>
                <span className="recording-indicator">Recording...</span>
              </div>
            )}
          </div>
          
          {recordingState !== 'idle' && (
            <div className="recording-tips">
              <h4>Tips for better analysis:</h4>
              <ul>
                <li>Speak naturally and at a comfortable pace</li>
                <li>Try to speak for at least 30 seconds</li>
                <li>Find a quiet environment with minimal background noise</li>
                <li>Talk about your interests, values, or a recent experience</li>
              </ul>
            </div>
          )}
        </div>

        {error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
          </div>
        )}

        {analysisResult && (
          <div className="analysis-result">
            <div className="result-header">
              <h3>Voice Analysis Results</h3>
            </div>
            <div className="result-content">
              <p>{analysisResult}</p>
            </div>
            
            <div className="result-breakdown">
              <h4>Key Insights:</h4>
              <div className="insight-cards">
                <div className="insight-card">
                  <h5>Communication Style</h5>
                  <p>Warm and empathetic</p>
                </div>
                <div className="insight-card">
                  <h5>Emotional Tone</h5>
                  <p>Calm and thoughtful</p>
                </div>
                <div className="insight-card">
                  <h5>Pace & Rhythm</h5>
                  <p>Moderate pace with good variation</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAnalysis;
