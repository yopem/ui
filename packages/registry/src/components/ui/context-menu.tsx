"use client"

import type * as React from "react"

import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { ChevronRightIcon } from "lucide-react"

const styles = stylex.create({
  positioner: { zIndex: 50 },
  popup: {
    backgroundClip: "padding-box",
    backgroundColor: tokens.popover,
    borderColor: tokens.border,
    borderRadius: tokens.radiusLarge,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 10px 15px -3px color-mix(in oklab, #000 5%, transparent)",
    display: "flex",
    minInlineSize: "8rem",
    outline: "none",
    position: "relative",
    transformOrigin: "var(--transform-origin)",
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
    ":focus": { outline: "none" },
  },
  popupViewport: {
    inlineSize: "100%",
    maxBlockSize: "var(--available-height)",
    overflowY: "auto",
    padding: "0.25rem",
  },
  item: {
    alignItems: "center",
    borderRadius: tokens.radiusSmall,
    color: tokens.foreground,
    cursor: "default",
    display: "flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    gap: "0.5rem",
    minBlockSize: { default: "2rem", "@media (min-width: 640px)": "1.75rem" },
    outline: "none",
    paddingBlock: "0.25rem",
    paddingInline: "0.5rem",
    userSelect: "none",
    "[data-highlighted]": {
      backgroundColor: tokens.accent,
      color: tokens.accentForeground,
    },
    "[data-variant=destructive]": { color: tokens.destructiveForeground },
    "[data-disabled]": { opacity: 0.64, pointerEvents: "none" },
    "[data-inset]": { paddingInlineStart: "2rem" },
  },
  choiceItem: {
    alignItems: "center",
    borderRadius: tokens.radiusSmall,
    color: tokens.foreground,
    cursor: "default",
    display: "grid",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    gap: "0.5rem",
    minBlockSize: { default: "2rem", "@media (min-width: 640px)": "1.75rem" },
    outline: "none",
    paddingBlock: "0.25rem",
    paddingInlineStart: "0.5rem",
    userSelect: "none",
    "[data-highlighted]": {
      backgroundColor: tokens.accent,
      color: tokens.accentForeground,
    },
    "[data-disabled]": { opacity: 0.64, pointerEvents: "none" },
  },
  choiceDefault: {
    gridTemplateColumns: "0.75rem 1fr",
    paddingInlineEnd: "1rem",
  },
  choiceSwitch: {
    columnGap: "1rem",
    gridTemplateColumns: "1fr auto",
    paddingInlineEnd: "0.375rem",
  },
  choiceContent: { gridColumnStart: 2 },
  choiceContentFirst: { gridColumnStart: 1 },
  indicator: { gridColumnStart: 1, marginInlineStart: "-0.125rem" },
  switch: {
    alignItems: "center",
    backgroundColor: tokens.input,
    blockSize: "calc(var(--thumb-size) + 2px)",
    borderRadius: "9999px",
    boxShadow: "inset 0 1px rgb(0 0 0 / 0.04)",
    display: "inline-flex",
    flexShrink: 0,
    inlineSize: "calc(var(--thumb-size) * 2 - 2px)",
    outline: "none",
    padding: 1,
    transitionDuration: "200ms",
    transitionProperty: "background-color, box-shadow",
    "--thumb-size": { default: "1rem", "@media (min-width: 640px)": "0.75rem" },
    ":focus-visible": {
      boxShadow: `0 0 0 2px ${tokens.ring}, 0 0 0 3px ${tokens.background}`,
    },
    "[data-checked]": { backgroundColor: tokens.primary },
    "[data-disabled]": { opacity: 0.64 },
  },
  switchThumb: {
    aspectRatio: "1",
    backgroundColor: tokens.background,
    blockSize: "100%",
    borderRadius: "var(--thumb-size)",
    boxShadow: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
    display: "block",
    pointerEvents: "none",
    transformOrigin: "left",
    transition:
      "translate .15s, border-radius .15s, scale .1s .1s, transform-origin .15s",
    willChange: "transform",
  },
  label: {
    color: tokens.mutedForeground,
    fontSize: "0.75rem",
    fontWeight: 500,
    paddingBlock: "0.375rem",
    paddingInline: "0.5rem",
    "[data-inset]": {
      paddingInlineStart: {
        default: "2.25rem",
        "@media (min-width: 640px)": "2rem",
      },
    },
  },
  separator: {
    backgroundColor: tokens.border,
    blockSize: 1,
    marginBlock: "0.25rem",
    marginInline: "0.5rem",
  },
  shortcut: {
    color:
      "color-mix(in oklab, var(--muted-foreground, currentColor) 72%, transparent)",
    fontFamily: tokens.fontSans,
    fontSize: "0.75rem",
    fontWeight: 500,
    letterSpacing: "0.1em",
    marginInlineStart: "auto",
  },
  subTrigger: {
    alignItems: "center",
    borderRadius: tokens.radiusSmall,
    color: tokens.foreground,
    display: "flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    gap: "0.5rem",
    minBlockSize: { default: "2rem", "@media (min-width: 640px)": "1.75rem" },
    outline: "none",
    paddingBlock: "0.25rem",
    paddingInline: "0.5rem",
    "[data-highlighted]": {
      backgroundColor: tokens.accent,
      color: tokens.accentForeground,
    },
    "[data-popup-open]": {
      backgroundColor: tokens.accent,
      color: tokens.accentForeground,
    },
    "[data-disabled]": { opacity: 0.64, pointerEvents: "none" },
    "[data-inset]": { paddingInlineStart: "2rem" },
  },
  subIcon: {
    marginInlineEnd: "-0.125rem",
    marginInlineStart: "auto",
    opacity: 0.8,
  },
})

export const ContextMenu: typeof ContextMenuPrimitive.Root =
  ContextMenuPrimitive.Root
export const ContextMenuPortal: typeof ContextMenuPrimitive.Portal =
  ContextMenuPrimitive.Portal

export function ContextMenuTrigger({
  className,
  children,
  ...props
}: ContextMenuPrimitive.Trigger.Props) {
  return (
    <ContextMenuPrimitive.Trigger
      className={className}
      data-slot="context-menu-trigger"
      {...props}
    >
      {children}
    </ContextMenuPrimitive.Trigger>
  )
}

export function ContextMenuPopup({
  children,
  className,
  sideOffset = 4,
  align = "center",
  alignOffset,
  side = "bottom",
  anchor,
  portalProps,
  ...props
}: ContextMenuPrimitive.Popup.Props & {
  align?: ContextMenuPrimitive.Positioner.Props["align"]
  sideOffset?: ContextMenuPrimitive.Positioner.Props["sideOffset"]
  alignOffset?: ContextMenuPrimitive.Positioner.Props["alignOffset"]
  side?: ContextMenuPrimitive.Positioner.Props["side"]
  anchor?: ContextMenuPrimitive.Positioner.Props["anchor"]
  portalProps?: ContextMenuPrimitive.Portal.Props
}) {
  return (
    <ContextMenuPortal {...portalProps}>
      <ContextMenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        {...stylex.props(styles.positioner)}
        data-slot="context-menu-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <ContextMenuPrimitive.Popup
          {...stylexProps(className, styles.popup)}
          data-slot="context-menu-popup"
          {...props}
        >
          <div {...stylex.props(styles.popupViewport)}>{children}</div>
        </ContextMenuPrimitive.Popup>
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPortal>
  )
}

export function ContextMenuGroup(props: ContextMenuPrimitive.Group.Props) {
  return (
    <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
  )
}

export function ContextMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: ContextMenuPrimitive.Item.Props & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <ContextMenuPrimitive.Item
      {...stylexProps(className, styles.item)}
      data-inset={inset}
      data-slot="context-menu-item"
      data-variant={variant}
      {...props}
    />
  )
}

export function ContextMenuLinkItem({
  className,
  inset,
  variant = "default",
  closeOnClick = true,
  ...props
}: ContextMenuPrimitive.LinkItem.Props & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <ContextMenuPrimitive.LinkItem
      {...stylexProps(className, styles.item)}
      closeOnClick={closeOnClick}
      data-inset={inset}
      data-slot="context-menu-link-item"
      data-variant={variant}
      {...props}
    />
  )
}

export function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  variant = "default",
  ...props
}: ContextMenuPrimitive.CheckboxItem.Props & {
  variant?: "default" | "switch"
}) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      checked={checked}
      {...stylexProps(
        className,
        styles.choiceItem,
        variant === "switch" ? styles.choiceSwitch : styles.choiceDefault,
      )}
      data-slot="context-menu-checkbox-item"
      data-variant={variant}
      {...props}
    >
      {variant === "switch" ? (
        <>
          <span {...stylex.props(styles.choiceContentFirst)}>{children}</span>
          <ContextMenuPrimitive.CheckboxItemIndicator
            {...stylex.props(styles.switch)}
            keepMounted
          >
            <span
              {...stylex.props(styles.switchThumb)}
              data-slot="context-menu-switch-thumb"
            />
          </ContextMenuPrimitive.CheckboxItemIndicator>
        </>
      ) : (
        <>
          <ContextMenuPrimitive.CheckboxItemIndicator
            {...stylex.props(styles.indicator)}
          >
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
          </ContextMenuPrimitive.CheckboxItemIndicator>
          <span {...stylex.props(styles.choiceContent)}>{children}</span>
        </>
      )}
    </ContextMenuPrimitive.CheckboxItem>
  )
}

export function ContextMenuRadioGroup(
  props: ContextMenuPrimitive.RadioGroup.Props,
) {
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      {...props}
    />
  )
}

export function ContextMenuRadioItem({
  className,
  children,
  ...props
}: ContextMenuPrimitive.RadioItem.Props) {
  return (
    <ContextMenuPrimitive.RadioItem
      {...stylexProps(className, styles.choiceItem, styles.choiceDefault)}
      data-slot="context-menu-radio-item"
      {...props}
    >
      <ContextMenuPrimitive.RadioItemIndicator
        {...stylex.props(styles.indicator)}
      >
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
      </ContextMenuPrimitive.RadioItemIndicator>
      <span {...stylex.props(styles.choiceContent)}>{children}</span>
    </ContextMenuPrimitive.RadioItem>
  )
}

export function ContextMenuGroupLabel({
  className,
  inset,
  ...props
}: ContextMenuPrimitive.GroupLabel.Props & { inset?: boolean }) {
  return (
    <ContextMenuPrimitive.GroupLabel
      {...stylexProps(className, styles.label)}
      data-inset={inset}
      data-slot="context-menu-label"
      {...props}
    />
  )
}
export function ContextMenuSeparator({
  className,
  ...props
}: ContextMenuPrimitive.Separator.Props) {
  return (
    <ContextMenuPrimitive.Separator
      {...stylexProps(className, styles.separator)}
      data-slot="context-menu-separator"
      {...props}
    />
  )
}
export function ContextMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"kbd">) {
  return (
    <kbd
      {...stylexProps(className, styles.shortcut)}
      data-slot="context-menu-shortcut"
      {...props}
    />
  )
}
export function ContextMenuSub(props: ContextMenuPrimitive.SubmenuRoot.Props) {
  return (
    <ContextMenuPrimitive.SubmenuRoot data-slot="context-menu-sub" {...props} />
  )
}
export function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: ContextMenuPrimitive.SubmenuTrigger.Props & { inset?: boolean }) {
  return (
    <ContextMenuPrimitive.SubmenuTrigger
      {...stylexProps(className, styles.subTrigger)}
      data-inset={inset}
      data-slot="context-menu-sub-trigger"
      {...props}
    >
      {children}
      <ChevronRightIcon {...stylex.props(styles.subIcon)} />
    </ContextMenuPrimitive.SubmenuTrigger>
  )
}
export function ContextMenuSubPopup({
  className,
  sideOffset = 0,
  alignOffset,
  align = "start",
  ...props
}: ContextMenuPrimitive.Popup.Props & {
  align?: ContextMenuPrimitive.Positioner.Props["align"]
  sideOffset?: ContextMenuPrimitive.Positioner.Props["sideOffset"]
  alignOffset?: ContextMenuPrimitive.Positioner.Props["alignOffset"]
}) {
  const defaultAlignOffset = align !== "center" ? -5 : undefined
  return (
    <ContextMenuPopup
      align={align}
      alignOffset={alignOffset ?? defaultAlignOffset}
      className={className}
      data-slot="context-menu-sub-content"
      side="inline-end"
      sideOffset={sideOffset}
      {...props}
    />
  )
}

export { ContextMenuPrimitive }
