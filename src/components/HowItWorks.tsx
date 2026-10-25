import React from 'react';

export const HowItWorks: React.FC = () => {
  return (
    <section className="process-section" id="how-it-works" aria-labelledby="process-title">
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
          <h2 id="process-title" style={{ fontSize: '32px', marginBottom: '12px' }}>
            How Document Integrity Verification Works
          </h2>
          <p style={{ fontSize: 'var(--dp-typography-body)' }}>
            A lightweight, cryptographically rigorous workflow designed for student clubs, research groups, and project teams.
          </p>
        </div>

        <div className="process-grid">
          <div className="process-card">
            <span className="process-step-num">STEP 01</span>
            <h3 className="process-card-title">Select a Local Document</h3>
            <p className="process-card-desc">
              Select any document file on your computer. The file is accessed entirely via the browser’s local File API and never uploaded or transmitted to any server.
            </p>
          </div>

          <div className="process-card">
            <span className="process-step-num">STEP 02</span>
            <h3 className="process-card-title">Compute SHA-256 Locally</h3>
            <p className="process-card-desc">
              The browser computes the file’s 256-bit cryptographic digest using the standard Web Crypto API and formats it into 64 lowercase hexadecimal characters.
            </p>
          </div>

          <div className="process-card">
            <span className="process-step-num">STEP 03</span>
            <h3 className="process-card-title">Authorized Registrar Signs</h3>
            <p className="process-card-desc">
              An authorized registrar reviews the label, record ID, and fingerprint in Temple wallet, then signs an on-chain transaction recorded on Tezos Shadownet.
            </p>
          </div>

          <div className="process-card">
            <span className="process-step-num">STEP 04</span>
            <h3 className="process-card-title">Verify Anytime Without a Wallet</h3>
            <p className="process-card-desc">
              Anyone with a file and its Record ID can verify the file against the on-chain view. Verification is strictly read-only and requires no wallet, signature, or fees.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
