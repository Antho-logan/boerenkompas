"use client"

import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
// Utils
import { MONTHS_NL, SHORT_DAYS_NL, getMonthGrid, isSameDay, isToday } from "./calendar-utils"
import { CalendarItem, CalendarViewType } from "@/lib/calendar/types"

// --- Components ---

export function CalendarControlBar({
    view, setView,
    currentDate, setCurrentDate,
    onNewItem
}: {
    view: CalendarViewType,
    setView: (v: CalendarViewType) => void,
    currentDate: Date,
    setCurrentDate: (d: Date) => void,
    onNewItem: () => void
}) {
    const nextMonth = () => {
        const d = new Date(currentDate)
        d.setMonth(d.getMonth() + 1)
        setCurrentDate(d)
    }
    const prevMonth = () => {
        const d = new Date(currentDate)
        d.setMonth(d.getMonth() - 1)
        setCurrentDate(d)
    }
    const goToday = () => setCurrentDate(new Date())

    return (
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-fade-in-up">

            <div className="flex items-center gap-4 w-full xl:w-auto">
                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                    <button onClick={() => setView('month')} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all", view === 'month' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}>Maand</button>
                    <button onClick={() => setView('week')} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all", view === 'week' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}>Week</button>
                    <button onClick={() => setView('agenda')} className={cn("px-3 py-1.5 text-xs font-semibold rounded-md transition-all", view === 'agenda' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}>Agenda</button>
                </div>
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="size-8"><ChevronLeft size={16} /></Button>
                    <span className="font-bold text-slate-900 w-32 text-center select-none">
                        {MONTHS_NL[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="size-8"><ChevronRight size={16} /></Button>
                    <Button variant="link" onClick={goToday} className="text-xs text-emerald-600">Vandaag</Button>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full xl:w-auto">
                <div className="relative flex-1 xl:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input placeholder="Zoek in kalender..." className="pl-9 h-9 text-sm bg-slate-50" />
                </div>
                <Button onClick={onNewItem} size="sm" className="bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                    <Plus size={16} className="mr-2" /> Nieuw
                </Button>
            </div>
        </div>
    )
}

export function MonthGrid({
    currentDate,
    items,
    onItemClick
}: {
    currentDate: Date,
    items: CalendarItem[],
    onItemClick: (item: CalendarItem) => void
}) {
    const grid = getMonthGrid(currentDate.getFullYear(), currentDate.getMonth())

    return (
        <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden shadow-sm border border-slate-200 animate-fade-in-up delay-100 flex-1 min-h-[600px]">
            {/* Headers */}
            {SHORT_DAYS_NL.map((day, i) => (
                <div key={i} className="bg-slate-50 p-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                    {day}
                </div>
            ))}

            {/* Days */}
            {grid.map((date, i) => {
                if (!date) return <div key={i} className="bg-slate-50/30 min-h-[100px]" />

                const isTodayDate = isToday(date)
                const dayItems = items.filter(item => isSameDay(item.date, date))

                return (
                    <div key={i} className={cn(
                        "bg-white min-h-[120px] p-2 hover:bg-slate-50 transition-colors group relative flex flex-col gap-1",
                        isTodayDate && "bg-blue-50/30"
                    )}>
                        <div className="flex justify-between items-start">
                            <span className={cn(
                                "text-sm font-semibold size-7 flex items-center justify-center rounded-full transition-all",
                                isTodayDate ? "bg-emerald-600 text-white shadow-md" : "text-slate-700 group-hover:bg-slate-200"
                            )}>
                                {date.getDate()}
                            </span>
                            {isTodayDate && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 rounded font-medium">VANDAAG</span>}
                        </div>

                        <div className="flex-1 flex flex-col gap-1 mt-1">
                            {dayItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={(e) => { e.stopPropagation(); onItemClick(item) }}
                                    className={cn(
                                        "text-left text-[10px] px-2 py-1.5 rounded border shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] truncate w-full font-medium flex items-center gap-1.5",
                                        item.type === 'deadline' ? "bg-red-50 text-red-700 border-red-100 placeholder:text-red-300" :
                                            item.type === 'manure' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                "bg-slate-50 text-slate-700 border-slate-100"
                                    )}
                                >
                                    <div className={cn("size-1.5 rounded-full shrink-0",
                                        item.type === 'deadline' ? "bg-red-500" :
                                            item.type === 'manure' ? "bg-amber-500" : "bg-slate-400"
                                    )} />
                                    <span className="truncate">{item.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export function SidebarList({ title, items, onItemClick }: { title: string, items: CalendarItem[], onItemClick: (i: CalendarItem) => void }) {
    return (
        <Card className="border-slate-200 shadow-sm animate-fade-in-right delay-200">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
                <Badge variant="secondary" className="text-[10px] h-5">{items.length}</Badge>
            </div>
            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                {items.map(item => (
                    <button key={item.id} onClick={() => onItemClick(item)} className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-start gap-3 group">
                        <div className={cn(
                            "mt-1 size-2 rounded-full shrink-0",
                            item.priority === 'urgent' ? "bg-red-500 animate-pulse" : "bg-emerald-500"
                        )} />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">{item.title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 flex justify-between">
                                <span>{item.date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
                                <span className="uppercase tracking-wide text-[9px] font-bold text-slate-300 group-hover:text-slate-400">{item.type}</span>
                            </p>
                        </div>
                    </button>
                ))}
                {items.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-xs italic">Geen items</div>
                )}
            </div>
        </Card>
    )
}
