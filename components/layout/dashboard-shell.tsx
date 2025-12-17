"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Leaf, LayoutDashboard, Calendar, FileText, PieChart,
    BarChart3, Users, LogOut, Search, Bell, Menu, X, ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

const NAV_ITEMS = [
    {
        section: 'Overzicht', items: [
            { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { label: 'Kalender', href: '/dashboard/calendar', icon: Calendar },
        ]
    },
    {
        section: 'Dossiers', items: [
            { label: 'Mijn Documenten', href: '/dashboard/docs', icon: FileText },
            { label: 'Stikstof', href: '/dashboard/nitrogen', icon: PieChart },
            { label: 'Mestboekhouding', href: '/dashboard/manure', icon: BarChart3 },
        ]
    },
    {
        section: 'AI & Compliance', items: [
            { label: 'RegelRadar', href: '/dashboard/ai/regelradar', icon: Leaf },
            { label: 'Compliance Check', href: '/dashboard/ai/compliance-check', icon: Search },
            { label: 'Scenario Engine', href: '/dashboard/ai/scenario', icon: PieChart },
            { label: 'Export Center', href: '/dashboard/exports', icon: LogOut },
            { label: 'Audit Trail', href: '/dashboard/audit', icon: FileText },
        ]
    },
    {
        section: 'Organisatie', items: [
            { label: 'Adviseurs', href: '/dashboard/advisors', icon: Users },
        ]
    }
]

export function DashboardSidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const pathname = usePathname()

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-slate-50 border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 lg:static flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo Header */}
                <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-white">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-emerald-900 flex items-center justify-center text-white">
                            <Leaf size={16} />
                        </div>
                        <span className="font-bold text-slate-900 tracking-tight text-lg">BoerenKompas</span>
                    </Link>
                    <button onClick={onClose} className="ml-auto lg:hidden text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {NAV_ITEMS.map((group, i) => (
                        <div key={i}>
                            <h4 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{group.section}</h4>
                            <div className="space-y-0.5">
                                {group.items.map(item => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                                isActive
                                                    ? "bg-white text-emerald-900 shadow-sm ring-1 ring-slate-200"
                                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                            )}
                                        >
                                            <Icon size={18} className={cn(isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600")} />
                                            {item.label}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom User Area */}
                <div className="p-4 border-t border-slate-200 bg-white">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-50 transition-colors text-left border border-transparent hover:border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                            <div className="size-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-200">
                                HV
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-semibold text-slate-900 truncate">H. Veenstra</p>
                                <p className="text-xs text-slate-500 truncate">Maatschap Veenstra</p>
                            </div>
                            <ChevronDown size={14} className="text-slate-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56" side="top">
                            <DropdownMenuLabel>Mijn Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Instellingen</DropdownMenuItem>
                            <DropdownMenuItem>Bedrijfsgegevens</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                                <Link href="/" className="flex w-full items-center"><LogOut className="mr-2 size-4" /> Uitloggen</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>
        </>
    )
}

export function DashboardHeader({ onOpenMobile }: { onOpenMobile: () => void }) {
    return (
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center px-4 sm:px-6 justify-between">
            <div className="flex items-center gap-4 flex-1">
                <button onClick={onOpenMobile} className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md">
                    <Menu size={20} />
                </button>
                <div className="relative max-w-md w-full hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                        className="pl-9 bg-slate-50/50 border-transparent focus:bg-white focus:border-slate-200 transition-all rounded-xl h-10"
                        placeholder="Zoek in dossiers, percelen..."
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-full relative">
                    <Bell size={20} />
                    <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                </Button>
            </div>
        </header>
    )
}
