import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TabNavigation from './components/TabNavigation';
import ResumeUploader from './components/ResumeUploader';
import PastResumesTable from './components/PastResumesTable';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="App">
        <div className="initial-loading">
          <div className="loader"></div>
          <p>Loading Resume Analyzer...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login onLogin={login} />} />
            <Route path="/register" element={<Register onLogin={login} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className="App">
        <Navbar user={user} onLogout={logout} />
        
        <main className="App-main">
          <Routes>
            <Route path="/" element={
              <>
                <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
                <div className="tab-content">
                  {activeTab === 'upload' && <ResumeUploader />}
                  {activeTab === 'history' && <PastResumesTable />}
                </div>
              </>
            } />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<ResumeUploader />} />
            <Route path="/history" element={<PastResumesTable />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        <footer className="App-footer">
          <p>&copy; 2025 Resume Analyzer. Built by BALINI MANOJKUMAR.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
