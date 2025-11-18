import React, { useState, useEffect } from 'react';
import { getResumes, getResume } from '../services/api';
import ResumeDetails from './ResumeDetails';
import './PastResumesTable.css';

const PastResumesTable = () => {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching resumes...');
      
      const response = await getResumes();
      console.log('Resumes response:', response.data);
      
      if (response.data.success) {
        setResumes(response.data.data || []);
      } else {
        throw new Error(response.data.error || 'Failed to fetch resumes');
      }
    } catch (err) {
      console.error('Error fetching resumes:', err);
      const errorMessage = err.response?.data?.error || 
                          err.message || 
                          'Failed to fetch resumes. Please check your connection.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      console.log('Fetching resume details:', id);
      const response = await getResume(id);
      
      if (response.data.success) {
        setSelectedResume(response.data.data);
        setModalOpen(true);
      } else {
        throw new Error(response.data.error || 'Failed to fetch resume details');
      }
    } catch (err) {
      console.error('Error fetching resume details:', err);
      const errorMessage = err.response?.data?.error || 
                          err.message || 
                          'Failed to fetch resume details';
      setError(errorMessage);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedResume(null);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading resumes...</p>
      </div>
    </div>
  );

  return (
    <div className="past-resumes">
      <div className="resumes-header">
        <h2>
          <i className="fas fa-history"></i>
          Previously Analyzed Resumes
        </h2>
        <button 
          onClick={fetchResumes}
          className="refresh-button"
          disabled={loading}
        >
          <i className="fas fa-redo"></i>
          Refresh
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <div className="error-content">
            <strong>Error Loading Resumes</strong>
            <p>{error}</p>
            <button onClick={fetchResumes} className="retry-button">
              <i className="fas fa-redo"></i>
              Try Again
            </button>
          </div>
        </div>
      )}

      {!error && resumes.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-folder-open"></i>
          <h3>No Resumes Analyzed Yet</h3>
          <p>Upload your first resume to see it here</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="resumes-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>File Name</th>
                  <th>Uploaded At</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((resume) => (
                  <tr key={resume._id} className="resume-row">
                    <td className="name-cell">{resume.name || 'N/A'}</td>
                    <td className="email-cell">{resume.email || 'N/A'}</td>
                    <td className="phone-cell">{resume.phone || 'N/A'}</td>
                    <td className="filename-cell" title={resume.file_name}>
                      {resume.file_name.length > 30 
                        ? resume.file_name.substring(0, 30) + '...' 
                        : resume.file_name
                      }
                    </td>
                    <td className="date-cell">{formatDate(resume.createdAt)}</td>
                    <td className="rating-cell">
                      {resume.resume_rating ? (
                        <span className={`rating-pill rating-${Math.floor(resume.resume_rating / 2)}`}>
                          {resume.resume_rating}/10
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td className="actions-cell">
                      <button 
                        onClick={() => handleViewDetails(resume._id)}
                        className="details-button"
                        title="View full analysis"
                      >
                        <i className="fas fa-eye"></i>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="resumes-count">
            Showing {resumes.length} resume{resumes.length !== 1 ? 's' : ''}
          </div>
          
          {modalOpen && selectedResume && (
            <div className="modal-overlay" onClick={closeModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Resume Analysis Details</h3>
                  <button className="close-button" onClick={closeModal}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="modal-body">
                  <ResumeDetails data={selectedResume} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PastResumesTable;
