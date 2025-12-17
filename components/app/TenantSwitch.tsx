"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Building2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTenant } from "./TenantProvider"

export function TenantSwitch() {
    const { tenant, tenants, switchTenant } = useTenant()

    if (!tenant) return <div className="w-[200px] h-9 bg-slate-100 animate-pulse rounded" />

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className={cn(
                buttonVariants({ variant: "outline" }),
                "w-[180px] sm:w-[220px] max-w-[60vw] justify-between border-slate-200 bg-white/50 backdrop-blur"
            )}>
                <div className="flex items-center gap-2 truncate">
                    <div className="size-5 rounded flex items-center justify-center bg-emerald-100 text-emerald-700">
                        <Building2 size={12} />
                    </div>
                    <span className="truncate">{tenant.name}</span>
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[220px] p-0">
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs text-slate-500 font-normal px-3 py-2">Wissel van bedrijf</DropdownMenuLabel>
                    {tenants.map((t) => (
                        <DropdownMenuItem
                            key={t.id}
                            onSelect={() => switchTenant(t.id)}
                            className="flex items-center justify-between px-3 py-2 cursor-pointer"
                        >
                            <span className={cn("font-medium", tenant.id === t.id && "text-emerald-700")}>{t.name}</span>
                            {tenant.id === t.id && (
                                <Check className="h-4 w-4 text-emerald-600" />
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem className="text-xs text-slate-500 cursor-not-allowed">
                        + Bedrijf toevoegen
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
