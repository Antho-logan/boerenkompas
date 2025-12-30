"use client"

import { X, Calendar as CalendarIcon, Link as LinkIcon, Trash2, Check, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetClose,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { CalendarItem } from "@/lib/calendar/types"
import { formatNL } from "./calendar-utils"

/**
 * Accessible SlideOver component using the Sheet primitive.
 * Features:
 * - Esc to close
 * - Focus trap (automatic via Sheet)
 * - ARIA labels and roles (automatic via Sheet)
 * - Click outside to close
 */
export function SlideOver({ 
    isOpen, 
    onClose, 
    children, 
    title,
    description,
}: { 
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title: string
    description?: string
}) {
    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-full max-w-md flex flex-col">
                <SheetHeader className="flex flex-row items-start justify-between px-6 py-4 border-b border-slate-100 space-y-0">
                    <div className="flex-1 min-w-0 pr-4">
                        <SheetTitle className="text-lg font-bold text-slate-900">
                            {title}
                        </SheetTitle>
                        {description && (
                            <SheetDescription className="text-sm text-slate-500 mt-1 truncate">
                                {description}
                            </SheetDescription>
                        )}
                    </div>
                    <SheetClose
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors flex-shrink-0"
                        aria-label="Sluiten"
                    >
                        <X size={20} aria-hidden="true" />
                    </SheetClose>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </SheetContent>
        </Sheet>
    )
}

// --- Item Details View ---
export function ItemDetails({ 
    item, 
    onMarkDone, 
    onDelete 
}: { 
    item: CalendarItem
    onMarkDone: () => void
    onDelete: () => void 
}) {
    if (!item) return null

    return (
        <div className="space-y-6 p-6">
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
                    <CalendarIcon size={16} aria-hidden="true" />
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
                            <LinkIcon size={18} aria-hidden="true" />
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
                        <CheckCircle2 className="mr-2" aria-hidden="true" /> Markeer als voltooid
                    </Button>
                ) : (
                    <Button variant="outline" className="w-full h-12 bg-slate-50 text-slate-500 cursor-default border-slate-200" disabled>
                        <Check className="mr-2" aria-hidden="true" /> Reeds voltooid
                    </Button>
                )}

                <Button variant="ghost" onClick={onDelete} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="mr-2 size-4" aria-hidden="true" /> Verwijder item
                </Button>
            </div>
        </div>
    )
}
