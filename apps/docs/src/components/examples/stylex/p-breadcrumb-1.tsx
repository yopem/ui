// next/link replaced -> anchor
import * as stylex from "@stylexjs/stylex"

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Link } from "@/components/ui/link"
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu"
export default function Example() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link aria-label="Home" href="/" />}>
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <Menu>
            <MenuTrigger
              render={
                <Button
                  {...stylex.props(exampleStyles.example1)}
                  aria-label="More pages"
                  size="icon-sm"
                  variant="ghost"
                />
              }
            >
              <BreadcrumbEllipsis />
            </MenuTrigger>
            <MenuPopup align="start">
              <MenuItem render={<Link aria-label="Examples" href="/docs" />}>
                Docs
              </MenuItem>
              <MenuItem
                render={<Link aria-label="Components" href="/particles" />}
              >
                Examples
              </MenuItem>
            </MenuPopup>
          </Menu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link aria-label="Docs" href="/docs/" />}>
            Components
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

const exampleStyles = stylex.create({
  example1: {
    margin: "calc(0.25rem * -1.5)",
    color: "var(--muted-foreground)",
  },
})
