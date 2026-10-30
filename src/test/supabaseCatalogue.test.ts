import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as supabaseConfig from '../config/supabase';
import {
  searchDocumentsByLabel,
  insertDocumentToCatalog,
  checkLabelAvailability,
  normalizeLabel,
} from '../services/supabaseCatalogue';

describe('Supabase Catalogue Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('normalizeLabel helper', () => {
    it('normalizes label by trimming whitespace and converting to lowercase', () => {
      expect(normalizeLabel('Onam Poster')).toBe('onam poster');
      expect(normalizeLabel('  Onam Poster  ')).toBe('onam poster');
      expect(normalizeLabel('ONAM POSTER')).toBe('onam poster');
      expect(normalizeLabel('   ')).toBe('');
    });
  });

  describe('checkLabelAvailability pre-flight checks', () => {
    it('returns available: false if client is not configured', async () => {
      vi.spyOn(supabaseConfig, 'getSupabaseClient').mockReturnValue(null);
      const res = await checkLabelAvailability('Annual Report');
      expect(res.available).toBe(false);
      expect(res.error).toContain('not configured');
    });

    it('returns available: false if label is empty whitespace', async () => {
      const mockClient = { from: vi.fn() } as any;
      vi.spyOn(supabaseConfig, 'getSupabaseClient').mockReturnValue(mockClient);
      const res = await checkLabelAvailability('   ');
      expect(res.available).toBe(false);
      expect(res.error).toBe('Label cannot be empty.');
      expect(mockClient.from).not.toHaveBeenCalled();
    });

    it('returns available: true when no matching label exists in catalogue', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        ilike: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as any;
      vi.spyOn(supabaseConfig, 'getSupabaseClient').mockReturnValue(mockClient);

      const res = await checkLabelAvailability('New Document Label');
      expect(res.available).toBe(true);
      expect(res.isDuplicate).toBeUndefined();
    });

    it('detects existing label with exact case match and returns required error message', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        ilike: vi.fn().mockResolvedValue({
          data: [{ record_id: 'rec-1', label: 'Onam Poster' }],
          error: null,
        }),
      });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as any;
      vi.spyOn(supabaseConfig, 'getSupabaseClient').mockReturnValue(mockClient);

      const res = await checkLabelAvailability('Onam Poster');
      expect(res.available).toBe(false);
      expect(res.isDuplicate).toBe(true);
      expect(res.existingRecordId).toBe('rec-1');
      expect(res.error).toBe('This label is already registered. Please choose a different label.');
    });

    it('detects duplicate across capitalization differences ("onam poster" vs "Onam Poster")', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        ilike: vi.fn().mockResolvedValue({
          data: [{ record_id: 'rec-1', label: 'Onam Poster' }],
          error: null,
        }),
      });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as any;
      vi.spyOn(supabaseConfig, 'getSupabaseClient').mockReturnValue(mockClient);

      const res = await checkLabelAvailability('onam poster');
      expect(res.available).toBe(false);
      expect(res.isDuplicate).toBe(true);
      expect(res.error).toBe('This label is already registered. Please choose a different label.');
    });

    it('detects duplicate across surrounding whitespace differences ("  Onam Poster  ")', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        ilike: vi.fn().mockResolvedValue({
          data: [{ record_id: 'rec-1', label: 'Onam Poster' }],
          error: null,
        }),
      });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as any;
      vi.spyOn(supabaseConfig, 'getSupabaseClient').mockReturnValue(mockClient);

      const res = await checkLabelAvailability('   Onam Poster   ');
      expect(res.available).toBe(false);
      expect(res.isDuplicate).toBe(true);
      expect(res.error).toBe('This label is already registered. Please choose a different label.');
    });

    it('returns helpful error if availability query fails rather than assuming available', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        ilike: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'connection timeout' },
        }),
      });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as any;
      vi.spyOn(supabaseConfig, 'getSupabaseClient').mockReturnValue(mockClient);

      const res = await checkLabelAvailability('Bylaws');
      expect(res.available).toBe(false);
      expect(res.isDuplicate).toBeUndefined();
      expect(res.error).toContain('Catalogue verification failed: connection timeout');
    });
  });

  it('searchDocumentsByLabel returns empty list if client is not configured', async () => {
    vi.spyOn(supabaseConfig, 'getSupabaseClient').mockReturnValue(null);
    const res = await searchDocumentsByLabel('Constitution');
    expect(res.entries).toEqual([]);
    expect(res.hasDuplicates).toBe(false);
  });

  it('searchDocumentsByLabel returns empty list if search query is empty whitespace', async () => {
    const mockClient = {
      from: vi.fn(),
    } as any;
    vi.spyOn(supabaseConfig, 'getSupabaseClient').mockReturnValue(mockClient);

    const res = await searchDocumentsByLabel('   ');
    expect(res.entries).toEqual([]);
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it('searchDocumentsByLabel queries document_catalog with case-insensitive ilike', async () => {
    const mockIlike = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({
        data: [
          { record_id: 'uuid-1', label: 'Club Constitution v1' },
          { record_id: 'uuid-2', label: 'Club Constitution v2' },
        ],
        error: null,
      }),
    });

    const mockSelect = vi.fn().mockReturnValue({ ilike: mockIlike });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    const mockClient = { from: mockFrom } as any;
    vi.spyOn(supabaseConfig, 'getSupabaseClient').mockReturnValue(mockClient);

    const res = await searchDocumentsByLabel('constitution');

    expect(mockFrom).toHaveBeenCalledWith('document_catalog');
    expect(mockSelect).toHaveBeenCalledWith('record_id, label');
    expect(mockIlike).toHaveBeenCalledWith('label', '%constitution%');
    expect(res.entries.length).toBe(2);
    expect(res.hasDuplicates).toBe(false);
    expect(res.duplicateLabels).toEqual([]);
  });

  it('searchDocumentsByLabel detects and flags duplicate labels', async () => {
    const mockIlike = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({
        data: [
          { record_id: 'uuid-a', label: 'Bylaws' },
          { record_id: 'uuid-b', label: 'Bylaws' },
          { record_id: 'uuid-c', label: 'Project Charter' },
        ],
        error: null,
      }),
    });

    const mockSelect = vi.fn().mockReturnValue({ ilike: mockIlike });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
    const mockClient = { from: mockFrom } as any;
    vi.spyOn(supabaseConfig, 'getSupabaseClient').mockReturnValue(mockClient);

    const res = await searchDocumentsByLabel('by');

    expect(res.entries.length).toBe(3);
    expect(res.hasDuplicates).toBe(true);
    expect(res.duplicateLabels).toContain('Bylaws');
  });

  it('insertDocumentToCatalog fails if record_id or label is missing', async () => {
    const mockClient = { from: vi.fn() } as any;
    vi.spyOn(supabaseConfig, 'getSupabaseClient').mockReturnValue(mockClient);

    const res1 = await insertDocumentToCatalog({ record_id: '', label: 'Test' });
    expect(res1.success).toBe(false);
    expect(res1.error).toContain('required');

    const res2 = await insertDocumentToCatalog({ record_id: '123', label: '' });
    expect(res2.success).toBe(false);
  });

  it('insertDocumentToCatalog inserts strictly record_id and label into document_catalog', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    const mockClient = { from: mockFrom } as any;
    vi.spyOn(supabaseConfig, 'getSupabaseClient').mockReturnValue(mockClient);

    const res = await insertDocumentToCatalog({
      record_id: 'a0000000-0000-0000-0000-000000000001',
      label: 'Annual Financial Report 2026',
    });

    expect(res.success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('document_catalog');
    expect(mockInsert).toHaveBeenCalledWith({
      record_id: 'a0000000-0000-0000-0000-000000000001',
      label: 'Annual Financial Report 2026',
    });
  });

  it('insertDocumentToCatalog formats RLS error with friendly explanation', async () => {
    const mockInsert = vi.fn().mockResolvedValue({
      error: {
        code: '42501',
        message: 'new row violates row-level security policy for table document_catalog',
      },
    });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    const mockClient = { from: mockFrom } as any;
    vi.spyOn(supabaseConfig, 'getSupabaseClient').mockReturnValue(mockClient);

    const res = await insertDocumentToCatalog({
      record_id: 'a0000000-0000-0000-0000-000000000001',
      label: 'Annual Financial Report 2026',
    });

    expect(res.success).toBe(false);
    expect(res.isRlsError).toBe(true);
    expect(res.error).toContain('Row Level Security');
  });

  it('insertDocumentToCatalog formats label unique constraint violation with friendly explanation', async () => {
    const mockInsert = vi.fn().mockResolvedValue({
      error: {
        code: '23505',
        message: 'duplicate key value violates unique constraint "document_catalog_normalized_label_idx"',
        details: 'Key (lower(btrim(label)))=(annual financial report 2026) already exists.',
      },
    });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
    const mockClient = { from: mockFrom } as any;
    vi.spyOn(supabaseConfig, 'getSupabaseClient').mockReturnValue(mockClient);

    const res = await insertDocumentToCatalog({
      record_id: 'a0000000-0000-0000-0000-000000000002',
      label: 'Annual Financial Report 2026',
    });

    expect(res.success).toBe(false);
    expect(res.isDuplicateLabelError).toBe(true);
    expect(res.error).toBe('This label is already registered. Please choose a different label.');
  });
});
