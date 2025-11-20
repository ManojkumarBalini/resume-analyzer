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
  const [currentStep, setCurrentStep] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        if (selectedFile.size > 5 * 1024 * 1024) {
          setError('File size too large. Please select a PDF under 5MB.');
          setFile(null);
        } else {
          setFile(selectedFile);
          setError('');
          setAnalysis(null);
        }
      } else {
        setError('Please select a PDF file only.');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);
    setProgress(0);
    setCurrentStep('Uploading file...');
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);
    
    try {
      console.log('Starting resume upload process...');
      const formData = new FormData();
      formData.append('resume', file);
      
      setCurrentStep('Parsing PDF content...');
      setProgress(30);
      
      setCurrentStep('Analyzing with AI...');
      setProgress(60);
      
      const response = await uploadResume(formData);
      console.log('Upload response received:', response.data);
      
      if (response.data.success) {
        setCurrentStep('Finalizing analysis...');
        setProgress(95);
        
        setAnalysis(response.data.data);
        setProgress(100);
        setCurrentStep('Analysis complete!');
        
        setTimeout(() => {
          setProgress(0);
          setCurrentStep('');
        }, 2000);
      } else {
        throw new Error(response.data.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to analyze resume. Please try again.';
      setError(errorMessage);
      setProgress(0);
      setCurrentStep('');
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  return (
    <div className="resume-uploader">
      <div className="uploader-header">
        <h2>
          <i className="fas fa-file-pdf"></i>
          AI Resume Analyzer
        </h2>
        <p>Upload your resume to get detailed AI-powered analysis and improvement suggestions</p>
      </div>
      
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
            <div className="file-icon">
              <i className={file ? "fas fa-file-pdf" : "fas fa-cloud-upload-alt"}></i>
            </div>
            <div className="file-content">
              <div className="file-text">
                {file ? file.name : 'Choose PDF Resume'}
              </div>
              <div className="file-subtext">
                {file ? 'Click to change file' : 'Select your resume file (PDF format)'}
              </div>
              <div className="file-size">
                {file ? `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Maximum file size: 5MB'}
              </div>
            </div>
          </label>
        </div>
        
        {(progress > 0 || currentStep) && (
          <div className="upload-progress">
            <div className="progress-header">
              <span className="current-step">{currentStep}</span>
              <span className="progress-percentage">{progress}%</span>
            </div>
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
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
              Analyzing...
            </>
          ) : (
            <>
              <i className="fas fa-magic"></i>
              Analyze My Resume
            </>
          )}
        </button>
      </form>
      
      {error && (
        <div className="error-message">
          <div className="error-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <div className="error-content">
            <h4>Analysis Failed</h4>
            <p>{error}</p>
            <button 
              onClick={() => setError('')}
              className="dismiss-button"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      
      {analysis && (
        <div className="analysis-result">
          <div className="success-message">
            <i className="fas fa-check-circle"></i>
            <span>Resume analyzed successfully!</span>
          </div>
          <ResumeDetails data={analysis} />
        </div>
      )}
    </div>
  );
};

export default ResumeUploader;
