"use client"

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"
import { stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  panel: {
    blockSize: "var(--collapsible-panel-height)",
    overflow: "hidden",
    transitionDuration: "200ms",
    transitionProperty: "height",
    "[data-ending-style]": { blockSize: 0 },
    "[data-starting-style]": { blockSize: 0 },
  },
})

export function Collapsible(props: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

export function CollapsibleTrigger({
  className,
  ...props
}: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger
      className={className}
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

export function CollapsiblePanel({
  className,
  ...props
}: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel
      {...stylexProps(className, styles.panel)}
      data-slot="collapsible-panel"
      {...props}
    />
  )
}

export { CollapsiblePrimitive, CollapsiblePanel as CollapsibleContent }
