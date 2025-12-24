"use client"

import type { ReactNode } from "react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type DashboardPageProps = {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
  withSeparator?: boolean
}

export default function DashboardPage({
  title,
  description,
  actions,
  children,
  className,
  headerClassName,
  withSeparator = false,
}: DashboardPageProps) {
  return (
    <div className={cn("space-y-6 md:space-y-8", className)}>
      <div className={cn("space-y-2 md:space-y-3", headerClassName)}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-sm md:text-base text-slate-500 max-w-3xl">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {withSeparator && <Separator />}
      </div>
      {children}
    </div>
  )
}
