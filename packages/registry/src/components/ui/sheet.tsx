"use client"

import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { Button } from "@registry/components/ui/button"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { XIcon } from "lucide-react"

type SheetSide = "right" | "left" | "top" | "bottom"
type SheetVariant = "default" | "inset"

const styles = stylex.create({
  backdrop: {
    backdropFilter: "blur(4px)",
    backgroundColor: "rgb(0 0 0 / 0.32)",
    inset: 0,
    position: "fixed",
    transitionDuration: "200ms",
    transitionProperty: "all",
    zIndex: 50,
    "[data-ending-style]": { opacity: 0 },
    "[data-starting-style]": { opacity: 0 },
  },
  viewport: { display: "grid", inset: 0, position: "fixed", zIndex: 50 },
  viewportBottom: { gridTemplateRows: "1fr auto", paddingBlockStart: "3rem" },
  viewportTop: { gridTemplateRows: "auto 1fr", paddingBlockEnd: "3rem" },
  viewportLeft: { display: "flex", justifyContent: "flex-start" },
  viewportRight: { display: "flex", justifyContent: "flex-end" },
  viewportInset: { "@media (min-width: 640px)": { padding: "1rem" } },
  popup: {
    backgroundClip: "padding-box",
    backgroundColor: tokens.popover,
    color: tokens.popoverForeground,
    display: "flex",
    flexDirection: "column",
    inlineSize: "100%",
    maxBlockSize: "100%",
    minBlockSize: 0,
    minInlineSize: 0,
    position: "relative",
    transitionDuration: "200ms",
    transitionProperty: "opacity, translate",
    transitionTimingFunction: "ease-in-out",
    willChange: "transform",
    boxShadow: "0 10px 15px -3px color-mix(in oklab, #000 5%, transparent)",
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
      "@media (max-width: 639px)": { display: "none" },
    },
    "[data-ending-style]": { opacity: 0 },
    "[data-starting-style]": { opacity: 0 },
  },
  popupBottom: {
    borderBlockStartColor: tokens.border,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    gridRowStart: 2,
    "[data-ending-style]": { translate: "0 2rem" },
    "[data-starting-style]": { translate: "0 2rem" },
  },
  popupTop: {
    borderBlockEndColor: tokens.border,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    "[data-ending-style]": { translate: "0 -2rem" },
    "[data-starting-style]": { translate: "0 -2rem" },
  },
  popupLeft: {
    borderInlineEndColor: tokens.border,
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: 1,
    inlineSize: "calc(100% - 3rem)",
    maxInlineSize: "28rem",
    "[data-ending-style]": { translate: "-2rem 0" },
    "[data-starting-style]": { translate: "-2rem 0" },
  },
  popupRight: {
    borderInlineStartColor: tokens.border,
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: 1,
    gridColumnStart: 2,
    inlineSize: "calc(100% - 3rem)",
    maxInlineSize: "28rem",
    "[data-ending-style]": { translate: "2rem 0" },
    "[data-starting-style]": { translate: "2rem 0" },
  },
  popupInset: {
    "::before": { display: "none" },
    "@media (min-width: 640px)": {
      borderColor: tokens.border,
      borderRadius: "0.875rem",
      borderStyle: "solid",
      borderWidth: 1,
    },
  },
  close: {
    insetBlockStart: "0.5rem",
    insetInlineEnd: "0.5rem",
    position: "absolute",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "1.5rem",
    "@media (max-width: 639px)": { paddingBlockEnd: "1rem" },
  },
  footer: {
    display: "flex",
    flexDirection: "column-reverse",
    gap: "0.5rem",
    paddingInline: "1.5rem",
    "@media (min-width: 640px)": {
      flexDirection: "row",
      justifyContent: "flex-end",
    },
  },
  footerDefault: {
    backgroundColor:
      "color-mix(in oklab, var(--muted, transparent) 72%, transparent)",
    borderBlockStartColor: tokens.border,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    paddingBlock: "1rem",
  },
  footerBare: { paddingBlockEnd: "1.5rem", paddingBlockStart: "1rem" },
  title: {
    fontFamily: tokens.fontHeading,
    fontSize: "1.25rem",
    fontWeight: 600,
    lineHeight: 1,
  },
  description: { color: tokens.mutedForeground, fontSize: "0.875rem" },
  panel: { padding: "1.5rem" },
})

const viewportSideStyles = {
  bottom: styles.viewportBottom,
  left: styles.viewportLeft,
  right: styles.viewportRight,
  top: styles.viewportTop,
} as const
const popupSideStyles = {
  bottom: styles.popupBottom,
  left: styles.popupLeft,
  right: styles.popupRight,
  top: styles.popupTop,
} as const

export const Sheet: typeof SheetPrimitive.Root = SheetPrimitive.Root
export const SheetPortal: typeof SheetPrimitive.Portal = SheetPrimitive.Portal
export function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}
export function SheetClose(props: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}
export function SheetBackdrop({
  className,
  ...props
}: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      {...stylexProps(className, styles.backdrop)}
      data-slot="sheet-backdrop"
      {...props}
    />
  )
}

export function SheetViewport({
  className,
  side = "right",
  variant = "default",
  ...props
}: SheetPrimitive.Viewport.Props & {
  side?: SheetSide
  variant?: SheetVariant
}) {
  return (
    <SheetPrimitive.Viewport
      {...stylexProps(
        className,
        styles.viewport,
        viewportSideStyles[side],
        variant === "inset" && styles.viewportInset,
      )}
      data-slot="sheet-viewport"
      {...props}
    />
  )
}

export function SheetPopup({
  className,
  children,
  showCloseButton = true,
  side = "right",
  variant = "default",
  closeProps,
  portalProps,
  ...props
}: SheetPrimitive.Popup.Props & {
  showCloseButton?: boolean
  side?: SheetSide
  variant?: SheetVariant
  closeProps?: SheetPrimitive.Close.Props
  portalProps?: SheetPrimitive.Portal.Props
}) {
  return (
    <SheetPortal {...portalProps}>
      <SheetBackdrop />
      <SheetViewport side={side} variant={variant}>
        <SheetPrimitive.Popup
          {...stylexProps(
            className,
            styles.popup,
            popupSideStyles[side],
            variant === "inset" && styles.popupInset,
          )}
          data-side={side}
          data-slot="sheet-popup"
          data-variant={variant}
          {...props}
        >
          {children}
          {showCloseButton ? (
            <SheetPrimitive.Close
              aria-label="Close"
              className={stylex.props(styles.close).className}
              render={<Button size="icon" variant="ghost" />}
              {...closeProps}
            >
              <XIcon />
            </SheetPrimitive.Close>
          ) : null}
        </SheetPrimitive.Popup>
      </SheetViewport>
    </SheetPortal>
  )
}

export function SheetHeader({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    ...stylexProps(className, styles.header),
    "data-slot": "sheet-header",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}
export function SheetFooter({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"div"> & { variant?: "default" | "bare" }) {
  const defaultProps = {
    ...stylexProps(
      className,
      styles.footer,
      variant === "default" ? styles.footerDefault : styles.footerBare,
    ),
    "data-slot": "sheet-footer",
    "data-variant": variant,
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}
export function SheetTitle({
  className,
  ...props
}: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      {...stylexProps(className, styles.title)}
      data-slot="sheet-title"
      {...props}
    />
  )
}
export function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      {...stylexProps(className, styles.description)}
      data-slot="sheet-description"
      {...props}
    />
  )
}
export function SheetPanel({
  className,
  scrollFade = true,
  render,
  ...props
}: useRender.ComponentProps<"div"> & { scrollFade?: boolean }) {
  const defaultProps = {
    ...stylexProps(className, styles.panel),
    "data-slot": "sheet-panel",
  }
  const content = useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
  return (
    <ScrollArea overscrollContain scrollFade={scrollFade}>
      {content}
    </ScrollArea>
  )
}

export {
  SheetPrimitive,
  SheetBackdrop as SheetOverlay,
  SheetPopup as SheetContent,
}
