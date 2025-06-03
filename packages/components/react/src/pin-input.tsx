"use client"

import * as React from "react"
import { PinInput as PinInputPrimitive } from "@ark-ui/react/pin-input"
import { cn } from "@yopem-ui/utils"

export const PinInput = ({
  className,
  ...props
}: React.ComponentProps<typeof PinInputPrimitive.Root>) => (
  <PinInputPrimitive.Root
    data-slot="pin-input"
    className={cn("flex gap-2", className)}
    {...props}
  />
)

export const PinInputLabel = ({
  className,
  ...props
}: React.ComponentProps<typeof PinInputPrimitive.Label>) => (
  <PinInputPrimitive.Label
    data-slot="pin-input-label"
    className={cn("text-muted-foreground block text-sm font-medium", className)}
    {...props}
  />
)

export const PinInputHiddenInput = ({
  ...props
}: React.ComponentProps<typeof PinInputPrimitive.HiddenInput>) => (
  <PinInputPrimitive.HiddenInput data-slot="pin-input-hidden" {...props} />
)

export const PinInputInput = ({
  className,
  ...props
}: React.ComponentProps<typeof PinInputPrimitive.Input>) => {
  return (
    <PinInputPrimitive.Input
      data-slot="pin-input-input"
      className={cn(
        "border-input bg-background focus-visible:ring-ring size-10 rounded-md border text-center text-sm shadow-sm ring-0 transition-all outline-none focus:ring-2 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export const PinInputControl = ({
  className,
  ...props
}: React.ComponentProps<typeof PinInputPrimitive.Control>) => {
  return (
    <PinInputPrimitive.Control
      data-slot="pin-input-control"
      className={cn("flex gap-2 disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

export const PinInputGroup = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      data-slot="pin-input-group"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
}
