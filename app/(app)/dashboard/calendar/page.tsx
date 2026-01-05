"use client"

import { useState, useEffect, useCallback } from "react"
import { CalendarControlBar, MonthGrid, SidebarList } from "@/components/calendar/calendar-views"
import { SlideOver } from "@/components/calendar/calendar-overlays"
import { CalendarItem, CalendarViewType } from "@/lib/calendar/types"
import { Zap } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useTenant } from "@/components/app/TenantProvider"
import { Can } from "@/components/app/RBAC"
import { DisabledCta } from "@/components/ui/preview-badge"
import type { TaskWithRequirement } from "@/lib/supabase/types"
import { mapApiErrorToMessage, canWrite } from "@/lib/supabase/errors"
import DashboardPage from "@/components/app/DashboardPage"

// Notification toast component
function ErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-3">
            <span className="flex-1">{message}</span>
            <button onClick={onDismiss} className="text-amber-600 hover:text-amber-800" aria-label="Sluiten">×</button>
        </div>
    );
}

// Skeleton for calendar loading state
function CalendarSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-7 border-b border-slate-100">
                {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day) => (
                    <div key={day} className="p-3 text-center border-r border-slate-100 last:border-r-0">
                        <span className="text-xs font-medium text-slate-400">{day}</span>
                    </div>
                ))}
            </div>
            {/* Calendar grid skeleton */}
            {[1, 2, 3, 4, 5].map((week) => (
                <div key={week} className="grid grid-cols-7">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                        <div key={day} className="h-24 p-2 border-r border-b border-slate-100 last:border-r-0">
                            <Skeleton className="h-4 w-6 rounded mb-2" />
                            {day % 3 === 0 && <Skeleton className="h-5 w-full rounded-md" />}
                            {day % 4 === 0 && <Skeleton className="h-5 w-3/4 rounded-md mt-1" />}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

// Skeleton for sidebar lists
function SidebarSkeleton() {
    return (
        <Card className="p-4 space-y-3">
            <Skeleton className="h-4 w-24 rounded" />
            <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="size-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-3 w-full rounded" />
                            <Skeleton className="h-2 w-2/3 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// Convert task to calendar item format
function taskToCalendarItem(task: TaskWithRequirement): CalendarItem {
    return {
        id: task.id,
        title: task.title,
        date: task.due_at ? new Date(task.due_at) : new Date(),
        type: task.source === 'missing_item' ? 'document' : 'task',
        status: task.status === 'done' ? 'done' : 'open',
        priority: task.priority === 'urgent' ? 'urgent' : task.priority === 'low' ? 'normal' : 'soon',
        source: task.source === 'missing_item' ? 'dossierbouwer' : 'manual',
        notes: task.requirement?.notes || undefined,
    };
}

// Admin-only Item Details component
function ItemDetailsAdmin({ 
    item, 
    onMarkDone, 
    onDelete,
    isAdmin 
}: { 
    item: CalendarItem; 
    onMarkDone: () => void; 
    onDelete: () => void;
    isAdmin: boolean;
}) {
    if (!item) return null;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-500 mt-1">
                    {item.date.toLocaleDateString('nl-NL', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                    })}
                </p>
            </div>

            {item.notes && (
                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
                    {item.notes}
                </div>
            )}

            {/* Action buttons - only for admins */}
            {isAdmin ? (
                <div className="space-y-2">
                    {item.status !== 'done' && (
                        <Button 
                            onClick={onMarkDone} 
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            Markeer als voltooid
                        </Button>
                    )}
                    <Button 
                        variant="outline" 
                        onClick={onDelete}
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                        Verwijderen
                    </Button>
                </div>
            ) : (
                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-500">
                    Je hebt alleen leesrechten. Neem contact op met een admin om taken aan te passen.
                </div>
            )}
        </div>
    );
}

export default function CalendarPage() {
    const { tenant, role } = useTenant();
    const [view, setView] = useState<CalendarViewType>('month')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [items, setItems] = useState<CalendarItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const isAdmin = canWrite(role);

    // Selection State
    const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    // Fetch tasks
    const fetchTasks = useCallback(async () => {
        if (!tenant) return;

        setLoading(true);
        try {
            const response = await fetch('/api/tasks');
            if (response.ok) {
                const data = await response.json();
                setItems((data.tasks || []).map(taskToCalendarItem));
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    }, [tenant]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Handlers
    const handleItemClick = (item: CalendarItem) => {
        setSelectedItem(item)
        setIsSheetOpen(true)
    }

    const handleMarkDone = async () => {
        if (!selectedItem || !isAdmin) {
            setError('Je hebt geen rechten (admin vereist).');
            setIsSheetOpen(false);
            return;
        }

        try {
            const response = await fetch(`/api/tasks/${selectedItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'done' }),
            });

            if (response.ok) {
                setItems(prev => prev.map(i =>
                    i.id === selectedItem.id ? { ...i, status: 'done' } : i
                ));
            } else {
                const data = await response.json().catch(() => ({}));
                setError(mapApiErrorToMessage(response.status, data));
            }
        } catch (error) {
            console.error('Error marking task done:', error);
            setError('Er is iets misgegaan. Probeer het opnieuw.');
        }

        setIsSheetOpen(false)
    }

    const handleDelete = async () => {
        if (!selectedItem || !isAdmin) {
            setError('Je hebt geen rechten (admin vereist).');
            setIsSheetOpen(false);
            return;
        }

        try {
            const response = await fetch(`/api/tasks/${selectedItem.id}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                setItems(prev => prev.filter(i => i.id !== selectedItem.id));
            } else {
                const data = await response.json().catch(() => ({}));
                setError(mapApiErrorToMessage(response.status, data));
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            setError('Er is iets misgegaan. Probeer het opnieuw.');
        }

        setIsSheetOpen(false)
    }

    // Filters for Right Panel
    const urgentItems = items.filter(i => i.priority === 'urgent' && i.status !== 'done')
    const upcomingItems = items.filter(i => i.date >= currentDate && i.status !== 'done').slice(0, 5)

    return (
        <DashboardPage
            title="Kalender"
            description="Plan taken, deadlines en compliance herinneringen op één plek."
            className="animate-fade-in-up"
        >
            <CalendarControlBar
                view={view}
                setView={setView}
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                newItemDisabledReason="Agenda-items aanmaken komt binnenkort."
            />

            <div className="flex flex-col xl:flex-row gap-6 items-start">

                {/* Main Calendar Surface */}
                <div className="flex-1 w-full xl:min-w-0">
                    {loading ? (
                        <CalendarSkeleton />
                    ) : view === 'month' ? (
                        <MonthGrid
                            currentDate={currentDate}
                            items={items}
                            onItemClick={handleItemClick}
                        />
                    ) : (
                        <div className="h-[600px] flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400">
                            View &apos;Week/Agenda&apos; coming soon in MVP.
                        </div>
                    )}
                </div>

                {/* Right Sidebar Panel */}
                <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
                    {loading ? (
                        <>
                            <SidebarSkeleton />
                            <SidebarSkeleton />
                        </>
                    ) : (
                        <>
                            <SidebarList
                                title="Urgent & Actie"
                                items={urgentItems}
                                onItemClick={handleItemClick}
                            />

                            <SidebarList
                                title="Komende 7 dagen"
                                items={upcomingItems}
                                onItemClick={handleItemClick}
                            />
                        </>
                    )}

                    {/* Updates Feed - only show action button for admins */}
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-xl shadow-lg border-slate-700 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 w-24 h-24 bg-emerald-500/20 blur-[40px] rounded-full group-hover:bg-emerald-500/30 transition-colors" aria-hidden="true"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                                <Zap size={14} fill="currentColor" aria-hidden="true" /> Wetgeving Update
                            </div>
                            <h4 className="font-bold text-sm leading-snug">Derogatie wijziging 2025</h4>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                                Nieuwe voorwaarden gepubliceerd. Impact op mestplaatsingsruimte verwacht.
                            </p>
                            <Can roles={['owner', 'advisor']}>
                                <DisabledCta reason="Agenda-items aanmaken komt binnenkort.">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="mt-4 w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs h-8"
                                        disabled
                                    >
                                        Binnenkort
                                    </Button>
                                </DisabledCta>
                            </Can>
                        </div>
                    </Card>
                </div>

            </div>

            <SlideOver isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title="Details">
                {selectedItem && (
                    <ItemDetailsAdmin
                        item={selectedItem}
                        onMarkDone={handleMarkDone}
                        onDelete={handleDelete}
                        isAdmin={isAdmin}
                    />
                )}
            </SlideOver>

            {/* Error Toast */}
            {error && <ErrorToast message={error} onDismiss={() => setError(null)} />}
        </DashboardPage>
    )
}
