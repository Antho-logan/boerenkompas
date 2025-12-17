"use client";

import { TenantProvider } from "@/components/app/TenantProvider";
import AppShell from "@/components/app/AppShell";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <TenantProvider>
            <AppShell>
                {children}
            </AppShell>
        </TenantProvider>
    );
}
