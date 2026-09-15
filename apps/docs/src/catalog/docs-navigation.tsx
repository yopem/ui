import type { Root } from "fumadocs-core/page-tree"

import { ScrollArea } from "@registry/components/ui/scroll-area"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Link, useLocation } from "@tanstack/react-router"

import { catalog } from "./components"

const tree: Root = {
  name: "Yopem UI",
  children: [
    { type: "separator", name: "Start here" },
    { type: "page", name: "Introduction", url: "/" },
    { type: "page", name: "Getting started", url: "/docs/getting-started" },
    { type: "page", name: "Installation", url: "/docs/installation" },
    { type: "page", name: "Theming", url: "/docs/theming" },
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
      xstyle={styles.scroll}
    >
      <nav aria-label="Documentation" {...stylex.props(styles.nav)}>
        <ul {...stylex.props(styles.list)}>
          {tree.children.map((item) =>
            item.type === "separator" ? (
              <li key={String(item.name)} {...stylex.props(styles.group)}>
                {item.name}
              </li>
            ) : item.type === "page" ? (
              <li key={item.url}>
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
              </li>
            ) : null,
          )}
        </ul>
      </nav>
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
    fontSize: "0.8125rem",
    ":hover": {
      backgroundColor: tokens["--sidebar-accent"],
      color: tokens["--sidebar-accent-foreground"],
    },
    ":focus-visible": {
      outline: `2px solid ${tokens["--ring"]}`,
      outlineOffset: 2,
    },
  },
  active: {
    backgroundColor: tokens["--sidebar-accent"],
    color: tokens["--sidebar-accent-foreground"],
    fontWeight: 600,
  },
})
