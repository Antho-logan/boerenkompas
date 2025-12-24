"use client"

import * as React from "react"
import { Lock, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { PLAN_LABELS, type PlanId } from "@/lib/plans"

interface LockedFeatureCardProps {
  title: string
  description: string
  requiredPlanId: PlanId
  className?: string
  overlay?: boolean
}

export function LockedFeatureCard({
  title,
  description,
  requiredPlanId,
  className,
  overlay = false,
}: LockedFeatureCardProps) {
  const label = PLAN_LABELS[requiredPlanId]

  const content = (
    <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="size-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm">
        <Lock size={20} />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h4 className="font-bold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
          Vereist: {label}
        </span>
        <Link href="/pricing">
          <Button size="sm" variant="outline" className="h-8 text-xs font-bold gap-2">
            Upgrade nu <ArrowRight size={12} />
          </Button>
        </Link>
      </div>
    </div>
  )

  if (overlay) {
    return (
      <div className={cn(
        "absolute inset-0 z-20 bg-slate-50/40 backdrop-blur-[3px] flex items-center justify-center p-6 animate-in fade-in duration-500",
        className
      )}>
        <div className="bg-white/95 p-2 rounded-2xl shadow-2xl border border-slate-200 max-w-sm animate-scale-in">
          {content}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn("border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none overflow-hidden", className)}>
      <CardContent className="p-0">
        {content}
      </CardContent>
    </Card>
  )
}
