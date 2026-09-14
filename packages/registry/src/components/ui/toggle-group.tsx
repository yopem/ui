"use client"

import type { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import type { StyleXProps } from "@registry/lib/stylex"

import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { Separator } from "@registry/components/ui/separator"
import {
  Toggle as ToggleComponent,
  type ToggleVariantProps,
} from "@registry/components/ui/toggle"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import * as React from "react"

const styles = stylex.create({
  root: { display: "flex", inlineSize: "fit-content" },
  horizontal: { flexDirection: "row" },
  vertical: { flexDirection: "column" },
  default: { gap: "0.125rem" },
  outline: { gap: 0 },
  separator: {
    backgroundColor: tokens["--input"],
    pointerEvents: "none",
    position: "relative",
  },
})

export const ToggleGroupContext: React.Context<ToggleVariantProps> =
  React.createContext<ToggleVariantProps>({
    size: "default",
    variant: "default",
  })

export function ToggleGroup({
  xstyle,
  className,
  variant = "default",
  size = "default",
  orientation = "horizontal",
  children,
  ...props
}: ToggleGroupPrimitive.Props &
  Omit<ToggleVariantProps, "className"> &
  StyleXProps) {
  const contextValue = React.useMemo(() => ({ size, variant }), [size, variant])
  return (
    <ToggleGroupPrimitive
      {...stylexProps(
        className,
        styles.root,
        orientation === "horizontal" ? styles.horizontal : styles.vertical,
        variant === "default" ? styles.default : styles.outline,
        xstyle,
      )}
      data-size={size}
      data-slot="toggle-group"
      data-variant={variant}
      orientation={orientation}
      {...props}
    >
      <ToggleGroupContext.Provider value={contextValue}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}

export function ToggleGroupItem({
  xstyle,
  className,
  children,
  variant,
  size,
  ...props
}: TogglePrimitive.Props &
  Omit<ToggleVariantProps, "className"> &
  StyleXProps) {
  const context = React.useContext(ToggleGroupContext)
  const resolvedVariant = context.variant || variant
  const resolvedSize = context.size || size
  return (
    <ToggleComponent
      className={className}
      xstyle={xstyle}
      data-size={resolvedSize}
      data-variant={resolvedVariant}
      size={resolvedSize}
      variant={resolvedVariant}
      {...props}
    >
      {children}
    </ToggleComponent>
  )
}

export function ToggleGroupSeparator({
  xstyle,
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator> & StyleXProps) {
  return (
    <Separator
      className={className}
      xstyle={[styles.separator, xstyle]}
      orientation={orientation}
      {...props}
    />
  )
}
export { ToggleGroupPrimitive }
