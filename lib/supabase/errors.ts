/**
 * Custom error types for Supabase actions
 */

export class ExportLimitError extends Error {
  readonly status = 402;
  readonly code = 'EXPORT_LIMIT_REACHED';
  readonly limit: number;
  readonly used: number;
  readonly periodStart: string;
  readonly periodEnd: string;

  constructor(limit: number, used: number, periodStart: string, periodEnd: string) {
    super(`Exportlimiet bereikt (${used}/${limit})`);
    this.name = 'ExportLimitError';
    this.limit = limit;
    this.used = used;
    this.periodStart = periodStart;
    this.periodEnd = periodEnd;
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      limit: this.limit,
      used: this.used,
      periodStart: this.periodStart,
      periodEnd: this.periodEnd,
    };
  }
}

/**
 * Map API error responses to user-friendly Dutch messages.
 * Returns a user-facing message based on HTTP status and error code.
 */
export function mapApiErrorToMessage(
  status: number,
  data?: { code?: string; error?: string; requiredPlan?: string }
): string {
  // Permission denied
  if (status === 403) {
    if (data?.code === 'PLAN_UPGRADE_REQUIRED') {
      return `Upgrade naar ${data.requiredPlan || 'Pro'} vereist voor deze functie.`;
    }
    if (data?.code === 'FORBIDDEN') {
      return 'Je hebt geen rechten (admin vereist).';
    }
    // Default 403
    return 'Je hebt geen rechten (admin vereist).';
  }

  // Payment required / limit reached
  if (status === 402) {
    if (data?.code === 'EXPORT_LIMIT_REACHED') {
      return data.error || 'Je exportlimiet voor deze maand is bereikt.';
    }
    return 'Upgrade vereist voor deze functie.';
  }

  // Not authenticated
  if (status === 401) {
    return 'Je bent niet ingelogd. Log opnieuw in.';
  }

  // Not found
  if (status === 404) {
    return 'Item niet gevonden.';
  }

  // Bad request
  if (status === 400) {
    return data?.error || 'Ongeldige aanvraag.';
  }

  // Server error
  if (status >= 500) {
    return 'Er is een serverfout opgetreden. Probeer het later opnieuw.';
  }

  // Generic
  return data?.error || 'Er is iets misgegaan. Probeer het opnieuw.';
}

/**
 * Check if a role is admin (owner or advisor).
 */
export function isAdminRole(role: string): boolean {
  return role === 'owner' || role === 'advisor';
}

/**
 * Check if a role can perform write actions.
 * Owners and advisors can write. Staff and viewers cannot.
 */
export function canWrite(role: string): boolean {
  return role === 'owner' || role === 'advisor';
}
