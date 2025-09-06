import React, { useState, useEffect } from 'react';
import TabNavigation from './components/TabNavigation';
import ResumeUploader from './components/ResumeUploader';
import PastResumesTable from './components/PastResumesTable';
import './styles/App.css';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <div className="App">
      <header className="App-header">
        <h1>Resume Analyzer</h1>
        <p>AI-powered resume analysis and feedback</p>
      </header>
      
      <main className="App-main">
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="tab-content">
          {activeTab === 'upload' && <ResumeUploader />}
          {activeTab === 'history' && <PastResumesTable />}
        </div>
      </main>
      
      <footer className="App-footer">
        <p>&copy; Done by BALINI MANOJKUMAR.</p>
      </footer>
    </div>
  );
}

export default App;