import * as stylex from "@stylexjs/stylex"
import { FoldersIcon } from "lucide-react"

// next/link replaced -> anchor
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/stylex/breadcrumb"
import { Button } from "@/components/ui/stylex/button"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/stylex/menu"

export default function Example() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<a aria-label="Home" href="/" />}>
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <Menu>
            <MenuTrigger
              aria-label="More pages"
              render={
                <Button
                  {...stylex.props(exampleStyles.example1)}
                  size="icon-sm"
                  variant="ghost"
                />
              }
            >
              <FoldersIcon
                {...stylex.props(exampleStyles.icon)}
                aria-hidden="true"
              />
            </MenuTrigger>
            <MenuPopup align="start">
              <MenuItem render={<a aria-label="More pages" href="/docs" />}>
                Docs
              </MenuItem>
              <MenuItem
                render={<a aria-label="Components" href="/particles" />}
              >
                Examples
              </MenuItem>
            </MenuPopup>
          </Menu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<a aria-label="Docs" href="/docs/" />}>
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
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    margin: "calc(0.25rem * -1.5)",
    color: "var(--muted-foreground)",
  },
})
