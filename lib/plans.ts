/**
 * Plan definitions and feature matrix for BoerenKompas
 */

export type PlanId = 'starter' | 'pro' | 'pro_advisor' | 'teams' | 'enterprise';

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  isPopular?: boolean;
}

export const PLAN_ORDER: PlanId[] = ['starter', 'pro', 'pro_advisor', 'teams', 'enterprise'];

export const PLAN_LABELS: Record<PlanId, string> = {
  starter: 'Starter',
  pro: 'Pro',
  pro_advisor: 'Pro+Adviseur',
  teams: 'Teams',
  enterprise: 'Enterprise'
};

export type FeatureId = 
  | 'exports_unlimited'
  | 'exports_monthly_limit'
  | 'dossier_check_full'
  | 'missing_items_generator'
  | 'advisor_portal'
  | 'multi_advisor_seats'
  | 'priority_support'
  | 'audit_log_full'
  | 'ai_compliance';

export const PLAN_FEATURES: Record<PlanId, Partial<Record<FeatureId, boolean | number>>> = {
  starter: {
    exports_monthly_limit: 2,
    dossier_check_full: false,
    missing_items_generator: false,
    advisor_portal: false,
    multi_advisor_seats: false,
    ai_compliance: false,
    audit_log_full: false,
  },
  pro: {
    exports_monthly_limit: 10,
    dossier_check_full: true,
    missing_items_generator: true,
    advisor_portal: false,
    multi_advisor_seats: false,
    ai_compliance: true,
    audit_log_full: true,
  },
  pro_advisor: {
    exports_unlimited: true,
    dossier_check_full: true,
    missing_items_generator: true,
    advisor_portal: true,
    multi_advisor_seats: false,
    ai_compliance: true,
    audit_log_full: true,
  },
  teams: {
    exports_unlimited: true,
    dossier_check_full: true,
    missing_items_generator: true,
    advisor_portal: true,
    multi_advisor_seats: true,
    ai_compliance: true,
    audit_log_full: true,
  },
  enterprise: {
    exports_unlimited: true,
    dossier_check_full: true,
    missing_items_generator: true,
    advisor_portal: true,
    multi_advisor_seats: true,
    ai_compliance: true,
    audit_log_full: true,
    priority_support: true,
  }
};

export function hasFeature(plan: PlanId, feature: FeatureId): boolean | number {
  const value = PLAN_FEATURES[plan]?.[feature];
  return value ?? false;
}

export function isPlanAtLeast(current: PlanId, required: PlanId): boolean {
  return PLAN_ORDER.indexOf(current) >= PLAN_ORDER.indexOf(required);
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '€99',
    description: 'Basis documentbeheer voor de zelfstandige ondernemer.',
    features: [
      'Dashboard + meldingen',
      'Kalender met reminders',
      'Mijn Documenten (5GB)',
      '2 dossier-exports per maand'
    ],
    cta: 'Start gratis'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€249',
    description: 'Voor bedrijven die grip willen op hun compliance.',
    features: [
      'Alles van Starter',
      'AI Dossier Check',
      'AI Missing Items Generator',
      '10 exports per maand',
      'E-mail support'
    ],
    isPopular: true,
    cta: 'Kies Pro'
  },
  {
    id: 'pro_advisor',
    name: 'Pro+Adviseur',
    price: '€349',
    description: 'Deel je dossiers direct met je vaste adviseur.',
    features: [
      'Alles van Pro',
      'Adviseursportaal toegang',
      'Onbeperkte exports',
      'Gedeelde dossiers'
    ],
    cta: 'Kies Pro+Adviseur'
  },
  {
    id: 'teams',
    name: 'Teams',
    price: '€499',
    description: 'Voor intensieve samenwerking met meerdere specialisten.',
    features: [
      'Alles van Pro+Adviseur',
      'Multi-adviseur seats (tot 5)',
      'Team beheer & rollen',
      'Prioriteit support'
    ],
    cta: 'Kies Teams'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Op aanvraag',
    description: 'Volledige ontzorging voor grote agrarische ondernemingen.',
    features: [
      'Alles van Teams',
      'Custom integraties',
      'Dedicated accountmanager',
      'On-site onboarding'
    ],
    cta: 'Contacteer ons'
  }
];

export function getPlan(id: PlanId | string): Plan {
  return PLANS.find(p => p.id === id) || PLANS[0];
}
