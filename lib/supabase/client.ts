/**
 * Supabase Client - Browser-side client
 * Uses @supabase/ssr for proper cookie-based session handling
 */

import { createBrowserClient } from '@supabase/ssr';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './config';

export function createClient() {
    // During build or when not configured, return a dummy URL
    // This prevents build failures - actual auth will fail gracefully at runtime
    return createBrowserClient(
        supabaseUrl || 'https://placeholder.supabase.co',
        supabaseAnonKey || 'placeholder-key'
    );
}

export { isSupabaseConfigured };
