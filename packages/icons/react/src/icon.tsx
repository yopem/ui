import * as React from "react"
import * as LucideIcons from "lucide-react"
import { type LucideIcon as LucideIconType } from "lucide-react"

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: keyof typeof LucideIcons
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, ...props }, ref) => {
    const LucideIcon = LucideIcons[name] as React.ElementType

    return <LucideIcon ref={ref} {...props} />
  },
)

Icon.displayName = "Icon"

export type { LucideIconType }
