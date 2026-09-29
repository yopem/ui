"use client"

import type { ReactNode } from "react"

import { Box } from "@registry/components/ui/box"
import { Link } from "@registry/components/ui/link"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useCallback, useState } from "react"

const styles = stylex.create({
  onThisPage: {
    display: { default: "none", "@media (min-width: 1536px)": "block" },
    position: "sticky",
    insetBlockStart: "6rem",
    alignSelf: "start",
    maxBlockSize: "calc(100dvh - 8rem)",
    overflowY: "auto",
    overscrollBehavior: "contain",
    fontSize: "0.8125rem",
  },
  paragraph: { fontWeight: 600, marginBlock: "0 1rem" },
  ul: {
    listStyleType: "none",
    paddingBlock: "calc(var(--spacing) * 0)",
    paddingInline: "calc(var(--spacing) * 0)",
    margin: "calc(var(--spacing) * 0)",
    display: "grid",
    gap: "0.75rem",
  },
  link: {
    display: "block",
    color: {
      default: tokens["--muted-foreground"],
      ":is(:hover, [data-hover]):not(:disabled, [disabled], [aria-disabled=true], [data-disabled])":
        tokens["--foreground"],
    },
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
    outlineColor: {
      ":is(:focus-visible, [data-focus-visible])": tokens["--ring"],
    },
    outlineStyle: { ":is(:focus-visible, [data-focus-visible])": "solid" },
    outlineWidth: { ":is(:focus-visible, [data-focus-visible])": 2 },
    outlineOffset: { ":is(:focus-visible, [data-focus-visible])": 2 },
  },
  span: { color: tokens["--foreground"], fontWeight: 600 },
  span2: {
    backgroundColor: tokens["--foreground"],
    borderRadius: "999px",
    inlineSize: "2px",
    insetBlock: "0.125rem",
    insetInlineStart: "calc(var(--spacing) * 0)",
    position: "absolute",
  },
  span3: { paddingInlineStart: "0.75rem" },
  span4: { paddingInlineStart: "0.75rem" },
})

export interface TocItem {
  title: ReactNode
  url: string
  depth: number
}

function listenForActiveSection(
  items: TocItem[],
  onActiveUrlChange: (url: string) => void,
) {
  const headings = items.flatMap((item) => {
    const heading = document.getElementById(item.url.slice(1))

    return heading === null ? [] : [heading]
  })

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
      xstyle={styles.onThisPage}
    >
      <Box as="nav" aria-label="On this page">
        <Text xstyle={styles.paragraph}>On this page</Text>
        <Box as="ul" xstyle={styles.ul}>
          {items.map((item) => (
            <Box as="li" key={item.url}>
              <Link
                aria-current={activeUrl === item.url ? "location" : undefined}
                href={item.url}
                xstyle={styles.link}
              >
                {activeUrl === item.url ? (
                  <Box as="span" xstyle={styles.span}>
                    <Box as="span" aria-hidden="true" xstyle={styles.span2} />
                    {item.depth > 2 ? (
                      <Box as="span" xstyle={styles.span3}>
                        {item.title}
                      </Box>
                    ) : (
                      item.title
                    )}
                  </Box>
                ) : item.depth > 2 ? (
                  <Box as="span" xstyle={styles.span4}>
                    {item.title}
                  </Box>
                ) : (
                  item.title
                )}
              </Link>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
