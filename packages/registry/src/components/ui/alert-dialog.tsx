"use client"

import type { StyleXProps } from "@registry/lib/stylex"
import type React from "react"

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

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
  viewport: {
    display: "grid",
    gridTemplateRows: "1fr auto 3fr",
    inset: 0,
    justifyItems: "center",
    padding: "1rem",
    position: "fixed",
    zIndex: 50,
  },
  viewportBottomMobile: {
    "@media (max-width: 639px)": {
      gridTemplateRows: "1fr auto",
      padding: 0,
      paddingBlockStart: "3rem",
    },
  },
  popup: {
    backgroundClip: "padding-box",
    backgroundColor: tokens["--popover"],
    borderColor: tokens["--border"],
    borderRadius: "0.875rem",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 10px 15px -3px color-mix(in oklab, #000 5%, transparent)",
    color: tokens["--popover-foreground"],
    display: "flex",
    flexDirection: "column",
    gridRowStart: 2,
    inlineSize: "100%",
    maxBlockSize: "100%",
    maxInlineSize: "32rem",
    minBlockSize: 0,
    minInlineSize: 0,
    opacity: "calc(1 - var(--nested-dialogs))",
    position: "relative",
    transformOrigin: "center",
    transitionDuration: "200ms",
    transitionProperty: "scale, opacity, translate",
    transitionTimingFunction: "ease-in-out",
    willChange: "transform",
    "::before": {
      borderRadius: "calc(0.875rem - 1px)",
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
    "[data-ending-style]": { opacity: 0 },
    "[data-starting-style]": { opacity: 0 },
    "@media (min-width: 640px)": {
      scale: "calc(1 - 0.1 * var(--nested-dialogs))",
      "[data-ending-style]": { scale: 0.98 },
      "[data-starting-style]": { scale: 0.98 },
    },
  },
  popupBottomMobile: {
    "@media (max-width: 639px)": {
      borderBlockEndWidth: 0,
      borderInlineWidth: 0,
      borderRadius: 0,
      maxInlineSize: "none",
      transformOrigin: "bottom",
      "::before": { display: "none" },
      "[data-ending-style]": { translate: "0 1rem" },
      "[data-starting-style]": { translate: "0 1rem" },
    },
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "1.5rem",
    textAlign: "center",
    "@media (max-width: 639px)": { paddingBlockEnd: "1rem" },
    "@media (min-width: 640px)": { textAlign: "start" },
  },
  footer: {
    display: "flex",
    flexDirection: "column-reverse",
    gap: "0.5rem",
    paddingInline: "1.5rem",
    "@media (min-width: 640px)": {
      borderEndEndRadius: "calc(0.875rem - 1px)",
      borderEndStartRadius: "calc(0.875rem - 1px)",
      flexDirection: "row",
      justifyContent: "flex-end",
    },
  },
  footerDefault: {
    backgroundColor:
      "color-mix(in oklab, var(--muted, transparent) 72%, transparent)",
    borderBlockStartColor: tokens["--border"],
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    paddingBlock: "1rem",
  },
  footerBare: { paddingBlockEnd: "1.5rem" },
  title: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.25rem",
    fontWeight: 600,
    lineHeight: 1,
  },
  description: { color: tokens["--muted-foreground"], fontSize: "0.875rem" },
})

export const AlertDialogCreateHandle: typeof AlertDialogPrimitive.createHandle =
  AlertDialogPrimitive.createHandle
export const AlertDialog: typeof AlertDialogPrimitive.Root =
  AlertDialogPrimitive.Root
export const AlertDialogPortal: typeof AlertDialogPrimitive.Portal =
  AlertDialogPrimitive.Portal

export function AlertDialogTrigger(props: AlertDialogPrimitive.Trigger.Props) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

export function AlertDialogBackdrop({
  xstyle,
  className,
  ...props
}: AlertDialogPrimitive.Backdrop.Props & StyleXProps) {
  return (
    <AlertDialogPrimitive.Backdrop
      {...stylexProps(className, styles.backdrop, xstyle)}
      data-slot="alert-dialog-backdrop"
      {...props}
    />
  )
}

export function AlertDialogViewport({
  xstyle,
  className,
  ...props
}: AlertDialogPrimitive.Viewport.Props & StyleXProps) {
  return (
    <AlertDialogPrimitive.Viewport
      {...stylexProps(className, styles.viewport, xstyle)}
      data-slot="alert-dialog-viewport"
      {...props}
    />
  )
}

export function AlertDialogPopup({
  xstyle,
  className,
  bottomStickOnMobile = true,
  portalProps,
  ...props
}: AlertDialogPrimitive.Popup.Props & {
  bottomStickOnMobile?: boolean
  portalProps?: AlertDialogPrimitive.Portal.Props
} & StyleXProps) {
  return (
    <AlertDialogPortal {...portalProps}>
      <AlertDialogBackdrop />
      <AlertDialogViewport
        className={
          stylex.props(bottomStickOnMobile && styles.viewportBottomMobile)
            .className
        }
      >
        <AlertDialogPrimitive.Popup
          {...stylexProps(
            className,
            styles.popup,
            bottomStickOnMobile && styles.popupBottomMobile,
            xstyle,
          )}
          data-slot="alert-dialog-popup"
          {...props}
        />
      </AlertDialogViewport>
    </AlertDialogPortal>
  )
}

export function AlertDialogHeader({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"div"> & StyleXProps) {
  return (
    <div
      {...stylexProps(className, styles.header, xstyle)}
      data-slot="alert-dialog-header"
      {...props}
    />
  )
}

export function AlertDialogFooter({
  xstyle,
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "bare"
} & StyleXProps) {
  return (
    <div
      {...stylexProps(
        className,
        styles.footer,
        variant === "default" ? styles.footerDefault : styles.footerBare,
        xstyle,
      )}
      data-slot="alert-dialog-footer"
      {...props}
    />
  )
}

export function AlertDialogTitle({
  xstyle,
  className,
  ...props
}: AlertDialogPrimitive.Title.Props & StyleXProps) {
  return (
    <AlertDialogPrimitive.Title
      {...stylexProps(className, styles.title, xstyle)}
      data-slot="alert-dialog-title"
      {...props}
    />
  )
}

export function AlertDialogDescription({
  xstyle,
  className,
  ...props
}: AlertDialogPrimitive.Description.Props & StyleXProps) {
  return (
    <AlertDialogPrimitive.Description
      {...stylexProps(className, styles.description, xstyle)}
      data-slot="alert-dialog-description"
      {...props}
    />
  )
}

export function AlertDialogClose(props: AlertDialogPrimitive.Close.Props) {
  return (
    <AlertDialogPrimitive.Close data-slot="alert-dialog-close" {...props} />
  )
}

export {
  AlertDialogPrimitive,
  AlertDialogBackdrop as AlertDialogOverlay,
  AlertDialogPopup as AlertDialogContent,
}
