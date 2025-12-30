"use client"

import * as React from "react"
import { Check, ChevronDown, FlaskConical, RotateCcw } from "lucide-react"
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
import { getPlan, PLANS, PlanId } from "@/lib/plans"
import { isPlanPreviewEnabled } from "@/lib/plan-preview"
import { cn } from "@/lib/utils"

interface Props {
<<<<<<< HEAD
  realPlan?: PlanId
}

export function PlanPreviewSwitcher({ realPlan = 'starter' }: Props) {
  const { effectivePlan, setPreviewPlan, clearPreviewPlan } = useTenant()
=======
  /** The real plan from the database. If not provided, uses tenant.plan from context */
  realPlan?: PlanId
}

export function PlanPreviewSwitcher({ realPlan }: Props) {
  const { tenant, effectivePlan, setPreviewPlan, clearPreviewPlan } = useTenant()
>>>>>>> b0318de (chore: sync updates)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted || !isPlanPreviewEnabled()) return null

<<<<<<< HEAD
  const currentPlan = getPlan(effectivePlan || realPlan)
  const isPreviewing = effectivePlan !== null && effectivePlan !== realPlan
=======
  // Use realPlan prop if provided, otherwise fall back to tenant plan, then 'starter'
  const actualPlan: PlanId = realPlan ?? tenant?.plan ?? 'starter'
  const currentPlan = getPlan(effectivePlan || actualPlan)
  const isPreviewing = effectivePlan !== null && effectivePlan !== actualPlan
>>>>>>> b0318de (chore: sync updates)

  return (
    <div className="flex items-center gap-2">
      {isPreviewing && (
        <span className="text-[8px] font-bold text-amber-500 animate-pulse hidden lg:inline">
          PREVIEW ENABLED
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger 
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-7 px-2 gap-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border shadow-none cursor-pointer",
            isPreviewing 
              ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
              : "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200"
          )}
        >
<<<<<<< HEAD
          {isPreviewing && <FlaskConical size={10} className="animate-pulse" />}
          {currentPlan.name}
          <ChevronDown size={10} className="opacity-50" />
=======
          {isPreviewing && <FlaskConical size={10} className="animate-pulse" aria-hidden="true" />}
          {currentPlan.name}
          <ChevronDown size={10} className="opacity-50" aria-hidden="true" />
>>>>>>> b0318de (chore: sync updates)
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center gap-2">
<<<<<<< HEAD
              <FlaskConical size={14} className="text-amber-500" />
=======
              <FlaskConical size={14} className="text-amber-500" aria-hidden="true" />
>>>>>>> b0318de (chore: sync updates)
              Plan Preview Mode
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {PLANS.map((p) => (
              <DropdownMenuItem 
                key={p.id}
                onClick={() => setPreviewPlan(p.id)}
                className="flex items-center justify-between"
              >
                <span>{p.name}</span>
<<<<<<< HEAD
                {effectivePlan === p.id && <Check size={14} className="text-emerald-600" />}
=======
                {effectivePlan === p.id && <Check size={14} className="text-emerald-600" aria-hidden="true" />}
>>>>>>> b0318de (chore: sync updates)
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          
          {isPreviewing && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => clearPreviewPlan()}
                className="text-amber-600 focus:text-amber-700 font-medium"
              >
<<<<<<< HEAD
                <RotateCcw size={14} className="mr-2" />
                Reset naar {getPlan(realPlan).name}
=======
                <RotateCcw size={14} className="mr-2" aria-hidden="true" />
                Reset naar {getPlan(actualPlan).name}
>>>>>>> b0318de (chore: sync updates)
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
<<<<<<< HEAD

=======
>>>>>>> b0318de (chore: sync updates)
