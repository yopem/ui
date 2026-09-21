"use client"

import type { StyleComponentProps } from "@registry/lib/style-props"
import type * as React from "react"

import { Dialog as CommandDialogPrimitive } from "@base-ui/react/dialog"
import {
  Autocomplete,
  AutocompleteCollection,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteSeparator,
} from "@registry/components/ui/autocomplete"
import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { SearchIcon } from "lucide-react"

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
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    inset: 0,
    paddingBlock: {
      default: "max(1rem, 4vh)",
      "@media (min-width: 640px)": "10vh",
    },
    paddingInline: "1rem",
    position: "fixed",
    zIndex: 50,
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
    inlineSize: "100%",
    maxBlockSize: "26.25rem",
    maxInlineSize: "36rem",
    minBlockSize: 0,
    minInlineSize: 0,
    opacity: "calc(1 - 0.1 * var(--nested-dialogs))",
    outline: "none",
    position: "relative",
    scale: "calc(1 - 0.1 * var(--nested-dialogs))",
    transform: "translateY(calc(-1.25rem * var(--nested-dialogs)))",
    transitionDuration: "200ms",
    transitionProperty: "scale, opacity, translate",
    transitionTimingFunction: "ease-in-out",
    willChange: "transform",
    "::before": {
      backgroundColor:
        "color-mix(in oklab, var(--muted, transparent) 72%, transparent)",
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
    "[data-ending-style]": { opacity: 0, scale: 0.98 },
    "[data-starting-style]": { opacity: 0, scale: 0.98 },
    "[data-nested]": {
      "[data-ending-style]": { translate: "0 2rem" },
      "[data-starting-style]": { translate: "0 2rem" },
    },
    "[data-nested-dialog-open]": { transformOrigin: "top" },
  },
  inputWrap: { paddingBlock: "0.375rem", paddingInline: "0.625rem" },
  commandInput: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    boxShadow: "none",
  },
  list: { ":not(:empty)": { padding: "0.5rem", scrollPaddingBlock: "0.5rem" } },
  empty: { ":not(:empty)": { paddingBlock: "1.5rem" } },
  panel: {
    backgroundClip: "padding-box",
    backgroundColor: tokens["--popover"],
    borderColor: tokens["--border"],
    borderRadius: "0.75rem 0.75rem 0 0",
    borderStyle: "solid",
    borderWidth: 1,
    borderBlockEndWidth: 0,
    boxShadow: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
    clipPath: "inset(0 1px)",
    marginInline: -1,
    minBlockSize: 0,
    position: "relative",
    "::before": {
      borderStartEndRadius: "calc(0.75rem - 1px)",
      borderStartStartRadius: "calc(0.75rem - 1px)",
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
  },
  item: { paddingBlock: "0.375rem" },
  separator: { marginBlock: "0.5rem" },
  shortcut: {
    color:
      "color-mix(in oklab, var(--muted-foreground, currentColor) 72%, transparent)",
    fontFamily: tokens["--font-sans"],
    fontSize: "0.75rem",
    fontWeight: 500,
    letterSpacing: "0.1em",
    marginInlineStart: "auto",
  },
  footer: {
    alignItems: "center",
    borderBlockStartColor: tokens["--border"],
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    borderEndEndRadius: "calc(0.875rem - 1px)",
    borderEndStartRadius: "calc(0.875rem - 1px)",
    color: tokens["--muted-foreground"],
    display: "flex",
    fontSize: "0.75rem",
    gap: "0.5rem",
    justifyContent: "space-between",
    paddingBlock: "0.75rem",
    paddingInline: "1.25rem",
  },
})

export const CommandDialog: typeof CommandDialogPrimitive.Root =
  CommandDialogPrimitive.Root
export const CommandDialogPortal: typeof CommandDialogPrimitive.Portal =
  CommandDialogPrimitive.Portal
export const CommandCreateHandle: typeof CommandDialogPrimitive.createHandle =
  CommandDialogPrimitive.createHandle
export function CommandDialogTrigger({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<CommandDialogPrimitive.Trigger.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <CommandDialogPrimitive.Trigger
      data-slot="command-dialog-trigger"
      {...mergeStyleProps(stylexProps(className, xstyle), props)}
    />
  )
}
export function CommandDialogBackdrop({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<CommandDialogPrimitive.Backdrop.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <CommandDialogPrimitive.Backdrop
      data-slot="command-dialog-backdrop"
      {...mergeStyleProps(
        stylexProps(className, styles.backdrop, xstyle),
        props,
      )}
    />
  )
}
export function CommandDialogViewport({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<CommandDialogPrimitive.Viewport.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <CommandDialogPrimitive.Viewport
      data-slot="command-dialog-viewport"
      {...mergeStyleProps(
        stylexProps(className, styles.viewport, xstyle),
        props,
      )}
    />
  )
}
export function CommandDialogPopup({
  xstyle: consumerXstyle,
  className,
  children,
  portalProps,
  ...restProps
}: StyleComponentProps<
  CommandDialogPrimitive.Popup.Props,
  {
    portalProps?: CommandDialogPrimitive.Portal.Props
  }
>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <CommandDialogPortal {...portalProps}>
      <CommandDialogBackdrop />
      <CommandDialogViewport>
        <CommandDialogPrimitive.Popup
          data-slot="command-dialog-popup"
          {...mergeStyleProps(
            stylexProps(className, styles.popup, xstyle),
            props,
          )}
        >
          {children}
        </CommandDialogPrimitive.Popup>
      </CommandDialogViewport>
    </CommandDialogPortal>
  )
}
export function Command({
  autoHighlight = "always",
  keepHighlight = true,
  ...props
}: React.ComponentProps<typeof Autocomplete>) {
  return (
    <Autocomplete
      autoHighlight={autoHighlight}
      inline
      keepHighlight={keepHighlight}
      open
      {...props}
    />
  )
}
export function CommandInput({
  xstyle: consumerXstyle,
  className,
  placeholder,
  ...restProps
}: StyleComponentProps<React.ComponentProps<typeof AutocompleteInput>>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <div {...stylex.props(styles.inputWrap)}>
      <AutocompleteInput
        // oxlint-disable-next-line jsx-a11y/no-autofocus -- command palette needs immediate focus
        autoFocus
        className={className}
        xstyle={[styles.commandInput, xstyle]}
        placeholder={placeholder}
        size="lg"
        startAddon={<SearchIcon />}
        {...props}
      />
    </div>
  )
}
export function CommandList({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<typeof AutocompleteList>>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <AutocompleteList
      className={className}
      xstyle={[styles.list, xstyle]}
      data-slot="command-list"
      {...props}
    />
  )
}
export function CommandEmpty({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<typeof AutocompleteEmpty>>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <AutocompleteEmpty
      className={className}
      xstyle={[styles.empty, xstyle]}
      data-slot="command-empty"
      {...props}
    />
  )
}
export function CommandPanel({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"div">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <div
      data-slot="command-panel"
      {...mergeStyleProps(stylexProps(className, styles.panel, xstyle), props)}
    />
  )
}
export function CommandGroup({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<typeof AutocompleteGroup>>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <AutocompleteGroup
      className={className}
      xstyle={xstyle}
      data-slot="command-group"
      {...props}
    />
  )
}
export function CommandGroupLabel({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<typeof AutocompleteGroupLabel>>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <AutocompleteGroupLabel
      className={className}
      xstyle={xstyle}
      data-slot="command-group-label"
      {...props}
    />
  )
}
export const CommandCollection = AutocompleteCollection
export function CommandItem({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<typeof AutocompleteItem>>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <AutocompleteItem
      className={className}
      xstyle={[styles.item, xstyle]}
      data-slot="command-item"
      {...props}
    />
  )
}
export function CommandSeparator({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<typeof AutocompleteSeparator>>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <AutocompleteSeparator
      className={className}
      xstyle={[styles.separator, xstyle]}
      data-slot="command-separator"
      {...props}
    />
  )
}
export function CommandShortcut({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"kbd">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <kbd
      data-slot="command-shortcut"
      {...mergeStyleProps(
        stylexProps(className, styles.shortcut, xstyle),
        props,
      )}
    />
  )
}
export function CommandFooter({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"div">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <div
      data-slot="command-footer"
      {...mergeStyleProps(stylexProps(className, styles.footer, xstyle), props)}
    />
  )
}
export { CommandDialogPrimitive }
