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
      const response = await getResumes();
      setResumes(response.data);
    } catch (err) {
      setError('Failed to fetch resumes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const response = await getResume(id);
      setSelectedResume(response.data);
      setModalOpen(true);
    } catch (err) {
      setError('Failed to fetch resume details');
      console.error(err);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedResume(null);
  };

  if (loading) return (
    <div className="loading">
      <i className="fas fa-spinner fa-spin"></i>
      <p>Loading resumes...</p>
    </div>
  );
  
  if (error) return (
    <div className="error">
      <i className="fas fa-exclamation-triangle"></i>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="past-resumes">
      <h2>
        <i className="fas fa-history"></i>
        Previously Analyzed Resumes
      </h2>
      
      {resumes.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-folder-open"></i>
          <h3>No Resumes Analyzed Yet</h3>
          <p>Upload your first resume to see it here</p>
        </div>
      ) : (
        <>
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
                <tr key={resume.id} className="animate-fadeIn">
                  <td>{resume.name || 'N/A'}</td>
                  <td>{resume.email || 'N/A'}</td>
                  <td>{resume.phone || 'N/A'}</td>
                  <td>{resume.file_name}</td>
                  <td>{new Date(resume.uploaded_at).toLocaleString()}</td>
                  <td>
                    {resume.resume_rating ? (
                      <span className="rating-pill">
                        {resume.resume_rating}/10
                      </span>
                    ) : 'N/A'}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleViewDetails(resume.id)}
                      className="details-button"
                    >
                      <i className="fas fa-eye"></i>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {modalOpen && selectedResume && (
            <div className="modal-overlay" onClick={closeModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={closeModal}>
                  <i className="fas fa-times"></i>
                </button>
                <ResumeDetails data={selectedResume} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PastResumesTable;