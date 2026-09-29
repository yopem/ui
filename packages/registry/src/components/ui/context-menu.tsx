"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type * as React from "react"

import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
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
      ':is([data-slot="context-menu-checkbox-item"]:active [data-slot="context-menu-switch-thumb"])':
        "calc(var(--thumb-size) / (var(--thumb-size) * 1.1))",
    },
    scale: {
      default: null,
      ':is([data-slot="context-menu-checkbox-item"]:active [data-slot="context-menu-switch-thumb"])':
        "1.1 1",
    },
    transformOrigin: {
      default: "left",
      ':is([data-slot="context-menu-checkbox-item"][data-checked] [data-slot="context-menu-switch-thumb"])':
        "var(--thumb-size) 50%",
    },
    translate: {
      default: null,
      ':is([data-slot="context-menu-checkbox-item"][data-checked] [data-slot="context-menu-switch-thumb"])':
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
    color: tokens["--muted-foreground"],
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
}: StyleXComponentProps<React.ComponentProps<"kbd">>) {
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
