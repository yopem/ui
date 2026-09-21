import type { StyleComponentProps } from "@registry/lib/style-props"
import type React from "react"

import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const skeleton = stylex.keyframes({
  to: { backgroundPositionX: "-200%" },
})

const styles = stylex.create({
  root: {
    animationDuration: "2s",
    animationIterationCount: "infinite",
    animationName: skeleton,
    animationTimingFunction: "linear",
    backgroundAttachment: "fixed",
    backgroundColor: tokens["--muted"],
    backgroundImage: {
      default:
        "linear-gradient(120deg, transparent 40%, color-mix(in oklab, #fff 64%, transparent), transparent 60%)",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "linear-gradient(120deg, transparent 40%, color-mix(in oklab, #fff 4%, transparent), transparent 60%)",
    },
    backgroundPosition: "0 0",
    backgroundSize: "200% 100%",
    borderRadius: tokens["--radius-sm"],
  },
})

export function Skeleton({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<React.ComponentProps<"div">>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <div
      data-slot="skeleton"
      {...mergeStyleProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}
