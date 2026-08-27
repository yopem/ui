"use client"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { Button } from "@registry/components/ui/button"
import { Input } from "@registry/components/ui/input"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import { Separator } from "@registry/components/ui/separator"
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@registry/components/ui/sheet"
import { Skeleton } from "@registry/components/ui/skeleton"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@registry/components/ui/tooltip"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { PanelLeftIcon } from "lucide-react"
import * as React from "react"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

const styles = stylex.create({
  wrapper: { display: "flex", inlineSize: "100%", minBlockSize: "100svh" },
  staticSidebar: {
    backgroundColor: tokens.sidebar,
    blockSize: "100%",
    color: tokens.sidebarForeground,
    display: "flex",
    flexDirection: "column",
    inlineSize: "var(--sidebar-width)",
  },
  mobilePopup: {
    backgroundColor: tokens.sidebar,
    color: tokens.sidebarForeground,
    inlineSize: "var(--sidebar-width)",
    padding: 0,
  },
  visuallyHidden: {
    blockSize: 1,
    clip: "rect(0, 0, 0, 0)",
    clipPath: "inset(50%)",
    inlineSize: 1,
    margin: -1,
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    whiteSpace: "nowrap",
  },
  mobileContent: {
    blockSize: "100%",
    display: "flex",
    flexDirection: "column",
    inlineSize: "100%",
  },
  desktopRoot: {
    color: tokens.sidebarForeground,
    display: "none",
    "@media (min-width: 800px)": { display: "block" },
  },
  gap: {
    backgroundColor: "transparent",
    inlineSize: "var(--sidebar-width)",
    position: "relative",
    transitionDuration: "200ms",
    transitionProperty: "width",
    transitionTimingFunction: "linear",
  },
  container: {
    blockSize: "100svh",
    display: "none",
    inlineSize: "var(--sidebar-width)",
    insetBlock: 0,
    position: "fixed",
    transitionDuration: "200ms",
    transitionProperty: "left, right, width",
    transitionTimingFunction: "linear",
    zIndex: 10,
    "@media (min-width: 800px)": { display: "flex" },
  },
  left: { insetInlineStart: 0 },
  right: { insetInlineEnd: 0 },
  padded: { padding: "0.5rem" },
  inner: {
    backgroundColor: tokens.sidebar,
    blockSize: "100%",
    display: "flex",
    flexDirection: "column",
    inlineSize: "100%",
  },
  trigger: { blockSize: "1.75rem", inlineSize: "1.75rem" },
  rail: {
    blockSize: "auto",
    display: "none",
    inlineSize: "1rem",
    insetBlock: 0,
    position: "absolute",
    transform: "translateX(-50%)",
    transitionProperty: "all",
    transitionTimingFunction: "linear",
    zIndex: 20,
    "::after": {
      blockSize: "100%",
      content: '""',
      inlineSize: 2,
      insetBlock: 0,
      insetInlineStart: "50%",
      position: "absolute",
    },
    "@media (min-width: 640px)": { display: "flex" },
    ":hover": { "::after": { backgroundColor: tokens.sidebarBorder } },
  },
  inset: {
    backgroundColor: tokens.background,
    display: "flex",
    flex: 1,
    flexDirection: "column",
    inlineSize: "100%",
    position: "relative",
  },
  input: {
    backgroundColor: tokens.background,
    blockSize: "2rem",
    boxShadow: "none",
    inlineSize: "100%",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "0.5rem",
  },
  separator: {
    backgroundColor: tokens.sidebarBorder,
    inlineSize: "auto",
    marginInline: "0.5rem",
  },
  scrollArea: { flex: 1, minBlockSize: 0 },
  content: {
    blockSize: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  group: {
    display: "flex",
    flexDirection: "column",
    inlineSize: "100%",
    minInlineSize: 0,
    padding: "0.5rem",
    position: "relative",
  },
  groupLabel: {
    alignItems: "center",
    blockSize: "2rem",
    color: tokens.sidebarForeground,
    display: "flex",
    flexShrink: 0,
    fontSize: "0.75rem",
    fontWeight: 500,
    outline: "none",
    paddingInline: "0.5rem",
    transitionDuration: "200ms",
    transitionProperty: "margin, opacity",
    transitionTimingFunction: "linear",
    ":focus-visible": { boxShadow: `0 0 0 2px ${tokens.sidebarRing}` },
  },
  groupAction: {
    alignItems: "center",
    aspectRatio: "1",
    color: tokens.sidebarForeground,
    display: "flex",
    inlineSize: "1.25rem",
    insetBlockStart: "0.875rem",
    insetInlineEnd: "0.75rem",
    justifyContent: "center",
    outline: "none",
    padding: 0,
    position: "absolute",
    transitionProperty: "transform",
    ":hover": {
      backgroundColor: tokens.sidebarAccent,
      color: tokens.sidebarAccentForeground,
    },
    ":focus-visible": { boxShadow: `0 0 0 2px ${tokens.sidebarRing}` },
    "::after": {
      content: '""',
      inset: "-0.5rem",
      position: "absolute",
      "@media (min-width: 800px)": { display: "none" },
    },
  },
  groupContent: { fontSize: "0.875rem", inlineSize: "100%" },
  menu: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    inlineSize: "100%",
    minInlineSize: 0,
  },
  menuItem: { position: "relative" },
  menuButton: {
    alignItems: "center",
    borderRadius: tokens.radiusLarge,
    color: tokens.sidebarForeground,
    display: "flex",
    gap: "0.5rem",
    inlineSize: "100%",
    overflow: "hidden",
    outline: "none",
    padding: "0.5rem",
    textAlign: "start",
    transitionProperty: "width, height, padding",
    ":hover": {
      backgroundColor: tokens.sidebarAccent,
      color: tokens.sidebarAccentForeground,
    },
    ":active": {
      backgroundColor: tokens.sidebarAccent,
      color: tokens.sidebarAccentForeground,
    },
    ":focus-visible": { boxShadow: `0 0 0 2px ${tokens.sidebarRing}` },
    ":disabled": { opacity: 0.5, pointerEvents: "none" },
    "[aria-disabled=true]": { opacity: 0.5, pointerEvents: "none" },
    "[data-active=true]": {
      backgroundColor: tokens.sidebarAccent,
      color: tokens.sidebarAccentForeground,
      fontWeight: 500,
    },
  },
  menuButtonDefault: { blockSize: "2rem", fontSize: "0.875rem" },
  menuButtonLarge: { blockSize: "3rem", fontSize: "0.875rem" },
  menuButtonSmall: { blockSize: "1.75rem", fontSize: "0.75rem" },
  menuButtonOutline: {
    backgroundColor: tokens.background,
    boxShadow: `0 0 0 1px ${tokens.sidebarBorder}`,
    ":hover": { boxShadow: `0 0 0 1px ${tokens.sidebarAccent}` },
  },
  menuAction: {
    alignItems: "center",
    aspectRatio: "1",
    color: tokens.sidebarForeground,
    display: "flex",
    inlineSize: "1.25rem",
    insetBlockStart: "0.375rem",
    insetInlineEnd: "0.25rem",
    justifyContent: "center",
    outline: "none",
    padding: 0,
    position: "absolute",
    transitionProperty: "transform",
    ":hover": {
      backgroundColor: tokens.sidebarAccent,
      color: tokens.sidebarAccentForeground,
    },
    ":focus-visible": { boxShadow: `0 0 0 2px ${tokens.sidebarRing}` },
    "::after": {
      content: '""',
      inset: "-0.5rem",
      position: "absolute",
      "@media (min-width: 800px)": { display: "none" },
    },
  },
  menuActionHover: {
    opacity: { default: 1, "@media (min-width: 800px)": 0 },
    ":focus-within": { opacity: 1 },
    ":hover": { opacity: 1 },
    "[data-state=open]": { opacity: 1 },
  },
  badge: {
    alignItems: "center",
    blockSize: "1.25rem",
    color: tokens.sidebarForeground,
    display: "flex",
    fontSize: "0.75rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 500,
    insetInlineEnd: "0.25rem",
    justifyContent: "center",
    minInlineSize: "1.25rem",
    paddingInline: "0.25rem",
    pointerEvents: "none",
    position: "absolute",
    userSelect: "none",
  },
  skeleton: {
    alignItems: "center",
    blockSize: "2rem",
    display: "flex",
    gap: "0.5rem",
    paddingInline: "0.5rem",
  },
  skeletonIcon: {
    blockSize: "1rem",
    borderRadius: tokens.radiusLarge,
    inlineSize: "1rem",
  },
  widths: (sidebarWidth: string, sidebarWidthIcon: string) => ({
    "--sidebar-width": sidebarWidth,
    "--sidebar-width-icon": sidebarWidthIcon,
  }),
  mobileWidth: { "--sidebar-width": SIDEBAR_WIDTH_MOBILE },
  skeletonText: {
    blockSize: "1rem",
    flex: 1,
    maxInlineSize: "var(--skeleton-width)",
  },
  skeletonWidth: (width: string) => ({ "--skeleton-width": width }),
  menuSub: {
    borderInlineStartColor: tokens.sidebarBorder,
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    marginInline: "0.875rem",
    minInlineSize: 0,
    paddingBlock: "0.125rem",
    paddingInline: "0.625rem",
    transform: "translateX(1px)",
  },
  subButton: {
    alignItems: "center",
    blockSize: { default: "2rem", "@media (min-width: 640px)": "1.75rem" },
    borderRadius: tokens.radiusLarge,
    color: tokens.sidebarForeground,
    display: "flex",
    gap: "0.5rem",
    minInlineSize: 0,
    outline: "none",
    overflow: "hidden",
    paddingInline: "0.5rem",
    transform: "translateX(-1px)",
    ":hover": {
      backgroundColor: tokens.sidebarAccent,
      color: tokens.sidebarAccentForeground,
    },
    ":active": {
      backgroundColor: tokens.sidebarAccent,
      color: tokens.sidebarAccentForeground,
    },
    ":focus-visible": { boxShadow: `0 0 0 2px ${tokens.sidebarRing}` },
    "[data-active=true]": {
      backgroundColor: tokens.sidebarAccent,
      color: tokens.sidebarAccentForeground,
    },
  },
  textSmall: { fontSize: "0.75rem" },
  textMedium: { fontSize: "0.875rem" },
})

const menuButtonSizeStyles = {
  default: styles.menuButtonDefault,
  lg: styles.menuButtonLarge,
  sm: styles.menuButtonSmall,
} as const
const menuButtonVariantStyles = {
  default: null,
  outline: styles.menuButtonOutline,
} as const

function useIsMobile() {
  const query = "(max-width: 799px)"
  const subscribe = React.useCallback((callback: () => void) => {
    const media = window.matchMedia(query)
    media.addEventListener("change", callback)
    return () => media.removeEventListener("change", callback)
  }, [])
  const getSnapshot = React.useCallback(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
    [],
  )
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false)
}

export interface SidebarContextProps {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}
export const SidebarContext = React.createContext<SidebarContextProps | null>(
  null,
)
export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context)
    throw new Error("useSidebar must be used within a SidebarProvider.")
  return context
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    async (value: boolean | ((value: boolean) => boolean)) => {
      const next = typeof value === "function" ? value(open) : value
      if (setOpenProp) setOpenProp(next)
      else _setOpen(next)
      await cookieStore.set({
        expires: Date.now() + SIDEBAR_COOKIE_MAX_AGE * 1000,
        name: SIDEBAR_COOKIE_NAME,
        path: "/",
        value: String(next),
      })
    },
    [open, setOpenProp],
  )
  const toggleSidebar = React.useCallback(
    () =>
      isMobile ? setOpenMobile((value) => !value) : setOpen((value) => !value),
    [isMobile, setOpen],
  )
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])
  const state: SidebarContextProps["state"] = open ? "expanded" : "collapsed"
  const contextValue = React.useMemo(
    () => ({
      isMobile,
      open,
      openMobile,
      setOpen,
      setOpenMobile,
      state,
      toggleSidebar,
    }),
    [isMobile, open, openMobile, setOpen, state, toggleSidebar],
  )
  const wrapperProps = mergeProps(
    stylexProps(
      className,
      styles.wrapper,
      styles.widths(SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON),
    ),
    { ...props, style },
  )
  return (
    <SidebarContext.Provider value={contextValue}>
      <div {...wrapperProps} data-slot="sidebar-wrapper">
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

export function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()
  if (collapsible === "none")
    return (
      <div
        {...stylexProps(className, styles.staticSidebar)}
        data-slot="sidebar"
        {...props}
      >
        {children}
      </div>
    )
  if (isMobile)
    return (
      <Sheet onOpenChange={setOpenMobile} open={openMobile} {...props}>
        <SheetPopup
          {...stylexProps(className, styles.mobilePopup)}
          data-mobile="true"
          data-sidebar="sidebar"
          data-slot="sidebar"
          side={side}
          {...stylex.props(styles.mobileWidth)}
        >
          <SheetHeader {...stylex.props(styles.visuallyHidden)}>
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div {...stylex.props(styles.mobileContent)}>{children}</div>
        </SheetPopup>
      </Sheet>
    )
  const padded = variant === "floating" || variant === "inset"
  return (
    <div
      {...stylex.props(styles.desktopRoot)}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-side={side}
      data-slot="sidebar"
      data-state={state}
      data-variant={variant}
    >
      <div {...stylex.props(styles.gap)} data-slot="sidebar-gap" />
      <div
        {...stylexProps(
          className,
          styles.container,
          side === "left" ? styles.left : styles.right,
          padded && styles.padded,
        )}
        data-slot="sidebar-container"
        {...props}
      >
        <div
          {...stylex.props(styles.inner)}
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      className={stylexProps(className, styles.trigger).className}
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      size="icon"
      variant="ghost"
      {...props}
    >
      <PanelLeftIcon />
      <span {...stylex.props(styles.visuallyHidden)}>Toggle Sidebar</span>
    </Button>
  )
}
export function SidebarRail({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      aria-label="Toggle Sidebar"
      {...stylexProps(className, styles.rail)}
      data-sidebar="rail"
      data-slot="sidebar-rail"
      onClick={toggleSidebar}
      tabIndex={-1}
      title="Toggle Sidebar"
      type="button"
      {...props}
    />
  )
}
export function SidebarInset({
  className,
  ...props
}: React.ComponentProps<"main">) {
  return (
    <main
      {...stylexProps(className, styles.inset)}
      data-slot="sidebar-inset"
      {...props}
    />
  )
}
export function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      className={stylexProps(className, styles.input).className}
      data-sidebar="input"
      data-slot="sidebar-input"
      {...props}
    />
  )
}
export function SidebarHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.section)}
      data-sidebar="header"
      data-slot="sidebar-header"
      {...props}
    />
  )
}
export function SidebarFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.section)}
      data-sidebar="footer"
      data-slot="sidebar-footer"
      {...props}
    />
  )
}
export function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      className={stylexProps(className, styles.separator).className}
      data-sidebar="separator"
      data-slot="sidebar-separator"
      {...props}
    />
  )
}
export function SidebarContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <ScrollArea
      className={stylex.props(styles.scrollArea).className}
      fill
      overscrollContain
      scrollFade
    >
      <div
        {...stylexProps(className, styles.content)}
        data-sidebar="content"
        data-slot="sidebar-content"
        {...props}
      />
    </ScrollArea>
  )
}
export function SidebarGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.group)}
      data-sidebar="group"
      data-slot="sidebar-group"
      {...props}
    />
  )
}
export function SidebarGroupLabel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    ...stylexProps(className, styles.groupLabel),
    "data-sidebar": "group-label",
    "data-slot": "sidebar-group-label",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps(defaultProps, props),
    render,
  })
}
export function SidebarGroupAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"button">) {
  const defaultProps = {
    ...stylexProps(className, styles.groupAction),
    "data-sidebar": "group-action",
    "data-slot": "sidebar-group-action",
  }
  return useRender({
    defaultTagName: "button",
    props: mergeProps(defaultProps, props),
    render,
  })
}
export function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.groupContent)}
      data-sidebar="group-content"
      data-slot="sidebar-group-content"
      {...props}
    />
  )
}
export function SidebarMenu({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      {...stylexProps(className, styles.menu)}
      data-sidebar="menu"
      data-slot="sidebar-menu"
      {...props}
    />
  )
}
export function SidebarMenuItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      {...stylexProps(className, styles.menuItem)}
      data-sidebar="menu-item"
      data-slot="sidebar-menu-item"
      {...props}
    />
  )
}

export function SidebarMenuButton({
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  render,
  ...props
}: useRender.ComponentProps<"button"> & {
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipPopup>
  variant?: keyof typeof menuButtonVariantStyles | null
  size?: keyof typeof menuButtonSizeStyles | null
}) {
  const { isMobile, state } = useSidebar()
  const defaultProps = {
    ...stylexProps(
      className,
      styles.menuButton,
      menuButtonSizeStyles[size ?? "default"],
      menuButtonVariantStyles[variant ?? "default"],
    ),
    "data-active": isActive,
    "data-sidebar": "menu-button",
    "data-size": size,
    "data-slot": "sidebar-menu-button",
  }
  const buttonElement = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  })
  if (!tooltip) return buttonElement
  const popupProps =
    typeof tooltip === "string" ? { children: tooltip } : tooltip
  return (
    <Tooltip>
      <TooltipTrigger
        render={buttonElement as React.ReactElement<Record<string, unknown>>}
      />
      <TooltipPopup
        align="center"
        hidden={state !== "collapsed" || isMobile}
        side="right"
        {...popupProps}
      />
    </Tooltip>
  )
}
export function SidebarMenuAction({
  className,
  showOnHover = false,
  render,
  ...props
}: useRender.ComponentProps<"button"> & { showOnHover?: boolean }) {
  const defaultProps = {
    ...stylexProps(
      className,
      styles.menuAction,
      showOnHover && styles.menuActionHover,
    ),
    "data-sidebar": "menu-action",
    "data-slot": "sidebar-menu-action",
  }
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  })
}
export function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.badge)}
      data-sidebar="menu-badge"
      data-slot="sidebar-menu-badge"
      {...props}
    />
  )
}
export function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & { showIcon?: boolean }) {
  const [width] = React.useState(
    () => `${Math.floor(Math.random() * 40) + 50}%`,
  )
  return (
    <div
      {...stylexProps(className, styles.skeleton)}
      data-sidebar="menu-skeleton"
      data-slot="sidebar-menu-skeleton"
      {...props}
    >
      {showIcon ? (
        <Skeleton
          className={stylex.props(styles.skeletonIcon).className}
          data-sidebar="menu-skeleton-icon"
        />
      ) : null}
      <Skeleton
        {...stylexProps(
          undefined,
          styles.skeletonText,
          styles.skeletonWidth(width),
        )}
        data-sidebar="menu-skeleton-text"
      />
    </div>
  )
}
export function SidebarMenuSub({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      {...stylexProps(className, styles.menuSub)}
      data-sidebar="menu-sub"
      data-slot="sidebar-menu-sub"
      {...props}
    />
  )
}
export function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      className={className}
      data-sidebar="menu-sub-item"
      data-slot="sidebar-menu-sub-item"
      {...props}
    />
  )
}
export function SidebarMenuSubButton({
  size = "md",
  isActive = false,
  className,
  render,
  ...props
}: useRender.ComponentProps<"a"> & { size?: "sm" | "md"; isActive?: boolean }) {
  const defaultProps = {
    ...stylexProps(
      className,
      styles.subButton,
      size === "sm" ? styles.textSmall : styles.textMedium,
    ),
    "data-active": isActive,
    "data-sidebar": "menu-sub-button",
    "data-size": size,
    "data-slot": "sidebar-menu-sub-button",
  }
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(defaultProps, props),
    render,
  })
}
