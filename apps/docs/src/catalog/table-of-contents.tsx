"use client"

import type { ReactNode } from "react"

import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useCallback, useState } from "react"

import { Box } from "@/components/ui/stylex/box"
import { Link } from "@/components/ui/stylex/link"
import { Paragraph } from "@/components/ui/stylex/paragraph"
export interface TocItem {
  title: ReactNode
  url: string
  depth: number
}

function listenForActiveSection(
  items: TocItem[],
  onActiveUrlChange: (url: string) => void,
) {
  const headings = items
    .map((item) => document.getElementById(item.url.slice(1)))
    .filter((heading) => heading !== null)
  if (headings.length === 0) return
  let frame = 0

  function updateActiveSection() {
    let activeHeading = headings[0]
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top > 112) break
      activeHeading = heading
    }
    onActiveUrlChange(`#${activeHeading.id}`)
  }

  function scheduleUpdate() {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(updateActiveSection)
  }

  updateActiveSection()
  window.addEventListener("scroll", scheduleUpdate, { passive: true })
  window.addEventListener("resize", scheduleUpdate)
  return () => {
    cancelAnimationFrame(frame)
    window.removeEventListener("scroll", scheduleUpdate)
    window.removeEventListener("resize", scheduleUpdate)
  }
}

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeUrl, setActiveUrl] = useState<string>()
  const trackSections = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return
      return listenForActiveSection(items, setActiveUrl)
    },
    [items],
  )

  return (
    <Box
      as="aside"
      aria-label="On this page"
      ref={trackSections}
      {...stylex.props(styles.root)}
    >
      <Box as="nav" aria-label="On this page">
        <Paragraph {...stylex.props(styles.title)}>On this page</Paragraph>
        <Box as="ul" {...stylex.props(styles.list)}>
          {items.map((item) => (
            <Box as="li" key={item.url}>
              <Link
                aria-current={activeUrl === item.url ? "location" : undefined}
                href={item.url}
                {...stylex.props(
                  styles.link,
                  item.depth > 2 && styles.nested,
                  activeUrl === item.url && styles.active,
                )}
              >
                {item.title}
              </Link>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

const styles = stylex.create({
  root: {
    display: { default: "none", "@media (min-width: 1280px)": "block" },
    position: "sticky",
    insetBlockStart: "6rem",
    alignSelf: "start",
    maxBlockSize: "calc(100dvh - 8rem)",
    overflowY: "auto",
    overscrollBehavior: "contain",
    fontSize: "0.8125rem",
  },
  title: { fontWeight: 600, marginBlock: "0 1rem" },
  list: {
    listStyleType: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: "0.75rem",
  },
  link: {
    display: "block",
    color: tokens["--muted-foreground"],
    textDecoration: "none",
    lineHeight: 1.5,
    paddingInlineStart: "0.75rem",
    position: "relative",
    transitionDuration: {
      default: "160ms",
      "@media (prefers-reduced-motion: reduce)": "0ms",
    },
    transitionProperty: "color",
    transitionTimingFunction: "ease",
    "::before": {
      backgroundColor: tokens["--foreground"],
      borderRadius: "999px",
      content: '""',
      inlineSize: "2px",
      insetBlock: "0.125rem",
      insetInlineStart: 0,
      opacity: 0,
      position: "absolute",
      transform: "scaleY(0.5)",
      transitionDuration: {
        default: "160ms",
        "@media (prefers-reduced-motion: reduce)": "0ms",
      },
      transitionProperty: "opacity, transform",
      transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
    },
    ":hover": { color: tokens["--foreground"] },
    ":focus-visible": {
      outline: `2px solid ${tokens["--ring"]}`,
      outlineOffset: 2,
    },
  },
  active: {
    color: tokens["--foreground"],
    fontWeight: 600,
    "::before": { opacity: 1, transform: "scaleY(1)" },
  },
  nested: { paddingInlineStart: "1.5rem" },
})
