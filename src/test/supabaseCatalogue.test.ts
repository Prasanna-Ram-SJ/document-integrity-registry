import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as supabaseConfig from '../config/supabase';
import {
  searchDocumentsByLabel,
  insertDocumentToCatalog,
} from '../services/supabaseCatalogue';

describe('Supabase Catalogue Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
});
