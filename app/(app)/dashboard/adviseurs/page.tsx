"use client"

import { useState } from "react"
import {
    AdvisorsKpiRow, AdvisorList, SharedItemsTable, RequestsPanel,
    AuditPanel, AdvisorDetailSheet, InviteDialog
} from "@/components/advisors/advisor-components"
import { ADVISORS_MOCK, SHARED_ITEMS_MOCK, REQUESTS_MOCK, AUDIT_MOCK } from "@/lib/advisors/mock"
import { Advisor } from "@/lib/advisors/types"
import { Button } from "@/components/ui/button"
import { UserPlus, Share2, Shield, Lock, Users } from "lucide-react"
import { useTenant } from "@/components/app/TenantProvider"
import Link from "next/link"
import { isPlanAtLeast, hasFeature } from "@/lib/plans"
import { LockedFeatureCard } from "@/components/app/LockedFeatureCard"
import DashboardPage from "@/components/app/DashboardPage"

export default function AdvisorsPage() {
    const { effectivePlan } = useTenant()
    const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null)
    
    const canAccessPortal = isPlanAtLeast(effectivePlan, 'pro_advisor')
    const multiSeats = hasFeature(effectivePlan, 'multi_advisor_seats')

    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isInviteOpen, setIsInviteOpen] = useState(false)

    const handleOpenProfile = (adv: Advisor) => {
        setSelectedAdvisor(adv)
        setIsDetailOpen(true)
    }

    return (
        <DashboardPage
            title="Adviseurs & Toegang"
            description={`Audit Trail Actief • ${canAccessPortal ? "3 gebruikers" : "Beperkt"}`}
            actions={
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
                        <Shield className="mr-2 size-4" /> Rechten
                    </Button>
                    <Button variant="outline" size="sm" className="bg-white border-slate-200 shadow-sm text-slate-700">
                        <Share2 className="mr-2 size-4" /> Dossier Delen
                    </Button>
                    {canAccessPortal ? (
                        <Button size="sm" className="bg-slate-900 text-white shadow-md hover:bg-slate-800" onClick={() => setIsInviteOpen(true)}>
                            <UserPlus className="mr-2 size-4" /> Nodig adviseur uit
                        </Button>
                    ) : (
                        <Link href="/pricing">
                            <Button size="sm" variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold">
                                <Lock className="mr-2 size-3" /> Upgrade naar Pro+Adviseur
                            </Button>
                        </Link>
                    )}
                </div>
            }
            className="animate-fade-in-up"
        >

            {/* Locked Content */}
            {!canAccessPortal ? (
                <div className="py-12">
                    <LockedFeatureCard 
                        title="Adviseursportaal"
                        description="Geef je accountant of teeltadviseur direct toegang tot je dossiers. Werk samen in één veilige omgeving."
                        requiredPlanId="pro_advisor"
                    />
                </div>
            ) : (
                <>
                    {/* Multi-Seats Info for non-teams */}
                    {!multiSeats && (
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-center justify-between gap-4 animate-fade-in-up">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                    <Users size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-900">Meerdere adviseurs uitnodigen?</p>
                                    <p className="text-xs text-amber-700">Je huidige pakket ondersteunt maximaal 1 actieve adviseur seat.</p>
                                </div>
                            </div>
                            <Link href="/pricing">
                                <Button size="sm" variant="outline" className="bg-white border-amber-200 text-amber-700 hover:bg-amber-100 h-8">
                                    Upgrade naar Teams
                                </Button>
                            </Link>
                        </div>
                    )}
                    
                    {/* Teams Seats Counter UI */}
                    {multiSeats && (
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between gap-4 animate-fade-in-up">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                    <Users size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-emerald-900">Teams Licentie Actief</p>
                                    <p className="text-xs text-emerald-700">Je kunt tot 5 verschillende adviseurs toevoegen aan dit bedrijf.</p>
                                </div>
                            </div>
                            <div className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                                {ADVISORS_MOCK.length} / 5 seats gebruikt
                            </div>
                        </div>
                    )}

                    {/* KPIs */}
                    <AdvisorsKpiRow
                        advisorCount={ADVISORS_MOCK.length}
                        openRequests={REQUESTS_MOCK.filter(r => r.status === 'Open').length}
                        sharedCount={SHARED_ITEMS_MOCK.length}
                        auditCount={AUDIT_MOCK.length}
                    />

                    {/* Main Layout */}
                    <div className="flex flex-col xl:flex-row gap-6 items-start">

                        {/* Left Column (Primary) */}
                        <div className="flex-1 w-full space-y-6">
                            <AdvisorList advisors={ADVISORS_MOCK} onOpenProfile={handleOpenProfile} />
                            <SharedItemsTable items={SHARED_ITEMS_MOCK} />
                        </div>

                        {/* Right Column (Secondary) */}
                        <div className="w-full xl:w-96 shrink-0 space-y-6">
                            <RequestsPanel requests={REQUESTS_MOCK} />
                            <AuditPanel events={AUDIT_MOCK} />
                        </div>

                    </div>
                </>
            )}

            <AdvisorDetailSheet advisor={selectedAdvisor} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} />
            <InviteDialog isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
        </DashboardPage>
    )
}
