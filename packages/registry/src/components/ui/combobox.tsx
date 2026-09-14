"use client"

import type { StyleXProps } from "@registry/lib/stylex"

import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Input } from "@registry/components/ui/input"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { ChevronsUpDownIcon, XIcon } from "lucide-react"
import * as React from "react"

export const comboboxSlotStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
  },
  chipChild: {
    minBlockSize: { default: "1.75rem", "@media (min-width: 640px)": "1.5rem" },
  },
})

const styles = stylex.create({
  inputPadding: {
    paddingInlineStart: {
      default: null,
      ':is([data-slot="combobox-input-group"][data-has-start-addon] input)':
        "calc(2.125rem - 1px)",
    },
    paddingInlineEnd: {
      default: null,
      ':is([data-slot="combobox-input-group"]:has([data-slot$="trigger"], [data-slot$="clear"]) input)':
        "1.75rem",
      ':is([data-slot="combobox-input-group"][data-size="sm"]:has([data-slot$="trigger"], [data-slot$="clear"]) input)':
        "1.625rem",
    },
  },
  trigger: {
    display: {
      default: null,
      ':has(+ [data-slot$="clear"])': "none",
    },
  },
  group: {
    marginBlockStart: {
      default: null,
      ':is(:where([data-slot="autocomplete-group"], [data-slot="combobox-group"]) + *)':
        "0.375rem",
    },
  },
  chipsInput: {
    minBlockSize: { default: "1.75rem", "@media (min-width: 640px)": "1.5rem" },
    color: tokens["--foreground"],
    flex: 1,
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    minInlineSize: "3rem",
    outline: "none",
  },
  chipsInputDefault: {
    paddingInlineStart: {
      default: "0.5rem",
      ':is([data-slot="combobox-chip"] + [data-slot="combobox-chips-input"])':
        "0.125rem",
    },
  },
  chipsInputSmall: {
    paddingInlineStart: {
      default: "0.375rem",
      ':is([data-slot="combobox-chip"] + [data-slot="combobox-chips-input"])':
        "0.125rem",
    },
  },
  inputGroup: {
    opacity: {
      default: null,
      ":has(:disabled)": 0.64,
    },
    color: tokens["--foreground"],
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
    borderRadius: tokens["--radius-md"],
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
    backgroundColor: tokens["--popover"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-lg"],
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
    color: tokens["--foreground"],
    display: "flex",
    flex: 1,
    flexDirection: "column",
    maxBlockSize: "min(var(--available-height), 23rem)",
  },
  item: {
    minInlineSize: {
      default: null,
      ':is([data-slot="select-positioner"][data-side="none"] [data-slot="combobox-item"])':
        "calc(var(--anchor-width) + 1.25rem)",
    },
    alignItems: "center",
    borderRadius: tokens["--radius-sm"],
    cursor: "default",
    display: "grid",
    fontSize: {
      default: "1rem",
      "@media (min-width: 640px)": "0.875rem",
    },
    gap: "0.5rem",
    gridTemplateColumns: "1rem 1fr",
    minBlockSize: {
      default: "2rem",
      "@media (min-width: 640px)": "1.75rem",
    },
    outline: "none",
    paddingBlock: "0.25rem",
    paddingInlineEnd: "1rem",
    paddingInlineStart: "0.5rem",
    userSelect: "none",
    backgroundColor: {
      default: null,
      "[data-highlighted]": tokens["--accent"],
    },
    color: {
      default: null,
      "[data-highlighted]": tokens["--accent-foreground"],
    },
    opacity: {
      default: null,
      "[data-disabled]": 0.64,
    },
    pointerEvents: {
      default: null,
      "[data-disabled]": "none",
    },
  },
  firstColumn: { gridColumnStart: 1 },
  secondColumn: { gridColumnStart: 2 },
  separator: {
    backgroundColor: tokens["--border"],
    blockSize: 1,
    marginBlock: "0.25rem",
    marginInline: "0.5rem",
    ":last-child": { display: "none" },
  },
  groupLabel: {
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    fontWeight: 500,
    paddingBlock: "0.375rem",
    paddingInline: "0.5rem",
  },
  empty: {
    color: tokens["--muted-foreground"],
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    textAlign: "center",
    ":not(:empty)": { padding: "0.5rem" },
  },
  list: {
    "[data-has-overflow-y]": { paddingInlineEnd: "0.75rem" },
    ":not(:empty)": { padding: "0.25rem", scrollPaddingBlock: "0.25rem" },
  },
  status: {
    color: tokens["--muted-foreground"],
    fontSize: "0.75rem",
    fontWeight: 500,
    paddingBlock: "0.5rem",
    paddingInline: "0.75rem",
    ":empty": { margin: 0, padding: 0 },
  },
  chips: {
    opacity: {
      default: null,
      ":has(:disabled)": 0.64,
    },
    pointerEvents: {
      default: null,
      ":has(:disabled)": "none",
    },
    backgroundClip: "padding-box",
    backgroundColor: {
      default: tokens["--background"],
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, transparent) 32%, transparent)",
    },
    borderColor: {
      default: tokens["--input"],
      ":focus-within": tokens["--ring"],
    },
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: {
      default: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
      ":focus-within": `0 0 0 3px color-mix(in oklab, var(--ring, currentColor) 24%, transparent)`,
    },
    display: "inline-flex",
    flexWrap: "wrap",
    fontSize: {
      default: "1rem",
      "@media (min-width: 640px)": "0.875rem",
    },
    gap: "0.25rem",
    inlineSize: "100%",
    minBlockSize: {
      default: "2.25rem",
      "@media (min-width: 640px)": "2rem",
    },
    outline: "none",
    padding: "calc(0.25rem - 1px)",
    position: "relative",
    transitionProperty: "box-shadow",
  },
  chipsAddon: {
    minBlockSize: { default: "1.75rem", "@media (min-width: 640px)": "1.5rem" },
    alignItems: "center",
    display: "flex",
    flexShrink: 0,
    opacity: 0.8,
    paddingInlineStart: "0.5rem",
  },
  chip: {
    minBlockSize: { default: "1.75rem", "@media (min-width: 640px)": "1.5rem" },
    alignItems: "center",
    backgroundColor: tokens["--accent"],
    borderRadius: "calc(var(--radius-md, 0.5rem) - 1px)",
    color: tokens["--accent-foreground"],
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
  const multiple = Boolean(props.multiple)
  const contextValue = React.useMemo(
    () => ({ chipsRef, multiple }),
    [chipsRef, multiple],
  )
  return (
    <ComboboxContext.Provider value={contextValue}>
      <ComboboxPrimitive.Root {...props} />
    </ComboboxContext.Provider>
  )
}

type ComboboxInputProps = StyleXProps &
  Omit<ComboboxPrimitive.Input.Props, "ref" | "size"> & {
    size?: "sm" | "default" | "lg" | number
  }

export const ComboboxChipsInput = React.forwardRef<
  HTMLInputElement,
  ComboboxInputProps
>(function ComboboxChipsInput({ xstyle, className, size, ...props }, ref) {
  const sizeValue = size ?? "default"
  return (
    <ComboboxPrimitive.Input
      {...stylexProps(
        className,
        styles.chipsInput,
        sizeValue === "sm" ? styles.chipsInputSmall : styles.chipsInputDefault,
        xstyle,
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
    xstyle,
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
        render={
          <Input
            nativeInput
            size={sizeValue}
            xstyle={[styles.inputPadding, xstyle]}
          />
        }
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
            <ChevronsUpDownIcon {...stylex.props(comboboxSlotStyles.icon)} />
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
          <XIcon {...stylex.props(comboboxSlotStyles.icon)} />
        </ComboboxClear>
      ) : null}
    </ComboboxPrimitive.InputGroup>
  )
})
export function ComboboxTrigger({
  xstyle,
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props & StyleXProps) {
  return (
    <ComboboxPrimitive.Trigger
      aria-label={props["aria-label"] ?? "Toggle suggestions"}
      {...stylexProps(className, styles.trigger, xstyle)}
      data-slot="combobox-trigger"
      {...props}
    >
      {children}
    </ComboboxPrimitive.Trigger>
  )
}

export function ComboboxPopup({
  xstyle,
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
} & StyleXProps) {
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
        <span
          {...stylexProps(
            typeof className === "string" ? className : undefined,
            styles.surface,
          )}
        >
          <ComboboxPrimitive.Popup
            {...stylexProps(
              typeof className === "function" ? className : undefined,
              styles.popup,
              xstyle,
            )}
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
  xstyle,
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props & StyleXProps) {
  return (
    <ComboboxPrimitive.Item
      {...stylexProps(className, styles.item, xstyle)}
      data-slot="combobox-item"
      {...props}
    >
      <ComboboxPrimitive.ItemIndicator {...stylex.props(styles.firstColumn)}>
        <svg
          {...stylex.props(comboboxSlotStyles.icon)}
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
  xstyle,
  className,
  ...props
}: ComboboxPrimitive.Separator.Props & StyleXProps) {
  return (
    <ComboboxPrimitive.Separator
      {...stylexProps(className, styles.separator, xstyle)}
      data-slot="combobox-separator"
      {...props}
    />
  )
}
export function ComboboxGroup({
  xstyle,
  className,
  ...props
}: ComboboxPrimitive.Group.Props & StyleXProps) {
  return (
    <ComboboxPrimitive.Group
      {...stylexProps(className, styles.group, xstyle)}
      data-slot="combobox-group"
      {...props}
    />
  )
}
export function ComboboxGroupLabel({
  xstyle,
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props & StyleXProps) {
  return (
    <ComboboxPrimitive.GroupLabel
      {...stylexProps(className, styles.groupLabel, xstyle)}
      data-slot="combobox-group-label"
      {...props}
    />
  )
}
export function ComboboxEmpty({
  xstyle,
  className,
  ...props
}: ComboboxPrimitive.Empty.Props & StyleXProps) {
  return (
    <ComboboxPrimitive.Empty
      {...stylexProps(className, styles.empty, xstyle)}
      data-slot="combobox-empty"
      {...props}
    />
  )
}
export function ComboboxRow({
  xstyle,
  className,
  ...props
}: ComboboxPrimitive.Row.Props & StyleXProps) {
  return (
    <ComboboxPrimitive.Row
      {...stylexProps(className, xstyle)}
      data-slot="combobox-row"
      {...props}
    />
  )
}
export const ComboboxValue: typeof ComboboxPrimitive.Value =
  ComboboxPrimitive.Value
export function ComboboxList({
  xstyle,
  className,
  ...props
}: ComboboxPrimitive.List.Props & StyleXProps) {
  return (
    <ScrollArea overscrollContain scrollbarGutter scrollFade>
      <ComboboxPrimitive.List
        {...stylexProps(className, styles.list, xstyle)}
        data-slot="combobox-list"
        {...props}
      />
    </ScrollArea>
  )
}
export function ComboboxClear({
  xstyle,
  className,
  ...props
}: ComboboxPrimitive.Clear.Props & StyleXProps) {
  return (
    <ComboboxPrimitive.Clear
      {...stylexProps(className, xstyle)}
      data-slot="combobox-clear"
      {...props}
    />
  )
}
export function ComboboxStatus({
  xstyle,
  className,
  ...props
}: ComboboxPrimitive.Status.Props & StyleXProps) {
  return (
    <ComboboxPrimitive.Status
      {...stylexProps(className, styles.status, xstyle)}
      data-slot="combobox-status"
      {...props}
    />
  )
}
export const ComboboxCollection: typeof ComboboxPrimitive.Collection =
  ComboboxPrimitive.Collection

export function ComboboxChips({
  xstyle,
  className,
  children,
  startAddon,
  ...props
}: ComboboxPrimitive.Chips.Props & {
  startAddon?: React.ReactNode
} & StyleXProps) {
  const { chipsRef } = React.useContext(ComboboxContext)
  return (
    <ComboboxPrimitive.Chips
      {...stylexProps(className, styles.chips, xstyle)}
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
  className,
  xstyle,
  children,
  removeProps,
  ...props
}: ComboboxPrimitive.Chip.Props & {
  removeProps?: ComboboxPrimitive.ChipRemove.Props
} & StyleXProps) {
  return (
    <ComboboxPrimitive.Chip
      {...stylexProps(className, styles.chip, xstyle)}
      data-slot="combobox-chip"
      {...props}
    >
      {children}
      <ComboboxChipRemove {...removeProps} />
    </ComboboxPrimitive.Chip>
  )
}
export function ComboboxChipRemove({
  className,
  xstyle,
  ...props
}: ComboboxPrimitive.ChipRemove.Props & StyleXProps) {
  return (
    <ComboboxPrimitive.ChipRemove
      aria-label="Remove"
      {...stylexProps(className, styles.chipRemove, xstyle)}
      data-slot="combobox-chip-remove"
      {...props}
    >
      <XIcon {...stylex.props(comboboxSlotStyles.icon)} />
    </ComboboxPrimitive.ChipRemove>
  )
}
export const useComboboxFilter: typeof ComboboxPrimitive.useFilter =
  ComboboxPrimitive.useFilter
export { ComboboxPrimitive }
