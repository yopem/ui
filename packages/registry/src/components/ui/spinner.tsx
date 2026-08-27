// oxlint-disable jsx-a11y/prefer-tag-over-role -- status belongs on the loading icon; output would change its rendered element
import type React from "react"

import { stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"
import { Loader2Icon } from "lucide-react"

const spin = stylex.keyframes({
  to: { transform: "rotate(360deg)" },
})

const styles = stylex.create({
  root: {
    animationDuration: "1s",
    animationIterationCount: "infinite",
    animationName: spin,
    animationTimingFunction: "linear",
  },
})

export function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof Loader2Icon>) {
  return (
    <Loader2Icon
      {...stylexProps(className, styles.root)}
      aria-label="Loading"
      data-slot="spinner"
      role="status"
      {...props}
    />
  )
}
