"use client"

import { useEffect, useState, useCallback } from "react"
import { useTenant } from "@/components/app/TenantProvider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import DashboardPage from "@/components/app/DashboardPage"

interface AuditEvent {
    id: string;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    meta: Record<string, unknown>;
    created_at: string;
    actorName: string;
    actorRole: string;
    details: string;
    severity: string;
}

export default function AuditPage() {
    const { tenant } = useTenant();
    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAuditLog = useCallback(async () => {
        if (!tenant) return;

        setLoading(true);
        try {
            const response = await fetch('/api/audit');
            if (response.ok) {
                const data = await response.json();
                setEvents(data.events || []);
            }
        } catch (error) {
            console.error('Error fetching audit log:', error);
        } finally {
            setLoading(false);
        }
    }, [tenant]);

    useEffect(() => {
        fetchAuditLog();
    }, [fetchAuditLog]);

    return (
        <DashboardPage
            title="Audit log"
            description="Volledig overzicht van acties en wijzigingen in dit dossier."
            className="animate-fade-in-up"
        >
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            <div className="grid grid-cols-5 gap-3 px-2 py-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Skeleton key={i} className="h-4 w-full rounded-md" />
                                ))}
                            </div>
                            {[1, 2, 3, 4, 5, 6].map((row) => (
                                <div key={row} className="grid grid-cols-5 gap-3 px-2 py-3 border-t border-slate-100">
                                    {[1, 2, 3, 4, 5].map((col) => (
                                        <Skeleton key={col} className="h-3 w-full rounded-md" />
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : events.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            Nog geen audit events gelogd.
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Tijdstip</th>
                                    <th className="px-6 py-4">Gebruiker</th>
                                    <th className="px-6 py-4">Actie</th>
                                    <th className="px-6 py-4">Details</th>
                                    <th className="px-6 py-4">Type</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {events.map((ev) => (
                                    <tr key={ev.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                            {format(new Date(ev.created_at), "d MMM yyyy, HH:mm", { locale: nl })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{ev.actorName}</div>
                                            <div className="text-xs text-slate-400 capitalize">{ev.actorRole}</div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            {formatActionName(ev.action)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 max-w-sm truncate">
                                            {ev.details}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={
                                                ev.severity === 'warning' ? 'border-orange-200 text-orange-700 bg-orange-50' :
                                                    'border-slate-200 text-slate-600'
                                            }>
                                                {ev.severity}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </DashboardPage>
    )
}

function formatActionName(action: string): string {
    const actionMap: Record<string, string> = {
        'document.created': 'Document geüpload',
        'document.updated': 'Document bijgewerkt',
        'document.deleted': 'Document verwijderd',
        'task.created': 'Taak aangemaakt',
        'task.completed': 'Taak afgerond',
        'export.created': 'Export gegenereerd',
        'missing_items.generated': 'Missende items',
        'tenant.created': 'Bedrijf aangemaakt',
        'member.added': 'Lid toegevoegd',
        'member.removed': 'Lid verwijderd',
        'member.role_updated': 'Rol gewijzigd',
    };
    return actionMap[action] || action;
}
