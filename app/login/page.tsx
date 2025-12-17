/**
 * Login Page with Supabase Auth
 * 
 * SECURITY: Demo login is gated behind NEXT_PUBLIC_ENABLE_DEMO_LOGIN env flag
 */

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
    getSupabaseConfig,
    getSupabaseUrlHost,
    probeSupabaseConnectivity,
    supabaseAnonKey,
    supabaseUrl,
} from '@/lib/supabase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Leaf, Mail, Lock, ArrowRight, AlertCircle, Loader2, AlertTriangle } from 'lucide-react';

// Demo login is DISABLED by default - only enable via env var
const DEMO_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true';

function ConfigurationError() {
    const { issues } = getSupabaseConfig();
    const isMissing = issues.includes('missing_url') || issues.includes('missing_anon_key');
    const isPlaceholder =
        issues.includes('placeholder_url') || issues.includes('placeholder_anon_key');

    return (
        <div className="p-4 bg-amber-500/20 border border-amber-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-amber-200 mb-2">
                <AlertTriangle size={20} />
                <span className="font-semibold">Configuratie Vereist</span>
            </div>
            <p className="text-amber-100/80 text-sm">
                {isMissing
                    ? (
                        <>
                            Supabase is nog niet geconfigureerd. Zet de volgende environment variabelen in{' '}
                            <code className="bg-amber-500/20 px-1 rounded">.env.local</code> (in dezelfde map als{' '}
                            <code className="bg-amber-500/20 px-1 rounded">package.json</code>) en herstart de dev server:
                        </>
                    )
                    : isPlaceholder
                        ? (
                            <>
                                Je gebruikt nog voorbeeldwaarden voor Supabase. Vervang de waarden in{' '}
                                <code className="bg-amber-500/20 px-1 rounded">.env.local</code> (zelfde map als{' '}
                                <code className="bg-amber-500/20 px-1 rounded">package.json</code>) door je echte projectgegevens en herstart de dev server:
                            </>
                        )
                        : (
                            <>
                                Supabase is niet correct geconfigureerd. Controleer de waarden in{' '}
                                <code className="bg-amber-500/20 px-1 rounded">.env.local</code> (zelfde map als{' '}
                                <code className="bg-amber-500/20 px-1 rounded">package.json</code>) en herstart de dev server:
                            </>
                        )}
            </p>
            <ul className="text-amber-100/80 text-sm mt-2 list-disc list-inside">
                <li>NEXT_PUBLIC_SUPABASE_URL</li>
                <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            </ul>
            <p className="text-amber-100/60 text-xs mt-2">
                Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local and restart dev server.
            </p>
            {!isMissing && (
                <p className="text-amber-100/60 text-xs mt-2">
                    Tip: de URL ziet er meestal uit als <code className="bg-amber-500/20 px-1 rounded">https://&lt;project-ref&gt;.supabase.co</code> en de anon key is een lange JWT.
                </p>
            )}
        </div>
    );
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/dashboard';
    const configError = searchParams.get('error') === 'config';

    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(
        configError ? 'Supabase is niet geconfigureerd. Neem contact op met de beheerder.' : null
    );
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [isConfigured, setIsConfigured] = useState(() => isSupabaseConfigured());
    const [isReachable, setIsReachable] = useState<boolean | null>(null);

    // Check configuration on mount
    useEffect(() => {
        setIsConfigured(isSupabaseConfigured());

        const host = getSupabaseUrlHost();
        // Required debug logs (no secrets): host + anon-key presence
        console.log('[Supabase] NEXT_PUBLIC_SUPABASE_URL host:', host ?? '(missing/invalid)');
        console.log('[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY present:', Boolean(supabaseAnonKey));

        // Dev-only connectivity probe to distinguish wrong/unreachable endpoint (state B)
        if (process.env.NODE_ENV !== 'development') return;
        if (!isSupabaseConfigured()) return;

        let cancelled = false;
        setIsReachable(null);
        probeSupabaseConnectivity(2500)
            .then((result) => {
                if (cancelled) return;
                if (!result.ok) {
                    console.error('[Supabase] Connectivity probe failed:', {
                        supabaseUrl,
                        host,
                        ...result,
                    });
                    setIsReachable(false);
                    setError('Cannot reach Supabase endpoint. Controleer de URL/DNS/firewall en je Supabase configuratie.');
                    return;
                }
                setIsReachable(true);
            })
            .catch((probeError) => {
                if (cancelled) return;
                console.error('[Supabase] Connectivity probe threw:', probeError);
                setIsReachable(false);
                setError('Cannot reach Supabase endpoint. Controleer de URL/DNS/firewall en je Supabase configuratie.');
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            setError('Supabase is niet geconfigureerd. Zie instructies hierboven.');
            return;
        }

        // Dev-only: prevent sign-in spam when the endpoint is clearly unreachable
        if (process.env.NODE_ENV === 'development' && isReachable === false) {
            setError('Cannot reach Supabase endpoint. Controleer de URL/DNS/firewall en je Supabase configuratie.');
            return;
        }

        setLoading(true);

        try {
            if (mode === 'signup') {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        },
                    },
                });

                if (signUpError) {
                    // Translate common errors to Dutch
                    if (signUpError.message.includes('already registered')) {
                        throw new Error('Dit e-mailadres is al geregistreerd');
                    }
                    if (signUpError.message.includes('Password')) {
                        throw new Error('Wachtwoord moet minstens 6 tekens bevatten');
                    }
                    throw signUpError;
                }

                setSuccess('Account aangemaakt! Controleer je e-mail voor bevestiging.');
                setMode('login');
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) {
                    console.error('[Supabase] signInWithPassword error:', {
                        status: (signInError as { status?: number }).status,
                        code: (signInError as { code?: string }).code,
                        message: signInError.message,
                    });
                    // Translate common errors to Dutch
                    if (
                        signInError.message.includes('Invalid login credentials') ||
                        (signInError as { code?: string }).code === 'invalid_login_credentials'
                    ) {
                        throw new Error('Onjuiste e-mail of wachtwoord');
                    }
                    if (signInError.message.includes('Email not confirmed')) {
                        throw new Error('Bevestig eerst je e-mailadres');
                    }
                    throw signInError;
                }

                router.push(redirect);
                router.refresh();
            }
        } catch (err) {
            if (err instanceof Error) {
                const message = err.message.toLowerCase();
                const isNetworkError =
                    message.includes('failed to fetch') ||
                    message.includes('networkerror') ||
                    message.includes('load failed') ||
                    message.includes('fetch');

                // State B: Supabase env present but wrong/unreachable (network/CORS/DNS)
                if (isNetworkError) {
                    console.error('[Supabase] Network error during auth:', {
                        supabaseUrl,
                        host: getSupabaseUrlHost(),
                        error: err,
                    });
                    setIsReachable(false);
                    setError('Cannot reach Supabase endpoint. Controleer de URL/DNS/firewall en je Supabase configuratie.');
                } else {
                    setError(err.message);
                }
            } else {
                setError('Er is een onbekende fout opgetreden');
            }
        } finally {
            setLoading(false);
        }
    };

    // Show configuration error if Supabase is not configured
    if (!isConfigured) {
        return <ConfigurationError />;
    }

    return (
        <>
            {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-200 text-sm">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-200 text-sm">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Naam</label>
                        <div className="relative">
                            <Input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Uw naam"
                                required
                                className="bg-white/10 border-white/10 text-white placeholder:text-slate-500 pl-10"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">E-mail</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="uw@email.nl"
                            required
                            className="bg-white/10 border-white/10 text-white placeholder:text-slate-500 pl-10"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Wachtwoord</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className="bg-white/10 border-white/10 text-white placeholder:text-slate-500 pl-10"
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 shadow-md"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Even geduld...
                        </>
                    ) : mode === 'login' ? (
                        <>Inloggen <ArrowRight className="ml-2 size-4" /></>
                    ) : (
                        <>Account aanmaken <ArrowRight className="ml-2 size-4" /></>
                    )}
                </Button>
            </form>

            <div className="mt-4 text-center">
                <button
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                    {mode === 'login' ? 'Nog geen account? Registreer hier' : 'Al een account? Log hier in'}
                </button>
            </div>

            {/* Demo login - ONLY shown when explicitly enabled via env var */}
            {DEMO_LOGIN_ENABLED && (
                <div className="mt-6 pt-6 border-t border-white/10">
                    <p className="text-xs text-slate-500 text-center mb-2">
                        Demo modus actief (alleen voor development)
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={loading}
                        className="w-full border-white/20 text-slate-300 hover:text-white hover:bg-white/10"
                        onClick={async () => {
                            setError(null);
                            setLoading(true);
                            try {
                                const { error: demoError } = await supabase.auth.signInWithPassword({
                                    email: 'demo@boerenkompas.nl',
                                    password: 'demo123456',
                                });
                                if (demoError) throw demoError;
                                router.push(redirect);
                                router.refresh();
                            } catch {
                                setError('Demo account niet beschikbaar');
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        Demo account
                    </Button>
                </div>
            )}
        </>
    );
}

function LoginFormLoading() {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-slate-400" />
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="size-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                            <Leaf size={24} />
                        </div>
                        <span className="text-2xl font-bold text-white">BoerenKompas</span>
                    </div>
                    <p className="text-slate-400">Log in om verder te gaan</p>
                </div>

                <Card className="bg-white/10 backdrop-blur-lg border-white/10 shadow-2xl">
                    <CardContent className="p-6">
                        <Suspense fallback={<LoginFormLoading />}>
                            <LoginForm />
                        </Suspense>
                    </CardContent>
                </Card>

                <p className="text-center text-slate-500 text-xs mt-6">
                    Door te registreren ga je akkoord met onze voorwaarden.
                    <br />
                    BoerenKompas is een dossier-workflow tool en biedt geen juridisch advies.
                </p>
            </div>
        </div>
    );
}
