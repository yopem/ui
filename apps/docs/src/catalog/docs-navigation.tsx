import type { Root } from "fumadocs-core/page-tree"

import { Box } from "@registry/components/ui/box"
import { Link as UiLink } from "@registry/components/ui/link"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Link, useLocation } from "@tanstack/react-router"

import { catalog } from "./components"

const primitiveStyles = stylex.create({
  documentationNavigation: { flex: 1, minBlockSize: 0 },
  documentation: { paddingBlock: "1.25rem", paddingInline: "1.25rem" },
  ul: {
    listStyleType: "none",
    paddingBlock: "calc(var(--spacing) * 0)",
    paddingInline: "calc(var(--spacing) * 0)",
    margin: "calc(var(--spacing) * 0)",
  },
  li: {
    color: tokens["--muted-foreground"],
    fontSize: "0.6875rem",
    fontWeight: 600,
    letterSpacing: "0.075em",
    textTransform: "uppercase",
    paddingInline: "0.75rem",
    paddingBlock: "1.25rem 0.625rem",
  },
  li2: {
    color: tokens["--muted-foreground"],
    fontSize: "0.6875rem",
    fontWeight: 600,
    letterSpacing: "0.075em",
    textTransform: "uppercase",
    paddingInline: "0.75rem",
    paddingBlock: "1.25rem 0.625rem",
  },
  uiLink: {
    display: "block",
    color: {
      default: tokens["--muted-foreground"],
      ":is(:hover, [data-hover]):not(:disabled, [disabled], [aria-disabled=true], [data-disabled])":
        tokens["--sidebar-accent-foreground"],
    },
    paddingBlock: "0.5rem",
    paddingInline: "0.75rem",
    borderRadius: tokens["--radius-md"],
    textDecoration: "none",
    fontSize: "0.875rem",
    lineHeight: 1.4,
    backgroundColor: {
      ":is(:hover, [data-hover]):not(:disabled, [disabled], [aria-disabled=true], [data-disabled])":
        tokens["--sidebar-accent"],
    },
    outlineColor: {
      ":is(:focus-visible, [data-focus-visible])": tokens["--ring"],
    },
    outlineStyle: { ":is(:focus-visible, [data-focus-visible])": "solid" },
    outlineWidth: { ":is(:focus-visible, [data-focus-visible])": 2 },
    outlineOffset: { ":is(:focus-visible, [data-focus-visible])": 2 },
  },
})

const tree: Root = {
  name: "Yopem UI",
  children: [
    { type: "separator", name: "Start here" },
    { type: "page", name: "Introduction", url: "/" },
    { type: "page", name: "Getting started", url: "/docs/getting-started" },
    { type: "page", name: "Installation", url: "/docs/installation" },
    { type: "separator", name: "Learn" },
    { type: "page", name: "Theming", url: "/docs/theming" },
    { type: "page", name: "Layout and typography", url: "/docs/layout" },
    { type: "page", name: "Styling with StyleX", url: "/docs/styling" },
    { type: "page", name: "Lint rules", url: "/docs/lint" },
    { type: "page", name: "Components", url: "/components" },
    { type: "separator", name: "Components" },
    ...catalog.map((item) => ({
      type: "page" as const,
      name: item.title,
      url: `/components/${item.slug}`,
    })),
  ],
}

export function DocsNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useLocation({ select: (location) => location.pathname })

  return (
    <ScrollArea
      aria-label="Documentation navigation"
      overscrollContain
      scrollFade
      xstyle={primitiveStyles.documentationNavigation}
    >
      <Box
        as="nav"
        aria-label="Documentation"
        xstyle={primitiveStyles.documentation}
      >
        <Box as="ul" xstyle={primitiveStyles.ul}>
          {tree.children.map((item) =>
            item.type === "separator" ? (
              <Box as="li" key={String(item.name)} xstyle={primitiveStyles.li}>
                {item.name}
              </Box>
            ) : item.type === "page" ? (
              <Box as="li" key={item.url}>
                <Link
                  to={item.url}
                  aria-current={pathname === item.url ? "page" : undefined}
                  onClick={onNavigate}
                  {...stylex.props(
                    styles.link,
                    pathname === item.url && styles.active,
                  )}
                >
                  {item.name}
                </Link>
              </Box>
            ) : null,
          )}
          <Box as="li" xstyle={primitiveStyles.li2}>
            Resources
          </Box>
          <Box as="li">
            <UiLink
              href="/llms.txt"
              onClick={onNavigate}
              xstyle={primitiveStyles.uiLink}
            >
              llms.txt
            </UiLink>
          </Box>
        </Box>
      </Box>
    </ScrollArea>
  )
}

const styles = stylex.create({
  scroll: { flex: 1, minBlockSize: 0 },
  nav: { padding: "1.25rem" },
  list: { listStyleType: "none", padding: 0, margin: 0 },
  group: {
    color: tokens["--muted-foreground"],
    fontSize: "0.6875rem",
    fontWeight: 600,
    letterSpacing: "0.075em",
    textTransform: "uppercase",
    paddingInline: "0.75rem",
    paddingBlock: "1.25rem 0.625rem",
  },
  link: {
    display: "block",
    color: tokens["--muted-foreground"],
    paddingBlock: "0.5rem",
    paddingInline: "0.75rem",
    borderRadius: tokens["--radius-md"],
    textDecoration: "none",
    fontSize: "0.875rem",
    lineHeight: 1.4,
    ":hover": {
      backgroundColor: tokens["--sidebar-accent"],
      color: tokens["--sidebar-accent-foreground"],
    },
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineStyle: "solid",
      outlineWidth: 2,
      outlineOffset: 2,
    },
  },
  active: {
    backgroundColor: tokens["--sidebar-accent"],
    color: tokens["--sidebar-accent-foreground"],
    fontWeight: 600,
  },
})
