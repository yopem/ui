import type React from "react"

import { stylexProps } from "@registry/lib/stylex"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
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
    backgroundColor: tokens.muted,
    backgroundImage: {
      default:
        "linear-gradient(120deg, transparent 40%, color-mix(in oklab, #fff 64%, transparent), transparent 60%)",
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        "linear-gradient(120deg, transparent 40%, color-mix(in oklab, #fff 4%, transparent), transparent 60%)",
    },
    backgroundPosition: "0 0",
    backgroundSize: "200% 100%",
    borderRadius: tokens.radiusSmall,
  },
})

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...stylexProps(className, styles.root)}
      data-slot="skeleton"
      {...props}
    />
  )
}
