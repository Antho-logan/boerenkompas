"use client"

import { useState } from "react"
import {
    AdvisorsKpiRow, AdvisorList, SharedItemsTable, RequestsPanel,
    AuditPanel, AdvisorDetailSheet, InviteDialog
} from "@/components/advisors/advisor-components"
import { ADVISORS_MOCK, SHARED_ITEMS_MOCK, REQUESTS_MOCK, AUDIT_MOCK } from "@/lib/advisors/mock"
import { Advisor } from "@/lib/advisors/types"
import { Button } from "@/components/ui/button"
import { UserPlus, Share2, Shield } from "lucide-react"

export default function AdvisorsPage() {
    const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isInviteOpen, setIsInviteOpen] = useState(false)

    const handleOpenProfile = (adv: Advisor) => {
        setSelectedAdvisor(adv)
        setIsDetailOpen(true)
    }

    return (
        <div className="space-y-6 lg:space-y-8 animate-fade-in-up">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Adviseurs & Toegang</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Audit Trail Actief • 3 gebruikers</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
                        <Shield className="mr-2 size-4" /> Rechten
                    </Button>
                    <Button variant="outline" size="sm" className="bg-white border-slate-200 shadow-sm text-slate-700">
                        <Share2 className="mr-2 size-4" /> Dossier Delen
                    </Button>
                    <Button size="sm" className="bg-slate-900 text-white shadow-md hover:bg-slate-800" onClick={() => setIsInviteOpen(true)}>
                        <UserPlus className="mr-2 size-4" /> Nodig adviseur uit
                    </Button>
                </div>
            </div>

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

            <AdvisorDetailSheet advisor={selectedAdvisor} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} />
            <InviteDialog isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
        </div>
    )
}
