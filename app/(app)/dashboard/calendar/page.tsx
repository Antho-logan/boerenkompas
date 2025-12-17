"use client"

import { useState, useEffect, useCallback } from "react"
import { CalendarControlBar, MonthGrid, SidebarList } from "@/components/calendar/calendar-views"
import { SlideOver, ItemDetails } from "@/components/calendar/calendar-overlays"
import { CalendarItem, CalendarViewType } from "@/lib/calendar/types"
import { Zap, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTenant } from "@/components/app/TenantProvider"
import type { TaskWithRequirement } from "@/lib/supabase/types"

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

export default function CalendarPage() {
    const { tenant } = useTenant();
    const [view, setView] = useState<CalendarViewType>('month')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [items, setItems] = useState<CalendarItem[]>([])
    const [loading, setLoading] = useState(true)

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
        if (!selectedItem) return

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
            }
        } catch (error) {
            console.error('Error marking task done:', error);
        }

        setIsSheetOpen(false)
    }

    const handleDelete = async () => {
        if (!selectedItem) return

        try {
            await fetch(`/api/tasks/${selectedItem.id}`, {
                method: 'DELETE',
            });
            setItems(prev => prev.filter(i => i.id !== selectedItem.id));
        } catch (error) {
            console.error('Error deleting task:', error);
        }

        setIsSheetOpen(false)
    }

    // Filters for Right Panel
    const urgentItems = items.filter(i => i.priority === 'urgent' && i.status !== 'done')
    const upcomingItems = items.filter(i => i.date >= currentDate && i.status !== 'done').slice(0, 5)

    if (loading) {
        return (
            <div className="space-y-6 animate-fade-in-up">
                <CalendarControlBar
                    view={view}
                    setView={setView}
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    onNewItem={() => { }}
                />
                <div className="h-[600px] flex items-center justify-center text-slate-400">
                    <Loader2 className="size-8 animate-spin mr-2" />
                    Kalender laden...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">

            {/* Controls */}
            <CalendarControlBar
                view={view}
                setView={setView}
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                onNewItem={() => { }} // Placeholder
            />

            <div className="flex flex-col xl:flex-row gap-6 items-start">

                {/* Main Calendar Surface */}
                <div className="flex-1 w-full xl:min-w-0">
                    {view === 'month' && (
                        <MonthGrid
                            currentDate={currentDate}
                            items={items}
                            onItemClick={handleItemClick}
                        />
                    )}
                    {view !== 'month' && (
                        <div className="h-[600px] flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400">
                            View &apos;Week/Agenda&apos; coming soon in MVP.
                        </div>
                    )}
                </div>

                {/* Right Sidebar Panel */}
                <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0">
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

                    {/* Updates Feed */}
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-xl shadow-lg border-slate-700 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 w-24 h-24 bg-emerald-500/20 blur-[40px] rounded-full group-hover:bg-emerald-500/30 transition-colors"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                                <Zap size={14} fill="currentColor" /> Wetgeving Update
                            </div>
                            <h4 className="font-bold text-sm leading-snug">Derogatie wijziging 2025</h4>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                                Nieuwe voorwaarden gepubliceerd. Impact op mestplaatsingsruimte verwacht.
                            </p>
                            <Button size="sm" variant="secondary" className="mt-4 w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs h-8">
                                Maak agenda-item aan
                            </Button>
                        </div>
                    </Card>
                </div>

            </div>

            <SlideOver isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title="Details">
                {selectedItem && (
                    <ItemDetails
                        item={selectedItem}
                        onMarkDone={handleMarkDone}
                        onDelete={handleDelete}
                    />
                )}
            </SlideOver>
        </div>
    )
}
