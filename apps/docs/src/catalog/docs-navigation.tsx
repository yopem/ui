import { Box } from "@registry/components/ui/box"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@registry/components/ui/collapsible"
import { Link as UiLink } from "@registry/components/ui/link"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Link, useLocation } from "@tanstack/react-router"
import { ChevronDownIcon } from "lucide-react"
import { useState } from "react"

import { navigationGroups } from "./navigation"

const primitiveStyles = stylex.create({
  documentationNavigation: { flex: 1, minBlockSize: 0 },
  documentation: { paddingBlock: "1.25rem", paddingInline: "1.25rem" },
  ul: {
    listStyleType: "none",
    paddingBlock: "calc(var(--spacing) * 0)",
    paddingInline: "calc(var(--spacing) * 0)",
    margin: "calc(var(--spacing) * 0)",
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

export function DocsNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useLocation({ select: (location) => location.pathname })

  const activeGroups = navigationGroups
    .filter((group) => group.pages.some((page) => page.url === pathname))
    .map((group) => group.name)

  const [state, setState] = useState({ pathname, openGroups: activeGroups })

  if (state.pathname !== pathname) {
    setState({ pathname, openGroups: activeGroups })
  }

  const openGroups = new Set(state.openGroups)

  return (
    <ScrollArea
      aria-label="Documentation navigation"
      overscrollContain
      scrollFade
      xstyle={primitiveStyles.documentationNavigation}
    >
      <Box
        render={<nav />}
        aria-label="Documentation"
        xstyle={primitiveStyles.documentation}
      >
        <Box render={<ul />} xstyle={primitiveStyles.ul}>
          {navigationGroups.map((group) => (
            <Box render={<li />} key={group.name}>
              <Collapsible
                open={openGroups.has(group.name)}
                onOpenChange={(open) =>
                  setState({
                    pathname,
                    openGroups: open
                      ? [...state.openGroups, group.name]
                      : state.openGroups.filter((name) => name !== group.name),
                  })
                }
              >
                <CollapsibleTrigger xstyle={styles.group}>
                  {group.name}
                  <ChevronDownIcon
                    aria-hidden="true"
                    size={14}
                    {...stylex.props(styles.chevron)}
                  />
                </CollapsibleTrigger>
                <CollapsiblePanel>
                  <Box render={<ul />} xstyle={primitiveStyles.ul}>
                    {group.pages.map((item) => (
                      <Box render={<li />} key={item.url}>
                        <Link
                          to={item.url}
                          activeOptions={{ exact: true }}
                          aria-current={
                            pathname === item.url ? "page" : undefined
                          }
                          onClick={onNavigate}
                          {...stylex.props(
                            styles.link,
                            pathname === item.url && styles.active,
                          )}
                        >
                          {item.name}
                        </Link>
                      </Box>
                    ))}
                  </Box>
                </CollapsiblePanel>
              </Collapsible>
            </Box>
          ))}
          <Box render={<li />} xstyle={primitiveStyles.li2}>
            Resources
          </Box>
          <Box render={<li />}>
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
  group: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    inlineSize: "100%",
    borderWidth: 0,
    backgroundColor: "transparent",
    color: tokens["--sidebar-foreground"],
    fontFamily: "inherit",
    fontSize: "0.875rem",
    fontWeight: 600,
    paddingInline: "0.75rem",
    paddingBlock: "0.75rem",
    borderRadius: tokens["--radius-md"],
    cursor: "pointer",
    ":hover": { backgroundColor: tokens["--sidebar-accent"] },
    ":focus-visible": {
      outline: `2px solid ${tokens["--ring"]}`,
      outlineOffset: 2,
    },
  },
  chevron: {
    transform: {
      default: "rotate(-90deg)",
      ":is([aria-expanded=true] > *)": "rotate(0deg)",
    },
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
