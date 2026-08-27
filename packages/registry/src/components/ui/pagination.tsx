"use client"

import type * as React from "react"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { type Button, buttonVariants } from "@registry/components/ui/button"
import { stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"

const styles = stylex.create({
  root: {
    display: "flex",
    inlineSize: "100%",
    justifyContent: "center",
    marginInline: "auto",
  },
  content: {
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    gap: "0.25rem",
  },
  compact: {
    "@media (max-width: 639px)": { aspectRatio: "1", padding: 0 },
  },
  previousIcon: {
    "@media (min-width: 640px)": { marginInlineStart: "-0.25rem" },
  },
  nextIcon: {
    "@media (min-width: 640px)": { marginInlineEnd: "-0.25rem" },
  },
  mobileHidden: {
    "@media (max-width: 639px)": { display: "none" },
  },
  ellipsis: {
    display: "flex",
    justifyContent: "center",
    minInlineSize: "1.75rem",
  },
  ellipsisIcon: {
    blockSize: { default: "1.25rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.25rem", "@media (min-width: 640px)": "1rem" },
  },
  visuallyHidden: {
    blockSize: 1,
    clip: "rect(0, 0, 0, 0)",
    clipPath: "inset(50%)",
    inlineSize: 1,
    margin: -1,
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    whiteSpace: "nowrap",
  },
})

export function Pagination({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="pagination"
      {...stylexProps(className, styles.root)}
      data-slot="pagination"
      {...props}
    />
  )
}

export function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      {...stylexProps(className, styles.content)}
      data-slot="pagination-content"
      {...props}
    />
  )
}

export function PaginationItem(props: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

export type PaginationLinkProps = {
  isActive?: boolean
  size?: React.ComponentProps<typeof Button>["size"]
} & useRender.ComponentProps<"a">

export function PaginationLink({
  className,
  isActive,
  size = "icon",
  render,
  ...props
}: PaginationLinkProps) {
  const defaultProps = {
    "aria-current": isActive ? ("page" as const) : undefined,
    className: render
      ? className
      : clsx(
          buttonVariants({ size, variant: isActive ? "outline" : "ghost" }),
          className,
        ),
    "data-active": isActive,
    "data-slot": "pagination-link",
  }

  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(defaultProps, props),
    render,
  })
}

export function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      className={stylexProps(className, styles.compact).className}
      size="default"
      {...props}
    >
      <ChevronLeftIcon {...stylex.props(styles.previousIcon)} />
      <span {...stylex.props(styles.mobileHidden)}>Previous</span>
    </PaginationLink>
  )
}

export function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      className={stylexProps(className, styles.compact).className}
      size="default"
      {...props}
    >
      <span {...stylex.props(styles.mobileHidden)}>Next</span>
      <ChevronRightIcon {...stylex.props(styles.nextIcon)} />
    </PaginationLink>
  )
}

export function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      {...stylexProps(className, styles.ellipsis)}
      data-slot="pagination-ellipsis"
      {...props}
    >
      <MoreHorizontalIcon {...stylex.props(styles.ellipsisIcon)} />
      <span {...stylex.props(styles.visuallyHidden)}>More pages</span>
    </span>
  )
}
