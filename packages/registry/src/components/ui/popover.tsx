"use client"

import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  positioner: {
    blockSize: "var(--positioner-height)",
    inlineSize: "var(--positioner-width)",
    maxInlineSize: "var(--available-width)",
    transitionProperty: "top, left, right, bottom, transform",
    zIndex: 50,
    "[data-instant]": { transitionProperty: "none" },
  },
  popup: {
    backgroundClip: "padding-box",
    backgroundColor: tokens.popover,
    blockSize: "var(--popup-height, auto)",
    borderColor: tokens.border,
    borderRadius: tokens.radiusLarge,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 10px 15px -3px color-mix(in oklab, #000 5%, transparent)",
    color: tokens.popoverForeground,
    display: "flex",
    inlineSize: "var(--popup-width, auto)",
    outline: "none",
    position: "relative",
    transformOrigin: "var(--transform-origin)",
    transitionProperty: "width, height, scale, opacity",
    "::before": {
      borderRadius: "calc(var(--radius-lg, 0.625rem) - 1px)",
      boxShadow: {
        default: "0 1px rgb(0 0 0 / 0.04)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "0 -1px rgb(255 255 255 / 0.06)",
      },
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
    "[data-starting-style]": { opacity: 0, scale: 0.98 },
  },
  tooltipPopup: {
    borderRadius: tokens.radiusMedium,
    boxShadow: "0 4px 6px -1px color-mix(in oklab, #000 5%, transparent)",
    fontSize: "0.75rem",
    inlineSize: "fit-content",
    textWrap: "balance",
    "::before": { borderRadius: "calc(var(--radius-md, 0.5rem) - 1px)" },
  },
  viewport: {
    blockSize: "100%",
    maxBlockSize: "var(--available-height)",
    overflow: "clip",
    paddingBlock: "1rem",
    paddingInline: "var(--viewport-inline-padding)",
    position: "relative",
    inlineSize: "100%",
    "--viewport-inline-padding": "1rem",
    "[data-instant]": { transitionProperty: "none" },
  },
  scrollable: {
    "[data-transitioning]": { overflowY: "clip" },
    overflowY: "auto",
  },
  tooltipViewport: {
    paddingBlock: "0.25rem",
    "--viewport-inline-padding": "0.5rem",
  },
  title: { fontSize: "1.125rem", fontWeight: 600, lineHeight: 1 },
  description: { color: tokens.mutedForeground, fontSize: "0.875rem" },
})

export const PopoverCreateHandle: typeof PopoverPrimitive.createHandle =
  PopoverPrimitive.createHandle
export const Popover: typeof PopoverPrimitive.Root = PopoverPrimitive.Root

export function PopoverTrigger({
  className,
  children,
  ...props
}: PopoverPrimitive.Trigger.Props) {
  return (
    <PopoverPrimitive.Trigger
      className={className}
      data-slot="popover-trigger"
      {...props}
    >
      {children}
    </PopoverPrimitive.Trigger>
  )
}

export function PopoverPopup({
  children,
  className,
  side = "bottom",
  align = "center",
  sideOffset = 4,
  alignOffset = 0,
  tooltipStyle = false,
  anchor,
  portalProps,
  ...props
}: PopoverPrimitive.Popup.Props & {
  portalProps?: PopoverPrimitive.Portal.Props
  side?: PopoverPrimitive.Positioner.Props["side"]
  align?: PopoverPrimitive.Positioner.Props["align"]
  sideOffset?: PopoverPrimitive.Positioner.Props["sideOffset"]
  alignOffset?: PopoverPrimitive.Positioner.Props["alignOffset"]
  tooltipStyle?: boolean
  anchor?: PopoverPrimitive.Positioner.Props["anchor"]
}) {
  return (
    <PopoverPrimitive.Portal {...portalProps}>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        {...stylex.props(styles.positioner)}
        data-slot="popover-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <PopoverPrimitive.Popup
          {...stylexProps(
            className,
            styles.popup,
            tooltipStyle && styles.tooltipPopup,
          )}
          data-slot="popover-popup"
          {...props}
        >
          <PopoverPrimitive.Viewport
            {...stylex.props(
              styles.viewport,
              tooltipStyle ? styles.tooltipViewport : styles.scrollable,
            )}
            data-slot="popover-viewport"
          >
            {children}
          </PopoverPrimitive.Viewport>
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export function PopoverClose(props: PopoverPrimitive.Close.Props) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />
}
export function PopoverTitle({
  className,
  ...props
}: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      {...stylexProps(className, styles.title)}
      data-slot="popover-title"
      {...props}
    />
  )
}
export function PopoverDescription({
  className,
  ...props
}: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      {...stylexProps(className, styles.description)}
      data-slot="popover-description"
      {...props}
    />
  )
}

export { PopoverPrimitive, PopoverPopup as PopoverContent }
