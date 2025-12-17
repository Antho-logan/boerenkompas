/**
 * Supabase Server Client
 * For use in Server Components, Server Actions, and Route Handlers
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './config';

export async function createServerSupabaseClient() {
    const cookieStore = await cookies();

    // During build or when not configured, use placeholder
    // This prevents build failures - actual calls will fail gracefully
    return createServerClient(
        supabaseUrl || 'https://placeholder.supabase.co',
        supabaseAnonKey || 'placeholder-key',
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing sessions.
                    }
                },
            },
        }
    );
}

/**
 * Get the current authenticated user or null
 */
export async function getCurrentUser() {
    if (!isSupabaseConfigured()) {
        return null;
    }
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Get current user or throw if not authenticated
 */
export async function requireUser() {
    if (!isSupabaseConfigured()) {
        throw new Error(
            'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local and restart the dev server.'
        );
    }
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Authentication required');
    }
    return user;
}
