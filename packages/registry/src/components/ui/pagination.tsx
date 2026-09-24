"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type * as React from "react"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { type Button, buttonVariants } from "@registry/components/ui/button"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
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
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<React.ComponentProps<"nav">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <nav
      aria-label="pagination"

      data-slot="pagination"
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}

export function PaginationContent({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<React.ComponentProps<"ul">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <ul
      data-slot="pagination-content"
      {...mergeStylexProps(
        stylexProps(className, styles.content, xstyle),
        props,
      )}
    />
  )
}

export function PaginationItem({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<React.ComponentProps<"li">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <li
      data-slot="pagination-item"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    />
  )
}

export type PaginationLinkProps = StyleXComponentProps<
  useRender.ComponentProps<"a">,
  {
    isActive?: boolean
    size?: React.ComponentProps<typeof Button>["size"]
  }
>

export function PaginationLink({
  xstyle: consumerXstyle,
  className,
  isActive,
  size = "icon",
  render,
  ...restProps
}: PaginationLinkProps) {
  const props = restProps
  const xstyle = consumerXstyle

  const defaultProps = {
    "aria-current": isActive ? ("page" as const) : undefined,
    ...stylexProps(undefined, xstyle),
    className: render
      ? stylexProps(className, xstyle).className
      : clsx(
          buttonVariants({
            size,
            variant: isActive ? "outline" : "ghost",
            xstyle,
          }),
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
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<React.ComponentProps<typeof PaginationLink>>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <PaginationLink
      aria-label="Go to previous page"
      className={className}
      xstyle={[styles.compact, xstyle]}
      size="default"
      {...props}
    >
      <ChevronLeftIcon {...stylex.props(styles.previousIcon)} />
      <span {...stylex.props(styles.mobileHidden)}>Previous</span>
    </PaginationLink>
  )
}

export function PaginationNext({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<React.ComponentProps<typeof PaginationLink>>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <PaginationLink
      aria-label="Go to next page"
      className={className}
      xstyle={[styles.compact, xstyle]}
      size="default"
      {...props}
    >
      <span {...stylex.props(styles.mobileHidden)}>Next</span>
      <ChevronRightIcon {...stylex.props(styles.nextIcon)} />
    </PaginationLink>
  )
}

export function PaginationEllipsis({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<React.ComponentProps<"span">>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <span
      aria-hidden

      data-slot="pagination-ellipsis"
      {...mergeStylexProps(
        stylexProps(className, styles.ellipsis, xstyle),
        props,
      )}
    >
      <MoreHorizontalIcon {...stylex.props(styles.ellipsisIcon)} />
      <span {...stylex.props(styles.visuallyHidden)}>More pages</span>
    </span>
  )
}
