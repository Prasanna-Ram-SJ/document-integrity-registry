/**
 * Client-side cryptographic and identifier utilities.
 * All hashing and UUID generation occurs locally in the browser.
 * File contents never leave the browser.
 */

export const MAX_LABEL_LENGTH = 100;

/**
 * Computes the SHA-256 hash of a File or Blob using the Web Crypto API.
 * Returns exactly 64 lowercase hexadecimal characters.
 */
export async function computeFileSha256(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  return computeBufferSha256(arrayBuffer);
}

/**
 * Computes the SHA-256 hash of an ArrayBuffer using the Web Crypto API.
 * Formats as exactly 64 lowercase hexadecimal characters.
 */
export async function computeBufferSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toLowerCase();
  return hashHex;
}

/**
 * Generates a RFC 4122 v4 UUID automatically in the browser.
 */
export function generateRecordId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC 4122 v4 UUID generator using crypto.getRandomValues
  const rnd = new Uint8Array(16);
  crypto.getRandomValues(rnd);
  rnd[6] = (rnd[6] & 0x0f) | 0x40; // Version 4
  rnd[8] = (rnd[8] & 0x3f) | 0x80; // Variant 10xx
  const hex = Array.from(rnd, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Validates whether a string is a 64-character lowercase hex SHA-256 digest.
 */
export function isValidSha256(hash: string): boolean {
  return /^[0-9a-f]{64}$/.test(hash.trim());
}

/**
 * Validates whether a string conforms to the UUID format (case-insensitive).
 */
export function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id.trim());
}

/**
 * Validates the label input according to SmartPy string compatibility rules:
 * - Non-empty
 * - Short (<= 100 characters)
 * - Printable ASCII characters only
 * Does not mutate the label invisibly.
 */
export function validateLabel(label: string): { valid: boolean; error?: string } {
  if (!label || label.trim().length === 0) {
    return { valid: false, error: 'Document label is required.' };
  }
  if (label.length > MAX_LABEL_LENGTH) {
    return { valid: false, error: `Label must be ${MAX_LABEL_LENGTH} characters or fewer (currently ${label.length}).` };
  }
  // Printable ASCII check: characters from 0x20 (space) to 0x7E (~), inclusive
  if (!/^[\x20-\x7E]+$/.test(label)) {
    return { valid: false, error: 'Label must contain printable ASCII characters only.' };
  }
  return { valid: true };
}

/**
 * Formats a registration timestamp (e.g. ISO 8601 string from on-chain record)
 * into a readable date and time with its timezone (for example: "27 Oct 2026, 11:36 PM IST").
 * Preserves the original timestamp string if parsing fails.
 */
export function formatReadableTimestamp(timestampStr: string): string {
  if (!timestampStr) return '';
  const date = new Date(timestampStr);
  if (isNaN(date.getTime())) {
    return timestampStr;
  }

  // Format with day, short month, year, time, and timezone name
  const formatter = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });

  return formatter.format(date).replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase());
}

/**
 * Formats a file size in bytes into an easy-to-read string (e.g. "540 bytes", "2.4 MB").
 */
export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '';
  if (bytes < 1024) {
    return `${bytes} bytes`;
  } else if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
  } else {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  }
}
