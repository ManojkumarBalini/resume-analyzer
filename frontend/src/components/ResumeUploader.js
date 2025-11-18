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
        setAnalysis(null); // Clear previous analysis
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
    setAnalysis(null);
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
      console.log('Starting file upload...');
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await uploadResume(formData);
      console.log('Upload response:', response.data);
      
      if (response.data.success) {
        setAnalysis(response.data.data);
        setProgress(100);
        console.log('Analysis completed successfully');
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
      
      // Clear progress after success
      setTimeout(() => setProgress(0), 1000);
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to upload resume. Please try again.';
      setError(errorMessage);
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
      
      <p className="upload-description">
        Upload your PDF resume to get AI-powered analysis and improvement suggestions.
      </p>
      
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
            <div className="file-size">
              {file ? `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Max size: 5MB'}
            </div>
          </label>
        </div>
        
        {progress > 0 && (
          <div className="upload-progress">
            <div className="progress-text">
              {progress < 100 ? 'Processing...' : 'Complete!'}
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-percentage">{progress}%</div>
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={!file || loading}
          className={`upload-button ${(!file || loading) ? 'disabled' : ''}`}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Analyzing Resume...
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
          <div className="error-content">
            <strong>Upload Failed</strong>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {analysis && (
        <div className="analysis-result">
          <ResumeDetails data={analysis} />
        </div>
      )}
    </div>
  );
};

export default ResumeUploader;
