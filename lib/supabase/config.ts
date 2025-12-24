/**
 * Supabase configuration (public env vars).
 * Single source of truth for env reading + validation.
 * 
 * NOTE: This module is evaluated at import time (module scope).
 * For Next.js dev with HMR, the config is re-evaluated on file changes.
 * The env vars themselves are loaded by Next.js from .env.local at startup.
 */

export type SupabaseConfigIssue =
    | 'missing_url'
    | 'missing_anon_key'
    | 'invalid_url'
    | 'placeholder_url'
    | 'invalid_anon_key'
    | 'placeholder_anon_key';

export type SupabaseConfig = {
    supabaseUrl: string | null;
    supabaseAnonKey: string | null;
    isConfigured: boolean;
    issues: SupabaseConfigIssue[];
};

function normalizeEnv(value: string | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}

function stripTrailingSlash(value: string): string {
    return value.endsWith('/') ? value.slice(0, -1) : value;
}

function looksLikeHttpsUrl(value: string): boolean {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Check if value looks like a valid Supabase JWT.
 * Real anon keys are JWTs with 3 dot-separated parts, typically 200+ chars.
 */
function looksJwtLike(value: string): boolean {
    const parts = value.split('.');
    // Must have exactly 3 parts (header.payload.signature)
    if (parts.length !== 3) return false;
    // Each part must have content
    if (parts.some(p => p.length < 10)) return false;
    // Total length check - real JWTs are 150+ chars minimum
    if (value.length < 100) return false;
    return true;
}

/**
 * Detect placeholder URLs that should trigger config warnings.
 * Only flags obvious placeholders, not real Supabase URLs.
 */
function isPlaceholderUrl(value: string): boolean {
    const lower = value.toLowerCase();
    
    // Explicit placeholder patterns
    if (lower.includes('your-project-id')) return true;
    if (lower.includes('jouw-project-id')) return true;
    if (lower.includes('project-ref')) return true;
    if (lower.includes('placeholder')) return true;
    if (lower.includes('example')) return true;
    if (lower.includes('xxx')) return true;
    
    // Empty or malformed supabase.co URL
    if (/https:\/\/\.?supabase\.co/i.test(lower)) return true;
    
    // Check for valid project ref format
    try {
        const parsed = new URL(value);
        if (parsed.host.endsWith('.supabase.co')) {
            const parts = parsed.host.split('.');
            if (parts.length >= 3) {
                const projectRef = parts[0];
                // Real project refs are alphanumeric, typically 20+ chars
                // Flag if it looks like a template/placeholder
                if (projectRef.length < 10) return true;
            }
        }
    } catch {
        // URL parsing failed - will be caught by invalid_url check
    }
    
    return false;
}

/**
 * Detect placeholder anon keys.
 */
function isPlaceholderAnonKey(value: string): boolean {
    const lower = value.toLowerCase();
    
    // Explicit placeholder patterns
    if (lower === 'your-anon-key') return true;
    if (lower === 'jouw_anon_public_key') return true;
    if (lower.includes('placeholder')) return true;
    if (lower.includes('your_')) return true;
    if (lower.includes('your-')) return true;
    
    // Too short to be a real JWT
    if (value.length < 50) return true;
    
    return false;
}

function buildConfig(): SupabaseConfig {
    const rawUrl = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const rawAnonKey = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const supabaseUrl = rawUrl ? stripTrailingSlash(rawUrl) : null;
    const supabaseAnonKey = rawAnonKey;

    const issues: SupabaseConfigIssue[] = [];

    // Check URL
    if (!supabaseUrl) {
        issues.push('missing_url');
    } else {
        if (!looksLikeHttpsUrl(supabaseUrl)) {
            issues.push('invalid_url');
        }
        if (isPlaceholderUrl(supabaseUrl)) {
            issues.push('placeholder_url');
        }
    }

    // Check Anon Key
    if (!supabaseAnonKey) {
        issues.push('missing_anon_key');
    } else {
        // Check placeholder first (more specific)
        if (isPlaceholderAnonKey(supabaseAnonKey)) {
            issues.push('placeholder_anon_key');
        } else if (!looksJwtLike(supabaseAnonKey)) {
            issues.push('invalid_anon_key');
        }
    }

    return {
        supabaseUrl,
        supabaseAnonKey,
        isConfigured: issues.length === 0,
        issues,
    };
}

// Build config at module load time
const computedConfig = buildConfig();

export const supabaseUrl = computedConfig.supabaseUrl;
export const supabaseAnonKey = computedConfig.supabaseAnonKey;

// Safe dev log to verify loaded config (no secrets)
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
    const host = computedConfig.supabaseUrl 
        ? (() => { try { return new URL(computedConfig.supabaseUrl).host; } catch { return '(invalid)'; } })()
        : '(missing)';
    
    const keyInfo = computedConfig.supabaseAnonKey
        ? `Present (len=${computedConfig.supabaseAnonKey.length}, dots=${(computedConfig.supabaseAnonKey.match(/\./g) || []).length})`
        : 'MISSING';
    
    console.log('[Supabase Config]', {
        host,
        anonKey: keyInfo,
        isConfigured: computedConfig.isConfigured,
        issues: computedConfig.issues.length > 0 ? computedConfig.issues : 'none',
    });
}

export function getSupabaseConfig(): SupabaseConfig {
    return computedConfig;
}

export function isSupabaseConfigured(): boolean {
    return computedConfig.isConfigured;
}

export function getSupabaseUrlHost(): string | null {
    if (!computedConfig.supabaseUrl) return null;
    try {
        return new URL(computedConfig.supabaseUrl).host;
    } catch {
        return null;
    }
}

export type SupabaseConnectivityProbeResult =
    | {
        ok: true;
        endpoint: string;
        status: number;
        elapsedMs: number;
    }
    | {
        ok: false;
        endpoint: string;
        status?: number;
        elapsedMs: number;
        error: unknown;
    };

export async function probeSupabaseConnectivity(
    timeoutMs = 2500
): Promise<SupabaseConnectivityProbeResult> {
    const baseUrl = computedConfig.supabaseUrl;
    const endpoint = baseUrl ? `${baseUrl}/auth/v1/health` : '(missing_supabase_url)';
    const startedAt = Date.now();

    if (!baseUrl) {
        return {
            ok: false,
            endpoint,
            elapsedMs: Date.now() - startedAt,
            error: new Error('Missing NEXT_PUBLIC_SUPABASE_URL'),
        };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            signal: controller.signal,
        });

        const elapsedMs = Date.now() - startedAt;
        if (response.ok) {
            return {
                ok: true,
                endpoint,
                status: response.status,
                elapsedMs,
            };
        }
        return {
            ok: false,
            endpoint,
            status: response.status,
            elapsedMs,
            error: new Error(`Health check returned ${response.status}`),
        };
    } catch (error) {
        return {
            ok: false,
            endpoint,
            elapsedMs: Date.now() - startedAt,
            error,
        };
    } finally {
        clearTimeout(timeoutId);
    }
}
