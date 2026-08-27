"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { Button } from "@registry/components/ui/button"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { XIcon } from "lucide-react"

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
    backgroundColor: tokens.popover,
    borderColor: tokens.border,
    borderRadius: "0.875rem",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 10px 15px -3px color-mix(in oklab, #000 5%, transparent)",
    color: tokens.popoverForeground,
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
      borderEndEndRadius: "calc(0.875rem - 1px)",
      borderEndStartRadius: "calc(0.875rem - 1px)",
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
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      {...stylexProps(className, styles.backdrop)}
      data-slot="dialog-backdrop"
      {...props}
    />
  )
}
export function DialogViewport({
  className,
  ...props
}: DialogPrimitive.Viewport.Props) {
  return (
    <DialogPrimitive.Viewport
      {...stylexProps(className, styles.viewport)}
      data-slot="dialog-viewport"
      {...props}
    />
  )
}

export function DialogPopup({
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
}) {
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
          )}
          data-slot="dialog-popup"
          {...props}
        >
          {children}
          {showCloseButton ? (
            <DialogPrimitive.Close
              aria-label="Close"
              className={stylex.props(styles.close).className}
              render={<Button size="icon" variant="ghost" />}
              {...closeProps}
            >
              <XIcon />
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogViewport>
    </DialogPortal>
  )
}

export function DialogHeader({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    ...stylexProps(className, styles.header),
    "data-slot": "dialog-header",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export function DialogFooter({
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
  className,
  ...props
}: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      {...stylexProps(className, styles.title)}
      data-slot="dialog-title"
      {...props}
    />
  )
}
export function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      {...stylexProps(className, styles.description)}
      data-slot="dialog-description"
      {...props}
    />
  )
}

export function DialogPanel({
  className,
  scrollFade = true,
  render,
  ...props
}: useRender.ComponentProps<"div"> & { scrollFade?: boolean }) {
  const defaultProps = {
    ...stylexProps(className, styles.panel),
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
