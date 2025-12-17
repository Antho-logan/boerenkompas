import {
    MOCK_TENANTS, MOCK_USER, MOCK_MEMBERSHIPS, MOCK_KPIS,
    MOCK_TASKS, MOCK_DOCS, MOCK_AUDIT_LOG, MOCK_NOTIFICATIONS, MOCK_AI_CHECKS
} from '@/lib/mock';

// Simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generic fetch wrapper (mocks APIs for now)
export async function apiFetch<T>(endpoint: string): Promise<T> {
    await delay(200 + Math.random() * 200); // 200-400ms latency

    console.log(`[API Mock] GET ${endpoint}`);

    // Router logic for mock data
    if (endpoint === '/user/me') {
        return MOCK_USER as unknown as T;
    }

    if (endpoint === '/tenants') {
        // Return tenants user has access to
        const myTenantIds = MOCK_MEMBERSHIPS.filter(m => m.userId === MOCK_USER.id).map(m => m.tenantId);
        return MOCK_TENANTS.filter(t => myTenantIds.includes(t.id)) as unknown as T;
    }

    // Tenant scoped endpoints
    // e.g. /tenants/t-1/kpis
    const tenantMatch = endpoint.match(/\/tenants\/([^\/]+)\/(.+)/);
    if (tenantMatch) {
        const [, tenantId, resource] = tenantMatch;

        if (resource === 'kpis') {
            return (MOCK_KPIS[tenantId] || []) as unknown as T;
        }

        // For other resources, we just return general mock data mixed, 
        // in a real app we would filter by tenantId from the database
        if (resource === 'tasks') return MOCK_TASKS as unknown as T;
        if (resource === 'documents') return MOCK_DOCS as unknown as T;
        if (resource === 'audit') return MOCK_AUDIT_LOG as unknown as T;
        if (resource === 'notifications') return MOCK_NOTIFICATIONS as unknown as T;
        if (resource === 'ai/checks') return MOCK_AI_CHECKS as unknown as T;
    }

    throw new Error(`Endpoint not found: ${endpoint}`);
}
