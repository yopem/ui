"use client"

import type { StyleComponentProps, StyleProps } from "@registry/lib/style-props"

import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  positioner: { zIndex: 50 },
  popup: {
    backgroundClip: "padding-box",
    backgroundColor: tokens["--popover"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 10px 15px -3px color-mix(in oklab, #000 5%, transparent)",
    color: tokens["--popover-foreground"],
    display: "flex",
    fontSize: "0.875rem",
    inlineSize: "16rem",
    padding: "1rem",
    position: "relative",
    textWrap: "balance",
    transformOrigin: "var(--transform-origin)",
    transitionProperty: "scale, opacity",
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
    "[data-ending-style]": { opacity: 0, scale: 0.98 },
    "[data-starting-style]": { opacity: 0, scale: 0.98 },
  },
})

export const PreviewCard: typeof PreviewCardPrimitive.Root =
  PreviewCardPrimitive.Root

export function PreviewCardTrigger({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<PreviewCardPrimitive.Trigger.Props>) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <PreviewCardPrimitive.Trigger
      data-slot="preview-card-trigger"
      {...mergeStyleProps(stylexProps(className, xstyle), props)}
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
}: StyleComponentProps<
  PreviewCardPrimitive.Popup.Props,
  {
    align?: PreviewCardPrimitive.Positioner.Props["align"]
    sideOffset?: PreviewCardPrimitive.Positioner.Props["sideOffset"]
    anchor?: PreviewCardPrimitive.Positioner.Props["anchor"]
    portalProps?: PreviewCardPrimitive.Portal.Props
  }
>) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
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
          {...mergeStyleProps(
            stylexProps(className, styles.popup, xstyle),
            props,
          )}
        >
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
