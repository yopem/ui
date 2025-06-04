"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "@ark-ui/react/progress"
import { cn } from "@yopem-ui/utils"

export const ProgressLinear = ({
  className,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) => {
  return (
    <ProgressPrimitive.Root data-slot="progress" {...props}>
      <ProgressPrimitive.Track
        data-slot="progress-track"
        className={cn(
          "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
          className,
        )}
      >
        <ProgressPrimitive.Range
          data-slot="progress-range"
          className="bg-primary h-full flex-1 transition-all"
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}
