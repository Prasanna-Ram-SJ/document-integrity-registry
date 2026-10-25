import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { TEZOS_CONFIG, isContractConfigured } from '../config/tezos';
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const contractConfigured = isContractConfigured();

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

    try {
      const res = await registerDocumentOnChain({
        record_id: recordId,
        label: label.trim(),
        sha256: computedSha256,
      });
      setOutcome(res);
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
              <span className="preview-label">Record ID (Auto-generated UUID)</span>
              <div className="preview-value-group">
                <div className="preview-value">{recordId}</div>
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
                <button
                  type="button"
                  onClick={() => handleCopyText(recordId, 'preview-id')}
                  className="copy-btn"
                  aria-label="Copy record ID"
                >
                  {copiedField === 'preview-id' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="preview-row">
              <span className="preview-label">SHA-256 Fingerprint (Local Browser Hash)</span>
              <div className="preview-value-group">
                <div className="preview-value">
                  {isHashing ? 'Computing cryptographic hash...' : computedSha256}
                </div>
                {computedSha256 && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(computedSha256, 'preview-hash')}
                    className="copy-btn"
                    aria-label="Copy SHA-256 fingerprint"
                  >
                    {copiedField === 'preview-hash' ? 'Copied' : 'Copy'}
                  </button>
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
                Save the Record ID below. You or anyone else can use it to verify copies of this document later.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                <div className="preview-value-group">
                  <span style={{ fontWeight: 600, width: '90px', fontSize: '12px' }}>Record ID:</span>
                  <code className="preview-value">{outcome.recordId}</code>
                  <button
                    type="button"
                    onClick={() => handleCopyText(outcome.recordId!, 'confirmed-id')}
                    className="copy-btn"
                  >
                    {copiedField === 'confirmed-id' ? 'Copied' : 'Copy ID'}
                  </button>
                </div>

                <div className="preview-value-group">
                  <span style={{ fontWeight: 600, width: '90px', fontSize: '12px' }}>Fingerprint:</span>
                  <code className="preview-value">{outcome.sha256}</code>
                  <button
                    type="button"
                    onClick={() => handleCopyText(outcome.sha256!, 'confirmed-hash')}
                    className="copy-btn"
                  >
                    {copiedField === 'confirmed-hash' ? 'Copied' : 'Copy Hash'}
                  </button>
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
