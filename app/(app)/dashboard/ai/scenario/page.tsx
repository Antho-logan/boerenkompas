"use client"

import type { SVGProps } from "react"
import { useState } from "react"
import { PageHeader, StatCard } from "@/components/ai/shared-components"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SCENARIOS_MOCK } from "@/lib/ai/mock"
import { Sliders, TrendingUp, BarChart3, Plus } from "lucide-react"
import { SlideOver } from "@/components/calendar/calendar-overlays"
import { Scenario } from "@/lib/ai/types"

export default function ScenarioPage() {
    const [isBuilderOpen, setIsBuilderOpen] = useState(false)
    const [activeScenario, setActiveScenario] = useState<Scenario | null>(SCENARIOS_MOCK[0])

    return (
        <>
            <div className="space-y-6 animate-fade-in-up">
                <PageHeader
                    title="Scenario Engine"
                    subtitle="Bereken de impact van veranderingen op je bedrijfsvoering."
                    actions={
                        <Button onClick={() => setIsBuilderOpen(true)} className="bg-slate-900 text-white shadow-md">
                            <Plus className="mr-2 size-4" /> Nieuw Scenario
                        </Button>
                    }
                />

                {/* Recent Scenarios */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
                    {SCENARIOS_MOCK.map(scen => (
                        <Card
                            key={scen.id}
                            onClick={() => setActiveScenario(scen)}
                            className={`cursor-pointer transition-all hover:shadow-md p-5 border ${activeScenario?.id === scen.id ? "border-emerald-500 ring-1 ring-emerald-500/20 bg-white" : "border-slate-200 bg-white"
                                }`}
                        >
                            <h3 className="font-bold text-slate-900">{scen.name}</h3>
                            <p className="text-xs text-slate-500 mt-1">Aangemaakt op {new Date(scen.createdAt).toLocaleDateString()}</p>
                            <div className="mt-4 flex gap-2">
                                <div className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">
                                    {Object.keys(scen.inputs).length} parameters
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Active Scenario Canvas */}
                {activeScenario && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
                        {/* Inputs */}
                        <Card className="p-6 border-slate-200 h-fit">
                            <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Sliders size={18} /> Parameters
                            </h4>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label>Veebezetting (GVE)</Label>
                                    <div className="flex gap-2">
                                        <Input defaultValue="-15" className="font-mono text-sm" />
                                        <span className="flex items-center text-sm text-slate-500">Stuks</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Areaal Uitbreiding</Label>
                                    <div className="flex gap-2">
                                        <Input defaultValue="0" className="font-mono text-sm" />
                                        <span className="flex items-center text-sm text-slate-500">Ha</span>
                                    </div>
                                </div>
                                <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                                    <RefreshCw className="mr-2 size-4" /> Herberekenen
                                </Button>
                            </div>
                        </Card>

                        {/* Results Visuals */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <StatCard label="Stikstofruimte" value={`${activeScenario.outputs.nitrogenSpace} kg`} icon={TrendingUp} trend={{ val: 5.4, label: "Ruimte" }} />
                                <StatCard label="Mestbalans" value={`${activeScenario.outputs.manureBalance} ton`} icon={BarChart3} variant={activeScenario.outputs.manureBalance > 0 ? "default" : "warning"} />
                            </div>

                            <Card className="p-6 border-slate-200">
                                <h4 className="font-bold text-slate-900 mb-4">Impact Projectie</h4>
                                <div className="h-64 bg-slate-50 rounded-xl flex items-center justify-center border border-dashed border-slate-200 text-slate-400">
                                    {/* Placeholder for complex charts */}
                                    Chart Visualisatie (Before / After)
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </div>

            <SlideOver isOpen={isBuilderOpen} onClose={() => setIsBuilderOpen(false)} title="Nieuw Scenario">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Scenario Naam</Label>
                        <Input placeholder="Bijv. Omschakeling 2025" />
                    </div>
                    <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100">
                        Kies een basis voor je scenario. Je kunt later parameters fijn-afstellen.
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {['Inkrimping', 'Uitbreiding Grond', 'Samenwerking', 'Investering'].map(opt => (
                            <button key={opt} className="p-3 border border-slate-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-sm font-medium text-slate-700 text-left">
                                {opt}
                            </button>
                        ))}
                    </div>
                    <div className="pt-8">
                        <Button className="w-full bg-slate-900 text-white h-12">Start Builder</Button>
                    </div>
                </div>
            </SlideOver>
        </>
    )
}

function RefreshCw(props: SVGProps<SVGSVGElement>) { return <div className="animate-spin"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg></div> }
