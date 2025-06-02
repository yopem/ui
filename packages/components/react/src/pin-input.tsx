"use client"

import * as React from "react"
import { PinInput as PinInputPrimitive } from "@ark-ui/react/pin-input"
import { cn } from "@yopem-ui/utils"

export const PinInput = ({
  ...props
}: React.ComponentProps<typeof PinInputPrimitive.Root>) => (
  <PinInputPrimitive.Root data-slot="pin-input" {...props} />
)

export const PinInputLabel = ({
  ...props
}: React.ComponentProps<typeof PinInputPrimitive.Label>) => (
  <PinInputPrimitive.Label data-slot="pin-input-label" {...props} />
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
        "flex items-center gap-2 has-[:disabled]:opacity-50",
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
      className={cn("disabled:cursor-not-allowed", className)}
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
      className={cn("flex items-center", className)}
      {...props}
    />
  )
}
