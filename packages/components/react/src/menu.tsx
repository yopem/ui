"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@ark-ui/react/menu"
import { Icon } from "@yopem-ui/react-icons"
import { cn } from "@yopem-ui/utils"

export const Menu = ({
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Root>) => {
  return <MenuPrimitive.Root data-slot="menu" {...props} />
}

export const MenuTrigger = ({
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Trigger>) => {
  return <MenuPrimitive.Trigger data-slot="menu-trigger" {...props} />
}
export const MenuTriggerItem = ({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.TriggerItem>) => {
  return (
    <MenuPrimitive.TriggerItem
      data-slot="menu-trigger-item"
      className={cn(
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}
const MenuPositioner = ({
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Positioner>) => {
  return <MenuPrimitive.Positioner data-slot="menu-positioner" {...props} />
}

export const MenuContent = ({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Content>) => {
  return (
    <MenuPositioner>
      <MenuPrimitive.Content
        data-slot="menu-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 flex max-h-(--radix-menu-content-available-height) min-w-[8rem] origin-(--radix-menu-content-transform-origin) flex-col gap-2 overflow-x-hidden overflow-y-auto rounded-md border px-2 py-1.5 text-sm shadow-md",
          className,
        )}
        {...props}
      />
    </MenuPositioner>
  )
}

export const MenuItemGroup = ({
  ...props
}: React.ComponentProps<typeof MenuPrimitive.ItemGroup>) => {
  return <MenuPrimitive.ItemGroup data-slot="menu-item-group" {...props} />
}

export const MenuItemText = ({
  ...props
}: React.ComponentProps<typeof MenuPrimitive.ItemText>) => {
  return <MenuPrimitive.ItemText data-slot="menu-item-text" {...props} />
}

export const MenuItem = ({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) => {
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

export const MenuCheckboxItem = ({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.CheckboxItem>) => {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="menu-checkbox-item"
      className={cn(
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenuPrimitive.ItemIndicator>
          <Icon name="Check" className="size-4" />
        </MenuPrimitive.ItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

export const MenuRadioItemGroup = ({
  ...props
}: React.ComponentProps<typeof MenuPrimitive.RadioItemGroup>) => {
  return (
    <MenuPrimitive.RadioItemGroup
      data-slot="menu-radio-item-group"
      {...props}
    />
  )
}

export const MenuRadioItem = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.RadioItem>) => {
  return (
    <MenuPrimitive.RadioItem
      data-slot="menu-radio-item"
      className={cn(
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenuPrimitive.ItemIndicator>
          <Icon name="Circle" className="size-2 fill-current" />
        </MenuPrimitive.ItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  )
}

export const MenuItemGroupLabel = ({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.ItemGroupLabel> & {
  inset?: boolean
}) => {
  return (
    <MenuPrimitive.ItemGroupLabel
      data-slot="menu-item-group-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-semibold data-[inset]:pl-8",
        className,
      )}
      {...props}
    />
  )
}

export const MenuItemIndicator = ({
  ...props
}: React.ComponentProps<typeof MenuPrimitive.ItemIndicator>) => {
  return (
    <MenuPrimitive.ItemIndicator data-slot="menu-item-indicator" {...props} />
  )
}
export const MenuSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Separator>) => {
  return (
    <MenuPrimitive.Separator
      data-slot="menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

export const MenuShortcut = ({
  className,
  ...props
}: React.ComponentProps<"span">) => {
  return (
    <span
      data-slot="menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  )
}
