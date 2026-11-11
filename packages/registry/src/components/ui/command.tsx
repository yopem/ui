"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps, ReactNode } from "react"

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
import { DialogPopup } from "@registry/components/ui/dialog"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { SearchIcon } from "lucide-react"

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
  popup: { maxBlockSize: "min(100%, 30rem)", maxInlineSize: "42rem" },
  inputWrap: {
    borderBlockEndColor: tokens["--border"],
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: 1,
    paddingInline: "1rem",
    boxShadow: {
      default: "none",
      ":has(:focus-visible)": `inset 0 -2px 0 ${tokens["--ring"]}`,
    },
  },
  inputControl: {
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: 0,
    boxShadow: {
      default: "none",
      ":has(:focus-visible)": "none",
    },
  },
  commandInput: {
    blockSize: "3rem",
    fontSize: "0.875rem",
    paddingInlineStart: "2.75rem",
    paddingInlineEnd: "1rem",
  },
  searchIcon: { blockSize: "1.25rem", inlineSize: "1.25rem" },
  list: { ":not(:empty)": { padding: "0.5rem", scrollPaddingBlock: "0.5rem" } },
  empty: { ":not(:empty)": { paddingBlock: "1.5rem" } },
  panel: { minBlockSize: 0 },
  groupLabel: {
    fontSize: "0.6875rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  item: {
    borderRadius: tokens["--radius-sm"],
    minBlockSize: "2rem",
    paddingBlock: "0.375rem",
    paddingInline: "0.5rem",
    "[data-highlighted]": {
      backgroundColor: tokens["--accent"],
      color: tokens["--accent-foreground"],
    },
  },
  separator: { marginBlock: "0.5rem" },
  shortcut: {
    color: tokens["--muted-foreground"],
    fontFamily: tokens["--font-mono"],
    fontSize: "0.75rem",
    fontWeight: 500,
    letterSpacing: 0,
    marginInlineStart: "auto",
  },
  footer: {
    alignItems: "center",
    borderBlockStartColor: tokens["--border"],
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: 1,
    borderEndEndRadius: "calc(var(--radius) - 1px)",
    borderEndStartRadius: "calc(var(--radius) - 1px)",
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
}: StyleXComponentProps<CommandDialogPrimitive.Trigger.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <CommandDialogPrimitive.Trigger
      data-slot="command-dialog-trigger"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function CommandDialogBackdrop({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<CommandDialogPrimitive.Backdrop.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <CommandDialogPrimitive.Backdrop
      data-slot="command-dialog-backdrop"
      {...mergeStylexProps(
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
}: StyleXComponentProps<CommandDialogPrimitive.Viewport.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <CommandDialogPrimitive.Viewport
      data-slot="command-dialog-viewport"
      {...mergeStylexProps(
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
  frameTitle,
  ...restProps
}: StyleXComponentProps<
  CommandDialogPrimitive.Popup.Props,
  {
    portalProps?: CommandDialogPrimitive.Portal.Props
    frameTitle?: ReactNode
  }
>) {
  return (
    <DialogPopup
      bottomStickOnMobile={false}
      className={className}
      data-slot="command-dialog-popup"
      frameTitle={frameTitle}
      portalProps={portalProps}
      xstyle={[styles.popup, consumerXstyle]}
      {...restProps}
    >
      {children}
    </DialogPopup>
  )
}

export function Command({
  autoHighlight = "always",
  keepHighlight = true,
  ...props
}: ComponentProps<typeof Autocomplete>) {
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
  controlXstyle,
  className,
  placeholder,
  ...restProps
}: StyleXComponentProps<ComponentProps<typeof AutocompleteInput>>) {
  const props = restProps
  const xstyle = consumerXstyle

  const controlStyles = controlXstyle
    ? [styles.inputControl, controlXstyle]
    : styles.inputControl

  return (
    <div data-slot="command-input-wrapper" {...stylex.props(styles.inputWrap)}>
      <AutocompleteInput
        // oxlint-disable-next-line jsx-a11y/no-autofocus, react-doctor/no-autofocus -- command palettes intentionally focus their search input
        autoFocus
        className={className}
        controlXstyle={controlStyles}
        xstyle={[styles.commandInput, xstyle]}
        placeholder={placeholder}
        size="lg"
        startAddon={<SearchIcon {...stylex.props(styles.searchIcon)} />}
        {...props}
      />
    </div>
  )
}

export function CommandList({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<typeof AutocompleteList>>) {
  const props = restProps
  const xstyle = consumerXstyle

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
}: StyleXComponentProps<ComponentProps<typeof AutocompleteEmpty>>) {
  const props = restProps
  const xstyle = consumerXstyle

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
}: StyleXComponentProps<ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="command-panel"
      {...mergeStylexProps(stylexProps(className, styles.panel, xstyle), props)}
    />
  )
}

export function CommandGroup({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<typeof AutocompleteGroup>>) {
  const props = restProps
  const xstyle = consumerXstyle

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
}: StyleXComponentProps<ComponentProps<typeof AutocompleteGroupLabel>>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <AutocompleteGroupLabel
      className={className}
      xstyle={[styles.groupLabel, xstyle]}
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
}: StyleXComponentProps<ComponentProps<typeof AutocompleteItem>>) {
  const props = restProps
  const xstyle = consumerXstyle

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
}: StyleXComponentProps<ComponentProps<typeof AutocompleteSeparator>>) {
  const props = restProps
  const xstyle = consumerXstyle

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
}: StyleXComponentProps<ComponentProps<"kbd">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <kbd
      data-slot="command-shortcut"
      {...mergeStylexProps(
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
}: StyleXComponentProps<ComponentProps<"div">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <div
      data-slot="command-footer"
      {...mergeStylexProps(
        stylexProps(className, styles.footer, xstyle),
        props,
      )}
    />
  )
}

export { CommandDialogPrimitive }
