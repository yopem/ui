// next/link replaced -> anchor

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@registry/components/ui/breadcrumb"
import { Button } from "@registry/components/ui/button"
import { Link } from "@registry/components/ui/link"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@registry/components/ui/menu"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  morePages: {
    margin: "calc(0.25rem * -1.5)",
    color: "var(--muted-foreground)",
  },
})

export function Preview() {
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
                  xstyle={styles.morePages}
                  aria-label="More pages"
                  size="icon-sm"
                  variant="ghost"
                />
              }
            >
              <BreadcrumbEllipsis />
            </MenuTrigger>
            <MenuPopup align="start">
              <MenuItem render={<Link aria-label="Docs" href="/docs" />}>
                Docs
              </MenuItem>
              <MenuItem
                render={<Link aria-label="Components" href="/components" />}
              >
                Components
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
