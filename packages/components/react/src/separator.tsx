import * as React from "react"
import { cn } from "@yopem-ui/utils"

export const Separator = ({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}) => {
  return (
    <div
      role="separator"
      data-slot="separator"
      data-orientation={orientation}
      aria-orientation={orientation}
      aria-hidden={decorative}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  )
}
