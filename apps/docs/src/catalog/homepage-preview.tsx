"use client"

import { Heading } from "@registry/components/ui/heading"
import { Input } from "@registry/components/ui/input"
import { Label } from "@registry/components/ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@registry/components/ui/sidebar"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Link } from "@tanstack/react-router"
import { BookOpenIcon, PackageIcon } from "lucide-react"
import { useId } from "react"

import type { CatalogItem } from "./components"

import { Preview as FramePreview } from "./previews/frame"
import { Preview as ProsePreview } from "./previews/prose"

const styles = stylex.create({
  pageHeading: { fontSize: "2.25rem" },
  sectionHeading: { fontSize: "1.5rem" },
  subsectionHeading: { fontSize: "1.25rem" },
  sidebar: { inlineSize: "100%", maxInlineSize: "14rem", minBlockSize: 0 },
  sidebarTitle: {
    color: tokens["--foreground"],
    fontSize: "0.875rem",
    fontWeight: 500,
    paddingInline: "0.5rem",
  },
})

export function HomepagePreview({ item }: { item: CatalogItem }) {
  if (item.slug === "frame") return <FramePreview embedded />

  if (item.slug === "prose") return <ProsePreview embedded />

  if (item.slug === "heading") return <HomepageHeadingPreview />

  if (item.slug === "label") return <HomepageLabelPreview />

  if (item.slug === "sidebar") return <HomepageSidebarPreview />

  const Preview = item.preview?.component

  return Preview ? <Preview /> : null
}

export function HomepageHeadingPreview() {
  return (
    <Stack>
      <Heading render={<h4>Field station</h4>} xstyle={styles.pageHeading} />
      <Heading
        render={<h5>Wetland survey</h5>}
        xstyle={styles.sectionHeading}
      />
      <Heading
        render={<h6>Bird observations</h6>}
        xstyle={styles.subsectionHeading}
      />
    </Stack>
  )
}

export function HomepageLabelPreview() {
  const id = useId()

  return (
    <Stack>
      <Label htmlFor={id}>Email address</Label>
      <Input id={id} placeholder="nora@example.com" type="email" />
    </Stack>
  )
}

export function HomepageSidebarPreview() {
  return (
    <SidebarProvider xstyle={styles.sidebar}>
      <Sidebar collapsible="none" xstyle={styles.sidebar}>
        <SidebarHeader>
          <Text xstyle={styles.sidebarTitle}>Yopem UI</Text>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive render={<Link to="/components" />}>
                  <PackageIcon size={16} aria-hidden="true" />
                  Components
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link to="/docs/getting-started" />}>
                  <BookOpenIcon size={16} aria-hidden="true" />
                  Getting started
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}
