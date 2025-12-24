import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireActiveTenant } from "@/lib/supabase/tenant"
import { PLAN_LABELS } from "@/lib/plans"
import DashboardPage from "@/components/app/DashboardPage"
import BillingActions from "@/components/app/BillingActions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const statusLabels: Record<string, { label: string; tone: "emerald" | "amber" | "rose" | "slate" }> = {
    active: { label: "Actief", tone: "emerald" },
    trialing: { label: "Proefperiode", tone: "amber" },
    past_due: { label: "Achterstallig", tone: "rose" },
    canceled: { label: "Opgezegd", tone: "slate" },
    inactive: { label: "Inactief", tone: "slate" },
}

function formatDate(value: string | null) {
    if (!value) return "-"
    return new Date(value).toLocaleDateString("nl-NL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

function formatId(value: string | null) {
    if (!value) return "-"
    return value
}

export default async function BillingSettingsPage({
    searchParams,
}: {
    searchParams?: { success?: string; canceled?: string }
}) {
    const tenant = await requireActiveTenant()
    const supabase = await createServerSupabaseClient()

    const { data: billing, error } = await supabase
        .from("tenants")
        .select(
            "id, name, plan, plan_status, stripe_customer_id, stripe_subscription_id, current_period_end, cancel_at_period_end"
        )
        .eq("id", tenant.id)
        .single()

    const isAdmin = tenant.role === "owner" || tenant.role === "advisor"

    if (error || !billing) {
        return (
            <DashboardPage
                title="Facturatie"
                description="Beheer je abonnement en Stripe koppeling."
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Facturatie</CardTitle>
                        <CardDescription>Kon facturatiegegevens niet laden.</CardDescription>
                    </CardHeader>
                </Card>
            </DashboardPage>
        )
    }

    const statusKey = billing.plan_status || "inactive"
    const statusMeta = statusLabels[statusKey] || statusLabels.inactive
    const success = searchParams?.success === "1"
    const canceled = searchParams?.canceled === "1"

    return (
        <DashboardPage
            title="Facturatie"
            description="Beheer je abonnement en Stripe koppeling."
            className="animate-fade-in-up"
        >
            {success && (
                <Card className="border-emerald-200 bg-emerald-50">
                    <CardHeader>
                        <CardTitle className="text-emerald-900">Betaling ontvangen</CardTitle>
                        <CardDescription className="text-emerald-800">
                            Je abonnement wordt verwerkt. Dit scherm ververst automatisch zodra Stripe de status bijwerkt.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            {canceled && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                        <CardTitle className="text-amber-900">Betaling geannuleerd</CardTitle>
                        <CardDescription className="text-amber-800">
                            De checkout is geannuleerd. Je kunt het later opnieuw proberen.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Abonnement status</CardTitle>
                        <CardDescription>Actieve plan- en Stripe status.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Plan</span>
                            <Badge variant="secondary" className="text-xs">
                                {PLAN_LABELS[billing.plan as keyof typeof PLAN_LABELS] || billing.plan}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Subscription status</span>
                            <Badge
                                variant="outline"
                                className={
                                    statusMeta.tone === "emerald"
                                        ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                                        : statusMeta.tone === "amber"
                                          ? "border-amber-200 text-amber-700 bg-amber-50"
                                          : statusMeta.tone === "rose"
                                            ? "border-rose-200 text-rose-700 bg-rose-50"
                                            : "border-slate-200 text-slate-600 bg-slate-50"
                                }
                            >
                                {statusMeta.label}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Huidige periode eindigt</span>
                            <span className="text-sm font-medium text-slate-900">
                                {formatDate(billing.current_period_end)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Annuleren aan einde periode</span>
                            <span className="text-sm font-medium text-slate-900">
                                {billing.cancel_at_period_end ? "Ja" : "Nee"}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Stripe koppeling</CardTitle>
                        <CardDescription>Identificatie in Stripe.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="text-xs text-slate-500">Stripe customer ID</div>
                            <div className="mt-1 font-mono text-xs text-slate-700">
                                {formatId(billing.stripe_customer_id)}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500">Stripe subscription ID</div>
                            <div className="mt-1 font-mono text-xs text-slate-700">
                                {formatId(billing.stripe_subscription_id)}
                            </div>
                        </div>
                        <div className="pt-2">
                            <BillingActions
                                hasCustomer={Boolean(billing.stripe_customer_id)}
                                isAdmin={isAdmin}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardPage>
    )
}
