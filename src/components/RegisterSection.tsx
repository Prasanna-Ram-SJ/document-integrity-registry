import React, { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import { TEZOS_CONFIG, isContractConfigured } from '../config/tezos';
import { isSupabaseConfigured } from '../config/supabase';
import {
  insertDocumentToCatalog,
  getCurrentSupabaseUser,
  signInRegistrar,
  signOutRegistrar,
} from '../services/supabaseCatalogue';
import type { User } from '@supabase/supabase-js';
import {
  computeFileSha256,
  generateRecordId,
  validateLabel,
  MAX_LABEL_LENGTH,
} from '../services/crypto';
import { registerDocumentOnChain } from '../services/tezosAdapter';
import { WalletState, RegistrationOutcome } from '../types/registry';

interface RegisterSectionProps {
  walletState: WalletState;
  onConnectWallet: () => Promise<void>;
}

type CatalogueSyncState =
  | { status: 'IDLE' }
  | { status: 'SAVING' }
  | { status: 'SUCCESS' }
  | { status: 'FAILED'; error: string; isRlsError?: boolean; record_id: string; label: string }
  | { status: 'NOT_CONFIGURED' };

export const RegisterSection: React.FC<RegisterSectionProps> = ({
  walletState,
  onConnectWallet,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [computedSha256, setComputedSha256] = useState<string>('');
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [label, setLabel] = useState<string>('');
  const [labelError, setLabelError] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string>(() => generateRecordId());
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Registration execution states
  const [outcome, setOutcome] = useState<RegistrationOutcome | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Supabase catalogue sync states
  const [catalogueState, setCatalogueState] = useState<CatalogueSyncState>({ status: 'IDLE' });
  const [isRetryingCatalogue, setIsRetryingCatalogue] = useState<boolean>(false);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [showLoginForm, setShowLoginForm] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const contractConfigured = isContractConfigured();
  const supabaseConfigured = isSupabaseConfigured();

  // Load current Supabase user on mount
  useEffect(() => {
    if (supabaseConfigured) {
      getCurrentSupabaseUser()
        .then((user) => setSupabaseUser(user))
        .catch(() => setSupabaseUser(null));
    }
  }, [supabaseConfigured]);

  const syncToCatalogue = async (recId: string, lbl: string) => {
    if (!supabaseConfigured) {
      setCatalogueState({ status: 'NOT_CONFIGURED' });
      return;
    }

    setCatalogueState({ status: 'SAVING' });
    try {
      const catRes = await insertDocumentToCatalog({
        record_id: recId,
        label: lbl,
      });

      if (catRes.success) {
        setCatalogueState({ status: 'SUCCESS' });
      } else {
        setCatalogueState({
          status: 'FAILED',
          error: catRes.error || 'Failed to save to Supabase document catalogue.',
          isRlsError: catRes.isRlsError,
          record_id: recId,
          label: lbl,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCatalogueState({
        status: 'FAILED',
        error: msg,
        record_id: recId,
        label: lbl,
      });
    }
  };

  const handleRetryCatalogueInsert = async () => {
    if (catalogueState.status !== 'FAILED') return;
    setIsRetryingCatalogue(true);
    try {
      const catRes = await insertDocumentToCatalog({
        record_id: catalogueState.record_id,
        label: catalogueState.label,
      });
      if (catRes.success) {
        setCatalogueState({ status: 'SUCCESS' });
      } else {
        setCatalogueState({
          ...catalogueState,
          error: catRes.error || 'Retry failed.',
          isRlsError: catRes.isRlsError,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCatalogueState({
        ...catalogueState,
        error: msg,
      });
    } finally {
      setIsRetryingCatalogue(false);
    }
  };

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Email and password are required.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const user = await signInRegistrar(loginEmail, loginPassword);
      setSupabaseUser(user);
      setShowLoginForm(false);
      setLoginPassword('');
      // If catalogue insert previously failed with RLS, immediately retry
      if (catalogueState.status === 'FAILED') {
        const catRes = await insertDocumentToCatalog({
          record_id: catalogueState.record_id,
          label: catalogueState.label,
        });
        if (catRes.success) {
          setCatalogueState({ status: 'SUCCESS' });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoginError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSupabaseLogout = async () => {
    await signOutRegistrar();
    setSupabaseUser(null);
  };

  // Process a selected file
  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsHashing(true);
    setOutcome(null);
    try {
      const hash = await computeFileSha256(selectedFile);
      setComputedSha256(hash);
    } catch {
      setComputedSha256('');
    } finally {
      setIsHashing(false);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setComputedSha256('');
    setOutcome(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLabelChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLabel(val);
    if (val.trim()) {
      const validation = validateLabel(val);
      setLabelError(validation.valid ? null : validation.error || null);
    } else {
      setLabelError(null);
    }
  };

  const handleRegenerateId = () => {
    if (!isSubmitting) {
      setRecordId(generateRecordId());
    }
  };

  const handleCopyText = async (text: string, fieldName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Explicit Register Submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const labelValidation = validateLabel(label);
    if (!labelValidation.valid) {
      setLabelError(labelValidation.error || 'Invalid label.');
      return;
    }

    if (!file || !computedSha256) {
      return;
    }

    if (!contractConfigured) {
      setOutcome({
        step: 'FAILED',
        errorMessage: 'Contract not configured. Live registration requires a deployed KT1 address.',
      });
      return;
    }

    if (!walletState.connected) {
      await onConnectWallet();
      return;
    }

    setIsSubmitting(true);
    setOutcome({ step: 'AWAITING_APPROVAL' });
    setCatalogueState({ status: 'IDLE' });

    try {
      const res = await registerDocumentOnChain({
        record_id: recordId,
        label: label.trim(),
        sha256: computedSha256,
      });
      setOutcome(res);

      if (res.step === 'CONFIRMED') {
        // Blockchain registration succeeded: now sync to Supabase document catalogue
        await syncToCatalogue(recordId, label.trim());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setOutcome({
        step: 'FAILED',
        errorMessage: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    file !== null &&
    computedSha256.length === 64 &&
    label.trim().length > 0 &&
    !labelError;

  return (
    <div className="panel-card" id="register">
      <div className="card-header-area">
        <h2 className="card-title">Register Document Version</h2>
        <p className="card-subtitle">
          Record a document’s SHA-256 fingerprint under an authorized registrar on Tezos Shadownet.
        </p>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="privacy-banner" role="note">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>
          <strong>Your file stays in this browser.</strong> Only its fingerprint and record details are registered on chain.
        </span>
      </div>

      {/* Supabase Catalogue Registrar Session Bar */}
      {supabaseConfigured && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '8px 12px',
          marginBottom: '16px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 600 }}>Catalogue Sync:</span>
            {supabaseUser ? (
              <span style={{ color: 'var(--dp-color-success)' }}>
                ● Signed in as <code>{supabaseUser.email}</code>
              </span>
            ) : (
              <span style={{ color: 'var(--dp-color-ink-secondary)' }}>
                ○ Not signed in (Required for RLS catalogue sync)
              </span>
            )}
          </div>
          <div>
            {supabaseUser ? (
              <button
                type="button"
                onClick={handleSupabaseLogout}
                className="btn btn-secondary btn-small"
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginForm(!showLoginForm)}
                className="btn btn-secondary btn-small"
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                {showLoginForm ? 'Cancel Login' : 'Registrar Login'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Registrar Login Modal / Form */}
      {showLoginForm && (
        <form onSubmit={handleSupabaseLogin} style={{
          padding: '16px',
          marginBottom: '16px',
          backgroundColor: '#ffffff',
          border: '1px solid var(--dp-color-accent)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Sign In as Authorized Registrar (Supabase)</h4>
          <p style={{ fontSize: '12px', color: 'var(--dp-color-ink-secondary)', marginBottom: '12px' }}>
            Sign in with the registrar credentials configured in your Supabase Auth dashboard to satisfy Row Level Security on catalogue inserts.
          </p>
          {loginError && (
            <div style={{ color: 'var(--dp-color-danger)', fontSize: '12px', marginBottom: '8px' }}>
              {loginError}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
            <input
              type="email"
              placeholder="Registrar email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="form-input"
              style={{ fontSize: '13px', padding: '8px 10px' }}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="form-input"
              style={{ fontSize: '13px', padding: '8px 10px' }}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowLoginForm(false)}
              className="btn btn-secondary btn-small"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn btn-primary btn-small"
            >
              {isLoggingIn ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      )}

      {/* Contract Configuration Warning if not deployed */}
      {!contractConfigured && (
        <div className="state-box state-box-warning" role="alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <strong>Contract not configured:</strong> The registry contract has not yet been deployed to Tezos Shadownet. Real-chain registration is disabled until <code>VITE_DOCUMENT_REGISTRY_ADDRESS</code> is provided.
          </div>
        </div>
      )}

      {/* Wallet Status / Admin Notice */}
      {walletState.connected && TEZOS_CONFIG.adminAddress && !walletState.isAdmin && (
        <div className="state-box state-box-danger" role="alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong>Unauthorized Account:</strong> Connected account (<code>{walletState.address}</code>) is not the configured registrar admin (<code>{TEZOS_CONFIG.adminAddress}</code>). Registration requires administrator authorization.
          </div>
        </div>
      )}

      {/* Wallet Connection Error Notice */}
      {walletState.error && !walletState.connected && (
        <div className="state-box state-box-danger" role="alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong>Wallet Connection Error:</strong> {walletState.error}
          </div>
        </div>
      )}

      <form onSubmit={handleRegister} noValidate>
        {/* File Picker */}
        <div className="form-group">
          <label className="form-label" htmlFor="register-file-input">
            Select Document File <span className="required">*</span>
          </label>
          <input
            id="register-file-input"
            ref={fileInputRef}
            type="file"
            className="sr-only"
            onChange={onFileInputChange}
            aria-describedby="file-hint"
          />

          {!file ? (
            <div
              className={`file-dropzone ${isDragOver ? 'dragover' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              aria-label="Click or drag and drop a file to calculate its SHA-256 fingerprint"
            >
              <div className="file-dropzone-inner">
                <svg className="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <div className="dropzone-text">Choose a file or drag it here</div>
                <div className="dropzone-subtext" id="file-hint">
                  Any file format. The file is read and hashed locally in your browser.
                </div>
              </div>
            </div>
          ) : (
            <div className="file-selected-box">
              <div className="file-details">
                <span className="file-name" title={file.name}>{file.name}</span>
                <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary btn-small"
                  aria-label="Replace current file"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="btn btn-danger-outline btn-small"
                  aria-label="Clear selected file"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Document Label Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="register-label-input">
            Short Document Label <span className="required">*</span>
          </label>
          <input
            id="register-label-input"
            type="text"
            className="form-input"
            value={label}
            onChange={handleLabelChange}
            maxLength={MAX_LABEL_LENGTH}
            placeholder="e.g. Club Constitution v2.1 or Fall Report"
            required
            aria-invalid={labelError ? 'true' : 'false'}
            aria-describedby="label-hint"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="form-hint" id="label-hint">
              {labelError ? (
                <span style={{ color: 'var(--dp-color-danger)' }}>{labelError}</span>
              ) : (
                'Short printable ASCII label registered with the document.'
              )}
            </span>
            <span className="form-hint" style={{ fontFamily: 'var(--dp-font-mono)' }}>
              {label.length}/{MAX_LABEL_LENGTH}
            </span>
          </div>
        </div>

        {/* Pre-Transaction Review Box */}
        {file && (
          <div className="preview-box" aria-label="Pre-registration summary">
            <div className="preview-box-title">Pre-Transaction Record Summary</div>

            <div className="preview-row">
              <span className="preview-label">File Name</span>
              <div className="preview-value">{file.name}</div>
            </div>

            <div className="preview-row">
              <span className="preview-label">Record ID</span>
              <div className="preview-value-group">
                <code className="masked-value">•••••••• 🔒</code>
                <span style={{ fontSize: '12px', color: 'var(--dp-color-ink-secondary)' }}>
                  (Auto-generated UUID; visually masked)
                </span>
                <button
                  type="button"
                  onClick={handleRegenerateId}
                  className="copy-btn"
                  title="Generate a new UUID"
                  aria-label="Generate a new UUID record ID"
                  disabled={isSubmitting}
                >
                  New ID
                </button>
              </div>
            </div>

            <div className="preview-row">
              <span className="preview-label">SHA-256 Fingerprint</span>
              <div className="preview-value-group">
                {isHashing ? (
                  <span style={{ fontSize: '13px', color: 'var(--dp-color-ink-secondary)' }}>
                    Computing cryptographic fingerprint...
                  </span>
                ) : (
                  <>
                    <code className="masked-value">•••••••• 🔒</code>
                    <span style={{ fontSize: '12px', color: 'var(--dp-color-ink-secondary)' }}>
                      (Computed in browser; visually masked)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Announcements (Accessible Live Region) */}
        <div aria-live="polite" className="sr-only">
          {outcome?.step === 'AWAITING_APPROVAL' && 'Awaiting Temple wallet approval.'}
          {outcome?.step === 'PENDING_CONFIRMATION' && 'Waiting for Tezos Shadownet confirmation.'}
          {outcome?.step === 'CONFIRMED' && 'Document version successfully registered on Tezos Shadownet.'}
          {outcome?.step === 'REJECTED' && 'Transaction declined in Temple wallet.'}
          {outcome?.step === 'UNAUTHORIZED' && 'Registration unauthorized: only the configured admin may register.'}
          {outcome?.step === 'DUPLICATE_ID' && 'A document with this record ID already exists.'}
          {outcome?.step === 'FAILED' && `Registration failed: ${outcome.errorMessage}`}
        </div>

        {/* Dynamic State Alerts */}
        {outcome?.step === 'AWAITING_APPROVAL' && (
          <div className="state-box state-box-neutral" role="status">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <div>
              <strong>Awaiting Temple approval:</strong> Please review and approve the transaction in your Temple wallet extension.
            </div>
          </div>
        )}

        {outcome?.step === 'CONFIRMED' && (
          <div className="state-box state-box-success" role="status">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <div style={{ width: '100%' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>
                Document Version Successfully Registered on Shadownet!
              </div>
              <div style={{ fontSize: 'var(--dp-typography-small)', marginBottom: '8px' }}>
                Your document version has been recorded on Tezos Shadownet and its label synced to the catalogue.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                <div className="preview-value-group">
                  <span style={{ fontWeight: 600, width: '90px', fontSize: '12px' }}>Document:</span>
                  <span style={{ fontWeight: 600 }}>{outcome.label || label}</span>
                </div>

                <div className="preview-value-group">
                  <span style={{ fontWeight: 600, width: '90px', fontSize: '12px' }}>Record ID:</span>
                  <code className="masked-value">•••••••• 🔒</code>
                  <span style={{ fontSize: '12px', color: 'var(--dp-color-ink-secondary)' }}>
                    (Visual mask)
                  </span>
                </div>

                <div className="preview-value-group">
                  <span style={{ fontWeight: 600, width: '90px', fontSize: '12px' }}>Fingerprint:</span>
                  <code className="masked-value">•••••••• 🔒</code>
                  <span style={{ fontSize: '12px', color: 'var(--dp-color-ink-secondary)' }}>
                    (Visual mask)
                  </span>
                </div>

                {outcome.txHash && (
                  <div className="preview-value-group">
                    <span style={{ fontWeight: 600, width: '90px', fontSize: '12px' }}>Tx Hash:</span>
                    <code className="preview-value">{outcome.txHash}</code>
                    <button
                      type="button"
                      onClick={() => handleCopyText(outcome.txHash!, 'confirmed-tx')}
                      className="copy-btn"
                    >
                      {copiedField === 'confirmed-tx' ? 'Copied' : 'Copy Tx'}
                    </button>
                  </div>
                )}
              </div>

              {/* Visual Masking Educational Notice */}
              <div className="mask-notice" style={{ marginTop: '10px' }} role="note">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <div>
                  <strong>Visual masking note (<code>•••••••• 🔒</code>):</strong> Record IDs and fingerprints are visually masked on this screen. This visual masking does not make on-chain data private: all data stored on Tezos Shadownet can still be inspected outside this app using an RPC node or block explorer.
                </div>
              </div>

              {/* Supabase Document Catalogue Sync State */}
              {catalogueState.status === 'SAVING' && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  border: '1px solid #bae6fd',
                  fontSize: '13px',
                  color: '#0369a1'
                }}>
                  Syncing document label to Supabase search catalogue...
                </div>
              )}

              {catalogueState.status === 'SUCCESS' && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0',
                  fontSize: '13px',
                  color: '#15803d'
                }}>
                  ✓ <strong>Added to Document Catalogue:</strong> Users can now find and verify this document by searching for "<strong>{outcome.label || label}</strong>" without needing the raw Record ID.
                </div>
              )}

              {catalogueState.status === 'NOT_CONFIGURED' && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                  color: 'var(--dp-color-ink-secondary)'
                }}>
                  ℹ️ <strong>Supabase Catalogue Not Configured:</strong> The document is securely registered on Tezos Shadownet. To enable label-based search, configure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.
                </div>
              )}

              {catalogueState.status === 'FAILED' && (
                <div className="state-box state-box-warning" style={{ marginTop: '14px', textAlign: 'left' }} role="alert">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <div style={{ width: '100%' }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--dp-color-warning)' }}>
                      Blockchain registration succeeded, but catalogue update failed
                    </div>
                    <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                      The document was successfully registered on Tezos Shadownet. However, saving the label to the Supabase lookup catalogue failed:
                      <div style={{ marginTop: '4px', fontWeight: 600, color: 'var(--dp-color-danger)' }}>
                        {catalogueState.error}
                      </div>
                    </div>

                    {catalogueState.isRlsError && !supabaseUser && (
                      <div style={{ marginBottom: '10px', padding: '8px 10px', background: '#fff', borderRadius: '6px', border: '1px solid #fde68a' }}>
                        <p style={{ fontSize: '12px', marginBottom: '6px' }}>
                          Row Level Security requires you to sign in as the authorized registrar before saving to the catalogue:
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowLoginForm(!showLoginForm)}
                          className="btn btn-secondary btn-small"
                        >
                          {showLoginForm ? 'Close Login' : 'Sign In as Registrar'}
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleRetryCatalogueInsert}
                        disabled={isRetryingCatalogue}
                        className="btn btn-secondary btn-small"
                      >
                        {isRetryingCatalogue ? 'Retrying Catalogue Insert...' : 'Retry Catalogue Insert'}
                      </button>
                      <span style={{ fontSize: '12px', color: 'var(--dp-color-ink-secondary)' }}>
                        (Retries only the catalogue update without submitting another Tezos transaction)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {outcome?.step === 'REJECTED' && (
          <div className="state-box state-box-warning" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <div>
              <strong>Transaction Rejected:</strong> {outcome.errorMessage || 'Operation declined in Temple wallet.'}
            </div>
          </div>
        )}

        {outcome?.step === 'UNAUTHORIZED' && (
          <div className="state-box state-box-danger" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <strong>Unauthorized:</strong> {outcome.errorMessage}
            </div>
          </div>
        )}

        {outcome?.step === 'DUPLICATE_ID' && (
          <div className="state-box state-box-warning" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <strong>Duplicate Record ID:</strong> A record with this UUID already exists. Click "New ID" to generate a unique UUID and try again.
            </div>
          </div>
        )}

        {outcome?.step === 'FAILED' && (
          <div className="state-box state-box-danger" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <strong>Registration Failed:</strong> {outcome.errorMessage}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div style={{ marginTop: '24px' }}>
          {!walletState.connected ? (
            <button
              type="button"
              onClick={onConnectWallet}
              disabled={walletState.isConnecting}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {walletState.isConnecting ? 'Connecting Temple...' : 'Connect Temple Wallet to Register'}
            </button>
          ) : (
            <button
              type="submit"
              disabled={!isFormValid || !contractConfigured || isSubmitting}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {isSubmitting
                ? 'Registering on Shadownet...'
                : !contractConfigured
                ? 'Contract Not Configured'
                : 'Register Document on Shadownet'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
