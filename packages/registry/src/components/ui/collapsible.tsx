"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
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

export function Collapsible({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<CollapsiblePrimitive.Root.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function CollapsibleTrigger({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<CollapsiblePrimitive.Trigger.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function CollapsiblePanel({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<CollapsiblePrimitive.Panel.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-panel"
      {...mergeStylexProps(stylexProps(className, styles.panel, xstyle), props)}
    />
  )
}

export { CollapsiblePrimitive, CollapsiblePanel as CollapsibleContent }
