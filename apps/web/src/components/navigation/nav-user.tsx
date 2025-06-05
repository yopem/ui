"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Menu,
  MenuContent,
  MenuItem,
  MenuItemGroup,
  MenuItemGroupLabel,
  MenuSeparator,
  MenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@yopem-ui/react"
import { Icon } from "@yopem-ui/react-icons"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Menu>
          <MenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <Icon name="EllipsisVertical" className="ml-auto size-4" />
            </SidebarMenuButton>
          </MenuTrigger>
          <MenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg">
            <MenuItemGroup>
              <MenuItemGroupLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </span>
                  </div>
                </div>
              </MenuItemGroupLabel>
              <MenuSeparator />
              <MenuItemGroup>
                <MenuItem value="Account">
                  <Icon name="UserCircle" />
                  Account
                </MenuItem>
                <MenuItem value="Billing">
                  <Icon name="CreditCard" />
                  Billing
                </MenuItem>
                <MenuItem value="Notifications">
                  <Icon name="Bell" />
                  Notifications
                </MenuItem>
              </MenuItemGroup>
              <MenuSeparator />
              <MenuItem value="Log Out">
                <Icon name="LogOut" />
                Log out
              </MenuItem>
            </MenuItemGroup>
          </MenuContent>
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
