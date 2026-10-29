import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CONFIG = {
  url: (import.meta.env.VITE_SUPABASE_URL || '').trim(),
  publishableKey: (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim(),
};

/**
 * Checks whether Supabase catalogue is configured in the environment.
 * The browser uses only the public publishable key with Row Level Security.
 * Never use or expose the service_role key.
 */
export function isSupabaseConfigured(): boolean {
  return (
    Boolean(SUPABASE_CONFIG.url) &&
    Boolean(SUPABASE_CONFIG.publishableKey) &&
    SUPABASE_CONFIG.url.startsWith('https://')
  );
}

let clientInstance: SupabaseClient | null = null;

/**
 * Returns a singleton instance of the Supabase client initialized with the publishable key.
 * If Supabase is not configured, returns null.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return clientInstance;
}
