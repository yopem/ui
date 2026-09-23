// oxlint-disable jsx-a11y/prefer-tag-over-role -- status belongs on the loading icon; output would change its rendered element
import type { StyleComponentProps, StyleProps } from "@registry/lib/style-props"
import type React from "react"

import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
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
}: StyleComponentProps<React.ComponentProps<typeof Loader2Icon>>) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <Loader2Icon
      aria-label="Loading"
      data-slot="spinner"
      role="status"
      {...mergeStyleProps(stylexProps(className, styles.root, xstyle), props)}
    />
  )
}
