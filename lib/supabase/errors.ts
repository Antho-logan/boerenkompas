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

