"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "@ark-ui/react/progress"
import { cn } from "@yopem-ui/utils"

const ProgressLinear = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Track
      className="bg-primary size-full flex-1 transition-all"
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    >
      <ProgressPrimitive.Range />
    </ProgressPrimitive.Track>
  </ProgressPrimitive.Root>
))
ProgressLinear.displayName = ProgressPrimitive.Root.displayName

export { ProgressLinear }
