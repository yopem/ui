"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@yopem-ui/react"

import { components } from "@/data/components"

export default function ExampleLayout({
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
          <SidebarMenu>
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
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarSeparator />
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Logout">
              <svg width="16" height="16" fill="currentColor">
                <path d="..." />
              </svg>
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
