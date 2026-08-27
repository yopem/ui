"use client"

import type * as React from "react"

import { mergeProps } from "@base-ui/react/merge-props"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { useRender } from "@base-ui/react/use-render"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"
import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
} from "lucide-react"

const styles = stylex.create({
  trigger: {
    alignItems: "center",
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
    color: tokens.foreground,
    display: "inline-flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    gap: "0.5rem",
    inlineSize: "100%",
    justifyContent: "space-between",
    minBlockSize: { default: "2.25rem", "@media (min-width: 640px)": "2rem" },
    minInlineSize: "9rem",
    outline: "none",
    paddingInline: "calc(0.75rem - 1px)",
    position: "relative",
    textAlign: "start",
    transitionProperty: "box-shadow",
    userSelect: "none",
    "::before": {
      borderRadius: "calc(var(--radius-lg, 0.625rem) - 1px)",
      boxShadow: "0 1px rgb(0 0 0 / 0.04)",
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
    "::after": {
      content: { default: null, "@media (pointer: coarse)": '""' },
      minBlockSize: { default: null, "@media (pointer: coarse)": "2.75rem" },
      position: { default: null, "@media (pointer: coarse)": "absolute" },
      inlineSize: { default: null, "@media (pointer: coarse)": "100%" },
    },
    ":focus-visible": {
      borderColor: tokens.ring,
      boxShadow: `0 0 0 3px color-mix(in oklab, var(--ring, currentColor) 24%, transparent)`,
    },
    "[aria-invalid]": {
      borderColor:
        "color-mix(in oklab, var(--destructive, currentColor) 36%, transparent)",
    },
    "[data-disabled]": { opacity: 0.64, pointerEvents: "none" },
    "[data-pressed]": { boxShadow: "none" },
  },
  triggerLarge: {
    minBlockSize: { default: "2.5rem", "@media (min-width: 640px)": "2.25rem" },
  },
  triggerSmall: {
    gap: "0.375rem",
    minBlockSize: { default: "2rem", "@media (min-width: 640px)": "1.75rem" },
    paddingInline: "calc(0.625rem - 1px)",
  },
  button: { minInlineSize: 0 },
  buttonValue: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  value: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    "[data-placeholder]": { color: tokens.mutedForeground },
  },
  triggerIcon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    marginInlineEnd: "-0.25rem",
    opacity: 0.8,
  },
  positioner: { userSelect: "none", zIndex: 50 },
  popup: {
    color: tokens.foreground,
    outline: "none",
    transformOrigin: "var(--transform-origin)",
  },
  scrollArrow: {
    alignItems: "center",
    blockSize: "1.5rem",
    cursor: "default",
    display: "flex",
    inlineSize: "100%",
    justifyContent: "center",
    position: "relative",
    zIndex: 50,
  },
  scrollUp: { insetBlockStart: 0 },
  scrollDown: { insetBlockEnd: 0 },
  arrowIcon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    position: "relative",
  },
  popupSurface: {
    backgroundClip: "padding-box",
    backgroundColor: tokens.popover,
    blockSize: "100%",
    borderColor: tokens.border,
    borderRadius: tokens.radiusLarge,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 10px 15px -3px color-mix(in oklab, #000 5%, transparent)",
    minInlineSize: "var(--anchor-width)",
    position: "relative",
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
  list: {
    maxBlockSize: "var(--available-height)",
    overflowY: "auto",
    padding: "0.25rem",
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
    "[data-highlighted]": {
      backgroundColor: tokens.accent,
      color: tokens.accentForeground,
    },
    "[data-disabled]": { opacity: 0.64, pointerEvents: "none" },
  },
  itemIndicator: { gridColumnStart: 1 },
  itemText: { gridColumnStart: 2, minInlineSize: 0 },
  separator: {
    backgroundColor: tokens.border,
    blockSize: 1,
    marginBlock: "0.25rem",
    marginInline: "0.5rem",
  },
  label: {
    alignItems: "center",
    color: tokens.foreground,
    cursor: "default",
    display: "inline-flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    fontWeight: 500,
    gap: "0.5rem",
    lineHeight: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
  },
  groupLabel: {
    color: tokens.mutedForeground,
    fontSize: "0.75rem",
    fontWeight: 500,
    paddingBlock: "0.375rem",
    paddingInline: "0.5rem",
  },
})

const sizeStyles = {
  default: null,
  lg: styles.triggerLarge,
  sm: styles.triggerSmall,
} as const
type SelectSize = keyof typeof sizeStyles

export const Select: typeof SelectPrimitive.Root = SelectPrimitive.Root

export function selectTriggerVariants({
  className,
  size = "default",
}: { className?: string; size?: SelectSize | null } = {}) {
  return clsx(
    stylex.props(styles.trigger, sizeStyles[size ?? "default"]).className,
    className,
  )
}

export const selectTriggerIconClassName = stylex.props(
  styles.triggerIcon,
).className

export interface SelectButtonProps extends useRender.ComponentProps<"button"> {
  size?: SelectSize | null
}

export function SelectButton({
  className,
  size,
  render,
  children,
  ...props
}: SelectButtonProps) {
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] =
    render ? undefined : "button"
  const defaultProps = {
    children: (
      <>
        <span {...stylex.props(styles.buttonValue)}>{children}</span>
        <ChevronsUpDownIcon className={selectTriggerIconClassName} />
      </>
    ),
    className: stylexProps(
      className,
      styles.trigger,
      sizeStyles[size ?? "default"],
      styles.button,
    ).className,
    "data-slot": "select-button",
    type: typeValue,
  }
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  })
}

export function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & { size?: SelectSize | null }) {
  return (
    <SelectPrimitive.Trigger
      {...stylexProps(className, styles.trigger, sizeStyles[size ?? "default"])}
      data-slot="select-trigger"
      {...props}
    >
      {children}
      <SelectPrimitive.Icon data-slot="select-icon">
        <ChevronsUpDownIcon className={selectTriggerIconClassName} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}
export function SelectValue({
  className,
  ...props
}: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      {...stylexProps(className, styles.value)}
      data-slot="select-value"
      {...props}
    />
  )
}

export function SelectPopup({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = true,
  anchor,
  portalProps,
  ...props
}: SelectPrimitive.Popup.Props & {
  portalProps?: SelectPrimitive.Portal.Props
  side?: SelectPrimitive.Positioner.Props["side"]
  sideOffset?: SelectPrimitive.Positioner.Props["sideOffset"]
  align?: SelectPrimitive.Positioner.Props["align"]
  alignOffset?: SelectPrimitive.Positioner.Props["alignOffset"]
  alignItemWithTrigger?: SelectPrimitive.Positioner.Props["alignItemWithTrigger"]
  anchor?: SelectPrimitive.Positioner.Props["anchor"]
}) {
  return (
    <SelectPrimitive.Portal {...portalProps}>
      <SelectPrimitive.Positioner
        align={align}
        alignItemWithTrigger={alignItemWithTrigger}
        alignOffset={alignOffset}
        anchor={anchor}
        {...stylex.props(styles.positioner)}
        data-slot="select-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <SelectPrimitive.Popup
          {...stylex.props(styles.popup)}
          data-slot="select-popup"
          {...props}
        >
          <SelectPrimitive.ScrollUpArrow
            {...stylex.props(styles.scrollArrow, styles.scrollUp)}
            data-slot="select-scroll-up-arrow"
          >
            <ChevronUpIcon {...stylex.props(styles.arrowIcon)} />
          </SelectPrimitive.ScrollUpArrow>
          <div {...stylex.props(styles.popupSurface)}>
            <SelectPrimitive.List
              {...stylexProps(className, styles.list)}
              data-slot="select-list"
            >
              {children}
            </SelectPrimitive.List>
          </div>
          <SelectPrimitive.ScrollDownArrow
            {...stylex.props(styles.scrollArrow, styles.scrollDown)}
            data-slot="select-scroll-down-arrow"
          >
            <ChevronDownIcon {...stylex.props(styles.arrowIcon)} />
          </SelectPrimitive.ScrollDownArrow>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      {...stylexProps(className, styles.item)}
      data-slot="select-item"
      {...props}
    >
      <SelectPrimitive.ItemIndicator {...stylex.props(styles.itemIndicator)}>
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
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText {...stylex.props(styles.itemText)}>
        {children}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
export function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      {...stylexProps(className, styles.separator)}
      data-slot="select-separator"
      {...props}
    />
  )
}
export function SelectGroup(props: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}
export function SelectLabel({
  className,
  ...props
}: SelectPrimitive.Label.Props) {
  return (
    <SelectPrimitive.Label
      {...stylexProps(className, styles.label)}
      data-slot="select-label"
      {...props}
    />
  )
}
export function SelectGroupLabel(props: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      {...stylex.props(styles.groupLabel)}
      data-slot="select-group-label"
      {...props}
    />
  )
}

export { SelectPrimitive, SelectPopup as SelectContent }
