"use client"

import type { StyleComponentProps, StyleProps } from "@registry/lib/style-props"

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
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
}: StyleComponentProps<CollapsiblePrimitive.Root.Props>) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      {...mergeStyleProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function CollapsibleTrigger({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<CollapsiblePrimitive.Trigger.Props>) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      {...mergeStyleProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function CollapsiblePanel({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<CollapsiblePrimitive.Panel.Props>) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-panel"
      {...mergeStyleProps(stylexProps(className, styles.panel, xstyle), props)}
    />
  )
}

export { CollapsiblePrimitive, CollapsiblePanel as CollapsibleContent }
