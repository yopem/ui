import type { ReactNode } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import {
  Dialog,
  DialogDescription,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@registry/components/ui/dialog"
import { Grid } from "@registry/components/ui/grid"
import { Link as UiLink } from "@registry/components/ui/link"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Link, useHydrated, useLocation } from "@tanstack/react-router"
import { MenuIcon } from "lucide-react"
import { useState } from "react"

import { BrandLogo } from "@/components/brand-logo"

import { DocsNavigation } from "./docs-navigation"
import { GlobalSearch } from "./global-search"
import { navigationPages } from "./navigation"
import { ThemeToggle } from "./theme-toggle"

const primitiveStyles = stylex.create({
  box: {
    backgroundColor: tokens["--background"],
    color: tokens["--foreground"],
    fontFamily: tokens["--font-sans"],
    minBlockSize: "100dvh",
    fontSize: "0.875rem",
    lineHeight: 1.5,
  },
  uiLink: {
    position: "fixed",
    insetBlockStart: "0.5rem",
    insetInlineStart: "1rem",
    zIndex: 60,
    padding: "0.75rem 1rem",
    backgroundColor: tokens["--primary"],
    color: tokens["--primary-foreground"],
    borderRadius: tokens["--radius-md"],
    transform: {
      default: "translateY(-200%)",
      ":is(:focus, [data-focus])": "translateY(0)",
    },
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    blockSize: "4rem",
    paddingInline: { default: "2rem", "@media (max-width: 767.98px)": "1rem" },
    backgroundColor: tokens["--background"],
    position: "sticky",
    insetBlockStart: "calc(var(--spacing) * 0)",
    zIndex: 20,
  },
  openNavigation: {
    display: { default: "none", "@media (max-width: 767.98px)": "inline-flex" },
  },
  dialogPopup: {
    paddingBlock: "1.5rem",
    paddingInline: "1.5rem",
    gap: "1rem",
    maxBlockSize: "min(42rem, 85dvh)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "16rem minmax(0, 1fr)",
      "@media (max-width: 767.98px)": "minmax(0, 1fr)",
    },
    maxInlineSize: "100rem",
    marginInline: "auto",
  },
  fullWidth: { gridTemplateColumns: "minmax(0, 1fr)" },
  aside: {
    display: { default: "flex", "@media (max-width: 767.98px)": "none" },
    flexDirection: "column",
    blockSize: "calc(100dvh - 4rem)",
    position: "sticky",
    insetBlockStart: "4rem",
  },
  main: { outline: "none" },
})

export function DocumentationLayout({
  children,
  navigation = true,
}: {
  children: ReactNode
  navigation?: boolean
}) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const pageIndex = navigationPages.findIndex((page) => page.url === pathname)
  const previous = navigationPages[pageIndex - 1]
  const next = navigationPages[pageIndex + 1]
  const hydrated = useHydrated()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNavigate = useEventCallback(() => {
    return setMobileOpen(false)
  })

  return (
    <Box xstyle={primitiveStyles.box}>
      <UiLink href="#docs-content" xstyle={primitiveStyles.uiLink}>
        Skip to content
      </UiLink>
      <Box render={<header />} xstyle={primitiveStyles.header}>
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation"
                disabled={!hydrated}
                xstyle={primitiveStyles.openNavigation}
              />
            }
          >
            <MenuIcon size={20} />
          </DialogTrigger>
          <DialogPopup
            xstyle={primitiveStyles.dialogPopup}
            bottomStickOnMobile={false}
          >
            <DialogTitle>Documentation</DialogTitle>
            <DialogDescription>
              Browse guides, components, and previews.
            </DialogDescription>
            <DocsNavigation onNavigate={handleNavigate} />
          </DialogPopup>
        </Dialog>
        <Link to="/" {...stylex.props(styles.brand)}>
          <BrandLogo />
          UI
        </Link>
        <GlobalSearch />
        <ThemeToggle />
      </Box>
      <Grid
        xstyle={[
          primitiveStyles.grid,
          !navigation && primitiveStyles.fullWidth,
        ]}
      >
        {navigation ? (
          <Box render={<aside />} xstyle={primitiveStyles.aside}>
            <DocsNavigation />
          </Box>
        ) : null}
        <Box
          render={<main />}
          id="docs-content"
          tabIndex={-1}
          xstyle={primitiveStyles.main}
        >
          {children}
          {navigation && pageIndex >= 0 ? (
            <Box
              render={<nav />}
              aria-label="Documentation pages"
              xstyle={styles.pageNavigation}
            >
              {previous ? (
                <Link
                  to={previous.url}
                  rel="prev"
                  {...stylex.props(styles.pageLink)}
                >
                  Previous: {previous.name}
                </Link>
              ) : (
                <Box />
              )}
              {next ? (
                <Link
                  to={next.url}
                  rel="next"
                  {...stylex.props(styles.pageLink)}
                >
                  Next: {next.name}
                </Link>
              ) : null}
            </Box>
          ) : null}
        </Box>
      </Grid>
    </Box>
  )
}

const styles = stylex.create({
  pageNavigation: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "1rem",
    maxInlineSize: "72rem",
    marginInline: "auto",
    paddingBlock: "1rem 3rem",
    paddingInline: {
      default: "2.5rem",
      "@media (max-width: 767.98px)": "1.25rem",
    },
  },
  pageLink: {
    color: tokens["--foreground"],
    textDecoration: "none",
    padding: "0.75rem",
    borderRadius: tokens["--radius-md"],
    ":hover": { backgroundColor: tokens["--accent"] },
    ":focus-visible": {
      outline: `2px solid ${tokens["--ring"]}`,
      outlineOffset: 2,
    },
  },
  brand: {
    alignItems: "center",
    color: tokens["--foreground"],
    display: "inline-flex",
    gap: "0.5rem",
    fontFamily: tokens["--font-heading"],
    fontWeight: 700,
    fontSize: "1.125rem",
    letterSpacing: "-0.04em",
    textDecoration: "none",
    whiteSpace: "nowrap",
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineStyle: "solid",
      outlineWidth: 2,
      outlineOffset: 4,
    },
  },
})
