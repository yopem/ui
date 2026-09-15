"use client"

import type { StyleXProps } from "@registry/lib/stylex"
import type * as React from "react"

import { mergeProps } from "@base-ui/react/merge-props"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { useRender } from "@base-ui/react/use-render"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"
import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
} from "lucide-react"

export const selectSlotStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
  },
})

const styles = stylex.create({
  trigger: {
    lineHeight: {
      default: null,
      ':is([data-slot="group"] [data-slot="select-trigger"])': {
        default: "1.5rem",
        "@media (min-width: 640px)": "1.25rem",
      },
    },
    alignItems: "center",
    backgroundClip: "padding-box",
    backgroundColor: {
      default: tokens["--background"],
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "color-mix(in oklab, var(--input, transparent) 32%, transparent)",
    },
    borderColor: {
      default: tokens["--input"],
      ":focus-visible": tokens["--ring"],
      "[aria-invalid]":
        "color-mix(in oklab, var(--destructive, currentColor) 36%, transparent)",
    },
    borderRadius: tokens["--radius-lg"],
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: {
      default: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
      ":focus-visible": `0 0 0 3px color-mix(in oklab, var(--ring, currentColor) 24%, transparent)`,
      "[data-pressed]": "none",
    },
    color: tokens["--foreground"],
    display: "inline-flex",
    fontSize: {
      default: "1rem",
      "@media (min-width: 640px)": "0.875rem",
    },
    gap: "0.5rem",
    inlineSize: "100%",
    justifyContent: "space-between",
    minBlockSize: {
      default: "2.25rem",
      "@media (min-width: 640px)": "2rem",
    },
    minInlineSize: "9rem",
    outline: "none",
    paddingInline: "calc(0.75rem - 1px)",
    position: "relative",
    textAlign: "start",
    transitionProperty: "box-shadow",
    userSelect: "none",
    opacity: {
      default: null,
      "[data-disabled]": 0.64,
    },
    pointerEvents: {
      default: null,
      "[data-disabled]": "none",
    },
    "::before": {
      borderRadius: "calc(var(--radius-lg, 0.625rem) - 1px)",
      boxShadow: "0 1px rgb(0 0 0 / 0.04)",
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
    "::after": {
      content: {
        default: null,
        "@media (pointer: coarse)": '""',
      },
      minBlockSize: {
        default: null,
        "@media (pointer: coarse)": "2.75rem",
      },
      position: {
        default: null,
        "@media (pointer: coarse)": "absolute",
      },
      inlineSize: {
        default: null,
        "@media (pointer: coarse)": "100%",
      },
    },
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
    "[data-placeholder]": { color: tokens["--muted-foreground"] },
  },
  triggerIcon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    marginInlineEnd: "-0.25rem",
    opacity: 0.8,
  },
  positioner: { userSelect: "none", zIndex: 50 },
  popup: {
    color: tokens["--foreground"],
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
    backgroundColor: tokens["--popover"],
    blockSize: "100%",
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-lg"],
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
    minInlineSize: {
      default: null,
      ':is([data-slot="select-positioner"][data-side="none"] [data-slot="select-item"])':
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
  itemIndicator: { gridColumnStart: 1 },
  itemText: { gridColumnStart: 2, minInlineSize: 0 },
  separator: {
    backgroundColor: tokens["--border"],
    blockSize: 1,
    marginBlock: "0.25rem",
    marginInline: "0.5rem",
  },
  label: {
    marginBlockEnd: {
      default: null,
      ':not([data-slot="field"] *)': "0.5rem",
    },
    alignItems: "center",
    color: tokens["--foreground"],
    cursor: "default",
    display: "inline-flex",
    fontSize: {
      default: "1rem",
      "@media (min-width: 640px)": "0.875rem",
    },
    fontWeight: 500,
    gap: "0.5rem",
    lineHeight: {
      default: "1.125rem",
      "@media (min-width: 640px)": "1rem",
    },
  },
  groupLabel: {
    color: tokens["--muted-foreground"],
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

export interface SelectButtonProps
  extends StyleXProps, useRender.ComponentProps<"button"> {
  size?: SelectSize | null
}

export function SelectButton({
  xstyle,
  className,
  size,
  render,
  children,
  ...props
}: SelectButtonProps & StyleXProps) {
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] =
    render ? undefined : "button"
  const defaultProps = {
    children: (
      <>
        <span {...stylex.props(styles.buttonValue)}>{children}</span>
        <ChevronsUpDownIcon className={selectTriggerIconClassName} />
      </>
    ),
    ...stylexProps(
      className,
      styles.trigger,
      sizeStyles[size ?? "default"],
      styles.button,
      xstyle,
    ),
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
  xstyle,
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & { size?: SelectSize | null } & StyleXProps) {
  return (
    <SelectPrimitive.Trigger
      {...stylexProps(
        className,
        styles.trigger,
        sizeStyles[size ?? "default"],
        xstyle,
      )}
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
  xstyle,
  className,
  ...props
}: SelectPrimitive.Value.Props & StyleXProps) {
  return (
    <SelectPrimitive.Value
      {...stylexProps(className, styles.value, xstyle)}
      data-slot="select-value"
      {...props}
    />
  )
}

export function SelectPopup({
  xstyle,
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
} & StyleXProps) {
  return (
    <SelectPrimitive.Portal
      aria-label="Select options"
      role="region"
      {...portalProps}
    >
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
          {...stylexProps(
            typeof className === "function" ? className : undefined,
            styles.popup,
            xstyle,
          )}
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
              {...stylexProps(
                typeof className === "string" ? className : undefined,
                styles.list,
              )}
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
  xstyle,
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props & StyleXProps) {
  return (
    <SelectPrimitive.Item
      {...stylexProps(className, styles.item, xstyle)}
      data-slot="select-item"
      {...props}
    >
      <SelectPrimitive.ItemIndicator {...stylex.props(styles.itemIndicator)}>
        <svg
          {...stylex.props(selectSlotStyles.icon)}
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
  xstyle,
  className,
  ...props
}: SelectPrimitive.Separator.Props & StyleXProps) {
  return (
    <SelectPrimitive.Separator
      {...stylexProps(className, styles.separator, xstyle)}
      data-slot="select-separator"
      {...props}
    />
  )
}
export function SelectGroup(props: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}
export function SelectLabel({
  xstyle,
  className,
  ...props
}: SelectPrimitive.Label.Props & StyleXProps) {
  return (
    <SelectPrimitive.Label
      {...stylexProps(className, styles.label, xstyle)}
      data-slot="select-label"
      {...props}
    />
  )
}
export function SelectGroupLabel({
  className,
  xstyle,
  ...props
}: SelectPrimitive.GroupLabel.Props & StyleXProps) {
  return (
    <SelectPrimitive.GroupLabel
      {...stylexProps(className, styles.groupLabel, xstyle)}
      data-slot="select-group-label"
      {...props}
    />
  )
}

export { SelectPrimitive, SelectPopup as SelectContent }
