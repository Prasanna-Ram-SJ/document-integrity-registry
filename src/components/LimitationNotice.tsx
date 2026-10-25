import React from 'react';

export const LimitationNotice: React.FC = () => {
  return (
    <section className="limitation-section" aria-labelledby="limitation-title">
      <div className="container">
        <div className="limitation-card">
          <div className="limitation-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div className="limitation-content">
            <h3 id="limitation-title">What a Match Does and Does Not Mean</h3>
            <p>
              A match confirms that the file matches the fingerprint registered under that record ID. It does not prove who created, approved, or published the file, and it does not certify safety or authenticity.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
