import React from 'react';
import './ResumeDetails.css';

const ResumeDetails = ({ data }) => {
  const renderList = (items) => {
    if (!items || items.length === 0) return <p>No information available</p>;
    
    return (
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  };

  const renderExperience = (experiences) => {
    if (!experiences || experiences.length === 0) return <p>No experience information available</p>;
    
    return experiences.map((exp, index) => {
      const delay = index * 100;
      return (
        <div key={index} className={`animate-fadeIn delay-${delay}`}>
          <h4>{exp.role} at {exp.company}</h4>
          <p className="duration">{exp.duration}</p>
          {exp.description && (
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
    if (!education || education.length === 0) return <p>No education information available</p>;
    
    return education.map((edu, index) => {
      const delay = index * 100;
      return (
        <div key={index} className={`animate-fadeIn delay-${delay}`}>
          <h4>{edu.degree}</h4>
          <p>{edu.institution}, {edu.graduation_year}</p>
        </div>
      );
    });
  };

  const renderUpskillSuggestions = (suggestions) => {
    if (!suggestions || suggestions.length === 0) return <p>No upskill suggestions available</p>;
    
    return (
      <div className="upskill-suggestions">
        {suggestions.map((suggestion, index) => {
          const delay = index * 100;
          return (
            <div key={index} className={`skill-pill animate-fadeIn delay-${delay}`}>
              <i className="fas fa-lightbulb"></i>
              {suggestion}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="resume-details">
      <h2>
        <i className="fas fa-chart-line"></i>
        Resume Analysis Results
      </h2>
      
      <div className="section">
        <h3><i className="fas fa-user-circle"></i> Personal Details</h3>
        <p><strong>Name:</strong> {data.name || 'Not provided'}</p>
        <p><strong>Email:</strong> {data.email || 'Not provided'}</p>
        <p><strong>Phone:</strong> {data.phone || 'Not provided'}</p>
        <p><strong>LinkedIn:</strong> {data.linkedin_url || 'Not provided'}</p>
        <p><strong>Portfolio:</strong> {data.portfolio_url || 'Not provided'}</p>
      </div>
      
      <div className="section">
        <h3><i className="fas fa-file-alt"></i> Summary</h3>
        <p>{data.summary || 'No summary available'}</p>
      </div>
      
      <div className="section">
        <h3><i className="fas fa-briefcase"></i> Work Experience</h3>
        {renderExperience(data.work_experience)}
      </div>
      
      <div className="section">
        <h3><i className="fas fa-graduation-cap"></i> Education</h3>
        {renderEducation(data.education)}
      </div>
      
      <div className="section">
        <h3><i className="fas fa-code"></i> Technical Skills</h3>
        {renderList(data.technical_skills)}
      </div>
      
      <div className="section">
        <h3><i className="fas fa-comments"></i> Soft Skills</h3>
        {renderList(data.soft_skills)}
      </div>
      
      <div className="section">
        <h3><i className="fas fa-project-diagram"></i> Projects</h3>
        {data.projects && data.projects.length > 0 ? (
          data.projects.map((project, index) => {
            const delay = index * 100;
            return (
              <div key={index} className={`project-item animate-fadeIn delay-${delay}`}>
                <h4>{project.name}</h4>
                <p>{project.description}</p>
                {project.technologies && project.technologies.length > 0 && (
                  <p><strong>Technologies:</strong> {project.technologies.join(', ')}</p>
                )}
              </div>
            );
          })
        ) : (
          <p>No projects information available</p>
        )}
      </div>
      
      <div className="section">
        <h3><i className="fas fa-award"></i> Certifications</h3>
        {renderList(data.certifications)}
      </div>
      
      <div className="section analysis">
        <h3><i className="fas fa-brain"></i> AI Analysis</h3>
        <div className="rating">
          <strong>Resume Rating:</strong> {data.resume_rating}/10
        </div>
        <div className="improvement">
          <h4><i className="fas fa-tools"></i> Areas for Improvement:</h4>
          <p>{data.improvement_areas || 'No specific improvement areas identified'}</p>
        </div>
        <div className="upskill">
          <h4><i className="fas fa-rocket"></i> Upskill Suggestions:</h4>
          {renderUpskillSuggestions(data.upskill_suggestions)}
        </div>
      </div>
    </div>
  );
};

export default ResumeDetails;
