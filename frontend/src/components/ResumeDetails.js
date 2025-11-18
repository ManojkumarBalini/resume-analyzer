import React from 'react';
import './ResumeDetails.css';

const ResumeDetails = ({ data }) => {
  // Safe data access with fallbacks
  const safeData = data || {};
  
  const renderList = (items, fallbackText = "No information available") => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return <p className="no-data">{fallbackText}</p>;
    }
    
    return (
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  };

  const renderExperience = (experiences) => {
    if (!experiences || !Array.isArray(experiences) || experiences.length === 0) {
      return <p className="no-data">No experience information available</p>;
    }
    
    return experiences.map((exp, index) => {
      if (!exp) return null;
      
      return (
        <div key={index} className="experience-item">
          <h4>{exp.role || 'Unknown Role'} {exp.company ? `at ${exp.company}` : ''}</h4>
          {exp.duration && <p className="duration">{exp.duration}</p>}
          {exp.description && Array.isArray(exp.description) && exp.description.length > 0 && (
            <ul>
              {exp.description.map((desc, i) => (
                <li key={i}>{desc}</li>
              ))}
            </ul>
          )}
        </div>
      );
    });
  };

  const renderEducation = (education) => {
    if (!education || !Array.isArray(education) || education.length === 0) {
      return <p className="no-data">No education information available</p>;
    }
    
    return education.map((edu, index) => {
      if (!edu) return null;
      
      return (
        <div key={index} className="education-item">
          <h4>{edu.degree || 'Unknown Degree'}</h4>
          <p>{[edu.institution, edu.graduation_year].filter(Boolean).join(', ')}</p>
        </div>
      );
    });
  };

  const renderProjects = (projects) => {
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      return <p className="no-data">No projects information available</p>;
    }
    
    return projects.map((project, index) => {
      if (!project) return null;
      
      return (
        <div key={index} className="project-item">
          <h4>{project.name || 'Unnamed Project'}</h4>
          <p className="project-description">{project.description || 'No description available'}</p>
          {project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && (
            <p className="project-technologies">
              <strong>Technologies:</strong> {project.technologies.join(', ')}
            </p>
          )}
        </div>
      );
    });
  };

  const renderUpskillSuggestions = (suggestions) => {
    if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
      return <p className="no-data">No upskill suggestions available</p>;
    }
    
    return (
      <div className="upskill-suggestions">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="skill-pill">
            <i className="fas fa-lightbulb"></i>
            {suggestion}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="resume-details">
      <div className="resume-header">
        <h2>
          <i className="fas fa-chart-line"></i>
          Resume Analysis Results
        </h2>
        {safeData.resume_rating && (
          <div className="overall-rating">
            Overall Rating: <span className="rating-value">{safeData.resume_rating}/10</span>
          </div>
        )}
      </div>
      
      <div className="section personal-details">
        <h3><i className="fas fa-user-circle"></i> Personal Details</h3>
        <div className="details-grid">
          <div className="detail-item">
            <strong>Name:</strong> {safeData.name || 'Not provided'}
          </div>
          <div className="detail-item">
            <strong>Email:</strong> {safeData.email || 'Not provided'}
          </div>
          <div className="detail-item">
            <strong>Phone:</strong> {safeData.phone || 'Not provided'}
          </div>
          <div className="detail-item">
            <strong>LinkedIn:</strong> {safeData.linkedin_url || 'Not provided'}
          </div>
          <div className="detail-item">
            <strong>Portfolio:</strong> {safeData.portfolio_url || 'Not provided'}
          </div>
        </div>
      </div>
      
      <div className="section">
        <h3><i className="fas fa-file-alt"></i> Summary</h3>
        <p className="summary-text">{safeData.summary || 'No summary available'}</p>
      </div>
      
      <div className="section">
        <h3><i className="fas fa-briefcase"></i> Work Experience</h3>
        {renderExperience(safeData.work_experience)}
      </div>
      
      <div className="section">
        <h3><i className="fas fa-graduation-cap"></i> Education</h3>
        {renderEducation(safeData.education)}
      </div>
      
      <div className="skills-section">
        <div className="skill-column">
          <h3><i className="fas fa-code"></i> Technical Skills</h3>
          {renderList(safeData.technical_skills, "No technical skills identified")}
        </div>
        <div className="skill-column">
          <h3><i className="fas fa-comments"></i> Soft Skills</h3>
          {renderList(safeData.soft_skills, "No soft skills identified")}
        </div>
      </div>
      
      <div className="section">
        <h3><i className="fas fa-project-diagram"></i> Projects</h3>
        {renderProjects(safeData.projects)}
      </div>
      
      <div className="section">
        <h3><i className="fas fa-award"></i> Certifications</h3>
        {renderList(safeData.certifications, "No certifications information available")}
      </div>
      
      <div className="section analysis">
        <h3><i className="fas fa-brain"></i> AI Analysis</h3>
        <div className="rating-section">
          <div className="rating">
            <strong>Resume Rating:</strong> 
            <span className="rating-value-large">
              {safeData.resume_rating ? `${safeData.resume_rating}/10` : 'Not rated'}
            </span>
          </div>
        </div>
        <div className="improvement">
          <h4><i className="fas fa-tools"></i> Areas for Improvement:</h4>
          <p>{safeData.improvement_areas || 'No specific improvement areas identified'}</p>
        </div>
        <div className="upskill">
          <h4><i className="fas fa-rocket"></i> Upskill Suggestions:</h4>
          {renderUpskillSuggestions(safeData.upskill_suggestions)}
        </div>
      </div>
    </div>
  );
};

export default ResumeDetails;
