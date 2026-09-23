import type { StyleComponentProps, StyleProps } from "@registry/lib/style-props"
import type { ComponentProps } from "react"

import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"

export type LinkProps = StyleComponentProps<ComponentProps<"a">>

export function Link({
  xstyle: consumerXstyle,
  className,
  children,
  ...restProps
}: LinkProps) {
  const props: Omit<typeof restProps, keyof StyleProps> = restProps
  const xstyle = consumerXstyle

  return (
    <a
      data-slot="link"
      {...mergeStyleProps(stylexProps(className, xstyle), props)}
    >
      {children}
    </a>
  )
}
