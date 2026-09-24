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
import { Box } from "@/components/ui/box"
import { Grid } from "@/components/ui/grid"
import { Link as UiLink } from "@/components/ui/link"

import { DocsNavigation } from "./docs-navigation"
import { GlobalSearch } from "./global-search"
import { ThemeToggle } from "./theme-toggle"
export function DocumentationLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <Box
      backgroundColor={tokens["--background"]}
      color={tokens["--foreground"]}
      fontFamily={tokens["--font-sans"]}
      minBlockSize={"100dvh"}
      fontSize={"0.875rem"}
      lineHeight={1.5}
    >
      <UiLink
        href="#docs-content"
        position="fixed"
        insetBlockStart="0.5rem"
        insetInlineStart="1rem"
        zIndex={60}
        padding="0.75rem 1rem"
        backgroundColor={tokens["--primary"]}
        color={tokens["--primary-foreground"]}
        borderRadius={tokens["--radius-md"]}
        transform="translateY(-200%)"
        _focus={{ transform: "translateY(0)" }}
      >
        Skip to content
      </UiLink>
      <Box
        as="header"
        display={"flex"}
        alignItems={"center"}
        gap={"1rem"}
        blockSize={"4rem"}
        paddingInline={{ base: "2rem", mdDown: "1rem" }}
        backgroundColor={tokens["--background"]}
        position={"sticky"}
        insetBlockStart={0}
        zIndex={20}
      >
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation"
                display={{ base: "none", mdDown: "inline-flex" }}
              />
            }
          >
            <MenuIcon size={20} />
          </DialogTrigger>
          <DialogPopup
            padding="1.5rem"
            gap="1rem"
            maxBlockSize="min(42rem, 85dvh)"
            bottomStickOnMobile={false}
          >
            <DialogTitle>Documentation</DialogTitle>
            <DialogDescription>
              Browse guides, components, and previews.
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
      <Grid
        display={"grid"}
        gridTemplateColumns={{
          base: "16rem minmax(0, 1fr)",
          mdDown: "minmax(0, 1fr)",
        }}
        maxInlineSize={"100rem"}
        marginInline={"auto"}
      >
        <Box
          as="aside"
          display={{ base: "flex", mdDown: "none" }}
          flexDirection={"column"}
          blockSize={"calc(100dvh - 4rem)"}
          position={"sticky"}
          insetBlockStart={"4rem"}
        >
          <DocsNavigation />
          <ThemeToggle />
        </Box>
        <Box
          as="main"
          id="docs-content"
          tabIndex={-1}
          minInlineSize={0}
          outline={"none"}
        >
          {children}
        </Box>
      </Grid>
    </Box>
  )
}

const styles = stylex.create({
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
