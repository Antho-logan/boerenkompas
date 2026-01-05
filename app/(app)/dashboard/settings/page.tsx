"use client"

import { useState } from "react"
import { useTenant } from "@/components/app/TenantProvider"
import { Can } from "@/components/app/RBAC"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock } from "lucide-react"
import { canWrite } from "@/lib/supabase/errors"
import DashboardPage from "@/components/app/DashboardPage"
import { PreviewBadge, PreviewBanner, DisabledCta } from "@/components/ui/preview-badge"

// Error toast component
function ErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-3">
            <Lock size={16} />
            <span className="flex-1">{message}</span>
            <button onClick={onDismiss} className="text-amber-600 hover:text-amber-800">×</button>
        </div>
    );
}

export default function SettingsPage() {
    const { tenant, role } = useTenant();
    const [error, setError] = useState<string | null>(null);
    
    const isAdmin = canWrite(role);

    // Mock members logic
    const members = [
        { id: '1', name: 'Jan de Boer', email: 'jan@jansen.nl', role: 'Eigenaar' },
        { id: '2', name: 'Pieter de Adviseur', email: 'p.advies@agrifirm.nl', role: 'Adviseur' },
    ];

    const handleSave = () => {
        if (!isAdmin) {
            setError('Je hebt geen rechten (admin vereist).');
            return;
        }
        // TODO: Implement save - functionality coming soon
        setError('Opslaan is nog niet beschikbaar in deze preview.');
    };

    const handleInvite = () => {
        if (!isAdmin) {
            setError('Je hebt geen rechten (admin vereist).');
            return;
        }
        // TODO: Implement invite - functionality coming soon
        setError('Uitnodigen is nog niet beschikbaar in deze preview.');
    };

    if (!tenant) return null;

    return (
        <DashboardPage
            title="Instellingen"
            description="Beheer je bedrijfsprofiel en toegang."
            className="animate-fade-in-up"
        >
            {/* Company Profile */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Bedrijfsgegevens</CardTitle>
                            <CardDescription>Deze gegevens worden gebruikt op je exports.</CardDescription>
                        </div>
                        <PreviewBadge variant="preview" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <PreviewBanner
                        title="Preview Modus"
                        description="Wijzigingen worden nog niet opgeslagen. Bedrijfsgegevens beheer is binnenkort beschikbaar."
                        variant="preview"
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Bedrijfsnaam</Label>
                            <Input defaultValue={tenant.name} disabled={!isAdmin} />
                        </div>
                        <div className="space-y-2">
                            <Label>KVK Nummer</Label>
                            <Input defaultValue={tenant.kvk || ''} disabled={!isAdmin} />
                        </div>
                    </div>
                    {/* Save button - only for admins, but disabled for now */}
                    <Can roles={['owner', 'advisor']}>
                        <div className="flex justify-end">
                            <DisabledCta reason="Opslaan komt binnenkort">
                                <Button onClick={handleSave}>Opslaan</Button>
                            </DisabledCta>
                        </div>
                    </Can>
                    {/* Read-only notice for members */}
                    <Can roles={['staff', 'viewer']} fallback={null}>
                        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                            <Lock size={14} />
                            <span>Je hebt alleen leesrechten. Neem contact op met een admin om wijzigingen door te voeren.</span>
                        </div>
                    </Can>
                </CardContent>
            </Card>

            {/* Team */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">Team & Toegang</CardTitle>
                            <PreviewBadge variant="demo-data" />
                        </div>
                        <CardDescription>Wie heeft toegang tot dit dossier?</CardDescription>
                    </div>
                    {/* Invite button - only for admins, but disabled for now */}
                    <Can roles={['owner', 'advisor']}>
                        <DisabledCta reason="Uitnodigingen komen binnenkort">
                            <Button variant="outline" size="sm" onClick={handleInvite}>
                                <Mail size={14} className="mr-2" /> Nodig adviseur uit
                            </Button>
                        </DisabledCta>
                    </Can>
                </CardHeader>
                <CardContent>
                    <PreviewBanner
                        title="Demo Teamlijst"
                        description="Dit is een voorbeeldteam. Je echte teamleden verschijnen hier zodra gebruikersbeheer is geactiveerd."
                        variant="demo-data"
                        className="mb-4"
                    />
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

            {/* Error Toast */}
            {error && <ErrorToast message={error} onDismiss={() => setError(null)} />}
        </DashboardPage>
    )
}
