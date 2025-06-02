"use client"

import * as React from "react"
import { HoverCard as HoverCardPrimitive } from "@ark-ui/react/hover-card"
import { Portal } from "@ark-ui/react/portal"
import { cn } from "@yopem-ui/utils"

export const HoverCard = ({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) => {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />
}

export const HoverCardTrigger = ({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) => {
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  )
}

const HoverCardPositioner = ({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Positioner>) => {
  return (
    <HoverCardPrimitive.Positioner
      data-slot="hover-card-positioner"
      {...props}
    />
  )
}

export const HoverCardContent = ({
  className,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) => {
  return (
    <Portal data-slot="hover-card-portal">
      <HoverCardPositioner>
        <HoverCardPrimitive.Content
          data-slot="hover-card-content"
          className={cn(
            "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
            className,
          )}
          {...props}
        />
      </HoverCardPositioner>
    </Portal>
  )
}
