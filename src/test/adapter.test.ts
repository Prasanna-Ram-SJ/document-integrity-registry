import { describe, it, expect, vi } from 'vitest';

vi.mock('@taquito/beacon-wallet', () => ({
  BeaconWallet: vi.fn().mockImplementation(() => ({
    client: { getActiveAccount: vi.fn().mockResolvedValue(null) },
    requestPermissions: vi.fn().mockResolvedValue(undefined),
    getPKH: vi.fn().mockResolvedValue('tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb'),
  })),
}));

vi.mock('@airgap/beacon-dapp', () => ({
  NetworkType: { CUSTOM: 'custom', SHADOWNET: 'shadownet' },
}));

import { normalizeRecordOption, evaluateVerification } from '../services/tezosAdapter';
import { DocumentRecord } from '../types/registry';

describe('SmartPy option result normalization', () => {
  const sampleRecordId = 'c9a646d3-9c61-4cc9-bc8d-64507cda7f48';
  const validHash = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';

  it('normalizes null or undefined to null', () => {
    expect(normalizeRecordOption(null, sampleRecordId)).toBeNull();
    expect(normalizeRecordOption(undefined, sampleRecordId)).toBeNull();
  });

  it('normalizes Michelson None representation to null', () => {
    expect(normalizeRecordOption({ None: [] }, sampleRecordId)).toBeNull();
    expect(normalizeRecordOption({ None: null }, sampleRecordId)).toBeNull();
    expect(normalizeRecordOption({ Some: null }, sampleRecordId)).toBeNull();
  });

  it('normalizes Michelson Some wrapper correctly', () => {
    const raw = {
      Some: {
        label: 'Club Charter 2026',
        sha256: validHash,
        registrar: 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb',
        registered_at: '2026-10-25T10:00:00Z',
      },
    };
    const normalized = normalizeRecordOption(raw, sampleRecordId);
    expect(normalized).not.toBeNull();
    expect(normalized?.record_id).toBe(sampleRecordId);
    expect(normalized?.label).toBe('Club Charter 2026');
    expect(normalized?.sha256).toBe(validHash);
    expect(normalized?.registrar).toBe('tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb');
    expect(normalized?.registered_at).toBe('2026-10-25T10:00:00Z');
  });

  it('normalizes unwrapped SmartPy record correctly', () => {
    const raw = {
      label: 'Budget Plan',
      sha256: validHash.toUpperCase(), // Test case normalization
      registrar: 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb',
      registered_at: '2026-10-25T12:30:00Z',
    };
    const normalized = normalizeRecordOption(raw, sampleRecordId);
    expect(normalized).not.toBeNull();
    expect(normalized?.sha256).toBe(validHash.toLowerCase());
  });

  it('rejects records with invalid or missing sha256', () => {
    const invalidRaw = {
      label: 'Corrupted record',
      sha256: 'not-a-valid-sha256',
      registrar: 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb',
      registered_at: '2026-10-25T12:30:00Z',
    };
    expect(normalizeRecordOption(invalidRaw, sampleRecordId)).toBeNull();
  });
});

describe('Three verification outcomes', () => {
  const recordId = '123e4567-e89b-12d3-a456-426614174000';
  const registeredHash = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';
  const differingHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const storedRecord: DocumentRecord = {
    record_id: recordId,
    label: 'Official Constitution',
    sha256: registeredHash,
    registrar: 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb',
    registered_at: '2026-10-25T08:00:00Z',
  };

  it('yields MATCH when record exists and fingerprints are identical', () => {
    const result = evaluateVerification(recordId, registeredHash, storedRecord);
    expect(result.outcome).toBe('MATCH');
    expect(result.message).toContain('matches the fingerprint');
    expect(result.storedRecord).toBe(storedRecord);
  });

  it('yields MISMATCH when record exists but fingerprints differ', () => {
    const result = evaluateVerification(recordId, differingHash, storedRecord);
    expect(result.outcome).toBe('MISMATCH');
    expect(result.message).toContain('differs from the registered version');
    // Must never claim counterfeit or unsafe
    expect(result.message.toLowerCase()).not.toContain('counterfeit');
    expect(result.message.toLowerCase()).not.toContain('unsafe');
  });

  it('yields RECORD NOT FOUND when no record exists for the record ID', () => {
    const result = evaluateVerification(recordId, registeredHash, null);
    expect(result.outcome).toBe('RECORD NOT FOUND');
    // Must not be called a mismatch
    expect(result.outcome).not.toBe('MISMATCH');
    expect(result.message).toContain('No record was found');
    expect(result.message).toContain('Please check the ID');
  });
});

describe('Contract configuration and security invariants', () => {
  it('prevents real-chain registration when contract is not configured', async () => {
    const { TEZOS_CONFIG } = await import('../config/tezos');
    const { registerDocumentOnChain } = await import('../services/tezosAdapter');
    const original = TEZOS_CONFIG.contractAddress;
    try {
      (TEZOS_CONFIG as { contractAddress: string }).contractAddress = '';
      const outcome = await registerDocumentOnChain({
        record_id: '123e4567-e89b-12d3-a456-426614174000',
        label: 'Test Document',
        sha256: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
      });
      expect(outcome.step).toBe('FAILED');
      expect(outcome.errorMessage).toContain('Contract not configured');
    } finally {
      (TEZOS_CONFIG as { contractAddress: string }).contractAddress = original;
    }
  });

  it('prevents on-chain view fetch when contract is not configured', async () => {
    const { TEZOS_CONFIG } = await import('../config/tezos');
    const { fetchRecordFromChain } = await import('../services/tezosAdapter');
    const original = TEZOS_CONFIG.contractAddress;
    try {
      (TEZOS_CONFIG as { contractAddress: string }).contractAddress = '';
      await expect(fetchRecordFromChain('123e4567-e89b-12d3-a456-426614174000')).rejects.toThrow(
        'Contract not configured'
      );
    } finally {
      (TEZOS_CONFIG as { contractAddress: string }).contractAddress = original;
    }
  });

  it('queries live on-chain view on Shadownet returning null for unregistered ID', async () => {
    const { fetchRecordFromChain } = await import('../services/tezosAdapter');
    const result = await fetchRecordFromChain('123e4567-e89b-12d3-a456-426614174000');
    expect(result).toBeNull();
  });
});
