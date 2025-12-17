"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { Notification } from "@/lib/types"
import { useTenant } from "@/components/app/TenantProvider"
import { Card } from "@/components/ui/card"
import { Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { nl } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"

export default function NotificationsPage() {
    const { tenant } = useTenant();
    const [notificationsByTenant, setNotificationsByTenant] = useState<Record<string, Notification[]>>({})

    const tenantId = tenant?.id
    const notifications = tenantId ? notificationsByTenant[tenantId] : undefined
    const loading = !!tenantId && !notifications
    const list = notifications ?? []

    const unreadCount = list.filter(n => !n.read).length

    useEffect(() => {
        if (!tenantId) return
        if (notificationsByTenant[tenantId]) return

        apiFetch<Notification[]>(`/tenants/${tenantId}/notifications`).then((data) => {
            setNotificationsByTenant((prev) => ({ ...prev, [tenantId]: data }))
        })
    }, [tenantId, notificationsByTenant]);

    const markAsRead = (id: string) => {
        if (!tenantId) return
        setNotificationsByTenant((prev) => ({
            ...prev,
            [tenantId]: (prev[tenantId] ?? []).map((n) => (n.id === id ? { ...n, read: true } : n)),
        }))
    };

    const markAllAsRead = () => {
        if (!tenantId) return
        setNotificationsByTenant((prev) => ({
            ...prev,
            [tenantId]: (prev[tenantId] ?? []).map((n) => ({ ...n, read: true })),
        }))
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Notificaties</h1>
                <Button variant="outline" size="sm" disabled={loading || unreadCount === 0} onClick={markAllAsRead}>
                    Alles lezen
                </Button>
            </div>

            <div className="space-y-3">
                {loading ? (
                    [1, 2, 3].map((i) => (
                        <Card key={i} className="p-4 border-slate-200 shadow-sm">
                            <div className="flex gap-4">
                                <Skeleton className="mt-1 size-8 rounded-full" />
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <Skeleton className="h-4 w-40 rounded-md" />
                                        <Skeleton className="h-3 w-16 rounded-md" />
                                    </div>
                                    <Skeleton className="mt-2 h-3 w-full rounded-md" />
                                    <Skeleton className="mt-1 h-3 w-5/6 rounded-md" />
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    list.length === 0 ? (
                        <Card className="p-8 text-center border-slate-200">
                            <div className="text-sm font-semibold text-slate-900">Geen notificaties</div>
                            <div className="text-xs text-slate-500 mt-1">Als er iets belangrijks is, zie je het hier direct.</div>
                        </Card>
                    ) : (
                        list.map(n => (
                            <Card key={n.id} className={`p-4 transition-all ${n.read ? 'bg-white opacity-60' : 'bg-white border-l-4 border-l-emerald-500 shadow-sm'}`}>
                                <div className="flex gap-4">
                                    <div className={`mt-1 size-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'alert' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                                        <Bell size={14} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <h4 className={`text-sm font-bold ${n.read ? 'text-slate-600' : 'text-slate-900'}`}>{n.title}</h4>
                                            <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                                {formatDistanceToNow(new Date(n.timestamp), { addSuffix: true, locale: nl })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 mt-1">{n.message}</p>

                                        {!n.read && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="mt-2 h-6 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                onClick={() => markAsRead(n.id)}
                                            >
                                                <Check size={12} className="mr-1" /> Markeer als gelezen
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))
                    )
                )}
            </div>
        </div>
    )
}
