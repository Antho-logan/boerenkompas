import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { supabaseUrl } from './config';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createServiceSupabaseClient() {
    if (!supabaseUrl) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
    }
    if (!serviceRoleKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
