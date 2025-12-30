"use client"

import {
    Users, AlertCircle, FileText, Activity, MoreVertical,
    Plus, UserPlus, Share2,
    Clock, Mail, Download, MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { SlideOver } from "@/components/calendar/calendar-overlays"
import { cn } from "@/lib/utils"
import type { Advisor, AuditEvent, RequestItem, SharedItem } from "@/lib/advisors/types"
import { ADVISORS_MOCK, MESSAGES_MOCK } from "@/lib/advisors/mock"
import { PreviewBadge, DisabledCta } from "@/components/ui/preview-badge"

// --- Helper Components ---

function AdvisorAvatar({ initials, className }: { initials: string, className?: string }) {
    return (
        <div className={cn("size-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm", className)}>
            {initials}
        </div>
    )
}

// --- KPI Row ---
export function AdvisorsKpiRow({ advisorCount, openRequests, sharedCount, auditCount }: { advisorCount: number, openRequests: number, sharedCount: number, auditCount: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-fade-in-up">
            {[
                { label: "Verbonden Adviseurs", value: advisorCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Open Verzoeken", value: openRequests, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Gedeelde Items (7d)", value: sharedCount, icon: Share2, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Audit Events (24u)", value: auditCount, icon: Activity, color: "text-slate-600", bg: "bg-slate-50" },
            ].map((kpi, i) => (
                <Card key={i} className="border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className={cn("size-12 rounded-xl flex items-center justify-center shrink-0", kpi.bg, kpi.color)}>
                            <kpi.icon size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                                <PreviewBadge variant="demo-data" size="sm" showIcon={false} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">{kpi.value}</h3>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

// --- Advisor List ---
export function AdvisorList({ advisors, onOpenProfile }: { advisors: Advisor[], onOpenProfile: (a: Advisor) => void }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up delay-100">
            {advisors.map(adv => (
                <Card key={adv.id} className="border-slate-200 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group cursor-pointer" onClick={() => onOpenProfile(adv)}>
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <AdvisorAvatar initials={adv.avatarInitials} className="size-12 text-md" />
                                <div>
                                    <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{adv.name}</h3>
                                    <p className="text-sm text-slate-500">{adv.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <PreviewBadge variant="demo-data" size="sm" showIcon={false} />
                                <Badge variant={adv.status === 'Actief' ? 'secondary' : 'outline'} className={cn(
                                    "text-[10px] h-5",
                                    adv.status === 'Actief' ? "bg-emerald-50 text-emerald-700" : "text-slate-500"
                                )}>
                                    {adv.status}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {adv.permissions.docsRead && <Badge variant="outline" className="text-[10px] text-slate-500 font-normal bg-slate-50">Lezen</Badge>}
                            {adv.permissions.recordsEdit && <Badge variant="outline" className="text-[10px] text-slate-500 font-normal bg-slate-50">Bewerken</Badge>}
                            {adv.permissions.exportsCreate && <Badge variant="outline" className="text-[10px] text-slate-500 font-normal bg-slate-50">Exporteren</Badge>}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-50">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock size={10} /> Actief: {new Date(adv.lastActiveAt).toLocaleDateString()}
                            </span>
                            <span className="text-xs font-semibold text-emerald-600 group-hover:underline">Open profiel &rarr;</span>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Add New Card - Disabled */}
            <DisabledCta reason="Adviseurs uitnodigen komt binnenkort" className="h-full">
                <button className="w-full h-full border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-slate-400 transition-all min-h-[180px] cursor-not-allowed">
                    <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <UserPlus size={20} />
                    </div>
                    <span className="font-bold text-sm">Nodig adviseur uit</span>
                    <span className="text-xs text-slate-400 mt-1">Binnenkort beschikbaar</span>
                </button>
            </DisabledCta>
        </div>
    )
}

// --- Shared Items Table ---
export function SharedItemsTable({ items }: { items: SharedItem[] }) {
    return (
        <Card className="border-slate-200 shadow-sm animate-fade-in-up delay-200">
            <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-slate-900">Gedeelde Items</CardTitle>
                    <PreviewBadge variant="demo-data" size="sm" />
                </div>
                <DisabledCta reason="Volledige lijst komt binnenkort">
                    <Button variant="ghost" size="sm" className="text-emerald-600 text-xs h-8">Bekijk alles</Button>
                </DisabledCta>
            </CardHeader>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium text-[10px] uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-3">Item</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Gedeeld met</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map(item => (
                            <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-3 font-medium text-slate-900 truncate max-w-[200px]">{item.title}</td>
                                <td className="px-6 py-3 text-slate-500">
                                    <div className="flex items-center gap-2">
                                        {item.type === 'Document' ? <FileText size={14} className="text-blue-500" /> :
                                            item.type === 'Export' ? <Download size={14} className="text-emerald-500" /> :
                                                <MessageSquare size={14} className="text-amber-500" />}
                                        {item.type}
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <div className="size-5 rounded-full bg-slate-200 text-[10px] flex items-center justify-center font-bold text-slate-600">
                                            {ADVISORS_MOCK.find(a => a.id === item.advisorId)?.avatarInitials}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <Badge variant="outline" className={cn("text-[10px] h-5 font-normal",
                                        item.status === 'Nieuw' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                            item.status === 'Te controleren' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                "bg-slate-50 text-slate-500 border-slate-200"
                                    )}>
                                        {item.status}
                                    </Badge>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" disabled>
                                        <MoreVertical size={14} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}

// --- Right Panel: Requests ---
export function RequestsPanel({ requests }: { requests: RequestItem[] }) {
    return (
        <Card className="border-slate-200 shadow-sm animate-fade-in-up delay-300 flex flex-col">
            <CardHeader className="py-4 px-6 border-b border-slate-100 bg-amber-50/30">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900">Open Verzoeken</CardTitle>
                    <PreviewBadge variant="demo-data" size="sm" />
                </div>
            </CardHeader>
            <div className="flex-1 divide-y divide-slate-100">
                {requests.map(req => (
                    <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{req.title}</h4>
                            {req.severity === 'Urgent' && <Badge className="bg-red-500 text-[9px] h-4 px-1">Urgent</Badge>}
                        </div>
                        <p className="text-[11px] text-slate-500 mb-2 line-clamp-2">{req.description}</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <AdvisorAvatar initials={req.assignee === 'Farmer' ? 'JIJ' : 'ADV'} className="size-5 text-[9px]" />
                                <span className="text-[10px] text-slate-400">
                                    {new Date(req.dueDate).toLocaleDateString()}
                                </span>
                            </div>
                            <DisabledCta reason="Verzoeken openen komt binnenkort">
                                <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 border-slate-200">Open</Button>
                            </DisabledCta>
                        </div>
                    </div>
                ))}
                <div className="p-3">
                    <DisabledCta reason="Nieuwe verzoeken komen binnenkort">
                        <Button variant="ghost" className="w-full text-xs text-slate-500 h-8 border border-dashed border-slate-300">
                            <Plus size={12} className="mr-2" /> Nieuw verzoek
                        </Button>
                    </DisabledCta>
                </div>
            </div>
        </Card>
    )
}

// --- Right Panel: Audit Trail ---
export function AuditPanel({ events }: { events: AuditEvent[] }) {
    return (
        <Card className="border-slate-200 shadow-sm animate-fade-in-up delay-400 flex flex-col">
            <CardHeader className="py-4 px-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900">Audit Trail</CardTitle>
                    <PreviewBadge variant="demo-data" size="sm" />
                </div>
            </CardHeader>
            <div className="flex-1 p-0">
                <div className="relative border-l border-slate-200 ml-6 my-4 space-y-5">
                    {events.slice(0, 5).map(ev => (
                        <div key={ev.id} className="relative pl-6 pr-4 group">
                            <div className="absolute -left-1.5 top-1.5 size-3 rounded-full border-2 border-white shadow-sm bg-slate-400" />
                            <p className="text-[10px] font-bold text-slate-400 mb-0.5">{new Date(ev.at).toLocaleDateString()} • {new Date(ev.at).getHours()}:{new Date(ev.at).getMinutes()}</p>
                            <p className="text-xs text-slate-700 leading-snug">
                                <span className="font-medium text-slate-900">{ev.actorName}</span> {ev.message.replace(ev.actorName, '')}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="p-3 border-t border-slate-50">
                    <DisabledCta reason="Volledige log komt binnenkort">
                        <Button variant="link" className="w-full text-xs text-slate-500 h-6">Bekijk volledige log</Button>
                    </DisabledCta>
                </div>
            </div>
        </Card>
    )
}

// --- Advisor Detail Sheet ---
export function AdvisorDetailSheet({ advisor, isOpen, onClose }: { advisor: Advisor | null, isOpen: boolean, onClose: () => void }) {
    if (!advisor) return null

    return (
        <SlideOver isOpen={isOpen} onClose={onClose} title="Adviseur Profiel">
            <div className="space-y-8">
                {/* Preview Notice */}
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 flex items-center gap-2 text-sm text-violet-700">
                    <PreviewBadge variant="preview" />
                    <span>Dit is een demo-profiel. Wijzigingen worden niet opgeslagen.</span>
                </div>

                {/* Header */}
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                    <AdvisorAvatar initials={advisor.avatarInitials} className="size-16 text-xl" />
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{advisor.name}</h2>
                        <p className="text-sm text-slate-500">{advisor.email}</p>
                        <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="bg-slate-50">{advisor.role}</Badge>
                            <Badge className={advisor.status === 'Actief' ? 'bg-emerald-500' : 'bg-slate-400'}>{advisor.status}</Badge>
                        </div>
                    </div>
                </div>

                {/* Permissions - Disabled switches */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Toegang & Rechten</h3>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-100">
                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Lezen Documenten</p>
                                <p className="text-xs text-slate-500">Mag documenten inzien en downloaden</p>
                            </div>
                            <Switch checked={advisor.permissions.docsRead} disabled />
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Bewerken Registraties</p>
                                <p className="text-xs text-slate-500">Mag mest/stikstof records wijzigen</p>
                            </div>
                            <Switch checked={advisor.permissions.recordsEdit} disabled />
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Exporteren</p>
                                <p className="text-xs text-slate-500">Mag dossiers genereren</p>
                            </div>
                            <Switch checked={advisor.permissions.exportsCreate} disabled />
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 italic">Rechtenbeheer is binnenkort beschikbaar.</p>
                </div>

                {/* Messages - Disabled input */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[300px]">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                        <div className="flex items-center gap-2">
                            <MessageSquare size={14} /> Berichten
                        </div>
                        <PreviewBadge variant="demo-data" size="sm" />
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
                        {MESSAGES_MOCK.filter(m => m.advisorId === 'adv1').map(msg => ( // Mock filter for display
                            <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.from === 'Farmer' ? "self-end items-end" : "self-start items-start")}>
                                <div className={cn("p-3 rounded-xl text-sm", msg.from === 'Farmer' ? "bg-slate-900 text-white rounded-tr-none" : "bg-white border border-slate-200 text-slate-700 rounded-tl-none")}>
                                    {msg.text}
                                </div>
                                <span className="text-[9px] text-slate-400 mt-1">{new Date(msg.at).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t border-slate-100 bg-white flex gap-2">
                        <Input placeholder="Berichten komen binnenkort..." className="h-8 text-xs" disabled />
                        <Button size="sm" className="h-8 bg-slate-900 text-white" disabled>Stuur</Button>
                    </div>
                </div>

                <div className="pt-4 flex flex-col gap-2">
                    <DisabledCta reason="Toegang intrekken komt binnenkort">
                        <Button variant="outline" className="w-full text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200">
                            Toegang Intrekken
                        </Button>
                    </DisabledCta>
                </div>
            </div>
        </SlideOver>
    )
}

// --- Invite Dialog ---
export function InviteDialog({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    if (!isOpen) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <Card className="relative w-full max-w-md bg-white shadow-2xl animate-scale-in p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Nodig Adviseur Uit</h2>
                    <PreviewBadge variant="coming-soon" />
                </div>
                
                {/* Coming soon notice */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                    <Clock className="mx-auto size-8 text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-700">Uitnodigingen zijn binnenkort beschikbaar</p>
                    <p className="text-xs text-slate-500 mt-1">We werken aan de mogelijkheid om adviseurs en accountants uit te nodigen.</p>
                </div>

                <div className="space-y-4 py-2 opacity-50 pointer-events-none">
                    <div className="space-y-2">
                        <Label>Naam</Label>
                        <Input placeholder="Bijv. Jan de Vries" disabled />
                    </div>
                    <div className="space-y-2">
                        <Label>E-mailadres</Label>
                        <Input placeholder="jan@voorbeeld.nl" disabled />
                    </div>
                    <div className="space-y-2">
                        <Label>Rol</Label>
                        <Select disabled>
                            <SelectTrigger className="w-full">
                                <SelectValue>
                                    {() => "Kies rol..."}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="acc">Accountant</SelectItem>
                                <SelectItem value="adv">Adviseur</SelectItem>
                                <SelectItem value="jur">Jurist</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                    <Button variant="ghost" onClick={onClose}>Sluiten</Button>
                </div>
            </Card>
        </div>
    )
}
