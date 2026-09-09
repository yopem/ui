"use client"

import type { StyleXProps } from "@registry/lib/stylex"

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { ChevronDownIcon } from "lucide-react"

const styles = stylex.create({
  item: {
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    ":last-child": { borderBlockEndWidth: 0 },
  },
  header: { display: "flex" },
  trigger: {
    alignItems: "flex-start",
    borderRadius: tokens["--radius-md"],
    cursor: "pointer",
    display: "flex",
    flex: 1,
    fontSize: "0.875rem",
    fontWeight: 500,
    gap: "1rem",
    justifyContent: "space-between",
    lineHeight: "1.25rem",
    outline: "none",
    paddingBlock: "1rem",
    textAlign: "start",
    transitionDuration: "150ms",
    transitionProperty: "all",
    ":disabled": { opacity: 0.64, pointerEvents: "none" },
    ":focus-visible": { boxShadow: `0 0 0 3px ${tokens["--ring"]}` },
  },
  indicator: {
    transform: {
      default: "translateY(0.125rem)",
      ':is([data-slot="accordion-trigger"][data-panel-open] [data-slot="accordion-indicator"])':
        "translateY(0.125rem) rotate(180deg)",
    },
    blockSize: "1rem",
    flexShrink: 0,
    opacity: 0.8,
    pointerEvents: "none",
    transitionDuration: "200ms",
    transitionProperty: "transform",
    transitionTimingFunction: "ease-in-out",
    inlineSize: "1rem",
  },
  panel: {
    blockSize: "var(--accordion-panel-height)",
    color: tokens["--muted-foreground"],
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    overflow: "hidden",
    transitionDuration: "200ms",
    transitionProperty: "height",
    transitionTimingFunction: "ease-in-out",
    "[data-ending-style]": { blockSize: 0 },
    "[data-starting-style]": { blockSize: 0 },
  },
  panelContent: { paddingBlockEnd: "1rem", paddingBlockStart: 0 },
})

export function Accordion(props: AccordionPrimitive.Root.Props) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

export function AccordionItem({
  xstyle,
  className,
  ...props
}: AccordionPrimitive.Item.Props & StyleXProps) {
  return (
    <AccordionPrimitive.Item
      {...stylexProps(className, styles.item, xstyle)}
      data-slot="accordion-item"
      {...props}
    />
  )
}

export function AccordionTrigger({
  xstyle,
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props & StyleXProps) {
  return (
    <AccordionPrimitive.Header {...stylex.props(styles.header)}>
      <AccordionPrimitive.Trigger
        {...stylexProps(className, styles.trigger, xstyle)}
        data-slot="accordion-trigger"
        {...props}
      >
        {children}
        <ChevronDownIcon
          {...stylex.props(styles.indicator)}
          data-slot="accordion-indicator"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

export function AccordionPanel({
  xstyle,
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props & StyleXProps) {
  return (
    <AccordionPrimitive.Panel
      {...stylexProps(
        typeof className === "function" ? className : undefined,
        styles.panel,
      )}
      data-slot="accordion-panel"
      {...props}
    >
      <div
        {...stylexProps(
          typeof className === "string" ? className : undefined,
          styles.panelContent,
          xstyle,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  )
}

export { AccordionPrimitive, AccordionPanel as AccordionContent }
