import {
    MOCK_TENANTS, MOCK_USER, MOCK_MEMBERSHIPS,
    MOCK_TASKS, MOCK_DOCS, MOCK_AUDIT_LOG, MOCK_NOTIFICATIONS, MOCK_AI_CHECKS
} from '@/lib/mock';

// Simulate network latency for mock endpoints
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generic fetch wrapper
 * Routes to real API endpoints where available, falls back to mock data
 */
export async function apiFetch<T>(endpoint: string): Promise<T> {
    // Tenant scoped endpoints - check for real API routes first
    const tenantMatch = endpoint.match(/\/tenants\/([^\/]+)\/(.+)/);
    if (tenantMatch) {
        const [, , resource] = tenantMatch;

        // KPIs - use real Supabase-backed API
        if (resource === 'kpis') {
            const response = await fetch('/api/kpis', {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                console.error(`[API] GET /api/kpis failed: ${response.status}`);
                throw new Error(`Failed to fetch KPIs: ${response.statusText}`);
            }

            return response.json() as Promise<T>;
        }

        // AI Checks - use real API (falls through to mock for now)
        if (resource === 'ai/checks') {
            await delay(200 + Math.random() * 200);
            return MOCK_AI_CHECKS as unknown as T;
        }

        // Other resources still use mock data
        await delay(200 + Math.random() * 200);
        console.log(`[API Mock] GET ${endpoint}`);

        if (resource === 'tasks') return MOCK_TASKS as unknown as T;
        if (resource === 'documents') return MOCK_DOCS as unknown as T;
        if (resource === 'audit') return MOCK_AUDIT_LOG as unknown as T;
        if (resource === 'notifications') return MOCK_NOTIFICATIONS as unknown as T;
    }

    // Non-tenant endpoints (still mock)
    await delay(200 + Math.random() * 200);
    console.log(`[API Mock] GET ${endpoint}`);

    if (endpoint === '/user/me') {
        return MOCK_USER as unknown as T;
    }

    if (endpoint === '/tenants') {
        const myTenantIds = MOCK_MEMBERSHIPS.filter(m => m.userId === MOCK_USER.id).map(m => m.tenantId);
        return MOCK_TENANTS.filter(t => myTenantIds.includes(t.id)) as unknown as T;
    }

    throw new Error(`Endpoint not found: ${endpoint}`);
}
