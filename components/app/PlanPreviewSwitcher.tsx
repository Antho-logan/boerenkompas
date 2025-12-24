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
  realPlan?: PlanId
}

export function PlanPreviewSwitcher({ realPlan = 'starter' }: Props) {
  const { effectivePlan, setPreviewPlan, clearPreviewPlan } = useTenant()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted || !isPlanPreviewEnabled()) return null

  const currentPlan = getPlan(effectivePlan || realPlan)
  const isPreviewing = effectivePlan !== null && effectivePlan !== realPlan

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
          {isPreviewing && <FlaskConical size={10} className="animate-pulse" />}
          {currentPlan.name}
          <ChevronDown size={10} className="opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center gap-2">
              <FlaskConical size={14} className="text-amber-500" />
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
                {effectivePlan === p.id && <Check size={14} className="text-emerald-600" />}
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
                <RotateCcw size={14} className="mr-2" />
                Reset naar {getPlan(realPlan).name}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

