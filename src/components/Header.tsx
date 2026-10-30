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
  theme: 'light' | 'dark';
  onToggleTheme: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  walletState,
  onConnectWallet,
  onDisconnectWallet,
  onClearError,
  onNavigateHome,
  onNavigateRegister,
  onNavigateVerify,
  theme,
  onToggleTheme,
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
          aria-label="D.A.R.T home"
          onClick={handleHomeClick}
        >
          <div className="brand-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <span>D.A.R.T</span>
        </a>

        <nav className="header-nav" aria-label="Main Navigation">
          <a href="#top" className="nav-link" onClick={handleHomeClick}>
            <span>Home</span>
          </a>
          <a href="#verify" className="nav-link" onClick={handleVerifyClick}>
            <span>Verify</span>
          </a>
          <a href="#register" className="nav-link" onClick={handleRegisterClick}>
            <span>Register</span>
          </a>
          <a href="#about" className="nav-link" aria-label="About">
            <span>About</span>
          </a>
        </nav>

        <div className="header-actions">
          {/* Theme Toggle Button: between About and Connect Wallet */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="theme-toggle-btn"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={theme === 'dark'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

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
                    border: '1px solid #d4c4fb',
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
                aria-label="Disconnect wallet"
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
              aria-label="Connect wallet"
            >
              {walletState.isConnecting ? 'Connecting...' : 'Connect Wallet'}
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
