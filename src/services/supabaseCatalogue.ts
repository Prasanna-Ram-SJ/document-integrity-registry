import { getSupabaseClient } from '../config/supabase';

/**
 * Interface strictly reflecting the public.document_catalog table.
 * Exactly two columns: record_id and label.
 */
export interface DocumentCatalogEntry {
  record_id: string;
  label: string;
}

export interface CatalogueSearchResult {
  entries: DocumentCatalogEntry[];
  hasDuplicates: boolean;
  duplicateLabels: string[];
}

export interface CatalogueInsertResult {
  success: boolean;
  error?: string;
  isRlsError?: boolean;
}

/**
 * Searches the Supabase catalogue for documents by label using case-insensitive partial matching (ilike).
 * Returns matching records containing only record_id and label.
 */
export async function searchDocumentsByLabel(searchTerm: string): Promise<CatalogueSearchResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { entries: [], hasDuplicates: false, duplicateLabels: [] };
  }

  const query = searchTerm.trim();
  if (!query) {
    return { entries: [], hasDuplicates: false, duplicateLabels: [] };
  }

  // Case-insensitive partial matching against label
  const { data, error } = await client
    .from('document_catalog')
    .select('record_id, label')
    .ilike('label', `%${query}%`)
    .limit(20);

  if (error) {
    throw new Error(`Catalogue search failed: ${error.message}`);
  }

  const entries: DocumentCatalogEntry[] = (data || []).map((row) => ({
    record_id: String(row.record_id),
    label: String(row.label),
  }));

  // Detect duplicate labels within the returned matches
  const labelCounts = new Map<string, number>();
  entries.forEach((e) => {
    const lower = e.label.toLowerCase();
    labelCounts.set(lower, (labelCounts.get(lower) || 0) + 1);
  });

  const duplicateLabels: string[] = [];
  labelCounts.forEach((count, lower) => {
    if (count > 1) {
      const match = entries.find((e) => e.label.toLowerCase() === lower);
      duplicateLabels.push(match ? match.label : lower);
    }
  });

  return {
    entries,
    hasDuplicates: duplicateLabels.length > 0,
    duplicateLabels,
  };
}

/**
 * Inserts one row into public.document_catalog after Tezos registration succeeds.
 * Contains only record_id and label.
 */
export async function insertDocumentToCatalog(
  entry: DocumentCatalogEntry
): Promise<CatalogueInsertResult> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase catalogue is not configured in .env.local (missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY).',
    };
  }

  const cleanRecordId = entry.record_id.trim();
  const cleanLabel = entry.label.trim();

  if (!cleanRecordId || !cleanLabel) {
    return {
      success: false,
      error: 'Both record_id and label are required to save to document catalogue.',
    };
  }

  // Payload strictly contains record_id and label only
  const payload = {
    record_id: cleanRecordId,
    label: cleanLabel,
  };

  const { error } = await client.from('document_catalog').insert(payload);

  if (error) {
    const isRls =
      error.code === '42501' ||
      error.message.toLowerCase().includes('row-level security') ||
      error.message.toLowerCase().includes('violates row-level security');

    let friendlyError = error.message;
    if (isRls) {
      friendlyError =
        'Permission denied by Row Level Security policy. Registrar authentication is required to insert into the catalogue.';
    } else if (error.code === '23505') {
      friendlyError = 'This Tezos record ID is already listed in the catalogue.';
    }

    return {
      success: false,
      error: friendlyError,
      isRlsError: isRls,
    };
  }

  return { success: true };
}

/**
 * Returns the currently authenticated Supabase user (if logged in).
 */
export async function getCurrentSupabaseUser() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user;
}

/**
 * Authenticates the registrar using Supabase Auth with email & password.
 * Session is persisted in the browser via the Supabase client.
 */
export async function signInRegistrar(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase catalogue is not configured.');
  }
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim(),
  });
  if (error) {
    throw new Error(error.message);
  }
  return data.user;
}

/**
 * Signs out the registrar from Supabase Auth.
 */
export async function signOutRegistrar() {
  const client = getSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
}
