import React from 'react';

interface HeroProps {
  onSelectTab: (tab: 'verify' | 'register') => void;
}

export const Hero: React.FC<HeroProps> = ({ onSelectTab }) => {
  return (
    <section className="hero-section" id="top" aria-labelledby="hero-title">
      <div className="container">
        <div className="hero-grid">
          {/* Column 1: Copy and Actions (~1.45 width) */}
          <div className="hero-text">
            <div className="hero-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              <span>Student Clubs &amp; Project Teams</span>
            </div>

            <h1 id="hero-title" className="hero-heading">
              Know whether a shared document still matches its registered version.
            </h1>

            <p className="hero-description">
              Calculate a SHA-256 fingerprint in your browser, register it with a label on Tezos Shadownet, and later check a copy using its record ID.
            </p>

            <div className="hero-actions">
              <a
                href="#verify"
                onClick={() => onSelectTab('verify')}
                className="btn btn-primary"
              >
                Verify a document
              </a>
              <a
                href="#register"
                onClick={() => onSelectTab('register')}
                className="btn btn-secondary"
              >
                Register a version
              </a>
            </div>
          </div>

          {/* Column 2: Real Product Flow Diagram (SVG) */}
          <div className="hero-diagram-card" aria-label="Document integrity verification flow diagram">
            <div className="diagram-header">
              <span>Cryptographic Lifecycle Flow</span>
              <span style={{ fontFamily: 'var(--dp-font-mono)', fontSize: '11px', color: 'var(--dp-color-accent)' }}>
                Client-Side Verification
              </span>
            </div>

            <div className="diagram-svg-container">
              <svg
                viewBox="0 0 460 310"
                className="diagram-svg"
                role="img"
                aria-label="Diagram showing selected local file hashed with SHA-256 in browser, registered on Tezos Shadownet with label and record ID, and later verified by comparing digests"
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#074ce0" />
                  </marker>
                  <marker
                    id="arrowhead-muted"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#8c93a0" />
                  </marker>
                </defs>

                {/* Step 1: Local File Box */}
                <rect x="16" y="24" width="120" height="96" rx="8" fill="#ffffff" stroke="#dde0e6" strokeWidth="1.5"/>
                <rect x="28" y="38" width="22" height="28" rx="2" fill="#eef3ff" stroke="#074ce0" strokeWidth="1.2"/>
                <line x1="33" y1="46" x2="45" y2="46" stroke="#074ce0" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="33" y1="52" x2="43" y2="52" stroke="#074ce0" strokeWidth="1.2" strokeLinecap="round"/>
                <text x="56" y="48" fontFamily="Host Grotesk, sans-serif" fontSize="12" fontWeight="700" fill="#16191f">Local File</text>
                <text x="56" y="62" fontFamily="Instrument Sans, sans-serif" fontSize="10" fill="#454c58">PDF / DOCX</text>
                <rect x="24" y="80" width="104" height="26" rx="4" fill="#f3f4f6"/>
                <text x="28" y="96" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#0b824c">✓ Stays in browser</text>

                {/* Arrow 1 -> 2 */}
                <path d="M 136 72 L 176 72" fill="none" stroke="#074ce0" strokeWidth="2" markerEnd="url(#arrowhead)"/>

                {/* Step 2: Browser Web Crypto SHA-256 Box */}
                <rect x="184" y="24" width="128" height="96" rx="8" fill="#ffffff" stroke="#dde0e6" strokeWidth="1.5"/>
                <circle cx="206" cy="52" r="12" fill="#eef3ff" stroke="#074ce0" strokeWidth="1.2"/>
                <text x="202" y="56" fontFamily="JetBrains Mono, monospace" fontSize="11" fontWeight="700" fill="#074ce0">#</text>
                <text x="226" y="48" fontFamily="Host Grotesk, sans-serif" fontSize="12" fontWeight="700" fill="#16191f">Web Crypto</text>
                <text x="226" y="62" fontFamily="Instrument Sans, sans-serif" fontSize="10" fill="#454c58">SHA-256 Digest</text>
                <rect x="192" y="78" width="112" height="30" rx="4" fill="#f3f4f6"/>
                <text x="196" y="92" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#16191f">e3b0c44298fc1c...</text>
                <text x="196" y="103" fontFamily="JetBrains Mono, monospace" fontSize="7" fill="#454c58">64 lowercase hex</text>

                {/* Arrow 2 -> 3 */}
                <path d="M 312 72 L 340 72" fill="none" stroke="#074ce0" strokeWidth="2" markerEnd="url(#arrowhead)"/>

                {/* Step 3: Tezos Shadownet Registry Box */}
                <rect x="348" y="16" width="98" height="112" rx="8" fill="#16191f" stroke="#2d3340" strokeWidth="1.5"/>
                <text x="358" y="38" fontFamily="Host Grotesk, sans-serif" fontSize="11" fontWeight="700" fill="#ffffff">Tezos Shadownet</text>
                <line x1="358" y1="46" x2="436" y2="46" stroke="#2d3340" strokeWidth="1"/>
                <text x="358" y="60" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#d0d4dd">ID: UUID v4</text>
                <text x="358" y="74" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#d0d4dd">label: string</text>
                <text x="358" y="88" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#72a5ff">sha256: digest</text>
                <text x="358" y="102" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#d0d4dd">registrar &amp; time</text>
                <rect x="358" y="112" width="78" height="12" rx="2" fill="#074ce0"/>
                <text x="362" y="121" fontFamily="Instrument Sans, sans-serif" fontSize="8" fontWeight="600" fill="#ffffff">Admin Signed</text>

                {/* Arrow 3 down to Comparison */}
                <path d="M 397 128 L 397 172 L 320 172" fill="none" stroke="#8c93a0" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrowhead-muted)"/>

                {/* Step 4: Verification / Later Comparison Area */}
                <rect x="16" y="152" width="296" height="142" rx="8" fill="#ffffff" stroke="#dde0e6" strokeWidth="1.5"/>
                <text x="30" y="174" fontFamily="Host Grotesk, sans-serif" fontSize="13" fontWeight="700" fill="#16191f">Later File Verification</text>
                <text x="30" y="190" fontFamily="Instrument Sans, sans-serif" fontSize="11" fill="#454c58">
                  File + Record ID → Hash in browser → Compare with on-chain record
                </text>

                {/* Result Outcomes pills */}
                <g transform="translate(30, 204)">
                  {/* MATCH */}
                  <rect x="0" y="0" width="80" height="42" rx="6" fill="#edf8f2" stroke="#b6e4cc" strokeWidth="1"/>
                  <text x="8" y="18" fontFamily="Host Grotesk, sans-serif" fontSize="11" fontWeight="700" fill="#0b824c">MATCH</text>
                  <text x="8" y="32" fontFamily="Instrument Sans, sans-serif" fontSize="9" fill="#0b824c">Digests equal</text>

                  {/* MISMATCH */}
                  <rect x="90" y="0" width="80" height="42" rx="6" fill="#fff8eb" stroke="#fae1b3" strokeWidth="1"/>
                  <text x="98" y="18" fontFamily="Host Grotesk, sans-serif" fontSize="11" fontWeight="700" fill="#b25e02">MISMATCH</text>
                  <text x="98" y="32" fontFamily="Instrument Sans, sans-serif" fontSize="9" fill="#b25e02">Bytes differ</text>

                  {/* RECORD NOT FOUND */}
                  <rect x="180" y="0" width="88" height="42" rx="6" fill="#f0f2f5" stroke="#dde0e6" strokeWidth="1"/>
                  <text x="186" y="18" fontFamily="Host Grotesk, sans-serif" fontSize="10" fontWeight="700" fill="#454c58">NOT FOUND</text>
                  <text x="186" y="32" fontFamily="Instrument Sans, sans-serif" fontSize="9" fill="#454c58">Unknown ID</text>
                </g>

                <text x="30" y="278" fontFamily="Instrument Sans, sans-serif" fontSize="10" fill="#454c58">
                  • Read-only view query • No wallet required for verification
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
