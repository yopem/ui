"use client"

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Input } from "@registry/components/ui/input"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { ChevronsUpDownIcon, XIcon } from "lucide-react"
import * as React from "react"

const styles = stylex.create({
  chipsInput: {
    color: tokens.foreground,
    flex: 1,
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    minInlineSize: "3rem",
    outline: "none",
  },
  chipsInputDefault: { paddingInlineStart: "0.5rem" },
  chipsInputSmall: { paddingInlineStart: "0.375rem" },
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
    transitionProperty: "opacity",
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
    display: "grid",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    gap: "0.5rem",
    gridTemplateColumns: "1rem 1fr",
    minBlockSize: { default: "2rem", "@media (min-width: 640px)": "1.75rem" },
    outline: "none",
    paddingBlock: "0.25rem",
    paddingInlineEnd: "1rem",
    paddingInlineStart: "0.5rem",
    userSelect: "none",
    "[data-highlighted]": {
      backgroundColor: tokens.accent,
      color: tokens.accentForeground,
    },
    "[data-disabled]": { opacity: 0.64, pointerEvents: "none" },
  },
  firstColumn: { gridColumnStart: 1 },
  secondColumn: { gridColumnStart: 2 },
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
  chips: {
    backgroundClip: "padding-box",
    backgroundColor: {
      default: tokens.background,
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, transparent) 32%, transparent)",
    },
    borderColor: tokens.input,
    borderRadius: tokens.radiusLarge,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
    display: "inline-flex",
    flexWrap: "wrap",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    gap: "0.25rem",
    inlineSize: "100%",
    minBlockSize: { default: "2.25rem", "@media (min-width: 640px)": "2rem" },
    outline: "none",
    padding: "calc(0.25rem - 1px)",
    position: "relative",
    transitionProperty: "box-shadow",
    ":focus-within": {
      borderColor: tokens.ring,
      boxShadow: `0 0 0 3px color-mix(in oklab, var(--ring, currentColor) 24%, transparent)`,
    },
  },
  chipsAddon: {
    alignItems: "center",
    display: "flex",
    flexShrink: 0,
    opacity: 0.8,
    paddingInlineStart: "0.5rem",
  },
  chip: {
    alignItems: "center",
    backgroundColor: tokens.accent,
    borderRadius: "calc(var(--radius-md, 0.5rem) - 1px)",
    color: tokens.accentForeground,
    display: "flex",
    fontSize: { default: "0.875rem", "@media (min-width: 640px)": "0.75rem" },
    fontWeight: 500,
    outline: "none",
    paddingInlineStart: "0.5rem",
  },
  chipRemove: {
    blockSize: "100%",
    cursor: "pointer",
    flexShrink: 0,
    opacity: 0.8,
    paddingInline: "0.375rem",
    ":hover": { opacity: 1 },
  },
})

export const ComboboxContext = React.createContext<{
  chipsRef: React.RefObject<Element | null> | null
  multiple: boolean
}>({ chipsRef: null, multiple: false })

export function Combobox<Value, Multiple extends boolean | undefined = false>(
  props: ComboboxPrimitive.Root.Props<Value, Multiple>,
) {
  const chipsRef = React.useRef<Element | null>(null)
  return (
    <ComboboxContext.Provider value={{ chipsRef, multiple: !!props.multiple }}>
      <ComboboxPrimitive.Root {...props} />
    </ComboboxContext.Provider>
  )
}

type ComboboxInputProps = Omit<
  ComboboxPrimitive.Input.Props,
  "ref" | "size"
> & {
  size?: "sm" | "default" | "lg" | number
}

export const ComboboxChipsInput = React.forwardRef<
  HTMLInputElement,
  ComboboxInputProps
>(function ComboboxChipsInput({ className, size, ...props }, ref) {
  const sizeValue = size ?? "default"
  return (
    <ComboboxPrimitive.Input
      {...stylexProps(
        className,
        styles.chipsInput,
        sizeValue === "sm" ? styles.chipsInputSmall : styles.chipsInputDefault,
      )}
      data-size={typeof sizeValue === "string" ? sizeValue : undefined}
      data-slot="combobox-chips-input"
      ref={ref}
      size={typeof sizeValue === "number" ? sizeValue : undefined}
      {...props}
    />
  )
})

type ComboboxControlInputProps = ComboboxInputProps & {
  showTrigger?: boolean
  showClear?: boolean
  startAddon?: React.ReactNode
  triggerProps?: ComboboxPrimitive.Trigger.Props
  clearProps?: ComboboxPrimitive.Clear.Props
}

export const ComboboxInput = React.forwardRef<
  HTMLInputElement,
  ComboboxControlInputProps
>(function ComboboxInput(
  {
    className,
    showTrigger = true,
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
    <ComboboxPrimitive.InputGroup
      {...stylex.props(styles.inputGroup)}
      data-has-start-addon={startAddon ? "" : undefined}
      data-size={typeof sizeValue === "string" ? sizeValue : undefined}
      data-slot="combobox-input-group"
    >
      {startAddon ? (
        <div
          aria-hidden="true"
          {...stylex.props(styles.addon)}
          data-slot="combobox-start-addon"
        >
          {startAddon}
        </div>
      ) : null}
      <ComboboxPrimitive.Input
        className={className}
        data-slot="combobox-input"
        ref={ref}
        render={<Input nativeInput size={sizeValue} />}
        {...props}
      />
      {showTrigger ? (
        <ComboboxTrigger
          {...stylex.props(
            styles.control,
            sizeValue === "sm" ? styles.controlSmall : styles.controlDefault,
          )}
          {...triggerProps}
        >
          <ComboboxPrimitive.Icon data-slot="combobox-icon">
            <ChevronsUpDownIcon />
          </ComboboxPrimitive.Icon>
        </ComboboxTrigger>
      ) : null}
      {showClear ? (
        <ComboboxClear
          {...stylex.props(
            styles.control,
            sizeValue === "sm" ? styles.controlSmall : styles.controlDefault,
          )}
          {...clearProps}
        >
          <XIcon />
        </ComboboxClear>
      ) : null}
    </ComboboxPrimitive.InputGroup>
  )
})
export function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      aria-label={props["aria-label"] ?? "Toggle suggestions"}
      className={className}
      data-slot="combobox-trigger"
      {...props}
    >
      {children}
    </ComboboxPrimitive.Trigger>
  )
}

export function ComboboxPopup({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  alignOffset,
  align = "start",
  anchor: anchorProp,
  portalProps,
  ...props
}: ComboboxPrimitive.Popup.Props & {
  align?: ComboboxPrimitive.Positioner.Props["align"]
  sideOffset?: ComboboxPrimitive.Positioner.Props["sideOffset"]
  alignOffset?: ComboboxPrimitive.Positioner.Props["alignOffset"]
  side?: ComboboxPrimitive.Positioner.Props["side"]
  anchor?: ComboboxPrimitive.Positioner.Props["anchor"]
  portalProps?: ComboboxPrimitive.Portal.Props
}) {
  const { chipsRef } = React.useContext(ComboboxContext)
  const anchor = anchorProp ?? chipsRef
  return (
    <ComboboxPrimitive.Portal {...portalProps}>
      <ComboboxPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        {...stylex.props(styles.positioner)}
        data-slot="combobox-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <span {...stylexProps(className, styles.surface)}>
          <ComboboxPrimitive.Popup
            {...stylex.props(styles.popup)}
            data-slot="combobox-popup"
            {...props}
          >
            {children}
          </ComboboxPrimitive.Popup>
        </span>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}
export function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      {...stylexProps(className, styles.item)}
      data-slot="combobox-item"
      {...props}
    >
      <ComboboxPrimitive.ItemIndicator {...stylex.props(styles.firstColumn)}>
        <svg
          aria-hidden="true"
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
      </ComboboxPrimitive.ItemIndicator>
      <div {...stylex.props(styles.secondColumn)}>{children}</div>
    </ComboboxPrimitive.Item>
  )
}
export function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      {...stylexProps(className, styles.separator)}
      data-slot="combobox-separator"
      {...props}
    />
  )
}
export function ComboboxGroup({
  className,
  ...props
}: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      className={className}
      data-slot="combobox-group"
      {...props}
    />
  )
}
export function ComboboxGroupLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      {...stylexProps(className, styles.groupLabel)}
      data-slot="combobox-group-label"
      {...props}
    />
  )
}
export function ComboboxEmpty({
  className,
  ...props
}: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      {...stylexProps(className, styles.empty)}
      data-slot="combobox-empty"
      {...props}
    />
  )
}
export function ComboboxRow({
  className,
  ...props
}: ComboboxPrimitive.Row.Props) {
  return (
    <ComboboxPrimitive.Row
      className={className}
      data-slot="combobox-row"
      {...props}
    />
  )
}
export const ComboboxValue: typeof ComboboxPrimitive.Value =
  ComboboxPrimitive.Value
export function ComboboxList({
  className,
  ...props
}: ComboboxPrimitive.List.Props) {
  return (
    <ScrollArea overscrollContain scrollbarGutter scrollFade>
      <ComboboxPrimitive.List
        {...stylexProps(className, styles.list)}
        data-slot="combobox-list"
        {...props}
      />
    </ScrollArea>
  )
}
export function ComboboxClear({
  className,
  ...props
}: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      className={className}
      data-slot="combobox-clear"
      {...props}
    />
  )
}
export function ComboboxStatus({
  className,
  ...props
}: ComboboxPrimitive.Status.Props) {
  return (
    <ComboboxPrimitive.Status
      {...stylexProps(className, styles.status)}
      data-slot="combobox-status"
      {...props}
    />
  )
}
export const ComboboxCollection: typeof ComboboxPrimitive.Collection =
  ComboboxPrimitive.Collection

export function ComboboxChips({
  className,
  children,
  startAddon,
  ...props
}: ComboboxPrimitive.Chips.Props & { startAddon?: React.ReactNode }) {
  const { chipsRef } = React.useContext(ComboboxContext)
  return (
    <ComboboxPrimitive.Chips
      {...stylexProps(className, styles.chips)}
      data-slot="combobox-chips"
      ref={chipsRef as React.Ref<HTMLDivElement> | null}
      {...props}
    >
      {startAddon ? (
        <div
          aria-hidden="true"
          {...stylex.props(styles.chipsAddon)}
          data-slot="combobox-start-addon"
        >
          {startAddon}
        </div>
      ) : null}
      {children}
    </ComboboxPrimitive.Chips>
  )
}
export function ComboboxChip({
  children,
  removeProps,
  ...props
}: ComboboxPrimitive.Chip.Props & {
  removeProps?: ComboboxPrimitive.ChipRemove.Props
}) {
  return (
    <ComboboxPrimitive.Chip
      {...stylex.props(styles.chip)}
      data-slot="combobox-chip"
      {...props}
    >
      {children}
      <ComboboxChipRemove {...removeProps} />
    </ComboboxPrimitive.Chip>
  )
}
export function ComboboxChipRemove(props: ComboboxPrimitive.ChipRemove.Props) {
  return (
    <ComboboxPrimitive.ChipRemove
      aria-label="Remove"
      {...stylex.props(styles.chipRemove)}
      data-slot="combobox-chip-remove"
      {...props}
    >
      <XIcon />
    </ComboboxPrimitive.ChipRemove>
  )
}
export const useComboboxFilter: typeof ComboboxPrimitive.useFilter =
  ComboboxPrimitive.useFilter
export { ComboboxPrimitive }
