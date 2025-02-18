"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "@ark-ui/react/slider"
import { cn } from "@yopem-ui/utils"

const Slider = SliderPrimitive.Root

const SliderLabel = SliderPrimitive.Label

const SliderValueText = SliderPrimitive.ValueText

const SliderHiddenInput = SliderPrimitive.HiddenInput

const SliderControl = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Control>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Control>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Control ref={ref} className={cn(className)} {...props} />
))
SliderControl.displayName = "SliderControl"

const SliderTrack = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Track>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Track>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Track
    ref={ref}
    className={cn(
      "bg-primary/20 relative h-1.5 w-full grow overflow-hidden rounded-full",
      className,
    )}
    {...props}
  />
))
SliderTrack.displayName = "SliderTrack"

const SliderRange = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Range>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Range>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Range
    ref={ref}
    className={cn("bg-primary absolute h-full", className)}
    {...props}
  />
))
SliderRange.displayName = "SliderRange"

const SliderThumb = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Thumb>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Thumb> & {
    index?: number
  }
>(({ className, index = 0, ...props }, ref) => (
  <SliderPrimitive.Thumb
    ref={ref}
    index={index}
    className={cn(
      "border-primary/50 bg-background focus-visible:ring-ring block size-4 rounded-full border shadow transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
))
SliderThumb.displayName = "SliderThumb"

export {
  Slider,
  SliderControl,
  SliderTrack,
  SliderRange,
  SliderThumb,
  SliderLabel,
  SliderValueText,
  SliderHiddenInput,
}
