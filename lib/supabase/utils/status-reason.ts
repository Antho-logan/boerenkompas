/**
 * Status Reason Helper
 * 
 * Pure utility function to explain why a requirement has a certain status.
 * NOT a server action - can be used client-side.
 */

import type { RequirementWithStatus } from '@/lib/supabase/types';

/**
 * Get the reason why a requirement has a certain status
 * Returns human-readable explanation for UI
 */
export function getStatusReason(
    req: RequirementWithStatus
): { reason: string; detail?: string } {
    const { linkStatus, linkedDocument: doc, documentLink, recency_days } = req;

    switch (linkStatus) {
        case 'satisfied':
            return { reason: 'Document voldoet aan de vereisten' };

        case 'missing':
            if (!documentLink) {
                return {
                    reason: 'Geen document gekoppeld',
                    detail: 'Koppel een bestaand document of upload een nieuw document.'
                };
            }
            if (documentLink.status_override === 'rejected') {
                return {
                    reason: 'Document afgekeurd',
                    detail: 'Het gekoppelde document is handmatig afgekeurd.'
                };
            }
            return { reason: 'Document ontbreekt' };

        case 'expired':
            if (doc?.status === 'expired') {
                return {
                    reason: 'Document is verlopen',
                    detail: doc.expires_at
                        ? `Verloopt op ${new Date(doc.expires_at).toLocaleDateString('nl-NL')}`
                        : 'Document status is "verlopen"'
                };
            }
            if (doc?.expires_at && new Date(doc.expires_at) < new Date()) {
                return {
                    reason: 'Document is verlopen',
                    detail: `Verlopen op ${new Date(doc.expires_at).toLocaleDateString('nl-NL')}`
                };
            }
            if (recency_days && doc) {
                const docDate = doc.doc_date ? new Date(doc.doc_date) : null;
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - recency_days);

                if (!docDate) {
                    return {
                        reason: 'Documentdatum ontbreekt',
                        detail: `Dit document moet een datum hebben (max ${recency_days} dagen oud)`
                    };
                }
                if (docDate < cutoff) {
                    return {
                        reason: 'Document is te oud',
                        detail: `Document van ${docDate.toLocaleDateString('nl-NL')} is ouder dan ${recency_days} dagen`
                    };
                }
            }
            return { reason: 'Document is niet meer geldig' };

        case 'needs_review':
            if (documentLink?.status_override === 'not_sure') {
                return {
                    reason: 'Handmatig gemarkeerd voor controle',
                    detail: 'Dit document is handmatig gemarkeerd als "onzeker"'
                };
            }
            if (doc?.status === 'needs_review') {
                return {
                    reason: 'Document moet gecontroleerd worden',
                    detail: 'Controleer de inhoud en markeer als "ok" of "verlopen"'
                };
            }
            return { reason: 'Controle vereist' };

        default:
            return { reason: 'Onbekende status' };
    }
}



