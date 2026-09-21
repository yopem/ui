import type { ReactNode } from "react"

import { Button } from "@registry/components/ui/button"
import {
  Dialog,
  DialogDescription,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@registry/components/ui/dialog"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Link } from "@tanstack/react-router"
import { MenuIcon } from "lucide-react"
import { useState } from "react"

import { BrandLogo } from "@/components/brand-logo"
import { Box } from "@/components/ui/stylex/box"
import { Grid } from "@/components/ui/stylex/grid"
import { Link as UiLink } from "@/components/ui/stylex/link"

import { DocsNavigation } from "./docs-navigation"
import { GlobalSearch } from "./global-search"
import { ThemeToggle } from "./theme-toggle"
export function DocumentationLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <Box xstyle={styles.shell}>
      <UiLink href="#docs-content" {...stylex.props(styles.skip)}>
        Skip to content
      </UiLink>
      <Box as="header" {...stylex.props(styles.header)}>
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation"
                {...stylex.props(styles.mobile)}
              />
            }
          >
            <MenuIcon size={20} />
          </DialogTrigger>
          <DialogPopup
            {...stylex.props(styles.popup)}
            bottomStickOnMobile={false}
          >
            <DialogTitle>Documentation</DialogTitle>
            <DialogDescription>
              Browse guides, components, and examples.
            </DialogDescription>
            <DocsNavigation onNavigate={() => setMobileOpen(false)} />
            <ThemeToggle />
          </DialogPopup>
        </Dialog>
        <Link to="/" {...stylex.props(styles.brand)}>
          <BrandLogo />
          Yopem UI
        </Link>
        <GlobalSearch />
      </Box>
      <Grid xstyle={styles.frame}>
        <Box as="aside" {...stylex.props(styles.sidebar)}>
          <DocsNavigation />
          <ThemeToggle />
        </Box>
        <Box
          as="main"
          id="docs-content"
          tabIndex={-1}
          {...stylex.props(styles.main)}
        >
          {children}
        </Box>
      </Grid>
    </Box>
  )
}

const styles = stylex.create({
  shell: {
    backgroundColor: tokens["--background"],
    color: tokens["--foreground"],
    fontFamily: tokens["--font-sans"],
    minBlockSize: "100dvh",
    fontSize: "0.875rem",
    lineHeight: 1.5,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    blockSize: "4rem",
    paddingInline: { default: "2rem", "@media (max-width: 767px)": "1rem" },
    borderBlockEnd: `1px solid ${tokens["--border"]}`,
    backgroundColor: tokens["--background"],
    position: "sticky",
    insetBlockStart: 0,
    zIndex: 20,
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
      outline: `2px solid ${tokens["--ring"]}`,
      outlineOffset: 4,
    },
  },
  mobile: {
    display: { default: "none", "@media (max-width: 767px)": "inline-flex" },
  },
  frame: {
    display: "grid",
    gridTemplateColumns: {
      default: "15rem minmax(0, 1fr)",
      "@media (max-width: 767px)": "minmax(0, 1fr)",
    },
    maxInlineSize: "100rem",
    marginInline: "auto",
  },
  sidebar: {
    display: { default: "flex", "@media (max-width: 767px)": "none" },
    flexDirection: "column",
    borderInlineEnd: `1px solid ${tokens["--border"]}`,
    blockSize: "calc(100dvh - 4rem)",
    position: "sticky",
    insetBlockStart: "4rem",
  },
  main: { minInlineSize: 0, outline: "none" },
  skip: {
    position: "fixed",
    insetBlockStart: "0.5rem",
    insetInlineStart: "1rem",
    zIndex: 60,
    padding: "0.75rem 1rem",
    backgroundColor: tokens["--primary"],
    color: tokens["--primary-foreground"],
    borderRadius: tokens["--radius-md"],
    transform: "translateY(-200%)",
    ":focus": { transform: "translateY(0)" },
  },
  popup: { padding: "1.5rem", gap: "1rem", maxBlockSize: "min(42rem, 85dvh)" },
})
