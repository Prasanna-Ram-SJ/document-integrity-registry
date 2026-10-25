import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { isContractConfigured } from '../config/tezos';
import {
  computeFileSha256,
  isValidUuid,
} from '../services/crypto';
import {
  fetchRecordFromChain,
  evaluateVerification,
} from '../services/tezosAdapter';
import { VerificationResult } from '../types/registry';

export const VerifySection: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [computedSha256, setComputedSha256] = useState<string>('');
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [recordId, setRecordId] = useState<string>('');
  const [recordIdError, setRecordIdError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Verification outcome state
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contractConfigured = isContractConfigured();

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsHashing(true);
    setResult(null);
    setErrorMessage(null);
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
    setResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRecordIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setRecordId(val);
    setResult(null);
    setErrorMessage(null);
    if (val && !isValidUuid(val)) {
      setRecordIdError('Record ID must be a valid RFC 4122 UUID (e.g. 123e4567-e89b-12d3-a456-426614174000).');
    } else {
      setRecordIdError(null);
    }
  };

  const handleCopyText = async (text: string, fieldName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !computedSha256) return;

    const trimmedId = recordId.trim();
    if (!trimmedId) {
      setRecordIdError('Record ID is required.');
      return;
    }

    if (!isValidUuid(trimmedId)) {
      setRecordIdError('Please enter a valid UUID record ID.');
      return;
    }

    if (!contractConfigured) {
      setErrorMessage(
        'Contract not configured. Document verification requires a deployed Shadownet KT1 address (VITE_DOCUMENT_REGISTRY_ADDRESS).'
      );
      return;
    }

    setIsVerifying(true);
    setResult(null);
    setErrorMessage(null);

    try {
      const storedRecord = await fetchRecordFromChain(trimmedId);
      const evalResult = evaluateVerification(trimmedId, computedSha256, storedRecord);
      setResult({
        ...evalResult,
        fileName: file.name,
        fileSize: file.size,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Verification query failed: ${msg}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const isFormValid =
    file !== null &&
    computedSha256.length === 64 &&
    recordId.trim().length > 0 &&
    !recordIdError;

  return (
    <div className="panel-card" id="verify">
      <div className="card-header-area">
        <h2 className="card-title">Verify Document Copy</h2>
        <p className="card-subtitle">
          Select a file and enter its record ID to check whether its cryptographic fingerprint matches the registered version.
        </p>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="privacy-banner" role="note">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>
          <strong>Your file stays in this browser.</strong> Verification is a read-only lookup on Tezos Shadownet and requires no wallet connection or signatures.
        </span>
      </div>

      {/* Contract configuration check */}
      {!contractConfigured && (
        <div className="state-box state-box-warning" role="alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <strong>Contract not configured:</strong> The registry contract address (<code>VITE_DOCUMENT_REGISTRY_ADDRESS</code>) is not yet set. Verification requires a deployed Shadownet contract.
          </div>
        </div>
      )}

      <form onSubmit={handleVerify} noValidate>
        {/* File Picker */}
        <div className="form-group">
          <label className="form-label" htmlFor="verify-file-input">
            Select Document to Verify <span className="required">*</span>
          </label>
          <input
            id="verify-file-input"
            ref={fileInputRef}
            type="file"
            className="sr-only"
            onChange={onFileInputChange}
            aria-describedby="verify-file-hint"
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
              aria-label="Click or drag and drop a file to verify its cryptographic hash"
            >
              <div className="file-dropzone-inner">
                <svg className="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <div className="dropzone-text">Choose file to verify or drag it here</div>
                <div className="dropzone-subtext" id="verify-file-hint">
                  The file is read locally and its SHA-256 fingerprint is computed in browser.
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
                  aria-label="Replace file to verify"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="btn btn-danger-outline btn-small"
                  aria-label="Clear file"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Record ID Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="verify-record-id">
            Record ID (UUID) <span className="required">*</span>
          </label>
          <input
            id="verify-record-id"
            type="text"
            className="form-input font-mono"
            value={recordId}
            onChange={handleRecordIdChange}
            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
            required
            aria-invalid={recordIdError ? 'true' : 'false'}
            aria-describedby="record-id-hint"
          />
          <span className="form-hint" id="record-id-hint">
            {recordIdError ? (
              <span style={{ color: 'var(--dp-color-danger)' }}>{recordIdError}</span>
            ) : (
              'Enter the UUID assigned when this document version was registered.'
            )}
          </span>
        </div>

        {/* Calculated Hash Preview */}
        {file && (
          <div className="preview-box" style={{ margin: '16px 0' }}>
            <div className="preview-row">
              <span className="preview-label">Computed Local SHA-256</span>
              <div className="preview-value-group">
                <code className="preview-value">
                  {isHashing ? 'Computing hash in browser...' : computedSha256}
                </code>
                {computedSha256 && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(computedSha256, 'verify-hash')}
                    className="copy-btn"
                  >
                    {copiedField === 'verify-hash' ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Query Error State */}
        {errorMessage && (
          <div className="state-box state-box-danger" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <strong>Verification Error:</strong> {errorMessage}
            </div>
          </div>
        )}

        {/* Accessible Live Region */}
        <div aria-live="polite" className="sr-only">
          {isVerifying && 'Verifying document against Tezos Shadownet record...'}
          {result && `Verification result: ${result.outcome}. ${result.message}`}
        </div>

        {/* Verification Outcomes: Exactly MATCH, MISMATCH, RECORD NOT FOUND */}
        {result && (
          <div
            className={`outcome-card ${
              result.outcome === 'MATCH'
                ? 'outcome-match'
                : result.outcome === 'MISMATCH'
                ? 'outcome-mismatch'
                : 'outcome-not-found'
            }`}
            role="region"
            aria-label="Verification Result"
          >
            <div className="outcome-badge">
              {result.outcome === 'MATCH' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
              {result.outcome === 'MISMATCH' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              )}
              {result.outcome === 'RECORD NOT FOUND' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              )}
              <span>{result.outcome}</span>
            </div>

            <h3 className="outcome-title">
              {result.outcome === 'MATCH' && 'Document matches registered fingerprint'}
              {result.outcome === 'MISMATCH' && 'Document differs from registered version'}
              {result.outcome === 'RECORD NOT FOUND' && 'No record found for this Record ID'}
            </h3>

            <p className="outcome-explanation">{result.message}</p>

            {/* Comparison Details Grid */}
            <div className="comparison-grid">
              <div className="comparison-item">
                <span className="comparison-label">Record ID Checked</span>
                <code className="comparison-code">{result.recordId}</code>
              </div>

              <div className="comparison-item">
                <span className="comparison-label">Selected File Fingerprint</span>
                <code className="comparison-code">{result.computedSha256}</code>
              </div>

              {result.storedRecord && (
                <>
                  <div className="comparison-item">
                    <span className="comparison-label">Registered On-Chain Fingerprint</span>
                    <code className="comparison-code">{result.storedRecord.sha256}</code>
                  </div>
                  <div className="comparison-item">
                    <span className="comparison-label">Registered Label</span>
                    <span style={{ fontWeight: 600 }}>{result.storedRecord.label}</span>
                  </div>
                  <div className="comparison-item">
                    <span className="comparison-label">Registrar Address</span>
                    <code className="comparison-code">{result.storedRecord.registrar}</code>
                  </div>
                  {result.storedRecord.registered_at && (
                    <div className="comparison-item">
                      <span className="comparison-label">Registration Timestamp</span>
                      <span style={{ fontSize: '13px', color: 'var(--dp-color-ink-secondary)' }}>
                        {result.storedRecord.registered_at}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Submit Verification Button */}
        <div style={{ marginTop: '24px' }}>
          <button
            type="submit"
            disabled={!isFormValid || !contractConfigured || isVerifying}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {isVerifying
              ? 'Querying Shadownet On-Chain View...'
              : !contractConfigured
              ? 'Contract Not Configured'
              : 'Verify Document'}
          </button>
        </div>
      </form>
    </div>
  );
};
