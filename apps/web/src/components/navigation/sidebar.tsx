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
} from "@yopem-ui/react"
import { Icon, type IconProps } from "@yopem-ui/react-icons"

import { components } from "@/data/components"
import { NavDocuments } from "./nav-document"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"

interface NavMainItem {
  title: string
  url: string
  icon: IconProps["name"]
}

interface DocumentItem {
  name: string
  url: string
  icon: IconProps["name"]
}

interface Data {
  user: {
    name: string
    email: string
    avatar: string
  }
  navMain: NavMainItem[]
  documents: DocumentItem[]
}

export default function SidebarExample({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const data: Data = {
    user: {
      name: "Guerilla",
      email: "m@example.com",
      avatar: "https://avatars.githubusercontent.com/u/76994066",
    },
    navMain: [
      {
        title: "Dashboard",
        url: "#",
        icon: "CircleGauge",
      },
      {
        title: "Lifecycle",
        url: "#",
        icon: "ActivitySquare",
      },
      {
        title: "Analytics",
        url: "#",
        icon: "ChartArea",
      },
      {
        title: "Projects",
        url: "#",
        icon: "Folder",
      },
      {
        title: "Team",
        url: "#",
        icon: "Users",
      },
    ],

    documents: [
      {
        name: "Data Library",
        url: "#",
        icon: "Database",
      },
      {
        name: "Reports",
        url: "#",
        icon: "MessageSquareWarning",
      },
      {
        name: "Word Assistant",
        url: "#",
        icon: "FilePen",
      },
    ],
  }

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
                <a href="#">
                  <Icon name="Accessibility" className="!size-5" />
                  <span className="text-base font-semibold">Acme Inc.</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <NavMain items={data.navMain} />
          <NavDocuments items={data.documents} />
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
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
