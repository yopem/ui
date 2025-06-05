"use client"

import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@yopem-ui/react"
import { Icon, type IconProps } from "@yopem-ui/react-icons"

export function NavDocuments({
  items,
}: {
  items: {
    name: string
    url: string
    icon: IconProps["name"]
  }[]
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Documents</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a href={item.url}>
                <Icon name={item.icon} />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
            <Menu>
              <MenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="data-[state=open]:bg-accent rounded-sm"
                >
                  <Icon name="Ellipsis" />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </MenuTrigger>
              <MenuContent className="w-24 rounded-lg">
                <MenuItem value="Open">
                  <Icon name="Folder" />
                  <span>Open</span>
                </MenuItem>
                <MenuItem value="Share">
                  <Icon name="Share" />
                  <span>Share</span>
                </MenuItem>
                <MenuSeparator />
                <MenuItem value="Delete" variant="destructive">
                  <Icon name="Trash" />
                  <span>Delete</span>
                </MenuItem>
              </MenuContent>
            </Menu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <Icon name="Ellipsis" className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
