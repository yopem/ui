"use client"

import type { StyleXProps } from "@registry/lib/stylex"
import type * as React from "react"

import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { ChevronRightIcon } from "lucide-react"

export const menuSlotStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
  },
  itemIcon: { marginInline: "-0.125rem", opacity: 0.8 },
})

const styles = stylex.create({
  positioner: { zIndex: 50 },
  popup: {
    backgroundClip: "padding-box",
    backgroundColor: tokens["--popover"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-lg"],
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
    borderRadius: tokens["--radius-sm"],
    color: tokens["--foreground"],
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
      backgroundColor: tokens["--accent"],
      color: tokens["--accent-foreground"],
    },
    "[data-variant=destructive]": { color: tokens["--destructive-foreground"] },
    "[data-disabled]": { opacity: 0.64, pointerEvents: "none" },
    "[data-inset]": { paddingInlineStart: "2rem" },
  },
  choiceItem: {
    alignItems: "center",
    borderRadius: tokens["--radius-sm"],
    color: tokens["--foreground"],
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
      backgroundColor: tokens["--accent"],
      color: tokens["--accent-foreground"],
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
    backgroundColor: tokens["--input"],
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
      boxShadow: `0 0 0 2px ${tokens["--ring"]}, 0 0 0 3px ${tokens["--background"]}`,
    },
    "[data-checked]": { backgroundColor: tokens["--primary"] },
    "[data-disabled]": { opacity: 0.64 },
  },
  switchThumb: {
    borderRadius: {
      default: "var(--thumb-size)",
      ':is([data-slot="menu-checkbox-item"]:active [data-slot="menu-switch-thumb"])':
        "calc(var(--thumb-size) / (var(--thumb-size) * 1.1))",
    },
    scale: {
      default: null,
      ':is([data-slot="menu-checkbox-item"]:active [data-slot="menu-switch-thumb"])':
        "1.1 1",
    },
    transformOrigin: {
      default: "left",
      ':is([data-slot="menu-checkbox-item"][data-checked] [data-slot="menu-switch-thumb"])':
        "var(--thumb-size) 50%",
    },
    translate: {
      default: null,
      ':is([data-slot="menu-checkbox-item"][data-checked] [data-slot="menu-switch-thumb"])':
        "calc(var(--thumb-size) - 4px) 0",
    },
    aspectRatio: "1",
    backgroundColor: tokens["--background"],
    blockSize: "100%",
    boxShadow: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
    display: "block",
    pointerEvents: "none",
    transition:
      "translate .15s, border-radius .15s, scale .1s .1s, transform-origin .15s",
    willChange: "transform",
  },
  label: {
    color: tokens["--muted-foreground"],
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
    backgroundColor: tokens["--border"],
    blockSize: 1,
    marginBlock: "0.25rem",
    marginInline: "0.5rem",
  },
  shortcut: {
    color:
      "color-mix(in oklab, var(--muted-foreground, currentColor) 72%, transparent)",
    fontFamily: tokens["--font-sans"],
    fontSize: "0.75rem",
    fontWeight: 500,
    letterSpacing: "0.1em",
    marginInlineStart: "auto",
  },
  subTrigger: {
    alignItems: "center",
    borderRadius: tokens["--radius-sm"],
    color: tokens["--foreground"],
    display: "flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    gap: "0.5rem",
    minBlockSize: { default: "2rem", "@media (min-width: 640px)": "1.75rem" },
    outline: "none",
    paddingBlock: "0.25rem",
    paddingInline: "0.5rem",
    "[data-highlighted]": {
      backgroundColor: tokens["--accent"],
      color: tokens["--accent-foreground"],
    },
    "[data-popup-open]": {
      backgroundColor: tokens["--accent"],
      color: tokens["--accent-foreground"],
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

export const MenuCreateHandle: typeof MenuPrimitive.createHandle =
  MenuPrimitive.createHandle
export const Menu: typeof MenuPrimitive.Root = MenuPrimitive.Root
export const MenuPortal: typeof MenuPrimitive.Portal = MenuPrimitive.Portal

export function MenuTrigger({
  xstyle,
  className,
  children,
  ...props
}: MenuPrimitive.Trigger.Props & StyleXProps) {
  return (
    <MenuPrimitive.Trigger
      {...stylexProps(className, xstyle)}
      data-slot="menu-trigger"
      {...props}
    >
      {children}
    </MenuPrimitive.Trigger>
  )
}

export function MenuPopup({
  xstyle,
  children,
  className,
  sideOffset = 4,
  align = "center",
  alignOffset,
  side = "bottom",
  anchor,
  portalProps,
  ...props
}: MenuPrimitive.Popup.Props & {
  align?: MenuPrimitive.Positioner.Props["align"]
  sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"]
  alignOffset?: MenuPrimitive.Positioner.Props["alignOffset"]
  side?: MenuPrimitive.Positioner.Props["side"]
  anchor?: MenuPrimitive.Positioner.Props["anchor"]
  portalProps?: MenuPrimitive.Portal.Props
} & StyleXProps) {
  return (
    <MenuPortal {...portalProps}>
      <MenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        {...stylex.props(styles.positioner)}
        data-slot="menu-positioner"
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          {...stylexProps(className, styles.popup, xstyle)}
          data-slot="menu-popup"
          {...props}
        >
          <div {...stylex.props(styles.popupViewport)}>{children}</div>
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPortal>
  )
}

export function MenuGroup(props: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="menu-group" {...props} />
}

export function MenuItem({
  xstyle,
  className,
  inset,
  variant = "default",
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean
  variant?: "default" | "destructive"
} & StyleXProps) {
  return (
    <MenuPrimitive.Item
      {...stylexProps(className, styles.item, xstyle)}
      data-inset={inset}
      data-slot="menu-item"
      data-variant={variant}
      {...props}
    />
  )
}

export function MenuLinkItem({
  xstyle,
  className,
  inset,
  variant = "default",
  closeOnClick = true,
  ...props
}: MenuPrimitive.LinkItem.Props & {
  inset?: boolean
  variant?: "default" | "destructive"
} & StyleXProps) {
  return (
    <MenuPrimitive.LinkItem
      {...stylexProps(className, styles.item, xstyle)}
      closeOnClick={closeOnClick}
      data-inset={inset}
      data-slot="menu-link-item"
      data-variant={variant}
      {...props}
    />
  )
}

export function MenuCheckboxItem({
  xstyle,
  className,
  children,
  checked,
  variant = "default",
  ...props
}: MenuPrimitive.CheckboxItem.Props & {
  variant?: "default" | "switch"
} & StyleXProps) {
  return (
    <MenuPrimitive.CheckboxItem
      checked={checked}
      {...stylexProps(
        className,
        styles.choiceItem,
        variant === "switch" ? styles.choiceSwitch : styles.choiceDefault,
        xstyle,
      )}
      data-slot="menu-checkbox-item"
      data-variant={variant}
      {...props}
    >
      {variant === "switch" ? (
        <>
          <span {...stylex.props(styles.choiceContentFirst)}>{children}</span>
          <MenuPrimitive.CheckboxItemIndicator
            {...stylex.props(styles.switch)}
            keepMounted
          >
            <span
              {...stylex.props(styles.switchThumb)}
              data-slot="menu-switch-thumb"
            />
          </MenuPrimitive.CheckboxItemIndicator>
        </>
      ) : (
        <>
          <MenuPrimitive.CheckboxItemIndicator
            {...stylex.props(styles.indicator)}
          >
            <svg
              {...stylex.props(menuSlotStyles.icon)}
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
          </MenuPrimitive.CheckboxItemIndicator>
          <span {...stylex.props(styles.choiceContent)}>{children}</span>
        </>
      )}
    </MenuPrimitive.CheckboxItem>
  )
}

export function MenuRadioGroup(props: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="menu-radio-group" {...props} />
}

export function MenuRadioItem({
  xstyle,
  className,
  children,
  ...props
}: MenuPrimitive.RadioItem.Props & StyleXProps) {
  return (
    <MenuPrimitive.RadioItem
      {...stylexProps(
        className,
        styles.choiceItem,
        styles.choiceDefault,
        xstyle,
      )}
      data-slot="menu-radio-item"
      {...props}
    >
      <MenuPrimitive.RadioItemIndicator {...stylex.props(styles.indicator)}>
        <svg
          {...stylex.props(menuSlotStyles.icon)}
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
      </MenuPrimitive.RadioItemIndicator>
      <span {...stylex.props(styles.choiceContent)}>{children}</span>
    </MenuPrimitive.RadioItem>
  )
}

export function MenuGroupLabel({
  xstyle,
  className,
  inset,
  ...props
}: MenuPrimitive.GroupLabel.Props & { inset?: boolean } & StyleXProps) {
  return (
    <MenuPrimitive.GroupLabel
      {...stylexProps(className, styles.label, xstyle)}
      data-inset={inset}
      data-slot="menu-label"
      {...props}
    />
  )
}
export function MenuSeparator({
  xstyle,
  className,
  ...props
}: MenuPrimitive.Separator.Props & StyleXProps) {
  return (
    <MenuPrimitive.Separator
      {...stylexProps(className, styles.separator, xstyle)}
      data-slot="menu-separator"
      {...props}
    />
  )
}
export function MenuShortcut({
  xstyle,
  className,
  ...props
}: React.ComponentProps<"kbd"> & StyleXProps) {
  return (
    <kbd
      {...stylexProps(className, styles.shortcut, xstyle)}
      data-slot="menu-shortcut"
      {...props}
    />
  )
}
export function MenuSub(props: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="menu-sub" {...props} />
}
export function MenuSubTrigger({
  xstyle,
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & { inset?: boolean } & StyleXProps) {
  return (
    <MenuPrimitive.SubmenuTrigger
      {...stylexProps(className, styles.subTrigger, xstyle)}
      data-inset={inset}
      data-slot="menu-sub-trigger"
      {...props}
    >
      {children}
      <ChevronRightIcon
        {...stylex.props(menuSlotStyles.icon, styles.subIcon)}
      />
    </MenuPrimitive.SubmenuTrigger>
  )
}
export function MenuSubPopup({
  xstyle,
  className,
  sideOffset = 0,
  alignOffset,
  align = "start",
  ...props
}: MenuPrimitive.Popup.Props & {
  align?: MenuPrimitive.Positioner.Props["align"]
  sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"]
  alignOffset?: MenuPrimitive.Positioner.Props["alignOffset"]
} & StyleXProps) {
  const defaultAlignOffset = align !== "center" ? -5 : undefined
  return (
    <MenuPopup
      align={align}
      alignOffset={alignOffset ?? defaultAlignOffset}
      className={className}
      xstyle={xstyle}
      data-slot="menu-sub-content"
      side="inline-end"
      sideOffset={sideOffset}
      {...props}
    />
  )
}

export {
  MenuPrimitive,
  MenuCreateHandle as DropdownMenuCreateHandle,
  Menu as DropdownMenu,
  MenuPortal as DropdownMenuPortal,
  MenuTrigger as DropdownMenuTrigger,
  MenuPopup as DropdownMenuContent,
  MenuGroup as DropdownMenuGroup,
  MenuItem as DropdownMenuItem,
  MenuCheckboxItem as DropdownMenuCheckboxItem,
  MenuRadioGroup as DropdownMenuRadioGroup,
  MenuRadioItem as DropdownMenuRadioItem,
  MenuGroupLabel as DropdownMenuLabel,
  MenuSeparator as DropdownMenuSeparator,
  MenuShortcut as DropdownMenuShortcut,
  MenuSub as DropdownMenuSub,
  MenuSubTrigger as DropdownMenuSubTrigger,
  MenuSubPopup as DropdownMenuSubContent,
}
