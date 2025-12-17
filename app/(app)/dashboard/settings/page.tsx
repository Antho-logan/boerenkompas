"use client"

import { useTenant } from "@/components/app/TenantProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail } from "lucide-react"

export default function SettingsPage() {
    const { tenant } = useTenant();

    // Mock members logic
    const members = [
        { id: '1', name: 'Jan de Boer', email: 'jan@jansen.nl', role: 'Eigenaar' },
        { id: '2', name: 'Pieter de Adviseur', email: 'p.advies@agrifirm.nl', role: 'Adviseur' },
    ];

    if (!tenant) return null;

    return (
        <div className="space-y-8 max-w-4xl animate-fade-in-up">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Instellingen</h1>
                <p className="text-slate-500">Beheer je bedrijfsprofiel en toegang.</p>
            </div>

            {/* Company Profile */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Bedrijfsgegevens</CardTitle>
                    <CardDescription>Deze gegevens worden gebruikt op je exports.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Bedrijfsnaam</Label>
                            <Input defaultValue={tenant.name} />
                        </div>
                        <div className="space-y-2">
                            <Label>KVK Nummer</Label>
                            <Input defaultValue={tenant.kvk || ''} />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button>Opslaan</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Team */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Team & Toegang</CardTitle>
                        <CardDescription>Wie heeft toegang tot dit dossier?</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                        <Mail size={14} className="mr-2" /> Nodig adviseur uit
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                        {member.name.substring(0, 2)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{member.name}</p>
                                        <p className="text-xs text-slate-500">{member.email}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600">{member.role}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
