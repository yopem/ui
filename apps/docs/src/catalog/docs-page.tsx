import type { ComponentProps, ReactNode } from "react"

import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

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
    ":hover": { color: tokens["--foreground"] },
    ":focus-visible": {
      outline: `2px solid ${tokens["--ring"]}`,
      outlineOffset: 2,
    },
  },
  nested: { paddingInlineStart: "0.75rem" },
})

type ElementProps<T extends "div" | "h1" | "p"> = Omit<
  ComponentProps<T>,
  "style"
>

export function DocsPage({
  children,
  toc = [],
  full = false,
  className,
  ...props
}: ElementProps<"div"> & {
  toc?: { title: ReactNode; url: string; depth: number }[]
  full?: boolean
}) {
  return (
    <div
      {...stylexProps(className, styles.page, full && styles.full)}
      {...props}
    >
      <article {...stylex.props(styles.article)}>{children}</article>
      {toc.length > 0 ? (
        <nav aria-label="On this page" {...stylex.props(styles.toc)}>
          <p {...stylex.props(styles.tocTitle)}>On this page</p>
          <ul {...stylex.props(styles.tocList)}>
            {toc.map((item) => (
              <li key={item.url}>
                <a
                  href={item.url}
                  {...stylex.props(
                    styles.tocLink,
                    item.depth > 2 && styles.nested,
                  )}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
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
