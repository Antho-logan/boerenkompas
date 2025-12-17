"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Menu, X, Search, Bell, HelpCircle, LogOut, Settings,
    LayoutDashboard, AlertCircle, Calendar, FileText,
    BarChart3, PieChart, Users, ChevronDown, BadgeCheck, Leaf, type LucideIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

// --- Config ---

type LegacyNavItem = {
    label: string
    href: string
    icon: LucideIcon
    badge?: number
    alert?: boolean
}

type LegacyNavSection = {
    section: string
    items: LegacyNavItem[]
}

const NAV_ITEMS: LegacyNavSection[] = [
    {
        section: "Overzicht", items: [
            { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { label: "Meldingen", href: "/dashboard/meldingen", icon: AlertCircle, badge: 3, alert: true },
            { label: "Kalender", href: "/dashboard/kalender", icon: Calendar },
        ]
    },
    {
        section: "Dossiers", items: [
            { label: "Mijn Documenten", href: "/dashboard/documenten", icon: FileText },
            { label: "Stikstofruimte", href: "/dashboard/stikstof", icon: PieChart },
            { label: "Mestboekhouding", href: "/dashboard/mest", icon: BarChart3 },
            { label: "Audit Trail", href: "/dashboard/audit", icon: BadgeCheck },
        ]
    },
    {
        section: "Organisatie", items: [
            { label: "Adviseurs", href: "/dashboard/adviseurs", icon: Users },
            { label: "Instellingen", href: "/dashboard/settings", icon: Settings },
        ]
    }
]

// --- Components ---

function NavItem({ item, isActive }: { item: LegacyNavItem; isActive: boolean }) {
    const Icon = item.icon
    return (
        <Link href={item.href} className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${isActive
            ? "bg-slate-100 text-slate-900 font-medium"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}>
            <div className="flex items-center gap-3">
                <Icon className={`size-4 ${isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span className="text-sm">{item.label}</span>
            </div>
            {item.badge && (
                <Badge className={`h-5 px-1.5 text-[10px] border-0 rounded-full ${item.alert
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-200 text-slate-600"
                    }`}>
                    {item.badge}
                </Badge>
            )}
        </Link>
    )
}

export function AdminSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const pathname = usePathname()

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
                }`}>
                {/* Header */}
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                            <Leaf size={16} fill="white" className="text-emerald-400" />
                        </div>
                        <span className="font-bold text-slate-900 tracking-tight text-lg">BoerenKompas</span>
                    </Link>
                    <button onClick={onClose} className="ml-auto lg:hidden text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Nav */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {NAV_ITEMS.map((section, i) => (
                        <div key={i} className="space-y-1">
                            <h4 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                {section.section}
                            </h4>
                            {section.items.map((item) => (
                                <NavItem
                                    key={item.href}
                                    item={item}
                                    isActive={pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard")}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                {/* User Footer */}
                <div className="border-t border-slate-100 p-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                                <div className="size-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-200">
                                    HV
                                </div>
                                <div className="flex-1 overflow-hidden text-left">
                                    <p className="text-sm font-semibold text-slate-900 truncate leading-none mb-1">Hendrik Veenstra</p>
                                    <p className="text-xs text-slate-500 truncate leading-none">Maatschap Veenstra</p>
                                </div>
                                <ChevronDown size={14} className="text-slate-400" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Mijn Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Profiel</DropdownMenuItem>
                            <DropdownMenuItem>Bedrijfsgegevens</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                <Link href="/" className="flex w-full items-center">
                                    <LogOut className="mr-2 size-4" /> Uitloggen
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>
        </>
    )
}

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
    return (
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 h-16 px-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-4 w-full max-w-lg">
                <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700">
                    <Menu size={20} />
                </button>
                <div className="relative hidden sm:block w-full max-w-sm group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                    <input
                        className="w-full h-10 pl-10 pr-4 bg-slate-50/50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-slate-200 rounded-xl outline-none text-sm transition-all placeholder:text-slate-400"
                        placeholder="Zoek in dossiers, percelen of regels..."
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-full relative">
                    <Bell className="size-5" />
                    <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-white"></span>
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 rounded-full hidden sm:flex">
                    <HelpCircle className="size-5" />
                </Button>
            </div>
        </header>
    )
}
