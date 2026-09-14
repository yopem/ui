"use client"

import type { ComponentProps, ReactNode } from "react"

import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useCallback, useState } from "react"

const styles = stylex.create({
  page: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 1280px)": "minmax(0, 48rem) 11rem",
    },
    gap: "4rem",
    maxInlineSize: "72rem",
    marginInline: "auto",
    paddingBlock: "3.5rem",
    paddingInline: {
      default: "2.5rem",
      "@media (max-width: 639px)": "1.25rem",
    },
    minInlineSize: 0,
  },
  full: { maxInlineSize: "90rem" },
  article: { minInlineSize: 0 },
  body: {
    color: tokens["--foreground"],
    fontSize: "0.9375rem",
    lineHeight: 1.8,
    minInlineSize: 0,
    overflowWrap: "break-word",
  },
  title: {
    fontFamily: tokens["--font-heading"],
    fontSize: { default: "2.75rem", "@media (max-width: 639px)": "2.125rem" },
    letterSpacing: "-0.045em",
    fontWeight: 650,
    lineHeight: 1.1,
    marginBlock: "0 1rem",
    textWrap: "balance",
  },
  description: {
    color: tokens["--muted-foreground"],
    fontSize: "1.125rem",
    lineHeight: 1.7,
    marginBlock: "0 2.5rem",
    maxInlineSize: "42rem",
  },
  toc: {
    display: { default: "none", "@media (min-width: 1280px)": "block" },
    position: "sticky",
    insetBlockStart: "6rem",
    alignSelf: "start",
    maxBlockSize: "calc(100dvh - 8rem)",
    overflowY: "auto",
    overscrollBehavior: "contain",
    fontSize: "0.8125rem",
  },
  tocTitle: { fontWeight: 600, marginBlock: "0 1rem" },
  tocList: {
    listStyleType: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: "0.75rem",
  },
  tocLink: {
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
  tocLinkActive: {
    color: tokens["--foreground"],
    fontWeight: 600,
    "::before": { opacity: 1, transform: "scaleY(1)" },
  },
  nested: { paddingInlineStart: "1.5rem" },
})

type ElementProps<T extends "div" | "h1" | "p"> = Omit<
  ComponentProps<T>,
  "style"
>

interface TocItem {
  title: ReactNode
  url: string
  depth: number
}

function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeUrl, setActiveUrl] = useState(items[0]?.url)
  const trackSections = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return
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
        setActiveUrl(`#${activeHeading.id}`)
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
    },
    [items],
  )

  return (
    <aside
      aria-label="On this page"
      ref={trackSections}
      {...stylex.props(styles.toc)}
    >
      <nav aria-label="On this page">
        <p {...stylex.props(styles.tocTitle)}>On this page</p>
        <ul {...stylex.props(styles.tocList)}>
          {items.map((item) => (
            <li key={item.url}>
              <a
                aria-current={activeUrl === item.url ? "location" : undefined}
                href={item.url}
                {...stylex.props(
                  styles.tocLink,
                  item.depth > 2 && styles.nested,
                  activeUrl === item.url && styles.tocLinkActive,
                )}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export function DocsPage({
  children,
  toc = [],
  full = false,
  className,
  ...props
}: ElementProps<"div"> & {
  toc?: TocItem[]
  full?: boolean
}) {
  return (
    <div
      {...stylexProps(className, styles.page, full && styles.full)}
      {...props}
    >
      <article {...stylex.props(styles.article)}>{children}</article>
      {toc.length > 0 ? <TableOfContents items={toc} /> : null}
    </div>
  )
}

export function DocsBody({ className, ...props }: ElementProps<"div">) {
  return <div {...stylexProps(className, styles.body)} {...props} />
}
export function DocsTitle({
  className,
  children,
  ...props
}: ElementProps<"h1">) {
  return (
    <h1 {...stylexProps(className, styles.title)} {...props}>
      {children}
    </h1>
  )
}
export function DocsDescription({ className, ...props }: ElementProps<"p">) {
  return <p {...stylexProps(className, styles.description)} {...props} />
}
