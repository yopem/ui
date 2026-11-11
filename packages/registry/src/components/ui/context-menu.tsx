"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { ChevronRightIcon } from "lucide-react"

export const contextMenuSlotStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
  },
})

const styles = stylex.create({
  positioner: { zIndex: 50 },
  popup: {
    backgroundClip: "padding-box",
    backgroundColor: tokens["--popover"],
    borderRadius: tokens["--radius"],
    boxShadow: tokens["--shadow-md"],
    display: "flex",
    minInlineSize: "8rem",
    outline: "none",
    position: "relative",
    transformOrigin: "var(--transform-origin)",
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
    color: tokens["--popover-foreground"],
    cursor: "default",
    display: "flex",
    fontSize: "0.875rem",
    gap: "0.5rem",
    minBlockSize: { default: "2rem", "@media (pointer: coarse)": "2.75rem" },
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
    color: tokens["--popover-foreground"],
    cursor: "default",
    display: "grid",
    fontSize: "0.875rem",
    gap: "0.5rem",
    minBlockSize: { default: "2rem", "@media (pointer: coarse)": "2.75rem" },
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
  indicator: {
    color: tokens["--accent-solid"],
    gridColumnStart: 1,
    marginInlineStart: "-0.125rem",
  },
  switch: {
    alignItems: "center",
    backgroundColor: tokens["--accent"],
    blockSize: "18px",
    borderColor: "transparent",
    borderRadius: "9999px",
    borderStyle: "solid",
    borderWidth: 2,
    display: "inline-flex",
    flexShrink: 0,
    inlineSize: "37px",
    transition: "background-color .2s",
    "[data-checked]": { backgroundColor: tokens["--accent-solid"] },
  },
  switchThumb: {
    backgroundColor: {
      default: tokens["--muted-foreground"],
      ':is([data-slot="context-menu-checkbox-item"][data-checked] [data-slot="context-menu-switch-thumb"])':
        tokens["--accent-solid-foreground"],
    },
    blockSize: "8px",
    inlineSize: "8px",
    borderRadius: "9999px",
    boxShadow: tokens["--shadow-sm"],
    display: "block",
    pointerEvents: "none",
    transform: {
      default: "translateX(4px)",
      ':is([data-slot="context-menu-checkbox-item"][data-checked] [data-slot="context-menu-switch-thumb"])':
        "translateX(22px)",
      ":dir(rtl)": "translateX(-4px)",
      ':is([data-slot="context-menu-checkbox-item"][data-checked] [data-slot="context-menu-switch-thumb"]):dir(rtl)':
        "translateX(-22px)",
    },
    transition: "transform .15s",
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
    backgroundColor: tokens["--card-border"],
    blockSize: 1,
    marginBlock: "0.25rem",
    marginInline: "0.5rem",
  },
  shortcut: {
    color: tokens["--muted-foreground"],
    fontFamily: tokens["--font-mono"],
    fontSize: "0.75rem",
    fontWeight: 500,
    marginInlineStart: "auto",
  },
  subTrigger: {
    alignItems: "center",
    borderRadius: tokens["--radius-sm"],
    color: tokens["--popover-foreground"],
    display: "flex",
    fontSize: "0.875rem",
    gap: "0.5rem",
    minBlockSize: { default: "2rem", "@media (pointer: coarse)": "2.75rem" },
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

export const ContextMenu: typeof ContextMenuPrimitive.Root =
  ContextMenuPrimitive.Root

export const ContextMenuPortal: typeof ContextMenuPrimitive.Portal =
  ContextMenuPrimitive.Portal

export function ContextMenuTrigger({
  xstyle: consumerXstyle,
  className,
  children,
  ...restProps
}: StyleXComponentProps<ContextMenuPrimitive.Trigger.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ContextMenuPrimitive.Trigger
      data-slot="context-menu-trigger"
      tabIndex={0}
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    >
      {children}
    </ContextMenuPrimitive.Trigger>
  )
}

export function ContextMenuPopup({
  xstyle: consumerXstyle,
  children,
  className,
  sideOffset = 4,
  align = "center",
  alignOffset,
  side = "bottom",
  anchor,
  portalProps,
  ...restProps
}: StyleXComponentProps<
  ContextMenuPrimitive.Popup.Props,
  {
    align?: ContextMenuPrimitive.Positioner.Props["align"]
    sideOffset?: ContextMenuPrimitive.Positioner.Props["sideOffset"]
    alignOffset?: ContextMenuPrimitive.Positioner.Props["alignOffset"]
    side?: ContextMenuPrimitive.Positioner.Props["side"]
    anchor?: ContextMenuPrimitive.Positioner.Props["anchor"]
    portalProps?: ContextMenuPrimitive.Portal.Props
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

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
          data-slot="context-menu-popup"
          {...mergeStylexProps(
            stylexProps(className, styles.popup, xstyle),
            props,
          )}
        >
          <div {...stylex.props(styles.popupViewport)}>{children}</div>
        </ContextMenuPrimitive.Popup>
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPortal>
  )
}

export function ContextMenuGroup({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ContextMenuPrimitive.Group.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ContextMenuPrimitive.Group
      data-slot="context-menu-group"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function ContextMenuItem({
  xstyle: consumerXstyle,
  className,
  inset,
  variant = "default",
  ...restProps
}: StyleXComponentProps<
  ContextMenuPrimitive.Item.Props,
  {
    inset?: boolean
    variant?: "default" | "destructive"
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ContextMenuPrimitive.Item
      data-inset={inset}
      data-slot="context-menu-item"
      data-variant={variant}
      {...mergeStylexProps(stylexProps(className, styles.item, xstyle), props)}
    />
  )
}

export function ContextMenuLinkItem({
  xstyle: consumerXstyle,
  className,
  inset,
  variant = "default",
  closeOnClick = true,
  ...restProps
}: StyleXComponentProps<
  ContextMenuPrimitive.LinkItem.Props,
  {
    inset?: boolean
    variant?: "default" | "destructive"
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ContextMenuPrimitive.LinkItem
      closeOnClick={closeOnClick}
      data-inset={inset}
      data-slot="context-menu-link-item"
      data-variant={variant}
      {...mergeStylexProps(stylexProps(className, styles.item, xstyle), props)}
    />
  )
}

export function ContextMenuCheckboxItem({
  xstyle: consumerXstyle,
  className,
  children,
  checked,
  variant = "default",
  ...restProps
}: StyleXComponentProps<
  ContextMenuPrimitive.CheckboxItem.Props,
  {
    variant?: "default" | "switch"
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ContextMenuPrimitive.CheckboxItem
      checked={checked}
      data-slot="context-menu-checkbox-item"
      data-variant={variant}
      {...mergeStylexProps(
        stylexProps(
          className,
          styles.choiceItem,
          variant === "switch" ? styles.choiceSwitch : styles.choiceDefault,
          xstyle,
        ),
        props,
      )}
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
              {...stylex.props(contextMenuSlotStyles.icon)}
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

export function ContextMenuRadioGroup({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ContextMenuPrimitive.RadioGroup.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export function ContextMenuRadioItem({
  xstyle: consumerXstyle,
  className,
  children,
  ...restProps
}: StyleXComponentProps<ContextMenuPrimitive.RadioItem.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      {...mergeStylexProps(
        stylexProps(className, styles.choiceItem, styles.choiceDefault, xstyle),
        props,
      )}
    >
      <ContextMenuPrimitive.RadioItemIndicator
        {...stylex.props(styles.indicator)}
      >
        <svg
          {...stylex.props(contextMenuSlotStyles.icon)}
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
  xstyle: consumerXstyle,
  className,
  inset,
  ...restProps
}: StyleXComponentProps<
  ContextMenuPrimitive.GroupLabel.Props,
  { inset?: boolean }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ContextMenuPrimitive.GroupLabel
      data-inset={inset}
      data-slot="context-menu-label"
      {...mergeStylexProps(stylexProps(className, styles.label, xstyle), props)}
    />
  )
}

export function ContextMenuSeparator({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ContextMenuPrimitive.Separator.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      {...mergeStylexProps(
        stylexProps(className, styles.separator, xstyle),
        props,
      )}
    />
  )
}

export function ContextMenuShortcut({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<ComponentProps<"kbd">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <kbd
      data-slot="context-menu-shortcut"
      {...mergeStylexProps(
        stylexProps(className, styles.shortcut, xstyle),
        props,
      )}
    />
  )
}

export function ContextMenuSub(props: ContextMenuPrimitive.SubmenuRoot.Props) {
  return (
    <ContextMenuPrimitive.SubmenuRoot data-slot="context-menu-sub" {...props} />
  )
}

export function ContextMenuSubTrigger({
  xstyle: consumerXstyle,
  className,
  inset,
  children,
  ...restProps
}: StyleXComponentProps<
  ContextMenuPrimitive.SubmenuTrigger.Props,
  {
    inset?: boolean
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ContextMenuPrimitive.SubmenuTrigger
      data-inset={inset}
      data-slot="context-menu-sub-trigger"
      {...mergeStylexProps(
        stylexProps(className, styles.subTrigger, xstyle),
        props,
      )}
    >
      {children}
      <ChevronRightIcon
        {...stylex.props(contextMenuSlotStyles.icon, styles.subIcon)}
      />
    </ContextMenuPrimitive.SubmenuTrigger>
  )
}

export function ContextMenuSubPopup({
  xstyle: consumerXstyle,
  className,
  sideOffset = 0,
  alignOffset,
  align = "start",
  ...restProps
}: StyleXComponentProps<
  ContextMenuPrimitive.Popup.Props,
  {
    align?: ContextMenuPrimitive.Positioner.Props["align"]
    sideOffset?: ContextMenuPrimitive.Positioner.Props["sideOffset"]
    alignOffset?: ContextMenuPrimitive.Positioner.Props["alignOffset"]
  }
>) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultAlignOffset = align !== "center" ? -5 : undefined

  return (
    <ContextMenuPopup
      align={align}
      alignOffset={alignOffset ?? defaultAlignOffset}
      className={className}
      xstyle={xstyle}
      data-slot="context-menu-sub-content"
      side="inline-end"
      sideOffset={sideOffset}
      {...props}
    />
  )
}

export { ContextMenuPrimitive }
