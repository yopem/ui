"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@ark-ui/react/menu"
import { Icon } from "@yopem-ui/react-icons"
import { cn } from "@yopem-ui/utils"

const Menu = MenuPrimitive.Root

const MenuTrigger = MenuPrimitive.Trigger

const MenuItemGroup = MenuPrimitive.ItemGroup

const MenuRadioItemGroup = MenuPrimitive.RadioItemGroup

const MenuContent = React.forwardRef<
  React.ComponentRef<typeof MenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <MenuPrimitive.Content
    ref={ref}
    className={cn(
      "bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
))
MenuContent.displayName = MenuPrimitive.Content.displayName

const MenuItem = React.forwardRef<
  React.ComponentRef<typeof MenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenuPrimitive.Item
    ref={ref}
    className={cn(
      "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
))
MenuItem.displayName = MenuPrimitive.Item.displayName

const MenuCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof MenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm transition-colors outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <MenuPrimitive.ItemIndicator>
        <Icon name="Check" className="size-4" />
      </MenuPrimitive.ItemIndicator>
    </span>
    {children}
  </MenuPrimitive.CheckboxItem>
))
MenuCheckboxItem.displayName = MenuPrimitive.CheckboxItem.displayName

const MenuRadioItem = React.forwardRef<
  React.ComponentRef<typeof MenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center rounded-sm py-1.5 pr-2 pl-8 text-sm transition-colors outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <MenuPrimitive.ItemIndicator>
        <Icon name="Circle" className="size-2 fill-current" />
      </MenuPrimitive.ItemIndicator>
    </span>
    {children}
  </MenuPrimitive.RadioItem>
))
MenuRadioItem.displayName = MenuPrimitive.RadioItem.displayName

const MenuItemGroupLabel = React.forwardRef<
  React.ComponentRef<typeof MenuPrimitive.ItemGroupLabel>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.ItemGroupLabel> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenuPrimitive.ItemGroupLabel
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
))
MenuItemGroupLabel.displayName = MenuPrimitive.ItemGroupLabel.displayName

const MenuSeparator = React.forwardRef<
  React.ComponentRef<typeof MenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenuPrimitive.Separator
    ref={ref}
    className={cn("bg-muted -mx-1 my-1 h-px", className)}
    {...props}
  />
))
MenuSeparator.displayName = MenuPrimitive.Separator.displayName

const MenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
MenuShortcut.displayName = "MenuShortcut"

export {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuCheckboxItem,
  MenuRadioItem,
  MenuItemGroupLabel,
  MenuSeparator,
  MenuShortcut,
  MenuItemGroup,
  MenuRadioItemGroup,
}
