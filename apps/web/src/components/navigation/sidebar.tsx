"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuItemCollapsible,
  SidebarProvider,
} from "@yopem-ui/react"

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
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5"
              >
                <Link href="/">
                  <span className="text-base font-semibold">UI</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={pathname === "/"} asChild>
                    <Link href="/">Overview</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItemCollapsible label="Components" defaultOpen>
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
      </Sidebar>

      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
