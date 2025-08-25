// frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import Profile from './components/Profile/Profile';
import VoiceAnalysis from './components/Analysis/VoiceAnalysis';
import TextAnalysis from './components/Analysis/TextAnalysis';
import Matching from './components/Matching/Matching';
import Chat from './components/Chat/Chat';
import Journal from './components/Journal/Journal';
import LoadingSpinner from './components/Common/LoadingSpinner';
import './App.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return !user ? <>{children}</> : <Navigate to="/dashboard" />;
};

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="large" />
        <p>Loading AI Dating App...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Navbar />
      <main className="app-main">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/voice-analysis" 
            element={
              <ProtectedRoute>
                <VoiceAnalysis />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/text-analysis" 
            element={
              <ProtectedRoute>
                <TextAnalysis />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/matching" 
            element={
              <ProtectedRoute>
                <Matching />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat/:sessionId?" 
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/journal" 
            element={
              <ProtectedRoute>
                <Journal />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route 
            path="/" 
            element={
              user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
            } 
          />
          
          {/* 404 Page */}
          <Route 
            path="*" 
            element={
              <div className="not-found">
                <h2>404 - Page Not Found</h2>
                <p>The page you're looking for doesn't exist.</p>
              </div>
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <WebSocketProvider>
          <AppContent />
        </WebSocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
