"use client"

import * as React from "react"
import { Portal } from "@ark-ui/react/portal"
import { Tooltip as TooltipPrimitive } from "@ark-ui/react/tooltip"
import { cn } from "@yopem-ui/utils"

export const Tooltip = ({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) => {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

export const TooltipTrigger = ({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) => {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

const TooltipPositioner = ({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Positioner>) => {
  return (
    <TooltipPrimitive.Positioner data-slot="tooltip-positioner" {...props} />
  )
}

export const TooltipContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) => {
  return (
    <Portal>
      <TooltipPositioner>
        <TooltipPrimitive.Content
          data-slot="tooltip-content"
          className={cn(
            "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
            className,
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
        </TooltipPrimitive.Content>
      </TooltipPositioner>
    </Portal>
  )
}
