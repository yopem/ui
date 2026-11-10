"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps, ReactNode } from "react"

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import { Button } from "@registry/components/ui/button"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { XIcon } from "lucide-react"

const styles = stylex.create({
  backdrop: {
    backdropFilter: "blur(4px)",
    backgroundColor: tokens["--overlay-backdrop"],
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
    backgroundColor: tokens["--overlay-shell"],
    borderColor: tokens["--card-border"],
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: tokens["--shadow-md"],
    color: tokens["--card-foreground"],
    display: "flex",
    flexDirection: "column",
    gridRowStart: 2,
    inlineSize: "100%",
    maxBlockSize: "100%",
    maxInlineSize: "32rem",
    minBlockSize: 0,
    padding: "0.25rem",

    opacity: "calc(1 - var(--nested-dialogs))",
    position: "relative",
    transformOrigin: "center",
    transitionDuration: "200ms",
    transitionProperty: "scale, opacity, translate",
    transitionTimingFunction: "ease-in-out",
    willChange: "transform",
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
      "[data-ending-style]": { translate: "0 1rem" },
      "[data-starting-style]": { translate: "0 1rem" },
    },
  },
  surface: {
    backgroundColor: tokens["--card"],
    borderRadius: "var(--radius-sm)",
    display: "flex",
    flexDirection: "column",
    gap: "inherit",
    minBlockSize: 0,
    overflowX: "hidden",
    overflowY: "auto",
  },
  frameTitle: {
    alignItems: "center",
    color: tokens["--muted-foreground"],
    display: "flex",
    flexShrink: 0,
    fontSize: "0.875rem",
    minBlockSize: "2.5rem",
    paddingInline: "0.75rem 2.75rem",
  },
  close: {
    insetBlockStart: "0.125rem",
    insetInlineEnd: "0.125rem",
    position: "absolute",
  },
  closeIcon: {
    blockSize: "1rem",
    inlineSize: "1rem",
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
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
      borderEndEndRadius: "calc(var(--radius) - 1px)",
      borderEndStartRadius: "calc(var(--radius) - 1px)",
      flexDirection: "row",
      justifyContent: "flex-end",
    },
  },
  footerDefault: {
    paddingBlock: "1rem",
  },
  footerBare: { paddingBlockEnd: "1.5rem" },
  title: {
    fontFamily: tokens["--font-heading"],
    fontSize: "1.25rem",
    fontWeight: 400,
    lineHeight: 1.25,
  },
  description: { color: tokens["--muted-foreground"], fontSize: "0.875rem" },
})

export const AlertDialogCreateHandle: typeof AlertDialogPrimitive.createHandle =
  AlertDialogPrimitive.createHandle

export const AlertDialog: typeof AlertDialogPrimitive.Root =
  AlertDialogPrimitive.Root

export const AlertDialogPortal: typeof AlertDialogPrimitive.Portal =
  AlertDialogPrimitive.Portal

export function AlertDialogTrigger({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<AlertDialogPrimitive.Trigger.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AlertDialogPrimitive.Trigger
      data-slot="alert-dialog-trigger"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function AlertDialogBackdrop({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<AlertDialogPrimitive.Backdrop.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-backdrop"
      {...mergeStylexProps(
        stylexProps(className, styles.backdrop, xstyle),
        props,
      )}
    />
  )
}

export function AlertDialogViewport({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<AlertDialogPrimitive.Viewport.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AlertDialogPrimitive.Viewport
      data-slot="alert-dialog-viewport"
      {...mergeStylexProps(
        stylexProps(className, styles.viewport, xstyle),
        props,
      )}
    />
  )
}

export function AlertDialogPopup({
  xstyle: consumerXstyle,
  className,
  children,
  showCloseButton = true,
  closeProps,
  bottomStickOnMobile = true,
  frameTitle,
  portalProps,
  ...restProps
}: StyleXComponentProps<
  AlertDialogPrimitive.Popup.Props,
  {
    bottomStickOnMobile?: boolean
    frameTitle?: ReactNode
    showCloseButton?: boolean
    closeProps?: AlertDialogPrimitive.Close.Props
    portalProps?: AlertDialogPrimitive.Portal.Props
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

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
          data-slot="alert-dialog-popup"
          {...mergeStylexProps(
            stylexProps(
              className,
              styles.popup,
              bottomStickOnMobile && styles.popupBottomMobile,
              xstyle,
            ),
            props,
          )}
        >
          <div {...stylex.props(styles.frameTitle)}>{frameTitle}</div>
          <div
            data-slot="alert-dialog-surface"
            {...stylex.props(styles.surface)}
          >
            {children}
          </div>
          {showCloseButton ? (
            <AlertDialogPrimitive.Close
              aria-label="Close"
              render={
                <Button size="icon" variant="ghost" xstyle={styles.close} />
              }
              {...closeProps}
            >
              <XIcon {...stylex.props(styles.closeIcon)} />
            </AlertDialogPrimitive.Close>
          ) : null}
        </AlertDialogPrimitive.Popup>
      </AlertDialogViewport>
    </AlertDialogPortal>
  )
}

export function AlertDialogHeader({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="alert-dialog-header"
      {...mergeStylexProps(
        stylexProps(className, styles.header, xstyle),
        props,
      )}
    />
  )
}

export function AlertDialogFooter({
  xstyle: consumerXstyle,
  className,
  variant = "default",
  ...restProps
}: StyleXComponentProps<
  ComponentProps<"div">,
  {
    variant?: "default" | "bare"
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="alert-dialog-footer"
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.footer,
          variant === "default" ? styles.footerDefault : styles.footerBare,
          xstyle,
        ),
        props,
      )}
    />
  )
}

export function AlertDialogTitle({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<AlertDialogPrimitive.Title.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      {...mergeStylexProps(stylexProps(className, styles.title, xstyle), props)}
    />
  )
}

export function AlertDialogDescription({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<AlertDialogPrimitive.Description.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      {...mergeStylexProps(
        stylexProps(className, styles.description, xstyle),
        props,
      )}
    />
  )
}

export function AlertDialogClose({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<AlertDialogPrimitive.Close.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-close"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export {
  AlertDialogPrimitive,
  AlertDialogBackdrop as AlertDialogOverlay,
  AlertDialogPopup as AlertDialogContent,
}
