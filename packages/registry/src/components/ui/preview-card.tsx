"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"

import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  positioner: { zIndex: 50, maxInlineSize: "var(--available-width)" },
  trigger: {
    color: tokens["--foreground"],
    textDecorationLine: { default: "none", ":hover": "underline" },
    textUnderlineOffset: "0.2em",
  },
  arrow: {
    backgroundColor: tokens["--popover"],
    blockSize: "0.625rem",
    inlineSize: "0.625rem",
    rotate: "45deg",
    borderColor: tokens["--card-border"],
    borderStyle: "solid",
    borderWidth: {
      default: "0",
      '[data-side="top"]': "0 1px 1px 0",
      '[data-side="bottom"]': "1px 0 0 1px",
      '[data-side="left"]': "1px 1px 0 0",
      '[data-side="right"]': "0 0 1px 1px",
    },
    top: { default: null, '[data-side="bottom"]': "-0.3125rem" },
    bottom: { default: null, '[data-side="top"]': "-0.3125rem" },
    left: { default: null, '[data-side="right"]': "-0.3125rem" },
    right: { default: null, '[data-side="left"]': "-0.3125rem" },
  },
  popup: {
    backgroundClip: "padding-box",
    backgroundColor: tokens["--popover"],
    borderColor: tokens["--card-border"],
    borderRadius: tokens["--radius"],
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: tokens["--shadow-md"],
    color: tokens["--popover-foreground"],
    display: "flex",
    fontSize: "0.875rem",
    inlineSize: "18rem",
    maxInlineSize: "var(--available-width)",
    padding: "1.5rem",
    position: "relative",
    textWrap: "balance",
    transformOrigin: "var(--transform-origin)",
    transitionProperty: "opacity",
    "[data-ending-style]": { opacity: 0 },
    "[data-starting-style]": { opacity: 0 },
  },
})

export const PreviewCard: typeof PreviewCardPrimitive.Root =
  PreviewCardPrimitive.Root

export function PreviewCardTrigger({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<PreviewCardPrimitive.Trigger.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <PreviewCardPrimitive.Trigger
      data-slot="preview-card-trigger"
      {...mergeStylexProps(
        stylexProps(className, styles.trigger, xstyle),
        props,
      )}
    />
  )
}

export function PreviewCardPopup({
  xstyle: consumerXstyle,
  className,
  children,
  align = "center",
  sideOffset = 4,
  anchor,
  portalProps,
  ...restProps
}: StyleXComponentProps<
  PreviewCardPrimitive.Popup.Props,
  {
    align?: PreviewCardPrimitive.Positioner.Props["align"]
    sideOffset?: PreviewCardPrimitive.Positioner.Props["sideOffset"]
    anchor?: PreviewCardPrimitive.Positioner.Props["anchor"]
    portalProps?: PreviewCardPrimitive.Portal.Props
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <PreviewCardPrimitive.Portal {...portalProps}>
      <PreviewCardPrimitive.Positioner
        align={align}
        anchor={anchor}
        {...stylex.props(styles.positioner)}
        data-slot="preview-card-positioner"
        sideOffset={sideOffset}
      >
        <PreviewCardPrimitive.Popup
          data-slot="preview-card-content"
          {...mergeStylexProps(
            stylexProps(className, styles.popup, xstyle),
            props,
          )}
        >
          <PreviewCardPrimitive.Arrow
            data-slot="preview-card-arrow"
            {...stylex.props(styles.arrow)}
          />
          {children}
        </PreviewCardPrimitive.Popup>
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  )
}

export {
  PreviewCardPrimitive,
  PreviewCard as HoverCard,
  PreviewCardTrigger as HoverCardTrigger,
  PreviewCardPopup as HoverCardContent,
}
