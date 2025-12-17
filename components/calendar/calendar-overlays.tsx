"use client"

import { useState, useEffect } from "react"
import { X, Calendar as CalendarIcon, Link as LinkIcon, Trash2, Check, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { CalendarItem } from "@/lib/calendar/types"
import { formatNL } from "./calendar-utils"

// --- Custom SlideOver (Sheet Replacement) ---
export function SlideOver({ isOpen, onClose, children, title }: { isOpen: boolean, onClose: () => void, children: React.ReactNode, title: string }) {
    const [visible, setVisible] = useState(isOpen)

    useEffect(() => {
        let timeoutId: number | undefined
        if (isOpen) {
            timeoutId = window.setTimeout(() => setVisible(true), 0)
        } else {
            timeoutId = window.setTimeout(() => setVisible(false), 300)
        }
        return () => {
            if (timeoutId !== undefined) window.clearTimeout(timeoutId)
        }
    }, [isOpen])

    if (!visible && !isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className={cn("absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0")}
                onClick={onClose}
            />

            {/* Panel */}
            <div className={cn(
                "relative w-full max-w-md bg-white h-full shadow-2xl transform transition-transform duration-300 ease-out flex flex-col",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}

// --- Item Details View ---
export function ItemDetails({ item, onMarkDone, onDelete }: { item: CalendarItem, onMarkDone: () => void, onDelete: () => void }) {
    if (!item) return null

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="flex gap-2 mb-2">
                    <Badge variant="outline" className={cn(
                        "uppercase text-[10px] tracking-wider",
                        item.type === 'deadline' ? "bg-red-50 text-red-700 border-red-200" :
                            item.type === 'manure' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                item.type === 'legislation' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                    "bg-slate-100 text-slate-600"
                    )}>
                        {item.type}
                    </Badge>
                    {item.priority === 'urgent' && <Badge variant="destructive" className="text-[10px]">Urgent</Badge>}
                </div>

                <h3 className="text-xl font-bold text-slate-900 leading-tight">{item.title}</h3>

                <div className="flex items-center gap-2 text-slate-500 text-sm mt-3">
                    <CalendarIcon size={16} />
                    <span>{formatNL(item.date, { includeTime: !!item.time })}</span>
                </div>
            </div>

            <Separator />

            {item.notes && (
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-sm text-amber-900">
                    <span className="font-bold block mb-1 text-xs uppercase tracking-wide text-amber-700">Notities</span>
                    {item.notes}
                </div>
            )}

            {item.linkedEntity && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                            <LinkIcon size={18} />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase">{item.linkedEntity.kind}</div>
                            <div className="font-semibold text-slate-900">{item.linkedEntity.label}</div>
                        </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                        Open &rarr;
                    </Button>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4">
                {item.status !== 'done' ? (
                    <Button onClick={onMarkDone} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/10">
                        <CheckCircle2 className="mr-2" /> Markeer als voltooid
                    </Button>
                ) : (
                    <Button variant="outline" className="w-full h-12 bg-slate-50 text-slate-500 cursor-default border-slate-200">
                        <Check className="mr-2" /> Reeds voltooid
                    </Button>
                )}

                <Button variant="ghost" onClick={onDelete} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="mr-2 size-4" /> Verwijder item
                </Button>
            </div>
        </div>
    )
}
