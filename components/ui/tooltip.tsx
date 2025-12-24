"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({ ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider {...props} />
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root {...props} />
    </TooltipPrimitive.Provider>
  )
}

type TooltipTriggerProps = TooltipPrimitive.Trigger.Props & {
  asChild?: boolean;
  children?: React.ReactNode;
};

function TooltipTrigger({ className, asChild, children, ...props }: TooltipTriggerProps) {
  if (asChild) {
    if (React.isValidElement(children)) {
      return (
        <TooltipPrimitive.Trigger
          data-slot="tooltip-trigger"
          className={className}
          render={children}
          {...props}
        />
      )
    }

    return (
      <TooltipPrimitive.Trigger
        data-slot="tooltip-trigger"
        className={className}
        render={<span>{children}</span>}
        {...props}
      />
    )
  }

  return (
    <TooltipPrimitive.Trigger data-slot="tooltip-trigger" className={className} {...props}>
      {children}
    </TooltipPrimitive.Trigger>
  )
}

function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: TooltipPrimitive.Popup.Props & { sideOffset?: number }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner sideOffset={sideOffset}>
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs shadow-md",
            className
          )}
          {...props}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
