import React from 'react';
import { TEZOS_CONFIG, isContractConfigured } from '../config/tezos';

export const Footer: React.FC = () => {
  const contractConfigured = isContractConfigured();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="container">
        <div className="footer-top">
          <div>
            <div className="footer-brand-title">Document Integrity Registry</div>
            <p className="footer-desc">
              Decentralized, browser-local document fingerprint registration and verification on Tezos Shadownet. Built for student clubs and project teams.
            </p>
          </div>

          <div>
            <div className="footer-col-title">Network &amp; Contract</div>
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
              <li>
                Contract:{' '}
                {contractConfigured ? (
                  <span style={{ color: '#ffffff', fontFamily: 'var(--dp-font-mono)' }}>
                    {TEZOS_CONFIG.contractAddress.slice(0, 8)}...{TEZOS_CONFIG.contractAddress.slice(-4)}
                  </span>
                ) : (
                  <span style={{ color: '#f3b4b4', fontStyle: 'italic' }}>
                    Not configured (KT1 pending)
                  </span>
                )}
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
            {new Date().getFullYear()} Document Integrity Registry
          </div>
        </div>
      </div>
    </footer>
  );
};
