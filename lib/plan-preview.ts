/**
 * Plan Preview Utilities
 * 
 * Allows toggling between subscription plans for demo/development purposes
 * without affecting the actual database state.
 */

import { PlanId } from "./plans";

const PREVIEW_KEY = "bk_plan_preview";

/**
 * Check if plan preview is enabled in current environment
 */
export function isPlanPreviewEnabled(): boolean {
  if (typeof window === "undefined") return false;
  
  return (
    process.env.NODE_ENV !== "production" || 
    process.env.NEXT_PUBLIC_ENABLE_PLAN_PREVIEW === "true" ||
    window.location.hostname === "localhost"
  );
}

/**
 * Get the currently active preview plan from localStorage
 */
export function getPlanPreview(): PlanId | null {
  if (!isPlanPreviewEnabled()) return null;
  
  const saved = localStorage.getItem(PREVIEW_KEY);
  if (!saved) return null;
  
  return saved as PlanId;
}

/**
 * Set a new preview plan
 */
export function setPlanPreview(plan: PlanId): void {
  if (!isPlanPreviewEnabled()) return;
  localStorage.setItem(PREVIEW_KEY, plan);
}

/**
 * Clear the preview plan and revert to real plan
 */
export function clearPlanPreview(): void {
  localStorage.removeItem(PREVIEW_KEY);
}

