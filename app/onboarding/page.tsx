/**
 * Onboarding Page
 * Shown when user has no tenants yet
 * 
 * SECURITY: Uses server RPC for tenant creation, no client cookie writes
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Leaf, Building2, ArrowRight, AlertCircle, Loader2, AlertTriangle } from 'lucide-react';

export default function OnboardingPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isConfigured, setIsConfigured] = useState(true);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const supabase = createClient();

    // Check configuration and auth on mount
    useEffect(() => {
        const init = async () => {
            setIsConfigured(isSupabaseConfigured());

            if (isSupabaseConfigured()) {
                // Check if user is authenticated
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }
            }

            setIsCheckingAuth(false);
        };

        init();
    }, [supabase, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isSupabaseConfigured()) {
            setError('Supabase is niet geconfigureerd');
            return;
        }

        if (name.trim().length < 2) {
            setError('Bedrijfsnaam moet minimaal 2 karakters zijn');
            return;
        }

        setLoading(true);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Use secure RPC function to create tenant + owner membership
            const { data: tenantId, error: rpcError } = await supabase
                .rpc('create_tenant_with_owner', { p_name: name.trim() });

            if (rpcError) {
                console.error('RPC error:', rpcError);

                // Handle common errors
                if (rpcError.message.includes('does not exist')) {
                    throw new Error('Database migratie niet uitgevoerd. Voer 003_pilot_safe_hardening.sql uit.');
                }
                if (rpcError.message.includes('Authentication required')) {
                    router.push('/login');
                    return;
                }

                throw new Error('Kon bedrijf niet aanmaken. Probeer opnieuw.');
            }

            if (!tenantId) {
                throw new Error('Geen tenant ID ontvangen');
            }

            // Set active tenant via server API (sets httpOnly cookie + user_settings)
            const response = await fetch('/api/tenant/active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId }),
            });

            if (!response.ok) {
                console.warn('Could not set active tenant via API, continuing anyway');
            }

            router.push('/dashboard');
            router.refresh();
        } catch (err) {
            if (err instanceof Error) {
                if (err.message === 'Failed to fetch' || err.message.includes('fetch')) {
                    setError('Kan geen verbinding maken met de server. Controleer je internetverbinding.');
                } else {
                    setError(err.message);
                }
            } else {
                setError('Er is een fout opgetreden');
            }
        } finally {
            setLoading(false);
        }
    };

    // Show loading while checking auth
    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg shadow-xl border-slate-200">
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <Skeleton className="size-12 rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="flex justify-end">
                            <Skeleton className="h-10 w-28" />
                        </div>
                        <span className="sr-only">Laden...</span>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="size-12 rounded-xl bg-emerald-900 text-white flex items-center justify-center shadow-lg">
                            <Leaf size={24} />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">BoerenKompas</span>
                    </div>
                    <h1 className="text-xl font-semibold text-slate-900 mb-2">Welkom!</h1>
                    <p className="text-slate-500">
                        Laten we je bedrijf instellen om te beginnen.
                    </p>
                </div>

                <Card className="shadow-xl border-slate-200">
                    <CardContent className="p-8">
                        {!isConfigured ? (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-center gap-2 text-amber-700 mb-2">
                                    <AlertTriangle size={20} />
                                    <span className="font-semibold">Configuratie Vereist</span>
                                </div>
                                <p className="text-amber-600 text-sm">
                                    Supabase moet geconfigureerd worden voordat je kunt beginnen.
                                </p>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm">
                                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Naam van uw bedrijf
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
                                            <Input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Bijv. Boerderij De Wilgen"
                                                required
                                                className="pl-10 h-12 text-base"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Dit wordt de naam van uw dossier/werkruimte in BoerenKompas.
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base shadow-md"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 size-5 animate-spin" />
                                                Bezig met instellen...
                                            </>
                                        ) : (
                                            <>Doorgaan naar dashboard <ArrowRight className="ml-2 size-5" /></>
                                        )}
                                    </Button>
                                </form>

                                <p className="text-center text-slate-400 text-xs mt-6">
                                    U kunt later adviseurs uitnodigen en instellingen wijzigen.
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-slate-500 text-xs mt-6">
                    BoerenKompas is een dossier-workflow tool en biedt geen juridisch advies.
                </p>
            </div>
        </div>
    );
}
