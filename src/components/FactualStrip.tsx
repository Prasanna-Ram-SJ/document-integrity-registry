import React from 'react';

export const FactualStrip: React.FC = () => {
  return (
    <section className="factual-strip-section" aria-label="Core Technical Principles">
      <div className="container">
        <div className="factual-strip">
          <div className="factual-item">
            <h2 className="factual-title">SHA-256 fingerprint</h2>
            <p className="factual-desc">
              Computed entirely in your browser using the standard Web Crypto API. Formatted as 64 lowercase hexadecimal characters.
            </p>
          </div>

          <div className="factual-item">
            <h2 className="factual-title">File stays in your browser</h2>
            <p className="factual-desc">
              Your document is never uploaded, cached, stored, or transmitted. Only the calculated fingerprint and label are submitted to the chain.
            </p>
          </div>

          <div className="factual-item">
            <h2 className="factual-title">Tezos Shadownet</h2>
            <p className="factual-desc">
              Registrations are permanently recorded on the Shadownet testnet smart contract, with on-chain administrator access enforcement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
