"use client"

import { PreviewBadge, DisabledCta } from "@/components/ui/preview-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import DashboardPage from "@/components/app/DashboardPage"

export default function UpdatesPage() {
    return (
        <DashboardPage
            title={<span className="flex items-center gap-3">Updates <PreviewBadge /></span>}
            description="Binnenkort: template-updates en checklistwijzigingen. In MVP tonen we alleen release notes."
            actions={
                <Button variant="outline" disabled className="bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed">
                    Automatisch bijwerken (Binnenkort)
                </Button>
            }
            className="animate-fade-in-up"
        >

            <div className="max-w-3xl">
                <div className="space-y-6">
                    {/* Release Note Mockup */}
                    {[
                        { version: "v1.0.2", date: "Vandaag", title: "Verbeterde Dossier Packs", desc: "De mestboekhouding is vernieuwd met duidelijkere dekking-charts." },
                        { version: "v1.0.1", date: "Vorige week", title: "Export Center Live", desc: "Je kunt nu dossier-indexes exporteren als PDF." },
                        { version: "v1.0.0", date: "1 Dec", title: "BoerenKompas Live", desc: "De eerste versie van BoerenKompas is beschikbaar voor alle gebruikers." }
                    ].map((note, i) => (
                        <Card key={i} className="p-6 border-slate-200 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="min-w-16 pt-1">
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-mono text-xs">{note.version}</Badge>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-slate-900">{note.title}</h3>
                                        <span className="text-xs text-slate-400">• {note.date}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">{note.desc}</p>
                                </div>
                            </div>
                        </Card>
                    ))}

                    <Card className="p-8 border-dashed border-2 border-slate-200 bg-slate-50/50 flex flex-col items-center text-center">
                        <Star className="size-10 text-amber-400 mb-4 fill-amber-100" aria-hidden="true" />
                        <h3 className="font-bold text-slate-900">Blijf op de hoogte</h3>
                        <p className="text-sm text-slate-500 max-w-md mt-2 mb-6">
                            Wil je meldingen ontvangen bij nieuwe wetswijzigingen? Meld je aan voor de preview.
                        </p>
                        <DisabledCta reason="Aanmelden komt binnenkort beschikbaar.">
                            <Button className="bg-slate-900 text-white" disabled>
                                Binnenkort
                            </Button>
                        </DisabledCta>
                    </Card>
                </div>
            </div>
        </DashboardPage>
    )
}
