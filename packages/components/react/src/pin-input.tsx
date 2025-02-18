"use client"

import * as React from "react"
import { PinInput as PinInputPrimitive } from "@ark-ui/react/pin-input"
import { cn } from "@yopem-ui/utils"

const PinInput = PinInputPrimitive.Root
const PinInputLabel = PinInputPrimitive.Label
const PinInputHiddenInput = PinInputPrimitive.HiddenInput

const PinInputInput = React.forwardRef<
  React.ComponentRef<typeof PinInputPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof PinInputPrimitive.Input>
>(({ className, ...props }, ref) => (
  <PinInputPrimitive.Input
    ref={ref}
    className={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      className,
    )}
    {...props}
  />
))
PinInputInput.displayName = "PinInputInput"

const PinInputControl = React.forwardRef<
  React.ComponentRef<typeof PinInputPrimitive.Control>,
  React.ComponentPropsWithoutRef<typeof PinInputPrimitive.Control>
>(({ className, ...props }, ref) => (
  <PinInputPrimitive.Control
    ref={ref}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
PinInputControl.displayName = "PinInputControl"

const PinInputGroup = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
PinInputGroup.displayName = "PinInputGroup"

export {
  PinInput,
  PinInputLabel,
  PinInputInput,
  PinInputControl,
  PinInputGroup,
  PinInputHiddenInput,
}
