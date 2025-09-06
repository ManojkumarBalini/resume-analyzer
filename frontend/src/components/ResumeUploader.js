import React, { useState } from 'react';
import { uploadResume } from '../services/api';
import ResumeDetails from './ResumeDetails';
import './ResumeUploader.css';

const ResumeUploader = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please select a PDF file');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setProgress(0);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);
    
    try {
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await uploadResume(formData);
      setAnalysis(response.data);
      setProgress(100);
      
      // Clear progress after success
      setTimeout(() => setProgress(0), 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload resume');
      setProgress(0);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  return (
    <div className="resume-uploader">
      <h2>
        <i className="fas fa-file-pdf"></i>
        Upload Resume for Analysis
      </h2>
      
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="file-input-container">
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handleFileChange}
            className="file-input"
            id="resume-file"
            disabled={loading}
          />
          <label 
            htmlFor="resume-file" 
            className={`file-label ${file ? 'has-file' : ''} ${loading ? 'disabled' : ''}`}
          >
            <i className={file ? "fas fa-file-pdf" : "fas fa-cloud-upload-alt"}></i>
            <div className="file-text">
              {file ? file.name : 'Choose PDF file'}
            </div>
            <div className="file-subtext">
              {file ? 'Click to change file' : 'Click to browse your files'}
            </div>
          </label>
        </div>
        
        {progress > 0 && (
          <div className="upload-progress">
            <div 
              className="progress-bar" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={!file || loading}
          className="upload-button"
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Analyzing...
            </>
          ) : (
            <>
              <i className="fas fa-magic"></i>
              Analyze Resume
            </>
          )}
        </button>
      </form>
      
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}
      
      {analysis && <ResumeDetails data={analysis} />}
    </div>
  );
};

export default ResumeUploader;