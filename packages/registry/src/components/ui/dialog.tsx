"use client"

import type { StyleXProps } from "@registry/lib/stylex"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { Button } from "@registry/components/ui/button"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { XIcon } from "lucide-react"

const styles = stylex.create({
  closeIcon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
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
    outline: "none",
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
  close: {
    insetBlockStart: "0.5rem",
    insetInlineEnd: "0.5rem",
    position: "absolute",
  },
  header: {
    paddingBlockEnd: {
      default: null,
      ':is(:is([data-slot="dialog-popup"], [data-slot="sheet-popup"], [data-slot="drawer-popup"]):has([data-slot$="panel"]) > [data-slot="dialog-header"])':
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
  footerBare: {
    paddingBlockStart: {
      default: "1rem",
      ':is(:is([data-slot="dialog-popup"], [data-slot="sheet-popup"], [data-slot="drawer-popup"]):has([data-slot$="panel"]) > [data-slot="dialog-footer"])':
        "0.75rem",
    },
    paddingBlockEnd: "1.5rem",
  },
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
      ':is(:is([data-slot="dialog-popup"], [data-slot="sheet-popup"], [data-slot="drawer-popup"]):has([data-slot$="header"]) [data-slot="dialog-panel"])':
        "0.25rem",
    },
    paddingBlockEnd: {
      default: null,
      ':is(:is([data-slot="dialog-popup"], [data-slot="sheet-popup"], [data-slot="drawer-popup"]):has([data-slot$="footer"][data-variant="bare"]) [data-slot="dialog-panel"])':
        "0.25rem",
    },
    padding: "1.5rem",
  },
})

export const DialogCreateHandle: typeof DialogPrimitive.createHandle =
  DialogPrimitive.createHandle
export const Dialog: typeof DialogPrimitive.Root = DialogPrimitive.Root
export const DialogPortal: typeof DialogPrimitive.Portal =
  DialogPrimitive.Portal

export function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}
export function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}
export function DialogBackdrop({
  xstyle,
  className,
  ...props
}: DialogPrimitive.Backdrop.Props & StyleXProps) {
  return (
    <DialogPrimitive.Backdrop
      {...stylexProps(className, styles.backdrop, xstyle)}
      data-slot="dialog-backdrop"
      {...props}
    />
  )
}
export function DialogViewport({
  xstyle,
  className,
  ...props
}: DialogPrimitive.Viewport.Props & StyleXProps) {
  return (
    <DialogPrimitive.Viewport
      {...stylexProps(className, styles.viewport, xstyle)}
      data-slot="dialog-viewport"
      {...props}
    />
  )
}

export function DialogPopup({
  xstyle,
  className,
  children,
  showCloseButton = true,
  bottomStickOnMobile = true,
  closeProps,
  portalProps,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  bottomStickOnMobile?: boolean
  closeProps?: DialogPrimitive.Close.Props
  portalProps?: DialogPrimitive.Portal.Props
} & StyleXProps) {
  return (
    <DialogPortal {...portalProps}>
      <DialogBackdrop />
      <DialogViewport
        className={
          stylex.props(bottomStickOnMobile && styles.viewportBottomMobile)
            .className
        }
      >
        <DialogPrimitive.Popup
          {...stylexProps(
            className,
            styles.popup,
            bottomStickOnMobile && styles.popupBottomMobile,
            xstyle,
          )}
          data-slot="dialog-popup"
          {...props}
        >
          {children}
          {showCloseButton ? (
            <DialogPrimitive.Close
              aria-label="Close"
              render={
                <Button size="icon" variant="ghost" xstyle={styles.close} />
              }
              {...closeProps}
            >
              <XIcon {...stylex.props(styles.closeIcon)} />
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogViewport>
    </DialogPortal>
  )
}

export function DialogHeader({
  xstyle,
  className,
  render,
  ...props
}: useRender.ComponentProps<"div"> & StyleXProps) {
  const defaultProps = {
    ...stylexProps(className, styles.header, xstyle),
    "data-slot": "dialog-header",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function DialogFooter({
  xstyle,
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"div"> & {
  variant?: "default" | "bare"
} & StyleXProps) {
  const defaultProps = {
    ...stylexProps(
      className,
      styles.footer,
      variant === "default" ? styles.footerDefault : styles.footerBare,
      xstyle,
    ),
    "data-slot": "dialog-footer",
    "data-variant": variant,
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function DialogTitle({
  xstyle,
  className,
  ...props
}: DialogPrimitive.Title.Props & StyleXProps) {
  return (
    <DialogPrimitive.Title
      {...stylexProps(className, styles.title, xstyle)}
      data-slot="dialog-title"
      {...props}
    />
  )
}
export function DialogDescription({
  xstyle,
  className,
  ...props
}: DialogPrimitive.Description.Props & StyleXProps) {
  return (
    <DialogPrimitive.Description
      {...stylexProps(className, styles.description, xstyle)}
      data-slot="dialog-description"
      {...props}
    />
  )
}

export function DialogPanel({
  xstyle,
  className,
  scrollFade = true,
  render,
  ...props
}: useRender.ComponentProps<"div"> & { scrollFade?: boolean } & StyleXProps) {
  const defaultProps = {
    ...stylexProps(className, styles.panel, xstyle),
    "data-slot": "dialog-panel",
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
  DialogPrimitive,
  DialogBackdrop as DialogOverlay,
  DialogPopup as DialogContent,
}
