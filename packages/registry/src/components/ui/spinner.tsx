// oxlint-disable jsx-a11y/prefer-tag-over-role -- status belongs on the loading icon; output would change its rendered element
import type { StyleXComponentProps } from "@registry/lib/stylex"
import type React from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
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
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<React.ComponentProps<typeof Loader2Icon>>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <Loader2Icon
      aria-label="Loading"
      data-slot="spinner"
      role="status"
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}
