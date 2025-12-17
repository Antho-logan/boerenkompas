"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 duration-200",
        className
      )}
      {...props}
    />
  )
}

type SheetSide = "top" | "right" | "bottom" | "left"

function SheetContent({
  side = "right",
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props & { side?: SheetSide }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl outline-none",
          "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 duration-200",
          "transition-transform will-change-transform",
          side === "left" &&
            "inset-y-0 left-0 w-[320px] sm:w-[360px] data-closed:-translate-x-full data-open:translate-x-0",
          side === "right" &&
            "inset-y-0 right-0 w-[320px] sm:w-[360px] data-closed:translate-x-full data-open:translate-x-0",
          side === "top" &&
            "inset-x-0 top-0 max-h-[85vh] data-closed:-translate-y-full data-open:translate-y-0",
          side === "bottom" &&
            "inset-x-0 bottom-0 max-h-[85vh] data-closed:translate-y-full data-open:translate-y-0",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("px-4 py-4 border-b border-slate-100", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-sm font-semibold text-slate-900", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-xs text-slate-500", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
}

