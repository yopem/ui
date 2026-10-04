"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps, ReactElement } from "react"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { mergeProps } from "@base-ui/react/merge-props"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { useRender } from "@base-ui/react/use-render"
import { Button } from "@registry/components/ui/button"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { ChevronRightIcon, XIcon } from "lucide-react"
import { createContext, useContext } from "react"

type DrawerPosition = "right" | "left" | "top" | "bottom"

type DrawerVariant = "default" | "straight" | "inset"

const DrawerContext = createContext<DrawerPosition>("bottom")

const directionMap: Record<
  DrawerPosition,
  DrawerPrimitive.Root.Props["swipeDirection"]
> = {
  bottom: "down",
  left: "left",
  right: "right",
  top: "up",
}

export const drawerSlotStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
  },
  itemIcon: { marginInline: "-0.125rem", opacity: 0.8 },
})

const styles = stylex.create({
  closeIcon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
  swipeArea: { position: "fixed", touchAction: "none", zIndex: 50 },
  swipeBottom: { blockSize: "2rem", bottom: 0, insetInline: 0 },
  swipeTop: { blockSize: "2rem", insetBlockStart: 0, insetInline: 0 },
  swipeLeft: { inlineSize: "2rem", insetBlock: 0, insetInlineStart: 0 },
  swipeRight: { inlineSize: "2rem", insetBlock: 0, insetInlineEnd: 0 },
  backdrop: {
    backdropFilter: "blur(4px)",
    backgroundColor: "rgb(0 0 0 / 0.32)",
    inset: 0,
    opacity: "calc(1 - var(--drawer-swipe-progress))",
    position: "fixed",
    transitionDuration: "450ms",
    transitionProperty: "opacity",
    transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    zIndex: 50,
    "[data-ending-style]": {
      opacity: 0,
      transitionDuration: "calc(var(--drawer-swipe-strength) * 400ms)",
    },
    "[data-starting-style]": { opacity: 0 },
    "[data-swiping]": { transitionDuration: "0ms" },
    "@supports (-webkit-touch-callout: none)": { position: "absolute" },
  },
  viewport: {
    inset: 0,
    position: "fixed",
    touchAction: "none",
    zIndex: 50,
    "--bleed": "3rem",
    "--inset": "0px",
  },
  viewportBottom: {
    display: "grid",
    gridTemplateRows: "1fr auto",
    paddingBlockStart: "3rem",
  },
  viewportTop: {
    display: "grid",
    gridTemplateRows: "auto 1fr",
    paddingBlockEnd: "3rem",
  },
  viewportLeft: { display: "flex", justifyContent: "flex-start" },
  viewportRight: { display: "flex", justifyContent: "flex-end" },
  viewportInset: {
    paddingInline: "var(--inset)",
    "--inset": { default: "0px", "@media (min-width: 640px)": "1rem" },
  },
  viewportInsetNotBottom: { paddingBlockStart: "var(--inset)" },
  viewportInsetNotTop: { paddingBlockEnd: "var(--inset)" },
  popup: {
    backgroundClip: "padding-box",
    backgroundColor: tokens["--popover"],
    color: tokens["--popover-foreground"],
    display: "flex",
    flexDirection: "column",
    inlineSize: "100%",
    maxBlockSize: "100%",
    minBlockSize: 0,
    minInlineSize: 0,
    outline: "none",
    position: "relative",
    touchAction: "none",
    transitionDuration: "450ms",
    transitionProperty: "transform, box-shadow, height, background-color",
    transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    willChange: "transform",
    "--peek": "calc(1.5rem - 1px)",
    "--scale-base":
      "calc(max(0, 1 - (var(--nested-drawers) * var(--stack-step))))",
    "--scale":
      "clamp(0, calc(var(--scale-base) + (var(--stack-step) * var(--stack-progress))), 1)",
    "--shrink": "calc(1 - var(--scale))",
    "--stack-peek-offset":
      "max(0px, calc((var(--nested-drawers) - var(--stack-progress)) * var(--peek)))",
    "--stack-progress": "clamp(0, var(--drawer-swipe-progress), 1)",
    "--stack-step": "0.05",
    "::before": {
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
    "::after": {
      backgroundColor: tokens["--popover"],
      content: '""',
      pointerEvents: "none",
      position: "absolute",
    },
    "[data-ending-style]": {
      boxShadow: "none",
      transitionDuration: "calc(var(--drawer-swipe-strength) * 400ms)",
    },
    "[data-nested-drawer-open]": { overflow: "hidden" },
    "[data-starting-style]": { boxShadow: "none" },
    "[data-swiping]": { userSelect: "none" },
  },
  popupBottom: {
    borderBlockStartColor: tokens["--border"],
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    gridRowStart: 2,
    marginBlockEnd:
      "calc(max(0px, calc(var(--drawer-snap-point-offset, 0px) + clamp(0, 1, var(--drawer-snap-point-offset, 0px) / 1px) * var(--drawer-swipe-movement-y, 0px))) * -1)",
    paddingBlockEnd:
      "max(0px, calc(env(safe-area-inset-bottom, 0px) + var(--drawer-snap-point-offset, 0px) + clamp(0, 1, var(--drawer-snap-point-offset, 0px) / 1px) * var(--drawer-swipe-movement-y, 0px)))",
    transform:
      "translateY(calc(var(--drawer-snap-point-offset) + var(--drawer-swipe-movement-y)))",
    transformOrigin: "50% calc(100% - var(--inset))",
    "::after": {
      blockSize: "var(--bleed)",
      insetBlockStart: "100%",
      insetInline: 0,
    },
    "[data-ending-style]": {
      marginBlockEnd: 0,
      paddingBlockEnd: 0,
      transform:
        "translateY(calc(100% + env(safe-area-inset-bottom, 0px) + var(--inset)))",
    },
    "[data-starting-style]": {
      marginBlockEnd: 0,
      paddingBlockEnd: 0,
      transform:
        "translateY(calc(100% + env(safe-area-inset-bottom, 0px) + var(--inset)))",
    },
    "[data-nested-drawer-open]": {
      transform:
        "translateY(calc(var(--drawer-swipe-movement-y) - var(--stack-peek-offset) - (var(--shrink) * var(--height)))) scale(var(--scale))",
    },
  },
  popupTop: {
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    transform: "translateY(var(--drawer-swipe-movement-y))",
    transformOrigin: "50% var(--inset)",
    "::after": {
      blockSize: "var(--bleed)",
      insetBlockEnd: "100%",
      insetInline: 0,
    },
    "[data-ending-style]": {
      transform: "translateY(calc(-100% - var(--inset)))",
    },
    "[data-starting-style]": {
      transform: "translateY(calc(-100% - var(--inset)))",
    },
    "[data-nested-drawer-open]": {
      transform:
        "translateY(calc(var(--drawer-swipe-movement-y) + var(--stack-peek-offset) + (var(--shrink) * var(--height)))) scale(var(--scale))",
    },
  },
  popupLeft: {
    borderInlineEndColor: tokens["--border"],
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: 1,
    inlineSize: "calc(100% - 3rem)",
    maxInlineSize: "28rem",
    transform: "translateX(var(--drawer-swipe-movement-x))",
    transformOrigin: "right",
    "::after": {
      inlineSize: "var(--bleed)",
      insetBlock: 0,
      insetInlineEnd: "100%",
    },
    "[data-ending-style]": {
      transform: "translateX(calc(-100% - var(--inset)))",
    },
    "[data-starting-style]": {
      transform: "translateX(calc(-100% - var(--inset)))",
    },
    "[data-nested-drawer-open]": {
      transform:
        "translateX(calc(var(--drawer-swipe-movement-x) + var(--stack-peek-offset))) scale(var(--scale))",
    },
  },
  popupRight: {
    borderInlineStartColor: tokens["--border"],
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: 1,
    gridColumnStart: 2,
    inlineSize: "calc(100% - 3rem)",
    maxInlineSize: "28rem",
    transform: "translateX(var(--drawer-swipe-movement-x))",
    transformOrigin: "left",
    "::after": {
      inlineSize: "var(--bleed)",
      insetBlock: 0,
      insetInlineStart: "100%",
    },
    "[data-ending-style]": {
      transform: "translateX(calc(100% + var(--inset)))",
    },
    "[data-starting-style]": {
      transform: "translateX(calc(100% + var(--inset)))",
    },
    "[data-nested-drawer-open]": {
      transform:
        "translateX(calc(var(--drawer-swipe-movement-x) - var(--stack-peek-offset))) scale(var(--scale))",
    },
  },
  verticalPopup: {
    blockSize: "var(--drawer-height, auto)",
    "--height":
      "max(0px, var(--drawer-frontmost-height, var(--drawer-height)))",
    "[data-nested-drawer-open]": { blockSize: "var(--height)" },
  },
  roundedBottom: {
    borderStartEndRadius: "0.875rem",
    borderStartStartRadius: "0.875rem",
    "::before": {
      borderStartEndRadius: "calc(0.875rem - 1px)",
      borderStartStartRadius: "calc(0.875rem - 1px)",
    },
  },
  roundedTop: {
    borderEndEndRadius: "0.875rem",
    borderEndStartRadius: "0.875rem",
    "::before": {
      borderEndEndRadius: "calc(0.875rem - 1px)",
      borderEndStartRadius: "calc(0.875rem - 1px)",
    },
  },
  roundedLeft: {
    borderEndEndRadius: "0.875rem",
    borderStartEndRadius: "0.875rem",
    "::before": {
      borderEndEndRadius: "calc(0.875rem - 1px)",
      borderStartEndRadius: "calc(0.875rem - 1px)",
    },
  },
  roundedRight: {
    borderEndStartRadius: "0.875rem",
    borderStartStartRadius: "0.875rem",
    "::before": {
      borderEndStartRadius: "calc(0.875rem - 1px)",
      borderStartStartRadius: "calc(0.875rem - 1px)",
    },
  },
  insetPopup: {
    "::before": { display: "none" },
    "@media (min-width: 640px)": {
      borderColor: tokens["--border"],
      borderRadius: "0.875rem",
      borderStyle: "solid",
      borderWidth: 1,
      "::before": { borderRadius: "calc(0.875rem - 1px)", display: "block" },
      "::after": { backgroundColor: "transparent" },
    },
  },
  straightPopup: { "--stack-step": "0" },
  close: {
    insetBlockStart: "0.5rem",
    insetInlineEnd: "0.5rem",
    position: "absolute",
  },
  header: {
    paddingBlockEnd: {
      default: null,
      ':is(:is([data-slot="dialog-popup"], [data-slot="sheet-popup"], [data-slot="drawer-popup"]):has([data-slot$="panel"]) > [data-slot="drawer-header"])':
        "0.75rem",
      "@media (max-width: 639px)": "1rem",
    },
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "1.5rem",
  },
  footer: {
    display: "flex",
    flexDirection: {
      default: "column-reverse",
      "@media (min-width: 640px)": "row",
    },
    gap: "0.5rem",
    paddingBlockEnd: "var(--safe-area-inset-bottom, 0px)",
    paddingInline: "1.5rem",
    borderEndEndRadius: {
      default: null,
      "@media (min-width: 640px)": {
        default: null,
        ':is([data-slot="drawer-popup"][data-variant="inset"] [data-slot="drawer-footer"])':
          "calc(0.875rem - 1px)",
      },
    },
    borderEndStartRadius: {
      default: null,
      "@media (min-width: 640px)": {
        default: null,
        ':is([data-slot="drawer-popup"][data-variant="inset"] [data-slot="drawer-footer"])':
          "calc(0.875rem - 1px)",
      },
    },
    justifyContent: {
      default: null,
      "@media (min-width: 640px)": "flex-end",
    },
  },
  footerDefault: {
    backgroundColor:
      "color-mix(in oklab, var(--muted, transparent) 72%, transparent)",
    borderBlockStartColor: tokens["--border"],
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    paddingBlockEnd: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
    paddingBlockStart: "1rem",
  },
  footerBare: {
    paddingBlockStart: {
      default: "1rem",
      ':is(:is([data-slot="dialog-popup"], [data-slot="sheet-popup"], [data-slot="drawer-popup"]):has([data-slot$="panel"]) > [data-slot="drawer-footer"])':
        "0.75rem",
    },
    paddingBlockEnd: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)",
  },
  noSelection: { cursor: "default" },
  title: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.25rem",
    fontWeight: 600,
    lineHeight: 1,
  },
  description: { color: tokens["--muted-foreground"], fontSize: "0.875rem" },
  panel: {
    paddingBlockStart: {
      default: null,
      ':is(:is([data-slot="dialog-popup"], [data-slot="sheet-popup"], [data-slot="drawer-popup"]):has([data-slot$="header"]) [data-slot="drawer-panel"])':
        "0.25rem",
    },
    paddingBlockEnd: {
      default: null,
      ':is(:is([data-slot="dialog-popup"], [data-slot="sheet-popup"], [data-slot="drawer-popup"]):has([data-slot$="footer"][data-variant="bare"]) [data-slot="drawer-panel"])':
        "0.25rem",
    },
    padding: "1.5rem",
  },
  touchAuto: { touchAction: "auto" },
  bar: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    padding: "0.75rem",
    position: "absolute",
    touchAction: "none",
    "::before": {
      backgroundColor: tokens["--input"],
      borderRadius: "9999px",
      content: '""',
    },
  },
  barHorizontal: {
    insetBlock: 0,
    "::before": { blockSize: "3rem", inlineSize: "0.25rem" },
  },
  barVertical: {
    insetInline: 0,
    "::before": { blockSize: "0.25rem", inlineSize: "3rem" },
  },
  barTop: { bottom: 0 },
  barBottom: { top: 0 },
  barLeft: { right: 0 },
  barRight: { left: 0 },
  menu: { display: "flex", flexDirection: "column", margin: "-0.5rem" },
  menuItem: {
    alignItems: "center",
    borderRadius: tokens["--radius-sm"],
    color: tokens["--foreground"],
    cursor: "default",
    display: "flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    gap: "0.5rem",
    inlineSize: "100%",
    minBlockSize: { default: "2.25rem", "@media (min-width: 640px)": "2rem" },
    outline: "none",
    paddingBlock: "0.25rem",
    paddingInline: "0.5rem",
    userSelect: "none",
    ":hover": {
      backgroundColor: tokens["--accent"],
      color: tokens["--accent-foreground"],
    },
    ":disabled": { opacity: 0.64, pointerEvents: "none" },
    "[data-variant=destructive]": { color: tokens["--destructive-foreground"] },
  },
  menuSeparator: {
    backgroundColor: tokens["--border"],
    blockSize: 1,
    marginBlock: "0.25rem",
    marginInline: "0.5rem",
  },
  menuGroup: { display: "flex", flexDirection: "column" },
  menuGroupLabel: {
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    fontWeight: 500,
    paddingBlock: "0.375rem",
    paddingInline: "0.5rem",
  },
  menuTriggerIcon: {
    marginInlineEnd: "-0.125rem",
    marginInlineStart: "auto",
    opacity: 0.8,
  },
  choiceItem: {
    alignItems: "center",
    borderRadius: tokens["--radius-sm"],
    color: tokens["--foreground"],
    cursor: "default",
    display: "grid",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    gap: "0.5rem",
    inlineSize: "100%",
    minBlockSize: { default: "2.25rem", "@media (min-width: 640px)": "2rem" },
    outline: "none",
    paddingBlock: "0.25rem",
    paddingInlineStart: "0.5rem",
    userSelect: "none",
    ":hover": {
      backgroundColor: tokens["--accent"],
      color: tokens["--accent-foreground"],
    },
    "[data-disabled]": { opacity: 0.64, pointerEvents: "none" },
  },
  choiceDefault: { gridTemplateColumns: "1rem 1fr", paddingInlineEnd: "1rem" },
  choiceSwitch: {
    columnGap: "1rem",
    gridTemplateColumns: "1fr auto",
    paddingInlineEnd: "0.375rem",
  },
  choiceFirst: { gridColumnStart: 1 },
  choiceSecond: { gridColumnStart: 2 },
  switch: {
    alignItems: "center",
    backgroundColor: tokens["--input"],
    blockSize: "calc(var(--thumb-size) + 2px)",
    borderRadius: "9999px",
    display: "inline-flex",
    flexShrink: 0,
    gridColumnStart: 2,
    inlineSize: "calc(var(--thumb-size) * 2 - 2px)",
    padding: 1,
    "--thumb-size": { default: "1rem", "@media (min-width: 640px)": "0.75rem" },
    "[data-checked]": { backgroundColor: tokens["--primary"] },
  },
  switchThumb: {
    scale: {
      default: null,
      ':is([data-slot="drawer-menu-checkbox-item"]:active [data-slot="drawer-menu-switch-thumb"])':
        "1.1 1",
    },
    transformOrigin: {
      default: "left",
      ':is([data-slot="drawer-menu-checkbox-item"][data-checked] [data-slot="drawer-menu-switch-thumb"])':
        "var(--thumb-size) 50%",
    },
    translate: {
      default: null,
      ':is([data-slot="drawer-menu-checkbox-item"][data-checked] [data-slot="drawer-menu-switch-thumb"])':
        "calc(var(--thumb-size) - 4px) 0",
    },
    aspectRatio: "1",
    backgroundColor: tokens["--background"],
    blockSize: "100%",
    borderRadius: "var(--thumb-size)",
    display: "block",
    pointerEvents: "none",
    transition:
      "translate .15s, border-radius .15s, scale .1s .1s, transform-origin .15s",
    willChange: "transform",
  },
})

const swipeStyles = {
  bottom: styles.swipeBottom,
  left: styles.swipeLeft,
  right: styles.swipeRight,
  top: styles.swipeTop,
} as const

const viewportStyles = {
  bottom: styles.viewportBottom,
  left: styles.viewportLeft,
  right: styles.viewportRight,
  top: styles.viewportTop,
} as const

const popupStyles = {
  bottom: styles.popupBottom,
  left: styles.popupLeft,
  right: styles.popupRight,
  top: styles.popupTop,
} as const

const roundedStyles = {
  bottom: styles.roundedBottom,
  left: styles.roundedLeft,
  right: styles.roundedRight,
  top: styles.roundedTop,
} as const

const barPositionStyles = {
  bottom: styles.barBottom,
  left: styles.barLeft,
  right: styles.barRight,
  top: styles.barTop,
} as const

export const DrawerCreateHandle: typeof DrawerPrimitive.createHandle =
  DrawerPrimitive.createHandle

export function Drawer({
  swipeDirection,
  position = "bottom",
  ...props
}: DrawerPrimitive.Root.Props & { position?: DrawerPosition }) {
  return (
    <DrawerContext.Provider value={position}>
      <DrawerPrimitive.Root
        swipeDirection={swipeDirection ?? directionMap[position]}
        {...props}
      />
    </DrawerContext.Provider>
  )
}

export const DrawerPortal: typeof DrawerPrimitive.Portal =
  DrawerPrimitive.Portal

export function DrawerTrigger({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<DrawerPrimitive.Trigger.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <DrawerPrimitive.Trigger
      data-slot="drawer-trigger"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function DrawerClose({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<DrawerPrimitive.Close.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <DrawerPrimitive.Close
      data-slot="drawer-close"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function DrawerSwipeArea({
  xstyle: consumerXstyle,
  className,
  position: positionProp,
  ...restProps
}: StyleXComponentProps<
  DrawerPrimitive.SwipeArea.Props,
  {
    position?: DrawerPosition
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  const contextPosition = useContext(DrawerContext)
  const position = positionProp ?? contextPosition

  return (
    <DrawerPrimitive.SwipeArea
      data-slot="drawer-swipe-area"
      {...mergeStylexProps(
        stylexProps(className, styles.swipeArea, swipeStyles[position], xstyle),
        props,
      )}
    />
  )
}

export function DrawerBackdrop({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<DrawerPrimitive.Backdrop.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-backdrop"
      {...mergeStylexProps(
        stylexProps(className, styles.backdrop, xstyle),
        props,
      )}
    />
  )
}

export function DrawerViewport({
  xstyle: consumerXstyle,
  className,
  position = "bottom",
  variant = "default",
  ...restProps
}: StyleXComponentProps<
  DrawerPrimitive.Viewport.Props,
  {
    position?: DrawerPosition
    variant?: DrawerVariant
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <DrawerPrimitive.Viewport
      data-slot="drawer-viewport"
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.viewport,
          viewportStyles[position],
          variant === "inset" && styles.viewportInset,
          variant === "inset" &&
            position !== "bottom" &&
            styles.viewportInsetNotBottom,
          variant === "inset" &&
            position !== "top" &&
            styles.viewportInsetNotTop,
          xstyle,
        ),
        props,
      )}
    />
  )
}

export function DrawerPopup({
  xstyle: consumerXstyle,
  className,
  children,
  showCloseButton = false,
  position: positionProp,
  variant = "default",
  showBar = false,
  portalProps,
  ...restProps
}: StyleXComponentProps<
  DrawerPrimitive.Popup.Props,
  {
    showCloseButton?: boolean
    position?: DrawerPosition
    variant?: DrawerVariant
    showBar?: boolean
    portalProps?: DrawerPrimitive.Portal.Props
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  const contextPosition = useContext(DrawerContext)
  const position = positionProp ?? contextPosition

  return (
    <DrawerPortal {...portalProps}>
      <DrawerBackdrop />
      <DrawerViewport position={position} variant={variant}>
        <DrawerPrimitive.Popup
          data-position={position}
          data-slot="drawer-popup"
          data-variant={variant}
          {...mergeStylexProps(
            stylexProps(
              className,
              styles.popup,
              popupStyles[position],
              (position === "bottom" || position === "top") &&
                styles.verticalPopup,
              variant !== "straight" && roundedStyles[position],
              variant === "inset" && styles.insetPopup,
              variant === "straight" && styles.straightPopup,
              xstyle,
            ),
            props,
          )}
        >
          {children}
          {showCloseButton ? (
            <DrawerPrimitive.Close
              aria-label="Close"
              className={stylex.props(styles.close).className}
              render={<Button size="icon" variant="ghost" />}
            >
              <XIcon {...stylex.props(styles.closeIcon)} />
            </DrawerPrimitive.Close>
          ) : null}
          {showBar ? <DrawerBar /> : null}
        </DrawerPrimitive.Popup>
      </DrawerViewport>
    </DrawerPortal>
  )
}

export function DrawerHeader({
  xstyle: consumerXstyle,
  className,
  allowSelection = false,
  render,
  ...restProps
}: StyleXComponentProps<
  useRender.ComponentProps<"div">,
  {
    allowSelection?: boolean
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(
      className,
      styles.header,
      !allowSelection && styles.noSelection,
      xstyle,
    ),
    "data-slot": "drawer-header",
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render: allowSelection ? <DrawerContent render={render} /> : render,
  })
}

export function DrawerFooter({
  xstyle: consumerXstyle,
  className,
  variant = "default",
  allowSelection = true,
  render,
  ...restProps
}: StyleXComponentProps<
  useRender.ComponentProps<"div">,
  {
    variant?: "default" | "bare"
    allowSelection?: boolean
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(
      className,
      styles.footer,
      !allowSelection && styles.noSelection,
      variant === "default" ? styles.footerDefault : styles.footerBare,
      xstyle,
    ),
    "data-slot": "drawer-footer",
    "data-variant": variant,
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render: allowSelection ? <DrawerContent render={render} /> : render,
  })
}

export function DrawerTitle({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<DrawerPrimitive.Title.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      {...mergeStylexProps(stylexProps(className, styles.title, xstyle), props)}
    />
  )
}

export function DrawerDescription({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<DrawerPrimitive.Description.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      {...mergeStylexProps(
        stylexProps(className, styles.description, xstyle),
        props,
      )}
    />
  )
}

export function DrawerPanel({
  xstyle: consumerXstyle,
  className,
  scrollFade = true,
  scrollable = true,
  allowSelection = true,
  render,
  ...restProps
}: StyleXComponentProps<
  useRender.ComponentProps<"div">,
  {
    scrollFade?: boolean
    scrollable?: boolean
    allowSelection?: boolean
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(
      className,
      styles.panel,
      !allowSelection && styles.noSelection,
      xstyle,
    ),
    "data-slot": "drawer-panel",
  }

  const content = useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render: allowSelection ? <DrawerContent render={render} /> : render,
  })

  return scrollable ? (
    <ScrollArea
      className={stylex.props(styles.touchAuto).className}
      overscrollContain
      scrollFade={scrollFade}
    >
      {content}
    </ScrollArea>
  ) : (
    content
  )
}

export function DrawerBar({
  xstyle: consumerXstyle,
  className,
  position: positionProp,
  render,
  ...restProps
}: StyleXComponentProps<
  useRender.ComponentProps<"div">,
  {
    position?: DrawerPosition
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  const contextPosition = useContext(DrawerContext)
  const position = positionProp ?? contextPosition
  const horizontal = position === "left" || position === "right"

  const defaultProps = {
    "aria-hidden": true as const,
    ...stylexProps(
      className,
      styles.bar,
      horizontal ? styles.barHorizontal : styles.barVertical,
      barPositionStyles[position],
      xstyle,
    ),
    "data-slot": "drawer-bar",
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function DrawerContent({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<typeof DrawerPrimitive.Content>>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <DrawerPrimitive.Content
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function DrawerMenu({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleXComponentProps<useRender.ComponentProps<"nav">>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.menu, xstyle),
    "data-slot": "drawer-menu",
  }

  return useRender({
    defaultTagName: "nav",
    props: mergeProps<"nav">(defaultProps, props),
    render,
  })
}

export function DrawerMenuItem({
  xstyle: consumerXstyle,
  className,
  variant = "default",
  render,
  disabled,
  ...restProps
}: StyleXComponentProps<
  useRender.ComponentProps<"button">,
  {
    variant?: "default" | "destructive"
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.menuItem, xstyle),
    "data-slot": "drawer-menu-item",
    "data-variant": variant,
    disabled,
    type: "button" as const,
  }

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  })
}

export function DrawerMenuSeparator({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleXComponentProps<useRender.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.menuSeparator, xstyle),
    "data-slot": "drawer-menu-separator",
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function DrawerMenuGroup({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleXComponentProps<useRender.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.menuGroup, xstyle),
    "data-slot": "drawer-menu-group",
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function DrawerMenuGroupLabel({
  xstyle: consumerXstyle,
  className,
  render,
  ...restProps
}: StyleXComponentProps<useRender.ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    ...stylexProps(className, styles.menuGroupLabel, xstyle),
    "data-slot": "drawer-menu-group-label",
  }

  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function DrawerMenuTrigger({
  xstyle: consumerXstyle,
  className,
  children,
  ...restProps
}: StyleXComponentProps<DrawerPrimitive.Trigger.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <DrawerTrigger
      data-slot="drawer-menu-trigger"
      {...mergeStylexProps(
        stylexProps(className, styles.menuItem, xstyle),
        props,
      )}
    >
      {children}
      <ChevronRightIcon
        {...stylex.props(drawerSlotStyles.icon, styles.menuTriggerIcon)}
      />
    </DrawerTrigger>
  )
}

export function DrawerMenuCheckboxItem({
  xstyle: consumerXstyle,
  className,
  children,
  checked,
  defaultChecked,
  onCheckedChange,
  variant = "default",
  disabled,
  render,
  ...restProps
}: StyleXComponentProps<
  CheckboxPrimitive.Root.Props,
  {
    variant?: "default" | "switch"
    render?: ReactElement
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <CheckboxPrimitive.Root
      checked={checked}

      data-slot="drawer-menu-checkbox-item"
      data-variant={variant}
      defaultChecked={defaultChecked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      render={render}
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.choiceItem,
          variant === "switch" ? styles.choiceSwitch : styles.choiceDefault,
          xstyle,
        ),
        props,
      )}
    >
      {variant === "switch" ? (
        <>
          <span {...stylex.props(styles.choiceFirst)}>{children}</span>
          <CheckboxPrimitive.Indicator
            {...stylex.props(styles.switch)}
            keepMounted
          >
            <span
              {...stylex.props(styles.switchThumb)}
              data-slot="drawer-menu-switch-thumb"
            />
          </CheckboxPrimitive.Indicator>
        </>
      ) : (
        <>
          <CheckboxPrimitive.Indicator {...stylex.props(styles.choiceFirst)}>
            <svg
              {...stylex.props(drawerSlotStyles.icon)}
              fill="none"
              height="24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
            </svg>
          </CheckboxPrimitive.Indicator>
          <span {...stylex.props(styles.choiceSecond)}>{children}</span>
        </>
      )}
    </CheckboxPrimitive.Root>
  )
}

export function DrawerMenuRadioGroup({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<RadioGroupPrimitive.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <RadioGroupPrimitive
      data-slot="drawer-menu-radio-group"
      {...mergeStylexProps(
        stylexProps(className, styles.menuGroup, xstyle),
        props,
      )}
    />
  )
}

export function DrawerMenuRadioItem({
  xstyle: consumerXstyle,
  className,
  children,
  value,
  disabled,
  render,
  ...restProps
}: StyleXComponentProps<
  RadioPrimitive.Root.Props,
  {
    value: string
    render?: ReactElement
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <RadioPrimitive.Root
      data-slot="drawer-menu-radio-item"
      disabled={disabled}
      render={render}
      value={value}
      {...mergeStylexProps(
        stylexProps(className, styles.choiceItem, styles.choiceDefault, xstyle),
        props,
      )}
    >
      <RadioPrimitive.Indicator {...stylex.props(styles.choiceFirst)}>
        <svg
          {...stylex.props(drawerSlotStyles.icon)}
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5.252 12.7 10.2 18.63 18.748 5.37" />
        </svg>
      </RadioPrimitive.Indicator>
      <span {...stylex.props(styles.choiceSecond)}>{children}</span>
    </RadioPrimitive.Root>
  )
}

export { DrawerPrimitive }
