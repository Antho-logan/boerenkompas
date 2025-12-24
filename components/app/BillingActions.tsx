"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

type BillingActionsProps = {
    hasCustomer: boolean
    isAdmin: boolean
    defaultInterval?: "monthly" | "annual"
}

export default function BillingActions({
    hasCustomer,
    isAdmin,
    defaultInterval = "monthly",
}: BillingActionsProps) {
    const [loading, setLoading] = useState<"checkout" | "portal" | null>(null)
    const [error, setError] = useState<string | null>(null)

    const startCheckout = async () => {
        if (loading) return
        setLoading("checkout")
        setError(null)

        try {
            const response = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: "pro", interval: defaultInterval }),
            })

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                setError(data?.error || "Kon checkout niet starten.")
                return
            }

            if (!data?.url) {
                setError("Geen checkout URL ontvangen.")
                return
            }

            window.location.href = data.url
        } catch (err) {
            console.error("Checkout error:", err)
            setError("Kon checkout niet starten.")
        } finally {
            setLoading(null)
        }
    }

    const openPortal = async () => {
        if (loading) return
        setLoading("portal")
        setError(null)

        try {
            const response = await fetch("/api/billing/portal", {
                method: "POST",
            })

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                setError(data?.error || "Kon billing portal niet openen.")
                return
            }

            if (!data?.url) {
                setError("Geen portal URL ontvangen.")
                return
            }

            window.location.href = data.url
        } catch (err) {
            console.error("Portal error:", err)
            setError("Kon billing portal niet openen.")
        } finally {
            setLoading(null)
        }
    }

    if (!isAdmin) {
        return (
            <p className="text-xs text-slate-500">
                Alleen eigenaren en adviseurs kunnen facturatie beheren.
            </p>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            {hasCustomer ? (
                <Button
                    onClick={openPortal}
                    disabled={loading === "portal"}
                    className="bg-slate-900 text-white hover:bg-slate-800"
                >
                    {loading === "portal" ? "Bezig..." : "Abonnement beheren"}
                </Button>
            ) : (
                <Button
                    onClick={startCheckout}
                    disabled={loading === "checkout"}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                    {loading === "checkout" ? "Bezig..." : "Upgrade naar Pro"}
                </Button>
            )}

            {hasCustomer ? (
                <Button
                    variant="outline"
                    onClick={startCheckout}
                    disabled={loading === "checkout"}
                    className="border-slate-200 text-slate-700"
                >
                    {loading === "checkout" ? "Bezig..." : "Nieuwe checkout starten"}
                </Button>
            ) : null}

            {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        </div>
    )
}
