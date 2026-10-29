import React, { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import { isContractConfigured } from '../config/tezos';
import { isSupabaseConfigured } from '../config/supabase';
import {
  searchDocumentsByLabel,
  DocumentCatalogEntry,
} from '../services/supabaseCatalogue';
import {
  computeFileSha256,
  formatReadableTimestamp,
  formatFileSize,
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
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Label Autocomplete Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<DocumentCatalogEntry[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [duplicateLabels, setDuplicateLabels] = useState<string[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DocumentCatalogEntry | null>(null);

  // Verification execution states
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const contractConfigured = isContractConfigured();
  const supabaseConfigured = isSupabaseConfigured();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced autocomplete search against Supabase catalogue
  useEffect(() => {
    if (!supabaseConfigured || selectedEntry) {
      return;
    }

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSuggestions([]);
      setDuplicateLabels([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchRes = await searchDocumentsByLabel(trimmed);
        setSuggestions(searchRes.entries);
        setDuplicateLabels(searchRes.duplicateLabels);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedEntry, supabaseConfigured]);

  // Handle document file change
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

  // Autocomplete selection
  const handleSelectSuggestion = (entry: DocumentCatalogEntry) => {
    setSelectedEntry(entry);
    setSearchQuery(entry.label);
    setShowDropdown(false);
    setResult(null);
    setErrorMessage(null);
  };

  const handleClearSelection = () => {
    setSelectedEntry(null);
    setSearchQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    setResult(null);
    setErrorMessage(null);
  };

  // Verification execution
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !computedSha256) return;

    if (!selectedEntry || !selectedEntry.record_id.trim()) {
      setErrorMessage('Please type part of a document label and choose a matching suggestion.');
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
      // Use record_id internally from selected catalogue entry without displaying raw ID
      const targetRecordId = selectedEntry.record_id.trim();
      const storedRecord = await fetchRecordFromChain(targetRecordId);
      const evalResult = evaluateVerification(targetRecordId, computedSha256, storedRecord);
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
    selectedEntry !== null;

  return (
    <div className="panel-card" id="verify">
      <div className="card-header-area">
        <h2 className="card-title">Verify Document Copy</h2>
        <p className="card-subtitle">
          Select a document copy and search its label to verify whether its cryptographic fingerprint matches the on-chain version.
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

      {/* Supabase unconfigured warning */}
      {!supabaseConfigured && (
        <div className="state-box state-box-warning" role="alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <strong>Supabase catalogue not configured:</strong> Label search requires <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in <code>.env.local</code>.
          </div>
        </div>
      )}

      <form onSubmit={handleVerify} noValidate>
        {/* Step 1: File Picker */}
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
              aria-label="Click or drag and drop a file to calculate its cryptographic fingerprint"
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
                  The file is read locally and its cryptographic fingerprint is computed in browser.
                </div>
              </div>
            </div>
          ) : (
            <div className="file-selected-box">
              <div className="file-details">
                <span className="file-name" title={file.name}>{file.name}</span>
                <span className="file-size">
                  {(file.size / 1024).toFixed(1)} KB
                  {isHashing && ' • Computing local fingerprint in browser...'}
                </span>
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

        {/* Step 2: Document Label Autocomplete Search */}
        <div className="form-group" ref={searchContainerRef}>
          <label className="form-label" htmlFor="verify-label-search">
            Find Registered Document by Label <span className="required">*</span>
          </label>

          {selectedEntry ? (
            <div className="selected-label-card">
              <div className="selected-label-info">
                <span className="selected-label-name">Selected: {selectedEntry.label}</span>
                <span className="selected-label-sub" style={{ fontSize: '12px', color: 'var(--dp-color-ink-secondary)' }}>
                  Ready to verify against Tezos registration
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearSelection}
                className="btn btn-secondary btn-small"
                aria-label="Change selected document"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="autocomplete-wrapper">
              <input
                id="verify-label-search"
                type="text"
                className="form-input"
                placeholder="Type part of the document label (e.g. Club Constitution, Bylaws)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                autoComplete="off"
                disabled={!supabaseConfigured}
                aria-autocomplete="list"
                aria-controls="verify-autocomplete-list"
                aria-expanded={showDropdown}
              />

              {isSearching && (
                <div style={{ position: 'absolute', right: '12px', top: '12px', fontSize: '12px', color: 'var(--dp-color-ink-secondary)' }}>
                  Searching...
                </div>
              )}

              {/* Autocomplete Suggestions Dropdown */}
              {showDropdown && (
                <div className="autocomplete-dropdown" id="verify-autocomplete-list" role="listbox">
                  {suggestions.length > 0 ? (
                    <>
                      {suggestions.map((entry, idx) => {
                        const isDuplicate = duplicateLabels.some(
                          (dup) => dup.toLowerCase() === entry.label.toLowerCase()
                        );
                        const occurrenceIndex = suggestions
                          .slice(0, idx + 1)
                          .filter((item) => item.label.toLowerCase() === entry.label.toLowerCase()).length;
                        const totalOccurrences = suggestions.filter(
                          (item) => item.label.toLowerCase() === entry.label.toLowerCase()
                        ).length;

                        return (
                          <div
                            key={`${entry.record_id}-${idx}`}
                            className="autocomplete-item"
                            onClick={() => handleSelectSuggestion(entry)}
                            role="option"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSelectSuggestion(entry);
                            }}
                          >
                            <span className="autocomplete-label-text">{entry.label}</span>
                            {isDuplicate && (
                              <span className="autocomplete-duplicate-badge">
                                Choice {occurrenceIndex} of {totalOccurrences}
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {duplicateLabels.length > 0 && (
                        <div className="autocomplete-duplicate-alert">
                          <strong>Note on duplicate labels:</strong> Multiple registrations exist for{' '}
                          <em>"{duplicateLabels.join('", "')}"</em>. Because the catalogue stores strictly the label and record ID without extra metadata, each matching entry is shown as a separate choice above. You can choose each option to verify your file against that registration.
                        </div>
                      )}
                    </>
                  ) : (
                    searchQuery.trim().length > 0 &&
                    !isSearching && (
                      <div className="autocomplete-empty">
                        No registered documents found matching "<strong>{searchQuery}</strong>".
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          <span className="form-hint" style={{ marginTop: '6px', display: 'block' }}>
            Type part of the document label to see autocomplete suggestions. Choosing a suggestion selects its record internally.
          </span>
        </div>

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

        {/* Public Verification Result Screen */}
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
              {result.outcome === 'MATCH' && 'Document Match'}
              {result.outcome === 'MISMATCH' && 'Document Mismatch'}
              {result.outcome === 'RECORD NOT FOUND' && 'Record Not Found'}
            </h3>

            <p className="outcome-explanation">
              {result.outcome === 'MATCH' &&
                'This file matches the fingerprint registered for this label on Tezos.'}
              {result.outcome === 'MISMATCH' &&
                'This file does not match the fingerprint registered for this label on Tezos.'}
              {result.outcome === 'RECORD NOT FOUND' &&
                'No record was found on Tezos for this document label.'}
            </p>

            {/* Public Comparison Details */}
            <div className="comparison-grid">
              {(result.fileName || file) && (
                <div className="comparison-item">
                  <span className="comparison-label">YOUR DOCUMENT</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '15px',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {result.fileName || file?.name}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--dp-color-ink-secondary)' }}>
                      {formatFileSize(result.fileSize ?? file?.size)}
                    </span>
                  </div>
                </div>
              )}

              <div className="comparison-item">
                <span className="comparison-label">DOCUMENT LABEL</span>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>
                  {selectedEntry?.label || result.storedRecord?.label || 'Verified Document'}
                </span>
              </div>

              {result.storedRecord?.registered_at && (
                <div className="comparison-item">
                  <span className="comparison-label">REGISTRATION TIMESTAMP</span>
                  <span style={{ fontSize: '14px', color: 'var(--dp-color-ink)' }}>
                    {formatReadableTimestamp(result.storedRecord.registered_at)}
                  </span>
                </div>
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
