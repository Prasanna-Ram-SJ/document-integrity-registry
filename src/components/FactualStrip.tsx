import React from 'react';

export const FactualStrip: React.FC = () => {
  return (
    <section className="factual-strip-section" aria-label="Core Technical Principles">
      <div className="container">
        <div className="factual-strip">
          <div className="factual-item">
            <h2 className="factual-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--dp-color-accent)', flexShrink: 0 }} aria-hidden="true">
                <path d="M4 7V4h16v3"/>
                <path d="M9 20h6"/>
                <path d="M12 4v16"/>
              </svg>
              <span>SHA-256 fingerprint</span>
            </h2>
            <p className="factual-desc">
              Computed entirely in your browser using the standard Web Crypto API. Formatted as 64 lowercase hexadecimal characters.
            </p>
          </div>

          <div className="factual-item">
            <h2 className="factual-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--dp-color-accent)', flexShrink: 0 }} aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              <span>File stays in your browser</span>
            </h2>
            <p className="factual-desc">
              Your document is never uploaded, cached, stored, or transmitted. Only the calculated fingerprint and label are submitted to the chain.
            </p>
          </div>

          <div className="factual-item">
            <h2 className="factual-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--dp-color-accent)', flexShrink: 0 }} aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span>Tezos Shadownet</span>
            </h2>
            <p className="factual-desc">
              Registrations are permanently recorded on the Shadownet testnet smart contract, with on-chain administrator access enforcement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
