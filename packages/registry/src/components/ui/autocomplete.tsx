"use client"

import { Autocomplete as AutocompletePrimitive } from "@base-ui/react/autocomplete"
import { Input } from "@registry/components/ui/input"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { ChevronsUpDownIcon, XIcon } from "lucide-react"
import * as React from "react"

const styles = stylex.create({
  inputGroup: {
    color: tokens.foreground,
    inlineSize: "100%",
    position: "relative",
  },
  addon: {
    alignItems: "center",
    display: "flex",
    insetBlock: 0,
    insetInlineStart: 1,
    opacity: 0.8,
    paddingInlineStart: "calc(0.75rem - 1px)",
    pointerEvents: "none",
    position: "absolute",
    zIndex: 10,
  },
  control: {
    alignItems: "center",
    blockSize: { default: "2rem", "@media (min-width: 640px)": "1.75rem" },
    borderColor: "transparent",
    borderRadius: tokens.radiusMedium,
    borderStyle: "solid",
    borderWidth: 1,
    cursor: "pointer",
    display: "inline-flex",
    inlineSize: { default: "2rem", "@media (min-width: 640px)": "1.75rem" },
    insetBlockStart: "50%",
    justifyContent: "center",
    opacity: 0.8,
    outline: "none",
    position: "absolute",
    transform: "translateY(-50%)",
    transitionProperty: "color, background-color, box-shadow, opacity",
    ":hover": { opacity: 1 },
    "::after": {
      content: { default: null, "@media (pointer: coarse)": '""' },
      minBlockSize: { default: null, "@media (pointer: coarse)": "2.75rem" },
      minInlineSize: { default: null, "@media (pointer: coarse)": "2.75rem" },
      position: { default: null, "@media (pointer: coarse)": "absolute" },
    },
  },
  controlDefault: { insetInlineEnd: "0.125rem" },
  controlSmall: { insetInlineEnd: 0 },
  positioner: { userSelect: "none", zIndex: 50 },
  surface: {
    backgroundClip: "padding-box",
    backgroundColor: tokens.popover,
    borderColor: tokens.border,
    borderRadius: tokens.radiusLarge,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 10px 15px -3px color-mix(in oklab, #000 5%, transparent)",
    display: "flex",
    maxBlockSize: "100%",
    maxInlineSize: "var(--available-width)",
    minInlineSize: "var(--anchor-width)",
    position: "relative",
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
  },
  popup: {
    color: tokens.foreground,
    display: "flex",
    flex: 1,
    flexDirection: "column",
    maxBlockSize: "min(var(--available-height), 23rem)",
  },
  item: {
    alignItems: "center",
    borderRadius: tokens.radiusSmall,
    cursor: "default",
    display: "flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    minBlockSize: { default: "2rem", "@media (min-width: 640px)": "1.75rem" },
    outline: "none",
    paddingBlock: "0.25rem",
    paddingInline: "0.5rem",
    userSelect: "none",
    "[data-highlighted]": {
      backgroundColor: tokens.accent,
      color: tokens.accentForeground,
    },
    "[data-disabled]": { opacity: 0.64, pointerEvents: "none" },
  },
  separator: {
    backgroundColor: tokens.border,
    blockSize: 1,
    marginBlock: "0.25rem",
    marginInline: "0.5rem",
    ":last-child": { display: "none" },
  },
  groupLabel: {
    color: tokens.mutedForeground,
    fontSize: "0.75rem",
    fontWeight: 500,
    paddingBlock: "0.375rem",
    paddingInline: "0.5rem",
  },
  empty: {
    color: tokens.mutedForeground,
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    textAlign: "center",
    ":not(:empty)": { padding: "0.5rem" },
  },
  list: {
    ":not(:empty)": { padding: "0.25rem", scrollPaddingBlock: "0.25rem" },
  },
  status: {
    color: tokens.mutedForeground,
    fontSize: "0.75rem",
    fontWeight: 500,
    paddingBlock: "0.5rem",
    paddingInline: "0.75rem",
    ":empty": { margin: 0, padding: 0 },
  },
})

export const Autocomplete: typeof AutocompletePrimitive.Root =
  AutocompletePrimitive.Root

type AutocompleteInputProps = Omit<
  AutocompletePrimitive.Input.Props,
  "ref" | "size"
> & {
  showTrigger?: boolean
  showClear?: boolean
  startAddon?: React.ReactNode
  size?: "sm" | "default" | "lg" | number
  triggerProps?: AutocompletePrimitive.Trigger.Props
  clearProps?: AutocompletePrimitive.Clear.Props
}

export const AutocompleteInput = React.forwardRef<
  HTMLInputElement,
  AutocompleteInputProps
>(function AutocompleteInput(
  {
    className,
    showTrigger = false,
    showClear = false,
    startAddon,
    size,
    triggerProps,
    clearProps,
    ...props
  },
  ref,
) {
  const sizeValue = size ?? "default"
  return (
    <AutocompletePrimitive.InputGroup
      {...stylex.props(styles.inputGroup)}
      data-has-start-addon={startAddon ? "" : undefined}
      data-size={typeof sizeValue === "string" ? sizeValue : undefined}
      data-slot="autocomplete-input-group"
    >
      {startAddon ? (
        <div
          aria-hidden="true"
          {...stylex.props(styles.addon)}
          data-slot="autocomplete-start-addon"
        >
          {startAddon}
        </div>
      ) : null}
      <AutocompletePrimitive.Input
        className={className}
        data-slot="autocomplete-input"
        ref={ref}
        render={<Input nativeInput size={sizeValue} />}
        {...props}
      />
      {showTrigger ? (
        <AutocompleteTrigger
          {...stylex.props(
            styles.control,
            sizeValue === "sm" ? styles.controlSmall : styles.controlDefault,
          )}
          {...triggerProps}
        >
          <AutocompletePrimitive.Icon data-slot="autocomplete-icon">
            <ChevronsUpDownIcon />
          </AutocompletePrimitive.Icon>
        </AutocompleteTrigger>
      ) : null}
      {showClear ? (
        <AutocompleteClear
          {...stylex.props(
            styles.control,
            sizeValue === "sm" ? styles.controlSmall : styles.controlDefault,
          )}
          {...clearProps}
        >
          <XIcon />
        </AutocompleteClear>
      ) : null}
    </AutocompletePrimitive.InputGroup>
  )
})

export function AutocompletePopup({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  alignOffset,
  align = "start",
  anchor,
  portalProps,
  ...props
}: AutocompletePrimitive.Popup.Props & {
  align?: AutocompletePrimitive.Positioner.Props["align"]
  sideOffset?: AutocompletePrimitive.Positioner.Props["sideOffset"]
  alignOffset?: AutocompletePrimitive.Positioner.Props["alignOffset"]
  side?: AutocompletePrimitive.Positioner.Props["side"]
  anchor?: AutocompletePrimitive.Positioner.Props["anchor"]
  portalProps?: AutocompletePrimitive.Portal.Props
}) {
  return (
    <AutocompletePrimitive.Portal {...portalProps}>
      <AutocompletePrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        {...stylex.props(styles.positioner)}
        data-slot="autocomplete-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <span {...stylexProps(className, styles.surface)}>
          <AutocompletePrimitive.Popup
            {...stylex.props(styles.popup)}
            data-slot="autocomplete-popup"
            {...props}
          >
            {children}
          </AutocompletePrimitive.Popup>
        </span>
      </AutocompletePrimitive.Positioner>
    </AutocompletePrimitive.Portal>
  )
}
export function AutocompleteItem({
  className,
  children,
  ...props
}: AutocompletePrimitive.Item.Props) {
  return (
    <AutocompletePrimitive.Item
      {...stylexProps(className, styles.item)}
      data-slot="autocomplete-item"
      {...props}
    >
      {children}
    </AutocompletePrimitive.Item>
  )
}
export function AutocompleteSeparator({
  className,
  ...props
}: AutocompletePrimitive.Separator.Props) {
  return (
    <AutocompletePrimitive.Separator
      {...stylexProps(className, styles.separator)}
      data-slot="autocomplete-separator"
      {...props}
    />
  )
}
export function AutocompleteGroup({
  className,
  ...props
}: AutocompletePrimitive.Group.Props) {
  return (
    <AutocompletePrimitive.Group
      className={className}
      data-slot="autocomplete-group"
      {...props}
    />
  )
}
export function AutocompleteGroupLabel({
  className,
  ...props
}: AutocompletePrimitive.GroupLabel.Props) {
  return (
    <AutocompletePrimitive.GroupLabel
      {...stylexProps(className, styles.groupLabel)}
      data-slot="autocomplete-group-label"
      {...props}
    />
  )
}
export function AutocompleteEmpty({
  className,
  ...props
}: AutocompletePrimitive.Empty.Props) {
  return (
    <AutocompletePrimitive.Empty
      {...stylexProps(className, styles.empty)}
      data-slot="autocomplete-empty"
      {...props}
    />
  )
}
export function AutocompleteRow({
  className,
  ...props
}: AutocompletePrimitive.Row.Props) {
  return (
    <AutocompletePrimitive.Row
      className={className}
      data-slot="autocomplete-row"
      {...props}
    />
  )
}
export const AutocompleteValue: typeof AutocompletePrimitive.Value =
  AutocompletePrimitive.Value
export function AutocompleteList({
  className,
  ...props
}: AutocompletePrimitive.List.Props) {
  return (
    <ScrollArea overscrollContain scrollbarGutter scrollFade>
      <AutocompletePrimitive.List
        {...stylexProps(className, styles.list)}
        data-slot="autocomplete-list"
        {...props}
      />
    </ScrollArea>
  )
}
export function AutocompleteClear({
  className,
  ...props
}: AutocompletePrimitive.Clear.Props) {
  return (
    <AutocompletePrimitive.Clear
      {...stylexProps(className, styles.control)}
      data-slot="autocomplete-clear"
      {...props}
    >
      <XIcon />
    </AutocompletePrimitive.Clear>
  )
}
export function AutocompleteStatus({
  className,
  ...props
}: AutocompletePrimitive.Status.Props) {
  return (
    <AutocompletePrimitive.Status
      {...stylexProps(className, styles.status)}
      data-slot="autocomplete-status"
      {...props}
    />
  )
}
export const AutocompleteCollection: typeof AutocompletePrimitive.Collection =
  AutocompletePrimitive.Collection
export function AutocompleteTrigger({
  className,
  children,
  ...props
}: AutocompletePrimitive.Trigger.Props) {
  return (
    <AutocompletePrimitive.Trigger
      className={className}
      data-slot="autocomplete-trigger"
      {...props}
    >
      {children}
    </AutocompletePrimitive.Trigger>
  )
}
export const useAutocompleteFilter: typeof AutocompletePrimitive.useFilter =
  AutocompletePrimitive.useFilter
export { AutocompletePrimitive }
