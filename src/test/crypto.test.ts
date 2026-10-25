import { describe, it, expect } from 'vitest';
import {
  computeBufferSha256,
  generateRecordId,
  isValidSha256,
  isValidUuid,
  validateLabel,
} from '../services/crypto';

describe('Local SHA-256 hashing and formatting', () => {
  it('computes correct 64-character lowercase hex digest for empty input', async () => {
    const emptyBuffer = new ArrayBuffer(0);
    const hash = await computeBufferSha256(emptyBuffer);
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(hash.length).toBe(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(isValidSha256(hash)).toBe(true);
  });

  it('computes correct SHA-256 digest for known string test vector', async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode('hello world');
    const hash = await computeBufferSha256(data.buffer);
    expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    expect(isValidSha256(hash)).toBe(true);
  });

  it('validates 64-char lowercase hex strings correctly', () => {
    expect(isValidSha256('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9')).toBe(true);
    // Uppercase is not valid per requirement of 64 lowercase hex characters
    expect(isValidSha256('B94D27B9934D3E08A52E52D7DA7DABFAC484EFE37A5380EE9088F7ACE2EFCDE9')).toBe(false);
    // Invalid length
    expect(isValidSha256('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcd')).toBe(false);
    // Invalid characters
    expect(isValidSha256('g94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9')).toBe(false);
  });
});

describe('UUID handling', () => {
  it('generates valid RFC 4122 v4 UUIDs', () => {
    const uuid = generateRecordId();
    expect(uuid).toBeDefined();
    expect(uuid.length).toBe(36);
    expect(isValidUuid(uuid)).toBe(true);
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('validates UUID format correctly', () => {
    expect(isValidUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(isValidUuid('c9a646d3-9c61-4cc9-bc8d-64507cda7f48')).toBe(true);
    expect(isValidUuid('invalid-uuid')).toBe(false);
    expect(isValidUuid('123e4567-e89b-12d3-a456')).toBe(false);
  });
});

describe('Label validation (SmartPy ASCII compatibility)', () => {
  it('accepts valid short printable ASCII labels', () => {
    expect(validateLabel('Semester Report Final 2026').valid).toBe(true);
    expect(validateLabel('Constitution v1.2 (Signed)').valid).toBe(true);
  });

  it('rejects empty or whitespace-only labels', () => {
    expect(validateLabel('').valid).toBe(false);
    expect(validateLabel('   ').valid).toBe(false);
  });

  it('rejects labels exceeding max length of 100 characters', () => {
    const longLabel = 'a'.repeat(101);
    const result = validateLabel(longLabel);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('100 characters or fewer');
  });

  it('rejects non-printable ASCII or unicode characters', () => {
    expect(validateLabel('Document 📄').valid).toBe(false);
    expect(validateLabel('Project—Final').valid).toBe(false); // Em-dash is not ASCII
  });
});
