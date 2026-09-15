import type { ComponentProps } from "react"

import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

import type { TocItem } from "./table-of-contents"

import { TableOfContents } from "./table-of-contents"

type ElementProps<T extends "div" | "h1" | "p"> = Omit<
  ComponentProps<T>,
  "style"
>

const emptyToc: TocItem[] = []

export function DocsPage({
  children,
  toc = emptyToc,
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
})
