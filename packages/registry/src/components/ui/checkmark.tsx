import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentPropsWithRef } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import * as stylex from "@stylexjs/stylex"
import { CheckIcon } from "lucide-react"

const styles = stylex.create({
  root: {
    blockSize: "1em",
    flexShrink: 0,
    inlineSize: "1em",
    strokeWidth: 2.5,
  },
})

export function Checkmark({
  xstyle: consumerXstyle,
  className,
  ...props
}: StyleXComponentProps<ComponentPropsWithRef<typeof CheckIcon>>) {
  return (
    <CheckIcon
      aria-hidden="true"
      data-slot="checkmark"
      {...mergeStylexProps(
        stylexProps(className, styles.root, consumerXstyle),
        props,
      )}
    />
  )
}
