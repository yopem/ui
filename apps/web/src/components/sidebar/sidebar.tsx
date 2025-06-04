"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuItemCollapsible,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@yopem-ui/react"
import { Icon } from "@yopem-ui/react-icons"

import { components } from "@/data/components"

export default function SidebarExample({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/">
            🏠 <span className="ml-1">Home</span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Docs</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === "/docs/overview"}
                    asChild
                  >
                    <Link href="/docs/overview">Overview</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItemCollapsible label="Guides" defaultOpen>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={pathname === "/docs/guides/forms"}
                      asChild
                    >
                      <Link href="/docs/guides/forms">Forms</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={pathname === "/docs/guides/auth"}
                      asChild
                    >
                      <Link href="/docs/guides/auth">Auth</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenuItemCollapsible>
                <SidebarMenuItemCollapsible label="UI Components" defaultOpen>
                  {components.map((c) => (
                    <SidebarMenuItem key={c.slug}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === `/components/${c.slug}`}
                        tooltip={c.name}
                      >
                        <Link href={`/components/${c.slug}`}>
                          <span>{c.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenuItemCollapsible>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === "/docs/faq"}
                    asChild
                  >
                    <Link href="/docs/faq">FAQ</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarSeparator />
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout">
              <Icon name="LogOut" className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarFooter>
      </Sidebar>

      <div className="p-2 md:hidden">
        <SidebarTrigger />
      </div>

      <SidebarInset>
        <div className="p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
