import React, { useState } from 'react';
import { TEZOS_CONFIG } from '../config/tezos';
import { WalletState } from '../types/registry';

interface HeaderProps {
  walletState: WalletState;
  onConnectWallet: () => Promise<void>;
  onDisconnectWallet: () => Promise<void>;
  onClearError?: () => void;
  onNavigateHome: () => void;
  onNavigateRegister: () => void;
  onNavigateVerify?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  walletState,
  onConnectWallet,
  onDisconnectWallet,
  onClearError,
  onNavigateHome,
  onNavigateRegister,
  onNavigateVerify,
}) => {
  const [copied, setCopied] = useState(false);

  const shortenAddress = (addr: string): string => {
    if (!addr || addr.length < 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopy = async () => {
    if (walletState.address) {
      await navigator.clipboard.writeText(walletState.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigateHome();
  };

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigateRegister();
  };

  const handleVerifyClick = (e: React.MouseEvent) => {
    if (onNavigateVerify) {
      e.preventDefault();
      onNavigateVerify();
    }
  };

  return (
    <header className="site-header" role="banner">
      <div className="container header-inner">
        <a
          href="#top"
          className="brand"
          aria-label="Document Integrity Registry home"
          onClick={handleHomeClick}
        >
          <div className="brand-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <span>Document Integrity Registry</span>
        </a>

        <nav className="header-nav" aria-label="Main Navigation">
          <a href="#top" className="nav-link" onClick={handleHomeClick}>Home</a>
          <a href="#verify" className="nav-link" onClick={handleVerifyClick}>Verify</a>
          <a href="#register" className="nav-link" onClick={handleRegisterClick}>Register</a>
          <a href="#how-it-works" className="nav-link">How it works</a>
        </nav>

        <div className="header-actions">
          <div className="network-badge" title="Target Network: Tezos Shadownet testnet">
            <span className="network-dot" aria-hidden="true"></span>
            <span>Tezos Shadownet</span>
          </div>

          {walletState.connected && walletState.address ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--dp-color-panel)',
                  border: '1px solid var(--dp-color-rule)',
                  borderRadius: 'var(--dp-radius-button)',
                  padding: '5px 10px',
                  fontSize: 'var(--dp-typography-metadata)',
                  fontFamily: 'var(--dp-font-mono)',
                }}
              >
                <span title={walletState.address}>
                  {shortenAddress(walletState.address)}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="copy-btn"
                  style={{ padding: '2px 6px', fontSize: '11px' }}
                  aria-label="Copy connected wallet address"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              {TEZOS_CONFIG.adminAddress && walletState.isAdmin && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    backgroundColor: 'var(--dp-color-accent-subtle)',
                    color: 'var(--dp-color-accent)',
                    border: '1px solid #c8d8fb',
                    padding: '3px 8px',
                    borderRadius: 'var(--dp-radius-pill)',
                  }}
                  title="Connected as configured Registrar Admin"
                >
                  Admin
                </span>
              )}

              <button
                type="button"
                onClick={onDisconnectWallet}
                className="btn btn-secondary btn-small"
                aria-label="Disconnect Temple wallet"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onConnectWallet}
              disabled={walletState.isConnecting}
              className="btn btn-primary btn-small"
              aria-label="Connect Temple wallet for registration"
            >
              {walletState.isConnecting ? 'Connecting Temple...' : 'Connect Temple wallet'}
            </button>
          )}
        </div>
      </div>

      {walletState.error && (
        <div
          style={{
            backgroundColor: 'var(--dp-color-danger-bg)',
            borderTop: '1px solid #f8c9c9',
            borderBottom: '1px solid #f8c9c9',
            padding: '8px 24px',
            fontSize: 'var(--dp-typography-metadata)',
            color: 'var(--dp-color-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
          role="alert"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>
              <strong>Wallet Connection Error:</strong> {walletState.error}
            </span>
          </div>
          {onClearError && (
            <button
              type="button"
              onClick={onClearError}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                color: 'var(--dp-color-danger)',
                fontSize: '14px',
                padding: '2px 6px',
              }}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </header>
  );
};
