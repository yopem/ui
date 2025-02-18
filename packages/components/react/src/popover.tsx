"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@ark-ui/react/popover"
import { cn } from "@yopem-ui/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverIndicator = PopoverPrimitive.Indicator

const PopoverPositioner = PopoverPrimitive.Positioner

const PopoverTitle = PopoverPrimitive.Title

const PopoverDescription = PopoverPrimitive.Description

const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, ...props }, ref) => (
  <PopoverPrimitive.Root>
    <PopoverPrimitive.Content
      ref={ref}
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 rounded-md border p-4 shadow-md outline-none",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Root>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverIndicator,
  PopoverPositioner,
  PopoverTitle,
  PopoverDescription,
}
