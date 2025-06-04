"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "@ark-ui/react/progress"
import { cn } from "@yopem-ui/utils"

interface ProgressLinearProps
  extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  label?: React.ReactNode
  showValueText?: boolean
  className?: string
}

export const ProgressLinear = ({
  label,
  showValueText = false,
  className,
  ...props
}: ProgressLinearProps) => {
  return (
    <ProgressPrimitive.Root data-slot="progress" className="w-full" {...props}>
      {label && (
        <ProgressPrimitive.Label className="text-foreground mb-1 block text-sm">
          {label}
        </ProgressPrimitive.Label>
      )}
      {showValueText && (
        <ProgressPrimitive.ValueText className="text-muted-foreground mb-1 block text-xs" />
      )}
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
