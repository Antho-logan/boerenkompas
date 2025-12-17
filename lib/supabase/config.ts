/**
 * Supabase configuration (public env vars).
 * Single source of truth for env reading + validation.
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

function looksJwtLike(value: string): boolean {
    return value.split('.').filter(Boolean).length >= 3;
}

function isPlaceholderUrl(value: string): boolean {
    const lower = value.toLowerCase();
    // Only flag known exact placeholders or very obvious patterns containing specific keywords
    return (
        lower.includes('your-project-id') ||
        lower.includes('jouw-project-id') ||
        lower.includes('project-ref') ||
        lower.includes('placeholder')
    );
}

function isPlaceholderAnonKey(value: string): boolean {
    const lower = value.toLowerCase();
    return (
        lower === 'your-anon-key' ||
        lower === 'jouw_anon_public_key' ||
        lower.includes('placeholder')
    );
}

function buildConfig(): SupabaseConfig {
    const rawUrl = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const rawAnonKey = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const supabaseUrl = rawUrl ? stripTrailingSlash(rawUrl) : null;
    const supabaseAnonKey = rawAnonKey;

    const issues: SupabaseConfigIssue[] = [];

    if (!supabaseUrl) issues.push('missing_url');
    if (!supabaseAnonKey) issues.push('missing_anon_key');

    if (supabaseUrl) {
        if (!looksLikeHttpsUrl(supabaseUrl)) issues.push('invalid_url');
        if (isPlaceholderUrl(supabaseUrl)) issues.push('placeholder_url');
    }

    if (supabaseAnonKey) {
        if (!looksJwtLike(supabaseAnonKey)) issues.push('invalid_anon_key');
        if (isPlaceholderAnonKey(supabaseAnonKey)) issues.push('placeholder_anon_key');
    }

    return {
        supabaseUrl,
        supabaseAnonKey,
        isConfigured: issues.length === 0,
        issues,
    };
}

const computedConfig = buildConfig();

export const supabaseUrl = computedConfig.supabaseUrl;
export const supabaseAnonKey = computedConfig.supabaseAnonKey;

// Safe dev log to verify loaded config
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
    const host = computedConfig.supabaseUrl ? new URL(computedConfig.supabaseUrl).host : '(missing)';
    console.log('[Supabase Config] Host:', host, '| Anon Key Present:', !!computedConfig.supabaseAnonKey);
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
