import React from 'react';
import { TEZOS_CONFIG } from '../config/tezos';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="container">
        <div className="footer-top">
          <div>
            <div className="footer-brand-title">D.A.R.T</div>
            <p className="footer-desc">
              Decentralized Authentication and Record Tracking (D.A.R.T) on Tezos Shadownet. Built for student clubs and project teams.
            </p>
          </div>

          <div>
            <div className="footer-col-title">Network</div>
            <ul className="footer-list">
              <li>
                Network:{' '}
                <span style={{ color: '#ffffff', fontFamily: 'var(--dp-font-mono)' }}>
                  {TEZOS_CONFIG.network}
                </span>
              </li>
              <li>
                RPC:{' '}
                <span style={{ color: '#ffffff', fontFamily: 'var(--dp-font-mono)', fontSize: '12px' }}>
                  {TEZOS_CONFIG.rpcUrl}
                </span>
              </li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Security &amp; Privacy</div>
            <ul className="footer-list">
              <li>Client-side SHA-256 via Web Crypto</li>
              <li>Zero document uploads or server storage</li>
              <li>Admin-restricted on-chain registration</li>
              <li>Read-only verification without wallet</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            Targeting Tezos Shadownet testnet. No documents or sensitive secrets leave your browser.
          </div>
          <div>
            {new Date().getFullYear()} D.A.R.T (Decentralized Authentication and Record Tracking)
          </div>
        </div>
      </div>
    </footer>
  );
};
