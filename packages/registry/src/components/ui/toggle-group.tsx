"use client"

import type { Toggle as TogglePrimitive } from "@base-ui/react/toggle"

import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { Separator } from "@registry/components/ui/separator"
import {
  Toggle as ToggleComponent,
  type ToggleVariantProps,
} from "@registry/components/ui/toggle"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"
import * as React from "react"

const styles = stylex.create({
  root: { display: "flex", inlineSize: "fit-content" },
  horizontal: { flexDirection: "row" },
  vertical: { flexDirection: "column" },
  default: { gap: "0.125rem" },
  outline: { gap: 0 },
  separator: {
    backgroundColor: tokens.input,
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
  className,
  variant = "default",
  size = "default",
  orientation = "horizontal",
  children,
  ...props
}: ToggleGroupPrimitive.Props & ToggleVariantProps) {
  return (
    <ToggleGroupPrimitive
      className={clsx(
        stylex.props(
          styles.root,
          orientation === "horizontal" ? styles.horizontal : styles.vertical,
          variant === "default" ? styles.default : styles.outline,
        ).className,
        className,
      )}
      data-size={size}
      data-slot="toggle-group"
      data-variant={variant}
      orientation={orientation}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ size, variant }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}

export function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: TogglePrimitive.Props & ToggleVariantProps) {
  const context = React.useContext(ToggleGroupContext)
  const resolvedVariant = context.variant || variant
  const resolvedSize = context.size || size
  return (
    <ToggleComponent
      className={className}
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
  className,
  orientation = "vertical",
  ...props
}: { className?: string } & React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      className={clsx(stylex.props(styles.separator).className, className)}
      orientation={orientation}
      {...props}
    />
  )
}
export { ToggleGroupPrimitive }
