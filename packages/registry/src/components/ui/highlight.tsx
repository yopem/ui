import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps, ReactNode } from "react"

import { Mark } from "@registry/components/ui/mark"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { Children, cloneElement, isValidElement } from "react"

const styles = stylex.create({
  root: {
    color: tokens["--foreground"],
    display: "inline",
  },
})

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function highlightText(text: string, query: string): ReactNode {
  if (!query) return text

  const expression = new RegExp(escapeRegExp(query), "giu")
  const parts: ReactNode[] = []
  let cursor = 0

  for (const match of text.matchAll(expression)) {
    if (match.index === undefined) continue

    if (match.index > cursor) parts.push(text.slice(cursor, match.index))

    const end = match.index + match[0].length
    parts.push(<Mark key={`${match.index}:${end}`}>{match[0]}</Mark>)
    cursor = end
  }

  if (parts.length === 0) return text

  if (cursor < text.length) parts.push(text.slice(cursor))

  return parts
}

function highlightChildren(children: ReactNode, query: string): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      return highlightText(String(child), query)
    }

    if (
      isValidElement<{ children?: ReactNode }>(child) &&
      child.props.children !== undefined
    ) {
      return cloneElement(
        child,
        {},
        highlightChildren(child.props.children, query),
      )
    }

    return child
  })
}

export type HighlightProps = StyleXComponentProps<
  ComponentProps<"span">,
  { query: string }
>

export function Highlight({
  query,
  xstyle: consumerXstyle,
  className,
  children,
  ...restProps
}: HighlightProps) {
  return (
    <span
      data-slot="highlight"
      {...mergeStylexProps(
        stylexProps(className, styles.root, consumerXstyle),
        restProps,
      )}
    >
      {highlightChildren(children, query)}
    </span>
  )
}
