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
      const [statsRes, resumesRes] = await Promise.all([
        getResumeStats(),
        getResumes({ limit: 5 })
      ]);

      setStats(statsRes.data.data);
      setRecentResumes(resumesRes.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-button">
            <i className="fas fa-redo"></i>
            Try Again
          </button>
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
              <h3>{stats.totalResumes}</h3>
              <p>Total Resumes</p>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <i className="fas fa-star"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.averageRating.toFixed(1)}/10</h3>
              <p>Average Rating</p>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.monthlyUploads[0]?.count || 0}</h3>
              <p>This Month</p>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">
              <i className="fas fa-code"></i>
            </div>
            <div className="stat-content">
              <h3>{stats.topSkills.length}</h3>
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
            </div>
          ) : (
            <div className="resumes-list">
              {recentResumes.map((resume) => (
                <div key={resume._id} className="resume-item">
                  <div className="resume-info">
                    <h4>{resume.name || 'Unknown'}</h4>
                    <p className="resume-meta">
                      {resume.email} • {formatDate(resume.createdAt)}
                    </p>
                  </div>
                  <div className="resume-rating">
                    <span className={`rating-pill rating-${Math.floor(resume.resume_rating / 2)}`}>
                      {resume.resume_rating}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {stats && stats.topSkills.length > 0 && (
          <div className="skills-section">
            <h2>
              <i className="fas fa-code"></i>
              Top Skills
            </h2>
            <div className="skills-grid">
              {stats.topSkills.slice(0, 8).map((skill, index) => (
                <div key={skill._id} className="skill-item">
                  <span className="skill-name">{skill._id}</span>
                  <span className="skill-count">{skill.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
