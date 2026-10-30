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
              Decentralized Authentication and Record Tracking
            </h1>

            <p className="hero-description">
              Check whether a document matches its registered version. DART compares digital fingerprints with records on Tezos and gives you a clear Match or Mismatch result.
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
          <div className="hero-diagram-card" aria-label="D.A.R.T verification flow diagram">
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
                    <polygon points="0 0, 8 3, 0 6" fill="#5B3DF5" />
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
                <rect x="16" y="24" width="116" height="96" rx="8" className="diagram-box" fill="#ffffff" stroke="#dde0e6" strokeWidth="1.5"/>
                <rect x="26" y="38" width="22" height="28" rx="2" className="diagram-pill-file" fill="#E8DEFF" stroke="#5B3DF5" strokeWidth="1.2"/>
                <line x1="31" y1="46" x2="43" y2="46" stroke="#5B3DF5" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="31" y1="52" x2="41" y2="52" stroke="#5B3DF5" strokeWidth="1.2" strokeLinecap="round"/>
                <text x="54" y="48" fontFamily="Host Grotesk, sans-serif" fontSize="12" fontWeight="700" className="diagram-text-main" fill="#16191f">Local File</text>
                <text x="54" y="62" fontFamily="Instrument Sans, sans-serif" fontSize="10" className="diagram-text-sub" fill="#454c58">PDF / DOCX</text>
                <rect x="22" y="80" width="104" height="26" rx="4" className="diagram-inner-box" fill="#f3f4f6"/>
                <text x="26" y="96" fontFamily="JetBrains Mono, monospace" fontSize="9" className="diagram-text-secure" fill="#0b824c">✓ Stays in browser</text>

                {/* Arrow 1 -> 2 */}
                <path d="M 132 72 L 158 72" fill="none" stroke="#5B3DF5" strokeWidth="2" markerEnd="url(#arrowhead)"/>

                {/* Step 2: Browser Web Crypto SHA-256 Box */}
                <rect x="166" y="24" width="122" height="96" rx="8" className="diagram-box" fill="#ffffff" stroke="#dde0e6" strokeWidth="1.5"/>
                <circle cx="188" cy="52" r="12" className="diagram-pill-crypto" fill="#E8DEFF" stroke="#5B3DF5" strokeWidth="1.2"/>
                <text x="184" y="56" fontFamily="JetBrains Mono, monospace" fontSize="11" fontWeight="700" fill="#5B3DF5">#</text>
                <text x="208" y="48" fontFamily="Host Grotesk, sans-serif" fontSize="12" fontWeight="700" className="diagram-text-main" fill="#16191f">Web Crypto</text>
                <text x="208" y="62" fontFamily="Instrument Sans, sans-serif" fontSize="10" className="diagram-text-sub" fill="#454c58">SHA-256 Digest</text>
                <rect x="174" y="78" width="106" height="30" rx="4" className="diagram-inner-box" fill="#f3f4f6"/>
                <text x="178" y="92" fontFamily="JetBrains Mono, monospace" fontSize="8" className="diagram-text-mono" fill="#16191f">e3b0c44298fc1c...</text>
                <text x="178" y="103" fontFamily="JetBrains Mono, monospace" fontSize="7" className="diagram-text-sub" fill="#454c58">64 lowercase hex</text>

                {/* Arrow 2 -> 3 */}
                <path d="M 288 72 L 314 72" fill="none" stroke="#5B3DF5" strokeWidth="2" markerEnd="url(#arrowhead)"/>

                {/* Step 3: Tezos Shadownet Registry Box */}
                <rect x="320" y="16" width="128" height="118" rx="8" className="diagram-chain-box" fill="#16191f" stroke="#2d3340" strokeWidth="1.5"/>
                <text x="330" y="37" fontFamily="Host Grotesk, sans-serif" fontSize="10.5" fontWeight="700" fill="#ffffff">Tezos Shadownet</text>
                <line x1="330" y1="45" x2="438" y2="45" stroke="#2d3340" strokeWidth="1"/>
                <text x="330" y="59" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#d0d4dd">ID: UUID v4</text>
                <text x="330" y="73" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#d0d4dd">label: string</text>
                <text x="330" y="87" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#E8DEFF">sha256: digest</text>
                <text x="330" y="101" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#d0d4dd">registrar &amp; time</text>
                <rect x="330" y="109" width="84" height="15" rx="3" fill="#5B3DF5"/>
                <text x="336" y="120" fontFamily="Instrument Sans, sans-serif" fontSize="8" fontWeight="600" fill="#ffffff">Admin Signed</text>

                {/* Arrow 3 down to Comparison */}
                <path d="M 384 134 L 384 172 L 368 172" fill="none" stroke="#8c93a0" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrowhead-muted)"/>

                {/* Step 4: Verification / Later Comparison Area */}
                <rect x="16" y="152" width="344" height="146" rx="8" className="diagram-box" fill="#ffffff" stroke="#dde0e6" strokeWidth="1.5"/>
                <text x="30" y="172" fontFamily="Host Grotesk, sans-serif" fontSize="13" fontWeight="700" className="diagram-text-main" fill="#16191f">Later Verification</text>
                <text x="30" y="188" fontFamily="Instrument Sans, sans-serif" fontSize="10.5" className="diagram-text-sub" fill="#454c58">
                  <tspan x="30" dy="0">Select file &amp; search label → Hash computed in browser</tspan>
                  <tspan x="30" dy="14">Compare local SHA-256 against Tezos on-chain record</tspan>
                </text>

                {/* Result Outcomes pills */}
                <g transform="translate(30, 214)">
                  {/* MATCH */}
                  <rect x="0" y="0" width="92" height="38" rx="6" className="diagram-pill-match" fill="#edf8f2" stroke="#b6e4cc" strokeWidth="1"/>
                  <text x="10" y="16" fontFamily="Host Grotesk, sans-serif" fontSize="11" fontWeight="700" className="diagram-pill-match-title" fill="#0b824c">MATCH</text>
                  <text x="10" y="29" fontFamily="Instrument Sans, sans-serif" fontSize="9" className="diagram-pill-match-desc" fill="#0b824c">Digests equal</text>

                  {/* MISMATCH */}
                  <rect x="102" y="0" width="96" height="38" rx="6" className="diagram-pill-mismatch" fill="#fff8eb" stroke="#fae1b3" strokeWidth="1"/>
                  <text x="112" y="16" fontFamily="Host Grotesk, sans-serif" fontSize="11" fontWeight="700" className="diagram-pill-mismatch-title" fill="#b25e02">MISMATCH</text>
                  <text x="112" y="29" fontFamily="Instrument Sans, sans-serif" fontSize="9" className="diagram-pill-mismatch-desc" fill="#b25e02">Bytes differ</text>

                  {/* RECORD NOT FOUND */}
                  <rect x="208" y="0" width="102" height="38" rx="6" className="diagram-pill-notfound" fill="#f0f2f5" stroke="#dde0e6" strokeWidth="1"/>
                  <text x="216" y="16" fontFamily="Host Grotesk, sans-serif" fontSize="10" fontWeight="700" className="diagram-pill-notfound-title" fill="#454c58">NOT FOUND</text>
                  <text x="216" y="29" fontFamily="Instrument Sans, sans-serif" fontSize="9" className="diagram-pill-notfound-desc" fill="#454c58">Unknown record</text>
                </g>

                <text x="30" y="280" fontFamily="Instrument Sans, sans-serif" fontSize="9.5" className="diagram-text-sub" fill="#454c58">
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
