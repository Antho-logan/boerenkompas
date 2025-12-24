"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div key={pathname} className="animate-in fade-in duration-200">
      {children}
    </div>
  )
}
