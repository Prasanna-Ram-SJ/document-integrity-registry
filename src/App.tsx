import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FactualStrip } from './components/FactualStrip';
import { RegisterSection } from './components/RegisterSection';
import { VerifySection } from './components/VerifySection';
import { HowItWorks } from './components/HowItWorks';
import { LimitationNotice } from './components/LimitationNotice';
import { Footer } from './components/Footer';
import {
  connectWallet,
  disconnectWallet,
  checkActiveWalletAccount,
} from './services/tezosAdapter';
import {
  Theme,
  getSavedTheme,
  applyThemeToDOM,
  toggleThemeWithTransition,
} from './utils/theme';
import { WalletState } from './types/registry';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(getSavedTheme);
  const [activeTab, setActiveTab] = useState<'verify' | 'register'>('verify');
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    address: null,
    isConnecting: false,
    error: null,
    isAdmin: false,
  });

  // Ensure DOM matches theme state on mount
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  // Return to the top on true page reload while preserving Back/Forward and in-page navigation
  useEffect(() => {
    let isReload = false;
    try {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        isReload = (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
      } else if ((performance as any).navigation) {
        isReload = (performance as any).navigation.type === 1;
      }
    } catch {
      isReload = false;
    }

    if (isReload) {
      window.scrollTo(0, 0);
      const timer = setTimeout(() => {
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'auto';
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  // Check if there is already an active session established in previous turns without requesting new permissions
  useEffect(() => {
    checkActiveWalletAccount().then(({ address, isAdmin }) => {
      if (address) {
        setWalletState({
          connected: true,
          address,
          isConnecting: false,
          error: null,
          isAdmin,
        });
      }
    });
  }, []);

  // Explicit user-initiated wallet connection
  const handleConnectWallet = useCallback(async () => {
    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const { address, isAdmin } = await connectWallet();
      setWalletState({
        connected: true,
        address,
        isConnecting: false,
        error: null,
        isAdmin,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      let friendlyError = message;
      if (
        message.includes('Declined') ||
        message.includes('ABORTED') ||
        message.includes('User rejected') ||
        message.includes('NOT_GRANTED') ||
        message.includes('cancelled')
      ) {
        friendlyError = 'Wallet connection was declined or cancelled.';
      } else if (message.includes('timed out')) {
        friendlyError =
          'Connection timed out. Please ensure your wallet extension is installed, unlocked, and connected to Tezos Shadownet.';
      } else {
        friendlyError = `Wallet connection failed: ${message}`;
      }
      setWalletState((prev) => ({
        ...prev,
        isConnecting: false,
        error: friendlyError,
      }));
    } finally {
      setWalletState((prev) => (prev.isConnecting ? { ...prev, isConnecting: false } : prev));
    }
  }, []);

  // Explicit user-initiated wallet disconnection
  const handleDisconnectWallet = useCallback(async () => {
    try {
      await disconnectWallet();
    } finally {
      setWalletState({
        connected: false,
        address: null,
        isConnecting: false,
        error: null,
        isAdmin: false,
      });
    }
  }, []);

  const handleClearError = useCallback(() => {
    setWalletState((prev) => ({ ...prev, error: null }));
  }, []);

  // User toggled theme with radial reveal animation
  const handleToggleTheme = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      const buttonEl = e.currentTarget;
      const coords =
        e.clientX > 0 && e.clientY > 0 ? { x: e.clientX, y: e.clientY } : null;
      const next = await toggleThemeWithTransition(theme, buttonEl, coords);
      setTheme(next);
    },
    [theme]
  );

  // Scroll to absolute top (scrollY = 0) from anywhere on the page
  const handleNavigateHome = useCallback(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });

    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Navigate to Register: switches to Register tab and scrolls to form keeping it below sticky navbar
  const handleNavigateRegister = useCallback(() => {
    setActiveTab('register');

    const scrollToRegister = () => {
      const targetEl =
        document.getElementById('register') ||
        document.getElementById('panel-register') ||
        document.getElementById('workspace');

      if (targetEl) {
        const header = document.querySelector('.site-header');
        const headerHeight = header ? header.getBoundingClientRect().height : 68;
        const extraSpacing = 20;

        const elementRect = targetEl.getBoundingClientRect();
        // If element is not yet displayed, getBoundingClientRect().height might be 0
        if (elementRect.height === 0 && targetEl.id !== 'workspace') {
          const workspaceEl = document.getElementById('workspace');
          if (workspaceEl) {
            const wsRect = workspaceEl.getBoundingClientRect();
            const targetY = window.scrollY + wsRect.top - headerHeight - extraSpacing;
            const prefersReducedMotion =
              typeof window !== 'undefined' &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            window.scrollTo({
              top: Math.max(0, targetY),
              left: 0,
              behavior: prefersReducedMotion ? 'auto' : 'smooth',
            });
            return;
          }
        }

        const targetY = window.scrollY + elementRect.top - headerHeight - extraSpacing;
        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        window.scrollTo({
          top: Math.max(0, targetY),
          left: 0,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
      }
    };

    requestAnimationFrame(() => {
      setTimeout(scrollToRegister, 40);
    });
  }, []);

  // Navigate to Verify: switches to Verify tab and scrolls to form keeping it below sticky navbar
  const handleNavigateVerify = useCallback(() => {
    setActiveTab('verify');

    const scrollToVerify = () => {
      const targetEl =
        document.getElementById('verify') ||
        document.getElementById('panel-verify') ||
        document.getElementById('workspace');

      if (targetEl) {
        const header = document.querySelector('.site-header');
        const headerHeight = header ? header.getBoundingClientRect().height : 68;
        const extraSpacing = 20;

        const elementRect = targetEl.getBoundingClientRect();
        const targetY = window.scrollY + elementRect.top - headerHeight - extraSpacing;
        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        window.scrollTo({
          top: Math.max(0, targetY),
          left: 0,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
      }
    };

    requestAnimationFrame(() => {
      setTimeout(scrollToVerify, 40);
    });
  }, []);

  return (
    <>
      <Header
        walletState={walletState}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        onClearError={handleClearError}
        onNavigateHome={handleNavigateHome}
        onNavigateRegister={handleNavigateRegister}
        onNavigateVerify={handleNavigateVerify}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main id="main-content">
        <Hero
          onSelectTab={(tab) => {
            if (tab === 'register') {
              handleNavigateRegister();
            } else {
              handleNavigateVerify();
            }
          }}
        />

        <FactualStrip />

        {/* Functional D.A.R.T Workspace Area */}
        <section className="registry-section" id="workspace" aria-labelledby="workspace-title">
          <div className="container">
            <div className="section-intro">
              <h2 id="workspace-title" className="section-title">
                D.A.R.T Workspace
              </h2>
              <p className="section-subtitle">
                Verify existing document copies or register new authoritative versions on Tezos Shadownet.
              </p>
            </div>

            {/* In-page Tab switcher */}
            <div className="registry-tabs" role="tablist" aria-label="D.A.R.T Operations">
              <div className="tab-container">
                <button
                  type="button"
                  role="tab"
                  id="tab-verify"
                  aria-selected={activeTab === 'verify'}
                  aria-controls="panel-verify"
                  className={`tab-btn ${activeTab === 'verify' ? 'active' : ''}`}
                  onClick={() => setActiveTab('verify')}
                >
                  Verify a Document
                </button>
                <button
                  type="button"
                  role="tab"
                  id="tab-register"
                  aria-selected={activeTab === 'register'}
                  aria-controls="panel-register"
                  className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                  onClick={() => setActiveTab('register')}
                >
                  Register a Version
                </button>
              </div>
            </div>

            {/* Active Panel */}
            <div
              id="panel-verify"
              role="tabpanel"
              aria-labelledby="tab-verify"
              hidden={activeTab !== 'verify'}
              style={{ display: activeTab === 'verify' ? 'block' : 'none' }}
            >
              <VerifySection />
            </div>

            <div
              id="panel-register"
              role="tabpanel"
              aria-labelledby="tab-register"
              hidden={activeTab !== 'register'}
              style={{ display: activeTab === 'register' ? 'block' : 'none' }}
            >
              <RegisterSection
                walletState={walletState}
                onConnectWallet={handleConnectWallet}
                onNavigateRegister={handleNavigateRegister}
              />
            </div>
          </div>
        </section>

        <HowItWorks />

        <LimitationNotice />
      </main>

      <Footer />
    </>
  );
};

export default App;
