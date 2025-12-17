/**
 * Next.js Middleware for Supabase Auth Session Refresh
 * 
 * Local dev: When Supabase env is missing/invalid, bypass auth checks to avoid breaking UI work.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig } from '@/lib/supabase/config';

export async function middleware(request: NextRequest) {
    const { supabaseUrl, supabaseAnonKey, isConfigured } = getSupabaseConfig();
    const isDev = process.env.NODE_ENV === 'development';

    const isProtectedPath =
        request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/onboarding') ||
        request.nextUrl.pathname.startsWith('/api/');

    // Local dev: no-op when missing/invalid config (keeps UI work usable)
    if (!isConfigured || !supabaseUrl || !supabaseAnonKey) {
        if (isDev) return NextResponse.next();
        if (!isProtectedPath) return NextResponse.next();

        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('error', 'config');
        return NextResponse.redirect(url);
    }

    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if expired
    const { data: { user } } = await supabase.auth.getUser();

    // Protect dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('redirect', request.nextUrl.pathname);
            return NextResponse.redirect(url);
        }

        // Check if user has tenants (onboarding check)
        // Only do this check for dashboard root to avoid too many DB queries
        if (request.nextUrl.pathname === '/dashboard') {
            const { data: memberships } = await supabase
                .from('tenant_members')
                .select('tenant_id')
                .eq('user_id', user.id)
                .limit(1);

            if (!memberships || memberships.length === 0) {
                const url = request.nextUrl.clone();
                url.pathname = '/onboarding';
                return NextResponse.redirect(url);
            }
        }
    }

    // Protect onboarding - must be authenticated
    if (request.nextUrl.pathname === '/onboarding') {
        if (!user) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }

        // Redirect from onboarding if user already has tenants
        const { data: memberships } = await supabase
            .from('tenant_members')
            .select('tenant_id')
            .eq('user_id', user.id)
            .limit(1);

        if (memberships && memberships.length > 0) {
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard';
            return NextResponse.redirect(url);
        }
    }

    // Redirect logged in users from login to dashboard
    if (request.nextUrl.pathname === '/login' && user) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
