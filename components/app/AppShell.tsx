"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Calendar,
    FileText,
    PieChart,
    Users,
    Settings,
    Bell,
    Leaf,
    Search,
    ShieldCheck,
    FileClock,
    Menu,
    X,
    type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TenantSwitch } from "./TenantSwitch"
import { PlanPreviewSwitcher } from "./PlanPreviewSwitcher"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useTenant } from "./TenantProvider"
import PageTransition from "@/components/app/PageTransition"

type NavLinkItem = { kind: "link"; label: string; href: string; icon: LucideIcon; badge?: string }
type NavHeaderItem = { kind: "header"; label: string }
type NavItem = NavLinkItem | NavHeaderItem

// Sidebar Nav Items
const NAV_ITEMS: NavItem[] = [
    { kind: "link", label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { kind: "header", label: 'Documenten' },
    { kind: "link", label: 'Mijn Documenten', href: '/dashboard/documents', icon: FileText },
    { kind: "link", label: 'Uploadcentrum', href: '/dashboard/documents/upload-center', icon: FileText },

    { kind: "header", label: 'Dossiers' },
    { kind: "link", label: 'Dossier: Stikstof', href: '/dashboard/stikstof', icon: Leaf },
    { kind: "link", label: 'Dossier: Mest', href: '/dashboard/mest', icon: PieChart },
    { kind: "link", label: 'Dossier Check', href: '/dashboard/ai/compliance-check', icon: ShieldCheck },

    { kind: "header", label: 'Tools' },
    { kind: "link", label: 'Kalender', href: '/dashboard/calendar', icon: Calendar },
    { kind: "link", label: 'Export Center', href: '/dashboard/exports', icon: FileText },
    { kind: "link", label: 'Updates', href: '/dashboard/ai/regelradar', icon: Search, badge: "Preview" },

    { kind: "header", label: 'Beheer' },
    { kind: "link", label: 'Audit Log', href: '/dashboard/audit', icon: FileClock },
    { kind: "link", label: 'Adviseurs & Toegang', href: '/dashboard/adviseurs', icon: Users },
    { kind: "link", label: 'Instellingen', href: '/dashboard/settings', icon: Settings },
];

function normalizePath(pathname: string) {
    if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1)
    return pathname
}

function getMatchScore(pathname: string, href: string) {
    const current = normalizePath(pathname)
    const target = normalizePath(href)

    if (target === "/dashboard") {
        return current === target ? 10000 + target.length : -1
    }

    if (current === target) return 10000 + target.length
    if (current.startsWith(target + "/")) return target.length
    return -1
}

function getActiveHref(pathname: string, items: NavItem[]) {
    let bestMatch: { href: string; score: number } | null = null

    for (const item of items) {
        if (item.kind !== "link") continue
        const score = getMatchScore(pathname, item.href)
        if (score > (bestMatch?.score ?? -1)) {
            bestMatch = { href: item.href, score }
        }
    }

    return bestMatch?.href ?? null
}

function NavLinks({
    activeHref,
    onNavigate,
}: {
    activeHref: string | null
    onNavigate?: () => void
}) {
    return (
        <div className="space-y-1">
            {NAV_ITEMS.map((item, i) => {
                if (item.kind === "header") {
                    return (
                        <div key={`header-${item.label}-${i}`} className="px-3 pt-6 pb-2">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.label}</span>
                        </div>
                    )
                }

                const isActive = item.href === activeHref

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => onNavigate?.()}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30",
                            isActive
                                ? "bg-emerald-50 text-emerald-900"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                    >
                        <item.icon size={18} className={cn(isActive ? "text-emerald-700" : "text-slate-400")} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-500 border border-slate-200">
                                {item.badge}
                            </span>
                        )}
                    </Link>
                )
            })}
        </div>
    )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useTenant();
    const [mobileNavOpen, setMobileNavOpen] = useState(false)
    const activeHref = useMemo(() => getActiveHref(pathname, NAV_ITEMS), [pathname])

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">

            {/* SIDEBAR */}
            <aside className="w-64 border-r border-slate-200 bg-white hidden md:flex flex-col z-20">
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <div className="size-8 rounded-lg bg-emerald-900 text-white flex items-center justify-center mr-3">
                        <Leaf size={16} />
                    </div>
                    <span className="font-bold text-lg tracking-tight">BoerenKompas</span>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    <NavLinks activeHref={activeHref} />
                </div>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-xs overflow-hidden">
                            {user?.avatarUrl ? <img src={user.avatarUrl} alt="avatar" /> : user?.name.substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-slate-900">{user?.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                {/* TOPBAR */}
                <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur flex items-center justify-between px-4 md:px-6 z-10">
                    <div className="flex items-center gap-3 min-w-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden text-slate-600 hover:text-slate-900"
                            aria-label="Open menu"
                            onClick={() => setMobileNavOpen(true)}
                        >
                            <Menu size={20} />
                        </Button>

                        <div className="min-w-0 flex items-center gap-2">
                            <TenantSwitch />
                            <PlanPreviewSwitcher realPlan="starter" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/notifications">
                            <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-800">
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 size-2 bg-rose-500 rounded-full border border-white" />
                            </Button>
                        </Link>
                    </div>
                </header>

                {/* MOBILE NAV */}
                <Sheet open={mobileNavOpen} onOpenChange={(open) => setMobileNavOpen(open)}>
                    <SheetContent side="left" className="p-0">
                        <div className="flex h-full flex-col">
                            <div className="h-16 flex items-center px-4 border-b border-slate-100">
                                <div className="size-9 rounded-xl bg-emerald-900 text-white flex items-center justify-center mr-3">
                                    <Leaf size={16} />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-slate-900 leading-tight">BoerenKompas</div>
                                    <div className="text-[11px] text-slate-500 truncate">{user?.name}</div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-auto text-slate-600 hover:text-slate-900"
                                    aria-label="Sluit menu"
                                    onClick={() => setMobileNavOpen(false)}
                                >
                                    <X size={18} />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto py-4 px-3">
                                <NavLinks activeHref={activeHref} onNavigate={() => setMobileNavOpen(false)} />
                            </div>

                            <div className="p-4 border-t border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="size-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-xs overflow-hidden">
                                        {user?.avatarUrl ? <img src={user.avatarUrl} alt="avatar" /> : user?.name.substring(0, 2)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate text-slate-900">{user?.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>

                {/* PAGE CONTENT SCROLLABLE AREA */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    <div className="max-w-7xl mx-auto">
                        <PageTransition>{children}</PageTransition>
                    </div>
                </main>
            </div>

        </div>
    );
}
