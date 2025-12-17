
import { cn } from "@/lib/utils"

interface PreviewBadgeProps {
    className?: string
}

export function PreviewBadge({ className }: PreviewBadgeProps) {
    return (
        <span className={cn(
            "px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-500 border border-slate-200",
            className
        )}>
            Preview
        </span>
    )
}
