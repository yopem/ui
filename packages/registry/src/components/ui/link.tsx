import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentProps } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"

export type LinkProps = StyleXComponentProps<ComponentProps<"a">>

export function Link({
  xstyle: consumerXstyle,
  className,
  children,
  ...restProps
}: LinkProps) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <a
      data-slot="link"
      {...mergeStylexProps(stylexProps(className, xstyle), props)}
    >
      {children}
    </a>
  )
}
