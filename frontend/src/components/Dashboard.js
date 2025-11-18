import React, { useState, useEffect } from 'react';
import { getResumeStats, getResumes } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentResumes, setRecentResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching dashboard data...');
      
      const [statsRes, resumesRes] = await Promise.all([
        getResumeStats(),
        getResumes({ limit: 5 })
      ]);

      console.log('Dashboard stats:', statsRes.data);
      console.log('Recent resumes:', resumesRes.data);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      } else {
        throw new Error(statsRes.data.error || 'Failed to load statistics');
      }

      if (resumesRes.data.success) {
        setRecentResumes(resumesRes.data.data || []);
      } else {
        throw new Error(resumesRes.data.error || 'Failed to load recent resumes');
      }

    } catch (err) {
      console.error('Dashboard error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.message || 
                          'Failed to load dashboard data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Unknown date';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-container">
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            <div className="error-content">
              <h3>Error Loading Dashboard</h3>
              <p>{error}</p>
              <button onClick={fetchDashboardData} className="retry-button">
                <i className="fas fa-redo"></i>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>
          <i className="fas fa-tachometer-alt"></i>
          Dashboard
        </h1>
        <p>Overview of your resume analysis</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">
              <i className="fas fa-file-pdf"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.totalResumes || 0}</h3>
              <p>Total Resumes</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <i className="fas fa-star"></i>
            </div>
            <div className="stat-content">
              <h3>{(stats.averageRating || 0).toFixed(1)}/10</h3>
              <p>Average Rating</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.monthlyUploads?.[0]?.count || 0}</h3>
              <p>This Month</p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">
              <i className="fas fa-code"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.topSkills?.length || 0}</h3>
              <p>Skills Tracked</p>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        <div className="recent-resumes">
          <h2>
            <i className="fas fa-history"></i>
            Recent Resumes
          </h2>
          {recentResumes.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-folder-open"></i>
              <p>No resumes analyzed yet</p>
              <p className="empty-subtext">Upload your first resume to see it here</p>
            </div>
          ) : (
            <div className="resumes-list">
              {recentResumes.map((resume) => (
                <div key={resume._id} className="resume-item">
                  <div className="resume-info">
                    <h4>{resume.name || 'Unknown Candidate'}</h4>
                    <p className="resume-meta">
                      {resume.email || 'No email'} • {formatDate(resume.createdAt)}
                    </p>
                    <p className="resume-filename">
                      {resume.file_name}
                    </p>
                  </div>
                  <div className="resume-rating">
                    {resume.resume_rating ? (
                      <span className={`rating-pill rating-${Math.floor(resume.resume_rating / 2)}`}>
                        {resume.resume_rating}/10
                      </span>
                    ) : (
                      <span className="rating-pill rating-0">No rating</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {stats && stats.topSkills && stats.topSkills.length > 0 && (
          <div className="skills-section">
            <h2>
              <i className="fas fa-code"></i>
              Top Skills
            </h2>
            <div className="skills-grid">
              {stats.topSkills.slice(0, 8).map((skill, index) => (
                <div key={skill._id || index} className="skill-item">
                  <span className="skill-name">{skill._id || 'Unknown Skill'}</span>
                  <span className="skill-count">{skill.count || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats && stats.topSkills && stats.topSkills.length === 0 && (
          <div className="skills-section">
            <h2>
              <i className="fas fa-code"></i>
              Skills
            </h2>
            <div className="empty-state">
              <i className="fas fa-chart-bar"></i>
              <p>No skills data available yet</p>
              <p className="empty-subtext">Analyze more resumes to see skill trends</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
